'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { canManagePayroll, requirePayrollManager, requirePayrollViewer } from '@/lib/finance-access'
import { calculatePayrollSlips, DEFAULT_ACCOUNTS, validateJournalLines, type JournalLine } from '@/lib/accounting-core'

type SlipSnapshot = {
  employeeId: string
  employeeCode: string | null
  employeeName: string
  employeeEmail: string | null
  position: string | null
  baseSalarySatang: number
  additionsSatang: number
  additionsLabel: string
  deductionsSatang: number
  deductionsLabel: string
  grossPaySatang: number
  netPaySatang: number
}

const slipFields = (slips: unknown): Record<string, unknown>[] => Array.isArray(slips) ? slips.filter((slip): slip is Record<string, unknown> => !!slip && typeof slip === 'object') : []
const readSlip = (slip: Record<string, unknown>): SlipSnapshot | null => {
  if (typeof slip.employeeId !== 'string' || typeof slip.employeeName !== 'string') return null
  const numberField = (key: string) => typeof slip[key] === 'number' && Number.isSafeInteger(slip[key]) ? slip[key] as number : 0
  return {
    employeeId: slip.employeeId,
    employeeCode: typeof slip.employeeCode === 'string' ? slip.employeeCode : null,
    employeeName: slip.employeeName,
    employeeEmail: typeof slip.employeeEmail === 'string' ? slip.employeeEmail : null,
    position: typeof slip.position === 'string' ? slip.position : null,
    baseSalarySatang: numberField('baseSalarySatang'),
    additionsSatang: numberField('additionsSatang'),
    additionsLabel: typeof slip.additionsLabel === 'string' ? slip.additionsLabel : 'รายรับเพิ่ม',
    deductionsSatang: numberField('deductionsSatang'),
    deductionsLabel: typeof slip.deductionsLabel === 'string' ? slip.deductionsLabel : 'รายการหัก',
    grossPaySatang: numberField('grossPaySatang'),
    netPaySatang: numberField('netPaySatang'),
  }
}
const makeReference = (prefix: string) => `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(3).toString('hex').toUpperCase()}`

async function ensureDefaultAccounts(companyId: string) {
  await Promise.all(DEFAULT_ACCOUNTS.map(account => prisma.account.upsert({
    where: { companyId_code: { companyId, code: account.code } },
    create: { companyId, ...account, isSystem: true },
    update: { name: account.name, type: account.type, isSystem: true, isActive: true },
  })))
}

export async function getPayrollOverview() {
  const user = await requirePayrollViewer()
  const isManager = canManagePayroll(user.role)
  if (isManager) {
    await ensureDefaultAccounts(user.companyId)
    const [employees, runs, accounts] = await Promise.all([
      prisma.employee.findMany({
        where: { companyId: user.companyId, status: 'ACTIVE' },
        select: { id: true, code: true, name: true, email: true, position: true, salarySatang: true },
        orderBy: [{ name: 'asc' }],
      }),
      prisma.payrollRun.findMany({ where: { companyId: user.companyId }, orderBy: [{ period: 'desc' }], take: 36 }),
      prisma.account.findMany({ where: { companyId: user.companyId, type: 'ASSET', isActive: true }, orderBy: [{ code: 'asc' }] }),
    ])
    return {
      isManager: true as const,
      userName: user.name,
      employees,
      runs: runs.map(run => ({ ...run, slips: slipFields(run.slips).map(readSlip).filter((slip): slip is SlipSnapshot => !!slip) })),
      accounts,
    }
  }

  const runs = await prisma.payrollRun.findMany({ where: { companyId: user.companyId }, orderBy: [{ period: 'desc' }], take: 36 })
  const ownSlips = runs.flatMap(run => slipFields(run.slips)
    .map(readSlip)
    .filter((slip): slip is SlipSnapshot => !!slip && !!slip.employeeEmail && slip.employeeEmail.toLowerCase() === user.email.toLowerCase())
    .map(slip => ({
      period: run.period,
      payDate: run.payDate,
      status: run.status,
      slip: {
        employeeCode: slip.employeeCode,
        employeeName: slip.employeeName,
        position: slip.position,
        baseSalarySatang: slip.baseSalarySatang,
        additionsSatang: slip.additionsSatang,
        additionsLabel: slip.additionsLabel,
        deductionsSatang: slip.deductionsSatang,
        deductionsLabel: slip.deductionsLabel,
        grossPaySatang: slip.grossPaySatang,
        netPaySatang: slip.netPaySatang,
      },
    })))
  return { isManager: false as const, userName: user.name, ownSlips }
}

