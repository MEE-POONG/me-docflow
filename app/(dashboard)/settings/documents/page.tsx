"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Eye, Hash, Plus, Save, Trash2, X } from "lucide-react";

interface DocConfig {
  prefix: string;
  useDate: boolean;
  digits: number;
  startNumber: number;
}

interface CustomDocConfig {
  id: string;
  title: string;
  description: string;
  config: DocConfig;
}

function generatePreview(config: DocConfig) {
  const dateStr = config.useDate ? "202607" : "";
  const separator = config.useDate ? "-" : "";
  const numStr = String(config.startNumber).padStart(config.digits, "0");
  return `${config.prefix}${separator}${dateStr}${separator}${numStr}`;
}

function DocumentConfigRow({ title, description, config, onChange, onDelete }: {
  title: string;
  description: string;
  config: DocConfig;
  onChange: (config: DocConfig) => void;
  onDelete?: () => void;
}) {
  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors";

  return (
    <section className="px-6 py-5">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-2">
          <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
          {onDelete && (
            <button type="button" onClick={onDelete} title="ลบหมวดหมู่" className="p-1 text-gray-400 hover:text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="inline-flex items-center gap-2 self-start border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-lg text-xs text-gray-600">
          <Eye className="w-3.5 h-3.5 text-emerald-700" />
          <span>ตัวอย่างเลขเอกสาร</span>
          <code className="font-semibold text-gray-900">{generatePreview(config)}</code>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_220px] gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">คำขึ้นต้น (Prefix)</label>
          <input type="text" required value={config.prefix}
            onChange={(event) => onChange({ ...config, prefix: event.target.value })}
            className={`${inputClass} font-mono`} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">จำนวนหลักของเลขรัน</label>
          <select value={config.digits}
            onChange={(event) => onChange({ ...config, digits: Number(event.target.value) })}
            className={`${inputClass} bg-white`}>
            <option value={3}>3 หลัก (เช่น 001)</option>
            <option value={4}>4 หลัก (เช่น 0001)</option>
            <option value={5}>5 หลัก (เช่น 00001)</option>
            <option value={6}>6 หลัก (เช่น 000001)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">เลขเริ่มต้น (Start Number)</label>
          <input type="number" min={1} required value={config.startNumber}
            onChange={(event) => onChange({ ...config, startNumber: Math.max(1, Number(event.target.value)) })}
            className={inputClass} />
        </div>
        <div className="flex items-end pb-2.5">
          <label className="flex items-center text-sm text-gray-700 cursor-pointer select-none">
            <input type="checkbox" checked={config.useDate}
              onChange={(event) => onChange({ ...config, useDate: event.target.checked })}
              className="h-4 w-4 accent-emerald-600 border-gray-300 rounded mr-2" />
            รวมปีและเดือน (YYYYMM)
          </label>
        </div>
      </div>
    </section>
  );
}

export default function DocumentNumberSettingsPage() {
  const [qtConfig, setQtConfig] = useState<DocConfig>({ prefix: "QT", useDate: true, digits: 4, startNumber: 1 });
  const [invConfig, setInvConfig] = useState<DocConfig>({ prefix: "INV", useDate: true, digits: 4, startNumber: 1 });
  const [reConfig, setReConfig] = useState<DocConfig>({ prefix: "RE", useDate: true, digits: 4, startNumber: 1 });
  const [customConfigs, setCustomConfigs] = useState<CustomDocConfig[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrefix, setNewPrefix] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const savedData = localStorage.getItem("me_docflow_document_numbers");
        if (!savedData) return;
        const parsed = JSON.parse(savedData);
        if (parsed.qt) setQtConfig(parsed.qt);
        if (parsed.inv) setInvConfig(parsed.inv);
        if (parsed.re) setReConfig(parsed.re);
        if (Array.isArray(parsed.custom)) setCustomConfigs(parsed.custom);
      } catch (error) {
        console.error("Error parsing document numbers settings", error);
      }
    });
  }, []);

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    localStorage.setItem("me_docflow_document_numbers", JSON.stringify({ qt: qtConfig, inv: invConfig, re: reConfig, custom: customConfigs }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const addCustomConfig = (event: React.FormEvent) => {
    event.preventDefault();
    const title = newTitle.trim();
    const prefix = newPrefix.trim().toUpperCase();
    if (!title || !prefix) return;
    setCustomConfigs((items) => [...items, {
      id: `custom-${Date.now()}`,
      title,
      description: newDescription.trim() || `กำหนดเลขรันสำหรับ${title}`,
      config: { prefix, useDate: true, digits: 4, startNumber: 1 },
    }]);
    setNewTitle("");
    setNewDescription("");
    setNewPrefix("");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">การตั้งค่าระบบ</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-sans">ตั้งค่าเลขรันเอกสาร</h1>
        <p className="text-sm text-gray-500">กำหนดคำขึ้นต้น รูปแบบวันที่ และลำดับเลขเอกสารสำหรับเอกสารแต่ละประเภท</p>
      </div>

      {isSaved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold">บันทึกรูปแบบเลขเอกสารสำเร็จ</p>
            <p className="text-xs text-emerald-700">เอกสารที่สร้างใหม่จะใช้รูปแบบเลขที่บันทึกไว้</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-emerald-700">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">รูปแบบเลขที่เอกสาร</h2>
              <p className="text-xs text-gray-500 mt-0.5">การเปลี่ยนแปลงจะมีผลกับเอกสารใหม่หลังจากบันทึกการตั้งค่า</p>
            </div>
          </div>
          <button type="button" onClick={() => setShowAddForm(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors">
            <Plus className="w-4 h-4" />
            เพิ่มหมวดหมู่เลขรัน
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          <DocumentConfigRow title="ใบเสนอราคา (Quotation)" description="กำหนดเลขรันสำหรับเอกสารใบเสนอราคา" config={qtConfig} onChange={setQtConfig} />
          <DocumentConfigRow title="ใบกำกับภาษี (Tax Invoice)" description="กำหนดเลขรันสำหรับเอกสารใบกำกับภาษีและใบเสร็จ" config={invConfig} onChange={setInvConfig} />
          <DocumentConfigRow title="ใบเสร็จรับเงิน (Receipt)" description="กำหนดเลขรันสำหรับเอกสารใบเสร็จรับเงิน" config={reConfig} onChange={setReConfig} />
          {customConfigs.map((item) => (
            <DocumentConfigRow
              key={item.id}
              title={item.title}
              description={item.description}
              config={item.config}
              onChange={(config) => setCustomConfigs((items) => items.map((entry) => entry.id === item.id ? { ...entry, config } : entry))}
              onDelete={() => setCustomConfigs((items) => items.filter((entry) => entry.id !== item.id))}
            />
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/40 flex justify-end">
          <button type="submit" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-colors">
            <Save className="w-4 h-4" />
            บันทึกการตั้งค่าเลขเอกสาร
          </button>
        </div>
      </form>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm">
          <form onSubmit={addCustomConfig} className="w-full max-w-lg bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">เพิ่มหมวดหมู่เลขรันเอกสาร</h2>
                <p className="text-xs text-gray-500 mt-0.5">สร้างรูปแบบเลขที่สำหรับเอกสารประเภทอื่น</p>
              </div>
              <button type="button" onClick={() => setShowAddForm(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">ชื่อหมวดหมู่ <span className="text-red-500">*</span></label>
                <input required value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="เช่น ใบส่งสินค้า" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">คำขึ้นต้น (Prefix) <span className="text-red-500">*</span></label>
                <input required value={newPrefix} onChange={(event) => setNewPrefix(event.target.value)} placeholder="เช่น DN" maxLength={12} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">คำอธิบาย</label>
                <textarea value={newDescription} onChange={(event) => setNewDescription(event.target.value)} rows={3} placeholder="อธิบายการใช้งานเลขรันหมวดหมู่นี้" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 bg-white rounded-lg hover:bg-gray-50">ยกเลิก</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">เพิ่มหมวดหมู่</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
