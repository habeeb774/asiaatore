import prisma from '../server/db/client.js';
(async ()=>{
  try{
    const names = Object.keys(prisma).filter(k=> typeof prisma[k] === 'object' && prisma[k] !== null).sort();
    console.log('delegates:', names.join(', '));
    if (prisma.address) console.log('address methods:', Object.keys(prisma.address).filter(k=> typeof prisma.address[k] === 'function').join(', '));
  }catch(e){ console.error('ERR', e); }
  finally { await prisma.$disconnect(); }
})();
