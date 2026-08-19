'use client';

import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, CheckCircle2, CircleOff, Edit2, Loader2, Plus, Search, Trash2, X } from 'lucide-react';

interface BusinessType {
  id: string;
  value: string;
  label: string;
  isActive: boolean;
}

type StatusFilter = 'all' | 'active' | 'inactive';

export default function BusinessTypesPage() {
  const [types, setTypes] = useState<BusinessType[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<BusinessType | null>(null);
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        const response = await fetch('/api/business-types');
        if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูลประเภทธุรกิจได้');
        setTypes(await response.json());
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  const filteredTypes = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return types.filter((type) => {
      const matchesSearch = !keyword || type.label.toLowerCase().includes(keyword) || type.value.toLowerCase().includes(keyword);
      const matchesStatus = status === 'all' || (status === 'active' ? type.isActive : !type.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [search, status, types]);

  const activeCount = types.filter((type) => type.isActive).length;

  const openCreateForm = () => {
    setEditingType(null);
    setLabel('');
    setValue('');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const openEditForm = (type: BusinessType) => {
    setEditingType(type);
    setLabel(type.label);
    setValue(type.value);
    setIsActive(type.isActive);
    setIsFormOpen(true);
  };

  const saveBusinessType = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const response = await fetch(editingType ? `/api/business-types/${editingType.id}` : '/api/business-types', {
        method: editingType ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim(), value: value.trim(), isActive }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถบันทึกประเภทธุรกิจได้');
      setTypes((items) => editingType ? items.map((item) => item.id === result.id ? result : item) : [...items, result]);
      setIsFormOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBusinessType = async (type: BusinessType) => {
    if (!window.confirm(`ยืนยันการลบประเภทธุรกิจ “${type.label}” หรือไม่?`)) return;
    setError('');
    try {
      const response = await fetch(`/api/business-types/${type.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถลบประเภทธุรกิจได้');
      setTypes((items) => items.filter((item) => item.id !== type.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Company Information</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">ประเภทธุรกิจ</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">รายการประเภทธุรกิจมาตรฐานที่บริษัทสามารถเลือกใช้ในการลงทะเบียนและตั้งค่าข้อมูลบริษัท</p>
        </div>
        <button type="button" onClick={openCreateForm} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> เพิ่มประเภทธุรกิจ
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-5 py-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ประเภททั้งหมด</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{types.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-5 py-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">เปิดใช้งาน</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{activeCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-5 py-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ปิดใช้งาน</p>
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 tabular-nums">{types.length - activeCount}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg">
              <BriefcaseBusiness className="w-5 h-5" />
            </div>
            <div><h2 className="font-semibold text-gray-900 dark:text-white">รายการประเภทธุรกิจในระบบ</h2><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ข้อมูลส่วนกลางที่กำหนดโดยผู้ดูแลระบบ</p></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อหรือรหัส..." className="w-full sm:w-64 pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-emerald-600" />
            </div>
            <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:border-emerald-600">
              <option value="active">เปิดใช้งาน</option><option value="inactive">ปิดใช้งาน</option><option value="all">ทุกสถานะ</option>
            </select>
          </div>
        </div>

        {isLoading ? <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div> : error ? <div className="px-6 py-12 text-center text-sm text-red-600 dark:text-red-400">{error}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/60 text-xs text-gray-500 dark:text-gray-400"><tr><th className="px-6 py-3 text-left font-semibold">ชื่อประเภทธุรกิจ</th><th className="px-6 py-3 text-left font-semibold">รหัสอ้างอิง</th><th className="px-6 py-3 text-center font-semibold">สถานะ</th><th className="px-6 py-3 text-right font-semibold">จัดการ</th></tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredTypes.length ? filteredTypes.map((type) => <tr key={type.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"><td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{type.label}</td><td className="px-6 py-4"><code className="px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded text-xs">{type.value}</code></td><td className="px-6 py-4 text-center">{type.isActive ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" />ใช้งาน</span> : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 text-xs font-medium"><CircleOff className="w-3.5 h-3.5" />ปิดใช้งาน</span>}</td><td className="px-6 py-4"><div className="flex justify-end gap-1"><button type="button" onClick={() => openEditForm(type)} title="แก้ไข" className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"><Edit2 className="w-4 h-4" /></button><button type="button" onClick={() => void deleteBusinessType(type)} title="ลบ" className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td></tr>) : <tr><td colSpan={4} className="px-6 py-14 text-center text-gray-400 dark:text-gray-500">ไม่พบประเภทธุรกิจที่ตรงกับเงื่อนไข</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <div><h2 className="font-semibold text-gray-900 dark:text-white">{editingType ? 'แก้ไขประเภทธุรกิจ' : 'เพิ่มประเภทธุรกิจ'}</h2><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">กำหนดชื่อ รหัสอ้างอิง และสถานะการใช้งาน</p></div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveBusinessType}>
              <div className="px-6 py-5 space-y-4">
                <div><label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">ชื่อประเภทธุรกิจ <span className="text-red-500">*</span></label><input required value={label} onChange={(event) => setLabel(event.target.value)} placeholder="เช่น ร้านอาหาร / คาเฟ่" className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-emerald-600" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">รหัสอ้างอิง <span className="text-red-500">*</span></label><input required value={value} onChange={(event) => setValue(event.target.value)} placeholder="เช่น restaurant" className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:border-emerald-600" /><p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">ควรใช้ภาษาอังกฤษ ไม่มีเว้นวรรค และไม่ซ้ำกับรายการอื่น</p></div>
                <label className="flex items-center gap-2 px-3 py-3 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 cursor-pointer"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="w-4 h-4 accent-emerald-600" />เปิดใช้งานประเภทธุรกิจนี้</label>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30 flex justify-end gap-2"><button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">ยกเลิก</button><button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">{isSaving ? 'กำลังบันทึก...' : editingType ? 'บันทึกการแก้ไข' : 'เพิ่มประเภทธุรกิจ'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
