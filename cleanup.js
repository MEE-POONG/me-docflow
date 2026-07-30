const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up Documents collection...');
  await prisma.document.deleteMany({});
  console.log('Documents deleted.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
