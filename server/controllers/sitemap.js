import express from 'express';
import prisma from '../db/client.js';

const router = express.Router();

// GET /sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
  try {
  const baseFromEnv = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
  const base = baseFromEnv || `${req.protocol}://${req.get('host')}`;
    const urls = [];

    // Core static pages
    const staticPages = ['/', '/products', '/offers', '/brands', '/cart', '/checkout', '/login', '/register'];
    staticPages.forEach(p => urls.push({ loc: p, lastmod: null }));

    // Categories and products from DB (best-effort)
    try {
      const [cats, prods] = await Promise.all([
        prisma.category?.findMany?.({ select: { slug: true, updatedAt: true }, take: 1000 }).catch(() => []),
        prisma.product?.findMany?.({ select: { slug: true, updatedAt: true }, where: { status: 'ACTIVE' }, orderBy: { updatedAt: 'desc' }, take: 2000 }).catch(() => [])
      ]);

      (cats || []).forEach(c => {
        if (c?.slug) urls.push({ loc: `/category/${encodeURIComponent(c.slug)}`, lastmod: c?.updatedAt || null });
      });
      (prods || []).forEach(p => {
        if (p?.slug) urls.push({ loc: `/products/${encodeURIComponent(p.slug)}`, lastmod: p?.updatedAt || null });
      });
    } catch (e) {
      // best-effort: don't fail sitemap generation if DB query fails
    }

    const xmlLines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
    for (const u of urls) {
      const loc = base ? `${base}${u.loc}` : u.loc;
      xmlLines.push('  <url>');
      xmlLines.push(`    <loc>${loc}</loc>`);
      if (u.lastmod) xmlLines.push(`    <lastmod>${new Date(u.lastmod).toISOString()}</lastmod>`);
      // sensible defaults for changefreq/priority (optional)
      xmlLines.push('    <changefreq>weekly</changefreq>');
      xmlLines.push('    <priority>0.6</priority>');
      xmlLines.push('  </url>');
    }
    xmlLines.push('</urlset>');

    res.type('application/xml').send(xmlLines.join('\n'));
  } catch (err) {
    // Return minimal sitemap fallback
    res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>/</loc></url></urlset>');
  }
});

export default router;
