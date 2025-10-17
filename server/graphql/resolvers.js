import prisma from '../db/client.js'

function mapProduct(p) { return p }

const resolvers = {
  JSON: {
    __parseValue(v) { return v },
    __serialize(v) { return v },
    __parseLiteral(ast) { return ast.value }
  },
  Query: {
    me: (_root, _args, ctx) => ctx.user || null,
    products: async (_root, args) => {
      const { q, category, minPrice, maxPrice, page=1, pageSize=20 } = args
      const where = {}
      if (category) where.category = String(category)
      if (q) where.OR = [ { nameAr: { contains: q, mode: 'insensitive' } }, { nameEn: { contains: q, mode: 'insensitive' } } ]
      if (minPrice || maxPrice) {
        where.price = {}
        if (minPrice != null) where.price.gte = Number(minPrice)
        if (maxPrice != null) where.price.lte = Number(maxPrice)
      }
      const take = Math.min(100, Math.max(1, pageSize))
      const skip = Math.max(0, (Math.max(1,page)-1) * take)
      const [total, items] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { images: true, brand: true, tierPrices: true } })
      ] )
      return { items: items.map(mapProduct), page: page||1, pageSize: take, total, totalPages: Math.ceil(total / take) }
    },
    product: async (_r, { id }) => prisma.product.findUnique({ where: { id }, include: { images: true, brand: true, tierPrices: true } }),
    orders: async (_r, { page=1, pageSize=50, status }, ctx) => {
      const isAdmin = ctx.user?.role === 'admin'
      const where = {}
      if (!isAdmin) where.userId = ctx.user?.id || 'guest'
      if (status) where.status = String(status)
      const take = Math.min(200, Math.max(1, pageSize))
      const skip = Math.max(0, (Math.max(1,page)-1) * take)
      const [total, list] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { items: true } })
      ])
      return { items: list, page: page||1, pageSize: take, total, totalPages: Math.ceil(total / take) }
    },
    order: async (_r, { id }, ctx) => {
      const o = await prisma.order.findUnique({ where: { id }, include: { items: true } })
      if (!o) return null
      const isAdmin = ctx.user?.role === 'admin'
      if (!isAdmin && o.userId !== (ctx.user?.id || 'guest')) return null
      return o
    }
  },
  Mutation: {
    createOrder: async (_r, { input }, ctx) => {
      const userId = ctx.user?.id || 'guest'
      const items = Array.isArray(input.items) ? input.items : []
      const normalized = items.map(i => ({
        productId: i.productId || 'custom',
        nameAr: i.nameAr || 'صنف',
        nameEn: i.nameEn || 'Item',
        price: Number(i.price) || 0,
        oldPrice: i.oldPrice != null ? Number(i.oldPrice) : null,
        quantity: Number(i.quantity) || 1
      }))
      const subtotal = normalized.reduce((s,i)=> s + i.price * i.quantity, 0)
      const discount = 0
      const tax = +(subtotal * 0.15).toFixed(2)
      const grandTotal = +(subtotal - discount + tax).toFixed(2)
      const created = await prisma.order.create({
        data: {
          userId,
          status: 'pending',
          currency: input.currency || 'SAR',
          subtotal, discount, tax, grandTotal,
          paymentMethod: input.paymentMethod || null,
          paymentMeta: input.paymentMeta || null,
          items: { create: normalized }
        }, include: { items: true }
      })
      return created
    },
    updateOrder: async (_r, { id, input }, ctx) => {
      const existing = await prisma.order.findUnique({ where: { id }, include: { items: true } })
      if (!existing) throw new Error('NOT_FOUND')
      const isAdmin = ctx.user?.role === 'admin'
      if (!isAdmin && existing.userId !== (ctx.user?.id || 'guest')) throw new Error('FORBIDDEN')
      let itemsData = existing.items
      if (Array.isArray(input.items)) {
        itemsData = input.items.map(i => ({
          productId: i.productId || 'custom',
          nameAr: i.nameAr || 'صنف',
          nameEn: i.nameEn || 'Item',
          price: Number(i.price) || 0,
          oldPrice: i.oldPrice != null ? Number(i.oldPrice) : null,
          quantity: Number(i.quantity) || 1
        }))
      }
      const subtotal = itemsData.reduce((s,i)=> s + (Number(i.price)||0) * (Number(i.quantity)||1), 0)
      const discount = 0
      const tax = +(subtotal * 0.15).toFixed(2)
      const grandTotal = +(subtotal - discount + tax).toFixed(2)
      const updated = await prisma.$transaction(async (tx) => {
        if (Array.isArray(input.items) && isAdmin) {
          await tx.orderItem.deleteMany({ where: { orderId: existing.id } })
          for (const it of itemsData) await tx.orderItem.create({ data: { ...it, orderId: existing.id } })
        }
        return tx.order.update({ where: { id: existing.id }, data: {
          status: input.status || existing.status,
          paymentMethod: input.paymentMethod != null ? input.paymentMethod : existing.paymentMethod,
          paymentMeta: input.paymentMeta != null ? input.paymentMeta : existing.paymentMeta,
          subtotal, discount, tax, grandTotal
        }, include: { items: true } })
      })
      return updated
    }
  }
}

export default resolvers
