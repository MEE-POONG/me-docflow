const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const types = await prisma.documentType.findMany({ include: { category: true } });
  console.log(JSON.stringify(types.filter(t => t.category.name.includes('จดทะเบียน')), null, 2));
}

main();
