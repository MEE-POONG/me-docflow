'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownLeft, ArrowUpRight, BookOpenCheck, CalendarDays, Check, CircleDollarSign, Plus } from 'lucide-react'
import { createAccount, createAccountingEntry, settleAccountingEntry } from './actions'

type AccountRow = { id: string; code: string; name: string; type: string; isActive: boolean }
type JournalLineRow = { accountId: string; accountCode: string; accountName: string; debitSatang: number; creditSatang: number }
type EntryRow = {
  id: string; entryDate: Date; referenceNo: string; entryType: string; status: string; settlementStatus: string
  description: string; counterpartyName: string | null; amountSatang: number; lines: unknown
}
type SummaryRow = AccountRow & { debitBalanceSatang: number; creditBalanceSatang: number; revenueSatang: number; expenseSatang: number }

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
const buttonPrimary = 'inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
const buttonSecondary = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'

function formatMoney(satang: number) {
  return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(satang / 100)
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

function todayInput() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

function entryTypeLabel(type: string) {
  return ({ INCOME: 'รายรับ', EXPENSE: 'รายจ่าย', JOURNAL: 'สมุดรายวัน', SETTLEMENT: 'รับ/จ่ายชำระ', PAYROLL: 'ตั้งเงินเดือน', PAYROLL_PAYMENT: 'จ่ายเงินเดือน' } as Record<string, string>)[type] || type
}

export default function AccountingClient({
  initialAccounts,
  initialEntries,
  trialBalance,
  year,
}: {
  initialAccounts: AccountRow[]
  initialEntries: EntryRow[]
  trialBalance: { rows: SummaryRow[]; totals: { debit: number; credit: number; revenue: number; expenses: number; netIncome: number } }
  year: number
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'entries' | 'accounts'>('overview')
  const [formMode, setFormMode] = useState<'bill' | 'journal' | 'account' | null>(null)
  const [entryType, setEntryType] = useState<'INCOME' | 'EXPENSE' | 'JOURNAL'>('INCOME')
  const [entryDate, setEntryDate] = useState(todayInput)
  const [description, setDescription] = useState('')
  const [counterpartyName, setCounterpartyName] = useState('')
  const [referenceNo, setReferenceNo] = useState('')
  const [amountBaht, setAmountBaht] = useState('')
  const [settlementStatus, setSettlementStatus] = useState<'OPEN' | 'SETTLED'>('SETTLED')
  const [settlementAccountId, setSettlementAccountId] = useState('')
  const [categoryAccountId, setCategoryAccountId] = useState('')
  const [journalLines, setJournalLines] = useState([{ accountId: '', debitBaht: '', creditBaht: '' }, { accountId: '', debitBaht: '', creditBaht: '' }])
  const [accountCode, setAccountCode] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState('EXPENSE')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const accounts = useMemo(() => initialAccounts.filter(account => account.isActive), [initialAccounts])
  const incomeAccounts = accounts.filter(account => account.type === 'REVENUE')
  const expenseAccounts = accounts.filter(account => account.type === 'EXPENSE')
  const cashAccounts = accounts.filter(account => account.type === 'ASSET' && ['1010', '1020'].includes(account.code))
  const detailLines = (raw: unknown) => Array.isArray(raw) ? raw as JournalLineRow[] : []

  const resetEntryForm = () => {
    setDescription(''); setCounterpartyName(''); setReferenceNo(''); setAmountBaht('')
    setSettlementStatus('SETTLED'); setEntryDate(todayInput())
    setCategoryAccountId(entryType === 'INCOME' ? incomeAccounts[0]?.id ?? '' : expenseAccounts[0]?.id ?? '')
    setSettlementAccountId(cashAccounts.find(account => account.code === '1020')?.id ?? cashAccounts[0]?.id ?? '')
    setJournalLines([{ accountId: '', debitBaht: '', creditBaht: '' }, { accountId: '', debitBaht: '', creditBaht: '' }])
  }

  const openForm = (mode: 'bill' | 'journal' | 'account') => {
    setMessage(''); setError(''); setFormMode(mode)
    if (mode === 'bill') {
      setCategoryAccountId(entryType === 'INCOME' ? incomeAccounts[0]?.id ?? '' : expenseAccounts[0]?.id ?? '')
      setSettlementAccountId(cashAccounts.find(account => account.code === '1020')?.id ?? cashAccounts[0]?.id ?? '')
    }
  }

  const submitBill = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMessage('')
    startTransition(async () => {
      const result = await createAccountingEntry({ entryType, entryDate, description, counterpartyName, referenceNo, amountBaht, settlementStatus, settlementAccountId, categoryAccountId })
      if (!result.success) { setError(result.error || 'บันทึกรายการไม่สำเร็จ'); return }
      setMessage('บันทึกรายการและลงบัญชีคู่แล้ว')
      setFormMode(null); resetEntryForm(); router.refresh()
    })
  }

  const submitJournal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMessage('')
    startTransition(async () => {
      const result = await createAccountingEntry({ entryType: 'JOURNAL', entryDate, description, referenceNo, lines: journalLines })
      if (!result.success) { setError(result.error || 'บันทึกสมุดรายวันไม่สำเร็จ'); return }
      setMessage('บันทึกสมุดรายวันแล้ว ยอดเดบิตและเครดิตสมดุล')
      setFormMode(null); resetEntryForm(); router.refresh()
    })
  }

  const submitAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMessage('')
    startTransition(async () => {
      const result = await createAccount({ code: accountCode, name: accountName, type: accountType })
      if (!result.success) { setError(result.error || 'เพิ่มบัญชีไม่สำเร็จ'); return }
      setMessage('เพิ่มบัญชีในผังบัญชีแล้ว'); setAccountCode(''); setAccountName(''); setFormMode(null); router.refresh()
    })
  }

  const handleSettle = (entry: EntryRow) => {
    const select = document.getElementById(`settlement-${entry.id}`) as HTMLSelectElement | null
    if (!select?.value) { setError('เลือกบัญชีเงินสดหรือธนาคารก่อนปิดรายการ'); return }
    setError(''); setMessage('')
    startTransition(async () => {
      const result = await settleAccountingEntry(entry.id, select.value)
      if (!result.success) { setError(result.error || 'ปรับสถานะการรับ/จ่ายไม่สำเร็จ'); return }
      setMessage(entry.entryType === 'INCOME' ? 'บันทึกรับชำระแล้ว' : 'บันทึกจ่ายชำระแล้ว'); router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">บัญชีบริษัท</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">บันทึกรายรับ รายจ่าย และสมุดรายวันด้วยบัญชีคู่ พร้อมตรวจงบทดลองและยอดค้างชำระ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonSecondary} onClick={() => openForm('bill')}><Plus size={16} /> บันทึกบิล</button>
          <button type="button" className={buttonPrimary} onClick={() => openForm('journal')}><BookOpenCheck size={16} /> สมุดรายวัน</button>
        </div>
      </header>

      {(message || error) && <div role={error ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200' : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'}`}>{error || message}</div>}

      {formMode && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{formMode === 'account' ? 'เพิ่มบัญชีในผังบัญชี' : formMode === 'journal' ? 'บันทึกรายการสมุดรายวัน' : 'บันทึกรายรับหรือรายจ่าย'}</h2>
            <button type="button" className={buttonSecondary} onClick={() => { setFormMode(null); setError('') }}>ยกเลิก</button>
          </div>

          {formMode === 'account' ? (
            <form className="grid gap-4 md:grid-cols-4" onSubmit={submitAccount}>
              <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">รหัสบัญชี<input required inputMode="numeric" pattern="[0-9]{3,10}" maxLength={10} className={inputClass} value={accountCode} onChange={event => setAccountCode(event.target.value)} placeholder="เช่น 5030" /></label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">ชื่อบัญชี<input required maxLength={120} className={inputClass} value={accountName} onChange={event => setAccountName(event.target.value)} placeholder="เช่น ค่าเดินทาง" /></label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">หมวดบัญชี<select className={inputClass} value={accountType} onChange={event => setAccountType(event.target.value)}><option value="ASSET">สินทรัพย์</option><option value="LIABILITY">หนี้สิน</option><option value="EQUITY">ส่วนของเจ้าของ</option><option value="REVENUE">รายได้</option><option value="EXPENSE">ค่าใช้จ่าย</option></select></label>
              <div className="flex items-end"><button disabled={isPending} className={`${buttonPrimary} w-full`}>{isPending ? 'กำลังบันทึก…' : 'เพิ่มบัญชี'}</button></div>
            </form>
          ) : (
            <div className="space-y-4">
              {formMode === 'bill' && <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
                <button type="button" onClick={() => { setEntryType('INCOME'); setCategoryAccountId(incomeAccounts[0]?.id ?? '') }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${entryType === 'INCOME' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>รายรับ</button>
                <button type="button" onClick={() => { setEntryType('EXPENSE'); setCategoryAccountId(expenseAccounts[0]?.id ?? '') }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${entryType === 'EXPENSE' ? 'bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>รายจ่าย</button>
              </div>}
              <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={formMode === 'bill' ? submitBill : submitJournal}>
                <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">วันที่รายการ<input type="date" required className={inputClass} value={entryDate} onChange={event => setEntryDate(event.target.value)} /></label>
                <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">เลขที่อ้างอิง <span className="font-normal text-slate-500">(เว้นว่างเพื่อให้ระบบสร้าง)</span><input maxLength={40} className={inputClass} value={referenceNo} onChange={event => setReferenceNo(event.target.value)} placeholder="เช่น INV-2026-001" /></label>
                {formMode === 'bill' && <>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">ลูกค้า / ผู้ขาย<input maxLength={150} className={inputClass} value={counterpartyName} onChange={event => setCounterpartyName(event.target.value)} placeholder="ชื่อคู่ค้า" /></label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">จำนวนเงิน (บาท)<input required type="number" min="0.01" step="0.01" className={inputClass} value={amountBaht} onChange={event => setAmountBaht(event.target.value)} placeholder="0.00" /></label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">บัญชี {entryType === 'INCOME' ? 'รายได้' : 'ค่าใช้จ่าย'}<select required className={inputClass} value={categoryAccountId} onChange={event => setCategoryAccountId(event.target.value)}><option value="">เลือกบัญชี</option>{(entryType === 'INCOME' ? incomeAccounts : expenseAccounts).map(account => <option key={account.id} value={account.id}>{account.code} · {account.name}</option>)}</select></label>
                  <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">สถานะการรับ/จ่าย<select className={inputClass} value={settlementStatus} onChange={event => setSettlementStatus(event.target.value as 'OPEN' | 'SETTLED')}><option value="SETTLED">รับ/จ่ายแล้ว</option><option value="OPEN">ค้างรับ/ค้างจ่าย</option></select></label>
                  {settlementStatus === 'SETTLED' && <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">รับ/จ่ายผ่านบัญชี<select required className={inputClass} value={settlementAccountId} onChange={event => setSettlementAccountId(event.target.value)}>{cashAccounts.map(account => <option key={account.id} value={account.id}>{account.code} · {account.name}</option>)}</select></label>}
                </>}
                <label className={`space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 ${formMode === 'journal' ? 'md:col-span-2 xl:col-span-4' : 'md:col-span-2 xl:col-span-4'}`}>รายละเอียด<input required maxLength={240} className={inputClass} value={description} onChange={event => setDescription(event.target.value)} placeholder={formMode === 'journal' ? 'ระบุเหตุผลและที่มาของรายการ' : 'เช่น รับชำระค่าบริการ / ค่าเช่าสำนักงาน'} /></label>

                {formMode === 'journal' && <div className="md:col-span-2 xl:col-span-4">
                  <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">บรรทัดบัญชี</h3><button type="button" className={buttonSecondary} onClick={() => setJournalLines(lines => [...lines, { accountId: '', debitBaht: '', creditBaht: '' }])}><Plus size={15} /> เพิ่มบรรทัด</button></div>
                  <div className="space-y-2">
                    {journalLines.map((line, index) => <div key={index} className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800 md:grid-cols-[minmax(0,1fr)_160px_160px_auto]">
                      <label className="space-y-1 text-xs text-slate-500">บัญชี<select required className={inputClass} value={line.accountId} onChange={event => setJournalLines(current => current.map((item, i) => i === index ? { ...item, accountId: event.target.value } : item))}><option value="">เลือกบัญชี</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.code} · {account.name}</option>)}</select></label>
                      <label className="space-y-1 text-xs text-slate-500">เดบิต (บาท)<input type="number" min="0" step="0.01" className={inputClass} value={line.debitBaht} onChange={event => setJournalLines(current => current.map((item, i) => i === index ? { ...item, debitBaht: event.target.value, creditBaht: event.target.value ? '' : item.creditBaht } : item))} /></label>
                      <label className="space-y-1 text-xs text-slate-500">เครดิต (บาท)<input type="number" min="0" step="0.01" className={inputClass} value={line.creditBaht} onChange={event => setJournalLines(current => current.map((item, i) => i === index ? { ...item, creditBaht: event.target.value, debitBaht: event.target.value ? '' : item.debitBaht } : item))} /></label>
                      <button type="button" disabled={journalLines.length <= 2} className={`${buttonSecondary} self-end`} onClick={() => setJournalLines(current => current.filter((_, i) => i !== index))} aria-label={`ลบบรรทัดที่ ${index + 1}`}>ลบ</button>
                    </div>)}
                  </div>
                </div>}

                <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-4">
                  <button disabled={isPending} className={buttonPrimary}>{isPending ? 'กำลังบันทึก…' : formMode === 'journal' ? 'ตรวจยอดและบันทึก' : 'บันทึกบิลและลงบัญชีคู่'}</button>
                  <span className="self-center text-xs text-slate-500">{formMode === 'journal' ? 'ระบบตรวจว่าผลรวมเดบิตเท่ากับเครดิตก่อนบันทึก' : 'รายการค้างรับ/ค้างจ่ายจะตั้งลูกหนี้หรือเจ้าหนี้ให้โดยอัตโนมัติ'}</span>
                </div>
              </form>
            </div>
          )}
        </section>
      )}

      <nav className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800" aria-label="ส่วนบัญชี">
        {([['overview', 'งบทดลอง'], ['entries', 'รายการบัญชี'], ['accounts', 'ผังบัญชี']] as const).map(([key, label]) => <button key={key} type="button" onClick={() => setTab(key)} className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${tab === key ? 'border-emerald-700 text-emerald-800 dark:text-emerald-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}>{label}</button>)}
      </nav>

      {tab === 'overview' && <div className="space-y-5">
        <section className="grid gap-x-8 gap-y-4 border-b border-slate-200 pb-5 sm:grid-cols-2 xl:grid-cols-4 dark:border-slate-800">
          <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">ปีบัญชี</p><p className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white"><CalendarDays size={18} className="text-emerald-700" />{year}</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">รายได้สะสม</p><p className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white"><ArrowDownLeft size={18} className="text-emerald-700" />{formatMoney(trialBalance.totals.revenue)} บาท</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">ค่าใช้จ่ายสะสม</p><p className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white"><ArrowUpRight size={18} className="text-rose-700" />{formatMoney(trialBalance.totals.expenses)} บาท</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">กำไร / (ขาดทุน) ตามรายการ</p><p className={`mt-1 flex items-center gap-2 text-lg font-semibold ${trialBalance.totals.netIncome < 0 ? 'text-rose-700' : 'text-slate-900 dark:text-white'}`}><CircleDollarSign size={18} />{formatMoney(trialBalance.totals.netIncome)} บาท</p></div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800"><div><h2 className="font-semibold text-slate-900 dark:text-white">งบทดลอง ณ สิ้นปี {year}</h2><p className="mt-1 text-xs text-slate-500">ยอดยกมาไม่ได้รวมในช่วงนี้ หากมีให้บันทึกเป็นสมุดรายวัน</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${trialBalance.totals.debit === trialBalance.totals.credit ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'}`}>{trialBalance.totals.debit === trialBalance.totals.credit ? 'เดบิต = เครดิต' : 'ยอดไม่สมดุล'}</span></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950"><tr><th className="px-5 py-3">รหัส</th><th className="px-5 py-3">ชื่อบัญชี</th><th className="px-5 py-3 text-right">เดบิต</th><th className="px-5 py-3 text-right">เครดิต</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{trialBalance.rows.filter(row => row.debitBalanceSatang || row.creditBalanceSatang).map(row => <tr key={row.id}><td className="px-5 py-3 font-mono text-xs text-slate-500">{row.code}</td><td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">{row.name}</td><td className="px-5 py-3 text-right tabular-nums">{row.debitBalanceSatang ? formatMoney(row.debitBalanceSatang) : '—'}</td><td className="px-5 py-3 text-right tabular-nums">{row.creditBalanceSatang ? formatMoney(row.creditBalanceSatang) : '—'}</td></tr>)}
                {trialBalance.rows.every(row => !row.debitBalanceSatang && !row.creditBalanceSatang) && <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">ยังไม่มีรายการบัญชีในปีนี้ เริ่มจากบันทึกบิลหรือสมุดรายวัน</td></tr>}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold dark:border-slate-700 dark:bg-slate-950"><tr><td colSpan={2} className="px-5 py-3">รวม</td><td className="px-5 py-3 text-right tabular-nums">{formatMoney(trialBalance.totals.debit)}</td><td className="px-5 py-3 text-right tabular-nums">{formatMoney(trialBalance.totals.credit)}</td></tr></tfoot>
            </table>
          </div>
        </section>
      </div>}

      {tab === 'entries' && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800"><div><h2 className="font-semibold text-slate-900 dark:text-white">รายการบัญชีปี {year}</h2><p className="mt-1 text-xs text-slate-500">แสดงรายการล่าสุดไม่เกิน 500 รายการ</p></div><span className="text-sm text-slate-500">{initialEntries.length} รายการ</span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950"><tr><th className="px-4 py-3">วันที่ / เลขอ้างอิง</th><th className="px-4 py-3">รายการ</th><th className="px-4 py-3">ประเภท</th><th className="px-4 py-3 text-right">จำนวนเงิน</th><th className="px-4 py-3">สถานะ</th><th className="px-4 py-3">บรรทัดบัญชี</th><th className="px-4 py-3">การชำระ</th></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{initialEntries.map(entry => <tr key={entry.id} className="align-top"><td className="px-4 py-3 whitespace-nowrap"><p>{formatDate(entry.entryDate)}</p><p className="mt-1 font-mono text-[11px] text-slate-500">{entry.referenceNo}</p></td><td className="max-w-[240px] px-4 py-3"><p className="font-medium text-slate-800 dark:text-slate-200">{entry.description}</p>{entry.counterpartyName && <p className="mt-1 text-xs text-slate-500">{entry.counterpartyName}</p>}</td><td className="px-4 py-3">{entryTypeLabel(entry.entryType)}</td><td className="px-4 py-3 text-right tabular-nums">{formatMoney(entry.amountSatang)}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${entry.status === 'POSTED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-slate-100 text-slate-600'}`}>{entry.status === 'POSTED' ? 'ลงบัญชีแล้ว' : 'ยกเลิก'}</span></td><td className="px-4 py-3"><details><summary className="cursor-pointer text-xs font-semibold text-emerald-800 dark:text-emerald-300">ดู {detailLines(entry.lines).length} บรรทัด</summary><div className="mt-2 min-w-[260px] space-y-2">{detailLines(entry.lines).map((line, index) => <div key={index} className="flex justify-between gap-4 text-xs"><span>{line.accountCode} · {line.accountName}</span><span className="whitespace-nowrap tabular-nums">{line.debitSatang ? `ด ${formatMoney(line.debitSatang)}` : `ค ${formatMoney(line.creditSatang)}`}</span></div>)}</div></details></td><td className="px-4 py-3">{entry.settlementStatus === 'OPEN' && ['INCOME', 'EXPENSE'].includes(entry.entryType) ? <div className="flex min-w-[180px] items-center gap-2"><select id={`settlement-${entry.id}`} aria-label={`เลือกบัญชีสำหรับ${entry.entryType === 'INCOME' ? 'รับชำระ' : 'จ่ายชำระ'} ${entry.referenceNo}`} className={`${inputClass} py-2 text-xs`}>{cashAccounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select><button type="button" disabled={isPending} className="rounded-lg bg-emerald-700 p-2 text-white hover:bg-emerald-800 disabled:opacity-50" title={entry.entryType === 'INCOME' ? 'บันทึกรับชำระ' : 'บันทึกจ่ายชำระ'} onClick={() => handleSettle(entry)}><Check size={16} /></button></div> : <span className="text-xs text-slate-500">{entry.settlementStatus === 'SETTLED' ? 'ชำระแล้ว' : '—'}</span>}</td></tr>)}
            {initialEntries.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">ยังไม่มีรายการบัญชีในปีนี้</td></tr>}
          </tbody>
        </table></div>
      </section>}

      {tab === 'accounts' && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800"><div><h2 className="font-semibold text-slate-900 dark:text-white">ผังบัญชี</h2><p className="mt-1 text-xs text-slate-500">แบ่งเป็นสินทรัพย์ หนี้สิน ส่วนของเจ้าของ รายได้ และค่าใช้จ่าย</p></div><button type="button" className={buttonSecondary} onClick={() => openForm('account')}><Plus size={16} /> เพิ่มบัญชี</button></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-950"><tr><th className="px-5 py-3">รหัส</th><th className="px-5 py-3">ชื่อบัญชี</th><th className="px-5 py-3">หมวด</th><th className="px-5 py-3">ยอดคงเหลือ</th><th className="px-5 py-3">ประเภทบัญชี</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{trialBalance.rows.map(account => <tr key={account.id}><td className="px-5 py-3 font-mono text-xs text-slate-500">{account.code}</td><td className="px-5 py-3 font-medium">{account.name}</td><td className="px-5 py-3">{({ ASSET: 'สินทรัพย์', LIABILITY: 'หนี้สิน', EQUITY: 'ส่วนของเจ้าของ', REVENUE: 'รายได้', EXPENSE: 'ค่าใช้จ่าย' } as Record<string, string>)[account.type]}</td><td className="px-5 py-3 tabular-nums">{formatMoney(account.debitBalanceSatang || account.creditBalanceSatang)} บาท</td><td className="px-5 py-3 text-xs text-slate-500">{account.debitBalanceSatang ? 'เดบิต' : account.creditBalanceSatang ? 'เครดิต' : '—'}</td></tr>)}</tbody></table></div>
      </section>}

      <p className="text-xs leading-relaxed text-slate-500">ใช้บัญชีคู่พื้นฐานและบันทึกเป็นบาท/สตางค์ ภาษีหัก ณ ที่จ่ายและ VAT ต้องลงบัญชีเองในสมุดรายวัน ระบบยังไม่ยื่นแบบภาษีหรือกระทบยอดธนาคารอัตโนมัติ</p>
      <div className="sr-only" aria-live="polite">{isPending ? 'กำลังดำเนินการ' : ''}</div>
    </div>
  )
}
