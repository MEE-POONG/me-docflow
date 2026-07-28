'use client';

import { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, X, Search, Loader2, Layers } from 'lucide-react';
import { createDocumentType, updateDocumentType, deleteDocumentType } from './actions';
import type { DocTypeWithRelations } from './actions';

type Category = { id: string; name: string };

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function TypesClient({
  initialTypes,
  categories,
}: {
  initialTypes: DocTypeWithRelations[];
  categories: Category[];
}) {
  const [types, setTypes] = useState<DocTypeWithRelations[]>(initialTypes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    categoryId: categories[0]?.id || '',
    description: '',
    showOrder: 0,
    isActive: true,
  });

  const filtered = types.filter((t) => {
    const q = searchQuery.toLowerCase();
    const match = t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q);
    const catMatch = filterCategory === 'ALL' || t.categoryId === filterCategory;
    const statusMatch =
      filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? t.isActive : !t.isActive);
    return match && catMatch && statusMatch;
  });

  const handleOpenModal = (type?: DocTypeWithRelations) => {
    if (type) {
      setEditingId(type.id);
      setFormData({
        name: type.name,
        slug: type.slug,
        categoryId: type.categoryId,
        description: type.description || '',
        showOrder: type.showOrder,
        isActive: type.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        slug: '',
        categoryId: categories[0]?.id || '',
        description: '',
        showOrder: 0,
        isActive: true,
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
          name: formData.name,
          slug: formData.slug || slugify(formData.name),
          categoryId: formData.categoryId,
          description: formData.description || null,
          showOrder: formData.showOrder,
          isActive: formData.isActive,
        };
        if (editingId) {
          await updateDocumentType(editingId, payload);
        } else {
          await createDocumentType(payload);
        }
        window.location.reload();
      } catch (error) {
        console.error('Failed to save type', error);
        alert('เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้');
      }
    });
  };

  const handleDelete = (id: string, name: string, docsCount: number) => {
    if (docsCount > 0) {
      alert(`ไม่สามารถลบประเภท "${name}" ได้ เนื่องจากมีเอกสาร ${docsCount} รายการในประเภทนี้`);
      return;
    }
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบประเภทเอกสาร "${name}"?`)) {
      startTransition(async () => {
        try {
          await deleteDocumentType(id);
          setTypes(types.filter((t) => t.id !== id));
        } catch {
          alert('เกิดข้อผิดพลาด ไม่สามารถลบประเภทเอกสารได้');
        }
      });
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 tracking-wider mb-1 uppercase">
          Company Workspace
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">ประเภทเอกสาร</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          จัดการประเภทย่อยของเอกสาร ภายใต้แต่ละหมวดหมู่
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> เพิ่มประเภทเอกสาร
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาประเภทเอกสาร..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none transition-colors"
          >
            <option value="ALL">ทุกหมวดหมู่</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none transition-colors"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="ACTIVE">เปิดใช้งาน</option>
            <option value="INACTIVE">ปิดใช้งาน</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30">
              <tr>
                <th className="px-6 py-4 font-normal">ชื่อประเภท</th>
                <th className="px-6 py-4 font-normal">Slug</th>
                <th className="px-6 py-4 font-normal">หมวดหมู่</th>
                <th className="px-6 py-4 font-normal">รายละเอียด</th>
                <th className="px-6 py-4 font-normal text-center">เอกสาร</th>
                <th className="px-6 py-4 font-normal">สถานะ</th>
                <th className="px-6 py-4 font-normal text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
                      <Layers className="w-12 h-12 opacity-30" />
                      <p className="text-sm">ไม่พบประเภทเอกสาร</p>
                      <button
                        onClick={() => handleOpenModal()}
                        className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                      >
                        + เพิ่มประเภทเอกสารใหม่
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((type) => (
                  <tr
                    key={type.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{type.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-400 dark:text-gray-500">
                      {type.slug}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                        {type.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-[180px]">
                      <span className="truncate block">{type.description || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-semibold">
                        {type._count.documents}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          type.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {type.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(type)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors font-medium"
                        >
                          <Edit2 className="w-3 h-3" /> แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(type.id, type.name, type._count.documents)}
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
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
            แสดง {filtered.length} จาก {types.length} รายการ
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  {editingId ? 'แก้ไขประเภทเอกสาร' : 'เพิ่มประเภทเอกสารใหม่'}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {editingId ? 'แก้ไขข้อมูลประเภทเอกสาร' : 'สร้างประเภทเอกสารใหม่ภายใต้หมวดหมู่'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  หมวดหมู่ <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ชื่อประเภทเอกสาร <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="เช่น ใบแจ้งหนี้, ใบเสนอราคา"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: slugify(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                />
              </div>

              {/* Slug + Order */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:border-emerald-500 transition-colors text-sm font-mono text-gray-500 dark:text-gray-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ลำดับ
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.showOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, showOrder: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  รายละเอียด
                </label>
                <textarea
                  placeholder="คำอธิบายประเภทเอกสาร..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-emerald-500 transition-colors text-sm text-gray-700 dark:text-gray-200 resize-none h-20"
                />
              </div>

              {/* isActive */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="typeIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 dark:border-gray-600 focus:ring-emerald-500 bg-white dark:bg-gray-800 cursor-pointer"
                />
                <label
                  htmlFor="typeIsActive"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  เปิดใช้งานประเภทเอกสารนี้ (Active)
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
                  disabled={isPending}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มประเภทเอกสาร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
