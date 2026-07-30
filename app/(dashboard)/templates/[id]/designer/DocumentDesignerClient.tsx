'use client';

import { useState, useRef, useCallback, useTransition } from 'react';
import Link from 'next/link';
import {
  Undo2, Redo2, ZoomIn, ZoomOut, Download, Save,
  Type, Heading1, AlignLeft, Image, Building2,
  Table2, Minus, Square, PenLine, Calendar,
  Hash, CheckSquare, QrCode, Barcode,
  ChevronRight, MousePointer2, Trash2,
  ScanLine,
} from 'lucide-react';
import { saveDesignerLayout } from '../../actions';

// ─── Types ──────────────────────────────────────────────────────────────────

type ElementType =
  | 'text' | 'heading' | 'paragraph' | 'image' | 'logo'
  | 'table' | 'line' | 'box' | 'signature' | 'date'
  | 'page_number' | 'checkbox' | 'qr_code' | 'barcode';

interface DesignerElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
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

// ─── Element palette config ──────────────────────────────────────────────────

const ELEMENT_PALETTE: { type: ElementType; label: string; icon: React.ElementType }[] = [
  { type: 'text',        label: 'Text',         icon: Type },
  { type: 'heading',     label: 'Heading',       icon: Heading1 },
  { type: 'paragraph',   label: 'Paragraph',     icon: AlignLeft },
  { type: 'image',       label: 'Image',         icon: Image },
  { type: 'logo',        label: 'Logo',          icon: Building2 },
  { type: 'table',       label: 'Table',         icon: Table2 },
  { type: 'line',        label: 'Line',          icon: Minus },
  { type: 'box',         label: 'Box',           icon: Square },
  { type: 'signature',   label: 'Signature',     icon: PenLine },
  { type: 'date',        label: 'Date',          icon: Calendar },
  { type: 'page_number', label: 'Page Number',   icon: Hash },
  { type: 'checkbox',    label: 'Checkbox',      icon: CheckSquare },
  { type: 'qr_code',     label: 'QR Code',       icon: QrCode },
  { type: 'barcode',     label: 'Barcode',       icon: ScanLine },
];

// ─── Default element properties ──────────────────────────────────────────────

