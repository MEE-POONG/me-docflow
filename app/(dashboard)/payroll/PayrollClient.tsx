'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, CalendarDays, Eye, Printer, Plus, UserRound, Wallet } from 'lucide-react'
import { createPayrollRun, payPayrollRun } from './actions'

type EmployeeRow = { id: string; code: string | null; name: string; email: string | null; position: string | null; salarySatang: number | null }
type AccountRow = { id: string; code: string; name: string; type: string }
type Slip = {
  employeeId?: string; employeeCode: string | null; employeeName: string; employeeEmail?: string | null; position: string | null
  baseSalarySatang: number; additionsSatang: number; additionsLabel: string; deductionsSatang: number; deductionsLabel: string
  grossPaySatang: number; netPaySatang: number
}
type RunRow = { id: string; period: string; payDate: Date; status: string; employeeCount: number; grossPaySatang: number; additionsSatang: number; deductionsSatang: number; netPaySatang: number; slips: unknown }
type OwnSlipRow = { period: string; payDate: Date; status: string; slip: Slip }
type ManagerData = { isManager: true; userName: string; employees: EmployeeRow[]; runs: RunRow[]; accounts: AccountRow[] }
type EmployeeData = { isManager: false; userName: string; ownSlips: OwnSlipRow[] }
type PayrollData = ManagerData | EmployeeData

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
const buttonPrimary = 'inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50'
const buttonSecondary = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'

function money(satang: number) {
  return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(satang / 100)
}

function dateInput() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

function currentPeriod() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function periodLabel(period: string) {
  const [year, month] = period.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
}

