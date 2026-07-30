"use client";

import {
  Barcode,
  Box,
  Building2,
  CalendarDays,
  CheckSquare,
  Copy,
  FileDown,
  FileJson,
  FileText,
  Grip,
  Image,
  Layers3,
  Minus,
  Plus,
  QrCode,
  Redo2,
  Save,
  Signature,
  Table,
  Trash2,
  Type,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  dynamicFieldKeys,
  renderElementContent,
  sampleDocumentData,
  type DesignerElement,
  type DesignerElementType,
  type DesignerHistory,
  type DesignerPage,
  type DesignerSnapshot,
} from "@/lib/document-designer";

type ElementPaletteItem = {
  label: string;
  type: DesignerElementType;
  icon: typeof Type;
};

const pageWidth = 794;
const pageHeight = 1123;

const elementPalette: ElementPaletteItem[] = [
  { label: "Text", type: "text", icon: Type },
  { label: "Heading", type: "heading", icon: Type },
  { label: "Paragraph", type: "paragraph", icon: FileText },
  { label: "Image", type: "image", icon: Image },
  { label: "Logo", type: "logo", icon: Building2 },
  { label: "Table", type: "table", icon: Table },
  { label: "Line", type: "line", icon: Grip },
  { label: "Box", type: "box", icon: Box },
  { label: "Signature", type: "signature", icon: Signature },
  { label: "Date", type: "date", icon: CalendarDays },
  { label: "Page Number", type: "pageNumber", icon: Layers3 },
  { label: "Checkbox", type: "checkbox", icon: CheckSquare },
  { label: "QR Code", type: "qrCode", icon: QrCode },
  { label: "Barcode", type: "barcode", icon: Barcode },
  { label: "Dynamic Field", type: "dynamicField", icon: FileJson },
];

const initialPages: DesignerPage[] = [
  { id: "page-1", name: "Page 1", order: 1, width: pageWidth, height: pageHeight },
];

const initialElements: DesignerElement[] = [
  {
    id: "element-heading",
    type: "heading",
    pageId: "page-1",
    x: 56,
    y: 54,
    width: 330,
    height: 58,
    content: "ใบเสนอราคา",
    style: { fontSize: 28, fontWeight: 700, color: "#0f172a", textAlign: "left" },
    config: {},
  },
  {
    id: "element-doc-no",
    type: "dynamicField",
    pageId: "page-1",
    x: 56,
    y: 124,
    width: 220,
    height: 34,
    content: "document.documentNo",
    style: { fontSize: 14, fontWeight: 600, color: "#2563eb" },
    config: { fieldKey: "document.documentNo" },
  },
  {
    id: "element-customer",
    type: "text",
    pageId: "page-1",
    x: 56,
    y: 190,
    width: 330,
    height: 72,
    content: "ลูกค้า: {{customer.name}}\nเลขผู้เสียภาษี: {{customer.taxId}}",
    style: { fontSize: 14, fontWeight: 400, color: "#334155", whiteSpace: "pre-line" },
    config: {},
  },
  {
    id: "element-total",
    type: "dynamicField",
    pageId: "page-1",
    x: 560,
    y: 860,
    width: 160,
    height: 42,
    content: "document.total",
    style: { fontSize: 22, fontWeight: 700, color: "#0f172a", textAlign: "right" },
    config: { fieldKey: "document.total" },
  },
];

const initialSnapshot: DesignerSnapshot = {
  selectedPageId: "page-1",
  selectedElementId: "element-heading",
  zoom: 0.72,
  pages: initialPages,
  elements: initialElements,
  isDirty: false,
  isSaving: false,
};

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function reorderPages(pages: DesignerPage[]) {
  return pages.map((page, index) => ({ ...page, order: index + 1, name: `Page ${index + 1}` }));
}

