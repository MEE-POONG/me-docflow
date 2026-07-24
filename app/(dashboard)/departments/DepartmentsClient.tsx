'use client';

import { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, X, Search, Loader2 } from 'lucide-react';
import { createDepartment, updateDepartment, deleteDepartment } from './actions';

type Department = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export default function DepartmentsClient({ initialDepartments }: { initialDepartments: Department[] }) {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  const filteredDepartments = departments.filter(d => {
    const searchMatch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (d.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? d.isActive : !d.isActive);
    return searchMatch && statusMatch;
  });

  const handleOpenModal = (dept?: Department) => {
    if (dept) {
      setEditingId(dept.id);
      setFormData({
        name: dept.name,
        description: dept.description || '',
        isActive: dept.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
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
          description: formData.description || null,
          isActive: formData.isActive,
        };

        if (editingId) {
          await updateDepartment(editingId, payload);
        } else {
          await createDepartment(payload);
        }
        window.location.reload();
      } catch (error) {
        console.error('Failed to save department', error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้? (การลบแผนกอาจส่งผลต่อข้อมูลพนักงานในแผนกนี้)')) {
      startTransition(async () => {
        try {
          await deleteDepartment(id);
          setDepartments(departments.filter(d => d.id !== id));
        } catch (error) {
          console.error('Failed to delete department', error);
          alert('ไม่สามารถลบแผนกได้ อาจมีพนักงานที่ยังสังกัดแผนกนี้อยู่');
        }
      });
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto py-8">
      
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs font-bold text-teal-700 tracking-wider mb-1">
          COMPANY WORKSPACE
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          แผนก (Departments)
        </h1>
        <p className="text-sm text-gray-500">
          จัดการข้อมูลแผนกและฝ่ายต่างๆ ภายในองค์กร
        </p>
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> เพิ่มแผนก
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อแผนก หรือรายละเอียด..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-colors"
            />
          </div>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white focus:outline-none focus:border-gray-300"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="ACTIVE">เปิดใช้งาน (Active)</option>
            <option value="INACTIVE">ปิดใช้งาน (Inactive)</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 font-normal">ชื่อแผนก</th>
                <th className="px-6 py-5 font-normal">รายละเอียด</th>
                <th className="px-6 py-5 font-normal">สถานะ</th>
                <th className="px-6 py-5 font-normal text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    ไม่พบข้อมูลแผนก
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{dept.name}</td>
                    <td className="px-6 py-4 text-gray-500 whitespace-normal min-w-[300px]">{dept.description || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        dept.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {dept.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(dept)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded text-xs text-teal-600 hover:bg-teal-50 transition-colors font-medium"
                        >
                          <Edit2 className="w-3 h-3" /> แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(dept.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded text-xs text-red-500 hover:bg-red-50 transition-colors font-medium"
                        >
                          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? 'แก้ไขข้อมูลแผนก' : 'เพิ่มแผนกใหม่'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">ชื่อแผนก *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors text-sm text-gray-700"
                  placeholder="เช่น ฝ่ายบัญชี, IT Support"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">รายละเอียดแผนก</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors text-sm text-gray-700 resize-none h-24"
                  placeholder="ระบุหน้าที่ หรือรายละเอียดของแผนก"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                  เปิดใช้งานแผนกนี้ (Active)
                </label>
              </div>

              <div className="pt-6 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มแผนก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
