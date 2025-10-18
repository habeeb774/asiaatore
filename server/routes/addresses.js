import { Router } from 'express';
import prisma from '../db/client.js';
import { whereWithDeletedAt } from '../utils/deletedAt.js';
import { attachUser } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

router.use(attachUser);

// List current user's addresses
router.get('/', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    let list = [];
    if (prisma.address?.findMany) {
      list = await prisma.address.findMany({ where: whereWithDeletedAt({ userId: req.user.id }), orderBy: { createdAt: 'desc' } });
    } else {
      // Fallback raw SQL
  list = await prisma.$queryRaw`SELECT id, userId, label, name, phone, country, city, district, street, building, apartment, notes, isDefault, createdAt, updatedAt FROM \`Address\` WHERE userId = ${req.user.id} ORDER BY createdAt DESC`;
    }
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
    if (prisma.address?.create) {
      const created = await prisma.address.create({ data });
      res.status(201).json({ ok: true, address: created });
    } else {
      // Fallback raw insert
      const id = crypto.randomUUID();
      // Insert with explicit timestamps to satisfy NOT NULL constraints in strict SQL modes
      await prisma.$executeRaw`
        INSERT INTO \`Address\`
        (id, userId, label, name, phone, country, city, district, street, building, apartment, notes, isDefault, createdAt, updatedAt)
        VALUES (${id}, ${data.userId}, ${data.label}, ${data.name}, ${data.phone}, ${data.country}, ${data.city}, ${data.district}, ${data.street}, ${data.building}, ${data.apartment}, ${data.notes}, ${data.isDefault}, NOW(), NOW())
      `;
      const row = (await prisma.$queryRaw`SELECT id, userId, label, name, phone, country, city, district, street, building, apartment, notes, isDefault, createdAt, updatedAt FROM \`Address\` WHERE id = ${id} LIMIT 1`)[0] || null;
      res.status(201).json({ ok: true, address: row });
    }
  } catch (e) {
    res.status(400).json({ ok: false, error: 'ADDR_CREATE_FAILED', message: e.message });
  }
});

// Update an existing address (must belong to user)
router.patch('/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    const id = req.params.id;
    let existing = null;
    if (prisma.address?.findFirst) {
      existing = await prisma.address.findFirst({ where: whereWithDeletedAt({ id, userId: req.user.id }) });
    } else {
      existing = (await prisma.$queryRaw`SELECT id FROM \`Address\` WHERE id = ${id} AND userId = ${req.user.id} LIMIT 1`)[0] || null;
    }
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
    if (prisma.address?.update) {
      const updated = await prisma.address.update({ where: { id }, data });
      res.json({ ok: true, address: updated });
    } else {
      await prisma.$executeRaw`
        UPDATE \`Address\`
        SET label=${data.label}, name=${data.name}, phone=${data.phone}, country=${data.country}, city=${data.city}, district=${data.district}, street=${data.street}, building=${data.building}, apartment=${data.apartment}, notes=${data.notes}, isDefault=${data.isDefault}, updatedAt=NOW()
        WHERE id=${id} AND userId=${req.user.id}
      `;
      const row = (await prisma.$queryRaw`SELECT id, userId, label, name, phone, country, city, district, street, building, apartment, notes, isDefault, createdAt, updatedAt FROM \`Address\` WHERE id = ${id} LIMIT 1`)[0] || null;
      res.json({ ok: true, address: row });
    }
  } catch (e) {
    res.status(400).json({ ok: false, error: 'ADDR_UPDATE_FAILED', message: e.message });
  }
});

// Delete an address
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    const id = req.params.id;
    let existing = null;
    if (prisma.address?.findFirst) {
      existing = await prisma.address.findFirst({ where: whereWithDeletedAt({ id, userId: req.user.id }) });
    } else {
      existing = (await prisma.$queryRaw`SELECT id FROM \`Address\` WHERE id = ${id} AND userId = ${req.user.id} LIMIT 1`)[0] || null;
    }
    if (!existing) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (prisma.address?.delete) {
      await prisma.address.delete({ where: { id } });
      res.json({ ok: true });
    } else {
      await prisma.$executeRaw`DELETE FROM \`Address\` WHERE id = ${id} AND userId = ${req.user.id}`;
      res.json({ ok: true });
    }
  } catch (e) {
    res.status(400).json({ ok: false, error: 'ADDR_DELETE_FAILED', message: e.message });
  }
});

export default router;
