"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Building2, 
  Users, 
  List, 
  Settings, 
  LogOut, 
  ExternalLink,
  Menu,
  X,
  Package,
  FileText,
  ChevronDown,
  ChevronRight,
  Palette
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Sidebar collapsible dropdowns
  const [expanded, setExpanded] = useState({
    company: true,
    documents: true,
  });

  const toggleMenu = (menu: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Check login session on mount
  useEffect(() => {
    // Avoid checking logic on the login page itself
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }

    const isLoggedIn = localStorage.getItem("me_docflow_admin_logged_in");
    if (isLoggedIn !== "true") {
      router.push("/admin/login");
    } else {
      setLoading(false);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("me_docflow_admin_logged_in");
    router.push("/admin/login");
  };

  // If on login page, just render the child component without the admin layout wrapper
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans text-slate-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
        <p className="text-sm text-slate-500">กำลังเข้าสู่ระบบควบคุมหลังบ้าน...</p>
      </div>
    );
  }

  const renderNavLinks = (isMobile: boolean, closeMobileMenu?: () => void) => {
    const handleLinkClick = () => {
      if (closeMobileMenu) closeMobileMenu();
    };

    return (
      <>
        {/* Dashboard */}
        <Link
          href="/admin/dashboard"
          onClick={handleLinkClick}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            pathname === "/admin/dashboard"
              ? "bg-amber-50 text-amber-700 font-bold border-l-4 border-amber-500 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-xs font-semibold">Dashboard</span>
        </Link>

        {/* บริษัท (Company) Group */}
        <div className="pt-1">
          <button 
            onClick={() => toggleMenu('company')}
            className="w-full flex items-center justify-between px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Building2 size={18} />
              <span className="text-xs font-semibold">บริษัท</span>
            </div>
            {expanded.company ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expanded.company && (
            <div className="pl-9 pr-3 py-1 space-y-1 border-l border-gray-200 ml-5 mt-1 animate-in slide-in-from-top-1 duration-150">
              <Link 
                href="/admin/companies" 
                onClick={handleLinkClick}
                className={`block px-3 py-2 text-[11px] rounded-lg transition-colors ${
                  pathname === '/admin/companies' ? 'text-amber-700 font-bold bg-amber-50/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
                }`}
              >
                รายการบริษัท
              </Link>
              <Link 
                href="/admin/users" 
                onClick={handleLinkClick}
                className={`block px-3 py-2 text-[11px] rounded-lg transition-colors ${
                  pathname === '/admin/users' ? 'text-amber-700 font-bold bg-amber-50/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
                }`}
              >
                ผู้ใช้บริษัท
              </Link>
            </div>
          )}
        </div>

        {/* แพ็กเกจ (Package) */}
        <Link
          href="/admin/packages"
          onClick={handleLinkClick}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            pathname === "/admin/packages"
              ? "bg-amber-50 text-amber-700 font-bold border-l-4 border-amber-500 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Package size={18} />
          <span className="text-xs font-semibold">แพ็กเกจ</span>
        </Link>

        {/* เอกสาร (Documents) Group */}
        <div className="pt-1">
          <button 
            onClick={() => toggleMenu('documents')}
            className="w-full flex items-center justify-between px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} />
              <span className="text-xs font-semibold">เอกสาร</span>
            </div>
            {expanded.documents ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expanded.documents && (
            <div className="pl-9 pr-3 py-1 space-y-1 border-l border-gray-200 ml-5 mt-1 animate-in slide-in-from-top-1 duration-150">
              <Link 
                href="/admin/categories" 
                onClick={handleLinkClick}
                className={`block px-3 py-2 text-[11px] rounded-lg transition-colors ${
                  pathname === '/admin/categories' ? 'text-amber-700 font-bold bg-amber-50/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
                }`}
              >
                หมวดหมู่เอกสาร
              </Link>
              <Link 
                href="/admin/types" 
                onClick={handleLinkClick}
                className={`block px-3 py-2 text-[11px] rounded-lg transition-colors ${
                  pathname === '/admin/types' ? 'text-amber-700 font-bold bg-amber-50/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
                }`}
              >
                ประเภทเอกสาร
              </Link>
              <Link 
                href="/admin/templates" 
                onClick={handleLinkClick}
                className={`block px-3 py-2 text-[11px] rounded-lg transition-colors ${
                  pathname === '/admin/templates' ? 'text-amber-700 font-bold bg-amber-50/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
                }`}
              >
                Template กลาง
              </Link>
            </div>
          )}
        </div>

        {/* Audit Logs */}
        <Link
          href="/admin/logs"
          onClick={handleLinkClick}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            pathname === "/admin/logs"
              ? "bg-amber-50 text-amber-700 font-bold border-l-4 border-amber-500 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <List size={18} />
          <span className="text-xs font-semibold">Audit Logs</span>
        </Link>

        {/* UI Components */}
        <Link
          href="/admin/ui-components"
          onClick={handleLinkClick}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            pathname === "/admin/ui-components"
              ? "bg-amber-50 text-amber-700 font-bold border-l-4 border-amber-500 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Palette size={18} />
          <span className="text-xs font-semibold">UI Components</span>
        </Link>

        {/* ตั้งค่าระบบ */}
        <Link
          href="/admin/settings"
          onClick={handleLinkClick}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            pathname === "/admin/settings"
              ? "bg-amber-50 text-amber-700 font-bold border-l-4 border-amber-500 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Settings size={18} />
          <span className="text-xs font-semibold">ตั้งค่าระบบ</span>
        </Link>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 font-light">
      
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-gray-200 flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-xl text-slate-950 shadow-md">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 tracking-wider leading-tight">ADMIN PORTAL</h2>
            <p className="text-[10px] text-amber-600 font-semibold tracking-widest uppercase">Backend Control</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {renderNavLinks(false)}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-between w-full px-3 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition-all"
          >
            <span className="flex items-center gap-2">
              <ExternalLink size={14} />
              สลับไปฝั่งผู้ใช้งาน
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-red-650 hover:text-red-750 hover:bg-red-50 rounded-lg transition-all text-left cursor-pointer"
          >
            <LogOut size={14} />
            ออกจากระบบแอดมิน
          </button>
        </div>
      </aside>

      {/* ================= MOBILE SIDEBAR MOBILE OVERLAY ================= */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 md:hidden" onClick={() => setSidebarOpen(false)}>
          <aside 
            className="w-64 bg-white h-full border-r border-gray-200 flex flex-col animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 p-2 rounded-xl text-slate-950">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-800">ADMIN PORTAL</h2>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-slate-900">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
              {renderNavLinks(true, () => setSidebarOpen(false))}
            </nav>
            <div className="p-4 border-t border-gray-200 space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 w-full px-3 py-2.5 bg-slate-100 text-xs text-slate-600 rounded-lg border border-slate-200"
              >
                <ExternalLink size={14} />
                สลับไปฝั่งผู้ใช้งาน
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-red-650 hover:bg-red-50 rounded-lg text-left"
              >
                <LogOut size={14} />
                ออกจากระบบแอดมิน
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Navbar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg md:hidden transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-semibold text-slate-600">ระบบควบคุมส่วนกลางสำหรับผู้ดูแลระบบ</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-100">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                SA
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">Super Admin</p>
                <p className="text-[10px] text-slate-500 leading-none">admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
