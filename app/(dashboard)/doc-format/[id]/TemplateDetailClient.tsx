'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Edit2, Trash2, X, Loader2,
  ChevronDown, ChevronUp, AlertCircle,
  Type, Hash, Calendar, AlignLeft, Image, Paperclip,
  Table2, List, CheckSquare, Circle, PenLine, ToggleLeft, DollarSign,
  Clock,
} from 'lucide-react';
import {
  createTemplateField,
  updateTemplateField,
  deleteTemplateField,
} from '../actions';
import type { TemplateFieldData } from '../actions';
import { FieldType, TemplateMode, PaperSize, PaperOrientation } from '@prisma/client';

// ─── Field type config ─────────────────────────────────────────────────────

const FIELD_TYPES: { value: FieldType; label: string; icon: React.ElementType; group: string }[] = [
  { value: 'TEXT', label: 'ข้อความ', icon: Type, group: 'ข้อมูลพื้นฐาน' },
  { value: 'NUMBER', label: 'ตัวเลข', icon: Hash, group: 'ข้อมูลพื้นฐาน' },
  { value: 'CURRENCY', label: 'จำนวนเงิน', icon: DollarSign, group: 'ข้อมูลพื้นฐาน' },
  { value: 'DATE', label: 'วันที่', icon: Calendar, group: 'ข้อมูลพื้นฐาน' },
  { value: 'DATETIME', label: 'วันที่และเวลา', icon: Clock, group: 'ข้อมูลพื้นฐาน' },
  { value: 'TEXTAREA', label: 'ข้อความยาว', icon: AlignLeft, group: 'ข้อมูลพื้นฐาน' },
  { value: 'RICH_TEXT', label: 'Rich Text', icon: AlignLeft, group: 'ข้อมูลพื้นฐาน' },
  { value: 'SELECT', label: 'Dropdown', icon: List, group: 'ตัวเลือก' },
  { value: 'RADIO', label: 'Radio', icon: Circle, group: 'ตัวเลือก' },
  { value: 'CHECKBOX', label: 'Checkbox', icon: CheckSquare, group: 'ตัวเลือก' },
  { value: 'BOOLEAN', label: 'เปิด/ปิด', icon: ToggleLeft, group: 'ตัวเลือก' },
  { value: 'IMAGE', label: 'รูปภาพ', icon: Image, group: 'ไฟล์' },
  { value: 'FILE', label: 'ไฟล์แนบ', icon: Paperclip, group: 'ไฟล์' },
  { value: 'TABLE', label: 'ตาราง', icon: Table2, group: 'ขั้นสูง' },
  { value: 'SIGNATURE', label: 'ลายเซ็น', icon: PenLine, group: 'ขั้นสูง' },
];

const FIELD_ICON: Record<FieldType, React.ElementType> = Object.fromEntries(
  FIELD_TYPES.map((f) => [f.value, f.icon])
) as Record<FieldType, React.ElementType>;

const FIELD_LABEL: Record<FieldType, string> = Object.fromEntries(
  FIELD_TYPES.map((f) => [f.value, f.label])
) as Record<FieldType, string>;

const FIELD_GROUPS = ['ข้อมูลพื้นฐาน', 'ตัวเลือก', 'ไฟล์', 'ขั้นสูง'];

// Types that support options (choices list)
const HAS_OPTIONS: FieldType[] = ['SELECT', 'RADIO', 'CHECKBOX'];

// ─── Template info type ────────────────────────────────────────────────────

type TemplateInfo = {
  id: string;
  name: string;
  description: string | null;
  templateMode: TemplateMode;
  paperSize: PaperSize;
  orientation: PaperOrientation;
  version: number;
  isActive: boolean;
  category: { id: string; name: string };
  documentType: { id: string; name: string };
  fields: TemplateFieldData[];
};

// ─── Component ─────────────────────────────────────────────────────────────

