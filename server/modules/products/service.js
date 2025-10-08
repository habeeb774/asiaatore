import * as productService from '../../services/productService.js';

export const ProductsService = {
  async list(params = {}) {
    const { where = {}, orderBy = { createdAt: 'desc' }, page, pageSize } = params;
    if (page) {
      const ps = Math.min(100, Math.max(1, Number(pageSize) || 20));
      const skip = (Math.max(1, Number(page)) - 1) * ps;
      const [total, items] = await Promise.all([
        productService.count(where),
        productService.list(where, { orderBy, skip, take: ps })
      ]);
      return { items, page: Number(page), pageSize: ps, total, totalPages: Math.ceil(total / ps) };
    }
    const items = await productService.list(where, { orderBy });
    return { items };
  },
  async getById(id) { return productService.getById(id); },
  async create(data) { return productService.create(data); },
  async update(id, data) { return productService.update(id, data); },
  async remove(id) { return productService.remove(id); },
  // gallery
  async addImage(productId, { url, altEn, altAr }) {
    const sort = await productService.maxImageSort(productId);
    await productService.createImage(productId, { url, altEn: altEn || null, altAr: altAr || null, sort });
    return productService.getWithImages(productId);
  },
  async updateImage(imageId, data) {
    await productService.updateImage(imageId, data);
    const img = await productService.getImageById(imageId);
    return productService.getWithImages(img.productId);
  },
  async deleteImage(imageId) {
    const img = await productService.getImageById(imageId);
    await productService.deleteImage(imageId);
    return productService.getWithImages(img.productId);
  }
};

export default ProductsService;
