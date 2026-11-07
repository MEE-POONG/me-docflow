'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAccountingManager } from '@/lib/finance-access'
import { amountToSatang, DEFAULT_ACCOUNTS, summarizeAccounts, validateJournalLines, type JournalLine } from '@/lib/accounting-core'

const referencePart = (prefix: string) => `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(3).toString('hex').toUpperCase()}`

async function ensureDefaultAccounts(companyId: string) {
  await Promise.all(DEFAULT_ACCOUNTS.map(account => prisma.account.upsert({
    where: { companyId_code: { companyId, code: account.code } },
    create: { companyId, ...account, isSystem: true },
    update: { name: account.name, type: account.type, isSystem: true, isActive: true },
  })))
}

export async function getAccountingOverview() {
  const user = await requireAccountingManager()
  await ensureDefaultAccounts(user.companyId)
  const year = new Date().getFullYear()
  const [accounts, entries] = await Promise.all([
    prisma.account.findMany({ where: { companyId: user.companyId, isActive: true }, orderBy: [{ code: 'asc' }] }),
    prisma.accountingEntry.findMany({
      where: { companyId: user.companyId, entryDate: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
      orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
      take: 500,
    }),
  ])
  const accountSnapshots = accounts.map(({ id, code, name, type, isActive }) => ({ id, code, name, type, isActive }))
  const summary = summarizeAccounts(accountSnapshots, entries)
  return { year, accounts, entries, summary }
}

export async function createAccount(input: { code: string; name: string; type: string; description?: string }) {
  try {
    const user = await requireAccountingManager()
    const code = input.code.trim()
    const name = input.name.trim()
    const types = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']
    if (!/^\d{3,10}$/.test(code) || !name || name.length > 120 || !types.includes(input.type)) {
      return { success: false, error: 'กรุณาระบุรหัส ชื่อ และหมวดหมู่บัญชีให้ถูกต้อง' }
    }
    await prisma.account.create({
      data: {
        companyId: user.companyId,
        code,
        name,
        type: input.type as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE',
        description: input.description?.trim().slice(0, 240) || null,
      },
    })
    revalidatePath('/accounting')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error && error.message.includes('Unique') ? 'รหัสบัญชีนี้มีอยู่แล้ว' : error instanceof Error ? error.message : 'เพิ่มบัญชีไม่สำเร็จ' }
  }
}

type EntryInput = {
  entryType: 'INCOME' | 'EXPENSE' | 'JOURNAL'
  entryDate: string
  description: string
  counterpartyName?: string
  referenceNo?: string
  amountBaht?: string | number
  settlementStatus?: 'OPEN' | 'SETTLED'
  settlementAccountId?: string
  categoryAccountId?: string
  lines?: Array<{ accountId: string; debitBaht: string | number; creditBaht: string | number }>
}

export async function createAccountingEntry(input: EntryInput) {
  try {
    const user = await requireAccountingManager()
    if (!['INCOME', 'EXPENSE', 'JOURNAL'].includes(input.entryType)) throw new Error('ประเภทรายการบัญชีไม่ถูกต้อง')
    const date = new Date(`${input.entryDate}T00:00:00`)
    const description = input.description.trim()
    if (Number.isNaN(date.getTime()) || !description || description.length > 240) throw new Error('กรุณาระบุวันที่และรายละเอียดรายการบัญชี')

    const accounts = await prisma.account.findMany({ where: { companyId: user.companyId, isActive: true } })
    const snapshots = accounts.map(({ id, code, name, type, isActive }) => ({ id, code, name, type, isActive }))
    let lines: JournalLine[]
    const entryType = input.entryType
    let settlementStatus: 'OPEN' | 'SETTLED' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE'
    const counterpartyName = input.counterpartyName?.trim().slice(0, 150) || null

    if (input.entryType === 'JOURNAL') {
      if (!Array.isArray(input.lines)) throw new Error('กรุณาเพิ่มบรรทัดเดบิตและเครดิต')
      lines = input.lines.map(line => ({
        accountId: line.accountId,
        accountCode: '',
        accountName: '',
        debitSatang: amountToSatang(line.debitBaht),
        creditSatang: amountToSatang(line.creditBaht),
      }))
    } else {
      const amountSatang = amountToSatang(input.amountBaht)
      if (amountSatang <= 0) throw new Error('จำนวนเงินต้องมากกว่า 0')
      const category = accounts.find(account => account.id === input.categoryAccountId)
      const categoryType = input.entryType === 'INCOME' ? 'REVENUE' : 'EXPENSE'
      if (!category || category.type !== categoryType) throw new Error(input.entryType === 'INCOME' ? 'เลือกบัญชีรายได้ก่อนบันทึก' : 'เลือกบัญชีค่าใช้จ่ายก่อนบันทึก')

      const paid = input.settlementStatus === 'SETTLED'
      const clearingAccount = paid
        ? accounts.find(account => account.id === input.settlementAccountId && account.type === 'ASSET')
        : accounts.find(account => account.code === (input.entryType === 'INCOME' ? '1100' : '2010'))
      if (!clearingAccount) throw new Error(paid ? 'เลือกบัญชีเงินสดหรือธนาคารที่ใช้งานได้' : 'ไม่พบผังลูกหนี้หรือเจ้าหนี้สำหรับรายการนี้')
      settlementStatus = paid ? 'SETTLED' : 'OPEN'
      lines = input.entryType === 'INCOME'
        ? [
          { accountId: clearingAccount.id, accountCode: clearingAccount.code, accountName: clearingAccount.name, debitSatang: amountSatang, creditSatang: 0 },
          { accountId: category.id, accountCode: category.code, accountName: category.name, debitSatang: 0, creditSatang: amountSatang },
        ]
        : [
          { accountId: category.id, accountCode: category.code, accountName: category.name, debitSatang: amountSatang, creditSatang: 0 },
          { accountId: clearingAccount.id, accountCode: clearingAccount.code, accountName: clearingAccount.name, debitSatang: 0, creditSatang: amountSatang },
        ]
    }

    const validated = validateJournalLines(lines, snapshots)
    const amountSatang = validated.totalSatang
    const referenceNo = input.referenceNo?.trim().slice(0, 40) || referencePart(input.entryType === 'INCOME' ? 'INC' : input.entryType === 'EXPENSE' ? 'EXP' : 'JRN')
    if (referenceNo.length < 3) throw new Error('เลขที่อ้างอิงสั้นเกินไป')

    await prisma.accountingEntry.create({
      data: {
        companyId: user.companyId,
        entryDate: date,
        referenceNo,
        entryType,
        settlementStatus,
        description,
        counterpartyName,
        amountSatang,
        totalDebitSatang: validated.totalSatang,
        totalCreditSatang: validated.totalSatang,
        lines: validated.lines,
        createdById: user.id,
      },
    })
    revalidatePath('/accounting')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'บันทึกรายการบัญชีไม่สำเร็จ'
    if (message.includes('Unique')) return { success: false, error: 'เลขที่อ้างอิงนี้ถูกใช้แล้ว กรุณาเปลี่ยนเลขที่อ้างอิง' }
    return { success: false, error: message }
  }
}

