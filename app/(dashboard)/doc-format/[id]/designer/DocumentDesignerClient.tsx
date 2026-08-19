'use client';

import { useState, useRef, useCallback, useTransition } from 'react';
import Link from 'next/link';
import {
  Undo2, Redo2, ZoomIn, ZoomOut, Download, Save,
  Type, Heading1, AlignLeft, AlignCenter, AlignRight, AlignJustify, Image, Building2,
  Table2, Minus, Square, PenLine, Calendar,
  Hash, CheckSquare, QrCode,
  ChevronRight, MousePointer2, Trash2,
  ScanLine, Eye, X, Printer
} from 'lucide-react';
import { saveDesignerLayout } from '../../actions';
import { DocumentPreview } from '@/components/templates/builder/DocumentPreview';
import { mapDocumentToTemplateData } from '@/lib/template-data-mapping';

// ─── Types ──────────────────────────────────────────────────────────────────

type ElementType =
  | 'text' | 'heading' | 'paragraph' | 'image' | 'logo'
  | 'table' | 'line' | 'box' | 'signature' | 'date'
  | 'page_number' | 'checkbox' | 'qr_code' | 'barcode';

interface TableColumn {
  label: string;
  field: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

interface DesignerElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  tableColumns?: TableColumn[];
  tableRows?: number;
  tableData?: string[][];
  tableHeaderBold?: boolean;
  tableHeaderBg?: string;
  tableShowTotalRow?: boolean;
  tableTotalLabel?: string;
}

type TemplateInfo = {
  id: string;
  name: string;
  description: string | null;
  paperSize: string;
  orientation: string;
  layoutJson: unknown;
  category: { name: string };
  documentType: { name: string };
};

type PreviewDocument = {
  id: string;
  documentNo: string;
  title: string;
  dataJson: unknown;
  company?: { name?: string | null; taxId?: string | null; address?: string | null; phone?: string | null } | null;
  createdBy?: { name?: string | null; role?: string | null } | null;
};

// ─── Data field picker config ─────────────────────────────────────────────────
// Matches the flat keys mapDocumentToTemplateData() (lib/template-data-mapping.ts)
// actually fills in — inserting one of these tokens here is what makes the field
// show real document data instead of staying blank.

const DATA_FIELD_GROUPS: { group: string; fields: { key: string; label: string }[] }[] = [
  {
    group: 'บริษัท',
    fields: [
      { key: 'company_name', label: 'ชื่อบริษัท' },
      { key: 'company_address', label: 'ที่อยู่บริษัท' },
      { key: 'company_phone', label: 'เบอร์โทรบริษัท' },
      { key: 'company_taxid', label: 'เลขผู้เสียภาษีบริษัท' },
    ],
  },
  {
    group: 'ลูกค้า',
    fields: [
      { key: 'customer_name', label: 'ชื่อลูกค้า' },
      { key: 'customer_address', label: 'ที่อยู่ลูกค้า' },
      { key: 'customer_taxid', label: 'เลขผู้เสียภาษีลูกค้า' },
    ],
  },
  {
    group: 'เอกสาร',
    fields: [
      { key: 'doc_no', label: 'เลขที่เอกสาร' },
      { key: 'doc_date', label: 'วันที่' },
      { key: 'expire_date', label: 'วันครบกำหนด' },
      { key: 'credit_term', label: 'เครดิต (วัน)' },
    ],
  },
  {
    group: 'ยอดเงิน',
    fields: [
      { key: 'subtotal', label: 'รวมเงิน' },
      { key: 'discount', label: 'ส่วนลด' },
      { key: 'vat', label: 'ภาษีมูลค่าเพิ่ม' },
      { key: 'total_amount', label: 'ยอดสุทธิ' },
    ],
  },
  {
    group: 'อื่นๆ',
    fields: [{ key: 'remarks', label: 'หมายเหตุ' }],
  },
];

// ─── Table column config ───────────────────────────────────────────────────────
// `field` maps to a key on each line item ({name, qty, unit, unitPrice}); 'index'
// and 'total' are computed (row number, qty*unitPrice) rather than read directly.

const TABLE_FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: 'index', label: 'ลำดับ' },
  { value: 'name', label: 'ชื่อสินค้า / รายละเอียด' },
  { value: 'qty', label: 'จำนวน' },
  { value: 'unit', label: 'หน่วย' },
  { value: 'unitPrice', label: 'ราคาต่อหน่วย' },
  { value: 'total', label: 'ราคารวม' },
];

const DEFAULT_TABLE_COLUMNS: TableColumn[] = [
  { label: 'ลำดับ', field: 'index' },
  { label: 'ชื่อสินค้า / รายละเอียด', field: 'name' },
  { label: 'จำนวน', field: 'qty' },
  { label: 'หน่วย', field: 'unit' },
  { label: 'ราคาต่อหน่วย', field: 'unitPrice' },
  { label: 'ราคารวม', field: 'total' },
];

// ─── Element palette config ──────────────────────────────────────────────────

