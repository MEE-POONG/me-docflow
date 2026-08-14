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
  dataOverride?: Record<string, any>
}

/**
 * Templates persist per-element text styling (fontSize, fontWeight, color, textAlign)
 * as sibling fields on the element, not nested under `element.style` — the shared
 * DesignerElement type only declares `style`, which is always undefined in real data.
 */
type StyledDesignerElement = DesignerElement & {
  fontSize?: number | string
  fontWeight?: string | number
  color?: string
  textAlign?: CSSProperties['textAlign']
  tableColumns?: { label: string; field: string; width?: number; align?: 'left' | 'center' | 'right' }[]
  tableHeaderBold?: boolean
  tableHeaderBg?: string
  tableShowTotalRow?: boolean
  tableTotalLabel?: string
}

const tableCellStyle: CSSProperties = {
  border: '1px solid #000',
  padding: '4px 6px',
  textAlign: 'left',
}

function tableCellValue(field: string, item: any, idx: number) {
  switch (field) {
    case 'index':
      return idx + 1
    case 'total':
      return (Number(item.qty || 0) * Number(item.unitPrice || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    case 'unitPrice':
      return Number(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    default:
      return item[field] ?? '-'
  }
}

const RIGHT_ALIGNED_FIELDS = new Set(['qty', 'unitPrice', 'total'])

export function DocumentPreview({ layoutJsonString, dataOverride }: DocumentPreviewProps) {
  if (!layoutJsonString) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">ไม่มีข้อมูลเทมเพลต (Preview unavailable)</p>
      </div>
    )
  }

  let layoutData: { pages: DesignerPage[], elements: StyledDesignerElement[] } | null = null
  try {
    layoutData = JSON.parse(layoutJsonString)
  } catch (e) {
    return (
      <div className="bg-red-50 p-4 rounded-xl border border-red-200">
        <p className="text-red-500">รูปแบบเทมเพลตไม่ถูกต้อง (Invalid Layout JSON)</p>
      </div>
    )
  }

  if (!layoutData || (!layoutData.pages && !layoutData.elements)) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">เทมเพลตหน้าว่าง (Empty template)</p>
      </div>
    )
  }

  // Fallback for older layouts that only have elements
  const pages = layoutData.pages && layoutData.pages.length > 0 
    ? layoutData.pages 
    : [{ id: 'default-page', width: 595, height: 842, background: '#ffffff' } as DesignerPage];

  return (
    <div className="flex flex-col items-center gap-8 py-8 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-auto p-4 border border-gray-200 dark:border-gray-800">
      {pages.map(page => (
        <div 
          key={page.id}
          className="relative bg-white shadow-md overflow-hidden"
          style={{
            width: `${page.width}px`,
            height: `${page.height}px`,
            background: page.background || '#ffffff'
          }}
        >
          {(layoutData?.elements || []).filter(el => !el.pageId || el.pageId === page.id).map(element => (
            <ElementView key={element.id} element={element} dataOverride={dataOverride} />
          ))}
        </div>
      ))}
    </div>
  )
}

function ElementView({ element, dataOverride }: { element: StyledDesignerElement, dataOverride?: Record<string, any> }) {
  const baseStyle: CSSProperties = {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    ...(element.fontSize !== undefined && { fontSize: typeof element.fontSize === 'number' ? `${element.fontSize}px` : element.fontSize }),
    ...(element.fontWeight !== undefined && { fontWeight: element.fontWeight }),
    ...(element.color !== undefined && { color: element.color }),
    ...(element.textAlign !== undefined && { textAlign: element.textAlign }),
    ...element.style
  }

  const dataToUse = dataOverride ? { ...sampleDocumentData, ...dataOverride } : sampleDocumentData;
  const content = renderElementContent(element, dataToUse)

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
    case 'table': {
      const items = Array.isArray(dataToUse.items) ? dataToUse.items : []
      if (items.length === 0) {
        return (
          <div style={{ ...baseStyle, border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {content}
          </div>
        )
      }
      const columns = element.tableColumns
      const tableStyle: CSSProperties = { fontSize: '12px', ...baseStyle, height: 'auto', minHeight: `${element.height}px`, borderCollapse: 'collapse' }

      if (columns && columns.length > 0) {
        // Table designed with explicit columns/headers — render exactly as configured,
        // including each column's own width/alignment and the header's bold/background style.
        const hasWidths = columns.some(c => c.width)
        return (
          <table style={{ ...tableStyle, tableLayout: hasWidths ? 'fixed' : 'auto' }}>
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    style={{
                      ...tableCellStyle,
                      width: col.width ? `${col.width}px` : undefined,
                      textAlign: col.align ?? 'left',
                      fontWeight: (element.tableHeaderBold ?? true) ? 'bold' : 'normal',
                      background: element.tableHeaderBg ?? '#f3f4f6',
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => (
                <tr key={idx}>
                  {columns.map((col, i) => (
                    <td
                      key={i}
                      style={{
                        ...tableCellStyle,
                        width: col.width ? `${col.width}px` : undefined,
                        textAlign: col.align ?? (RIGHT_ALIGNED_FIELDS.has(col.field) ? 'right' : 'left'),
                      }}
                    >
                      {tableCellValue(col.field, item, idx)}
                    </td>
                  ))}
                </tr>
              ))}
              {(element.tableShowTotalRow ?? false) && (
                <tr>
                  <td
                    colSpan={Math.max(1, columns.length - 1)}
                    style={{ ...tableCellStyle, fontWeight: 'bold', textAlign: 'right' }}
                  >
                    {element.tableTotalLabel || 'ยอดสุทธิ'}
                  </td>
                  <td
                    style={{
                      ...tableCellStyle,
                      fontWeight: 'bold',
                      width: columns[columns.length - 1]?.width ? `${columns[columns.length - 1].width}px` : undefined,
                      textAlign: columns[columns.length - 1]?.align ?? 'right',
                    }}
                  >
                    {dataToUse.total_amount ?? '-'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )
      }

      // Legacy tables (saved before column config existed) have no header info of
      // their own — the template's design already draws the header as a separate
      // static element, so only the data rows are rendered here to avoid duplicating it.
      return (
        <table style={tableStyle}>
          <tbody>
            {items.map((item: any, idx: number) => (
              <tr key={idx}>
                <td style={tableCellStyle}>{idx + 1}</td>
                <td style={tableCellStyle}>{item.name || '-'}</td>
                <td style={{ ...tableCellStyle, textAlign: 'right' }}>{item.qty ?? '-'}</td>
                <td style={tableCellStyle}>{item.unit || '-'}</td>
                <td style={{ ...tableCellStyle, textAlign: 'right' }}>{Number(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style={{ ...tableCellStyle, textAlign: 'right' }}>{(Number(item.qty || 0) * Number(item.unitPrice || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    default:
      return <div style={baseStyle}>{content}</div>
  }
}
