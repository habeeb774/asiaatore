import prisma from '../db/client.js';

// --- Mapping helpers (kept close to service for reuse) ---
function buildImageVariants(imagePath) {
  if (!imagePath) return null;
  if (!imagePath.startsWith('/uploads/product-images/')) return { original: imagePath };
  const base = imagePath.replace(/\.[^.]+$/, '');
  return { original: imagePath, thumb: base + '_thumb.webp', medium: base + '_md.webp' };
}

export function mapProduct(p) {
  if (!p) return null;
  const mainVariants = buildImageVariants(p.image);
  const gallery = Array.isArray(p.productImages)
    ? p.productImages
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
const baseInclude = { productImages: { orderBy: { sort: 'asc' } }, brand: true, tierPrices: true };

export async function count(where = {}) {
  return prisma.product.count({ where });
}

export async function list(where = {}, opts = {}) {
  const { orderBy = { createdAt: 'desc' }, include = baseInclude, skip, take } = opts;
  return prisma.product.findMany({ where, orderBy, include, skip, take });
}

export async function getById(id, include = baseInclude) {
  return prisma.product.findUnique({ where: { id }, include });
}

export async function create(data) {
  return prisma.product.create({ data, include: baseInclude });
}

export async function update(id, data) {
  return prisma.product.update({ where: { id }, data, include: baseInclude });
}

export async function remove(id) {
  return prisma.product.delete({ where: { id }, include: baseInclude });
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
  return prisma.productImage.delete({ where: { id: imageId } });
}

export async function getWithImages(productId) {
  return prisma.product.findUnique({ where: { id: productId }, include: { productImages: { orderBy: { sort: 'asc' } }, brand: true, tierPrices: true } });
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
