'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signDocument } from '@/app/actions/document-signing'
import { getDocumentActor } from '@/lib/document-actor'

export function SignDocumentButton({ documentId, version, templateId, inlineSignature = false, signatureRole = 'approver', autoOpen = false, allowedSignerEmail }: { documentId: string; version: string; templateId: string; inlineSignature?: boolean; signatureRole?: 'submitter' | 'approver'; autoOpen?: boolean; allowedSignerEmail?: string }) {
  const router = useRouter()
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [open, setOpen] = useState(false)
  const [ink, setInk] = useState(false)
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [canSign, setCanSign] = useState(!allowedSignerEmail)
  useEffect(() => {
    if (!allowedSignerEmail) return
    const actor = getDocumentActor()
    const allowed = actor.userEmail.trim().toLowerCase() === allowedSignerEmail.trim().toLowerCase()
    setCanSign(allowed)
    if (allowed && autoOpen) setOpen(true)
  }, [allowedSignerEmail, autoOpen])
  useEffect(() => {
    if (autoOpen && !allowedSignerEmail) setOpen(true)
  }, [autoOpen, allowedSignerEmail])
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return [(event.clientX - rect.left) * 800 / rect.width, (event.clientY - rect.top) * 320 / rect.height]
  }
  if (!canSign) return null
  const isSubmitter = signatureRole === 'submitter'
  return <>
    <button type="button" onClick={() => setOpen(true)} className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white">{isSubmitter ? 'ลงนามผู้ยื่น' : 'เซ็นอนุมัติ'}</button>
    {open && <div role="dialog" aria-modal="true" aria-labelledby="sign-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 no-print">
      <form className="w-full max-w-xl space-y-4 rounded-xl bg-white p-6 text-gray-900 shadow-xl" onSubmit={async event => {
        event.preventDefault()
        if (!ink || !canvas.current) { setError('กรุณาวาดลายเซ็น'); return }
        setBusy(true); setError('')
        try {
          const result = await signDocument({ ...getDocumentActor(), documentId, version, templateId, image: canvas.current.toDataURL('image/png'), password, consent, signatureRole })
          if (!result.success) { setError(result.error || 'ลงนามไม่สำเร็จ'); return }
          setOpen(false); setPassword('')
          if (isSubmitter) router.replace(`/documents/${documentId}`)
          window.dispatchEvent(new Event('documentsChanged'))
          router.refresh()
        } catch { setError('เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง') } finally { setBusy(false) }
      }}>
        <h2 id="sign-title" className="text-xl font-bold">{isSubmitter ? 'ลงนามผู้ยื่นขออนุมัติ' : 'เซ็นอนุมัติเอกสาร'}</h2>
        <p className="text-sm text-gray-600">{isSubmitter
          ? `วาดลายเซ็นในช่องด้านล่าง ${inlineSignature ? 'ลายเซ็นจะแสดงเหนือช่องผู้เสนอราคาในเอกสารหน้าเดียวกัน' : 'บันทึกการลงนามจะแสดงในเอกสารและ PDF'}`
          : `${inlineSignature ? 'ลายเซ็นจะแสดงในช่องผู้อนุมัติบนเอกสาร' : 'บันทึกการลงนามจะอยู่หน้าท้ายของ PDF'} เมื่อยืนยัน ระบบจะอนุมัติเอกสารและล็อกการแก้ไข`}</p>
        <canvas ref={canvas} width={800} height={320} aria-label="ช่องวาดลายเซ็น" className="w-full touch-none rounded-lg border-2 border-gray-300 bg-white" onPointerDown={event => {
          if (busy) return
          drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId)
          const context = event.currentTarget.getContext('2d')!; const [x, y] = point(event)
          context.strokeStyle = '#172554'; context.lineWidth = 3; context.lineCap = 'round'; context.beginPath(); context.moveTo(x, y)
        }} onPointerMove={event => {
          if (!drawing.current) return
          const context = event.currentTarget.getContext('2d')!; const [x, y] = point(event)
          context.lineTo(x, y); context.stroke(); setInk(true)
        }} onPointerUp={() => { drawing.current = false }} onPointerCancel={() => { drawing.current = false }} />
        <button type="button" disabled={busy} onClick={() => { canvas.current?.getContext('2d')?.clearRect(0, 0, 800, 320); setInk(false) }} className="text-sm text-blue-700">ล้างลายเซ็น</button>
        <label className="block text-sm">รหัสผ่านบัญชีเพื่อยืนยันผู้ลงนาม<input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full rounded border p-2" /></label>
        <label className="flex items-start gap-2 text-sm"><input required type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} />ฉันได้ตรวจเอกสารและยืนยันลงนามด้วยลายเซ็นนี้</label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={() => { setOpen(false); setPassword(''); setInk(false); setConsent(false) }}>ยกเลิก</button><button disabled={busy || !ink} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'กำลังลงนาม...' : isSubmitter ? 'ยืนยันลงนาม' : 'ยืนยันเซ็นอนุมัติ'}</button></div>
      </form>
    </div>}
  </>
}
