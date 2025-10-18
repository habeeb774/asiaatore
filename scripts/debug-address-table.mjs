import prisma from '../server/db/client.js';

(async () => {
  try {
    const rows = await prisma.$queryRaw`DESCRIBE \`Address\``;
    console.log('DESCRIBE Address ->');
    for (const r of rows) console.log(r);
  } catch (e) {
    console.error('DEBUG ERROR', e);
  } finally {
    await prisma.$disconnect();
  }
})();