function elementDefaults(type: DesignerElementType, pageId: string): DesignerElement {
  const base = {
    id: createId("element"),
    type,
    pageId,
    x: 84,
    y: 84,
    width: 220,
    height: 56,
    style: { fontSize: 14, fontWeight: 400, color: "#0f172a" },
    config: {},
  };

  if (type === "heading") return { ...base, height: 60, content: "หัวข้อเอกสาร", style: { ...base.style, fontSize: 24, fontWeight: 700 } };
  if (type === "paragraph") return { ...base, height: 92, content: "ข้อความรายละเอียดเอกสาร" };
  if (type === "image" || type === "logo") return { ...base, width: 160, height: 96, content: "Image Placeholder" };
  if (type === "table") return { ...base, width: 480, height: 180, content: "รายการสินค้า / บริการ" };
  if (type === "line") return { ...base, width: 320, height: 2, content: "" };
  if (type === "box") return { ...base, width: 260, height: 120, content: "" };
  if (type === "signature") return { ...base, width: 220, height: 88, content: "ลายเซ็นผู้มีอำนาจ" };
  if (type === "date") return { ...base, content: "{{document.date}}" };
  if (type === "pageNumber") return { ...base, width: 100, height: 28, content: "Page 1" };
  if (type === "checkbox") return { ...base, width: 140, height: 32, content: "ตัวเลือก" };
  if (type === "qrCode" || type === "barcode") return { ...base, width: 110, height: 110, content: type === "qrCode" ? "QR" : "BARCODE" };
  if (type === "dynamicField") return { ...base, content: "company.name", config: { fieldKey: "company.name" }, style: { ...base.style, color: "#2563eb", fontWeight: 600 } };
  return { ...base, content: "ข้อความ" };
}

function useDocumentDesigner() {
  const [history, setHistory] = useState<DesignerHistory>({ past: [], present: initialSnapshot, future: [] });
  const state = history.present;

  const commit = (updater: (snapshot: DesignerSnapshot) => DesignerSnapshot, saveHistory = true) => {
    setHistory((current) => {
      const next = { ...updater(current.present), isDirty: true };
      if (!saveHistory) return { ...current, present: next };
      return { past: [...current.past, current.present], present: next, future: [] };
    });
  };

  function undo() {
    setHistory((current) => {
      const previous = current.past.at(-1);
      if (!previous) return current;
      return { past: current.past.slice(0, -1), present: previous, future: [current.present, ...current.future] };
    });
  }

  function redo() {
    setHistory((current) => {
      const next = current.future[0];
      if (!next) return current;
      return { past: [...current.past, current.present], present: next, future: current.future.slice(1) };
    });
  }

  function addPage() {
    commit((snapshot) => {
      const page: DesignerPage = { id: createId("page"), name: `Page ${snapshot.pages.length + 1}`, order: snapshot.pages.length + 1, width: pageWidth, height: pageHeight };
      return { ...snapshot, pages: [...snapshot.pages, page], selectedPageId: page.id, selectedElementId: null };
    });
  }

  function updatePage(pageId: string, data: Partial<DesignerPage>) {
    commit((snapshot) => ({ ...snapshot, pages: snapshot.pages.map((page) => page.id === pageId ? { ...page, ...data } : page) }));
  }

  function deletePage(pageId: string) {
    commit((snapshot) => {
      if (snapshot.pages.length === 1) return snapshot;
      const pageIndex = snapshot.pages.findIndex((page) => page.id === pageId);
      const nextPages = reorderPages(snapshot.pages.filter((page) => page.id !== pageId));
      const fallbackPage = nextPages[Math.max(0, Math.min(pageIndex, nextPages.length - 1))];
      return {
        ...snapshot,
        pages: nextPages,
        elements: snapshot.elements.filter((element) => element.pageId !== pageId),
        selectedPageId: fallbackPage.id,
        selectedElementId: null,
      };
    });
  }

  function duplicatePage(pageId: string) {
    commit((snapshot) => {
      const sourcePage = snapshot.pages.find((page) => page.id === pageId);
      if (!sourcePage) return snapshot;
      const newPageId = createId("page");
      const sourceIndex = snapshot.pages.findIndex((page) => page.id === pageId);
      const pageCopy: DesignerPage = { ...sourcePage, id: newPageId, name: `${sourcePage.name} Copy`, order: sourceIndex + 2 };
      const elementCopies = snapshot.elements
        .filter((element) => element.pageId === pageId)
        .map((element) => ({ ...element, id: createId("element"), pageId: newPageId, x: element.x + 16, y: element.y + 16 }));
      const nextPages = reorderPages([...snapshot.pages.slice(0, sourceIndex + 1), pageCopy, ...snapshot.pages.slice(sourceIndex + 1)]);
      return { ...snapshot, pages: nextPages, elements: [...snapshot.elements, ...elementCopies], selectedPageId: newPageId, selectedElementId: elementCopies[0]?.id ?? null };
    });
  }

  function reorderPage(fromIndex: number, toIndex: number) {
    commit((snapshot) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= snapshot.pages.length || toIndex >= snapshot.pages.length) return snapshot;
      const nextPages = [...snapshot.pages];
      const [page] = nextPages.splice(fromIndex, 1);
      nextPages.splice(toIndex, 0, page);
      return { ...snapshot, pages: reorderPages(nextPages) };
    });
  }

  function selectPage(pageId: string) {
    commit((snapshot) => ({ ...snapshot, selectedPageId: pageId, selectedElementId: null }), false);
  }

  function addElement(type: DesignerElementType) {
    commit((snapshot) => {
      const element = elementDefaults(type, snapshot.selectedPageId);
      return { ...snapshot, elements: [...snapshot.elements, element], selectedElementId: element.id };
    });
  }

  function updateElement(elementId: string, data: Partial<DesignerElement>) {
    commit((snapshot) => ({ ...snapshot, elements: snapshot.elements.map((element) => element.id === elementId ? { ...element, ...data } : element) }));
  }

  function deleteElement(elementId: string) {
    commit((snapshot) => ({ ...snapshot, elements: snapshot.elements.filter((element) => element.id !== elementId), selectedElementId: snapshot.selectedElementId === elementId ? null : snapshot.selectedElementId }));
  }

  function duplicateElement(elementId: string) {
    commit((snapshot) => {
      const source = snapshot.elements.find((element) => element.id === elementId);
      if (!source) return snapshot;
      const copy = { ...source, id: createId("element"), x: source.x + 20, y: source.y + 20 };
      return { ...snapshot, elements: [...snapshot.elements, copy], selectedElementId: copy.id };
    });
  }

  function moveElement(elementId: string, x: number, y: number) {
    updateElement(elementId, { x, y });
  }

  function resizeElement(elementId: string, width: number, height: number) {
    updateElement(elementId, { width, height });
  }

  function selectElement(elementId: string) {
    commit((snapshot) => ({ ...snapshot, selectedElementId: elementId }), false);
  }

  function setZoom(zoom: number) {
    commit((snapshot) => ({ ...snapshot, zoom: Math.min(1.4, Math.max(0.45, zoom)) }), false);
  }

  function saveDesigner() {
    setHistory((current) => ({ ...current, present: { ...current.present, isSaving: true } }));
    window.setTimeout(() => {
      setHistory((current) => ({ past: current.past, future: current.future, present: { ...current.present, isSaving: false, isDirty: false } }));
    }, 600);
  }

  return {
    state,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    addPage,
    updatePage,
    deletePage,
    duplicatePage,
    reorderPage,
    selectPage,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    moveElement,
    resizeElement,
    selectElement,
    setZoom,
    saveDesigner,
  };
}

