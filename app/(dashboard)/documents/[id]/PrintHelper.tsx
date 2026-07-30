'use client'

import { useEffect } from 'react'
import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button 
      type="button" 
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-4 py-2 rounded-xl shadow-sm"
    >
      <Printer className="w-4 h-4" /> พิมพ์เอกสาร
    </button>
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
