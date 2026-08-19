'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Eye, Printer } from 'lucide-react'

type PrintTemplate = {
  id: string
  name: string
}

export function PrintActions({ templates, currentTemplateId, documentId }: { templates: PrintTemplate[], currentTemplateId: string | null, documentId: string }) {
  const [selected, setSelected] = useState(currentTemplateId || '')

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {templates.length > 0 && (
        <select 
          value={selected} 
          onChange={e => setSelected(e.target.value)}
          className="h-10 min-w-52 px-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">-- รูปแบบมาตรฐาน --</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={() => {
          const url = new URL(`/documents/${documentId}`, window.location.origin)
          if (selected) url.searchParams.set('templateId', selected)
          url.searchParams.set('preview', 'true')
          window.open(url.toString(), '_blank', 'noopener,noreferrer')
        }}
        className="inline-flex h-10 items-center gap-2 px-4 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-sm dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/50"
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
            url.searchParams.delete('templateId');
          }
          url.searchParams.set('print', 'true');
          window.location.href = url.toString();
        }}
        className="inline-flex h-10 items-center gap-2 px-4 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-lg transition-colors shadow-sm"
      >
        <Printer className="w-4 h-4" /> พิมพ์เอกสาร
      </button>
    </div>
  )
}

export function PreviewActions() {
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
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
      >
        <Printer className="h-4 w-4" /> พิมพ์เอกสาร
      </button>
    </div>
  )
}

export function PrintHelper() {
  useEffect(() => {
    // Wait for a short moment to ensure everything is rendered, then trigger print
    const timer = setTimeout(() => {
      window.print()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <style dangerouslySetInnerHTML={{__html: `
      @media print {
        body, html, main, div {
          height: auto !important;
          overflow: visible !important;
        }
        body * {
          visibility: hidden;
        }
        .print-section, .print-section * {
          visibility: visible;
        }
        .print-section {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
          background: white !important;
        }
        .print-section > div {
          background: transparent !important;
          padding: 0 !important;
          border: none !important;
          border-radius: 0 !important;
          gap: 0 !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `}} />
  )
}
