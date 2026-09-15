'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Search, Loader2 } from 'lucide-react';
import { createDepartment, updateDepartment, deleteDepartment, getDepartments } from './actions';
import { getDocumentActor } from '@/lib/document-actor';
import { companyUserPositions } from '@/lib/company-user-positions';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type Department = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  positions: string[];
};

export default function DepartmentsClient({ initialDepartments }: { initialDepartments: Department[] }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const { t } = useLanguage();
  
  const [loadError, setLoadError] = useState('');
  const requestId = useRef(0);
  useEffect(() => {
    const fetchMyDepartments = async () => {
      const request = ++requestId.current;
      const actor = getDocumentActor();
      setDepartments([]);
      setIsModalOpen(false);
      setLoadError('');
      try {
        const rows = await getDepartments(actor);
        if (request === requestId.current) setDepartments(rows);
      } catch (error) {
        if (request === requestId.current) setLoadError(error instanceof Error ? error.message : 'โหลดแผนกไม่สำเร็จ');
      }
    };
    void fetchMyDepartments();
    window.addEventListener('activeCompanyChanged', fetchMyDepartments);
    return () => { ++requestId.current; window.removeEventListener('activeCompanyChanged', fetchMyDepartments); };
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    positions: [] as string[],
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
        positions: dept.positions || [],
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        isActive: true,
        positions: [],
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
    setLoadError('');
    if (formData.positions.length === 0) { setLoadError('กรุณาเลือกตำแหน่งในแผนกอย่างน้อย 1 ตำแหน่ง'); return; }
    startTransition(async () => {
      try {
        const payload = {
          name: formData.name,
          description: formData.description || null,
          isActive: formData.isActive,
          positions: formData.positions,
        };

        const actor = getDocumentActor();

        if (editingId) {
          await updateDepartment(editingId, actor, payload);
        } else {
          await createDepartment(actor, payload);
        }
        
        // Refetch departments after mutation to update the list locally
        const myDepts = await getDepartments(actor);
        if (getDocumentActor().companyId === actor.companyId) setDepartments(myDepts);
        
        setIsModalOpen(false);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'บันทึกแผนกไม่สำเร็จ');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm(t.departments.confirmDelete)) {
      startTransition(async () => {
        try {
          const actor = getDocumentActor();
          await deleteDepartment(id, actor);
          
          const myDepts = await getDepartments(actor);
          if (getDocumentActor().companyId === actor.companyId) setDepartments(myDepts);
        } catch (error) {
          console.error('Failed to delete department', error);
          alert(t.departments.deleteError);
        }
      });
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto py-8">
      
      {loadError && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-700">{loadError}</p>}
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 tracking-wider mb-1 uppercase">
          {t.common.companyWorkspace}
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
          {t.departments.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.departments.subtitle}
        </p>
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> {t.departments.addDepartment}
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 flex flex-wrap items-center gap-3 transition-colors">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.departments.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:border-gray-300 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-600 transition-colors"
            />
          </div>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-300 dark:focus:border-gray-500 transition-colors"
          >
            <option value="ALL">{t.common.allStatus}</option>
            <option value="ACTIVE">{t.common.active}</option>
            <option value="INACTIVE">{t.common.inactive}</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-5 font-normal">{t.departments.colName}</th>
                <th className="px-6 py-5 font-normal">{t.departments.colDescription}</th>
                <th className="px-6 py-5 font-normal">{t.common.status}</th>
                <th className="px-6 py-5 font-normal text-right">{t.common.manage}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                    {t.departments.empty}
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{dept.name}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-normal min-w-[300px]">{dept.description || '-'}<p className="mt-1 text-xs text-teal-700">ตำแหน่ง: {dept.positions?.length ? dept.positions.join(', ') : 'ยังไม่ได้กำหนด'}</p></td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        dept.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {dept.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(dept)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-xs text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors font-medium"
                        >
                          <Edit2 className="w-3 h-3" /> {t.common.edit}
                        </button>
                        <button
                          onClick={() => handleDelete(dept.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-medium"
                        >
                          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} {t.common.delete}
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 transition-colors">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                {editingId ? t.departments.modalEditTitle : t.departments.modalAddTitle}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {loadError && <p role="alert" className="text-sm text-red-600">{loadError}</p>}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.departments.formName}</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.departments.formDescription}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 transition-colors text-sm text-gray-700 dark:text-gray-200 resize-none h-24"
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">ตำแหน่งในแผนก *</legend>
                <p className="text-xs text-gray-500">เลือกได้หลายตำแหน่ง รายการนี้จะใช้ในหน้าเพิ่มผู้ใช้งาน</p>
                <div className="grid grid-cols-2 gap-3">
                  {companyUserPositions.map(position => <label key={position} className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-600">
                    <input type="checkbox" checked={formData.positions.includes(position)} onChange={event => {
                      const checked = event.target.checked;
                      setFormData(previous => ({ ...previous, positions: checked ? [...previous.positions, position] : previous.positions.filter(item => item !== position) }));
                    }} className="accent-teal-600" />{position}
                  </label>)}
                </div>
              </fieldset>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-gray-300 dark:border-gray-600 focus:ring-teal-500 dark:focus:ring-teal-400 bg-white dark:bg-gray-800 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  {t.departments.formIsActive}
                </label>
              </div>

              <div className="pt-6 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                >
                  {t.departments.btnCancel}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? t.common.save : t.departments.btnAdd}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