export async function settleAccountingEntry(entryId: string, cashAccountId: string) {
  try {
    const user = await requireAccountingManager()
    if (!/^[a-f\d]{24}$/i.test(entryId) || !/^[a-f\d]{24}$/i.test(cashAccountId)) throw new Error('รายการหรือบัญชีรับจ่ายเงินไม่ถูกต้อง')
    const original = await prisma.accountingEntry.findFirst({ where: { id: entryId, companyId: user.companyId } })
    if (!original || !['INCOME', 'EXPENSE'].includes(original.entryType) || original.settlementStatus !== 'OPEN' || original.status !== 'POSTED') {
      throw new Error('รายการนี้ไม่อยู่ในสถานะค้างรับหรือค้างจ่าย')
    }
    const [cash, clearing] = await Promise.all([
      prisma.account.findFirst({ where: { id: cashAccountId, companyId: user.companyId, type: 'ASSET', isActive: true } }),
      prisma.account.findFirst({ where: { companyId: user.companyId, code: original.entryType === 'INCOME' ? '1100' : '2010', isActive: true } }),
    ])
    if (!cash || !clearing) throw new Error('ไม่พบผังบัญชีเงินสด/ธนาคาร หรือลูกหนี้/เจ้าหนี้')
    const lines: JournalLine[] = original.entryType === 'INCOME'
      ? [
        { accountId: cash.id, accountCode: cash.code, accountName: cash.name, debitSatang: original.amountSatang, creditSatang: 0 },
        { accountId: clearing.id, accountCode: clearing.code, accountName: clearing.name, debitSatang: 0, creditSatang: original.amountSatang },
      ]
      : [
        { accountId: clearing.id, accountCode: clearing.code, accountName: clearing.name, debitSatang: original.amountSatang, creditSatang: 0 },
        { accountId: cash.id, accountCode: cash.code, accountName: cash.name, debitSatang: 0, creditSatang: original.amountSatang },
      ]
    const validated = validateJournalLines(lines, [cash, clearing].map(({ id, code, name, type, isActive }) => ({ id, code, name, type, isActive })))
    const referenceNo = referencePart(original.entryType === 'INCOME' ? 'RCV' : 'PAY')
    await prisma.$transaction(async tx => {
      const claimed = await tx.accountingEntry.updateMany({ where: { id: original.id, companyId: user.companyId, status: 'POSTED', settlementStatus: 'OPEN' }, data: { settlementStatus: 'SETTLED' } })
      if (claimed.count !== 1) throw new Error('รายการนี้ถูกชำระไปแล้ว กรุณาโหลดข้อมูลใหม่')
      await tx.accountingEntry.create({
        data: {
          companyId: user.companyId,
          entryDate: new Date(),
          referenceNo,
          entryType: 'SETTLEMENT',
          settlementStatus: 'NOT_APPLICABLE',
          description: `${original.entryType === 'INCOME' ? 'รับชำระ' : 'จ่ายชำระ'}: ${original.description}`.slice(0, 240),
          counterpartyName: original.counterpartyName,
          amountSatang: original.amountSatang,
          totalDebitSatang: original.amountSatang,
          totalCreditSatang: original.amountSatang,
          lines: validated.lines,
          sourceEntryId: original.id,
          createdById: user.id,
        },
      })
    })
    revalidatePath('/accounting')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'ปิดรายการค้างชำระไม่สำเร็จ' }
  }
}
