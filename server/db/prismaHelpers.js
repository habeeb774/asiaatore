import prisma from './client.js';

// Build safe include objects based on the runtime Prisma client schema.
// If a relation/field does not exist on the model, omit it from the include.
function modelHasField(modelName, fieldName) {
  try {
    const map = prisma._dmmf?.modelMap;
    if (!map) return false;
    const m = map[modelName];
    if (!m || !Array.isArray(m.fields)) return false;
    return m.fields.some(f => f.name === fieldName);
  } catch {
    return false;
  }
}

export function safeProductInclude() {
  const include = {};
  if (modelHasField('Product', 'images')) {
    include.images = { where: {}, orderBy: { sort: 'asc' } };
  }
  if (modelHasField('Product', 'brand')) {
    include.brand = true;
  }
  if (modelHasField('Product', 'tierPrices')) {
    include.tierPrices = true;
  }
  return include;
}

export default { modelHasField, safeProductInclude };