const DEFAULT_PROPS: Record<ElementType, Partial<DesignerElement>> = {
  text:        { width: 200, height: 30,  content: 'ข้อความ',         fontSize: 14 },
  heading:     { width: 330, height: 58,  content: 'ใบเสนอราคา',      fontSize: 24, fontWeight: 'bold' },
  paragraph:   { width: 250, height: 60,  content: 'ข้อความย่อหน้า',  fontSize: 12 },
  image:       { width: 120, height: 120, content: '[Image]' },
  logo:        { width: 80,  height: 80,  content: '[Logo]' },
  table:       { width: 300, height: 100, content: '[Table]' },
  line:        { width: 300, height: 2,   content: '' },
  box:         { width: 200, height: 100, content: '' },
  signature:   { width: 150, height: 60,  content: '[Signature]' },
  date:        { width: 120, height: 30,  content: '{{date}}',         fontSize: 12 },
  page_number: { width: 60,  height: 24,  content: '{{page}}',         fontSize: 11 },
  checkbox:    { width: 16,  height: 16,  content: '' },
  qr_code:     { width: 80,  height: 80,  content: '{{qr}}' },
  barcode:     { width: 150, height: 50,  content: '{{barcode}}' },
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

// ─── Element Renderer ────────────────────────────────────────────────────────

function renderElement(el: DesignerElement, selected: boolean) {
  const base = `absolute select-none cursor-move border-2 transition-colors ${
    selected
      ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.3)]'
      : 'border-transparent hover:border-blue-300'
  }`;

  if (el.type === 'line') {
    return (
      <div
        key={el.id}
        className={`${base} flex items-center`}
        style={{ left: el.x, top: el.y, width: el.width, height: Math.max(el.height, 8) }}
      >
        <div className="w-full h-px bg-gray-700" />
      </div>
    );
  }

  if (el.type === 'box') {
    return (
      <div
        key={el.id}
        className={`${base} bg-transparent border-dashed border-gray-400`}
        style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
      />
    );
  }

  if (el.type === 'image' || el.type === 'logo') {
    return (
      <div
        key={el.id}
        className={`${base} bg-gray-100 flex items-center justify-center text-gray-400 text-xs rounded`}
        style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
      >
        <span>{el.type === 'logo' ? '🏢 Logo' : '🖼 Image'}</span>
      </div>
    );
  }

  if (el.type === 'signature') {
    return (
      <div
        key={el.id}
        className={`${base} border border-dashed border-gray-400 flex items-end justify-center pb-1`}
        style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
      >
        <span className="text-[10px] text-gray-400">ลายเซ็น</span>
      </div>
    );
  }

  if (el.type === 'table') {
    return (
      <div
        key={el.id}
        className={`${base} overflow-hidden`}
        style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
      >
        <table className="w-full h-full border-collapse text-[10px]">
          <tbody>
            {[0,1,2].map(r => (
              <tr key={r}>
                {[0,1,2,3].map(c => (
                  <td key={c} className="border border-gray-300 px-1 py-0.5 text-gray-400" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (el.type === 'checkbox') {
    return (
      <div
        key={el.id}
        className={`${base} flex items-center justify-center`}
        style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
      >
        <div className="w-3 h-3 border border-gray-500 rounded-sm" />
      </div>
    );
  }

  if (el.type === 'qr_code') {
    return (
      <div
        key={el.id}
        className={`${base} bg-white flex items-center justify-center`}
        style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
      >
        <QrCode className="w-8 h-8 text-gray-500" />
      </div>
    );
  }

  if (el.type === 'barcode') {
    return (
      <div
        key={el.id}
        className={`${base} bg-white flex items-center justify-center`}
        style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
      >
        <ScanLine className="w-10 h-6 text-gray-700" />
      </div>
    );
  }

  // text / heading / paragraph / date / page_number
  return (
    <div
      key={el.id}
      className={`${base} flex items-start`}
      style={{
        left: el.x, top: el.y, width: el.width, height: el.height,
        fontSize: el.fontSize ?? 14,
        fontWeight: el.fontWeight ?? 'normal',
        color: el.color ?? '#111827',
        lineHeight: 1.4,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        padding: '2px 4px',
      }}
    >
      {el.content || <span className="text-gray-300 italic text-xs">ว่าง</span>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DocumentDesignerClient({ template }: { template: TemplateInfo }) {
  // ── State ────────────────────────────────────────────────────────────────
  const [elements, setElements] = useState<DesignerElement[]>(() =>
    loadInitialElements(template.layoutJson)
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(72); // percentage
  const [history, setHistory] = useState<DesignerElement[][]>([loadInitialElements(template.layoutJson)]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);

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
      x: 40 + Math.floor(Math.random() * 60),
      y: 40 + elements.length * 20,
      width: defaults.width ?? 120,
      height: defaults.height ?? 30,
      content: defaults.content ?? '',
      fontSize: defaults.fontSize,
      fontWeight: defaults.fontWeight,
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
      if (!dragRef.current) return;
      const scale = zoom / 100;
      const dx = (mv.clientX - dragRef.current.startX) / scale;
      const dy = (mv.clientY - dragRef.current.startY) / scale;
      setElements(prev => prev.map(el =>
        el.id === dragRef.current!.id
          ? { ...el, x: Math.max(0, dragRef.current!.elX + dx), y: Math.max(0, dragRef.current!.elY + dy) }
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
  const updateProp = (key: keyof DesignerElement, value: string | number) => {
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

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    startSaving(async () => {
      await saveDesignerLayout(template.id, { elements });
      setIsDirty(false);
    });
  };

  // ── Paper size ────────────────────────────────────────────────────────────
  const PAPER_W = template.paperSize === 'A5' ? 419 : template.paperSize === 'LETTER' ? 612 : 595;
  const PAPER_H = template.paperSize === 'A5' ? 595 : template.paperSize === 'LETTER' ? 792 : 842;
  const [paperW, paperH] =
    template.orientation === 'LANDSCAPE' ? [PAPER_H, PAPER_W] : [PAPER_W, PAPER_H];

  const scaledW = paperW * (zoom / 100);
  const scaledH = paperH * (zoom / 100);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#1a1b2e] text-white">

      {/* ── Top Nav Bar ───────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#12131f] border-b border-white/10 shrink-0 z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Link href="/templates" className="hover:text-white transition-colors">Template</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/templates/${template.id}`} className="hover:text-white transition-colors truncate max-w-[140px]">
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

          {/* Download placeholder */}
          <button
            title="Export"
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              isDirty
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
      <div className="flex flex-1 min-h-0">

        {/* ── Left: Elements Palette ─────────────────────────────────── */}
        <aside className="w-44 shrink-0 bg-[#12131f] border-r border-white/10 overflow-y-auto">
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
          className="flex-1 overflow-auto bg-[#252636] flex items-start justify-center py-8 px-6"
          onClick={() => setSelectedId(null)}
        >
          <div
            ref={canvasRef}
            className="relative bg-white shadow-2xl shadow-black/60"
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
                  className={`w-full h-full select-none cursor-move border-2 transition-colors ${
                    selectedId === el.id
                      ? 'border-blue-500 ring-2 ring-blue-400/30'
                      : 'border-transparent hover:border-blue-300/60'
                  }`}
                  style={{
                    fontSize: (el.fontSize ?? 14) * (zoom / 100),
                    fontWeight: el.fontWeight ?? 'normal',
                    color: el.color ?? '#111827',
                    lineHeight: 1.4,
                    padding: el.type === 'line' ? 0 : `${2 * (zoom / 100)}px ${4 * (zoom / 100)}px`,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    background: el.type === 'box' ? 'transparent' : (el.type === 'image' || el.type === 'logo') ? '#f3f4f6' : 'transparent',
                    border: el.type === 'box' ? `1px dashed #9ca3af` : undefined,
                    display: 'flex',
                    alignItems: el.type === 'line' ? 'center' : 'flex-start',
                    justifyContent: (el.type === 'image' || el.type === 'logo' || el.type === 'qr_code' || el.type === 'barcode' || el.type === 'checkbox') ? 'center' : 'flex-start',
                  }}
                >
                  {el.type === 'line' && <div className="w-full border-t border-gray-400" />}
                  {el.type === 'image' && <span className="text-gray-400 text-xs">🖼 Image</span>}
                  {el.type === 'logo' && <span className="text-gray-400 text-xs">🏢 Logo</span>}
                  {el.type === 'qr_code' && <QrCode className="text-gray-500" style={{ width: el.width * (zoom / 100) * 0.6, height: el.width * (zoom / 100) * 0.6 }} />}
                  {el.type === 'barcode' && <ScanLine className="text-gray-700" style={{ width: el.width * (zoom / 100) * 0.7, height: el.height * (zoom / 100) * 0.6 }} />}
                  {el.type === 'checkbox' && <div style={{ width: 12 * (zoom / 100), height: 12 * (zoom / 100), border: `1px solid #6b7280`, borderRadius: 2 }} />}
                  {el.type === 'table' && (
                    <table className="w-full h-full border-collapse" style={{ fontSize: 10 * (zoom / 100) }}>
                      <tbody>
                        {[0,1,2].map(r => (
                          <tr key={r}>
                            {[0,1,2,3].map(c => (
                              <td key={c} className="border border-gray-300 text-gray-400 px-1" />
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {el.type === 'signature' && (
                    <div className="w-full h-full flex items-end justify-center border-b border-dashed border-gray-400 pb-1">
                      <span style={{ fontSize: 10 * (zoom / 100), color: '#9ca3af' }}>ลายเซ็น</span>
                    </div>
                  )}
                  {!['line','image','logo','qr_code','barcode','checkbox','table','signature','box'].includes(el.type) && (
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
        <aside className="w-52 shrink-0 bg-[#12131f] border-l border-white/10 overflow-y-auto">

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
                {!['line','image','logo','qr_code','barcode','checkbox','table','signature','box'].includes(selectedEl.type) && (
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Content</label>
                    <textarea
                      value={selectedEl.content}
                      onChange={e => updateProp('content', e.target.value)}
                      onBlur={commitProp}
                      rows={3}
                      className="w-full bg-[#1e1f30] border border-white/10 rounded text-xs text-gray-200 p-2 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                )}

                {/* Font Size */}
                {selectedEl.fontSize !== undefined && (
                  <PropNumber label="Font Size" value={selectedEl.fontSize} onChange={v => { updateProp('fontSize', v); commitProp(); }} />
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
      </div>
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
