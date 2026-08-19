"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, LayoutTemplate, Calendar, CheckCircle2, XCircle, Upload, X, Loader2, FileUp } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import TemplateActions from './TemplateActions'
import { createTemplate } from './actions'
import { PaperOrientation, PaperSize, TemplateMode } from '@prisma/client'

type CategoryOption = { id: string; name: string }
type DocumentTypeOption = { id: string; name: string; categoryId: string }
type TemplateRow = {
  id: string
  name: string
  description: string | null
  templateMode: TemplateMode
  isActive: boolean
  isGlobal: boolean
  updatedAt: Date | string
  category?: { name: string } | null
}

async function detectDocumentLines(dataUrl: string, sourceWidth: number, sourceHeight: number, scale: number, offsetX: number, offsetY: number) {
  const maxWidth = 1400
  const analysisScale = Math.min(1, maxWidth / sourceWidth)
  const width = Math.max(1, Math.round(sourceWidth * analysisScale))
  const height = Math.max(1, Math.round(sourceHeight * analysisScale))
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('ไม่สามารถวิเคราะห์โครงสร้างรูปภาพได้'))
    element.src = dataUrl
  })
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return []
  context.drawImage(image, 0, 0, width, height)
  const pixels = context.getImageData(0, 0, width, height).data
  const dark = (x: number, y: number) => {
    const index = (y * width + x) * 4
    return pixels[index + 3] > 80 && (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3 < 150
  }
  const horizontal: { at: number; start: number; end: number }[] = []
  for (let y = 0; y < height; y += 2) {
    let run = 0, best = 0, bestEnd = 0
    for (let x = 0; x < width; x++) {
      run = dark(x, y) ? run + 1 : 0
      if (run > best) { best = run; bestEnd = x }
    }
    if (best > width * 0.28) horizontal.push({ at: y, start: bestEnd - best + 1, end: bestEnd })
  }
  const vertical: { at: number; start: number; end: number }[] = []
  for (let x = 0; x < width; x += 2) {
    let run = 0, best = 0, bestEnd = 0
    for (let y = 0; y < height; y++) {
      run = dark(x, y) ? run + 1 : 0
      if (run > best) { best = run; bestEnd = y }
    }
    if (best > height * 0.12) vertical.push({ at: x, start: bestEnd - best + 1, end: bestEnd })
  }
  const dedupe = <T extends { at: number },>(items: T[]) => items.filter((item, index) => index === 0 || item.at - items[index - 1].at > 4)
  const coordinateScale = scale / analysisScale
  return [
    ...dedupe(horizontal).slice(0, 80).map((rule, index) => ({
      id: `rule-h-${Date.now()}-${index}`, type: 'line',
      x: offsetX + rule.start * coordinateScale, y: offsetY + rule.at * coordinateScale,
      width: Math.max(20, (rule.end - rule.start) * coordinateScale), height: 1, content: '', color: '#6b7280',
    })),
    ...dedupe(vertical).slice(0, 50).map((rule, index) => ({
      id: `rule-v-${Date.now()}-${index}`, type: 'line',
      x: offsetX + rule.at * coordinateScale, y: offsetY + rule.start * coordinateScale,
      width: 1, height: Math.max(20, (rule.end - rule.start) * coordinateScale), content: '', color: '#6b7280',
    })),
  ]
}

async function preprocessImageForOcr(dataUrl: string, sourceWidth: number, sourceHeight: number) {
  const factor = Math.max(1, Math.min(3.5, 3600 / sourceWidth))
  const width = Math.round(sourceWidth * factor)
  const height = Math.round(sourceHeight * factor)
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('ไม่สามารถปรับคุณภาพรูปภาพได้'))
    element.src = dataUrl
  })
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return { dataUrl, factor: 1, width: sourceWidth, height: sourceHeight }
  context.drawImage(image, 0, 0, width, height)
  const imageData = context.getImageData(0, 0, width, height)
  for (let index = 0; index < imageData.data.length; index += 4) {
    const gray = imageData.data[index] * 0.299 + imageData.data[index + 1] * 0.587 + imageData.data[index + 2] * 0.114
    const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.25 + 128))
    imageData.data[index] = contrasted
    imageData.data[index + 1] = contrasted
    imageData.data[index + 2] = contrasted
  }
  context.putImageData(imageData, 0, 0)
  return { dataUrl: canvas.toDataURL('image/png'), factor, width, height }
}

