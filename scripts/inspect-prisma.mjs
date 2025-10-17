import prisma from '../server/db/client.js';
(async ()=>{
  try {
    const map = prisma._dmmf?.modelMap || {};
    console.log('models:', Object.keys(map).join(', '));
    if (map.Address) console.log('Address fields:', map.Address.fields.map(f=>f.name).join(', '));
  } catch (e) {
    console.error('ERR', e);
  } finally {
    await prisma.$disconnect();
  }
})();
