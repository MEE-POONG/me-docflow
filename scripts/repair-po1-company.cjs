// Targeted repair for the PO1 saved by the old default-company registration flow.
// Run without --apply to inspect; --apply changes only companyId and createdById.
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const documentId = '6aa3ad89506996183ef0456f';
const fromCompanyId = '6a6077be5e3b8e5f7ae6eee2';
const fromUserId = '6aa3ad89506996183ef0456e';
const toCompanyId = '6aa3ac51506996183ef0456a';
const toUserId = '6aa3ac52506996183ef0456b';

async function main() {
  await prisma.$transaction(async tx => {
    const doc = await tx.document.findUniqueOrThrow({ where: { id: documentId }, include: {
      createdBy: true, category: true, documentType: true, template: true,
    } });
    if (doc.companyId === toCompanyId && doc.createdById === toUserId) {
      console.log('PO1 already belongs to the registered company.');
      return;
    }
    const user = await tx.companyUser.findUniqueOrThrow({ where: { id: toUserId } });
    if (doc.companyId !== fromCompanyId || doc.createdById !== fromUserId || doc.status !== 'DRAFT'
      || doc.dataJson?.po_refNo !== 'PO1' || doc.createdBy.passwordHash !== 'dummy'
      || user.companyId !== toCompanyId || user.email !== doc.createdBy.email
      || user.passwordHash === 'dummy' || user.status !== 'ACTIVE') {
      throw new Error('Repair preconditions changed; no document was updated.');
    }
    if ([doc.category, doc.documentType, doc.template].some(ref => ref?.companyId && ref.companyId !== toCompanyId)
      || await tx.documentFile.count({ where: { documentId } })
      || await tx.documentApproval.count({ where: { documentId } })) {
      throw new Error('Document has company-specific references or related records; manual review required.');
    }
    console.log(JSON.stringify({ documentId, fromCompanyId, fromUserId, toCompanyId, toUserId, status: doc.status }));
    if (process.argv.includes('--apply')) {
      await tx.document.update({ where: { id: documentId, companyId: fromCompanyId, createdById: fromUserId, status: 'DRAFT' },
        data: { companyId: toCompanyId, createdById: toUserId },
      });
      console.log('Repaired PO1 ownership; document content and status preserved.');
    }
  });
}

main().catch(error => { console.error('Repair failed:', error.code || error.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
