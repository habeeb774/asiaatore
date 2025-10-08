import express from 'express';
import prisma from '../db/client.js';
import { attachUser, requireRole } from '../middleware/auth.js';
import audit from '../utils/audit.js';

const router = express.Router();

// Require seller role for all routes in this file
router.use(attachUser, requireRole('seller'));

// Get all products for the current seller
router.get('/products', async (req, res) => {
  const products = await prisma.product.findMany({
    where: { sellerId: req.user.seller?.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json(products);
});

// Upload (create) a new product for the seller
router.post('/products', async (req, res) => {
  const { name, price, ...rest } = req.body;
  const product = await prisma.product.create({
    data: {
      name,
      price,
      sellerId: req.user.seller.id,
      ...rest,
    },
  });
  audit({ action: 'create_product', entity: 'Product', entityId: product.id, userId: req.user.id });
  res.json(product);
});

// Get all orders for the current seller
router.get('/orders', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { sellerId: req.user.seller.id },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders);
});

export default router;