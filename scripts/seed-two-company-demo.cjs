// Creates a separate demo tenant for an existing owner. Reruns reuse the same tenant.
const { createHash } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');

function argument(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? '' : process.argv[index + 1] || '';
}

async function main() {
  const sourceCompanyId = argument('--source-company-id');
  if (!/^[a-f\d]{24}$/i.test(sourceCompanyId)) {
    throw new Error('Specify --source-company-id with the existing company ObjectId.');
  }

  const prisma = new PrismaClient();
  const demoId = suffix => createHash('sha256').update(`docflow-two-company-demo:${sourceCompanyId}:${suffix}`).digest('hex').slice(0, 24);
  try {
    const source = await prisma.company.findUniqueOrThrow({
      where: { id: sourceCompanyId },
      select: { id: true, name: true, status: true, settings: true },
    });
    if (source.status !== 'ACTIVE') throw new Error('The source company must be active.');
    const owners = await prisma.companyUser.findMany({
      where: { companyId: source.id, role: 'OWNER', status: 'ACTIVE' },
      select: { id: true, name: true, email: true, phone: true, passwordHash: true },
    });
    if (owners.length !== 1) throw new Error('The source company must have exactly one active owner for this demo setup.');
    const owner = owners[0];
    const companyId = demoId('company');
    const existing = await prisma.company.findUnique({ where: { id: companyId } });
    if (existing) {
      if (existing.settings?.demoSourceCompanyId !== source.id) throw new Error('The demo ID is already used by another record.');
      console.log(JSON.stringify({ created: false, sourceCompany: source.name, companyId, companyName: existing.name }, null, 2));
      return;
    }

    const companyName = argument('--name') || `${source.name} — บริษัทที่ 2 (ทดสอบ)`;
    const managementId = demoId('management');
    const operationsId = demoId('operations');
    const settings = {
      demoSourceCompanyId: source.id,
      demoPurpose: 'two-company-simulation',
      employeeCodeSequence: 2,
      ...(Array.isArray(source.settings?.enabledGlobalCategoryIds)
        ? { enabledGlobalCategoryIds: source.settings.enabledGlobalCategoryIds }
        : {}),
    };

    await prisma.$transaction(async tx => {
      await tx.company.create({ data: { id: companyId, name: companyName, legalName: companyName, status: 'ACTIVE', settings } });
      await tx.department.createMany({ data: [
        { id: managementId, companyId, name: 'ผู้บริหาร (ทดสอบ)', description: 'ข้อมูลจำลองสำหรับทดสอบบริษัทที่ 2', isActive: true, positions: ['หัวหน้า', 'ผู้ช่วย', 'รองผู้ช่วย', 'พนักงาน'] },
        { id: operationsId, companyId, name: 'ฝ่ายปฏิบัติการ (ทดสอบ)', description: 'ข้อมูลจำลองสำหรับทดสอบบริษัทที่ 2', isActive: true, positions: ['หัวหน้า', 'พนักงาน'] },
      ] });
      await tx.companyUser.create({ data: {
        id: demoId('owner'), companyId, name: owner.name, email: owner.email,
        phone: owner.phone, passwordHash: owner.passwordHash,
        role: 'OWNER', status: 'ACTIVE', departmentId: managementId, position: 'หัวหน้า',
      } });
      await tx.employee.createMany({ data: [
        { id: demoId('owner-profile'), companyId, code: '001', name: owner.name, email: owner.email, phone: owner.phone, departmentId: managementId, position: 'หัวหน้า', salarySatang: 4000000, status: 'ACTIVE' },
        { id: demoId('sample-employee'), companyId, code: '002', name: 'พนักงานตัวอย่าง บริษัทที่ 2', departmentId: operationsId, position: 'พนักงาน', salarySatang: 2500000, status: 'ACTIVE' },
      ] });
    }, { timeout: 15000 });

    const result = await prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { id: true, name: true, _count: { select: { users: true, departments: true, employees: true, payrollRuns: true, accountingEntries: true } } },
    });
    console.log(JSON.stringify({ created: true, sourceCompany: source.name, company: result, demoMonthlySalariesBaht: [40000, 25000] }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(`Demo setup failed (${error.code || error.name}). No connection credentials are logged.`);
  process.exitCode = 1;
});
