const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Testing connection...");
    // Attempt a simple query, or just connect
    await prisma.$connect();
    console.log("Successfully connected to the database!");
    
    const count = await prisma.company.count();
    console.log("Company count:", count);
  } catch (error) {
    console.error("Connection failed!");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
