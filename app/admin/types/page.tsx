"use client";

import { useState, useEffect } from "react";
import { FileCode, Plus, Edit2, Trash2, X, Save, CheckCircle2, Search, FolderOpen } from "lucide-react";
import { getAdminDocumentTypes, createAdminDocumentType, updateAdminDocumentType, deleteAdminDocumentType, getAdminCategories } from "../actions";

interface TypeItem {
  id: string;
  name: string;
  prefix: string;
  categoryCode: string;
  description: string;
}

export default function AdminDocumentTypesPage() {
  const [types, setTypes] = useState<TypeItem[]>([]);
  const [categories, setCategories] = useState<{ name: string; code: string }[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<TypeItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Form states
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [categoryCode, setCategoryCode] = useState("ACC");
  const [description, setDescription] = useState("");

  const fetchCategoriesAndTypes = async () => {
    try {
      const cats = await getAdminCategories();
      setCategories(cats.map(c => ({ name: c.name, code: c.code })));

      const data = await getAdminDocumentTypes();
      setTypes(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCategoriesAndTypes();
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
    setName("");
    setPrefix("");
    setCategoryCode(categories[0]?.code || "ACC");
    setDescription("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: TypeItem) => {
    setEditingType(t);
    setName(t.name);
    setPrefix(t.prefix);
    setCategoryCode(t.categoryCode);
    setDescription(t.description);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, typeName: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบประเภทเอกสาร "${typeName}"?`)) {
      try {
        await deleteAdminDocumentType(id);
        await fetchCategoriesAndTypes();
        logAdminAction(`ลบประเภทเอกสารส่วนกลาง "${typeName}"`);
      } catch (e: any) {
        alert(e.message || "Error deleting document type");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !prefix) return;

    try {
      if (editingType) {
        await updateAdminDocumentType(editingType.id, {
          name, prefix: prefix.toUpperCase(), categoryCode, description
        });
        logAdminAction(`แก้ไขข้อมูลประเภทเอกสารเป็น "${name}" (คำนำหน้า: ${prefix.toUpperCase()})`);
      } else {
        await createAdminDocumentType({
          name, prefix: prefix.toUpperCase(), categoryCode, description
        });
        logAdminAction(`เพิ่มประเภทเอกสารใหม่ "${name}" (คำนำหน้า: ${prefix.toUpperCase()})`);
      }
      
      await fetchCategoriesAndTypes();
      
      setIsFormOpen(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e: any) {
      alert(e.message || "Error saving document type");
    }
  };

  const filtered = types
    .filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.prefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.categoryCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "ALL" || t.categoryCode === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.categoryCode.localeCompare(b.categoryCode) || a.name.localeCompare(b.name);
      } else {
        return b.categoryCode.localeCompare(a.categoryCode) || a.name.localeCompare(b.name);
      }
    });

  return (
    <div className="space-y-6 font-light">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">Document Presets</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-serif">ประเภทเอกสารของระบบ</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">กำหนดชนิดของเอกสาร คำนำหน้า (Prefix) และจัดกลุ่มเอกสารให้อยู่ภายใต้หมวดหมู่หลักทางธุรกิจ</p>
        </div>
        <div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-955 font-bold py-3 px-5 rounded-xl shadow-md transition-colors cursor-pointer text-xs font-sans"
          >
            <Plus className="w-4 h-4" />
            เพิ่มประเภทเอกสาร
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          <p className="text-sm font-semibold">บันทึกข้อมูลประเภทเอกสารสำเร็จ!</p>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="ค้นหาตามชื่อ หรือ Prefix..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors duration-200"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full sm:w-56 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors duration-200 cursor-pointer"
          >
            <option value="ALL">ทุกหมวดหมู่ (All Categories)</option>
            {categories.map(c => (
              <option key={c.code} value={c.code}>[{c.code}] {c.name}</option>
            ))}
          </select>
          
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            className="w-full sm:w-48 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors duration-200 cursor-pointer"
          >
            <option value="asc">เรียงหมวดหมู่ (A-Z)</option>
            <option value="desc">เรียงหมวดหมู่ (Z-A)</option>
          </select>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap w-full xl:w-auto text-right xl:text-left">
          พบทั้งหมด <span className="text-slate-800 dark:text-white font-bold">{filtered.length}</span> ชนิดเอกสาร
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 transition-colors duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-slate-850">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <FileCode className="w-5 h-5 text-amber-550" />
              {editingType ? "แก้ไขข้อมูลประเภทเอกสาร" : "เพิ่มประเภทเอกสารใหม่"}
            </h3>
            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-505 dark:text-slate-400 uppercase mb-1.5 font-sans">ชื่อประเภทเอกสาร (ภาษาไทย / อังกฤษ)</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
                  placeholder="เช่น ใบส่งมอบสินค้า (Delivery Order)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-505 dark:text-slate-400 uppercase mb-1.5 font-sans">คำนำหน้าเลขรันเอกสาร (Prefix)</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono uppercase transition-colors duration-200"
                  placeholder="เช่น DO"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-505 dark:text-slate-400 uppercase mb-1.5 font-sans">สังกัดภายใต้หมวดหมู่หลัก</label>
                <select
                  value={categoryCode}
                  onChange={(e) => setCategoryCode(e.target.value)}
                  className="w-full bg-white dark:bg-slate-955 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer font-sans transition-colors duration-200"
                >
                  {categories.map((c) => (
                    <option key={c.code} value={c.code}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-505 dark:text-slate-400 uppercase mb-1.5 font-sans">คำอธิบายรายละเอียด</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans transition-colors duration-200"
                  placeholder="เช่น เอกสารสำหรับพนักงานจัดของส่งให้กับคู่ค้าปลายทาง"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-150 dark:border-slate-850 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-sans"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-955 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer font-sans"
              >
                <Save className="w-4 h-4" />
                บันทึกชนิดเอกสาร
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-655 dark:text-slate-350">
            <thead className="text-gray-500 dark:text-slate-400 uppercase bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 font-bold">
              <tr>
                <th className="py-3.5 px-6">ชื่อเอกสาร</th>
                <th className="py-3.5 px-6">คำนำหน้า (Prefix)</th>
                <th className="py-3.5 px-6">หมวดหมู่หลัก</th>
                <th className="py-3.5 px-6">รายละเอียดลักษณะ</th>
                <th className="py-3.5 px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-slate-500">
                    ไม่พบข้อมูลประเภทเอกสารใดในระบบ
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <FileCode className="w-4 h-4 text-amber-550 shrink-0" />
                        {t.name}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-amber-600 dark:text-amber-500 font-bold text-sm">
                      {t.prefix}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 border border-gray-200 dark:border-slate-700 text-[10px] rounded-lg text-slate-655 dark:text-slate-350 font-bold transition-colors duration-200">
                        <FolderOpen className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        {t.categoryCode}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-light truncate max-w-xs" title={t.description}>
                      {t.description || "-"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="แก้ไขเอกสาร"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-655 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                          title="ลบประเภทเอกสาร"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
