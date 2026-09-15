'use client'
import { useEffect, useState } from 'react'
import { getCurrentCompany, saveCurrentCompany } from './actions'
const labels = {name:'ชื่อบริษัท',legalName:'ชื่อจดทะเบียน',taxId:'เลขประจำตัวผู้เสียภาษี',address:'ที่อยู่',phone:'เบอร์โทรศัพท์',email:'อีเมลบริษัท'}
type Company = Awaited<ReturnType<typeof getCurrentCompany>>['company']
export default function CompanySettingsPage() {
  const [company,setCompany] = useState<Company | null>(null)
  const [canEdit,setCanEdit] = useState(false)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [saved,setSaved] = useState(false)
  useEffect(()=>{getCurrentCompany().then(data=>{setCompany(data.company);setCanEdit(data.canEdit)}).catch(e=>setError(e.message))},[])
  async function save(e:React.FormEvent) {
    e.preventDefault(); if(!company) return
    setBusy(true);setError('');setSaved(false)
    try {
      const result=await saveCurrentCompany(company)
      if(!result.success) {setError(result.error || 'บันทึกไม่สำเร็จ');return}
      setSaved(true)
      const response=await fetch('/api/auth/me',{cache:'no-store'})
      if(response.ok) {const {user}=await response.json();localStorage.setItem('me_docflow_current_user',JSON.stringify(user));localStorage.setItem('me_docflow_companies',JSON.stringify([{id:user.companyId,companyName:user.companyName,isActive:true}]));window.dispatchEvent(new Event('activeCompanyChanged'))}
    } catch {setError('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง')} finally {setBusy(false)}
  }
  return <div className="mx-auto max-w-4xl space-y-6"><div><p className="text-xs font-bold text-emerald-600">การตั้งค่าระบบ</p><h1 className="mt-2 text-3xl font-bold">ข้อมูลบริษัท</h1><p className="mt-2 text-sm text-gray-500">ข้อมูลบริษัทส่วนกลางสำหรับผู้ใช้งานทุกบัญชีภายในบริษัทเดียวกัน</p></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
    {saved && <p role="status" className="rounded-lg bg-emerald-50 p-4 text-emerald-700">บันทึกข้อมูลบริษัทแล้ว ผู้ใช้ทุกบัญชีในบริษัทจะเห็นข้อมูลเดียวกันเมื่อเปิดหน้าใหม่</p>}
    {!company ? <p>กำลังโหลดข้อมูลบริษัท...</p> : <form onSubmit={save} className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-gray-900"><div className="grid gap-5 md:grid-cols-2">{(Object.keys(labels) as (keyof Company)[]).map(key=><label key={key} className={key==='address'?'md:col-span-2':''}><span className="mb-2 block text-sm font-semibold">{labels[key]}</span><input required={key==='name'} type={key==='email'?'email':'text'} readOnly={!canEdit} value={company[key]} onChange={e=>setCompany({...company,[key]:e.target.value})} className="w-full rounded-lg border p-3 read-only:bg-gray-50 dark:bg-gray-800" /></label>)}</div><div className="mt-6 flex justify-end">{canEdit ? <button disabled={busy} className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy?'กำลังบันทึก...':'บันทึกข้อมูลบริษัท'}</button> : <p className="text-sm text-gray-500">ดูข้อมูลบริษัทได้ แก้ไขได้โดยเจ้าของบริษัทหรือหัวหน้า</p>}</div></form>}
  </div>
}
