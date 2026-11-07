const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.join(__dirname, '..');
let core;
core = load('lib/accounting-core.ts');

function load(file, prisma, auth) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const modules = {
    '@/lib/prisma': { prisma },
    '@/lib/accounting-core': core,
    '@/lib/finance-access': auth,
    'next/cache': { revalidatePath() {} },
  };
  vm.runInNewContext(code, {
    exports,
    Buffer,
    console,
    require: id => modules[id] || require(id),
  });
  return exports;
}

function fixture() {
  const companyId = 'a'.repeat(24);
  const owner = { id: 'b'.repeat(24), companyId, name: 'บริษัททดสอบ', email: 'owner@example.test', role: 'OWNER', company: { name: 'บริษัททดสอบ' } };
  const dev = { id: 'c'.repeat(24), companyId, name: 'Dev Employee', email: 'dev@example.test', role: 'STAFF', company: { name: 'บริษัททดสอบ' } };
  const accountIds = new Map(core.DEFAULT_ACCOUNTS.map((account, index) => [account.code, String(index + 1).padStart(24, '0')]));
  const accounts = core.DEFAULT_ACCOUNTS.map(account => ({ ...account, id: accountIds.get(account.code), companyId, isSystem: true, isActive: true }));
  const employees = [{ id: 'd'.repeat(24), companyId, code: 'DEV-001', name: 'Dev Employee', email: dev.email, position: 'นักพัฒนาระบบ', salarySatang: 3_000_000, status: 'ACTIVE' }];
  const entries = [];
  const runs = [];
  let sequence = 20;
  const nextId = () => String(sequence++).padStart(24, '0');
  const inScope = (row, where = {}) => (!where.companyId || row.companyId === where.companyId)
    && (!where.id || row.id === where.id)
    && (!where.status || row.status === where.status)
    && (!where.settlementStatus || row.settlementStatus === where.settlementStatus);
  const prisma = {
    account: {
      findMany: async ({ where = {} } = {}) => accounts.filter(row => inScope(row, where) && (!where.type || row.type === where.type) && (!where.isActive || row.isActive) && (!where.id?.in || where.id.in.includes(row.id))),
      findFirst: async ({ where = {} }) => accounts.find(row => inScope(row, where) && (!where.type || row.type === where.type) && (!where.code || row.code === where.code)) || null,
      create: async ({ data }) => { const row = { id: nextId(), isActive: true, ...data }; accounts.push(row); return row; },
      upsert: async ({ where, create, update }) => {
        const row = accounts.find(item => item.companyId === where.companyId_code.companyId && item.code === where.companyId_code.code);
        if (row) { Object.assign(row, update); return row; }
        const created = { id: nextId(), isActive: true, ...create }; accounts.push(created); return created;
      },
    },
    employee: {
      findMany: async ({ where = {} }) => employees.filter(row => row.companyId === where.companyId && (!where.status || row.status === where.status) && (!where.id?.in || where.id.in.includes(row.id))),
    },
    accountingEntry: {
      create: async ({ data }) => { const row = { id: nextId(), status: 'POSTED', ...data }; entries.push(row); return row; },
      findFirst: async ({ where = {} }) => entries.find(row => inScope(row, where)) || null,
      updateMany: async ({ where = {}, data }) => { const row = entries.find(item => inScope(item, where)); if (!row) return { count: 0 }; Object.assign(row, data); return { count: 1 }; },
      update: async ({ where = {}, data }) => { const row = entries.find(item => inScope(item, where)); if (!row) throw new Error('missing accounting entry'); Object.assign(row, data); return row; },
    },
    payrollRun: {
      create: async ({ data }) => { const row = { id: nextId(), status: 'POSTED', ...data }; runs.push(row); return row; },
      findMany: async ({ where = {} }) => runs.filter(row => row.companyId === where.companyId).sort((a, b) => b.period.localeCompare(a.period)),
      findFirst: async ({ where = {} }) => runs.find(row => inScope(row, where)) || null,
      update: async ({ where = {}, data }) => { const row = runs.find(item => inScope(item, where)); if (!row) throw new Error('missing payroll run'); Object.assign(row, data); return row; },
      updateMany: async ({ where = {}, data }) => { const row = runs.find(item => inScope(item, where)); if (!row) return { count: 0 }; Object.assign(row, data); return { count: 1 }; },
    },
    $transaction: async callback => callback(prisma),
  };
  let currentUser = owner;
  const auth = {
    canManagePayroll: role => ['OWNER', 'ADMIN', 'ACCOUNTANT', 'FINANCE', 'HR'].includes(role),
    requireAccountingManager: async () => {
      if (!['OWNER', 'ADMIN', 'ACCOUNTANT', 'FINANCE'].includes(currentUser.role)) throw new Error('ไม่มีสิทธิ์จัดการบัญชี');
      return currentUser;
    },
    requirePayrollManager: async () => {
      if (!['OWNER', 'ADMIN', 'ACCOUNTANT', 'FINANCE', 'HR'].includes(currentUser.role)) throw new Error('ไม่มีสิทธิ์จัดการเงินเดือน');
      return currentUser;
    },
    requirePayrollViewer: async () => currentUser,
  };
  return { companyId, owner, dev, accounts, employees, entries, runs, prisma, auth, accountIds, setUser: user => { currentUser = user; } };
}

