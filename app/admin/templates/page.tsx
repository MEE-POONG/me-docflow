"use client";

import { useState, useEffect } from "react";
import { LayoutTemplate, Plus, Edit2, Trash2, X, Save, CheckCircle2, Search, ToggleLeft, ToggleRight, PenTool } from "lucide-react";
import Link from "next/link";
import { getAdminTemplates, createAdminTemplate, updateAdminTemplate, deleteAdminTemplate } from "./actions";

interface TemplateItem {
  id: string;
  name: string;
  type: string;
  description: string;
  isActive: boolean;
  designer: string;
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("QT");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [designer, setDesigner] = useState("System Designer");

  const fetchTemplates = async () => {
    try {
      const data = await getAdminTemplates();
      setTemplates(data);
    } catch (e) {
      console.error("Error fetching templates", e);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const logAdminAction = (actionMsg: string) => {
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
    setEditingTemplate(null);
    setName("");
    setType("QT");
    setDescription("");
    setIsActive(true);
    setDesigner("System Designer");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (temp: TemplateItem) => {
    setEditingTemplate(temp);
    setName(temp.name);
    setType(temp.type);
    setDescription(temp.description);
    setIsActive(temp.isActive);
    setDesigner(temp.designer);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, tempName: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบแม่แบบการพิมพ์ "${tempName}"?`)) {
      try {
        await deleteAdminTemplate(id);
        await fetchTemplates();
        logAdminAction(`ลบแม่แบบพิมพ์ส่วนกลาง "${tempName}"`);
      } catch (e) {
        console.error(e);
        alert("เกิดข้อผิดพลาดในการลบ");
      }
    }
  };

  const toggleTemplateStatus = async (id: string, tempName: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      const target = templates.find(t => t.id === id);
      if (target) {
        await updateAdminTemplate(id, {
          name: target.name,
          type: target.type,
          description: target.description,
          isActive: nextStatus,
          designer: target.designer
        });
        await fetchTemplates();
        logAdminAction(`${nextStatus ? "เปิดใช้" : "ปิดใช้งาน"} แม่แบบพิมพ์ "${tempName}" สำหรับบริษัทคู่ค้า`);
      }
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      if (editingTemplate) {
        await updateAdminTemplate(editingTemplate.id, {
          name, type, description, isActive, designer
        });
        logAdminAction(`แก้ไขรายละเอียดแม่แบบระบบ "${name}"`);
      } else {
        await createAdminTemplate({
          name, type, description, isActive, designer
        });
        logAdminAction(`สร้างแม่แบบพิมพ์ระบบตัวใหม่ "${name}" (รูปแบบ: ${type})`);
      }

      await fetchTemplates();
      setIsFormOpen(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const filtered = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.designer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-light">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">Central Print Templates</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-serif">Template กลางสำหรับพิมพ์เอกสาร</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">บริหารจัดเตรียมโครงร่าง สีสัน และสไตล์เอกสารพิมพ์ที่ระบบแอดมินมอบให้เป็นค่ามาตรฐานสำหรับทุกบริษัท</p>
        </div>
        <div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-955 font-bold py-3 px-5 rounded-xl shadow-md transition-colors cursor-pointer text-xs font-sans"
          >
            <Plus className="w-4 h-4" />
            เพิ่มแม่แบบกลาง
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          <p className="text-sm font-semibold">บันทึกโครงสร้างแม่แบบ Template สำเร็จ!</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-505 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="ค้นหาชื่อแม่แบบ ชนิด หรือผู้ออกแบบ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors duration-200"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          พบทั้งหมด <span className="text-slate-800 dark:text-white font-bold">{filtered.length}</span> รายการ
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 transition-colors duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-slate-850">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <LayoutTemplate className="w-5 h-5 text-amber-550" />
              {editingTemplate ? "ปรับปรุงแม่แบบระบบ" : "เพิ่มแม่แบบมาตรฐานกลางใหม่"}
            </h3>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1.5 font-sans">ชื่อเรียกแม่แบบ</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
                  placeholder="เช่น Classic Emerald Theme"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1.5 font-sans">ประเภทของเอกสารที่ใช้คู่กัน</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-white dark:bg-slate-955 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer font-sans transition-colors duration-200"
                >
                  <option value="QT">ใบเสนอราคา (QT)</option>
                  <option value="INV">ใบแจ้งหนี้ (INV)</option>
                  <option value="RE">ใบเสร็จรับเงิน (RE)</option>
                  <option value="PO">ใบสั่งซื้อ (PO)</option>
                  <option value="EMP">เอกสารจ้างงาน (EMP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1.5 font-sans">นักออกแบบ / แหล่งที่มา</label>
                <input
                  type="text"
                  value={designer}
                  onChange={(e) => setDesigner(e.target.value)}
                  className="w-full bg-white dark:bg-slate-955 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
                  placeholder="เช่น System Designer"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1.5 font-sans">สิทธิ์สถานะการเปิดใช้</label>
                <div className="flex items-center gap-3 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {isActive ? <ToggleRight className="w-9 h-9 text-amber-550" /> : <ToggleLeft className="w-9 h-9 text-slate-400" />}
                  </button>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                    {isActive ? "เปิดใช้: บริษัทลูกค้าทั้งหมดสามารถมองเห็นและนำไปใช้พิมพ์งานได้" : "ระงับใช้: แอดมินปิดการดึงไปใช้ชั่วคราว"}
                  </span>
                </div>
              </div>

              <div className="col-span-1 md:col-span-3">
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1.5 font-sans">รายละเอียดแนวทางการจัดพิมพ์</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl p-3 text-xs text-gray-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-sans transition-colors duration-200"
                  placeholder="คำแนะนำในการกรอกข้อมูลลงลายน้ำ ขอบ สี ตราหัวจดหมาย..."
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
                บันทึกข้อมูลเทมเพลต
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid view of templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((temp) => (
          <div key={temp.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 hover:border-amber-300 dark:hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4 shadow-sm duration-200">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-100 dark:border-amber-500/20">
                    <LayoutTemplate className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-805 dark:text-slate-200">{temp.name}</h3>
                    <span className="inline-flex items-center gap-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-0.5 rounded text-[9px] text-amber-600 dark:text-amber-500 font-mono font-bold mt-1 uppercase">
                      {temp.type} Format
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link 
                    href={`/admin/templates/${temp.id}/designer`}
                    className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg cursor-pointer transition-colors"
                    title="ออกแบบเลย์เอาต์ (Designer)"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                  </Link>
                  <button 
                    onClick={() => handleOpenEdit(temp)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(temp.id, temp.name)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-655 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-relaxed">{temp.description || "ไม่มีคำอธิบาย"}</p>
            </div>

            <div className="border-t border-gray-100 dark:border-slate-800 pt-3 flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-450">โดย: <strong className="text-slate-800 dark:text-slate-200">{temp.designer}</strong></span>
              
              <button 
                onClick={() => toggleTemplateStatus(temp.id, temp.name, temp.isActive)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                  temp.isActive 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-100 dark:border-emerald-500/20' 
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${temp.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                {temp.isActive ? 'เปิดใช้งานอยู่' : 'ปิดการใช้งาน'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
