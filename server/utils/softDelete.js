export async function softDelete(delegate, where) {
  // delegate example: prisma.product
  return delegate.update({ where, data: { deletedAt: new Date() } });
}

export default softDelete;