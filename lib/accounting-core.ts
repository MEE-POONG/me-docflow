export type AccountSnapshot = {
  id: string
  code: string
  name: string
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
  isActive: boolean
}

export type JournalLine = {
  accountId: string
  accountCode: string
  accountName: string
  debitSatang: number
  creditSatang: number
}

export const DEFAULT_ACCOUNTS = [
  { code: '1010', name: 'เงินสด', type: 'ASSET' as const },
  { code: '1020', name: 'เงินฝากธนาคาร', type: 'ASSET' as const },
  { code: '1100', name: 'ลูกหนี้การค้า', type: 'ASSET' as const },
  { code: '2010', name: 'เจ้าหนี้การค้า', type: 'LIABILITY' as const },
  { code: '2020', name: 'เงินเดือนค้างจ่าย', type: 'LIABILITY' as const },
  { code: '2030', name: 'ภาษีและรายการหักค้างจ่าย', type: 'LIABILITY' as const },
  { code: '3010', name: 'ทุนเจ้าของ', type: 'EQUITY' as const },
  { code: '4010', name: 'รายได้จากการขายและบริการ', type: 'REVENUE' as const },
  { code: '5010', name: 'ค่าใช้จ่ายทั่วไป', type: 'EXPENSE' as const },
  { code: '5020', name: 'ค่าใช้จ่ายเงินเดือน', type: 'EXPENSE' as const },
]

const MAX_SATANG = 2_147_483_647

export function amountToSatang(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error('กรุณาระบุจำนวนเงิน')
  const amount = typeof value === 'string' ? Number(value.trim()) : value
  if (!Number.isFinite(amount) || amount < 0) throw new Error('จำนวนเงินต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป')
  const satang = Math.round((amount + Number.EPSILON) * 100)
  if (!Number.isSafeInteger(satang) || satang > MAX_SATANG) throw new Error('จำนวนเงินเกินขอบเขตที่ระบบรองรับ')
  return satang
}

export function validateJournalLines(lines: JournalLine[], accounts: AccountSnapshot[]) {
  if (!Array.isArray(lines) || lines.length < 2 || lines.length > 50) throw new Error('รายการบัญชีต้องมีอย่างน้อย 2 บรรทัดและไม่เกิน 50 บรรทัด')

  const byId = new Map(accounts.map(account => [account.id, account]))
  let debit = 0
  let credit = 0
  const normalized = lines.map(line => {
    const account = byId.get(line.accountId)
    if (!account || !account.isActive) throw new Error('พบผังบัญชีที่ไม่ถูกต้องหรือถูกปิดใช้งาน')
    const debitSatang = Number(line.debitSatang)
    const creditSatang = Number(line.creditSatang)
    const hasDebit = Number.isSafeInteger(debitSatang) && debitSatang > 0
    const hasCredit = Number.isSafeInteger(creditSatang) && creditSatang > 0
    if (hasDebit === hasCredit) throw new Error('แต่ละบรรทัดต้องระบุเดบิตหรือเครดิตเพียงด้านเดียว')
    debit += hasDebit ? debitSatang : 0
    credit += hasCredit ? creditSatang : 0
    return {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      debitSatang: hasDebit ? debitSatang : 0,
      creditSatang: hasCredit ? creditSatang : 0,
    }
  })

  if (debit <= 0 || debit !== credit) throw new Error('ยอดเดบิตและเครดิตต้องเท่ากันและมากกว่า 0')
  if (!Number.isSafeInteger(debit) || debit > MAX_SATANG) throw new Error('ยอดรวมเกินขอบเขตที่ระบบรองรับ')
  return { lines: normalized, totalSatang: debit }
}

