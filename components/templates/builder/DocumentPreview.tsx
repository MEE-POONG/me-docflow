'use client'

import React, { CSSProperties } from 'react'
import { 
  type DesignerElement, 
  type DesignerPage,
  renderElementContent,
  sampleDocumentData 
} from '@/lib/document-designer'

type DocumentPreviewProps = {
  layoutJsonString: string | null
}

export function DocumentPreview({ layoutJsonString }: DocumentPreviewProps) {
  if (!layoutJsonString) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">ไม่มีข้อมูลเทมเพลต (Preview unavailable)</p>
      </div>
    )
  }

  let layoutData: { pages: DesignerPage[], elements: DesignerElement[] } | null = null
  try {
    layoutData = JSON.parse(layoutJsonString)
  } catch (e) {
    return (
      <div className="bg-red-50 p-4 rounded-xl border border-red-200">
        <p className="text-red-500">รูปแบบเทมเพลตไม่ถูกต้อง (Invalid Layout JSON)</p>
      </div>
    )
  }

  if (!layoutData || !layoutData.pages || layoutData.pages.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">เทมเพลตหน้าว่าง (Empty template)</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8 py-8 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-auto p-4 border border-gray-200 dark:border-gray-800">
      {layoutData.pages.map(page => (
        <div 
          key={page.id}
          className="relative bg-white shadow-md overflow-hidden"
          style={{
            width: `${page.width}px`,
            height: `${page.height}px`,
            background: page.background || '#ffffff'
          }}
        >
          {layoutData.elements.filter(el => el.pageId === page.id).map(element => (
            <ElementView key={element.id} element={element} />
          ))}
        </div>
      ))}
    </div>
  )
}

function ElementView({ element }: { element: DesignerElement }) {
  const baseStyle: CSSProperties = {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    ...element.style
  }

  const content = renderElementContent(element, sampleDocumentData)

  switch (element.type) {
    case 'text':
    case 'heading':
    case 'paragraph':
    case 'dynamicField':
      return <div style={{ ...baseStyle, wordBreak: 'break-word' }}>{content}</div>
    case 'image':
    case 'logo':
      return (
        <div style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
          {element.type === 'logo' ? 'LOGO' : 'IMAGE'}
        </div>
      )
    case 'box':
      return <div style={{ ...baseStyle, border: '1px solid #000' }} />
    case 'line':
      return <div style={{ ...baseStyle, backgroundColor: '#000' }} />
    case 'table':
      return (
        <div style={{ ...baseStyle, border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {content}
        </div>
      )
    default:
      return <div style={baseStyle}>{content}</div>
  }
}
