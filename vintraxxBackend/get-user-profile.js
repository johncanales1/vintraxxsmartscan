const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function getUserProfile() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'john@vintraxx.com' },
      select: {
        id: true,
        email: true,
        isDealer: true,
        pricePerLaborHour: true,
        logoUrl: true,
        originalLogoUrl: true,
        qrCodeUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (user) {
      console.log('User Profile for john@vintraxx.com:');
      console.log('=====================================');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Is Dealer:', user.isDealer);
      console.log('Price Per Labor Hour:', user.pricePerLaborHour);
      console.log('Logo URL:', user.logoUrl || 'Not set');
      console.log('Original Logo URL:', user.originalLogoUrl || 'Not set');
      console.log('QR Code URL:', user.qrCodeUrl || 'Not set');
      console.log('Created:', user.createdAt);
      console.log('Updated:', user.updatedAt);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getUserProfile();