test('amount conversion and journal validation reject values that would unbalance a ledger', () => {
  const f = fixture();
  assert.equal(core.amountToSatang('12500.25'), 1_250_025);
  assert.throws(() => core.amountToSatang('-1'), /ตั้งแต่ 0/);
  const cash = f.accounts.find(account => account.code === '1020');
  const revenue = f.accounts.find(account => account.code === '4010');
  const lines = [
    { accountId: cash.id, debitSatang: 1_000, creditSatang: 0 },
    { accountId: revenue.id, debitSatang: 0, creditSatang: 1_000 },
  ];
  assert.equal(core.validateJournalLines(lines, f.accounts).totalSatang, 1_000);
  assert.throws(() => core.validateJournalLines([{ ...lines[0], debitSatang: 1_001 }, lines[1]], f.accounts), /ต้องเท่ากัน/);
  assert.throws(() => core.validateJournalLines([{ ...lines[0], accountId: 'f'.repeat(24) }, lines[1]], f.accounts), /ผังบัญชี/);
});

test('owner records an unpaid invoice as receivable and settlement clears receivable with a second entry', async () => {
  const f = fixture();
  const actions = load('app/(dashboard)/accounting/actions.ts', f.prisma, f.auth);
  const revenue = f.accounts.find(account => account.code === '4010');
  const created = await actions.createAccountingEntry({
    entryType: 'INCOME', entryDate: '2026-06-01', description: 'ค่าบริการระบบ', counterpartyName: 'บริษัททดสอบลูกค้า',
    amountBaht: '12500', settlementStatus: 'OPEN', categoryAccountId: revenue.id,
  });
  assert.equal(created.success, true);
  const invoice = f.entries[0];
  assert.equal(invoice.companyId, f.companyId);
  assert.equal(invoice.settlementStatus, 'OPEN');
  assert.equal(invoice.totalDebitSatang, 1_250_000);
  assert.equal(invoice.lines[0].accountCode, '1100');
  assert.equal(invoice.lines[1].accountCode, '4010');

  const paid = await actions.settleAccountingEntry(invoice.id, f.accountIds.get('1020'));
  assert.equal(paid.success, true);
  assert.equal(f.entries.length, 2);
  assert.equal(invoice.settlementStatus, 'SETTLED');
  assert.equal(f.entries[1].entryType, 'SETTLEMENT');
  assert.deepEqual(Array.from(f.entries[1].lines, line => [line.accountCode, line.debitSatang, line.creditSatang]), [
    ['1020', 1_250_000, 0], ['1100', 0, 1_250_000],
  ]);
});

