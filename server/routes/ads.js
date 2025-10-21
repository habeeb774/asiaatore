import express from 'express';
import prisma from '../db/client.js';

const router = express.Router();

// GET /api/ads - List all ads

// GET /api/ads - List all ads
router.get('/', async (req, res) => {
  try {
    const ads = await prisma.ad.findMany();
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ads', details: err.message });
  }
});

// POST /api/ads - Create new ad
router.post('/', async (req, res) => {
  try {
    const ad = await prisma.ad.create({ data: req.body });
    res.status(201).json(ad);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create ad', details: err.message });
  }
});

// PATCH /api/ads/:id - Update ad
router.patch('/:id', async (req, res) => {
  try {
    // Map incoming fields to Ad model
    const data = {
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
      link: req.body.link,
      active: req.body.active
    };
    const ad = await prisma.ad.update({
      where: { id: Number(req.params.id) },
      data
    });
    res.json(ad);
  } catch (err) {
    console.error('PATCH /api/ads/:id error:', err);
    if (err.code === 'P2025') {
      // Prisma: Record to update not found
      return res.status(404).json({ error: 'NOT_FOUND', details: 'Ad not found' });
    }
    res.status(500).json({ error: 'Failed to update ad', details: err.message });
  }
});

// DELETE /api/ads/:id - Delete ad
router.delete('/:id', async (req, res) => {
  try {
    await prisma.ad.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete ad', details: err.message });
  }
});

export default router;
