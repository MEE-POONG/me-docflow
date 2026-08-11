"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, CheckCircle, XCircle, Search } from "lucide-react";
import { getAdminBusinessTypes, createAdminBusinessType, updateAdminBusinessType, deleteAdminBusinessType } from "../actions";

interface BusinessType {
  id: string;
  value: string;
  label: string;
  isActive: boolean;
}

export default function AdminBusinessTypesPage() {
  const [types, setTypes] = useState<BusinessType[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<BusinessType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchTypes = async () => {
    try {
      const data = await getAdminBusinessTypes();
      setTypes(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const logAdminAction = (logMessage: string) => {
    // Seed audit log
    const logs = localStorage.getItem("me_docflow_audit_logs");
    const currentLogs = logs ? JSON.parse(logs) : [];
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      user: "System Admin (admin)",
      action: logMessage,
      type: "info"
    };
    localStorage.setItem("me_docflow_audit_logs", JSON.stringify([newLog, ...currentLogs]));
  };

  const handleOpenAdd = () => {
    setEditingType(null);
    setLabel("");
    setValue("");
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: BusinessType) => {
    setEditingType(t);
    setLabel(t.label);
    setValue(t.value);
    setIsActive(t.isActive);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, typeLabel: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบประเภทธุรกิจ "${typeLabel}"?`)) {
      try {
        await deleteAdminBusinessType(id);
        await fetchTypes();
        logAdminAction(`ลบประเภทธุรกิจ "${typeLabel}"`);
      } catch (e: any) {
        alert(e.message || "Error deleting business type");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !value) return;

    setIsSubmitting(true);
    try {
      if (editingType) {
        await updateAdminBusinessType(editingType.id, { label, value, isActive });
        logAdminAction(`แก้ไขข้อมูลประเภทธุรกิจเป็น "${label}"`);
      } else {
        await createAdminBusinessType({ label, value, isActive });
        logAdminAction(`เพิ่มประเภทธุรกิจใหม่ "${label}"`);
      }
      
      await fetchTypes();
      setIsFormOpen(false);
    } catch (e: any) {
      alert(e.message || "Error saving business type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTypes = types.filter(t => 
    t.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-light">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">Company Presets</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-serif">ประเภทธุรกิจ</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">จัดการประเภทธุรกิจที่ใช้สำหรับให้ลูกค้าเลือกระหว่างการลงทะเบียนบริษัท</p>
        </div>
        <div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-5 rounded-xl shadow-md transition-colors cursor-pointer text-xs font-sans"
          >
            <Plus className="w-4 h-4" />
            เพิ่มประเภทธุรกิจ
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ค้นหาชื่อหรือรหัสประเภทธุรกิจ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider">
                <th className="p-4 pl-6">ชื่อประเภทธุรกิจ</th>
                <th className="p-4">รหัส (Value)</th>
                <th className="p-4 text-center">สถานะ</th>
                <th className="p-4 pr-6 text-right w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredTypes.length > 0 ? (
                filteredTypes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-semibold text-slate-900 dark:text-white">{t.label}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-[11px] font-mono font-medium">{t.value}</span>
                    </td>
                    <td className="p-4 text-center">
                      {t.isActive ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <CheckCircle size={12} /> ใช้งาน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <XCircle size={12} /> ปิดใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.label)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                    ไม่พบข้อมูลประเภทธุรกิจ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif">
                {editingType ? "แก้ไขประเภทธุรกิจ" : "เพิ่มประเภทธุรกิจใหม่"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  ชื่อประเภทธุรกิจ (Label)
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="เช่น ร้านอาหาร / คาเฟ่"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  รหัสอ้างอิง (Value)
                </label>
                <input
                  type="text"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  placeholder="เช่น restaurant"
                />
                <p className="text-xs text-slate-500 mt-1.5">ภาษาอังกฤษตัวพิมพ์เล็ก ไม่มีเว้นวรรค สำหรับอ้างอิงในระบบ</p>
              </div>

              <div className="flex items-center gap-3 pt-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  เปิดใช้งานทันที (แสดงในหน้าลงทะเบียน)
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-300 text-slate-950 rounded-xl text-sm font-bold shadow-md transition-colors"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