export default function TemplatesList({ initialTemplates, categories, documentTypes }: { initialTemplates: TemplateRow[]; categories: CategoryOption[]; documentTypes: DocumentTypeOption[] }) {
  const [activeTab, setActiveTab] = useState<'company' | 'system'>('company')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [useOcr, setUseOcr] = useState(true)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState('')
  const [importName, setImportName] = useState('')
  const [importCategoryId, setImportCategoryId] = useState(categories[0]?.id || '')
  const [importDocumentTypeId, setImportDocumentTypeId] = useState(
    documentTypes.find(type => type.categoryId === categories[0]?.id)?.id || ''
  )

  const filteredDocumentTypes = documentTypes.filter(type => type.categoryId === importCategoryId)
  const templates = initialTemplates.filter(template => activeTab === 'company' ? !template.isGlobal : template.isGlobal)

  const handleImport = async () => {
    if (!importFile || !importName.trim() || !importCategoryId || !importDocumentTypeId) return
    if (importFile.size > 5 * 1024 * 1024) {
      alert('ไฟล์มีขนาดเกิน 5 MB')
      return
    }

    setImporting(true)
    try {
      let layoutJson: Record<string, unknown>
      const extension = importFile.name.toLowerCase().split('.').pop()
      if (extension === 'json') {
        const parsed = JSON.parse(await importFile.text())
        layoutJson = parsed.layoutJson && typeof parsed.layoutJson === 'object' ? parsed.layoutJson : parsed
      } else if (extension === 'docx') {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ arrayBuffer: await importFile.arrayBuffer() })
        const paragraphs = result.value.split(/\n\s*\n|\n/).map(text => text.trim()).filter(Boolean)
        let y = 36
        const elements = paragraphs.slice(0, 60).map((text, index) => {
          const isHeading = index === 0 || text.length < 45 && !/[.!?。]$/.test(text)
          const lineCount = Math.max(1, Math.ceil(text.length / (isHeading ? 45 : 75)))
          const height = Math.max(isHeading ? 34 : 26, lineCount * (isHeading ? 24 : 18))
          const element = {
            id: `docx-${Date.now()}-${index}`,
            type: isHeading ? 'heading' : 'paragraph',
            x: 40, y, width: 515, height, content: text,
            fontFamily: 'TH SarabunPSK', fontSize: isHeading ? 20 : 14,
            fontWeight: isHeading ? 'bold' : 'normal', color: '#111827', textAlign: 'left',
          }
          y += height + 8
          return element
        })
        layoutJson = {
          importedFile: { name: importFile.name, type: importFile.type, source: 'docx' },
          elements,
          pages: [{ id: 'page-1', width: 595, height: Math.max(842, y + 36), background: '#ffffff' }],
        }
      } else if (extension === 'xlsx') {
        const XLSX = await import('xlsx')
        const workbook = XLSX.read(await importFile.arrayBuffer(), { type: 'array' })
        let y = 34
        const elements: Record<string, unknown>[] = []
        workbook.SheetNames.forEach((sheetName, sheetIndex) => {
          const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, raw: false, defval: '' })
            .map(row => Array.from({ length: row.length }, (_, index) => String(row[index] ?? '')))
            .filter(row => row.some(Boolean))
          if (rows.length === 0) return
          const columnCount = Math.max(...rows.map(row => row.length), 1)
          const headers = rows[0].map((value, index) => value || `คอลัมน์ ${index + 1}`)
          while (headers.length < columnCount) headers.push(`คอลัมน์ ${headers.length + 1}`)
          elements.push({ id: `sheet-${Date.now()}-${sheetIndex}`, type: 'heading', x: 30, y, width: 535, height: 34, content: sheetName, fontFamily: 'TH SarabunPSK', fontSize: 18, fontWeight: 'bold' })
          y += 40
          const tableRows = rows.slice(1, 31)
          const tableHeight = Math.max(64, (tableRows.length + 1) * 24)
          elements.push({
            id: `xlsx-${Date.now()}-${sheetIndex}`, type: 'table', x: 30, y, width: 535, height: tableHeight, content: `[${sheetName}]`,
            fontFamily: 'TH SarabunPSK', tableRows: tableRows.length,
            tableColumns: headers.map((label, index) => ({ label, field: `column_${index}`, width: Math.floor(535 / columnCount), align: 'left' })),
            tableData: tableRows,
          })
          y += tableHeight + 24
        })
        layoutJson = {
          importedFile: { name: importFile.name, type: importFile.type, source: 'xlsx' },
          elements,
          pages: [{ id: 'page-1', width: 595, height: Math.max(842, y + 30), background: '#ffffff' }],
        }
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
          reader.readAsDataURL(importFile)
        })
        if (useOcr) {
          const Tesseract = await import('tesseract.js')
          const imageSize = await new Promise<{ width: number; height: number }>((resolve, reject) => {
            const image = new Image()
            image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
            image.onerror = () => reject(new Error('ไม่สามารถอ่านขนาดรูปภาพได้'))
            image.src = dataUrl
          })
          setOcrStatus('กำลังปรับคุณภาพรูปภาพ')
          const preparedImage = await preprocessImageForOcr(dataUrl, imageSize.width, imageSize.height)
          let ocrPassLabel = 'กำลังเตรียมโมเดล OCR'
          const worker = await Tesseract.createWorker(['tha', 'eng'], Tesseract.OEM.LSTM_ONLY, {
            logger: message => {
              setOcrStatus(`${ocrPassLabel}: ${message.status}`)
              const passOffset = ocrPassLabel.includes('รอบที่ 2') ? 50 : 0
              setOcrProgress(Math.min(99, passOffset + Math.round(message.progress * 50)))
            },
          })
          await worker.setParameters({ preserve_interword_spaces: '1', tessedit_pageseg_mode: Tesseract.PSM.AUTO })
          let firstResult
          let secondResult
          try {
            ocrPassLabel = 'อ่านโครงสร้างรอบที่ 1/2'
            firstResult = await worker.recognize(preparedImage.dataUrl, { rotateAuto: false }, { text: true, blocks: true })
            ocrPassLabel = 'อ่านรายละเอียดรอบที่ 2/2'
            await worker.setParameters({ preserve_interword_spaces: '1', tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT })
            secondResult = await worker.recognize(preparedImage.dataUrl, { rotateAuto: false }, { text: true, blocks: true })
          } finally {
            await worker.terminate()
          }
          setOcrStatus('กำลังเปรียบเทียบและจัดโครงสร้างผลลัพธ์')
          setOcrProgress(99)
          const rawLines = [firstResult, secondResult].flatMap(result =>
            (result.data.blocks ?? []).flatMap(block => block.paragraphs.flatMap(paragraph => paragraph.lines))
          )
            .filter(line => {
              const text = line.text.trim()
              if (!text || line.confidence < 18) return false
              if (/^[A-Za-z0-9]$/.test(text) && line.confidence < 75) return false
              return true
            })
            .sort((a, b) => b.confidence - a.confidence)
          const lines = rawLines.filter((line, index, accepted) => {
            const centerX = (line.bbox.x0 + line.bbox.x1) / 2
            const centerY = (line.bbox.y0 + line.bbox.y1) / 2
            const width = line.bbox.x1 - line.bbox.x0
            const height = line.bbox.y1 - line.bbox.y0
            return !accepted.slice(0, index).some(other => {
              const otherCenterX = (other.bbox.x0 + other.bbox.x1) / 2
              const otherCenterY = (other.bbox.y0 + other.bbox.y1) / 2
              const otherWidth = other.bbox.x1 - other.bbox.x0
              const otherHeight = other.bbox.y1 - other.bbox.y0
              return Math.abs(centerX - otherCenterX) < Math.max(width, otherWidth) * 0.18
                && Math.abs(centerY - otherCenterY) < Math.max(height, otherHeight) * 0.65
            })
          }).sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0)
          const heights = lines.map(line => line.bbox.y1 - line.bbox.y0).sort((a, b) => a - b)
          const medianHeight = heights[Math.floor(heights.length / 2)] || 20
          const scale = Math.min(535 / imageSize.width, 782 / imageSize.height)
          const ocrScale = scale / preparedImage.factor
          const offsetX = (595 - imageSize.width * scale) / 2
          const offsetY = 30
          const rowCandidates = lines.map((line, lineIndex) => {
            const words = [...line.words].filter(word => word.text.trim() && word.confidence >= 10).sort((a, b) => a.bbox.x0 - b.bbox.x0)
            const cells: { text: string; x0: number; x1: number }[] = []
            const gapThreshold = Math.max(preparedImage.width * 0.025, medianHeight * 1.4)
            words.forEach(word => {
              const previous = cells[cells.length - 1]
              if (!previous || word.bbox.x0 - previous.x1 > gapThreshold) {
                cells.push({ text: word.text.trim(), x0: word.bbox.x0, x1: word.bbox.x1 })
              } else {
                previous.text += ` ${word.text.trim()}`
                previous.x1 = word.bbox.x1
              }
            })
            return { line, lineIndex, cells }
          }).filter(row => row.cells.length >= 2)

          const candidateGroups: typeof rowCandidates[] = []
          rowCandidates.forEach(row => {
            const group = candidateGroups[candidateGroups.length - 1]
            const previous = group?.[group.length - 1]
            const closeVertically = previous && row.line.bbox.y0 - previous.line.bbox.y1 < medianHeight * 3.2
            const similarColumns = previous && Math.abs(row.cells.length - previous.cells.length) <= 2
            if (group && closeVertically && similarColumns) group.push(row)
            else candidateGroups.push([row])
          })
          const tableGroups = candidateGroups.filter(group => group.length >= 2 && (group.length >= 3 || group.some(row => row.cells.length >= 3)))
          const tableLineIndexes = new Set(tableGroups.flatMap(group => group.map(row => row.lineIndex)))
          const tableElements = tableGroups.map((group, tableIndex) => {
            const columnStarts: number[] = []
            group.flatMap(row => row.cells).sort((a, b) => a.x0 - b.x0).forEach(cell => {
              const existing = columnStarts.findIndex(value => Math.abs(value - cell.x0) < preparedImage.width * 0.055)
              if (existing < 0) columnStarts.push(cell.x0)
              else columnStarts[existing] = (columnStarts[existing] + cell.x0) / 2
            })
            columnStarts.sort((a, b) => a - b)
            const limitedColumns = columnStarts.slice(0, 8)
            const toRow = (cells: typeof group[number]['cells']) => {
              const row = Array(limitedColumns.length).fill('') as string[]
              cells.forEach(cell => {
                let nearest = 0
                limitedColumns.forEach((start, index) => {
                  if (Math.abs(start - cell.x0) < Math.abs(limitedColumns[nearest] - cell.x0)) nearest = index
                })
                row[nearest] = row[nearest] ? `${row[nearest]} ${cell.text}` : cell.text
              })
              return row
            }
            const rows = group.map(row => toRow(row.cells))
            const header = rows[0].map((value, index) => value || `คอลัมน์ ${index + 1}`)
            const x0 = Math.min(...group.flatMap(row => row.cells.map(cell => cell.x0)))
            const x1 = Math.max(...group.flatMap(row => row.cells.map(cell => cell.x1)))
            const y0 = Math.min(...group.map(row => row.line.bbox.y0))
            const y1 = Math.max(...group.map(row => row.line.bbox.y1))
            const width = Math.max(120, (x1 - x0) * ocrScale)
            return {
              id: `ocr-table-${Date.now()}-${tableIndex}`, type: 'table',
              x: offsetX + x0 * ocrScale, y: offsetY + y0 * ocrScale, width,
              height: Math.max(50, (y1 - y0) * ocrScale + 20), content: '[OCR Table]',
              fontFamily: 'Cordia New', tableRows: Math.max(1, rows.length - 1),
              tableColumns: header.map((label, index) => ({ label, field: `ocr_column_${index}`, width: Math.floor(width / header.length), align: 'left' })),
              tableData: rows.slice(1), tableHeaderBold: true, tableHeaderBg: '#f3f4f6',
            }
          })
          const textElements = lines.flatMap((line, index) => {
            if (tableLineIndexes.has(index)) return []
            const sourceHeight = line.bbox.y1 - line.bbox.y0
            const isHeading = sourceHeight > medianHeight * 1.3
            const isFooter = line.bbox.y0 > preparedImage.height * 0.82
            return [{
              id: `ocr-${Date.now()}-${index}`,
              type: isHeading ? 'heading' : 'text',
              x: Math.max(0, offsetX + line.bbox.x0 * ocrScale),
              y: offsetY + line.bbox.y0 * ocrScale,
              width: Math.max(40, (line.bbox.x1 - line.bbox.x0) * ocrScale + 8),
              height: Math.max(18, sourceHeight * ocrScale + 6),
              content: line.text.trim(),
              fontFamily: 'Cordia New',
              fontSize: Math.max(isFooter ? 8 : 9, Math.min(24, sourceHeight * ocrScale * 0.82)),
              fontWeight: isHeading ? 'bold' : 'normal',
              color: '#111827', textAlign: 'left',
              ocrConfidence: Math.round(line.confidence),
            }]
          })
          const ruleElements = await detectDocumentLines(dataUrl, imageSize.width, imageSize.height, scale, offsetX, offsetY)
          const elements = [...ruleElements, ...tableElements, ...textElements]
          layoutJson = {
            importedFile: { name: importFile.name, type: importFile.type, source: 'image-ocr' },
            ocr: { languages: ['tha', 'eng'], detectedTextLines: textElements.length, detectedTables: tableElements.length, detectedRules: ruleElements.length, sourceWidth: imageSize.width, sourceHeight: imageSize.height },
            elements,
            pages: [{ id: 'page-1', width: 595, height: 842, background: '#ffffff' }],
          }
        } else {
          layoutJson = {
            importedFile: { name: importFile.name, type: importFile.type, dataUrl },
            elements: [{ id: `import-${Date.now()}`, type: 'image', x: 0, y: 0, width: 595, height: 842, content: dataUrl }],
            pages: [{ id: 'page-1', width: 595, height: 842, background: '#ffffff' }],
          }
        }
      }

      await createTemplate({
        name: importName.trim(),
        categoryId: importCategoryId,
        documentTypeId: importDocumentTypeId,
        description: `นำเข้าจากไฟล์ ${importFile.name}`,
        templateMode: TemplateMode.DESIGNER,
        formType: 'IMPORTED',
        layoutJson: JSON.parse(JSON.stringify(layoutJson)),
        paperSize: PaperSize.A4,
        orientation: PaperOrientation.PORTRAIT,
        isActive: true,
      })
      window.location.reload()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'ไม่สามารถนำเข้าไฟล์ได้')
      setImporting(false)
      setOcrProgress(0)
      setOcrStatus('')
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-20 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 tracking-wider mb-1 uppercase">
            Company Workspace
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            แบบเอกสารทั้งหมด
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            จัดการและค้นหาแบบฟอร์มหรือเทมเพลตเอกสารทั้งหมดในระบบ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import ไฟล์เอกสาร
          </button>
          <Link
            href="/doc-format/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            สร้างแบบเอกสารใหม่
          </Link>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                  <FileUp className="h-5 w-5 text-emerald-600" /> นำเข้ารูปแบบเอกสาร
                </h2>
                <p className="mt-1 text-xs text-gray-500">รองรับ Word, Excel, รูปภาพ และ Layout JSON ขนาดไม่เกิน 5 MB</p>
              </div>
              <button type="button" onClick={() => setShowImportModal(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-200 p-6 text-center hover:border-emerald-400 hover:bg-emerald-50/40 dark:border-gray-700 dark:hover:bg-emerald-900/10">
                <Upload className="mx-auto mb-2 h-7 w-7 text-gray-400" />
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">{importFile?.name || 'เลือกไฟล์จากเครื่อง'}</span>
                <span className="mt-1 block text-xs text-gray-400">DOCX, XLSX, PNG, JPG, WEBP หรือ JSON</span>
                <input
                  type="file"
                  accept=".docx,.xlsx,.png,.jpg,.jpeg,.webp,.json,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg,image/webp,application/json"
                  className="sr-only"
                  onChange={event => {
                    const file = event.target.files?.[0] || null
                    setImportFile(file)
                    if (file && !importName) setImportName(file.name.replace(/\.[^.]+$/, ''))
                  }}
                />
              </label>
              {importFile?.type.startsWith('image/') && (
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 dark:border-emerald-900/40 dark:bg-emerald-900/10">
                  <input type="checkbox" checked={useOcr} onChange={event => setUseOcr(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-emerald-600" />
                  <span>
                    <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">แยกข้อความและโครงสร้างด้วย OCR</span>
                    <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">อ่านภาพละเอียด 2 รอบ รองรับภาษาไทยและอังกฤษ อาจใช้เวลาประมาณ 30–90 วินาที</span>
                  </span>
                </label>
              )}
              {importing && ocrStatus && (
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <div className="mb-2 flex justify-between text-xs text-gray-500 dark:text-gray-400"><span>กำลังวิเคราะห์เอกสาร: {ocrStatus}</span><span>{ocrProgress}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${ocrProgress}%` }} /></div>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อแบบเอกสาร <span className="text-red-500">*</span></label>
                <input value={importName} onChange={event => setImportName(event.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="ระบุชื่อแบบเอกสาร" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">หมวดหมู่ <span className="text-red-500">*</span></label>
                  <select value={importCategoryId} onChange={event => {
                    const categoryId = event.target.value
                    setImportCategoryId(categoryId)
                    setImportDocumentTypeId(documentTypes.find(type => type.categoryId === categoryId)?.id || '')
                  }} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">ประเภทเอกสาร <span className="text-red-500">*</span></label>
                  <select value={importDocumentTypeId} onChange={event => setImportDocumentTypeId(event.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    {filteredDocumentTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
              <button type="button" onClick={() => setShowImportModal(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700">ยกเลิก</button>
              <button type="button" onClick={handleImport} disabled={importing || !importFile || !importName.trim() || !importDocumentTypeId} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                นำเข้าแบบเอกสาร
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-gray-200 dark:border-gray-800 mb-6 px-2">
        <button
          onClick={() => setActiveTab('company')}
          className={`pb-4 text-sm font-semibold transition-colors relative outline-none ${activeTab === 'company'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
          เทมเพลตของบริษัท
          {activeTab === 'company' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`pb-4 text-sm font-semibold transition-colors relative outline-none ${activeTab === 'system'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
          เทมเพลตจากระบบส่วนกลาง
          {activeTab === 'system' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อเทมเพลต, คำอธิบาย..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex items-center gap-3">
            <select className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">ทุกหมวดหมู่</option>
              <option value="ACTIVE">ใช้งานอยู่</option>
              <option value="INACTIVE">ปิดใช้งาน</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors text-sm font-medium">
              <Filter className="w-4 h-4" />
              คัดกรอง
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">ชื่อเทมเพลต</th>
                <th className="px-6 py-4 font-semibold">รายละเอียด</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">หมวดหมู่</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">โหมดการสร้าง</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">สถานะ</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">วันที่อัปเดต</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <LayoutTemplate className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-base font-medium">ยังไม่มีเทมเพลตในระบบ</p>
                    <p className="text-sm mt-1">เริ่มต้นสร้างฟอร์มเอกสารมาตรฐานของคุณได้ที่นี่</p>
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {activeTab === 'system' ? (
                        <span className="text-gray-800 dark:text-gray-200">{template.name}</span>
                      ) : (
                        <Link href={`/doc-format/${template.id}`} className="hover:underline">{template.name}</Link>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {template.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {template.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {template.templateMode === 'FORM' ? 'JSON Form' : 'Drag & Drop'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ใช้งานอยู่
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                          <XCircle className="w-3.5 h-3.5" /> ปิดใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(template.updatedAt), 'dd MMM yyyy', { locale: th })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <TemplateActions id={template.id} name={template.name} isGlobal={template.isGlobal} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
