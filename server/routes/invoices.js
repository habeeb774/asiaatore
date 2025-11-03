import { Router } from 'express'
import prisma from '../db/client.js'
import { attachUser, requireAdmin } from '../middleware/auth.js'
import PDFDocument from 'pdfkit'
import { generateInvoiceQrPng } from '../utils/qr.js'
import { signToken } from '../utils/jwt.js'
import { generateInvoiceNumber } from '../utils/invoice.js'
import { sendInvoiceWhatsApp, getWhatsAppHealth } from '../services/whatsapp.js'

const router = Router()

// Number generation is centralized in utils/invoice.js ("MAC" + 10-digit global sequence)

// Create an invoice from an order
router.post('/', attachUser, async (req, res) => {
  try {
    const { orderId } = req.body || {}
    if (!orderId) return res.status(400).json({ ok:false, error:'MISSING_ORDER_ID' })
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return res.status(404).json({ ok:false, error:'ORDER_NOT_FOUND' })
    if (req.user?.role !== 'admin' && order.userId !== req.user?.id) return res.status(403).json({ ok:false, error:'FORBIDDEN' })
    const number = await generateInvoiceNumber()
    const inv = await prisma.invoice.create({ data: {
      orderId: order.id,
      userId: order.userId,
      invoiceNumber: number,
      status: 'pending',
      currency: 'SAR',
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.grandTotal,
      paymentMethod: order.paymentMethod || null,
      meta: order.paymentMeta || null
    }})
    await prisma.invoiceLog.create({ data: { invoiceId: inv.id, userId: req.user?.id || null, action: 'invoice.created', meta: { orderId } } })
    res.status(201).json({ ok:true, invoice: inv })
  } catch (e) { res.status(500).json({ ok:false, error:'INVOICE_CREATE_FAILED', message: e.message }) }
})

// Get invoice by orderId (owner or admin)
router.get('/by-order/:orderId', attachUser, async (req, res) => {
  try {
    const { orderId } = req.params
    if (!orderId) return res.status(400).json({ ok:false, error:'MISSING_ORDER_ID' })
    const inv = await prisma.invoice.findFirst({ where: { orderId }, orderBy: { createdAt: 'desc' } })
    if (!inv) return res.status(404).json({ ok:false, error:'NOT_FOUND' })
    if (req.user?.role !== 'admin' && inv.userId !== req.user?.id) return res.status(403).json({ ok:false, error:'FORBIDDEN' })
    res.json({ ok:true, invoice: inv })
  } catch (e) { res.status(500).json({ ok:false, error:'INVOICE_GET_BY_ORDER_FAILED', message: e.message }) }
})

// List invoices (admin, optional user filter)
router.get('/', attachUser, requireAdmin, async (req, res) => {
  try {
    const { userId, status } = req.query
    const where = {}
    if (userId) where.userId = String(userId)
    if (status) where.status = String(status)
    const list = await prisma.invoice.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 })
    res.json({ ok:true, invoices: list })
  } catch (e) { res.status(500).json({ ok:false, error:'INVOICE_LIST_FAILED', message: e.message }) }
})

// Admin diagnostics: WhatsApp configuration health (place BEFORE param routes)
router.get('/_whatsapp', attachUser, requireAdmin, (req, res) => {
  try {
    const health = getWhatsAppHealth();
    res.json({ ok: true, health });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'WHATSAPP_HEALTH_FAILED', message: e.message });
  }
});