const ELEMENT_PALETTE: { type: ElementType; label: string; icon: React.ElementType }[] = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'heading', label: 'Heading', icon: Heading1 },
  { type: 'paragraph', label: 'Paragraph', icon: AlignLeft },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'logo', label: 'Logo', icon: Building2 },
  { type: 'table', label: 'Table', icon: Table2 },
  { type: 'line', label: 'Line', icon: Minus },
  { type: 'box', label: 'Box', icon: Square },
  { type: 'signature', label: 'Signature', icon: PenLine },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'page_number', label: 'Page Number', icon: Hash },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'qr_code', label: 'QR Code', icon: QrCode },
  { type: 'barcode', label: 'Barcode', icon: ScanLine },
];

// ─── Default element properties ──────────────────────────────────────────────

const DEFAULT_PROPS: Record<ElementType, Partial<DesignerElement>> = {
  text: { width: 200, height: 30, content: 'ข้อความ', fontFamily: 'TH SarabunPSK', fontSize: 14 },
  heading: { width: 330, height: 58, content: 'ใบเสนอราคา', fontFamily: 'TH SarabunPSK', fontSize: 24, fontWeight: 'bold' },
  paragraph: { width: 250, height: 60, content: 'ข้อความย่อหน้า', fontFamily: 'TH SarabunPSK', fontSize: 12 },
  image: { width: 120, height: 120, content: '[Image]' },
  logo: { width: 80, height: 80, content: '[Logo]' },
  table: { width: 300, height: 100, content: '[Table]', fontFamily: 'TH SarabunPSK' },
  line: { width: 300, height: 2, content: '' },
  box: { width: 200, height: 100, content: '' },
  signature: { width: 150, height: 60, content: '[Signature]' },
  date: { width: 120, height: 30, content: '{{date}}', fontFamily: 'TH SarabunPSK', fontSize: 12 },
  page_number: { width: 60, height: 24, content: '{{page}}', fontFamily: 'TH SarabunPSK', fontSize: 11 },
  checkbox: { width: 16, height: 16, content: '' },
  qr_code: { width: 80, height: 80, content: '{{qr}}' },
  barcode: { width: 150, height: 50, content: '{{barcode}}' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeId() {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function loadInitialElements(layoutJson: unknown): DesignerElement[] {
  if (layoutJson && typeof layoutJson === 'object' && 'elements' in layoutJson) {
    const arr = (layoutJson as { elements: DesignerElement[] }).elements;
    if (Array.isArray(arr)) return arr;
  }
  return [];
}

type PaperPreset = 'A4' | 'A5' | 'LETTER' | 'LEGAL' | 'RECEIPT_80' | 'CUSTOM';

const PAPER_PRESETS: Record<Exclude<PaperPreset, 'CUSTOM'>, { label: string; width: number; height: number }> = {
  A4: { label: 'A4 (210 × 297 มม.)', width: 595, height: 842 },
  A5: { label: 'A5 (148 × 210 มม.)', width: 419, height: 595 },
  LETTER: { label: 'Letter (8.5 × 11 นิ้ว)', width: 612, height: 792 },
  LEGAL: { label: 'Legal (8.5 × 14 นิ้ว)', width: 612, height: 1008 },
  RECEIPT_80: { label: 'ใบเสร็จ 80 มม.', width: 227, height: 600 },
};

function getInitialPaper(template: TemplateInfo) {
  if (template.layoutJson && typeof template.layoutJson === 'object' && 'pages' in template.layoutJson) {
    const pages = (template.layoutJson as { pages?: { width?: unknown; height?: unknown }[] }).pages;
    const width = Number(pages?.[0]?.width);
    const height = Number(pages?.[0]?.height);
    if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
      return { width, height };
    }
  }

  const presetKey = template.paperSize in PAPER_PRESETS
    ? template.paperSize as keyof typeof PAPER_PRESETS
    : 'A4';
  const preset = PAPER_PRESETS[presetKey];
  return template.orientation === 'LANDSCAPE'
    ? { width: preset.height, height: preset.width }
    : { width: preset.width, height: preset.height };
}

function detectPaperPreset(width: number, height: number): PaperPreset {
  const match = Object.entries(PAPER_PRESETS).find(([, preset]) =>
    (preset.width === width && preset.height === height) ||
    (preset.width === height && preset.height === width)
  );
  return (match?.[0] as PaperPreset | undefined) ?? 'CUSTOM';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DocumentDesignerClient({ template, documents, onSave }: { template: TemplateInfo; documents?: PreviewDocument[]; onSave?: (id: string, layoutJson: unknown) => Promise<void> }) {
  // ── State ────────────────────────────────────────────────────────────────
  const [elements, setElements] = useState<DesignerElement[]>(() =>
    loadInitialElements(template.layoutJson)
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewDocumentId, setPreviewDocumentId] = useState('');
  const [zoom, setZoom] = useState(72); // percentage
  const [history, setHistory] = useState<DesignerElement[][]>([loadInitialElements(template.layoutJson)]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(208);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [paperDimensions, setPaperDimensions] = useState(() => getInitialPaper(template));

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const panelResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  // ── Right panel resize ───────────────────────────────────────────────────
  const handlePanelResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    panelResizeRef.current = { startX: e.clientX, startWidth: rightPanelWidth };
    const onMove = (ev: MouseEvent) => {
      if (!panelResizeRef.current) return;
      const delta = panelResizeRef.current.startX - ev.clientX;
      const next = Math.min(480, Math.max(180, panelResizeRef.current.startWidth + delta));
      setRightPanelWidth(next);
    };
    const onUp = () => {
      panelResizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Selected element ─────────────────────────────────────────────────────
  const selectedEl = elements.find(e => e.id === selectedId) ?? null;

  // ── History ──────────────────────────────────────────────────────────────
  const pushHistory = useCallback((newEls: DesignerElement[]) => {
    setHistory(h => {
      const pruned = h.slice(0, historyIdx + 1);
      return [...pruned, newEls];
    });
    setHistoryIdx(i => i + 1);
    setIsDirty(true);
  }, [historyIdx]);

  const undo = () => {
    if (historyIdx <= 0) return;
    const idx = historyIdx - 1;
    setHistoryIdx(idx);
    setElements(history[idx]);
    setIsDirty(true);
  };

  const redo = () => {
    if (historyIdx >= history.length - 1) return;
    const idx = historyIdx + 1;
    setHistoryIdx(idx);
    setElements(history[idx]);
    setIsDirty(true);
  };

  // ── Add element ──────────────────────────────────────────────────────────
  const addElement = (type: ElementType) => {
    const defaults = DEFAULT_PROPS[type];
    const newEl: DesignerElement = {
      id: makeId(),
      type,
      x: 40 + (elements.length % 4) * 20,
      y: 40 + elements.length * 20,
      width: defaults.width ?? 120,
      height: defaults.height ?? 30,
      content: defaults.content ?? '',
      fontFamily: defaults.fontFamily,
      fontSize: defaults.fontSize,
      fontWeight: defaults.fontWeight,
      tableColumns: type === 'table' ? DEFAULT_TABLE_COLUMNS.map(c => ({ ...c })) : undefined,
      tableRows: type === 'table' ? 2 : undefined,
    };
    const newEls = [...elements, newEl];
    setElements(newEls);
    setSelectedId(newEl.id);
    pushHistory(newEls);
  };

  // ── Delete selected ───────────────────────────────────────────────────────
  const deleteSelected = () => {
    if (!selectedId) return;
    const newEls = elements.filter(e => e.id !== selectedId);
    setElements(newEls);
    setSelectedId(null);
    pushHistory(newEls);
  };

  // ── Drag to move ──────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    const el = elements.find(el => el.id === id)!;
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y };

    const onMove = (mv: MouseEvent) => {
      const currentDrag = dragRef.current;
      if (!currentDrag) return;
      const scale = zoom / 100;
      const dx = (mv.clientX - currentDrag.startX) / scale;
      const dy = (mv.clientY - currentDrag.startY) / scale;
      setElements(prev => prev.map(el =>
        el.id === currentDrag.id
          ? { ...el, x: Math.max(0, currentDrag.elX + dx), y: Math.max(0, currentDrag.elY + dy) }
          : el
      ));
    };

    const onUp = () => {
      if (dragRef.current) {
        setElements(prev => {
          pushHistory(prev);
          return prev;
        });
        dragRef.current = null;
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Update property ───────────────────────────────────────────────────────
  const updateProp = <K extends keyof DesignerElement>(key: K, value: DesignerElement[K]) => {
    if (!selectedId) return;
    const newEls = elements.map(el =>
      el.id === selectedId ? { ...el, [key]: value } : el
    );
    setElements(newEls);
    setIsDirty(true);
  };

  const commitProp = () => {
    pushHistory(elements);
  };

  const insertField = (fieldKey: string) => {
    if (!selectedEl) return;
    const token = `{{${fieldKey}}}`;
    const ta = contentTextareaRef.current;
    const start = ta?.selectionStart ?? selectedEl.content.length;
    const end = ta?.selectionEnd ?? selectedEl.content.length;
    const newContent = selectedEl.content.slice(0, start) + token + selectedEl.content.slice(end);
    updateProp('content', newContent);
    commitProp();
    requestAnimationFrame(() => {
      ta?.focus();
      const pos = start + token.length;
      ta?.setSelectionRange(pos, pos);
    });
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    startSaving(async () => {
      const layoutData = {
        pages: [{ id: 'page-1', width: paperW, height: paperH, background: '#ffffff' }],
        elements
      };
      if (onSave) {
        await onSave(template.id, layoutData);
      } else {
        await saveDesignerLayout(template.id, layoutData);
      }
      setIsDirty(false);
    });
  };

  // ── Paper size ────────────────────────────────────────────────────────────
  const { width: paperW, height: paperH } = paperDimensions;
  const paperPreset = detectPaperPreset(paperW, paperH);

  const updatePaperSize = (width: number, height: number) => {
    setPaperDimensions({
      width: Math.min(1600, Math.max(180, Math.round(width))),
      height: Math.min(2400, Math.max(180, Math.round(height))),
    });
    setIsDirty(true);
  };

  const selectPaperPreset = (preset: PaperPreset) => {
    if (preset === 'CUSTOM') return;
    const size = PAPER_PRESETS[preset];
    const isLandscape = paperW > paperH;
    updatePaperSize(
      isLandscape ? size.height : size.width,
      isLandscape ? size.width : size.height
    );
  };

  const scaledW = paperW * (zoom / 100);
  const scaledH = paperH * (zoom / 100);

  const handlePrint = () => {
    const currentZoom = zoom;
    setZoom(100);
    setTimeout(() => {
      window.print();
      setZoom(currentZoom);
    }, 300);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#1a1b2e] text-white print:h-auto print:overflow-visible print:bg-white print:text-black">

      {/* ── Top Nav Bar ───────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#12131f] border-b border-white/10 shrink-0 z-10 print:hidden">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Link href={onSave ? "/admin/templates" : "/templates"} className="hover:text-white transition-colors">Template</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={onSave ? "/admin/templates" : `/doc-format/${template.id}`} className="hover:text-white transition-colors truncate max-w-[140px]">
            {template.name}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white font-medium">Document Designer</span>
        </div>

        {/* Company */}
        <div className="hidden sm:block text-xs text-gray-400 font-medium">
          {template.category.name} &nbsp;·&nbsp; {template.documentType.name}
        </div>

        {/* Toolbar buttons */}
        <div className="flex items-center gap-1">
          {/* Undo / Redo */}
          <button
            onClick={undo} disabled={historyIdx <= 0}
            title="Undo"
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo} disabled={historyIdx >= history.length - 1}
            title="Redo"
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Zoom */}
          <button
            onClick={() => setZoom(z => Math.max(30, z - 10))}
            title="Zoom out"
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-300 w-10 text-center tabular-nums">{zoom}%</span>
          <button
            onClick={() => setZoom(z => Math.min(200, z + 10))}
            title="Zoom in"
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Print */}
          <button
            onClick={handlePrint}
            title="Print"
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Download placeholder */}
          <button
            title="Export"
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Preview */}
          <button
            onClick={() => setIsPreviewOpen(true)}
            title="Preview"
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${isDirty
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50'
              : 'bg-emerald-700 text-emerald-200 cursor-default'
              } disabled:opacity-60`}
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving…' : isDirty ? 'Save' : 'Saved'}
          </button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 print:block">

        {/* ── Left: Elements Palette ─────────────────────────────────── */}
        <aside className="w-44 shrink-0 bg-[#12131f] border-r border-white/10 overflow-y-auto print:hidden">
          <div className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Elements
          </div>
          <div className="pb-4 space-y-0.5 px-2">
            {ELEMENT_PALETTE.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => addElement(type)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-all group text-left"
              >
                <Icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </aside>

        {/* ── Center: Canvas ─────────────────────────────────────────── */}
        <main
          className="flex-1 overflow-auto bg-[#252636] flex items-start justify-center py-8 px-6 print:block print:overflow-visible print:bg-white print:p-0 print:m-0"
          onClick={() => setSelectedId(null)}
        >
          <div
            ref={canvasRef}
            className="relative bg-white shadow-2xl shadow-black/60 print:shadow-none print:!bg-none print:mx-auto"
            style={{
              width: scaledW,
              height: scaledH,
              transform: `scale(1)`,
              // grid dot background
              backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
              backgroundSize: `${zoom / 5}px ${zoom / 5}px`,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Elements */}
            {elements.map(el => (
              <div
                key={el.id}
                onMouseDown={(e) => handleMouseDown(e, el.id)}
                style={{ position: 'absolute', left: el.x * (zoom / 100), top: el.y * (zoom / 100), width: el.width * (zoom / 100), height: Math.max(el.height, 2) * (zoom / 100) }}
              >
                <div
                  className={`w-full h-full select-none cursor-move border-2 transition-colors ${selectedId === el.id
                    ? 'border-blue-500 ring-2 ring-blue-400/30'
                    : 'border-transparent hover:border-blue-300/60'
                    }`}
                  style={{
                    fontFamily: `"${el.fontFamily ?? 'TH SarabunPSK'}", "Sarabun", sans-serif`,
                    fontSize: (el.fontSize ?? 14) * (zoom / 100),
                    fontWeight: el.fontWeight ?? 'normal',
                    color: el.color ?? '#111827',
                    textAlign: el.textAlign ?? 'left',
                    lineHeight: 1.4,
                    padding: el.type === 'line' ? 0 : `${2 * (zoom / 100)}px ${4 * (zoom / 100)}px`,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    background: el.type === 'box' ? 'transparent' : (el.type === 'image' || el.type === 'logo') ? '#f3f4f6' : 'transparent',
                    backgroundImage: el.type === 'image' && el.content.startsWith('data:image/') ? `url(${el.content})` : undefined,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    border: el.type === 'box' ? `1px dashed #9ca3af` : undefined,
                    display: ['text', 'heading', 'paragraph', 'date', 'page_number'].includes(el.type) ? 'block' : 'flex',
                    alignItems: el.type === 'line' ? 'center' : 'flex-start',
                    justifyContent: (el.type === 'image' || el.type === 'logo' || el.type === 'qr_code' || el.type === 'barcode' || el.type === 'checkbox') ? 'center' : 'flex-start',
                  }}
                >
                  {el.type === 'line' && (
                    el.height > el.width
                      ? <div className="h-full border-l border-gray-400" />
                      : <div className="w-full border-t border-gray-400" />
                  )}
                  {el.type === 'image' && !el.content.startsWith('data:image/') && <span className="text-gray-400 text-xs">🖼 Image</span>}
                  {el.type === 'logo' && <span className="text-gray-400 text-xs">🏢 Logo</span>}
                  {el.type === 'qr_code' && <QrCode className="text-gray-500" style={{ width: el.width * (zoom / 100) * 0.6, height: el.width * (zoom / 100) * 0.6 }} />}
                  {el.type === 'barcode' && <ScanLine className="text-gray-700" style={{ width: el.width * (zoom / 100) * 0.7, height: el.height * (zoom / 100) * 0.6 }} />}
                  {el.type === 'checkbox' && <div style={{ width: 12 * (zoom / 100), height: 12 * (zoom / 100), border: `1px solid #6b7280`, borderRadius: 2 }} />}
                  {el.type === 'table' && (
                    <table className="w-full h-full border-collapse" style={{ fontSize: 10 * (zoom / 100), tableLayout: el.tableColumns?.some(c => c.width) ? 'fixed' : 'auto' }}>
                      {el.tableColumns && el.tableColumns.length > 0 ? (
                        <>
                          <thead>
                            <tr>
                              {el.tableColumns.map((col, i) => (
                                <th
                                  key={i}
                                  className="border border-gray-300 px-1 truncate"
                                  style={{
                                    width: col.width ? col.width * (zoom / 100) : undefined,
                                    textAlign: col.align ?? 'left',
                                    fontWeight: (el.tableHeaderBold ?? true) ? 'bold' : 'normal',
                                    background: el.tableHeaderBg ?? '#f3f4f6',
                                    color: '#4b5563',
                                  }}
                                >
                                  {col.label || '—'}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: Math.max(1, el.tableRows ?? 2) }).map((_, r) => (
                              <tr key={r}>
                                {el.tableColumns!.map((col, c) => (
                                  <td
                                    key={c}
                                    className="border border-gray-300 text-gray-400 px-1"
                                    style={{ width: col.width ? col.width * (zoom / 100) : undefined, textAlign: col.align ?? 'left' }}
                                  >
                                    {el.tableData?.[r]?.[c] ?? ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            {(el.tableShowTotalRow ?? false) && (
                              <tr>
                                <td
                                  colSpan={Math.max(1, el.tableColumns!.length - 1)}
                                  className="border border-gray-300 px-1 font-bold text-gray-700"
                                  style={{ textAlign: 'right' }}
                                >
                                  {el.tableTotalLabel || 'ยอดสุทธิ'}
                                </td>
                                <td
                                  className="border border-gray-300 px-1 font-bold text-gray-700"
                                  style={{ textAlign: el.tableColumns![el.tableColumns!.length - 1]?.align ?? 'right' }}
                                >
                                  {'{{total_amount}}'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </>
                      ) : (
                        <tbody>
                          {[0, 1, 2].map(r => (
                            <tr key={r}>
                              {[0, 1, 2, 3].map(c => (
                                <td key={c} className="border border-gray-300 text-gray-400 px-1" />
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      )}
                    </table>
                  )}
                  {el.type === 'signature' && (
                    <div className="w-full h-full flex items-end justify-center border-b border-dashed border-gray-400 pb-1">
                      <span style={{ fontSize: 10 * (zoom / 100), color: '#9ca3af' }}>ลายเซ็น</span>
                    </div>
                  )}
                  {!['line', 'image', 'logo', 'qr_code', 'barcode', 'checkbox', 'table', 'signature', 'box'].includes(el.type) && (
                    el.content || <span style={{ color: '#d1d5db', fontStyle: 'italic', fontSize: 11 * (zoom / 100) }}>ว่าง</span>
                  )}
                </div>
              </div>
            ))}

            {/* Empty canvas hint */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <MousePointer2 className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">คลิก element ทางซ้ายเพื่อเพิ่มลงใน canvas</p>
              </div>
            )}
          </div>
        </main>

        {/* ── Right: State + Properties ──────────────────────────────── */}
        {rightPanelCollapsed ? (
          <button
            type="button"
            onClick={() => setRightPanelCollapsed(false)}
            title="ขยายแผงคุณสมบัติ"
            className="shrink-0 w-6 bg-[#12131f] border-l border-white/10 flex items-center justify-center text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors print:hidden"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        ) : (
          <>
            <div
              onMouseDown={handlePanelResizeStart}
              title="ลากเพื่อปรับขนาด"
              className="shrink-0 w-1.5 cursor-ew-resize bg-transparent hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors print:hidden"
            />
            <aside style={{ width: rightPanelWidth }} className="shrink-0 bg-[#12131f] border-l border-white/10 overflow-y-auto print:hidden">

              <div className="sticky top-0 z-10 flex items-center justify-end bg-[#12131f] border-b border-white/10 px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => setRightPanelCollapsed(true)}
                  title="ย่อแผงคุณสมบัติ"
                  className="p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

          {/* State */}
          <div className="border-b border-white/10">
            <div className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              State
            </div>
            <div className="px-3 pb-3 grid grid-cols-2 gap-x-2 gap-y-2">
              {[
                { label: 'SELECT ELEMENT', value: selectedEl ? `element-${selectedEl.type}` : 'page-1' },
                { label: 'SELECTION MODE', value: selectedEl ? `element-${selectedEl.type}` : 'page' },
                { label: 'ZOOM', value: `${zoom}%` },
                { label: 'PAGES', value: '1' },
                { label: 'ELEMENTS', value: String(elements.length) },
                { label: 'HISTORY', value: `${historyIdx} / ${history.length - 1}` },
                { label: 'DIRTY', value: isDirty ? 'true' : 'false' },
                { label: 'RELATIVE', value: 'false' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wide">{label}</p>
                  <p className="text-[11px] text-gray-300 font-mono truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Page setup */}
          <div className="border-b border-white/10">
            <div className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Page setup
            </div>
            <div className="px-3 pb-3 space-y-2.5">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">ขนาดกระดาษ</label>
                <select
                  value={paperPreset}
                  onChange={e => selectPaperPreset(e.target.value as PaperPreset)}
                  className="w-full bg-[#1e1f30] border border-white/10 rounded text-xs text-gray-200 px-2 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  {Object.entries(PAPER_PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>{preset.label}</option>
                  ))}
                  <option value="CUSTOM">กำหนดเอง</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">กว้าง (px)</label>
                  <input
                    type="number" min={180} max={1600} value={paperW}
                    onChange={e => updatePaperSize(Number(e.target.value), paperH)}
                    className="w-full bg-[#1e1f30] border border-white/10 rounded text-xs text-gray-200 px-2 py-1.5 focus:outline-none focus:border-blue-500 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">สูง (px)</label>
                  <input
                    type="number" min={180} max={2400} value={paperH}
                    onChange={e => updatePaperSize(paperW, Number(e.target.value))}
                    className="w-full bg-[#1e1f30] border border-white/10 rounded text-xs text-gray-200 px-2 py-1.5 focus:outline-none focus:border-blue-500 tabular-nums"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => updatePaperSize(paperH, paperW)}
                className="w-full py-1.5 rounded border border-white/10 bg-[#1e1f30] text-[10px] text-gray-300 hover:text-white hover:border-blue-500 transition-colors"
              >
                สลับแนวตั้ง / แนวนอน
              </button>
              <p className="text-[9px] leading-relaxed text-gray-600">
                ขนาดจะถูกใช้กับหน้าออกแบบ พรีวิว และไฟล์ที่บันทึก
              </p>
            </div>
          </div>

          {/* Properties */}
          <div>
            <div className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
              Properties
              {selectedEl && (
                <button
                  onClick={deleteSelected}
                  title="Delete element"
                  className="p-0.5 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {selectedEl ? (
              <div className="px-3 pb-4 space-y-3">
                {/* Content */}
                {!['line', 'image', 'logo', 'qr_code', 'barcode', 'checkbox', 'table', 'signature', 'box'].includes(selectedEl.type) && (
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Content</label>
                    <textarea
                      ref={contentTextareaRef}
                      value={selectedEl.content}
                      onChange={e => updateProp('content', e.target.value)}
                      onBlur={commitProp}
                      rows={3}
                      className="w-full bg-[#1e1f30] border border-white/10 rounded text-xs text-gray-200 p-2 focus:outline-none focus:border-blue-500 resize-none"
                    />

                    <label className="block text-[10px] text-gray-500 mt-3 mb-1">ดึงฟิลด์ข้อมูล (แทรกที่ตำแหน่งเคอร์เซอร์)</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {DATA_FIELD_GROUPS.map(g => (
                        <div key={g.group}>
                          <p className="text-[9px] text-gray-600 uppercase tracking-wide mb-1">{g.group}</p>
                          <div className="flex flex-wrap gap-1">
                            {g.fields.map(f => (
                              <button
                                key={f.key}
                                type="button"
                                onClick={() => insertField(f.key)}
                                title={`{{${f.key}}}`}
                                className="px-2 py-1 rounded text-[10px] bg-[#1e1f30] border border-white/10 text-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-colors"
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Table Columns */}
                {selectedEl.type === 'table' && (
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">
                      คอลัมน์ตาราง ({(selectedEl.tableColumns ?? []).length})
                    </label>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {(selectedEl.tableColumns ?? []).map((col, idx) => {
                        const patchCol = (patch: Partial<TableColumn>) => {
                          const cols = [...(selectedEl.tableColumns ?? [])];
                          cols[idx] = { ...cols[idx], ...patch };
                          updateProp('tableColumns', cols);
                        };
                        return (
                          <div key={idx} className="bg-[#1e1f30] border border-white/10 rounded p-1.5 space-y-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={col.label}
                                placeholder="หัวตาราง"
                                onChange={e => patchCol({ label: e.target.value })}
                                onBlur={commitProp}
                                className="flex-1 min-w-0 bg-transparent text-xs text-gray-200 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const cols = (selectedEl.tableColumns ?? []).filter((_, i) => i !== idx);
                                  updateProp('tableColumns', cols);
                                  commitProp();
                                }}
                                title="ลบคอลัมน์"
                                className="p-1 rounded text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <select
                                value={col.field}
                                onChange={e => { patchCol({ field: e.target.value }); commitProp(); }}
                                className="flex-1 min-w-0 bg-[#12131e] border border-white/10 rounded text-[10px] text-gray-300 px-1 py-0.5 focus:outline-none"
                              >
                                {TABLE_FIELD_OPTIONS.map(o => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={col.width ?? ''}
                                placeholder="กว้าง"
                                title="ความกว้างคอลัมน์ (px) — เว้นว่างให้แบ่งเท่ากัน"
                                onChange={e => patchCol({ width: e.target.value === '' ? undefined : Number(e.target.value) })}
                                onBlur={commitProp}
                                className="w-14 bg-[#12131e] border border-white/10 rounded text-[10px] text-gray-300 px-1 py-0.5 focus:outline-none tabular-nums"
                              />
                              <div className="flex bg-[#12131e] border border-white/10 rounded overflow-hidden">
                                {([
                                  { val: 'left', icon: AlignLeft },
                                  { val: 'center', icon: AlignCenter },
                                  { val: 'right', icon: AlignRight },
                                ] as const).map(a => (
                                  <button
                                    key={a.val}
                                    type="button"
                                    onClick={() => { patchCol({ align: a.val }); commitProp(); }}
                                    title={`Align ${a.val}`}
                                    className={`p-1 transition-colors ${(col.align ?? 'left') === a.val ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-200'}`}
                                  >
                                    <a.icon className="w-3 h-3" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cols = [...(selectedEl.tableColumns ?? []), { label: '', field: 'name' }];
                        updateProp('tableColumns', cols);
                        commitProp();
                      }}
                      className="mt-2 w-full text-[10px] text-center py-1.5 rounded border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-blue-500 transition-colors"
                    >
                      + เพิ่มคอลัมน์
                    </button>

                    <div className="mt-3">
                      <PropNumber
                        label="จำนวนแถวตัวอย่าง (สำหรับดูตัวอย่างบน canvas)"
                        value={selectedEl.tableRows ?? 2}
                        onChange={v => { updateProp('tableRows', Math.max(1, Math.round(v))); commitProp(); }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <label className="text-[10px] text-gray-500">หัวตารางตัวหนา</label>
                      <button
                        type="button"
                        onClick={() => { updateProp('tableHeaderBold', !(selectedEl.tableHeaderBold ?? true)); commitProp(); }}
                        className={`px-2 py-1 rounded text-[10px] transition-colors ${(selectedEl.tableHeaderBold ?? true) ? 'bg-blue-600 text-white' : 'bg-[#1e1f30] text-gray-400 border border-white/10'}`}
                      >
                        {(selectedEl.tableHeaderBold ?? true) ? 'เปิด' : 'ปิด'}
                      </button>
                    </div>

                    <div className="mt-2">
                      <label className="block text-[10px] text-gray-500 mb-1">สีพื้นหลังหัวตาราง</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedEl.tableHeaderBg ?? '#f3f4f6'}
                          onChange={e => { updateProp('tableHeaderBg', e.target.value); commitProp(); }}
                          className="w-8 h-7 bg-transparent border border-white/10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={selectedEl.tableHeaderBg ?? '#f3f4f6'}
                          onChange={e => updateProp('tableHeaderBg', e.target.value)}
                          onBlur={commitProp}
                          className="flex-1 min-w-0 bg-[#1e1f30] border border-white/10 rounded text-[10px] text-gray-300 px-2 py-1 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <label className="text-[10px] text-gray-500">แถวยอดสุทธิ (ในตาราง)</label>
                      <button
                        type="button"
                        onClick={() => { updateProp('tableShowTotalRow', !(selectedEl.tableShowTotalRow ?? false)); commitProp(); }}
                        className={`px-2 py-1 rounded text-[10px] transition-colors ${(selectedEl.tableShowTotalRow ?? false) ? 'bg-blue-600 text-white' : 'bg-[#1e1f30] text-gray-400 border border-white/10'}`}
                      >
                        {(selectedEl.tableShowTotalRow ?? false) ? 'เปิด' : 'ปิด'}
                      </button>
                    </div>
                    {(selectedEl.tableShowTotalRow ?? false) && (
                      <div className="mt-2">
                        <label className="block text-[10px] text-gray-500 mb-1">ป้ายกำกับแถวยอดสุทธิ</label>
                        <input
                          type="text"
                          value={selectedEl.tableTotalLabel ?? 'ยอดสุทธิ'}
                          onChange={e => updateProp('tableTotalLabel', e.target.value)}
                          onBlur={commitProp}
                          className="w-full bg-[#1e1f30] border border-white/10 rounded text-xs text-gray-200 px-2 py-1.5 focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-[9px] text-gray-600 mt-1">ยอดเงินจะดึงจาก {'{{total_amount}}'} อัตโนมัติ แสดงในคอลัมน์ขวาสุด</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Font Family */}
                {!['line', 'image', 'logo', 'qr_code', 'barcode', 'checkbox', 'signature', 'box'].includes(selectedEl.type) && (
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Font Family</label>
                    <select
                      value={selectedEl.fontFamily ?? 'TH SarabunPSK'}
                      onChange={e => { updateProp('fontFamily', e.target.value); commitProp(); }}
                      className="w-full bg-[#1e1f30] border border-white/10 rounded text-xs text-gray-200 px-2 py-1.5 focus:outline-none focus:border-blue-500"
                      style={{ fontFamily: `"${selectedEl.fontFamily ?? 'TH SarabunPSK'}", "Sarabun", sans-serif` }}
                    >
                      {[
                        { label: 'TH Sarabun PSK', family: 'TH SarabunPSK' },
                        { label: 'Cordia New', family: 'Cordia New' },
                        { label: 'Angsana New', family: 'Angsana New' },
                        { label: 'Browallia New', family: 'Browallia New' },
                      ].map(font => (
                        <option key={font.family} value={font.family} style={{ fontFamily: `"${font.family}", "Sarabun", sans-serif` }}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Font Size */}
                {selectedEl.fontSize !== undefined && (
                  <PropNumber label="Font Size" value={selectedEl.fontSize} onChange={v => { updateProp('fontSize', v); commitProp(); }} />
                )}

                {/* Text Align */}
                {!['line', 'image', 'logo', 'qr_code', 'barcode', 'checkbox', 'table', 'signature', 'box'].includes(selectedEl.type) && (
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Text Align</label>
                    <div className="flex gap-1 bg-[#1e1f30] p-1 rounded border border-white/10">
                      {[
                        { val: 'left', icon: AlignLeft },
                        { val: 'center', icon: AlignCenter },
                        { val: 'right', icon: AlignRight },
                        { val: 'justify', icon: AlignJustify }
                      ].map(a => (
                        <button
                          key={a.val}
                          onClick={() => { updateProp('textAlign', a.val as DesignerElement['textAlign']); commitProp(); }}
                          title={`Align ${a.val}`}
                          className={`flex-1 flex justify-center p-1.5 rounded transition-colors ${(selectedEl.textAlign || 'left') === a.val
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
                            }`}
                        >
                          <a.icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* X */}
                <PropNumber label="X" value={Math.round(selectedEl.x)} onChange={v => { updateProp('x', v); commitProp(); }} />
                {/* Y */}
                <PropNumber label="Y" value={Math.round(selectedEl.y)} onChange={v => { updateProp('y', v); commitProp(); }} />
                {/* Width */}
                <PropNumber label="Width" value={Math.round(selectedEl.width)} onChange={v => { updateProp('width', v); commitProp(); }} />
                {/* Height */}
                <PropNumber label="Height" value={Math.round(selectedEl.height)} onChange={v => { updateProp('height', v); commitProp(); }} />
              </div>
            ) : (
              <div className="px-3 py-6 text-center text-[11px] text-gray-600">
                เลือก element บน canvas<br />เพื่อแก้ไข properties
              </div>
            )}
          </div>
            </aside>
          </>
        )}
      </div>

      {/* ── Preview Modal ──────────────────────────────────────────────── */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 rounded-lg">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white font-sans text-left">ตัวอย่างเอกสารก่อนพิมพ์</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-sans text-left">พรีวิวรูปแบบเอกสารตามที่ได้ออกแบบไว้</p>
                </div>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {documents && documents.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center gap-3">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">ดูตัวอย่างจากเอกสารจริง</label>
                <select
                  value={previewDocumentId}
                  onChange={e => setPreviewDocumentId(e.target.value)}
                  className="flex-1 max-w-xs text-sm px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">ตัวอย่าง (ข้อมูลตัวอย่าง)</option>
                  {documents.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.documentNo} — {doc.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex-1 overflow-auto p-6 bg-gray-100 dark:bg-slate-900/50 text-gray-900 flex justify-center">
              <DocumentPreview
                layoutJsonString={JSON.stringify({
                  pages: [{ id: 'page-1', width: paperW, height: paperH, background: '#ffffff' }],
                  elements
                })}
                dataOverride={(() => {
                  const doc = documents?.find(d => d.id === previewDocumentId)
                  return doc ? mapDocumentToTemplateData(doc, doc.company, doc.createdBy) : undefined
                })()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable number input ─────────────────────────────────────────────────────
function PropNumber({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-[10px] text-gray-500 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-[#1e1f30] border border-white/10 rounded text-xs text-gray-200 px-2 py-1.5 focus:outline-none focus:border-blue-500 tabular-nums"
      />
    </div>
  );
}
