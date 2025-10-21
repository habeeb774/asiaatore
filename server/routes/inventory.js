import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';
import InventoryService from '../services/inventoryService.js';

const router = Router();

// GET /api/inventory?page=&pageSize=
router.get('/', async (req, res) => {
  try {
    const { page, pageSize } = req.query || {};
    const data = await InventoryService.getInventory({ page, pageSize });
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'FAILED_LIST', message: e.message });
  }
});

// GET /api/inventory/low-stock
router.get('/low-stock', async (_req, res) => {
  try {
    const rows = await InventoryService.listLowStock();
    res.json({ ok: true, items: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'FAILED_LOW_STOCK', message: e.message });
  }
});

// GET /api/inventory/:productId
router.get('/:productId', async (req, res) => {
  try {
    const data = await InventoryService.getByProduct(req.params.productId);
    if (!data) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'FAILED_GET', message: e.message });
  }
});

// POST /api/inventory/:productId/update
const updateSchema = z.object({
  quantity: z.coerce.number().int(),
  adjustment_type: z.enum(['set','increment','decrement']).default('set'),
  reason: z.string().trim().optional(),
  warehouse_id: z.string().trim().nullable().optional(),
});
router.post('/:productId/update', requireAdmin, async (req, res) => {
  try {
    const parsed = updateSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'INVALID_INPUT', fields: parsed.error.flatten() });
    const body = parsed.data;
    const updated = await InventoryService.updateStock(req.params.productId, body.quantity, body.adjustment_type, { warehouseId: body.warehouse_id || null, reason: body.reason, userId: req.user?.id });
    await audit({ action: 'inventory.adjust', entity: 'Product', entityId: req.params.productId, userId: req.user?.id, meta: { quantity: body.quantity, action: body.adjustment_type } });
    res.json({ ok: true, inventory: updated });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'FAILED_UPDATE', message: e.message });
  }
});

// POST /api/inventory/reserve
const reserveSchema = z.object({
  order_id: z.string(),
  items: z.array(z.object({ product_id: z.string(), quantity: z.coerce.number().int().positive() })).min(1),
  warehouse_id: z.string().trim().nullable().optional(),
});
router.post('/reserve', async (req, res) => {
  try {
    const parsed = reserveSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'INVALID_INPUT', fields: parsed.error.flatten() });
    const body = parsed.data;
    const result = await InventoryService.reserveStock(body.order_id, body.items, { warehouseId: body.warehouse_id || null, userId: req.user?.id });
    res.json({ ok: true, ...result });
  } catch (e) {
    const status = e?.code === 'INSUFFICIENT_STOCK' ? 409 : 400;
    res.status(status).json({ ok: false, error: e?.code || 'FAILED_RESERVE', message: e.message });
  }
});

// POST /api/inventory/release
const releaseSchema = z.object({ order_id: z.string() });
router.post('/release', async (req, res) => {
  try {
    const parsed = releaseSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'INVALID_INPUT', fields: parsed.error.flatten() });
    const body = parsed.data;
    const result = await InventoryService.releaseReserved(body.order_id, { userId: req.user?.id });
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'FAILED_RELEASE', message: e.message });
  }
});

export default router;