// Download PDF (place BEFORE '/:id')
router.get('/:id/pdf', attachUser, async (req, res) => {
  try {
    const inv = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { order: { include: { items: true } }, user: true } })
    if (!inv) return res.status(404).json({ ok:false, error:'NOT_FOUND' })
    if (req.user?.role !== 'admin' && inv.userId !== req.user?.id) return res.status(403).json({ ok:false, error:'FORBIDDEN' })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${inv.invoiceNumber}.pdf"`)

    const fmt = String((req.query.format || req.query.paper || '') || '').toLowerCase()

    // Calculate VAT percent label (prefer deriving from order subtotal/discount when possible)
    const orderSubtotal = inv.Order?.subtotal ?? inv.subtotal ?? 0
    const orderDiscount = inv.Order?.discount ?? 0
    const vatBase = Math.max(0, Number(orderSubtotal) - Number(orderDiscount))
    const vatRate = vatBase > 0 ? (Number(inv.tax || 0) / vatBase) : 0.15
    const vatPctLabel = `${(vatRate * 100).toFixed(0)}%`

    // Fetch store tax number for display if available
    let taxNumber = null
    try {
      const setting = await prisma.storeSetting.findUnique({ where: { id: 'singleton' } })
      taxNumber = setting?.taxNumber || process.env.SELLER_VAT_NUMBER || null
    } catch {}

    // Helper: mm to PDF points
    const mmToPt = (mm) => Math.round((mm * 72) / 25.4)

    if (fmt === 'thermal80' || fmt === '80mm' || fmt === 'receipt' || fmt === 'pos') {
      // Thermal receipt 80mm width, dynamic height
      const width = mmToPt(80) // ~227pt
      const items = inv.Order?.items || []
      const base = 220 // header + meta
      const perItem = 22 // estimated line height
      const totals = 120
      const height = Math.max(500, base + (items.length * perItem) + totals)

      const doc = new PDFDocument({ size: [width, height], margin: 10 })
      doc.pipe(res)

  // Header
  doc.fontSize(14).text('فاتورة', { align: 'center' })
      doc.moveDown(0.35)
      doc.fontSize(10)
      doc.text(`رقم: ${inv.invoiceNumber}`, { align: 'center' })
      doc.text(`التاريخ: ${new Date(inv.issueDate).toLocaleDateString()}`, { align: 'center' })
      if (inv.status) doc.text(`الحالة: ${inv.status}`, { align: 'center' })
  if (taxNumber) doc.text(`الرقم الضريبي: ${taxNumber}`, { align: 'center' })
      doc.moveDown(0.35)
      doc.moveTo(doc.page.margins.left, doc.y).lineTo(width - doc.page.margins.right, doc.y).stroke()

      // Customer
      doc.moveDown(0.35)
      if (inv.User?.email) doc.text(`العميل: ${inv.User.email}`, { align: 'right' })

      // Items table (compact)
      doc.moveDown(0.35)
      doc.fontSize(10).text('المنتجات:', { align: 'right' })
      doc.moveDown(0.25)
      const lineYStart = doc.y
      const nameWidth = width - 20 - 80 // leave room for qty x price and total
      const priceColX = width - 10 - 70
      const totalColX = width - 10

      const currency = inv.currency || 'SAR'

      items.forEach((it) => {
        const lineTotal = (it.price || 0) * (it.quantity || 0)
        const y = doc.y
        // Name (RTL simple; PDFKit lacks full shaping—kept minimal)
        doc.fontSize(9)
          .text(String(it.nameAr || it.nameEn || ''), 10, y, { width: nameWidth, align: 'right', continued: false })
        // Qty x price
        doc.fontSize(9)
          .text(`x${it.quantity} @ ${(it.price || 0).toFixed(2)}`, priceColX - 55, y, { width: 55, align: 'right' })
        // Line total
        doc.fontSize(9)
          .text(`${lineTotal.toFixed(2)}`, totalColX - 60, y, { width: 60, align: 'right' })
        doc.moveDown(0.2)
      })

      doc.moveDown(0.35)
      doc.moveTo(doc.page.margins.left, doc.y).lineTo(width - doc.page.margins.right, doc.y).stroke()
      doc.moveDown(0.25)

      // Totals (right-aligned)
      const money = (n) => `${Number(n || 0).toFixed(2)} ${currency}`
      doc.fontSize(10)
  doc.text(`المجموع: ${money(inv.subtotal)}`, { align: 'right' })
  doc.text(`الضريبة (${vatPctLabel}): ${money(inv.tax)}`, { align: 'right' })
      doc.fontSize(12).text(`الإجمالي: ${money(inv.total)}`, { align: 'right' })
      if (inv.paymentMethod) doc.fontSize(10).text(`الدفع: ${inv.paymentMethod.toUpperCase()}`, { align: 'right' })

      // QR code (official invoice verification)
      try {
        const baseUrl = req.protocol + '://' + req.get('host')
        // Generate a scoped access token so scanning QR can fetch the invoice in non-prod without a session.
        // Payload encodes the invoice owner id; attachUser restricts query-token usage to invoice endpoints only.
        const qrToken = signToken({ id: inv.userId, role: 'user' }, { expiresIn: process.env.INVOICE_QR_TOKEN_TTL || '30d' })
        const qrUrl = `${baseUrl}/api/invoices/${inv.id}?token=${encodeURIComponent(qrToken)}`
        const qrPng = await generateInvoiceQrPng(qrUrl)
        doc.image(qrPng, width/2-45, doc.y+10, { width: 90, height: 90 })
        doc.moveDown(5)
        doc.fontSize(8).text('تحقق من الفاتورة عبر رمز QR', { align: 'center' })
      } catch {}

      doc.end()
      return
    }

    // Default: A4 invoice
    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    doc.pipe(res)
  // Header
  doc.fontSize(18).text(`فاتورة / Invoice`, { align: 'right' })
    doc.moveDown(0.5)
    doc.fontSize(12).text(`رقم الفاتورة: ${inv.invoiceNumber}`)
    doc.text(`التاريخ: ${new Date(inv.issueDate).toLocaleDateString()}`)
    doc.text(`الحالة: ${inv.status}`)
    if (taxNumber) doc.text(`الرقم الضريبي: ${taxNumber}`)
    // Company address (if provided in settings)
    try {
      const setting = await prisma.storeSetting.findUnique({ where: { id: 'singleton' } })
      const address = setting ? (setting.addressAr || setting.addressEn) : null
      const cr = setting?.commercialRegNo
      if (address) doc.text(`العنوان: ${address}`)
      if (cr) doc.text(`السجل التجاري: ${cr}`)
    } catch {}
    doc.moveDown()
    // Bill to
    doc.text(`العميل: ${inv.User?.email || ''}`)
    doc.moveDown()
    // Items
    doc.fontSize(12).text('المنتجات:', { underline: true })
    doc.moveDown(0.5)
    const items = inv.Order?.items || []
    items.forEach(it => {
      doc.text(`${it.nameAr || it.nameEn}  x${it.quantity}  —  ${it.price.toFixed(2)}`)
    })
    doc.moveDown()
    // Totals
  doc.text(`الإجمالي قبل الضريبة: ${inv.subtotal.toFixed(2)} ${inv.currency}`)
  doc.text(`الضريبة (${vatPctLabel}): ${inv.tax.toFixed(2)} ${inv.currency}`)
    doc.text(`الإجمالي: ${inv.total.toFixed(2)} ${inv.currency}`, { underline: true })

    // QR code (official invoice verification)
    try {
      const baseUrl = req.protocol + '://' + req.get('host')
      const qrToken = signToken({ id: inv.userId, role: 'user' }, { expiresIn: process.env.INVOICE_QR_TOKEN_TTL || '30d' })
      const qrUrl = `${baseUrl}/api/invoices/${inv.id}?token=${encodeURIComponent(qrToken)}`
      const qrPng = await generateInvoiceQrPng(qrUrl)
      doc.image(qrPng, doc.page.width-160, doc.y, { width: 90, height: 90 })
      doc.moveDown(5)
      doc.fontSize(8).text('تحقق من الفاتورة عبر رمز QR', doc.page.width-160, doc.y, { align: 'left' })
    } catch {}

    doc.end()
  } catch (e) { res.status(500).json({ ok:false, error:'INVOICE_PDF_FAILED', message: e.message }) }
})