test('employee role cannot create accounting records', async () => {
  const f = fixture();
  f.setUser(f.dev);
  const actions = load('app/(dashboard)/accounting/actions.ts', f.prisma, f.auth);
  const result = await actions.createAccountingEntry({ entryType: 'EXPENSE', entryDate: '2026-06-01', description: 'ค่าวัสดุ', amountBaht: '100', settlementStatus: 'SETTLED', categoryAccountId: f.accounts.find(account => account.code === '5010').id, settlementAccountId: f.accountIds.get('1020') });
  assert.equal(result.success, false);
  assert.equal(f.entries.length, 0);
});

test('payroll run snapshots the employee calculation and writes balanced accrual and payment entries', async () => {
  const f = fixture();
  const actions = load('app/(dashboard)/payroll/actions.ts', f.prisma, f.auth);
  const result = await actions.createPayrollRun({ period: '2026-06', payDate: '2026-06-30', adjustments: [{ employeeId: f.employees[0].id, additionsBaht: '2000', deductionsBaht: '1500', deductionsLabel: 'หักอื่น' }] });
  assert.equal(result.success, true);
  assert.equal(f.runs.length, 1);
  const run = f.runs[0];
  assert.equal(run.grossPaySatang, 3_200_000);
  assert.equal(run.deductionsSatang, 150_000);
  assert.equal(run.netPaySatang, 3_050_000);
  assert.equal(run.slips[0].employeeEmail, 'dev@example.test');
  const accrual = f.entries.find(entry => entry.entryType === 'PAYROLL');
  assert.ok(accrual);
  assert.equal(accrual.totalDebitSatang, accrual.totalCreditSatang);
  assert.deepEqual(Array.from(accrual.lines, line => [line.accountCode, line.debitSatang, line.creditSatang]), [
    ['5020', 3_200_000, 0], ['2020', 0, 3_050_000], ['2030', 0, 150_000],
  ]);

  const paid = await actions.payPayrollRun(run.id, f.accountIds.get('1020'));
  assert.equal(paid.success, true);
  assert.equal(run.status, 'PAID');
  const payment = f.entries.find(entry => entry.entryType === 'PAYROLL_PAYMENT');
  assert.equal(payment.totalDebitSatang, 3_050_000);
  assert.equal(payment.totalCreditSatang, 3_050_000);
});

test('employee can retrieve only their own payslip, and cannot manage a payroll run', async () => {
  const f = fixture();
  f.setUser(f.dev);
  const run = { id: 'e'.repeat(24), companyId: f.companyId, period: '2026-06', payDate: new Date('2026-06-30'), status: 'PAID', slips: [
    { employeeId: f.employees[0].id, employeeCode: 'DEV-001', employeeName: 'Dev Employee', employeeEmail: 'dev@example.test', position: 'นักพัฒนาระบบ', baseSalarySatang: 3_000_000, additionsSatang: 0, additionsLabel: 'รายรับเพิ่ม', deductionsSatang: 0, deductionsLabel: 'รายการหัก', grossPaySatang: 3_000_000, netPaySatang: 3_000_000 },
    { employeeId: 'f'.repeat(24), employeeCode: 'OWNER-1', employeeName: 'Owner', employeeEmail: 'owner@example.test', position: 'เจ้าของ', baseSalarySatang: 9_000_000, additionsSatang: 0, additionsLabel: 'รายรับเพิ่ม', deductionsSatang: 0, deductionsLabel: 'รายการหัก', grossPaySatang: 9_000_000, netPaySatang: 9_000_000 },
  ] };
  f.runs.push(run);
  const actions = load('app/(dashboard)/payroll/actions.ts', f.prisma, f.auth);
  const overview = await actions.getPayrollOverview();
  assert.equal(overview.isManager, false);
  assert.equal(overview.ownSlips.length, 1);
  assert.equal(overview.ownSlips[0].slip.employeeName, 'Dev Employee');
  assert.equal(overview.ownSlips[0].slip.netPaySatang, 3_000_000);
  assert.equal(JSON.stringify(overview).includes('9_000_000'), false);
  assert.equal(JSON.stringify(overview).includes('9000000'), false);
  const attempt = await actions.createPayrollRun({ period: '2026-07', payDate: '2026-07-31', adjustments: [] });
  assert.equal(attempt.success, false);
  assert.equal(f.runs.length, 1);
});
