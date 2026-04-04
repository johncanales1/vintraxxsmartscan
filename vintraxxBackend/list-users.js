const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('Connecting to database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        passwordHash: true,
        isDealer: true,
        pricePerLaborHour: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`\nFound ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password Hash: ${user.passwordHash || 'No password (OAuth user)'}`);
      console.log(`  Is Dealer: ${user.isDealer}`);
      console.log(`  Price Per Labor Hour: ${user.pricePerLaborHour || 'Not set'}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log(`  Updated: ${user.updatedAt}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();