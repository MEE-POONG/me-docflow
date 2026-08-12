'use client'

import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'

export function PrintActions({ templates, currentTemplateId, documentId }: { templates: any[], currentTemplateId: string | null, documentId: string }) {
  const [selected, setSelected] = useState(currentTemplateId || '')

  return (
    <div className="flex items-center gap-3">
      {templates.length > 0 && (
        <select 
          value={selected} 
          onChange={e => setSelected(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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
          const url = new URL(window.location.href);
          if (selected) {
            url.searchParams.set('templateId', selected);
          } else {
            url.searchParams.delete('templateId');
          }
          url.searchParams.set('print', 'true');
          window.location.href = url.toString();
        }}
        className="inline-flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-4 py-2 rounded-xl shadow-sm"
      >
        <Printer className="w-4 h-4" /> พิมพ์เอกสาร
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
        .no-print {
          display: none !important;
        }
      }
    `}} />
  )
}
