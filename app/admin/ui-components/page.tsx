"use client";

import { useState } from "react";
import { 
  Palette, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Save, 
  Trash2, 
  Edit2, 
  Search, 
  ChevronRight,
  Loader2,
  Lock,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

export default function AdminUiComponentsPage() {
  const [toggleVal, setToggleVal] = useState(true);
  const [inputText, setInputText] = useState("");
  const [selectedOpt, setSelectedOpt] = useState("Standard");

  return (
    <div className="space-y-8 font-light">
      <div>
        <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">System Style Guide</p>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 font-serif">UI Components Playground</h1>
        <p className="text-sm text-slate-550">คลังพรีวิวชิ้นส่วนหน้าจอแอดมินสำหรับนักพัฒนาและผู้ตรวจสอบความเรียบร้อยของหน้าจอคู่มือแบรนด์</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buttons Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="font-bold text-sm text-slate-900 border-b border-gray-150 pb-2 flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-500" />
            1. Buttons (ปุ่มสั่งงาน)
          </h2>
          <div className="flex flex-wrap gap-3">
            <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/10">
              Primary Amber
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer">
              Secondary Slate
            </button>
            <button className="bg-emerald-650 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer">
              Success Green
            </button>
            <button className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer">
              Danger Light Red
            </button>
            <button className="border border-gray-300 hover:bg-gray-50 text-slate-700 px-4 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer">
              Outline Border
            </button>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button className="flex items-center gap-1.5 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold rounded-xl cursor-pointer">
              <Save className="w-3.5 h-3.5" />
              บันทึกข้อมูล
            </button>
            <button className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 text-xs font-bold rounded-xl cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" />
              ลบรายการ
            </button>
            <button className="flex items-center gap-1.5 border border-gray-300 hover:border-gray-100 px-3 py-2 text-xs font-bold rounded-xl cursor-pointer text-slate-650">
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              แก้ไข
            </button>
            <button className="flex items-center gap-1.5 bg-gray-100 text-slate-400 px-4 py-2 text-xs font-medium rounded-xl cursor-not-allowed" disabled>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
              กำลังโหลด...
            </button>
          </div>
        </div>

        {/* Badges Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="font-bold text-sm text-slate-900 border-b border-gray-150 pb-2 flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-500" />
            2. Badges & Labels (ป้ายสถานะ)
          </h2>
          <div className="flex flex-wrap gap-3">
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold">
              ● Verified (ตรวจสอบแล้ว)
            </span>
            <span className="bg-red-50 text-red-655 border border-red-100 px-3 py-1 rounded-full text-[10px] font-bold">
              ● Blocked (ระงับการเข้าใช้)
            </span>
            <span className="bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-full text-[10px] font-bold">
              ● Pending (รออนุมัติ)
            </span>
            <span className="bg-gray-100 text-slate-500 border border-gray-200 px-3 py-1 rounded-full text-[10px] font-medium">
              ● Inactive (ปิดใช้)
            </span>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <span className="bg-gray-100 text-amber-700 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
              QT FORMAT
            </span>
            <span className="bg-gray-100 text-slate-655 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
              ACC MODULE
            </span>
            <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-sans font-bold">
              NEW FEATURE
            </span>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 col-span-1 md:col-span-2 shadow-sm">
          <h2 className="font-bold text-sm text-slate-900 border-b border-gray-150 pb-2 flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-500" />
            3. Alert Notifications (แถบข้อความแจ้งเตือน)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 px-4 py-3.5 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900">บันทึกข้อมูลเรียบร้อยแล้ว!</p>
                <p className="text-[11px] text-emerald-600 mt-0.5 font-light font-sans">ระบบทำการซิงค์โครงสร้างข้อมูลลงหน่วยความจำภายในสำเร็จ</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3.5 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900">การเข้าถึงถูกจำกัดสิทธิ์</p>
                <p className="text-[11px] text-red-500 mt-0.5 font-light font-sans">เฉพาะเจ้าของบริษัทตัวจริงเท่านั้นที่สามารถเขียนหรือลบข้อมูลในหน้านี้</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3.5 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900">คำเตือนสิทธิ์การใช้งาน</p>
                <p className="text-[11px] text-amber-600 mt-0.5 font-light font-sans">บริษัทนี้ยังไม่ได้ผ่านการ Verify ตรวจสอบโปรไฟล์ ยื่นหลักฐานนิติบุคคล</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-gray-200 text-slate-700 px-4 py-3.5 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900">ระบบตรวจสอบประวัติความปลอดภัย</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-light font-sans">ทุก ๆ กิจกรรมของสิทธิ์แอดมินจะถูกบันทึกประวัติการกระทำโดยไม่สามารถปิดใช้งานได้</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Inputs & Controls */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 col-span-1 md:col-span-2 shadow-sm">
          <h2 className="font-bold text-sm text-slate-900 border-b border-gray-150 pb-2 flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-500" />
            4. Inputs & Switches (ส่วนควบคุมฟอร์มข้อมูล)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase">Text input (ช่องกรอกข้อความ)</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="ค้นหารายการ..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-xs text-gray-950 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase">Select Dropdown (เมนูเลือกตัวเลือก)</label>
              <select
                value={selectedOpt}
                onChange={(e) => setSelectedOpt(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-3 text-xs text-gray-950 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-sans"
              >
                <option value="Standard">Standard SME</option>
                <option value="Custom">Custom Enterprise</option>
                <option value="Trial">Free Trial Plan</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase">Toggle Switch (สวิตช์เปิด/ปิด)</label>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setToggleVal(!toggleVal)}
                  className="text-slate-450 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {toggleVal ? <ToggleRight className="w-9 h-9 text-amber-550" /> : <ToggleLeft className="w-9 h-9 text-slate-400" />}
                </button>
                <span className="text-xs text-slate-500 font-medium font-sans">
                  {toggleVal ? "สถานะ: เปิดใช้งานจริง" : "สถานะ: ปิดการทำงาน"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
