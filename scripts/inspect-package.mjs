import pkg from '@prisma/client';
console.log('pkg keys:', Object.keys(pkg).slice(0,50));
if (pkg.Prisma) console.log('Prisma keys:', Object.keys(pkg.Prisma).slice(0,50));
console.log('Has PrismaClient?', !!pkg.Prisma?.PrismaClient);
