'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Plus, Edit2, Trash2, X, Search, Loader2,
  LayoutTemplate, FileText, Columns, Code2,
  ChevronDown, ArrowRight, CheckCircle, XCircle,
} from 'lucide-react';
import { createTemplate, updateTemplate, deleteTemplate } from './actions';
import type { TemplateWithRelations } from './actions';
import { TemplateMode, PaperSize, PaperOrientation } from '@prisma/client';

type Category = { id: string; name: string };
type DocType = { id: string; name: string; categoryId: string };

type Props = {
  initialTemplates: TemplateWithRelations[];
  categories: Category[];
  docTypes: DocType[];
};

const MODE_CONFIG: Record<TemplateMode, { label: string; icon: React.ElementType; color: string; bg: string; desc: string }> = {
  FORM: {
    label: 'Form',
    icon: FileText,
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    desc: 'แบบฟอร์มกรอกข้อมูลทีละช่อง',
  },
  DESIGNER: {
    label: 'Designer',
    icon: Columns,
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    desc: 'ออกแบบเอกสารแบบ drag & drop',
  },
  HTML: {
    label: 'HTML',
    icon: Code2,
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    desc: 'กำหนด layout ด้วย HTML/CSS',
  },
};

const PAPER_SIZES: PaperSize[] = ['A4', 'A5', 'LETTER', 'LEGAL'];
const ORIENTATIONS: { value: PaperOrientation; label: string }[] = [
  { value: 'PORTRAIT', label: 'แนวตั้ง (Portrait)' },
  { value: 'LANDSCAPE', label: 'แนวนอน (Landscape)' },
];

