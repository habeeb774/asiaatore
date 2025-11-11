import { Router } from 'express';
import prisma from '../db/client.js';
import { requireAdmin } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';

const router = Router();

const mapTier = t => ({ id:t.id, productId:t.productId, minQty:t.minQty, price:t.price, packagingType:t.packagingType, note:{ ar:t.noteAr, en:t.noteEn } });

router.get('/products/:productId/tier-prices', async (req,res) => {
  try {
    const list = await prisma.productTierPrice.findMany({ where:{ productId:req.params.productId }, orderBy:{ minQty:'asc' } });
    res.json(list.map(mapTier));
  } catch(e){ res.status(500).json({ error:'FAILED_LIST_TIERS', message:e.message }); }
});

router.post('/products/:productId/tier-prices', requireAdmin, async (req,res) => {
  try {
    const b=req.body||{};
    if (!Number.isFinite(+b.minQty) || +b.minQty < 1) return res.status(400).json({ error:'INVALID_MIN_QTY' });
    if (!Number.isFinite(+b.price) || +b.price < 0) return res.status(400).json({ error:'INVALID_PRICE' });
    const created = await prisma.productTierPrice.create({ data:{ productId:req.params.productId, minQty:+b.minQty, price:+b.price, packagingType:b.packagingType||'unit', noteAr:b.noteAr||b.note?.ar||null, noteEn:b.noteEn||b.note?.en||null } });
    audit({ action:'tier.create', entity:'ProductTierPrice', entityId: created.id, userId: req.user?.id, meta:{ productId: created.productId } });
    res.status(201).json(mapTier(created));
  } catch(e){ if (e.code==='P2002') return res.status(409).json({ error:'DUPLICATE_TIER' }); res.status(400).json({ error:'FAILED_CREATE_TIER', message:e.message }); }
});

router.patch('/tier-prices/:id', requireAdmin, async (req,res) => {
  try {
    const b=req.body||{}; const data={};
    if (b.minQty != null) { if (!Number.isFinite(+b.minQty) || +b.minQty < 1) return res.status(400).json({ error:'INVALID_MIN_QTY' }); data.minQty=+b.minQty; }
    if (b.price != null) { if (!Number.isFinite(+b.price) || +b.price < 0) return res.status(400).json({ error:'INVALID_PRICE' }); data.price=+b.price; }
    if (b.packagingType) data.packagingType = b.packagingType;
    if (b.noteAr !== undefined || b.note?.ar !== undefined) data.noteAr = b.noteAr || b.note?.ar || null;
    if (b.noteEn !== undefined || b.note?.en !== undefined) data.noteEn = b.noteEn || b.note?.en || null;
    const updated = await prisma.productTierPrice.update({ where:{ id:req.params.id }, data });
    audit({ action:'tier.update', entity:'ProductTierPrice', entityId: updated.id, userId: req.user?.id });
    res.json(mapTier(updated));
  } catch(e){ if (e.code==='P2025') return res.status(404).json({ error:'NOT_FOUND' }); if (e.code==='P2002') return res.status(409).json({ error:'DUPLICATE_TIER' }); res.status(400).json({ error:'FAILED_UPDATE_TIER', message:e.message }); }
});

router.delete('/tier-prices/:id', requireAdmin, async (req,res) => {
  try { const removed = await prisma.productTierPrice.delete({ where:{ id:req.params.id } }); audit({ action:'tier.delete', entity:'ProductTierPrice', entityId: removed.id, userId: req.user?.id, meta:{ productId: removed.productId } }); res.json({ ok:true, removed: mapTier(removed) }); } catch(e){ if (e.code==='P2025') return res.status(404).json({ error:'NOT_FOUND' }); res.status(400).json({ error:'FAILED_DELETE_TIER', message:e.message }); }
});

export default router;