type PayrollInput = {
  period: string
  payDate: string
  adjustments: Array<{
    employeeId: string
    additionsBaht?: string | number
    deductionsBaht?: string | number
    additionsLabel?: string
    deductionsLabel?: string
  }>
}

export async function createPayrollRun(input: PayrollInput) {
  try {
    const user = await requirePayrollManager()
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.period)) throw new Error('เลือกรอบเดือนและปีให้ถูกต้อง')
    const [year, month] = input.period.split('-').map(Number)
    if (year < 2000 || year > 2200) throw new Error('ปีที่ระบุไม่ถูกต้อง')
    const payDate = new Date(`${input.payDate}T00:00:00`)
    if (Number.isNaN(payDate.getTime())) throw new Error('กรุณาระบุวันที่จ่ายเงินเดือน')
    if (!Array.isArray(input.adjustments) || input.adjustments.length > 500) throw new Error('ข้อมูลรายการเงินเดือนไม่ถูกต้อง')
    const ids = input.adjustments.map(item => item.employeeId)
    if (new Set(ids).size !== ids.length || ids.some(id => !/^[a-f\d]{24}$/i.test(id))) throw new Error('พบรหัสพนักงานซ้ำหรือไม่ถูกต้อง')

    const employees = await prisma.employee.findMany({
      where: { companyId: user.companyId, status: 'ACTIVE', id: { in: ids } },
      select: { id: true, code: true, name: true, email: true, position: true, salarySatang: true },
    })
    if (employees.length !== ids.length) throw new Error('รายชื่อพนักงานมีการเปลี่ยนแปลง กรุณาโหลดหน้าจอใหม่')
    const emails = employees.map(employee => employee.email?.trim().toLowerCase()).filter((email): email is string => !!email)
    if (new Set(emails).size !== emails.length) throw new Error('พบอีเมลพนักงานซ้ำ กรุณาแก้ข้อมูลพนักงานก่อนสร้างสลิป')
    const slips = calculatePayrollSlips(employees, input.adjustments)
    const grossPaySatang = slips.reduce((sum, slip) => sum + slip.grossPaySatang, 0)
    const additionsSatang = slips.reduce((sum, slip) => sum + slip.additionsSatang, 0)
    const deductionsSatang = slips.reduce((sum, slip) => sum + slip.deductionsSatang, 0)
    const netPaySatang = slips.reduce((sum, slip) => sum + slip.netPaySatang, 0)
    if (![grossPaySatang, additionsSatang, deductionsSatang, netPaySatang].every(Number.isSafeInteger)) throw new Error('ยอดรวมเงินเดือนเกินขอบเขตที่ระบบรองรับ')

    await ensureDefaultAccounts(user.companyId)
    const accounts = await prisma.account.findMany({ where: { companyId: user.companyId, isActive: true } })
    const salaryExpense = accounts.find(account => account.code === '5020' && account.type === 'EXPENSE')
    const salaryPayable = accounts.find(account => account.code === '2020' && account.type === 'LIABILITY')
    const withholdingPayable = accounts.find(account => account.code === '2030' && account.type === 'LIABILITY')
    if (!salaryExpense || !salaryPayable || !withholdingPayable) throw new Error('ไม่พบผังบัญชีเงินเดือนที่จำเป็น')
    const lines: JournalLine[] = [
      { accountId: salaryExpense.id, accountCode: salaryExpense.code, accountName: salaryExpense.name, debitSatang: grossPaySatang, creditSatang: 0 },
      { accountId: salaryPayable.id, accountCode: salaryPayable.code, accountName: salaryPayable.name, debitSatang: 0, creditSatang: netPaySatang },
    ]
    if (deductionsSatang > 0) lines.push({ accountId: withholdingPayable.id, accountCode: withholdingPayable.code, accountName: withholdingPayable.name, debitSatang: 0, creditSatang: deductionsSatang })
    const validated = validateJournalLines(lines, accounts.map(({ id, code, name, type, isActive }) => ({ id, code, name, type, isActive })))
    const periodDate = new Date(year, month - 1, 1)
    const run = await prisma.$transaction(async tx => {
      const createdRun = await tx.payrollRun.create({
        data: {
          companyId: user.companyId,
          period: input.period,
          payDate,
          employeeCount: slips.length,
          grossPaySatang,
          additionsSatang,
          deductionsSatang,
          netPaySatang,
          slips,
          createdById: user.id,
        },
      })
      const journal = await tx.accountingEntry.create({
        data: {
          companyId: user.companyId,
          entryDate: periodDate,
          referenceNo: `SAL-${input.period.replace('-', '')}`,
          entryType: 'PAYROLL',
          settlementStatus: 'NOT_APPLICABLE',
          description: `ตั้งค่าใช้จ่ายเงินเดือนรอบ ${month}/${year}`,
          amountSatang: grossPaySatang,
          totalDebitSatang: validated.totalSatang,
          totalCreditSatang: validated.totalSatang,
          lines: validated.lines,
          period: input.period,
          sourcePayrollRunId: createdRun.id,
          createdById: user.id,
        },
      })
      return tx.payrollRun.update({ where: { id: createdRun.id, companyId: user.companyId }, data: { journalEntryId: journal.id } })
    })
    revalidatePath('/payroll')
    revalidatePath('/accounting')
    return { success: true, runId: run.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'สร้างรอบเงินเดือนไม่สำเร็จ'
    if (message.includes('Unique')) return { success: false, error: 'มีรอบเงินเดือนของเดือนนี้แล้ว' }
    return { success: false, error: message }
  }
}

