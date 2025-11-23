import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdmin() {
  try {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Check if admin exists
    let admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (admin) {
      // Update existing admin
      admin = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          role: 'admin',
          emailVerifiedAt: new Date()
        }
      });
      console.log('✅ Admin password has been reset');
    } else {
      // Create new admin
      admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Administrator',
          role: 'admin',
          emailVerifiedAt: new Date()
        }
      });
      console.log('✅ Admin user has been created');
    }

    console.log('\nYou can now log in with:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();
