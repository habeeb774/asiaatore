import prisma from '../db/client.js';
import { whereWithDeletedAt } from '../utils/deletedAt.js';
import { safeProductInclude } from '../db/prismaHelpers.js';

// Ensure queries exclude soft-deleted records by default
// Removed withNotDeleted function, using whereWithDeletedAt instead

// --- Mapping helpers (kept close to service for reuse) ---
function buildImageVariants(imagePath) {
  if (!imagePath) return null;
  if (!imagePath.startsWith('/uploads/product-images/')) return { original: imagePath };
  const base = imagePath.replace(/\.[^.]+$/, '');
  return {
    // Back-compat flat props
    original: imagePath,
    thumb: base + '_thumb.webp',
    medium: base + '_md.webp',
    large: base + '_lg.webp',
    // Nested modern formats expected by frontend <picture>
    webp: {
      thumb: base + '_thumb.webp',
      medium: base + '_md.webp',
      large: base + '_lg.webp',
    },
    avif: {
      thumb: base + '_thumb.avif',
      medium: base + '_md.avif',
      large: base + '_lg.avif',
    },
  };
}

export function mapProduct(p) {
  if (!p) return null;
  const mainVariants = buildImageVariants(p.image);
  const gallery = Array.isArray(p.images)
    ? p.images
        .map((img) => ({
          id: img.id,
          url: img.url,
          variants: buildImageVariants(img.url),
          alt: { en: img.altEn || null, ar: img.altAr || null },
          sort: img.sort,
          createdAt: img.createdAt,
        }))
        .sort((a, b) => a.sort - b.sort || a.createdAt.localeCompare?.(b.createdAt) || 0)
    : [];
  const imagesAll = [...(p.image ? [p.image] : []), ...gallery.map((g) => g.url)];
  return {
    id: p.id,
    slug: p.slug,
    name: { ar: p.nameAr, en: p.nameEn },
    short: { ar: p.shortAr, en: p.shortEn },
    category: p.category,
    price: p.price,
    oldPrice: p.oldPrice,
    originalPrice: p.oldPrice,
    image: p.image,
    images: imagesAll,
    imageVariants: mainVariants,
    gallery,
    brand: p.brand
      ? {
          id: p.brand.id,
          slug: p.brand.slug,
          name: { ar: p.brand.nameAr, en: p.brand.nameEn },
          logo: p.brand.logo,
        }
      : null,
    tierPrices: Array.isArray(p.tierPrices)
      ? p.tierPrices
          .sort((a, b) => a.minQty - b.minQty)
          .map((t) => ({ id: t.id, minQty: t.minQty, price: t.price, packagingType: t.packagingType, note: { ar: t.noteAr, en: t.noteEn } }))
      : [],
    rating: p.rating,
    stock: p.stock,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// --- Query helpers ---
export async function count(where = {}) {
  return prisma.product.count({ where: whereWithDeletedAt(where) });
}

export async function list(where = {}, opts = {}) {
  const { orderBy = { createdAt: 'desc' }, skip, take } = opts;
  const include = opts.include ?? safeProductInclude();
  // If include contains nested where objects, ensure deletedAt clause is applied where possible
  if (include && include.images && include.images.where !== undefined) {
    include.images.where = whereWithDeletedAt(include.images.where || {});
  }
  return prisma.product.findMany({ where: whereWithDeletedAt(where), orderBy, include, skip, take });
}

export async function getById(id, include) {
  const inc = include ?? safeProductInclude();
  if (inc && inc.images && inc.images.where !== undefined) {
    inc.images.where = whereWithDeletedAt(inc.images.where || {});
  }
  return prisma.product.findFirst({ where: whereWithDeletedAt({ id }), include: inc });
}

export async function create(data) {
  const include = safeProductInclude();
  return prisma.product.create({ data, include });
}

export async function update(id, data) {
  const include = safeProductInclude();
  return prisma.product.update({ where: { id }, data, include });
}

export async function remove(id) {
  const include = safeProductInclude();
  return prisma.product.update({ where: { id }, data: { deletedAt: new Date() }, include });
}

// Gallery helpers
export async function maxImageSort(productId) {
  const agg = await prisma.productImage.aggregate({ where: { productId }, _max: { sort: true } });
  return (agg._max.sort ?? -1) + 1;
}

export async function createImage(productId, { url, altEn = null, altAr = null, sort = 0 }) {
  return prisma.productImage.create({ data: { productId, url, altEn, altAr, sort } });
}

export async function getImageById(imageId) {
  return prisma.productImage.findUnique({ where: { id: imageId } });
}

export async function updateImage(imageId, data) {
  return prisma.productImage.update({ where: { id: imageId }, data });
}

export async function deleteImage(imageId) {
  return prisma.productImage.update({ where: { id: imageId }, data: { deletedAt: new Date() } });
}

export async function getWithImages(productId) {
  const include = safeProductInclude();
  if (include.images) include.images.where = whereWithDeletedAt({ productId });
  return prisma.product.findFirst({ where: whereWithDeletedAt({ id: productId }), include });
}

export default {
  mapProduct,
  count,
  list,
  getById,
  create,
  update,
  remove,
  maxImageSort,
  createImage,
  getImageById,
  updateImage,
  deleteImage,
  getWithImages,
};
