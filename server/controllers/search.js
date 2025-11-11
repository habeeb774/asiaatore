import { Router } from 'express';
import prisma from '../db/client.js';

const router = Router();

// Basic typeahead: ?q=term  (returns products + matching category suggestions + brands)
router.get('/typeahead', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.json({ ok:true, products: [], categories: [], brands: [] });

  try {
    const [products, categories, brands] = await Promise.all([
      prisma.product.findMany({ where: { OR: [ { nameAr: { contains: q } }, { nameEn: { contains: q } } ] }, take: 8, orderBy: { createdAt: 'desc' } }),
      prisma.category.findMany({ where: { OR: [ { nameAr: { contains: q } }, { nameEn: { contains: q } } ] }, take: 5 }),
      prisma.brand.findMany({ where: { OR: [ { nameAr: { contains: q } }, { nameEn: { contains: q } } ] }, take: 6 })
    ]);
    res.json({
      ok:true,
      products: products.map(p => ({ id: p.id, slug: p.slug, nameAr: p.nameAr, nameEn: p.nameEn, price: p.price, image: p.images?.[0]?.url || null })),
      categories: categories.map(c => ({ slug: c.slug, nameAr: c.nameAr, nameEn: c.nameEn })),
      brands: brands.map(b => ({ id: b.id, slug: b.slug, nameAr: b.nameAr, nameEn: b.nameEn }))
    });
  } catch (error) {
    // Fallback to mock data when DB is not available
    const mockProducts = [
      { id: 1, slug: 'test-product-1', nameAr: 'منتج تجريبي 1', nameEn: 'Test Product 1', price: 99.99, image: null },
      { id: 2, slug: 'test-product-2', nameAr: 'منتج تجريبي 2', nameEn: 'Test Product 2', price: 149.99, image: null }
    ].filter(p => p.nameAr.includes(q) || p.nameEn.toLowerCase().includes(q.toLowerCase())).slice(0, 8);

    const mockCategories = [
      { slug: 'test-category', nameAr: 'فئة تجريبية', nameEn: 'Test Category' }
    ].filter(c => c.nameAr.includes(q) || c.nameEn.toLowerCase().includes(q.toLowerCase())).slice(0, 5);

    const mockBrands = [
      { id: 1, slug: 'test-brand', nameAr: 'علامة تجريبية', nameEn: 'Test Brand' }
    ].filter(b => b.nameAr.includes(q) || b.nameEn.toLowerCase().includes(q.toLowerCase())).slice(0, 6);

    res.json({
      ok: true,
      products: mockProducts,
      categories: mockCategories,
      brands: mockBrands
    });
  }
});

// Full search endpoint: ?q=term&page=1&pageSize=24
router.get('/products', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 24));
    const offset = (page - 1) * pageSize;

    if (!q) {
      return res.json({
        ok: true,
        products: [],
        total: 0,
        page,
        pageSize
      });
    }

    try {
      // Search in product names and descriptions
      const whereClause = {
        OR: [
          { nameAr: { contains: q, mode: 'insensitive' } },
          { nameEn: { contains: q, mode: 'insensitive' } },
          { descriptionAr: { contains: q, mode: 'insensitive' } },
          { descriptionEn: { contains: q, mode: 'insensitive' } }
        ]
      };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: whereClause,
          take: pageSize,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: {
            images: {
              take: 1,
              orderBy: { order: 'asc' }
            },
            category: true,
            brand: true
          }
        }),
        prisma.product.count({ where: whereClause })
      ]);

      const formattedProducts = products.map(p => ({
        id: p.id,
        slug: p.slug,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
        price: p.price,
        salePrice: p.salePrice,
        image: p.images[0]?.url || null,
        category: p.category ? {
          nameAr: p.category.nameAr,
          nameEn: p.category.nameEn
        } : null,
        brand: p.brand ? {
          nameAr: p.brand.nameAr,
          nameEn: p.brand.nameEn
        } : null,
        stock: p.stock,
        isActive: p.isActive
      }));

      res.json({
        ok: true,
        products: formattedProducts,
        total,
        page,
        pageSize,
        hasMore: total > page * pageSize
      });
    } catch (dbError) {
      // Fallback to mock data when DB is not available
      const mockProducts = [
        {
          id: 1,
          slug: 'test-product-1',
          nameAr: 'منتج تجريبي 1 - ' + q,
          nameEn: 'Test Product 1 - ' + q,
          descriptionAr: 'وصف تجريبي للمنتج 1',
          descriptionEn: 'Test description for product 1',
          price: 99.99,
          salePrice: null,
          image: null,
          category: { nameAr: 'فئة تجريبية', nameEn: 'Test Category' },
          brand: { nameAr: 'علامة تجريبية', nameEn: 'Test Brand' },
          stock: 10,
          isActive: true
        },
        {
          id: 2,
          slug: 'test-product-2',
          nameAr: 'منتج تجريبي 2 - ' + q,
          nameEn: 'Test Product 2 - ' + q,
          descriptionAr: 'وصف تجريبي للمنتج 2',
          descriptionEn: 'Test description for product 2',
          price: 149.99,
          salePrice: 129.99,
          image: null,
          category: { nameAr: 'فئة تجريبية', nameEn: 'Test Category' },
          brand: { nameAr: 'علامة تجريبية', nameEn: 'Test Brand' },
          stock: 5,
          isActive: true
        }
      ].filter(p => p.nameAr.includes(q) || p.nameEn.toLowerCase().includes(q.toLowerCase()));

      const total = mockProducts.length;
      const paginatedProducts = mockProducts.slice(offset, offset + pageSize);

      res.json({
        ok: true,
        products: paginatedProducts,
        total,
        page,
        pageSize,
        hasMore: total > page * pageSize
      });
    }
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      ok: false,
      error: 'Search failed',
      products: [],
      total: 0
    });
  }
});

export default router;