function IconButton({ label, children, onClick, disabled = false }: { label: string; children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
    >
      {children}
    </button>
  );
}

function ElementView({ element, selected, onSelect }: { element: DesignerElement; selected: boolean; onSelect: () => void }) {
  const content = renderElementContent(element, sampleDocumentData);
  const commonStyle = {
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    ...element.style,
  } as CSSProperties;

  if (element.type === "line") {
    return (
      <button type="button" onClick={onSelect} className={`absolute ${selected ? "ring-2 ring-blue-500" : ""}`} style={commonStyle}>
        <span className="block h-0.5 w-full bg-slate-400" />
      </button>
    );
  }

  if (element.type === "box") {
    return <button type="button" onClick={onSelect} className={`absolute border border-slate-300 bg-slate-50/60 ${selected ? "ring-2 ring-blue-500" : ""}`} style={commonStyle} />;
  }

  if (["image", "logo", "qrCode", "barcode"].includes(element.type)) {
    return (
      <button type="button" onClick={onSelect} className={`absolute grid place-items-center rounded border border-dashed border-slate-300 bg-slate-50 text-xs font-semibold text-slate-500 ${selected ? "ring-2 ring-blue-500" : ""}`} style={commonStyle}>
        {content}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`absolute overflow-hidden rounded border border-transparent p-2 text-left transition hover:border-blue-300 ${selected ? "border-blue-500 ring-2 ring-blue-500/20" : ""}`}
      style={commonStyle}
    >
      {content}
    </button>
  );
}

