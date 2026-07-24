"use client";

import { useState, useEffect } from "react";
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
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Sidebar() {
  const pathname = usePathname();
  const [activeCompanyName, setActiveCompanyName] = useState("บริษัท สยาม รีเทล จำกัด (มหาชน)");
  const { t } = useLanguage();

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
        } catch (e) {}
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
    setExpanded(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-screen flex flex-col font-sans transition-colors">
      {/* Logo Area */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 transition-colors">
        <div className="bg-emerald-500 p-2 rounded-lg text-white">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-800 dark:text-white leading-tight truncate max-w-[130px]" title={activeCompanyName}>{activeCompanyName}</h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{t.common.companyWorkspace}</p>
        </div>
        <div className="ml-auto text-gray-400 cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
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
              pathname === '/dashboard' || pathname === '/' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <LayoutDashboard size={20} className={pathname === '/dashboard' || pathname === '/' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'} />
            <span className="text-sm">{t.sidebar.dashboard}</span>
          </Link>

          {/* Documents */}
          <div className="pt-1">
            <button 
              onClick={() => toggleMenu('documents')}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-gray-400" />
                <span className="text-sm font-medium">{t.sidebar.documents}</span>
              </div>
              {expanded.documents ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </button>
            {expanded.documents && (
              <div className="pl-11 pr-3 py-1 space-y-1">
                <Link href="/documents" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.allDocuments}</Link>
                <Link href="/documents/create" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.createDocument}</Link>
                <Link href="/documents/pending" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.pendingApproval}</Link>
              </div>
            )}
          </div>

          {/* Template */}
          <div className="pt-1">
            <button 
              onClick={() => toggleMenu('template')}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <LayoutTemplate size={20} className="text-gray-400" />
                <span className="text-sm font-medium">{t.sidebar.template}</span>
              </div>
              {expanded.template ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </button>
            {expanded.template && (
              <div className="pl-11 pr-3 py-1 space-y-1">
                <Link href="/templates" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.allTemplates}</Link>
                <Link href="/templates/create" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.createTemplate}</Link>
                <Link href="/templates/designer" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.documentDesigner}</Link>
              </div>
            )}
          </div>

          {/* Company Data */}
          <div className="pt-1">
            <button 
              onClick={() => toggleMenu('company')}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building2 size={20} className="text-gray-400" />
                <span className="text-sm font-medium">{t.sidebar.companyData}</span>
              </div>
              {expanded.company ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </button>
            {expanded.company && (
              <div className="pl-11 pr-3 py-1 space-y-1">
                <Link href="/organizations" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.customersVendors}</Link>
                <Link href="/employees" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.employees}</Link>
                <Link href="/departments" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.departments}</Link>
              </div>
            )}
          </div>

          {/* Approval System */}
          <div className="pt-1">
            <button 
              onClick={() => toggleMenu('approval')}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="text-sm font-medium">{t.sidebar.approvalSystem}</span>
              </div>
              {expanded.approval ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </button>
          </div>

          {/* Reports */}
          <div className="pt-1">
            <Link 
              href="/reports"
              className="flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <PieChart size={20} className="text-gray-400" />
              <span className="text-sm font-medium">{t.sidebar.reports}</span>
            </Link>
          </div>

          {/* Settings */}
          <div className="pt-1">
            <button 
              onClick={() => toggleMenu('settings')}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings size={20} className="text-gray-400" />
                <span className="text-sm font-medium">{t.sidebar.settings}</span>
              </div>
              {expanded.settings ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </button>
            {expanded.settings && (
              <div className="pl-11 pr-3 py-1 space-y-1">
                <Link href="/settings/company" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.companySettings}</Link>
                <Link href="/settings/users" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.users}</Link>
                <Link href="/settings/documents" className="block px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">{t.sidebar.documentNumbers}</Link>
              </div>
            )}
          </div>
        </nav>
      </div>
      
      {/* Footer hint */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-start gap-2 transition-colors">
        <div className="w-6 h-6 rounded-full bg-gray-800 dark:bg-gray-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">N</div>
        <p className="text-[10px] text-gray-400 leading-tight">{t.sidebar.footerHint}</p>
      </div>
    </aside>
  );
}
