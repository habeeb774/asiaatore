import { Router } from 'express';
import prisma from '../db/client.js';
import { requireAdmin } from '../middleware/auth.js';
import { stringify } from 'csv-stringify/sync';
import ExcelJS from 'exceljs';

const router = Router();

// GET /api/admin/stats/overview
// Returns: todayOrders, todayRevenue, avgOrderValueToday, pendingBankCount
router.get('/overview', requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const ordersToday = await prisma.order.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { id: true, grandTotal: true }
    });
    const todayOrders = ordersToday.length;
    const todayRevenue = ordersToday.reduce((a,o) => a + (o.grandTotal||0), 0);
    const avgOrderValueToday = todayOrders ? (todayRevenue / todayOrders) : 0;
    const pendingBankCount = await prisma.order.count({ where: { status: 'pending_bank_review', paymentMethod: 'bank' } });
    res.json({ ok: true, stats: { todayOrders, todayRevenue, avgOrderValueToday, pendingBankCount } });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'FAILED_STATS', message: e.message });
  }
});

// Export orders CSV with filters (status, paymentMethod, from, to)
router.get('/orders/export/csv', requireAdmin, async (req, res) => {
  try {
    const { status, paymentMethod, from, to, userId } = req.query;
    const where = {};
    if (status) where.status = String(status);
    if (paymentMethod) where.paymentMethod = String(paymentMethod);
    if (userId) where.userId = String(userId);
    if (from || to) {
      const range = {};
      if (from) { const d = new Date(from); if (!isNaN(d)) range.gte = d; }
      if (to) { const d = new Date(to); if (!isNaN(d)) { if (to.match(/^\d{4}-\d{2}-\d{2}$/)) d.setHours(23,59,59,999); range.lte = d; } }
      if (Object.keys(range).length) where.createdAt = range;
    }
    const list = await prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, include: { items: true } });
    const records = list.map(o => ({
      id: o.id,
      userId: o.userId,
      status: o.status,
      paymentMethod: o.paymentMethod,
      currency: o.currency,
      grandTotal: o.grandTotal,
      items: o.items.length,
      createdAt: o.createdAt.toISOString()
    }));
    const csv = stringify(records, { header: true });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders_export.csv"');
    res.send(csv);
  } catch (e) {
    res.status(500).json({ ok: false, error: 'EXPORT_FAILED', message: e.message });
  }
});

// Export orders Excel (XLSX)
router.get('/orders/export/xlsx', requireAdmin, async (req, res) => {
  try {
    const { status, paymentMethod, from, to, userId } = req.query;
    const where = {};
    if (status) where.status = String(status);
    if (paymentMethod) where.paymentMethod = String(paymentMethod);
    if (userId) where.userId = String(userId);
    if (from || to) {
      const range = {};
      if (from) { const d = new Date(from); if (!isNaN(d)) range.gte = d; }
      if (to) { const d = new Date(to); if (!isNaN(d)) { if (to.match(/^\d{4}-\d{2}-\d{2}$/)) d.setHours(23,59,59,999); range.lte = d; } }
      if (Object.keys(range).length) where.createdAt = range;
    }
    const list = await prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, include: { items: true } });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Orders');
    ws.columns = [
      { header: 'ID', key: 'id', width: 36 },
      { header: 'User', key: 'userId', width: 18 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Method', key: 'paymentMethod', width: 12 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'GrandTotal', key: 'grandTotal', width: 14 },
      { header: 'Items', key: 'items', width: 8 },
      { header: 'CreatedAt', key: 'createdAt', width: 24 }
    ];
    list.forEach(o => ws.addRow({ id: o.id, userId: o.userId, status: o.status, paymentMethod: o.paymentMethod, currency: o.currency, grandTotal: o.grandTotal, items: o.items.length, createdAt: o.createdAt.toISOString() }));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="orders_export.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    res.status(500).json({ ok: false, error: 'EXPORT_FAILED', message: e.message });
  }
});

export default router;
