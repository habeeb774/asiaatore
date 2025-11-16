import prisma from '../db/client.js';

(async function(){
  const id = process.argv[2];
  if (!id) { console.error('Please pass product id as first arg'); process.exit(2); }
  const imgs = await prisma.productImage.findMany({ where: { productId: id } });
  console.log('found', imgs.length, 'images');
  for(const i of imgs) console.log(i.id, i.url, i.sort, i.deletedAt);
  process.exit(0);
})();