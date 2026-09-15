'use client'
import { useState } from 'react'
import { Users, X, Loader2 } from 'lucide-react'
import { getDocumentAccess, saveDocumentAccess } from '@/app/actions/document-access'

type Access = Awaited<ReturnType<typeof getDocumentAccess>>
export default function DocumentAccessButton({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<Access | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  async function show() {
    setOpen(true); setData(null); setError(''); setSearch(''); setBusy(true)
    try { const result = await getDocumentAccess(id); setData(result); setSelected(result.selected || []) }
    catch (e) { setError(e instanceof Error ? e.message : 'โหลดรายชื่อไม่สำเร็จ') }
    finally { setBusy(false) }
  }
  async function save() {
    if (!data) return
    setBusy(true); setError('')
    try {
      const result = await saveDocumentAccess(id, selected, data.version)
      if (!result.success) { setError(result.error || 'บันทึกไม่สำเร็จ'); return }
      setOpen(false); window.dispatchEvent(new Event('documentsChanged'))
    } catch { setError('บันทึกไม่สำเร็จ กรุณาลองใหม่') }
    finally { setBusy(false) }
  }
  return <>
    <button type="button" onClick={show} title="สิทธิ์การเข้าถึง" className="inline-flex items-center gap-1 rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"><Users className="h-4 w-4" /><span className="text-xs">สิทธิ์การเข้าถึง</span></button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 whitespace-normal text-left" onKeyDown={e => { if (e.key === 'Escape' && !busy) setOpen(false) }}>
      <section role="dialog" aria-modal="true" aria-labelledby={'access-title-' + id} className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4"><div><h2 id={'access-title-' + id} className="text-lg font-bold">สิทธิ์การเข้าถึงเอกสาร</h2><p className="mt-1 text-sm text-gray-500">{title}</p></div><button aria-label="ปิด" disabled={busy} onClick={() => setOpen(false)}><X /></button></div>
        <p className="my-4 text-sm text-gray-600 dark:text-gray-300">เลือกผู้ร่วมจัดทำเพื่อแก้ไขเอกสารร่าง ลงนามผู้ยื่น และยื่นขออนุมัติ สิทธิ์นี้ไม่รวมการอนุมัติ ลบเอกสาร หรือจัดการสิทธิ์</p>
        <p className="mb-3 text-xs text-gray-500">เอกสารแสดงเฉพาะแผนกของผู้สร้าง ผู้ร่วมจัดทำต้องอยู่ในแผนกเดียวกัน</p>
        <input aria-label="ค้นหาพนักงาน" autoFocus placeholder="ค้นหาชื่อ อีเมล หรือแผนก" value={search} onChange={e => setSearch(e.target.value)} className="mb-3 w-full rounded-lg border p-2 dark:bg-gray-800" />
        {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="min-h-24 overflow-y-auto">
          {busy && !data && <Loader2 className="mx-auto animate-spin" />}
          {data && data.employees.filter(u => (u.name + ' ' + u.email + ' ' + (u.department?.name || '')).toLowerCase().includes(search.toLowerCase())).map(u => {
            const manager = u.id === data.createdById || u.role === 'OWNER' || u.position === 'หัวหน้า'
            return <label key={u.id} className="flex items-center gap-3 border-b border-gray-100 py-3">
              <input type="checkbox" disabled={manager || busy} checked={manager || selected.includes(u.id)} onChange={e => setSelected(old => e.target.checked ? [...old, u.id] : old.filter(id => id !== u.id))} className="h-4 w-4 accent-emerald-600" />
              <span className="min-w-0 flex-1"><span className="block font-medium">{u.name}</span><span className="block break-all text-xs text-gray-500">{u.email} · {u.department?.name || 'ยังไม่ระบุแผนก'}</span></span>
              <span className="text-xs text-gray-500">{manager ? 'ผู้จัดการเอกสาร' : 'ผู้ร่วมจัดทำ'}</span>
            </label>
          })}
          {data && data.employees.length === 0 && <p className="py-6 text-center text-gray-500">ไม่มีพนักงานที่เปิดใช้งานในแผนกนี้</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2"><button disabled={busy} onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2">ยกเลิก</button><button disabled={busy || !data} onClick={save} className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'กำลังดำเนินการ...' : 'บันทึกสิทธิ์'}</button></div>
      </section>
    </div>}
  </>
}
