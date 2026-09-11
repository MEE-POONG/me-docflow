'use client'

import { useEffect, useRef, useState } from 'react'
import { getDocumentActor } from '@/lib/document-actor'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, Printer } from 'lucide-react'

type PrintTemplate = {
  id: string
  name: string
}

export function PrintActions({ templates, currentTemplateId, documentId, documentTypeName = 'เอกสาร', documentNo = 'document' }: { templates: PrintTemplate[], currentTemplateId: string | null, documentId: string, documentTypeName?: string, documentNo?: string }) {
  const [selected, setSelected] = useState(currentTemplateId || '')
  const router = useRouter()
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button type="button" disabled={exporting} className="h-9 rounded-md bg-red-600 px-4 text-sm font-medium text-white disabled:opacity-50" onClick={async () => {
        setExporting(true); setExportError('')
        try {
          const response = await fetch('/api/documents/' + documentId + '/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...getDocumentActor(), templateId: selected }) })
          if (!response.ok) throw new Error((await response.json()).error || 'ส่งออก PDF ไม่สำเร็จ')
          const url = URL.createObjectURL(await response.blob())
          const link = document.createElement('a'); link.href = url; link.download = documentNo + '.pdf'; link.click()
          setTimeout(() => URL.revokeObjectURL(url), 60000)
        } catch (error) { setExportError(error instanceof Error ? error.message : 'ส่งออก PDF ไม่สำเร็จ') }
        finally { setExporting(false) }
      }}>{exporting ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF'}</button>
      {exportError && <p role="alert" className="text-sm text-red-600">{exportError}</p>}
      {templates.length > 0 && (
        <select 
          value={selected} 
          onChange={e => {
            setSelected(e.target.value)
            const url = new URL(`/documents/${documentId}`, window.location.origin)
            url.searchParams.set('templateId', e.target.value)
            router.replace(url.pathname + url.search, { scroll: false })
          }}
          className="h-9 min-w-52 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          <option value="">{documentTypeName} — แบบฟอร์มมาตรฐาน</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>{documentTypeName} — {t.name}</option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={() => {
          const url = new URL(`/documents/${documentId}`, window.location.origin)
          url.searchParams.set('templateId', selected)
          url.searchParams.set('preview', 'true')
          window.open(url.toString(), '_blank', 'noopener,noreferrer')
        }}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-300 bg-white px-3.5 text-sm font-medium text-emerald-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-gray-900 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
      >
        <Eye className="w-4 h-4" /> พรีวิวเอกสาร
      </button>
      <button 
        type="button" 
        onClick={() => {
          const url = new URL(window.location.href);
          if (selected) {
            url.searchParams.set('templateId', selected);
          } else {
            url.searchParams.set('templateId', '');
          }
          url.searchParams.set('print', 'true');
          window.location.href = url.toString();
        }}
        className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        <Printer className="w-4 h-4" /> พิมพ์เอกสาร
      </button>
    </div>
  )
}

async function waitForPrintContent() {
  await document.fonts.ready
  const images = Array.from(document.querySelectorAll<HTMLImageElement>('.print-section img'))
  await Promise.allSettled(images.map(image => image.decode()))
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

export function PreviewActions() {
  const [preparing, setPreparing] = useState(false)
  return (
    <div className="no-print sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <button
        type="button"
        onClick={() => window.close()}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        <ArrowLeft className="h-4 w-4" /> กลับไปหน้าเอกสาร
      </button>
      <div className="hidden text-center sm:block">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">พรีวิวเอกสารก่อนพิมพ์</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">ตรวจสอบข้อมูลและรูปแบบเอกสารให้เรียบร้อย</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          setPreparing(true)
          try {
            await waitForPrintContent()
            window.print()
          } finally {
            setPreparing(false)
          }
        }}
        disabled={preparing}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
      >
        <Printer className="h-4 w-4" /> {preparing ? 'กำลังเตรียมเอกสาร...' : 'พิมพ์เอกสาร'}
      </button>
    </div>
  )
}

export function PrintHelper() {
  const printed = useRef(false)
  useEffect(() => {
    let cancelled = false
    waitForPrintContent().then(() => {
      if (!cancelled && !printed.current) {
        printed.current = true
        window.print()
      }
    })
    return () => { cancelled = true }
  }, [])
  return null
}
