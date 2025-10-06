// Import PrismaClient via default export for compatibility (CJS interop under Node 22)
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__prisma || new PrismaClient();
if (!globalForPrisma.__prisma) globalForPrisma.__prisma = prisma;

export default prisma;
