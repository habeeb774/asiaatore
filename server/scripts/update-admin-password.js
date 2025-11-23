import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    // The hashed password for 'Admin123!'
    const hashedPassword = '$2a$10$NN1dvuxN/E2LiWFG/hiBDONrYayD20ufF5DGDDOuKYwwhrAm5eCY.';
    
    // Update the admin user's password
    const updatedUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: { 
        password: hashedPassword,
        role: 'admin'  // Ensure role is set to admin
      },
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Administrator',
        role: 'admin',
        emailVerified: true
      }
    });
    
    console.log('Admin password has been updated successfully!');
    console.log('You can now log in with:');
    console.log('Email: admin@example.com');
    console.log('Password: Admin123!');
    
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
