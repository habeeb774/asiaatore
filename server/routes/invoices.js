import { Router } from 'express'
import prisma from '../db/client.js'
import { attachUser, requireAdmin } from '../middleware/auth.js'
import PDFDocument from 'pdfkit'

const router = Router()

function nextInvoiceNumber(date = new Date()) {
  const pad = (n, s=4) => String(n).padStart(s, '0')
  const y = date.getFullYear()
  const m = String(date.getMonth()+1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  // Note: For strict sequencing per day, we’d need a counter. Here we derive from count on the same day.
  return { prefix: `INV-${y}${m}${d}`, dateKey: `${y}-${m}-${d}` }
}

async function generateInvoiceNumber() {
  const { prefix, dateKey } = nextInvoiceNumber()
  const start = new Date(dateKey + 'T00:00:00.000Z')
  const end = new Date(dateKey + 'T23:59:59.999Z')
  const count = await prisma.invoice.count({ where: { createdAt: { gte: start, lte: end } } })
  return `${prefix}-${String(count+1).padStart(4,'0')}`
}

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

// Get invoice by id (owner or admin)
router.get('/:id', attachUser, async (req, res) => {
  try {
    const inv = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { Order: { include: { items: true } }, transactions: true } })
    if (!inv) return res.status(404).json({ ok:false, error:'NOT_FOUND' })
    if (req.user?.role !== 'admin' && inv.userId !== req.user?.id) return res.status(403).json({ ok:false, error:'FORBIDDEN' })
    res.json({ ok:true, invoice: inv })
  } catch (e) { res.status(500).json({ ok:false, error:'INVOICE_GET_FAILED', message: e.message }) }
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

// Download PDF
router.get('/:id/pdf', attachUser, async (req, res) => {
  try {
    const inv = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { Order: { include: { items: true, } }, User: true } })
    if (!inv) return res.status(404).json({ ok:false, error:'NOT_FOUND' })
    if (req.user?.role !== 'admin' && inv.userId !== req.user?.id) return res.status(403).json({ ok:false, error:'FORBIDDEN' })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${inv.invoiceNumber}.pdf"`)

    const fmt = String((req.query.format || req.query.paper || '') || '').toLowerCase()

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
      doc.text(`الضريبة: ${money(inv.tax)}`, { align: 'right' })
      doc.fontSize(12).text(`الإجمالي: ${money(inv.total)}`, { align: 'right' })
      if (inv.paymentMethod) doc.fontSize(10).text(`الدفع: ${inv.paymentMethod.toUpperCase()}`, { align: 'right' })

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
    doc.text(`الضريبة: ${inv.tax.toFixed(2)} ${inv.currency}`)
    doc.text(`الإجمالي: ${inv.total.toFixed(2)} ${inv.currency}`, { underline: true })
    doc.end()
  } catch (e) { res.status(500).json({ ok:false, error:'INVOICE_PDF_FAILED', message: e.message }) }
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

export default router
