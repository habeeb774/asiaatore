import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'manager' } },
          { email: { contains: 'admin' } },
          { role: 'admin' }
        ]
      },
      select: { id: true, email: true, role: true, name: true }
    });
    
    console.log('Admin/Manager users:');
    users.forEach(u => {
      console.log(`- ${u.email} | role: ${u.role} | name: ${u.name}`);
    });
    
    // Check specifically for manager@my-store.com
    const manager = await prisma.user.findUnique({
      where: { email: 'manager@my-store.com' },
      select: { id: true, email: true, role: true, name: true }
    });
    
    if (manager) {
      console.log('\nManager user found:');
      console.log(`- ${manager.email} | role: ${manager.role} | name: ${manager.name}`);
    } else {
      console.log('\nManager user not found');
    }
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    await prisma.$disconnect();
  }
}

checkUsers();
