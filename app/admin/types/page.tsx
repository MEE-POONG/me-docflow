"use client";

import { useState, useEffect } from "react";
import { FileCode, Plus, Edit2, Trash2, X, Save, CheckCircle2, Search, FolderOpen } from "lucide-react";

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

  // Form states
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [categoryCode, setCategoryCode] = useState("ACC");
  const [description, setDescription] = useState("");

  useEffect(() => {
    // Load categories for dropdown
    const savedCats = localStorage.getItem("me_docflow_global_categories");
    if (savedCats) {
      setCategories(JSON.parse(savedCats));
    } else {
      setCategories([
        { name: "บัญชีและการเงิน", code: "ACC" },
        { name: "งานทรัพยากรบุคคล", code: "HR" },
        { name: "ฝ่ายจัดซื้อและพัสดุ", code: "PUR" },
        { name: "เอกสารกฎหมายและสัญญา", code: "LEG" },
        { name: "งานขายและการตลาด", code: "MKT" }
      ]);
    }

    const saved = localStorage.getItem("me_docflow_global_types");
    if (saved) {
      try {
        setTypes(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      const initial: TypeItem[] = [
        { id: "1", name: "ใบเสนอราคา (Quotation)", prefix: "QT", categoryCode: "MKT", description: "เอกสารการเสนอราคาของงานขายโครงการหรือบริการลูกค้า" },
        { id: "2", name: "ใบสั่งซื้อสินค้า (Purchase Order)", prefix: "PO", categoryCode: "PUR", description: "ใบสั่งซื้อสินค้าหรือวัตถุดิบส่งผู้จัดจำหน่ายคู่ค้า" },
        { id: "3", name: "ใบแจ้งหนี้ / ใบกำกับภาษี (Invoice / Tax Invoice)", prefix: "INV", categoryCode: "ACC", description: "เอกสารเรียกเก็บเงินภาษีมูลค่าเพิ่มสำหรับการค้าเชิงพาณิชย์" },
        { id: "4", name: "ใบเสร็จรับเงิน / ใบกำกับภาษี (Receipt / Tax Invoice)", prefix: "RE", categoryCode: "ACC", description: "ใบยืนยันการรับเงินค่าสินค้าและบริการแก่ลูกค้า" },
        { id: "5", name: "สัญญาจ้างงานพนักงาน (Employment Contract)", prefix: "EMP", categoryCode: "HR", description: "สัญญาว่าจ้างบุคลากรและข้อตกลงอัตราเงินเดือนพนักงานใหม่" }
      ];
      setTypes(initial);
      localStorage.setItem("me_docflow_global_types", JSON.stringify(initial));
    }
  }, []);

  const saveToLocalStorage = (updated: TypeItem[], actionMsg: string) => {
    setTypes(updated);
    localStorage.setItem("me_docflow_global_types", JSON.stringify(updated));

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

  const handleDelete = (id: string, typeName: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบประเภทเอกสาร "${typeName}"?`)) {
      const updated = types.filter(t => t.id !== id);
      saveToLocalStorage(updated, `ลบประเภทเอกสารส่วนกลาง "${typeName}"`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !prefix) return;

    if (editingType) {
      const updated = types.map(t => 
        t.id === editingType.id 
          ? { ...t, name, prefix: prefix.toUpperCase(), categoryCode, description } 
          : t
      );
      saveToLocalStorage(updated, `แก้ไขข้อมูลประเภทเอกสารเป็น "${name}" (คำนำหน้า: ${prefix.toUpperCase()})`);
    } else {
      const newType: TypeItem = {
        id: Date.now().toString(),
        name,
        prefix: prefix.toUpperCase(),
        categoryCode,
        description
      };
      saveToLocalStorage([...types, newType], `เพิ่มประเภทเอกสารใหม่ "${name}" (คำนำหน้า: ${prefix.toUpperCase()})`);
    }

    setIsFormOpen(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const filtered = types.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.prefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.categoryCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-light">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">Document Presets</p>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-serif">ประเภทเอกสารของระบบ</h1>
          <p className="text-sm text-slate-500">กำหนดชนิดของเอกสาร คำนำหน้า (Prefix) และจัดกลุ่มเอกสารให้อยู่ภายใต้หมวดหมู่หลักทางธุรกิจ</p>
        </div>
        <div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-5 rounded-xl shadow-md transition-colors cursor-pointer text-xs font-sans"
          >
            <Plus className="w-4 h-4" />
            เพิ่มประเภทเอกสาร
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-semibold">บันทึกข้อมูลประเภทเอกสารสำเร็จ!</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อประเภท คำนำหน้า หรือหมวดหมู่..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          พบทั้งหมด <span className="text-slate-800 font-bold">{filtered.length}</span> ชนิดเอกสาร
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-150">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <FileCode className="w-5 h-5 text-amber-550" />
              {editingType ? "แก้ไขข้อมูลประเภทเอกสาร" : "เพิ่มประเภทเอกสารใหม่"}
            </h3>
            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer"><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-sans">ชื่อประเภทเอกสาร (ภาษาไทย / อังกฤษ)</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="เช่น ใบส่งมอบสินค้า (Delivery Order)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-sans">คำนำหน้าเลขรันเอกสาร (Prefix)</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-950 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono uppercase"
                  placeholder="เช่น DO"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-sans">สังกัดภายใต้หมวดหมู่หลัก</label>
                <select
                  value={categoryCode}
                  onChange={(e) => setCategoryCode(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-950 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer font-sans"
                >
                  {categories.map((c) => (
                    <option key={c.code} value={c.code}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-sans">คำอธิบายรายละเอียด</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-955 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  placeholder="เช่น เอกสารสำหรับพนักงานจัดของส่งให้กับคู่ค้าปลายทาง"
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
                บันทึกชนิดเอกสาร
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
                <th className="py-3.5 px-6">ชื่อเอกสาร</th>
                <th className="py-3.5 px-6">คำนำหน้า (Prefix)</th>
                <th className="py-3.5 px-6">หมวดหมู่หลัก</th>
                <th className="py-3.5 px-6">รายละเอียดลักษณะ</th>
                <th className="py-3.5 px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    ไม่พบข้อมูลประเภทเอกสารใดในระบบ
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <FileCode className="w-4 h-4 text-amber-550 shrink-0" />
                        {t.name}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-amber-600 font-bold text-sm">
                      {t.prefix}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 bg-gray-50 px-2.5 py-1 border border-gray-200 text-[10px] rounded-lg text-slate-650 font-bold">
                        <FolderOpen className="w-3 h-3 text-slate-400" />
                        {t.categoryCode}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-light truncate max-w-xs" title={t.description}>
                      {t.description || "-"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="แก้ไขเอกสาร"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          className="p-2 text-slate-400 hover:text-red-655 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