export function DocumentDesigner() {
  const designer = useDocumentDesigner();
  const { state } = designer;
  const selectedPage = state.pages.find((page) => page.id === state.selectedPageId) ?? state.pages[0];
  const pageElements = state.elements.filter((element) => element.pageId === selectedPage.id);
  const selectedElement = state.elements.find((element) => element.id === state.selectedElementId) ?? null;
  const selectedPageIndex = state.pages.findIndex((page) => page.id === state.selectedPageId);
  const layoutJson = useMemo(() => JSON.stringify({ pages: state.pages, elements: state.elements }, null, 2), [state.pages, state.elements]);
  const exportPayload = useMemo(() => JSON.stringify({
    paperSize: "A4",
    orientation: selectedPage.width > selectedPage.height ? "LANDSCAPE" : "PORTRAIT",
    layoutJson: { pages: state.pages, elements: state.elements },
    dataJson: sampleDocumentData,
  }, null, 2), [selectedPage.height, selectedPage.width, state.elements, state.pages]);

  return (
    <div className="grid min-h-[760px] gap-4 xl:grid-cols-[250px_1fr_320px]">
      <aside className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Elements</h2>
          <div className="mt-3 grid gap-2">
            {elementPalette.map((item) => (
              <button key={item.type} type="button" onClick={() => designer.addElement(item.type)} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 dark:border-slate-800 dark:text-slate-200">
                <item.icon className="size-4 text-blue-700 dark:text-blue-300" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Dynamic Field</h2>
          <div className="mt-3 grid gap-2">
            {dynamicFieldKeys.map((fieldKey) => (
              <button key={fieldKey} type="button" onClick={() => designer.addElement("dynamicField")} className="rounded-md border border-slate-200 px-3 py-2 text-left font-mono text-xs text-blue-700 hover:bg-blue-50 dark:border-slate-800 dark:text-blue-300">
                {`{{${fieldKey}}}`}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="min-w-0 rounded-lg border border-slate-200 bg-slate-100 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <IconButton label="Undo" onClick={designer.undo} disabled={!designer.canUndo}><Undo2 className="size-4" /></IconButton>
            <IconButton label="Redo" onClick={designer.redo} disabled={!designer.canRedo}><Redo2 className="size-4" /></IconButton>
            <IconButton label="Zoom In" onClick={() => designer.setZoom(state.zoom + 0.08)}><ZoomIn className="size-4" /></IconButton>
            <IconButton label="Zoom Out" onClick={() => designer.setZoom(state.zoom - 0.08)}><ZoomOut className="size-4" /></IconButton>
            <IconButton label="Export PDF"><FileDown className="size-4" /></IconButton>
            <IconButton label="Import JSON"><Upload className="size-4" /></IconButton>
          </div>
          <button type="button" onClick={designer.saveDesigner} className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700">
            <Save className="size-4" />
            {state.isSaving ? "Saving..." : state.isDirty ? "Save changes" : "Saved"}
          </button>
        </div>

        <div className="overflow-auto rounded-md bg-slate-200/70 p-6 dark:bg-slate-950/40">
          <div
            className="relative mx-auto origin-top border border-slate-300 bg-white shadow-lg"
            style={{
              width: selectedPage.width,
              height: selectedPage.height,
              transform: `scale(${state.zoom})`,
              marginBottom: selectedPage.height * (state.zoom - 1),
              backgroundImage: "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          >
            {pageElements.map((element) => (
              <ElementView key={element.id} element={element} selected={element.id === state.selectedElementId} onSelect={() => designer.selectElement(element.id)} />
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
          {state.pages.map((page, index) => (
            <div key={page.id} className={`w-32 shrink-0 rounded-md border p-3 text-xs ${page.id === state.selectedPageId ? "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100" : "border-slate-200 dark:border-slate-800"}`}>
              <button type="button" onClick={() => designer.selectPage(page.id)} className="block w-full text-left font-semibold">{page.name}</button>
              <p className="mt-1 text-slate-500">{state.elements.filter((element) => element.pageId === page.id).length} elements</p>
              <div className="mt-2 flex gap-1">
                <button type="button" title="Duplicate page" onClick={() => designer.duplicatePage(page.id)} className="grid size-6 place-items-center rounded border border-slate-200"><Copy className="size-3" /></button>
                <button type="button" title="Delete page" onClick={() => designer.deletePage(page.id)} disabled={state.pages.length === 1} className="grid size-6 place-items-center rounded border border-slate-200 disabled:opacity-40"><Trash2 className="size-3" /></button>
                <button type="button" title="Move left" onClick={() => designer.reorderPage(index, index - 1)} disabled={index === 0} className="grid size-6 place-items-center rounded border border-slate-200 disabled:opacity-40"><Minus className="size-3" /></button>
                <button type="button" title="Move right" onClick={() => designer.reorderPage(index, index + 1)} disabled={index === state.pages.length - 1} className="grid size-6 place-items-center rounded border border-slate-200 disabled:opacity-40"><Plus className="size-3" /></button>
              </div>
            </div>
          ))}
          <button type="button" onClick={designer.addPage} className="grid w-32 shrink-0 place-items-center rounded-md border border-dashed border-slate-300 p-3 text-xs font-semibold text-slate-600 hover:bg-blue-50 dark:border-slate-700">
            Add Page
          </button>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">State</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <StateItem label="selectedPageId" value={state.selectedPageId} />
            <StateItem label="selectedElementId" value={state.selectedElementId ?? "-"} />
            <StateItem label="zoom" value={`${Math.round(state.zoom * 100)}%`} />
            <StateItem label="pages" value={String(state.pages.length)} />
            <StateItem label="elements" value={String(state.elements.length)} />
            <StateItem label="history" value={`${designer.canUndo ? "undo" : "-"} / ${designer.canRedo ? "redo" : "-"}`} />
            <StateItem label="isDirty" value={String(state.isDirty)} />
            <StateItem label="isSaving" value={String(state.isSaving)} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Properties</h2>
          {selectedElement ? (
            <div className="mt-3 space-y-2">
              <Field label="Content" value={selectedElement.content} onChange={(content) => designer.updateElement(selectedElement.id, { content })} />
              <NumberField label="X" value={selectedElement.x} onChange={(x) => designer.moveElement(selectedElement.id, x, selectedElement.y)} />
              <NumberField label="Y" value={selectedElement.y} onChange={(y) => designer.moveElement(selectedElement.id, selectedElement.x, y)} />
              <NumberField label="Width" value={selectedElement.width} onChange={(width) => designer.resizeElement(selectedElement.id, width, selectedElement.height)} />
              <NumberField label="Height" value={selectedElement.height} onChange={(height) => designer.resizeElement(selectedElement.id, selectedElement.width, height)} />
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button type="button" onClick={() => designer.duplicateElement(selectedElement.id)} className="h-9 rounded-md border border-slate-200 text-xs font-semibold dark:border-slate-800">Duplicate</button>
                <button type="button" onClick={() => designer.deleteElement(selectedElement.id)} className="h-9 rounded-md bg-rose-600 text-xs font-semibold text-white">Delete</button>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <Field label="Page Name" value={selectedPage.name} onChange={(name) => designer.updatePage(selectedPage.id, { name })} />
              <StateItem label="Page Order" value={String(selectedPageIndex + 1)} />
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">layoutJson</h2>
          <pre className="mt-3 max-h-56 overflow-auto rounded-md bg-slate-950 p-3 text-[11px] leading-5 text-blue-100">{layoutJson}</pre>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">PDF Export</h2>
          <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300">
            <p>A4 / Portrait-Landscape</p>
            <p>Thai font: Noto Sans Thai, Sarabun</p>
            <p>Multi-page: {state.pages.length} page(s)</p>
            <p>Images, logo, signature: supported in render plan</p>
          </div>
          <pre className="mt-3 max-h-44 overflow-auto rounded-md bg-slate-950 p-3 text-[11px] leading-5 text-emerald-100">{exportPayload}</pre>
        </div>
      </aside>
    </div>
  );
}

function StateItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900">
      <p className="text-[10px] uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate font-mono text-xs text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-medium text-slate-500">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-20 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-xs font-medium text-slate-500">
      {label}
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
    </label>
  );
}