export function summarizeAccounts(accounts: AccountSnapshot[], entries: Array<{ lines: unknown; status: string }>) {
  const totals = new Map(accounts.map(account => [account.id, { debit: 0, credit: 0 }]))
  for (const entry of entries) {
    if (entry.status !== 'POSTED' || !Array.isArray(entry.lines)) continue
    for (const rawLine of entry.lines) {
      if (!rawLine || typeof rawLine !== 'object') continue
      const line = rawLine as Partial<JournalLine>
      const balance = totals.get(String(line.accountId ?? ''))
      if (!balance) continue
      if (Number.isSafeInteger(line.debitSatang)) balance.debit += Number(line.debitSatang)
      if (Number.isSafeInteger(line.creditSatang)) balance.credit += Number(line.creditSatang)
    }
  }

  const rows = accounts.map(account => {
    const value = totals.get(account.id) ?? { debit: 0, credit: 0 }
    const net = value.debit - value.credit
    return {
      ...account,
      debitBalanceSatang: Math.max(net, 0),
      creditBalanceSatang: Math.max(-net, 0),
      revenueSatang: account.type === 'REVENUE' ? value.credit - value.debit : 0,
      expenseSatang: account.type === 'EXPENSE' ? value.debit - value.credit : 0,
    }
  })

  const totalsSummary = rows.reduce((summary, row) => ({
    debit: summary.debit + row.debitBalanceSatang,
    credit: summary.credit + row.creditBalanceSatang,
    revenue: summary.revenue + row.revenueSatang,
    expenses: summary.expenses + row.expenseSatang,
  }), { debit: 0, credit: 0, revenue: 0, expenses: 0 })

  return { rows, totals: { ...totalsSummary, netIncome: totalsSummary.revenue - totalsSummary.expenses } }
}

export type PayrollEmployeeInput = {
  id: string
  code: string | null
  name: string
  email: string | null
  position: string | null
  salarySatang: number | null
}

export type PayrollAdjustment = {
  employeeId: string
  additionsBaht?: string | number
  deductionsBaht?: string | number
  additionsLabel?: string
  deductionsLabel?: string
}

export function calculatePayrollSlips(employees: PayrollEmployeeInput[], adjustments: PayrollAdjustment[]) {
  if (employees.length === 0) throw new Error('ไม่พบพนักงานที่มีเงินเดือนสำหรับสร้างรอบจ่าย')
  const byEmployee = new Map(adjustments.map(item => [item.employeeId, item]))

  return employees.map(employee => {
    const baseSalarySatang = employee.salarySatang ?? 0
    if (!Number.isSafeInteger(baseSalarySatang) || baseSalarySatang <= 0) {
      throw new Error(`กรุณาระบุเงินเดือนให้ ${employee.name} ในข้อมูลพนักงานก่อนสร้างรอบจ่าย`)
    }
    const adjustment = byEmployee.get(employee.id)
    const additionsSatang = amountToSatang(adjustment?.additionsBaht ?? 0)
    const deductionsSatang = amountToSatang(adjustment?.deductionsBaht ?? 0)
    const grossPaySatang = baseSalarySatang + additionsSatang
    const netPaySatang = grossPaySatang - deductionsSatang
    if (netPaySatang < 0) throw new Error(`รายการหักของ ${employee.name} มากกว่าเงินได้รวม`)
    if (!Number.isSafeInteger(grossPaySatang) || grossPaySatang > MAX_SATANG) throw new Error(`ยอดเงินเดือนของ ${employee.name} เกินขอบเขตที่ระบบรองรับ`)

    return {
      employeeId: employee.id,
      employeeCode: employee.code,
      employeeName: employee.name,
      employeeEmail: employee.email?.trim().toLowerCase() ?? null,
      position: employee.position,
      baseSalarySatang,
      additionsSatang,
      additionsLabel: (adjustment?.additionsLabel?.trim() || 'รายรับเพิ่ม').slice(0, 80),
      deductionsSatang,
      deductionsLabel: (adjustment?.deductionsLabel?.trim() || 'รายการหัก').slice(0, 80),
      grossPaySatang,
      netPaySatang,
    }
  })
}
