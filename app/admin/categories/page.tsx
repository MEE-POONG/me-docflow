"use client";

import { useState, useEffect } from "react";
import { Folder, Plus, Edit2, Trash2, X, Save, CheckCircle2, Search, FileText } from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  code: string;
  description: string;
  documentCount: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("me_docflow_global_categories");
    if (saved) {
      try {
        setCategories(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      const initial: CategoryItem[] = [
        { id: "1", name: "บัญชีและการเงิน (Accounting & Finance)", code: "ACC", description: "เอกสารทางบัญชี ภาษี รายรับ-รายจ่าย ใบแจ้งหนี้", documentCount: 412 },
        { id: "2", name: "งานทรัพยากรบุคคล (Human Resources)", code: "HR", description: "เอกสารสัญญาจ้างพนักงาน เงินเดือน ประวัติพนักงาน ข้อมูลติดต่อ", documentCount: 154 },
        { id: "3", name: "ฝ่ายจัดซื้อและพัสดุ (Procurement)", code: "PUR", description: "เอกสารใบสั่งซื้อสินค้า ใบขอเสนอราคา ใบตรวจรับของ", documentCount: 287 },
        { id: "4", name: "เอกสารกฎหมายและสัญญา (Legal & Contracts)", code: "LEG", description: "สัญญาบันทึกความเข้าใจ MOU เอกสารจัดตั้งนิติบุคคล สัญญาร่วมค้า", documentCount: 65 },
        { id: "5", name: "งานขายและการตลาด (Sales & Marketing)", code: "MKT", description: "เอกสารแผนการตลาด รายงานวิเคราะห์การขาย ใบแจ้งเสนอราคา", documentCount: 198 }
      ];
      setCategories(initial);
      localStorage.setItem("me_docflow_global_categories", JSON.stringify(initial));
    }
  }, []);

  const saveToLocalStorage = (updated: CategoryItem[], actionMsg: string) => {
    setCategories(updated);
    localStorage.setItem("me_docflow_global_categories", JSON.stringify(updated));

    // Audit log
    const logs = localStorage.getItem("me_docflow_audit_logs");
    const currentLogs = logs ? JSON.parse(logs) : [];
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      user: "System Admin (admin)",
      action: actionMsg,
      type: "info"
    };
    localStorage.setItem("me_docflow_audit_logs", JSON.stringify([newLog, ...currentLogs]));
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName("");
    setCode("");
    setDescription("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setCode(cat.code);
    setDescription(cat.description);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string, catName: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่เอกสาร "${catName}"?`)) {
      const updated = categories.filter(c => c.id !== id);
      saveToLocalStorage(updated, `ลบหมวดหมู่เอกสารส่วนกลาง "${catName}"`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    if (editingCategory) {
      const updated = categories.map(c => 
        c.id === editingCategory.id 
          ? { ...c, name, code: code.toUpperCase(), description } 
          : c
      );
      saveToLocalStorage(updated, `แก้ไขข้อมูลหมวดหมู่เอกสารเป็น "${name}" (รหัส: ${code.toUpperCase()})`);
    } else {
      const newCat: CategoryItem = {
        id: Date.now().toString(),
        name,
        code: code.toUpperCase(),
        description,
        documentCount: 0
      };
      saveToLocalStorage([...categories, newCat], `เพิ่มหมวดหมู่เอกสารใหม่ "${name}" (รหัส: ${code.toUpperCase()})`);
    }

    setIsFormOpen(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-light">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">Document Folders</p>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-serif">หมวดหมู่เอกสารส่วนกลาง</h1>
          <p className="text-sm text-slate-500">บริหารกลุ่มแฟ้มเอกสารหลักในระบบ เพื่อการจัดสิทธิ์และคัดแยกประเภทการจัดเก็บเอกสารอย่างเป็นระเบียบ</p>
        </div>
        <div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-5 rounded-xl shadow-md transition-colors cursor-pointer text-xs font-sans"
          >
            <Plus className="w-4 h-4" />
            เพิ่มหมวดหมู่ใหม่
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-semibold">บันทึกข้อมูลหมวดหมู่เอกสารสำเร็จ!</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="ค้นหาหมวดหมู่ หรือ รหัส..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          พบทั้งหมด <span className="text-slate-800 font-bold">{filtered.length}</span> หมวดหมู่
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-150">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Folder className="w-5 h-5 text-amber-550" />
              {editingCategory ? "แก้ไขข้อมูลหมวดหมู่" : "เพิ่มหมวดหมู่เอกสารใหม่"}
            </h3>
            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer"><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 font-sans">ชื่อหมวดหมู่</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="เช่น เอกสารจัดซื้อสินค้า"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-555 uppercase mb-1.5 font-sans">รหัสหมวดหมู่ (Code - สูงสุด 4 ตัวอักษร)</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-950 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono uppercase"
                  placeholder="เช่น PUR"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-555 uppercase mb-1.5 font-sans">คำอธิบายรายละเอียด</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs text-gray-950 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-sans"
                  placeholder="รายละเอียดเอกสารที่จัดเก็บภายใต้หมวดหมู่นี้..."
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-150 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-slate-500 hover:bg-gray-100 transition-colors cursor-pointer font-sans"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer font-sans"
              >
                <Save className="w-4 h-4" />
                บันทึกหมวดหมู่
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-650">
            <thead className="text-gray-500 uppercase bg-gray-50 border-b border-gray-200 font-bold">
              <tr>
                <th className="py-3.5 px-6">ชื่อหมวดหมู่เอกสาร</th>
                <th className="py-3.5 px-6">รหัสอ้างอิง (Code)</th>
                <th className="py-3.5 px-6">คำอธิบายการจัดหมวด</th>
                <th className="py-3.5 px-6">จำนวนเอกสารในระบบ</th>
                <th className="py-3.5 px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    ไม่พบหมวดหมู่เอกสารใดในระบบ
                  </td>
                </tr>
              ) : (
                filtered.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <Folder className="w-4 h-4 text-amber-550 shrink-0" />
                        {cat.name}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-amber-600 font-bold">
                      {cat.code}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-light truncate max-w-xs" title={cat.description}>
                      {cat.description || "-"}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 bg-gray-50 px-2 py-0.5 border border-gray-200 rounded">
                        <FileText className="w-3 h-3 text-slate-400" />
                        {cat.documentCount}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="แก้ไขหมวดหมู่"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-2 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="ลบหมวดหมู่"
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
