"use client";

import { useState, useEffect } from "react";
import { Hash, Save, CheckCircle2, Eye, HelpCircle } from "lucide-react";

interface DocConfig {
  prefix: string;
  useDate: boolean;
  digits: number;
  startNumber: number;
}

export default function DocumentNumberSettingsPage() {
  const [qtConfig, setQtConfig] = useState<DocConfig>({ prefix: "QT", useDate: true, digits: 4, startNumber: 1 });
  const [invConfig, setInvConfig] = useState<DocConfig>({ prefix: "INV", useDate: true, digits: 4, startNumber: 1 });
  const [reConfig, setReConfig] = useState<DocConfig>({ prefix: "RE", useDate: true, digits: 4, startNumber: 1 });
  const [isSaved, setIsSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("me_docflow_document_numbers");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.qt) setQtConfig(parsed.qt);
        if (parsed.inv) setInvConfig(parsed.inv);
        if (parsed.re) setReConfig(parsed.re);
      } catch (e) {
        console.error("Error parsing document numbers settings", e);
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      qt: qtConfig,
      inv: invConfig,
      re: reConfig,
    };
    localStorage.setItem("me_docflow_document_numbers", JSON.stringify(dataToSave));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Helper to generate preview
  const generatePreview = (config: DocConfig) => {
    const dateStr = config.useDate ? "202607" : "";
    const separator = config.useDate ? "-" : "";
    const numStr = String(config.startNumber).padStart(config.digits, "0");
    return `${config.prefix}${separator}${dateStr}${separator}${numStr}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">การตั้งค่าระบบ</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">ตั้งค่าเลขรันเอกสาร</h1>
        <p className="text-sm text-gray-500">กำหนดรูปแบบคำขึ้นต้น (Prefix) ปีเดือน และจำนวนหลักของเลขเอกสารสำคัญแต่ละประเภท</p>
      </div>

      {/* Save Success Banner */}
      {isSaved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold">บันทึกรูปแบบเลขเอกสารสำเร็จ!</p>
            <p className="text-xs text-emerald-600">การออกเอกสารใหม่จะใช้รูปแบบรันเลขที่ท่านบันทึกนี้</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Quotation (QT) Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">ใบเสนอราคา (Quotation)</h3>
                <p className="text-xs text-gray-500">ตั้งค่าการรันเลขเอกสารใบเสนอราคา</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono font-bold">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              Preview: {generatePreview(qtConfig)}
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">คำขึ้นต้น (Prefix)</label>
              <input
                type="text"
                required
                value={qtConfig.prefix}
                onChange={(e) => setQtConfig({ ...qtConfig, prefix: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">จำนวนหลักของเลขรันนิ่ง</label>
              <select
                value={qtConfig.digits}
                onChange={(e) => setQtConfig({ ...qtConfig, digits: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
              >
                <option value={3}>3 หลัก (เช่น 001)</option>
                <option value={4}>4 หลัก (เช่น 0001)</option>
                <option value={5}>5 หลัก (เช่น 00001)</option>
                <option value={6}>6 หลัก (เช่น 000001)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">เลขเริ่มต้น (Start Number)</label>
              <input
                type="number"
                min={1}
                required
                value={qtConfig.startNumber}
                onChange={(e) => setQtConfig({ ...qtConfig, startNumber: Math.max(1, Number(e.target.value)) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={qtConfig.useDate}
                  onChange={(e) => setQtConfig({ ...qtConfig, useDate: e.target.checked })}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mr-2"
                />
                พ่วง ปี/เดือน (YYYYMM)
              </label>
            </div>
          </div>
        </div>

        {/* Invoice (INV) Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">ใบกำกับภาษี (Tax Invoice)</h3>
                <p className="text-xs text-gray-500">ตั้งค่าการรันเลขเอกสารใบกำกับภาษี/ใบเสร็จ</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono font-bold">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              Preview: {generatePreview(invConfig)}
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">คำขึ้นต้น (Prefix)</label>
              <input
                type="text"
                required
                value={invConfig.prefix}
                onChange={(e) => setInvConfig({ ...invConfig, prefix: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">จำนวนหลักของเลขรันนิ่ง</label>
              <select
                value={invConfig.digits}
                onChange={(e) => setInvConfig({ ...invConfig, digits: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
              >
                <option value={3}>3 หลัก (เช่น 001)</option>
                <option value={4}>4 หลัก (เช่น 0001)</option>
                <option value={5}>5 หลัก (เช่น 00001)</option>
                <option value={6}>6 หลัก (เช่น 000001)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">เลขเริ่มต้น (Start Number)</label>
              <input
                type="number"
                min={1}
                required
                value={invConfig.startNumber}
                onChange={(e) => setInvConfig({ ...invConfig, startNumber: Math.max(1, Number(e.target.value)) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={invConfig.useDate}
                  onChange={(e) => setInvConfig({ ...invConfig, useDate: e.target.checked })}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mr-2"
                />
                พ่วง ปี/เดือน (YYYYMM)
              </label>
            </div>
          </div>
        </div>

        {/* Receipt (RE) Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">ใบเสร็จรับเงิน (Receipt)</h3>
                <p className="text-xs text-gray-500">ตั้งค่าการรันเลขเอกสารใบเสร็จรับเงิน</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono font-bold">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              Preview: {generatePreview(reConfig)}
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">คำขึ้นต้น (Prefix)</label>
              <input
                type="text"
                required
                value={reConfig.prefix}
                onChange={(e) => setReConfig({ ...reConfig, prefix: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">จำนวนหลักของเลขรันนิ่ง</label>
              <select
                value={reConfig.digits}
                onChange={(e) => setReConfig({ ...reConfig, digits: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
              >
                <option value={3}>3 หลัก (เช่น 001)</option>
                <option value={4}>4 หลัก (เช่น 0001)</option>
                <option value={5}>5 หลัก (เช่น 00001)</option>
                <option value={6}>6 หลัก (เช่น 000001)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">เลขเริ่มต้น (Start Number)</label>
              <input
                type="number"
                min={1}
                required
                value={reConfig.startNumber}
                onChange={(e) => setReConfig({ ...reConfig, startNumber: Math.max(1, Number(e.target.value)) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={reConfig.useDate}
                  onChange={(e) => setReConfig({ ...reConfig, useDate: e.target.checked })}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mr-2"
                />
                พ่วง ปี/เดือน (YYYYMM)
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            บันทึกการตั้งค่าเลขเอกสาร
          </button>
        </div>

      </form>
    </div>
  );
}
