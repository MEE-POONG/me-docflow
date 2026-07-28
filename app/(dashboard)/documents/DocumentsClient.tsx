'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, X, Search, Loader2,
  FileText, Clock, CheckCircle, XCircle, Archive, Ban, ChevronDown
} from 'lucide-react';
import {
  createDocument, updateDocument, deleteDocument, updateDocumentStatus,
  getDocumentTypes,
} from './actions';
import type { DocumentWithRelations } from './actions';
import { DocumentStatus } from '@prisma/client';

type Category = { id: string; name: string };
type DocType = { id: string; name: string; categoryId: string };
type Template = { id: string; name: string; documentTypeId: string; categoryId: string };

type Props = {
  initialDocuments: DocumentWithRelations[];
  categories: Category[];
  docTypes: DocType[];
  initialTemplates?: Template[];
};

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  DRAFT: {
    label: 'ฉบับร่าง',
    icon: FileText,
    color: 'text-gray-600 dark:text-gray-300',
    bg: 'bg-gray-100 dark:bg-gray-700',
  },
  PENDING: {
    label: 'รออนุมัติ',
    icon: Clock,
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
  },
  APPROVED: {
    label: 'อนุมัติแล้ว',
    icon: CheckCircle,
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
  },
  REJECTED: {
    label: 'ถูกปฏิเสธ',
    icon: XCircle,
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/30',
  },
  CANCELLED: {
    label: 'ยกเลิก',
    icon: Ban,
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-700',
  },
  ARCHIVED: {
    label: 'จัดเก็บแล้ว',
    icon: Archive,
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/30',
  },
};