// Get invoice by id (owner or admin) — placed AFTER specific routes
router.get('/:id', attachUser, async (req, res) => {
  try {
    const inv = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { order: { include: { items: true } }, logs: true } })
    if (!inv) return res.status(404).json({ ok:false, error:'NOT_FOUND' })
    if (req.user?.role !== 'admin' && inv.userId !== req.user?.id) return res.status(403).json({ ok:false, error:'FORBIDDEN' })
    res.json({ ok:true, invoice: inv })
  } catch (e) { res.status(500).json({ ok:false, error:'INVOICE_GET_FAILED', message: e.message }) }
})

// Update payment status (admin)
router.post('/:id/status', attachUser, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body || {}
    if (!status) return res.status(400).json({ ok:false, error:'MISSING_STATUS' })
    const inv = await prisma.invoice.update({ where: { id: req.params.id }, data: { status } })
    await prisma.invoiceLog.create({ data: { invoiceId: inv.id, userId: req.user?.id || null, action: 'invoice.status', meta: { status } } })
    res.json({ ok:true, invoice: inv })
  } catch (e) { res.status(500).json({ ok:false, error:'INVOICE_STATUS_FAILED', message: e.message }) }
})

// Admin action: send or re-send invoice WhatsApp by orderId
router.post('/by-order/:orderId/whatsapp', attachUser, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await sendInvoiceWhatsApp(orderId);
    return res.json({ ok: result.ok !== false, result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'WHATSAPP_SEND_FAILED', message: e.message });
  }
});

export default router
