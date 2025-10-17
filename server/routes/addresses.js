import { Router } from 'express';
import prisma from '../db/client.js';
import { whereWithDeletedAt } from '../utils/deletedAt.js';
import { attachUser } from '../middleware/auth.js';

const router = Router();

router.use(attachUser);

// List current user's addresses
router.get('/', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    const list = await prisma.address.findMany({ where: whereWithDeletedAt({ userId: req.user.id }), orderBy: { createdAt: 'desc' } });
    res.json({ ok: true, addresses: list });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'ADDR_LIST_FAILED', message: e.message });
  }
});

// Create a new address
router.post('/', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    const body = req.body || {};
    const data = {
      userId: req.user.id,
      label: body.label || null,
      name: body.name || null,
      phone: body.phone || null,
      country: body.country || 'SA',
      city: body.city || null,
      district: body.district || null,
      street: body.street || null,
      building: body.building || null,
      apartment: body.apartment || null,
      notes: body.notes || null,
      isDefault: !!body.isDefault,
    };
    if (data.isDefault) {
      // Some runtime Prisma clients may not expose the `address` delegate (schema/generation mismatch).
      // Guard and fall back to a raw SQL update if needed to avoid crashing the request.
      if (prisma.address && typeof prisma.address.updateMany === 'function') {
        await prisma.address.updateMany({ where: whereWithDeletedAt({ userId: req.user.id }), data: { isDefault: false } });
      } else {
        // Fallback: use raw SQL to clear defaults for this user. Use parameterized query to avoid injection.
        try {
          await prisma.$executeRaw`UPDATE \`Address\` SET isDefault = false WHERE userId = ${req.user.id}`;
        } catch (er) {
          // If raw SQL fails, rethrow original error to be handled below
          throw er;
        }
      }
    }
    const created = await prisma.address.create({ data });
    res.status(201).json({ ok: true, address: created });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'ADDR_CREATE_FAILED', message: e.message });
  }
});

// Update an existing address (must belong to user)
router.patch('/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    const id = req.params.id;
    const existing = await prisma.address.findFirst({ where: whereWithDeletedAt({ id, userId: req.user.id }) });
    if (!existing) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const body = req.body || {};
    const data = {
      label: body.label,
      name: body.name,
      phone: body.phone,
      country: body.country,
      city: body.city,
      district: body.district,
      street: body.street,
      building: body.building,
      apartment: body.apartment,
      notes: body.notes,
      isDefault: typeof body.isDefault === 'boolean' ? body.isDefault : undefined
    };
    if (data.isDefault === true) {
      if (prisma.address && typeof prisma.address.updateMany === 'function') {
        await prisma.address.updateMany({ where: whereWithDeletedAt({ userId: req.user.id }), data: { isDefault: false } });
      } else {
        await prisma.$executeRaw`UPDATE \`Address\` SET isDefault = false WHERE userId = ${req.user.id}`;
      }
    }
    const updated = await prisma.address.update({ where: { id }, data });
    res.json({ ok: true, address: updated });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'ADDR_UPDATE_FAILED', message: e.message });
  }
});

// Delete an address
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    const id = req.params.id;
    const existing = await prisma.address.findFirst({ where: whereWithDeletedAt({ id, userId: req.user.id }) });
    if (!existing) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    await prisma.address.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'ADDR_DELETE_FAILED', message: e.message });
  }
});

export default router;
