"use client";

import { useEffect, useState } from "react";
import { Cpu, HardDrive, ShieldCheck, ShieldAlert, Save, CheckCircle2 } from "lucide-react";

interface SystemSettings {
  systemName: string;
  systemVersion: string;
  maxUploadSize: string;
  allowedExtensions: string[];
  maintenanceMode: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    systemName: "ME-DocFlow (Central Console)",
    systemVersion: "v1.2.4",
    maxUploadSize: "20MB",
    allowedExtensions: ["pdf", "jpg", "png", "xlsx"],
    maintenanceMode: false,
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("me_docflow_system_settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing settings", e);
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("me_docflow_system_settings", JSON.stringify(settings));

    // Seed audit log
    const logs = localStorage.getItem("me_docflow_audit_logs");
    const currentLogs = logs ? JSON.parse(logs) : [];
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      user: "System Admin (admin)",
      action: `อัปเดตการตั้งค่าระบบส่วนกลาง (ชื่อระบบ: ${settings.systemName}, โหมดปรับปรุง: ${settings.maintenanceMode ? "เปิด" : "ปิด"}, ขนาดไฟล์: ${settings.maxUploadSize})`,
      type: "security"
    };
    localStorage.setItem("me_docflow_audit_logs", JSON.stringify([newLog, ...currentLogs]));

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleToggleExtension = (ext: string) => {
    const current = settings.allowedExtensions;
    const next = current.includes(ext) 
      ? current.filter(x => x !== ext) 
      : [...current, ext];
    setSettings({ ...settings, allowedExtensions: next });
  };

  return (
    <div className="space-y-6 font-light">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">System Configurations</p>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 font-serif">ตั้งค่าระบบส่วนกลาง</h1>
        <p className="text-sm text-slate-500">ควบคุมและกำหนดนโยบายความปลอดภัย ลิมิตขนาดการจัดเก็บข้อมูล และสลับสถานะการปิดปรับปรุงแอปพลิเคชัน</p>
      </div>

      {/* Save Success Banner */}
      {isSaved && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">บันทึกการตั้งค่าระบบส่วนกลางสำเร็จ!</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Basic Config */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-150 bg-gray-50/50 flex items-center gap-3">
            <Cpu className="w-5 h-5 text-amber-550" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">ข้อมูลพื้นฐานของซอฟต์แวร์</h3>
              <p className="text-[10px] text-slate-450">จัดการข้อมูลและเวอร์ชันที่แสดงบนหน้าระบบหลัก</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-sans">ชื่อระบบการจัดทำเอกสาร</label>
              <input
                type="text"
                required
                value={settings.systemName}
                onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-950 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-sans">รหัสเวอร์ชันซอฟต์แวร์ (Version)</label>
              <input
                type="text"
                required
                value={settings.systemVersion}
                onChange={(e) => setSettings({ ...settings, systemVersion: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-950 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Storage & Limits */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-150 bg-gray-50/50 flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-amber-550" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">ลิมิตขนาดและอัปโหลดไฟล์</h3>
              <p className="text-[10px] text-slate-450">จำกัดขนาดไฟล์เอกสารแนบและตรวจสอบประเภทไฟล์ที่ยอมรับ</p>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-sans">ขนาดไฟล์อัปโหลดสูงสุดต่อฉบับ</label>
                <select
                  value={settings.maxUploadSize}
                  onChange={(e) => setSettings({ ...settings, maxUploadSize: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-950 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans cursor-pointer"
                >
                  <option value="10MB">10 เมกะไบต์ (10MB)</option>
                  <option value="20MB">20 เมกะไบต์ (20MB)</option>
                  <option value="50MB">50 เมกะไบต์ (50MB)</option>
                  <option value="100MB">100 เมกะไบต์ (100MB)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 font-sans">ประเภทไฟล์แนบที่ยินยอม</label>
                <div className="flex flex-wrap gap-4 text-xs mt-1.5 font-sans">
                  {["pdf", "jpg", "png", "xml", "xlsx", "docx"].map((ext) => {
                    const isChecked = settings.allowedExtensions.includes(ext);
                    return (
                      <label key={ext} className="flex items-center text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleExtension(ext)}
                          className="h-4 w-4 text-amber-550 focus:ring-amber-550 border-gray-300 bg-white rounded mr-2"
                        />
                        {ext.toUpperCase()}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance & Security */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-150 bg-gray-50/50 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-550" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">โหมดซ่อมบำรุงและความปลอดภัยระบบ</h3>
              <p className="text-[10px] text-slate-450">เปิดระบบปิดเซิร์ฟเวอร์ชั่วคราวสำหรับการอัปเดตระบบฐานข้อมูล</p>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  เปิดการทำงานโหมดซ่อมบำรุง (Maintenance Mode)
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5 font-sans">
                  เมื่อเปิดใช้งาน ผู้ใช้ปกติจะไม่สามารถเข้าสู่ระบบหรือสร้างเอกสารได้ ยกเว้นบัญชีผู้ดูแลระบบ
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    settings.maintenanceMode ? "bg-amber-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      settings.maintenanceMode ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-6 rounded-xl shadow-md transition-colors cursor-pointer text-xs font-sans"
          >
            <Save className="w-4 h-4" />
            บันทึกการตั้งค่าระบบแอดมิน
          </button>
        </div>

      </form>
    </div>
  );
}