export default function TemplateDetailClient({ template }: { template: TemplateInfo }) {
  const [fields, setFields] = useState<TemplateFieldData[]>(template.fields);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    key: '',
    label: '',
    type: 'TEXT' as FieldType,
    required: false,
    placeholder: '',
    showOrder: 0,
    optionsRaw: '', // comma-separated options for SELECT/RADIO/CHECKBOX
    defaultValue: '',
  });

  const handleOpenModal = (field?: TemplateFieldData) => {
    if (field) {
      setEditingFieldId(field.id);
      const opts = field.options
        ? (field.options as { label: string; value: string }[]).map((o) => o.label).join(', ')
        : '';
      setFormData({
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder || '',
        showOrder: field.showOrder,
        optionsRaw: opts,
        defaultValue: field.defaultValue ? String(field.defaultValue) : '',
      });
    } else {
      setEditingFieldId(null);
      setFormData({
        key: '',
        label: '',
        type: 'TEXT',
        required: false,
        placeholder: '',
        showOrder: fields.length,
        optionsRaw: '',
        defaultValue: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingFieldId(null); };

  // Auto-generate key from label
  const autoKey = (label: string) =>
    label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  const parseOptions = (raw: string) =>
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({ label: s, value: s.toLowerCase().replace(/\s+/g, '_') }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const options = HAS_OPTIONS.includes(formData.type)
          ? parseOptions(formData.optionsRaw)
          : null;

        const payload = {
          key: formData.key || autoKey(formData.label),
          label: formData.label,
          type: formData.type,
          required: formData.required,
          placeholder: formData.placeholder || null,
          showOrder: formData.showOrder,
          options,
          defaultValue: formData.defaultValue || null,
        };

        if (editingFieldId) {
          await updateTemplateField(editingFieldId, template.id, payload);
        } else {
          await createTemplateField(template.id, payload);
        }
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาด ไม่สามารถบันทึกฟิลด์ได้');
      }
    });
  };

  const handleDeleteField = (fieldId: string, label: string) => {
    if (confirm(`ลบฟิลด์ "${label}" ออกจาก Template นี้?`)) {
      startTransition(async () => {
        try {
          await deleteTemplateField(fieldId, template.id);
          setFields(fields.filter((f) => f.id !== fieldId));
        } catch {
          alert('เกิดข้อผิดพลาด ไม่สามารถลบฟิลด์ได้');
        }
      });
    }
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
  };

  const MODE_LABELS: Record<TemplateMode, string> = {
    FORM: 'Form',
    DESIGNER: 'Designer',
    HTML: 'HTML',
  };

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-5">
      {/* Back */}
      <div>
        <Link
          href="/doc-format"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปรายการแบบเอกสาร
        </Link>
      </div>

      {/* Template Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">
                Template
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${template.isActive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                {template.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{template.name}</h1>
            {template.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
            )}
            {/* Document Designer button — only for DESIGNER mode */}
            {template.templateMode === 'DESIGNER' && (
              <Link
                href={`/doc-format/${template.id}/designer`}
                className="inline-flex items-center mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                Document Designer
              </Link>
            )}
          </div>
          <div className="bg-gray-50/70 dark:bg-slate-800/40 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-slate-800 p-6">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">ข้อมูลแบบเอกสาร</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-gray-500 dark:text-gray-400">หมวดหมู่</dt><dd className="font-medium text-gray-900 dark:text-gray-100 text-right">{template.category.name}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-gray-500 dark:text-gray-400">ประเภทเอกสาร</dt><dd className="font-medium text-gray-900 dark:text-gray-100 text-right">{template.documentType.name}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-gray-500 dark:text-gray-400">โหมดการสร้าง</dt><dd className="font-medium text-gray-900 dark:text-gray-100">{MODE_LABELS[template.templateMode]}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-gray-500 dark:text-gray-400">ขนาดกระดาษ</dt><dd className="font-medium text-gray-900 dark:text-gray-100">{template.paperSize} · {template.orientation === 'PORTRAIT' ? 'แนวตั้ง' : 'แนวนอน'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-gray-500 dark:text-gray-400">เวอร์ชัน</dt><dd className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">{template.version}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      {/* Fields Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Fields Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/30">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">ฟิลด์ข้อมูลเอกสาร</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {fields.length} ฟิลด์ · กำหนดข้อมูลที่ผู้ใช้งานต้องกรอกในแบบเอกสารนี้
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> เพิ่มฟิลด์
          </button>
        </div>

        {/* Fields List */}
        {fields.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
            <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-center"><AlertCircle className="w-5 h-5" /></div>
            <div className="text-center"><p className="text-sm font-medium text-gray-600 dark:text-gray-300">ยังไม่มีฟิลด์ข้อมูล</p><p className="text-xs mt-1">เพิ่มฟิลด์เพื่อกำหนดข้อมูลที่ต้องกรอกในเอกสาร</p></div>
            <button
              onClick={() => handleOpenModal()}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              + เพิ่มฟิลด์แรก
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {fields.map((field, index) => {
              const Icon = FIELD_ICON[field.type];
              const opts = field.options as { label: string; value: string }[] | null;
              return (
                <div
                  key={field.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group"
                >
                  {/* Order */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => moveField(index, 'up')}
                      disabled={index === 0}
                      className="p-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-gray-300 dark:text-gray-600 font-mono w-5 text-center">
                      {index + 1}
                    </span>
                    <button
                      onClick={() => moveField(index, 'down')}
                      disabled={index === fields.length - 1}
                      className="p-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Field Type Icon */}
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>

                  {/* Field Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">{field.label}</span>
                      {field.required && (
                        <span className="px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold rounded">จำเป็น</span>
                      )}
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[11px] rounded-full font-medium">
                        {FIELD_LABEL[field.type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{field.key}</span>
                      {field.placeholder && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          placeholder: {field.placeholder}
                        </span>
                      )}
                      {opts && opts.length > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {opts.length} ตัวเลือก: {opts.slice(0, 3).map(o => o.label).join(', ')}{opts.length > 3 ? '...' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(field)}
                      className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                      title="แก้ไขฟิลด์"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteField(field.id, field.label)}
                      disabled={isPending}
                      className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-60"
                      title="ลบฟิลด์"
                    >
                      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {fields.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
            {fields.length} ฟิลด์ · ลำดับจะถูกบันทึกเมื่อคุณบันทึกจากหน้าแก้ไข
          </div>
        )}
      </div>

      {/* Field Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  {editingFieldId ? 'แก้ไขฟิลด์' : 'เพิ่มฟิลด์ใหม่'}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  กำหนดรูปแบบข้อมูลที่ผู้ใช้ต้องกรอก
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto p-6 space-y-5">
              {/* Field Type selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ประเภทฟิลด์ <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {FIELD_GROUPS.map((group) => {
                    const groupFields = FIELD_TYPES.filter((f) => f.group === group);
                    return (
                      <div key={group}>
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">{group}</p>
                        <div className="flex flex-wrap gap-2">
                          {groupFields.map((ft) => {
                            const Icon = ft.icon;
                            const selected = formData.type === ft.value;
                            return (
                              <button
                                key={ft.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, type: ft.value })}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${selected
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                                  }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {ft.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Label */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ชื่อฟิลด์ (Label) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="เช่น ชื่อลูกค้า, วันที่ออกเอกสาร"
                  value={formData.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setFormData({
                      ...formData,
                      label,
                      key: editingFieldId ? formData.key : autoKey(label),
                    });
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                />
              </div>

              {/* Key */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Key <span className="text-gray-400 font-normal text-xs">(ใช้ในระบบ, สร้างอัตโนมัติ)</span>
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:border-emerald-500 transition-colors text-sm font-mono text-gray-500 dark:text-gray-400"
                />
              </div>

              {/* Placeholder */}
              {!['BOOLEAN', 'IMAGE', 'FILE', 'TABLE', 'SIGNATURE', 'CHECKBOX', 'RADIO'].includes(formData.type) && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Placeholder</label>
                  <input
                    type="text"
                    placeholder="ตัวอย่างข้อความในช่องกรอก..."
                    value={formData.placeholder}
                    onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  />
                </div>
              )}

              {/* Options (for SELECT, RADIO, CHECKBOX) */}
              {HAS_OPTIONS.includes(formData.type) && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ตัวเลือก <span className="text-gray-400 font-normal text-xs">(คั่นด้วยจุลภาค)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ตัวเลือก 1, ตัวเลือก 2, ตัวเลือก 3"
                    value={formData.optionsRaw}
                    onChange={(e) => setFormData({ ...formData, optionsRaw: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  />
                  {formData.optionsRaw && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {parseOptionsPreview(formData.optionsRaw).map((opt, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Default Value */}
              {!['IMAGE', 'FILE', 'TABLE', 'SIGNATURE'].includes(formData.type) && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ค่าเริ่มต้น</label>
                  <input
                    type="text"
                    placeholder="ค่าเริ่มต้น (ถ้ามี)..."
                    value={formData.defaultValue}
                    onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  />
                </div>
              )}

              {/* Show Order + Required */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ลำดับ</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.showOrder}
                    onChange={(e) => setFormData({ ...formData, showOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.required}
                      onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 dark:border-gray-600 focus:ring-emerald-500 bg-white dark:bg-gray-800 cursor-pointer"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">จำเป็นต้องกรอก</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">Required field</p>
                    </div>
                  </label>
                </div>
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
                  disabled={isPending}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingFieldId ? 'บันทึกการแก้ไข' : 'เพิ่มฟิลด์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper for live options preview
function parseOptionsPreview(raw: string): string[] {
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
