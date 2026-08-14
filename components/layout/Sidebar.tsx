"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  LayoutDashboard,
  FileText,
  LayoutTemplate,
  Building2,
  Settings,
  PieChart,
  ChevronDown,
  ChevronRight,
  LogOut,
  Key,
  Menu
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSidebar } from "./SidebarContext";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeCompanyName, setActiveCompanyName] = useState("บริษัท สยาม รีเทล จำกัด (มหาชน)");
  const { t } = useLanguage();
  const { isOpen, close, toggle } = useSidebar();

  useEffect(() => {
    const updateActiveCompany = () => {
      const saved = localStorage.getItem("me_docflow_companies");
      if (saved) {
        try {
          const list = JSON.parse(saved);
          const active = list.find((c: any) => c.isActive);
          if (active) {
            setActiveCompanyName(active.companyName);
          }
        } catch (e) { }
      }
    };

    updateActiveCompany();
    window.addEventListener("activeCompanyChanged", updateActiveCompany);
    return () => window.removeEventListener("activeCompanyChanged", updateActiveCompany);
  }, []);

  // State for expanded menus
  const [expanded, setExpanded] = useState({
    documents: true,
    template: true,
    company: true,
    approval: false,
    settings: false,
  });

  const toggleMenu = (menu: keyof typeof expanded) => {
    if (!isOpen) {
      toggle();
    }
    setExpanded(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={close}
        />
      )}

      <aside className={`sticky top-0 left-0 h-screen z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col font-sans transition-all duration-300 ease-in-out ${isOpen ? "w-64" : "w-20"} shrink-0`}>
        {/* Logo Area */}
        <div className={`p-4 border-b border-gray-100 dark:border-gray-800 flex items-center ${isOpen ? 'justify-between' : 'justify-center'} transition-colors h-[73px]`}>
          {isOpen && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-emerald-500 p-2 rounded-lg text-white shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-bold text-gray-800 dark:text-white leading-tight truncate max-w-[130px]" title={activeCompanyName}>{activeCompanyName}</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{t.common.companyWorkspace}</p>
              </div>
            </div>
          )}
          <div onClick={toggle} className="text-gray-500 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0" title={isOpen ? "ยุบเมนู" : "ขยายเมนู"}>
            <Menu className="w-5 h-5" />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
          <nav className="space-y-1 px-3">
            {/* Dashboard */}
            <Link
              href="/dashboard"
              className={`flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg transition-colors ${pathname === '/dashboard' || pathname === '/' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              title={!isOpen ? t.sidebar.dashboard : undefined}
            >
              <LayoutDashboard size={20} className={`shrink-0 ${pathname === '/dashboard' || pathname === '/' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
              {isOpen && <span className="text-sm truncate">{t.sidebar.dashboard}</span>}
            </Link>

            {/* Documents */}
            <div className="pt-1">
              <button
                onClick={() => toggleMenu('documents')}
                className={`w-full flex items-center ${isOpen ? 'justify-between px-3' : 'justify-center px-0'} py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors`}
                title={!isOpen ? t.sidebar.documents : undefined}
              >
                <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
                  <FileText size={20} className="text-gray-400 shrink-0" />
                  {isOpen && <span className="text-sm font-medium truncate">{t.sidebar.documents}</span>}
                </div>
                {isOpen && (
                  expanded.documents ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />
                )}
              </button>
              {isOpen && expanded.documents && (
                <div className="pl-11 pr-3 py-1 space-y-1">
                  <Link href="/documents" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.allDocuments}</Link>
                  <Link href="/documents/pending" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.pendingApproval}</Link>
                  <Link href="/categories" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">หมวดหมู่เอกสาร</Link>
                  <Link href="/types" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">ประเภทเอกสาร</Link>
                  <Link href="/doc-format" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">แบบฟอร์มเอกสาร</Link>
                </div>
              )}
            </div>

            {/* Template */}

            {/* Company Data */}
            <div className="pt-1">
              <button
                onClick={() => toggleMenu('company')}
                className={`w-full flex items-center ${isOpen ? 'justify-between px-3' : 'justify-center px-0'} py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors`}
                title={!isOpen ? t.sidebar.companyData : undefined}
              >
                <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
                  <Building2 size={20} className="text-gray-400 shrink-0" />
                  {isOpen && <span className="text-sm font-medium truncate">{t.sidebar.companyData}</span>}
                </div>
                {isOpen && (
                  expanded.company ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />
                )}
              </button>
              {isOpen && expanded.company && (
                <div className="pl-11 pr-3 py-1 space-y-1">
                  <Link href="/organizations" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.customersVendors}</Link>
                  <Link href="/employees" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.employees}</Link>
                  <Link href="/departments" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.departments}</Link>
                  <Link href="/business-types" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">ประเภทธุรกิจ</Link>
                </div>
              )}
            </div>

            {/* Approval System */}
            <div className="pt-1">
              <button
                onClick={() => toggleMenu('approval')}
                className={`w-full flex items-center ${isOpen ? 'justify-between px-3' : 'justify-center px-0'} py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors`}
                title={!isOpen ? t.sidebar.approvalSystem : undefined}
              >
                <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {isOpen && <span className="text-sm font-medium truncate">{t.sidebar.approvalSystem}</span>}
                </div>
                {isOpen && (
                  expanded.approval ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />
                )}
              </button>
            </div>

            {/* Reports */}
            <div className="pt-1">
              <Link
                href="/reports"
                className={`flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors`}
                title={!isOpen ? t.sidebar.reports : undefined}
              >
                <PieChart size={20} className="text-gray-400 shrink-0" />
                {isOpen && <span className="text-sm font-medium truncate">{t.sidebar.reports}</span>}
              </Link>
            </div>

            {/* Settings */}
            <div className="pt-1">
              <button
                onClick={() => toggleMenu('settings')}
                className={`w-full flex items-center ${isOpen ? 'justify-between px-3' : 'justify-center px-0'} py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors`}
                title={!isOpen ? t.sidebar.settings : undefined}
              >
                <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
                  <Settings size={20} className="text-gray-400 shrink-0" />
                  {isOpen && <span className="text-sm font-medium truncate">{t.sidebar.settings}</span>}
                </div>
                {isOpen && (
                  expanded.settings ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />
                )}
              </button>
              {isOpen && expanded.settings && (
                <div className="pl-11 pr-3 py-1 space-y-1">
                  <Link href="/settings/company" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.companySettings}</Link>
                  <Link href="/settings/users" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.users}</Link>
                  <Link href="/settings/documents" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.documentNumbers}</Link>
                  <Link href="/settings/templates" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">ตั้งค่าเทมเพลตกลาง</Link>
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className="pt-1">
              <Link
                href="/change-password"
                className={`flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg transition-colors ${pathname === '/change-password' ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                title={!isOpen ? 'เปลี่ยนรหัสผ่าน' : undefined}
              >
                <Key size={20} className={`shrink-0 ${pathname === '/change-password' ? 'text-emerald-600' : 'text-gray-400'}`} />
                {isOpen && <span className="text-sm font-medium truncate">เปลี่ยนรหัสผ่าน</span>}
              </Link>
            </div>
          </nav>
        </div>

        {/* Footer hint */}
        <div className={`p-4 border-t border-gray-100 dark:border-gray-800 flex items-start ${isOpen ? 'gap-2' : 'justify-center'} transition-colors`}>
          <div className="w-6 h-6 rounded-full bg-gray-800 dark:bg-gray-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">N</div>
          {isOpen && <p className="text-[10px] text-gray-400 leading-normal">{t.sidebar.footerHint}</p>}
        </div>
      </aside>
    </>
  );
}
