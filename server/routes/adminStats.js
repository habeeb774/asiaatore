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

// GET /api/admin/stats/financials
// Query: days=30 (default), from, to (ISO dates), tz offset not supported (uses server timezone)
// Returns daily series: date (YYYY-MM-DD), orders, revenue, aov, activeCustomersDaily
// And aggregates: totalRevenue, totalOrders, overallAov, activeCustomersWindow
router.get('/financials', requireAdmin, async (req, res) => {
  try {
    const maxDays = 365;
    const days = Math.min(maxDays, Math.max(1, parseInt(req.query.days || '30', 10)));
    const now = new Date();
    // Date range: [start, end)
    const end = req.query.to ? new Date(req.query.to) : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const start = req.query.from ? new Date(req.query.from) : new Date(end); start.setDate(start.getDate() - days);

    // Fetch orders for the window
    const list = await prisma.order.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { id: true, userId: true, createdAt: true, grandTotal: true }
    });

    // Build day buckets
    const dayKey = (d) => {
      const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return dd.toISOString().slice(0, 10);
    };
    // Initialize series over the period to ensure continuous dates
    const seriesMap = new Map();
    for (let i = 0; i < days; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      const key = dayKey(d);
      seriesMap.set(key, { date: key, orders: 0, revenue: 0, aov: 0, activeCustomersDaily: 0, _users: new Set() });
    }

    // Aggregate
    for (const o of list) {
      const key = dayKey(o.createdAt);
      let bucket = seriesMap.get(key);
      if (!bucket) {
        bucket = { date: key, orders: 0, revenue: 0, aov: 0, activeCustomersDaily: 0, _users: new Set() };
        seriesMap.set(key, bucket);
      }
      bucket.orders += 1;
      bucket.revenue += Number(o.grandTotal || 0);
      if (o.userId) bucket._users.add(String(o.userId));
    }
    // Finalize buckets and totals
    let totalRevenue = 0, totalOrders = 0;
    const windowUsers = new Set();
    const daily = Array.from(seriesMap.values()).map(b => {
      b.activeCustomersDaily = b._users.size;
      b.aov = b.orders ? (b.revenue / b.orders) : 0;
      totalRevenue += b.revenue;
      totalOrders += b.orders;
      b._users.forEach(u => windowUsers.add(u));
      delete b._users;
      return b;
    });
    const overallAov = totalOrders ? (totalRevenue / totalOrders) : 0;
    const activeCustomersWindow = windowUsers.size;

    res.json({ ok: true, range: { from: start.toISOString(), to: end.toISOString(), days }, totals: { totalRevenue, totalOrders, overallAov, activeCustomersWindow }, daily });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'FAILED_FINANCIALS', message: e.message });
  }
});

// Export financials CSV
router.get('/financials/export/csv', requireAdmin, async (req, res) => {
  try {
    const maxDays = 365;
    const days = Math.min(maxDays, Math.max(1, parseInt(req.query.days || '30', 10)));
    const url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    // Reuse the in-process handler logic by calling Prisma directly again to avoid duplicating too much
    const now = new Date();
    const end = req.query.to ? new Date(req.query.to) : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const start = req.query.from ? new Date(req.query.from) : new Date(end); start.setDate(start.getDate() - days);
    const list = await prisma.order.findMany({ where: { createdAt: { gte: start, lt: end } }, select: { id: true, userId: true, createdAt: true, grandTotal: true } });
    const dayKey = (d) => { const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return dd.toISOString().slice(0,10); };
    const seriesMap = new Map();
    for (let i = 0; i < days; i++) { const d = new Date(start); d.setDate(d.getDate() + i); const key = dayKey(d); seriesMap.set(key, { date: key, orders: 0, revenue: 0, _users: new Set() }); }
    for (const o of list) { const key = dayKey(o.createdAt); const b = seriesMap.get(key) || { date: key, orders: 0, revenue: 0, _users: new Set() }; b.orders++; b.revenue += Number(o.grandTotal||0); if (o.userId) b._users.add(String(o.userId)); seriesMap.set(key, b); }
    const rows = Array.from(seriesMap.values()).map(b => ({ date: b.date, orders: b.orders, revenue: b.revenue, aov: b.orders ? b.revenue/b.orders : 0, activeCustomersDaily: b._users.size }));
    const csv = stringify(rows, { header: true });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="financials_${days}d.csv"`);
    res.send(csv);
  } catch (e) {
    res.status(500).json({ ok: false, error: 'EXPORT_FINANCIALS_FAILED', message: e.message });
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