export async function payPayrollRun(runId: string, bankAccountId: string) {
  try {
    const user = await requirePayrollManager()
    if (!/^[a-f\d]{24}$/i.test(runId) || !/^[a-f\d]{24}$/i.test(bankAccountId)) throw new Error('รายการหรือบัญชีธนาคารไม่ถูกต้อง')
    const [run, bank, salaryPayable] = await Promise.all([
      prisma.payrollRun.findFirst({ where: { id: runId, companyId: user.companyId, status: 'POSTED' } }),
      prisma.account.findFirst({ where: { id: bankAccountId, companyId: user.companyId, type: 'ASSET', isActive: true } }),
      prisma.account.findFirst({ where: { companyId: user.companyId, code: '2020', type: 'LIABILITY', isActive: true } }),
    ])
    if (!run) throw new Error('ไม่พบรอบเงินเดือนที่รอจ่าย')
    if (!bank || !salaryPayable) throw new Error('ไม่พบผังบัญชีธนาคารหรือเงินเดือนค้างจ่าย')
    const lines: JournalLine[] = [
      { accountId: salaryPayable.id, accountCode: salaryPayable.code, accountName: salaryPayable.name, debitSatang: run.netPaySatang, creditSatang: 0 },
      { accountId: bank.id, accountCode: bank.code, accountName: bank.name, debitSatang: 0, creditSatang: run.netPaySatang },
    ]
    const validated = validateJournalLines(lines, [bank, salaryPayable].map(({ id, code, name, type, isActive }) => ({ id, code, name, type, isActive })))
    const referenceNo = makeReference('SALPAY')
    await prisma.$transaction(async tx => {
      const claimed = await tx.payrollRun.updateMany({ where: { id: run.id, companyId: user.companyId, status: 'POSTED' }, data: { status: 'PAID' } })
      if (claimed.count !== 1) throw new Error('รอบเงินเดือนนี้ถูกจ่ายไปแล้ว กรุณาโหลดข้อมูลใหม่')
      const payment = await tx.accountingEntry.create({
        data: {
          companyId: user.companyId,
          entryDate: new Date(),
          referenceNo,
          entryType: 'PAYROLL_PAYMENT',
          settlementStatus: 'NOT_APPLICABLE',
          description: `จ่ายเงินเดือนรอบ ${run.period}`,
          amountSatang: run.netPaySatang,
          totalDebitSatang: validated.totalSatang,
          totalCreditSatang: validated.totalSatang,
          lines: validated.lines,
          period: run.period,
          sourcePayrollRunId: run.id,
          createdById: user.id,
        },
      })
      await tx.payrollRun.update({ where: { id: run.id, companyId: user.companyId }, data: { paymentEntryId: payment.id } })
    })
    revalidatePath('/payroll')
    revalidatePath('/accounting')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'บันทึกการจ่ายเงินเดือนไม่สำเร็จ' }
  }
}
