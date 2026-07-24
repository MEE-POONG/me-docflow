"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FileText, 
  LayoutTemplate, 
  Building2, 
  Settings, 
  PieChart, 
  ChevronDown,
  ChevronRight
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  
  // State for expanded menus
  const [expanded, setExpanded] = useState({
    documents: true,
    template: true,
    company: true,
    approval: false,
    settings: false,
  });

  const toggleMenu = (menu: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col font-sans">
      {/* Logo Area */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
        <div className="bg-emerald-500 p-2 rounded-lg text-white">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-800 leading-tight">Siam Retail Co., Ltd.</h2>
          <p className="text-[11px] text-gray-500">Company Workspace</p>
        </div>
        <div className="ml-auto text-gray-400 cursor-pointer p-1 hover:bg-gray-100 rounded">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {/* Dashboard */}
          <Link 
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/dashboard' || pathname === '/' ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard size={20} className={pathname === '/dashboard' || pathname === '/' ? 'text-emerald-600' : 'text-gray-400'} />
            <span className="text-sm">Dashboard</span>
          </Link>

          {/* Documents */}
          <div className="pt-1">
            <button 
              onClick={() => toggleMenu('documents')}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-gray-400" />
                <span className="text-sm font-medium">เอกสาร</span>
              </div>
              {expanded.documents ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </button>
            {expanded.documents && (
              <div className="pl-11 pr-3 py-1 space-y-1">
                <Link href="/documents" className="block px-3 py-2 text-[13px] text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">เอกสารทั้งหมด</Link>
                <Link href="/documents/create" className="block px-3 py-2 text-[13px] text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">สร้างเอกสาร</Link>
                <Link href="/documents/pending" className="block px-3 py-2 text-[13px] text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">รออนุมัติ</Link>
              </div>
            )}
          </div>

          {/* Template */}
          <div className="pt-1">
            <button 
              onClick={() => toggleMenu('template')}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <LayoutTemplate size={20} className="text-gray-400" />
                <span className="text-sm font-medium">Template</span>
              </div>
              {expanded.template ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </button>
            {expanded.template && (
              <div className="pl-11 pr-3 py-1 space-y-1">
                <Link href="/templates" className="block px-3 py-2 text-[13px] text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">Template ทั้งหมด</Link>
                <Link href="/templates/create" className="block px-3 py-2 text-[13px] text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">สร้าง Template</Link>
                <Link href="/templates/designer" className="block px-3 py-2 text-[13px] text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">Document Designer</Link>
              </div>
            )}
          </div>

          {/* Company Data */}
          <div className="pt-1">
            <button 
              onClick={() => toggleMenu('company')}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building2 size={20} className="text-gray-400" />
                <span className="text-sm font-medium">ข้อมูลบริษัท</span>
              </div>
              {expanded.company ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </button>
            {expanded.company && (
              <div className="pl-11 pr-3 py-1 space-y-1">
                <Link href="/organizations" className="block px-3 py-2 text-[13px] text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">ลูกค้า / คู่ค้า</Link>
                <Link href="/users" className="block px-3 py-2 text-[13px] text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">พนักงาน</Link>
                <Link href="/departments" className="block px-3 py-2 text-[13px] text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">แผนก</Link>
              </div>
            )}
          </div>

          {/* Approval System */}
          <div className="pt-1">
            <button 
              onClick={() => toggleMenu('approval')}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="text-sm font-medium">ระบบอนุมัติ</span>
              </div>
              {expanded.approval ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </button>
          </div>

          {/* Reports */}
          <div className="pt-1">
            <Link 
              href="/reports"
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <PieChart size={20} className="text-gray-400" />
              <span className="text-sm font-medium">รายงาน</span>
            </Link>
          </div>

          {/* Settings */}
          <div className="pt-1">
            <button 
              onClick={() => toggleMenu('settings')}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings size={20} className="text-gray-400" />
                <span className="text-sm font-medium">ตั้งค่า</span>
              </div>
              {expanded.settings ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </button>
          </div>
        </nav>
      </div>
      
      {/* Footer hint */}
      <div className="p-4 border-t border-gray-100 flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-white text-[10px] font-bold shrink-0">N</div>
        <p className="text-[10px] text-gray-400 leading-tight">Your data is scoped by companyId. Users can manage their own company workspace.</p>
      </div>
    </aside>
  );
}