function ModeBadge({ mode }: { mode: TemplateMode }) {
  const cfg = MODE_CONFIG[mode];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function TemplatesClient({ initialTemplates, categories, docTypes }: Props) {
  const [templates, setTemplates] = useState<TemplateWithRelations[]>(initialTemplates);
  const [filteredTypes, setFilteredTypes] = useState<DocType[]>(docTypes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<TemplateMode | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const [formData, setFormData] = useState({
    name: '',
    categoryId: categories[0]?.id || '',
    documentTypeId: '',
    description: '',
    templateMode: 'FORM' as TemplateMode,
    formType: 'STANDARD',
    paperSize: 'A4' as PaperSize,
    orientation: 'PORTRAIT' as PaperOrientation,
    isActive: true,
  });

  const filtered = templates.filter((t) => {
    const q = searchQuery.toLowerCase();
    const match =
      t.name.toLowerCase().includes(q) ||
      t.category.name.toLowerCase().includes(q) ||
      t.documentType.name.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q);
    const modeMatch = filterMode === 'ALL' || t.templateMode === filterMode;
    const catMatch = filterCategory === 'ALL' || t.category.id === filterCategory;
    return match && modeMatch && catMatch;
  });

  const handleCategoryChange = (categoryId: string) => {
    const ft = docTypes.filter((dt) => !categoryId || dt.categoryId === categoryId);
    setFilteredTypes(ft);
    setFormData((prev) => ({
      ...prev,
      categoryId,
      documentTypeId: ft[0]?.id || '',
    }));
  };

  const handleOpenModal = (tpl?: TemplateWithRelations) => {
    if (tpl) {
      setEditingId(tpl.id);
      const ft = docTypes.filter((dt) => dt.categoryId === tpl.category.id);
      setFilteredTypes(ft);
      setFormData({
        name: tpl.name,
        categoryId: tpl.category.id,
        documentTypeId: tpl.documentType.id,
        description: tpl.description || '',
        templateMode: tpl.templateMode,
        formType: tpl.formType || 'STANDARD',
        paperSize: tpl.paperSize,
        orientation: tpl.orientation,
        isActive: tpl.isActive,
      });
    } else {
      setEditingId(null);
      const ft = docTypes.filter((dt) => !categories[0]?.id || dt.categoryId === categories[0]?.id);
      setFilteredTypes(ft);
      setFormData({
        name: '',
        categoryId: categories[0]?.id || '',
        documentTypeId: ft[0]?.id || '',
        description: '',
        templateMode: 'FORM',
        formType: 'STANDARD',
        paperSize: 'A4',
        orientation: 'PORTRAIT',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          name: formData.name,
          categoryId: formData.categoryId,
          documentTypeId: formData.documentTypeId,
          description: formData.description || null,
          templateMode: formData.templateMode,
          formType: formData.formType,
          paperSize: formData.paperSize,
          orientation: formData.orientation,
          isActive: formData.isActive,
        };
        if (editingId) {
          await updateTemplate(editingId, payload);
        } else {
          await createTemplate(payload);
        }
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้');
      }
    });
  };

  const handleDelete = (id: string, name: string, docCount: number) => {
    if (docCount > 0) {
      alert(`ไม่สามารถลบ Template "${name}" ได้ เนื่องจากมีเอกสาร ${docCount} รายการที่ใช้ template นี้`);
      return;
    }
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ Template "${name}"?\nฟิลด์ทั้งหมดของ template นี้จะถูกลบด้วย`)) {
      startTransition(async () => {
        try {
          await deleteTemplate(id);
          setTemplates(templates.filter((t) => t.id !== id));
        } catch {
          alert('เกิดข้อผิดพลาด ไม่สามารถลบ Template ได้');
        }
      });
    }
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  const totalModes = (mode: TemplateMode) => templates.filter((t) => t.templateMode === mode).length;

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 tracking-wider mb-1 uppercase">
          Company Workspace
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
          Template เอกสาร
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          จัดการ Template แบบฟอร์ม กำหนดช่องข้อมูล (Fields) และรูปแบบการแสดงผลของเอกสาร
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'ทั้งหมด', value: templates.length, onClick: () => setFilterMode('ALL'), active: filterMode === 'ALL', cls: 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600' },
          { label: 'Form', value: totalModes('FORM'), onClick: () => setFilterMode('FORM'), active: filterMode === 'FORM', cls: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
          { label: 'Designer', value: totalModes('DESIGNER'), onClick: () => setFilterMode('DESIGNER'), active: filterMode === 'DESIGNER', cls: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
          { label: 'HTML', value: totalModes('HTML'), onClick: () => setFilterMode('HTML'), active: filterMode === 'HTML', cls: 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className={`rounded-xl p-4 text-left border-2 transition-all ${stat.cls} ${stat.active ? 'shadow-sm scale-[1.01]' : 'opacity-70 hover:opacity-100'}`}
          >
            <p className="text-[11px] font-medium mb-0.5 opacity-75">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> สร้าง Template ใหม่
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหา Template..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-400 transition-colors"
          >
            <option value="ALL">ทุกหมวดหมู่</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 py-20 flex flex-col items-center gap-4 text-gray-400 dark:text-gray-500">
          <LayoutTemplate className="w-14 h-14 opacity-20" />
          <p className="text-sm">ไม่พบ Template</p>
          <button
            onClick={() => handleOpenModal()}
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            + สร้าง Template แรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border transition-all hover:shadow-md ${
                tpl.isActive
                  ? 'border-gray-100 dark:border-gray-700'
                  : 'border-gray-200 dark:border-gray-600 opacity-60'
              }`}
            >
              {/* Card Top */}
              <div className="p-5 border-b border-gray-50 dark:border-gray-700">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <ModeBadge mode={tpl.templateMode} />
                  <div className="flex items-center gap-1.5">
                    {tpl.isActive
                      ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                      : <XCircle className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                    }
                    <span className={`text-xs font-medium ${tpl.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                      {tpl.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight mb-1 line-clamp-2">
                  {tpl.name}
                </h3>
                {tpl.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                    {tpl.description}
                  </p>
                )}
              </div>

              {/* Card Info */}
              <div className="px-5 py-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full font-medium">
                    {tpl.category.name}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">/</span>
                  <span>{tpl.documentType.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>{tpl.paperSize} · {tpl.orientation === 'PORTRAIT' ? 'แนวตั้ง' : 'แนวนอน'} · v{tpl.version}</span>
                  <span>{formatDate(tpl.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{tpl._count.fields}</span> ฟิลด์
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{tpl._count.documents}</span> เอกสาร
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between gap-2">
                <Link
                  href={`/templates/${tpl.id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  จัดการฟิลด์ <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(tpl)}
                    className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors font-medium"
                  >
                    <Edit2 className="w-3 h-3" /> แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(tpl.id, tpl.name, tpl._count.documents)}
                    disabled={isPending}
                    className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-medium disabled:opacity-60"
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-right">
          แสดง {filtered.length} จาก {templates.length} Template
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  {editingId ? 'แก้ไข Template' : 'สร้าง Template ใหม่'}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {editingId ? 'แก้ไขข้อมูล Template เอกสาร' : 'กำหนดข้อมูลพื้นฐานของ Template'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Template Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ชื่อ Template <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="เช่น ใบเสนอราคา 2024, ใบแจ้งหนี้มาตรฐาน"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 transition-colors text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  หมวดหมู่เอกสาร <span className="text-red-500">*</span>
                </label>
                {categories.length === 0 ? (
                  <div className="px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-700 dark:text-amber-400">
                    ยังไม่มีหมวดหมู่ กรุณาเพิ่มหมวดหมู่ก่อน
                  </div>
                ) : (
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Document Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ประเภทเอกสาร <span className="text-red-500">*</span>
                </label>
                {filteredTypes.length === 0 ? (
                  <div className="px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-700 dark:text-amber-400">
                    ยังไม่มีประเภทเอกสารในหมวดหมู่นี้
                  </div>
                ) : (
                  <select
                    required
                    value={formData.documentTypeId}
                    onChange={(e) => setFormData({ ...formData, documentTypeId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  >
                    <option value="">เลือกประเภทเอกสาร</option>
                    {filteredTypes.map((dt) => (
                      <option key={dt.id} value={dt.id}>{dt.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Template Mode */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  รูปแบบ Template <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(MODE_CONFIG) as [TemplateMode, typeof MODE_CONFIG[TemplateMode]][]).map(([mode, cfg]) => {
                    const Icon = cfg.icon;
                    const selected = formData.templateMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFormData({ ...formData, templateMode: mode })}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                          selected
                            ? `${cfg.bg} ${cfg.color} border-current shadow-sm`
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-semibold">{cfg.label}</span>
                        <span className="text-[10px] opacity-75 leading-tight">{cfg.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Paper Size & Orientation */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ขนาดกระดาษ</label>
                  <select
                    value={formData.paperSize}
                    onChange={(e) => setFormData({ ...formData, paperSize: e.target.value as PaperSize })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  >
                    {PAPER_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">การวางกระดาษ</label>
                  <select
                    value={formData.orientation}
                    onChange={(e) => setFormData({ ...formData, orientation: e.target.value as PaperOrientation })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  >
                    {ORIENTATIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">คำอธิบาย</label>
                <textarea
                  placeholder="คำอธิบาย Template..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 transition-colors text-sm text-gray-700 dark:text-gray-200 resize-none h-20 placeholder:text-gray-400"
                />
              </div>

              {/* isActive */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="tplIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 dark:border-gray-600 focus:ring-emerald-500 bg-white dark:bg-gray-800 cursor-pointer"
                />
                <label htmlFor="tplIsActive" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  เปิดใช้งาน Template นี้ (Active)
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending || categories.length === 0 || filteredTypes.length === 0}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'บันทึกการแก้ไข' : 'สร้าง Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