function StatusBadge({ status }: { status: DocumentStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as DocumentStatus[];

export default function DocumentsClient({
  initialDocuments,
  categories,
  docTypes: initialDocTypes,
  initialTemplates = [],
}: Props) {
  const [documents, setDocuments] = useState<DocumentWithRelations[]>(initialDocuments);
  const [docTypes, setDocTypes] = useState<DocType[]>(initialDocTypes);
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const [formData, setFormData] = useState({
    title: '',
    categoryId: categories[0]?.id || '',
    documentTypeId: '',
    templateId: '',
    status: 'DRAFT' as DocumentStatus,
    note: '',
  });

  // Load doc types when category changes in form
  useEffect(() => {
    const filtered = initialDocTypes.filter(
      (t) => !formData.categoryId || t.categoryId === formData.categoryId
    );
    setDocTypes(filtered);
    if (filtered.length > 0 && !filtered.find((t) => t.id === formData.documentTypeId)) {
      setFormData((prev) => ({ ...prev, documentTypeId: filtered[0].id }));
    }
  }, [formData.categoryId, initialDocTypes]);

  // Load templates when documentTypeId changes in form
  useEffect(() => {
    const filtered = templates.filter(
      (t) => !formData.documentTypeId || t.documentTypeId === formData.documentTypeId
    );
    setFilteredTemplates(filtered);
    if (filtered.length > 0 && !filtered.find((t) => t.id === formData.templateId)) {
      setFormData((prev) => ({ ...prev, templateId: '' })); // Can default to empty or first
    }
  }, [formData.documentTypeId, templates]);

  const filteredDocuments = documents.filter((doc) => {
    const q = searchQuery.toLowerCase();
    const searchMatch =
      doc.title.toLowerCase().includes(q) ||
      doc.documentNo.toLowerCase().includes(q) ||
      doc.category.name.toLowerCase().includes(q) ||
      doc.documentType.name.toLowerCase().includes(q) ||
      doc.createdBy.name.toLowerCase().includes(q);
    const statusMatch = filterStatus === 'ALL' || doc.status === filterStatus;
    const categoryMatch = filterCategory === 'ALL' || doc.category.id === filterCategory;
    return searchMatch && statusMatch && categoryMatch;
  });

  const handleOpenModal = (doc?: DocumentWithRelations) => {
    if (doc) {
      setEditingId(doc.id);
      setFormData({
        title: doc.title,
        categoryId: doc.category.id,
        documentTypeId: doc.documentType.id,
        templateId: (doc as any).templateId || '',
        status: doc.status,
        note: doc.note || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        categoryId: categories[0]?.id || '',
        documentTypeId: '',
        templateId: '',
        status: 'DRAFT',
        note: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          title: formData.title,
          categoryId: formData.categoryId,
          documentTypeId: formData.documentTypeId,
          templateId: formData.templateId || null,
          status: formData.status,
          note: formData.note || null,
        };
        if (editingId) {
          await updateDocument(editingId, payload);
        } else {
          await createDocument(payload);
        }
        window.location.reload();
      } catch (error) {
        console.error('Failed to save document', error);
        alert('เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้');
      }
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบเอกสาร "${title}"? การกระทำนี้ไม่สามารถเลิกทำได้`)) {
      startTransition(async () => {
        try {
          await deleteDocument(id);
          setDocuments(documents.filter((d) => d.id !== id));
        } catch (error) {
          console.error('Failed to delete document', error);
          alert('เกิดข้อผิดพลาด ไม่สามารถลบเอกสารได้');
        }
      });
    }
  };

  const handleApprove = (id: string, title: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการอนุมัติเอกสาร "${title}"?`)) {
      startTransition(async () => {
        try {
          await updateDocumentStatus(id, 'APPROVED');
          setDocuments(documents.map(d => d.id === id ? { ...d, status: 'APPROVED' as DocumentStatus } : d));
        } catch (error) {
          console.error('Failed to approve document', error);
          alert('เกิดข้อผิดพลาด ไม่สามารถอนุมัติเอกสารได้');
        }
      });
    }
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 tracking-wider mb-1 uppercase">
          Company Workspace
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">เอกสาร</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          จัดการเอกสารทั้งหมดของบริษัท สร้าง แก้ไข ลบ และติดตามสถานะเอกสาร
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {([
          ['ALL', 'ทั้งหมด', documents.length, 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'],
          ['DRAFT', 'ฉบับร่าง', documents.filter(d => d.status === 'DRAFT').length, 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'],
          ['PENDING', 'รออนุมัติ', documents.filter(d => d.status === 'PENDING').length, 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'],
          ['APPROVED', 'อนุมัติแล้ว', documents.filter(d => d.status === 'APPROVED').length, 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'],
          ['REJECTED', 'ถูกปฏิเสธ', documents.filter(d => d.status === 'REJECTED').length, 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'],
          ['ARCHIVED', 'จัดเก็บ', documents.filter(d => d.status === 'ARCHIVED').length, 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'],
        ] as [DocumentStatus | 'ALL', string, number, string][]).map(([status, label, count, cls]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as DocumentStatus | 'ALL')}
            className={`rounded-xl p-3 text-left transition-all border-2 ${
              filterStatus === status
                ? `${cls} border-current shadow-sm`
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400'
            }`}
          >
            <p className="text-[11px] font-medium mb-0.5 opacity-80">{label}</p>
            <p className="text-2xl font-bold">{count}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> เพิ่มเอกสาร
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาเลขเอกสาร ชื่อ หมวดหมู่..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 transition-colors"
            />
          </div>

          {/* Filter by category */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="ALL">ทุกหมวดหมู่</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30">
              <tr>
                <th className="px-6 py-4 font-normal">เลขเอกสาร</th>
                <th className="px-6 py-4 font-normal">ชื่อเอกสาร</th>
                <th className="px-6 py-4 font-normal">หมวดหมู่</th>
                <th className="px-6 py-4 font-normal">ประเภท</th>
                <th className="px-6 py-4 font-normal">สถานะ</th>
                <th className="px-6 py-4 font-normal">สร้างโดย</th>
                <th className="px-6 py-4 font-normal">วันที่สร้าง</th>
                <th className="px-6 py-4 font-normal text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
                      <FileText className="w-12 h-12 opacity-30" />
                      <p className="text-sm">ไม่พบเอกสาร</p>
                      <button
                        onClick={() => handleOpenModal()}
                        className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                      >
                        + เพิ่มเอกสารใหม่
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {doc.documentNo}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white max-w-[220px]">
                      <span className="truncate block" title={doc.title}>
                        {doc.title}
                      </span>
                      {doc.note && (
                        <span className="block text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                          {doc.note}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{doc.category.name}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{doc.documentType.name}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{doc.createdBy.name}</td>
                    <td className="px-6 py-4 text-gray-400 dark:text-gray-500 text-xs">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.status === 'PENDING' && (
                          <button
                            onClick={() => handleApprove(doc.id, doc.title)}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 dark:border-emerald-800 rounded text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors font-medium disabled:opacity-60 bg-emerald-50 dark:bg-emerald-900/10"
                          >
                            {isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}{' '}
                            อนุมัติ
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenModal(doc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors font-medium"
                        >
                          <Edit2 className="w-3 h-3" /> แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id, doc.title)}
                          disabled={isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-medium disabled:opacity-60"
                        >
                          {isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}{' '}
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredDocuments.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 flex items-center justify-between">
            <span>แสดง {filteredDocuments.length} จาก {documents.length} รายการ</span>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transition-colors">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  {editingId ? 'แก้ไขเอกสาร' : 'เพิ่มเอกสารใหม่'}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {editingId ? 'แก้ไขข้อมูลเอกสาร' : 'กรอกข้อมูลเพื่อสร้างเอกสารใหม่'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ชื่อเอกสาร <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="ระบุชื่อเอกสาร..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 transition-colors text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  หมวดหมู่เอกสาร <span className="text-red-500">*</span>
                </label>
                {categories.length === 0 ? (
                  <div className="w-full px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-700 dark:text-amber-400">
                    ยังไม่มีหมวดหมู่ กรุณาเพิ่มหมวดหมู่ก่อน
                  </div>
                ) : (
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value, documentTypeId: '' })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Document Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ประเภทเอกสาร <span className="text-red-500">*</span>
                </label>
                {docTypes.length === 0 ? (
                  <div className="w-full px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-700 dark:text-amber-400">
                    ยังไม่มีประเภทเอกสาร กรุณาเพิ่มประเภทก่อน
                  </div>
                ) : (
                  <select
                    required
                    value={formData.documentTypeId}
                    onChange={(e) => setFormData({ ...formData, documentTypeId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  >
                    <option value="">เลือกประเภทเอกสาร</option>
                    {docTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Template */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  รูปแบบ Template
                </label>
                {filteredTemplates.length === 0 ? (
                  <div className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-500 dark:text-gray-400">
                    ไม่มี Template สำหรับประเภทนี้
                  </div>
                ) : (
                  <select
                    value={formData.templateId}
                    onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  >
                    <option value="">-- ไม่ใช้ Template --</option>
                    {filteredTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">สถานะ</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as DocumentStatus })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  หมายเหตุ
                </label>
                <textarea
                  placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors text-sm text-gray-700 dark:text-gray-200 resize-none h-20 placeholder:text-gray-400"
                />
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
                  disabled={isPending || categories.length === 0 || docTypes.length === 0}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มเอกสาร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