function dateLabel(date: Date | string) {
  return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PayrollClient({ data, companyName }: { data: PayrollData; companyName: string }) {
  const router = useRouter()
  const [period, setPeriod] = useState(currentPeriod)
  const [payDate, setPayDate] = useState(dateInput)
  const [adjustments, setAdjustments] = useState<Record<string, { additionsBaht: string; deductionsBaht: string; additionsLabel: string; deductionsLabel: string }>>(() => data.isManager ? Object.fromEntries(data.employees.map(employee => [employee.id, { additionsBaht: '', deductionsBaht: '', additionsLabel: 'รายรับเพิ่ม', deductionsLabel: 'รายการหัก' }])) : {})
  const [paymentAccountId, setPaymentAccountId] = useState(data.isManager ? data.accounts.find(account => account.code === '1020')?.id ?? data.accounts[0]?.id ?? '' : '')
  const [selectedSlip, setSelectedSlip] = useState<{ period: string; payDate: Date | string; status: string; slip: Slip } | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const managerData = data.isManager ? data : null
  const mySlips = data.isManager ? [] : data.ownSlips
  const missingSalary = managerData?.employees.filter(employee => !employee.salarySatang || employee.salarySatang <= 0) ?? []
  const payrollEstimate = useMemo(() => managerData?.employees.reduce((sum, employee) => {
    const adjustment = adjustments[employee.id]
    const base = employee.salarySatang || 0
    const additions = Math.max(0, Math.round((Number(adjustment?.additionsBaht) || 0) * 100))
    const deductions = Math.max(0, Math.round((Number(adjustment?.deductionsBaht) || 0) * 100))
    return { gross: sum.gross + base + additions, deductions: sum.deductions + deductions, net: sum.net + base + additions - deductions }
  }, { gross: 0, deductions: 0, net: 0 }) ?? { gross: 0, deductions: 0, net: 0 }, [managerData, adjustments])

  const openSlip = (periodValue: string, payDateValue: Date | string, status: string, slip: Slip) => {
    setSelectedSlip({ period: periodValue, payDate: payDateValue, status, slip })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submitPayroll = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMessage('')
    if (!managerData) return
    startTransition(async () => {
      const result = await createPayrollRun({
        period,
        payDate,
        adjustments: managerData.employees.map(employee => ({ employeeId: employee.id, ...adjustments[employee.id] })),
      })
      if (!result.success) { setError(result.error || 'สร้างรอบเงินเดือนไม่สำเร็จ'); return }
      setMessage('สร้างสลิปและตั้งรายการเงินเดือนในบัญชีคู่แล้ว')
      setSelectedSlip(null)
      router.refresh()
    })
  }

  const settleRun = (run: RunRow) => {
    if (!paymentAccountId) { setError('เลือกบัญชีธนาคารหรือเงินสดก่อนบันทึกการจ่าย'); return }
    setError(''); setMessage('')
    startTransition(async () => {
      const result = await payPayrollRun(run.id, paymentAccountId)
      if (!result.success) { setError(result.error || 'บันทึกจ่ายเงินเดือนไม่สำเร็จ'); return }
      setMessage(`บันทึกจ่ายเงินเดือนรอบ ${run.period} แล้ว และลงบัญชีการจ่ายเรียบร้อย`)
      router.refresh()
    })
  }

  const printSlip = () => window.print()
  const updateAdjustment = (employeeId: string, key: keyof (typeof adjustments)[string], value: string) => {
    setAdjustments(current => ({ ...current, [employeeId]: { ...current[employeeId], [key]: value } }))
  }

  const renderSlip = (entry: { period: string; payDate: Date | string; status: string; slip: Slip }) => (
    <section className="payroll-print-slip mt-5 rounded-xl border border-slate-200 bg-white p-6 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-700">
        <div><p className="text-sm font-medium text-slate-500">{companyName}</p><h2 className="mt-1 text-xl font-bold">สลิปเงินเดือน</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">งวด {periodLabel(entry.period)} · วันที่จ่าย {dateLabel(entry.payDate)}</p></div>
        <div className="no-print flex gap-2"><button type="button" className={buttonPrimary} onClick={printSlip}><Printer size={16} /> พิมพ์สลิป</button><button type="button" className={buttonSecondary} onClick={() => setSelectedSlip(null)}>ปิด</button></div>
      </div>
      <div className="grid gap-3 border-b border-slate-200 py-5 text-sm sm:grid-cols-2 dark:border-slate-700">
        <div><span className="text-slate-500">พนักงาน</span><p className="mt-1 font-semibold">{entry.slip.employeeName}</p></div>
        <div><span className="text-slate-500">รหัสพนักงาน</span><p className="mt-1 font-semibold">{entry.slip.employeeCode || '—'}</p></div>
        <div><span className="text-slate-500">ตำแหน่ง</span><p className="mt-1 font-semibold">{entry.slip.position || '—'}</p></div>
        <div><span className="text-slate-500">สถานะรอบจ่าย</span><p className="mt-1 font-semibold">{entry.status === 'PAID' ? 'จ่ายแล้ว' : 'ตั้งยอดรอจ่าย'}</p></div>
      </div>
      <div className="space-y-3 py-5 text-sm">
        <div className="flex justify-between gap-4"><span>เงินเดือนพื้นฐาน</span><span className="tabular-nums">{money(entry.slip.baseSalarySatang)} บาท</span></div>
        {entry.slip.additionsSatang > 0 && <div className="flex justify-between gap-4"><span>{entry.slip.additionsLabel}</span><span className="tabular-nums">{money(entry.slip.additionsSatang)} บาท</span></div>}
        <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 font-semibold dark:border-slate-700"><span>รวมเงินได้</span><span className="tabular-nums">{money(entry.slip.grossPaySatang)} บาท</span></div>
        {entry.slip.deductionsSatang > 0 && <div className="flex justify-between gap-4 text-rose-700 dark:text-rose-300"><span>{entry.slip.deductionsLabel}</span><span className="tabular-nums">−{money(entry.slip.deductionsSatang)} บาท</span></div>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-emerald-800 bg-emerald-50 px-4 py-4 dark:border-emerald-500 dark:bg-emerald-950/50"><span className="font-semibold">เงินรับสุทธิ</span><span className="text-xl font-bold tabular-nums">{money(entry.slip.netPaySatang)} บาท</span></div>
      <p className="mt-5 text-xs text-slate-500">รายการหักคำนวณจากข้อมูลที่บริษัทบันทึก ระบบยังไม่คำนวณภาษีเงินได้หรือประกันสังคมอัตโนมัติ</p>
    </section>
  )

  return <div className="payroll-root space-y-6">
    <header>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">เงินเดือนและสลิป</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">{managerData ? 'สร้างรอบจ่ายเงินเดือน พิมพ์สลิป และลงรายการเงินเดือนในบัญชีคู่' : `สวัสดี ${data.userName} ดูสลิปเงินเดือนส่วนตัวของคุณได้ที่นี่`}</p>
    </header>

    {(error || message) && <div role={error ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200' : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'}`}>{error || message}</div>}

    {selectedSlip && renderSlip(selectedSlip)}

    {managerData && <>
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">สร้างรอบจ่าย</h2><p className="mt-1 text-sm text-slate-500">บันทึกสลิปและตั้งเงินเดือนค้างจ่ายให้บัญชีโดยอัตโนมัติ</p></div><div className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays size={16} /> จ่ายให้พนักงาน {managerData.employees.length} คน</div></div>
        {missingSalary.length > 0 && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">ต้องกำหนดเงินเดือนในข้อมูลพนักงานก่อน: {missingSalary.map(employee => employee.name).join(', ')}</p>}
        {managerData.employees.length === 0 ? <div className="rounded-lg bg-slate-50 px-4 py-8 text-center dark:bg-slate-950"><UserRound className="mx-auto text-slate-400" /><p className="mt-2 font-medium">ยังไม่มีพนักงานที่ใช้งานได้</p><p className="mt-1 text-sm text-slate-500">เพิ่มพนักงานและกำหนดเงินเดือนก่อนสร้างรอบจ่าย</p></div> : <form onSubmit={submitPayroll} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">รอบเดือน<input required type="month" className={inputClass} value={period} onChange={event => setPeriod(event.target.value)} /></label><label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">วันที่จ่าย<input required type="date" className={inputClass} value={payDate} onChange={event => setPayDate(event.target.value)} /></label></div>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-950"><tr><th className="px-4 py-3">พนักงาน</th><th className="px-4 py-3 text-right">เงินเดือน</th><th className="px-4 py-3">รายการเพิ่ม</th><th className="px-4 py-3">รายการหัก</th><th className="px-4 py-3 text-right">สุทธิ</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{managerData.employees.map(employee => {
            const adjustment = adjustments[employee.id]
            const base = employee.salarySatang || 0
            const additions = Math.max(0, Math.round((Number(adjustment?.additionsBaht) || 0) * 100))
            const deductions = Math.max(0, Math.round((Number(adjustment?.deductionsBaht) || 0) * 100))
            return <tr key={employee.id}><td className="px-4 py-3"><p className="font-medium text-slate-900 dark:text-slate-100">{employee.name}</p><p className="mt-1 text-xs text-slate-500">{employee.code || 'ไม่มีรหัส'}{employee.position ? ` · ${employee.position}` : ''}</p></td><td className="px-4 py-3 text-right tabular-nums">{base ? `${money(base)} บาท` : <span className="text-rose-700">ยังไม่กำหนด</span>}</td><td className="px-4 py-3"><div className="flex min-w-[210px] gap-2"><input aria-label={`รายรับเพิ่มของ ${employee.name}`} className={inputClass} type="number" min="0" step="0.01" placeholder="0.00 บาท" value={adjustment?.additionsBaht ?? ''} onChange={event => updateAdjustment(employee.id, 'additionsBaht', event.target.value)} /><input aria-label={`ชื่อรายการเพิ่มของ ${employee.name}`} className={`${inputClass} max-w-[130px]`} maxLength={80} value={adjustment?.additionsLabel ?? ''} onChange={event => updateAdjustment(employee.id, 'additionsLabel', event.target.value)} /></div></td><td className="px-4 py-3"><div className="flex min-w-[210px] gap-2"><input aria-label={`รายการหักของ ${employee.name}`} className={inputClass} type="number" min="0" step="0.01" placeholder="0.00 บาท" value={adjustment?.deductionsBaht ?? ''} onChange={event => updateAdjustment(employee.id, 'deductionsBaht', event.target.value)} /><input aria-label={`ชื่อรายการหักของ ${employee.name}`} className={`${inputClass} max-w-[130px]`} maxLength={80} value={adjustment?.deductionsLabel ?? ''} onChange={event => updateAdjustment(employee.id, 'deductionsLabel', event.target.value)} /></div></td><td className="px-4 py-3 text-right font-semibold tabular-nums">{money(base + additions - deductions)} บาท</td></tr>
          })}</tbody><tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold dark:border-slate-700 dark:bg-slate-950"><tr><td className="px-4 py-3">รวมสุทธิ</td><td colSpan={3} className="px-4 py-3 text-right text-xs font-normal text-slate-500">เงินได้ {money(payrollEstimate.gross)} · รายการหัก {money(payrollEstimate.deductions)}</td><td className="px-4 py-3 text-right tabular-nums">{money(payrollEstimate.net)} บาท</td></tr></tfoot></table></div>
          <div className="flex flex-wrap items-center gap-3"><button disabled={isPending || managerData.employees.length === 0 || missingSalary.length > 0 || payrollEstimate.net < 0} className={buttonPrimary}><Plus size={16} />{isPending ? 'กำลังสร้างรอบจ่าย…' : 'สร้างสลิปและลงบัญชี'}</button><span className="text-xs text-slate-500">ตรวจยอดเงินและรายการหักก่อนบันทึก รอบเดียวกันสร้างได้ครั้งเดียว</span></div>
        </form>}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800"><div><h2 className="font-semibold text-slate-900 dark:text-white">ประวัติรอบจ่าย</h2><p className="mt-1 text-xs text-slate-500">สลิปเก็บค่าเงินเดือน ณ วันที่สร้างรอบ</p></div><label className="flex items-center gap-2 text-xs text-slate-500"><Wallet size={15} />บัญชีสำหรับจ่าย<select className={`${inputClass} min-w-[180px] py-2`} value={paymentAccountId} onChange={event => setPaymentAccountId(event.target.value)}>{managerData.accounts.map(account => <option key={account.id} value={account.id}>{account.code} · {account.name}</option>)}</select></label></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-950"><tr><th className="px-4 py-3">รอบจ่าย</th><th className="px-4 py-3">วันที่จ่าย</th><th className="px-4 py-3 text-right">พนักงาน</th><th className="px-4 py-3 text-right">เงินได้รวม</th><th className="px-4 py-3 text-right">รายการหัก</th><th className="px-4 py-3 text-right">สุทธิ</th><th className="px-4 py-3">สถานะ / การทำงาน</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{managerData.runs.map(run => {
          const slips = Array.isArray(run.slips) ? run.slips as Slip[] : []
          return <tr key={run.id}><td className="px-4 py-3 font-medium">{periodLabel(run.period)}</td><td className="px-4 py-3">{dateLabel(run.payDate)}</td><td className="px-4 py-3 text-right">{run.employeeCount}</td><td className="px-4 py-3 text-right tabular-nums">{money(run.grossPaySatang)}</td><td className="px-4 py-3 text-right tabular-nums">{money(run.deductionsSatang)}</td><td className="px-4 py-3 text-right font-semibold tabular-nums">{money(run.netPaySatang)}</td><td className="px-4 py-3"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${run.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'}`}>{run.status === 'PAID' ? 'จ่ายแล้ว' : 'รอจ่าย'}</span>{slips.length > 0 && <><select id={`slip-${run.id}`} aria-label={`เลือกสลิปในรอบ ${run.period}`} className={`${inputClass} w-[170px] py-2 text-xs`}>{slips.map((slip, index) => <option key={`${slip.employeeId || slip.employeeName}-${index}`} value={index}>{slip.employeeName}</option>)}</select><button type="button" className={buttonSecondary} onClick={() => { const select = document.getElementById(`slip-${run.id}`) as HTMLSelectElement | null; const slip = slips[Number(select?.value) || 0]; if (slip) openSlip(run.period, run.payDate, run.status, slip) }}><Eye size={14} /> ดูสลิป</button></>}{run.status === 'POSTED' && <button type="button" disabled={isPending} className={`${buttonPrimary} py-2`} onClick={() => settleRun(run)}><Banknote size={15} /> บันทึกจ่าย</button>}</div></td></tr>
        })}{managerData.runs.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">ยังไม่มีรอบจ่ายเงินเดือน</td></tr>}</tbody></table></div>
      </section>
      <p className="text-xs leading-relaxed text-slate-500">ตัวเลขภาษีหัก ณ ที่จ่าย ประกันสังคม และรายการหักอื่นต้องตรวจสอบและกรอกโดยผู้ดูแลเงินเดือน ระบบยังไม่คำนวณตามกฎหมายหรือส่งข้อมูลให้หน่วยงานภายนอก</p>
    </>}

    {!managerData && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800"><h2 className="font-semibold text-slate-900 dark:text-white">สลิปของฉัน</h2><p className="mt-1 text-xs text-slate-500">ข้อมูลส่วนตัวนี้แสดงเฉพาะสลิปที่ตรงกับอีเมลบัญชีของคุณ</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-950"><tr><th className="px-5 py-3">รอบจ่าย</th><th className="px-5 py-3">วันที่จ่าย</th><th className="px-5 py-3 text-right">สุทธิ</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3">สลิป</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{mySlips.map(row => <tr key={row.period}><td className="px-5 py-3 font-medium">{periodLabel(row.period)}</td><td className="px-5 py-3">{dateLabel(row.payDate)}</td><td className="px-5 py-3 text-right font-semibold tabular-nums">{money(row.slip.netPaySatang)} บาท</td><td className="px-5 py-3">{row.status === 'PAID' ? 'จ่ายแล้ว' : 'รอจ่าย'}</td><td className="px-5 py-3"><button type="button" className={buttonSecondary} onClick={() => openSlip(row.period, row.payDate, row.status, row.slip)}><Eye size={15} /> ดู / พิมพ์</button></td></tr>)}{mySlips.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">ยังไม่มีสลิปที่ผูกกับอีเมลบัญชีนี้</td></tr>}</tbody></table></div>
    </section>}
    <div className="sr-only" aria-live="polite">{isPending ? 'กำลังดำเนินการ' : ''}</div>
  </div>
}
