"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
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
  Palette,
  Sun,
  Moon
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Sidebar collapsible dropdowns
  const [expanded, setExpanded] = useState({
    company: true,
    documents: true,
  });

  const toggleMenu = (menu: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans text-slate-800 dark:text-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
        <p className="text-sm text-slate-550 dark:text-slate-405">กำลังเข้าสู่ระบบควบคุมหลังบ้าน...</p>
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
              ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-550 font-bold border-l-4 border-amber-500 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-xs font-semibold">Dashboard</span>
        </Link>

        {/* บริษัท (Company) Group */}
        <div className="pt-1">
          <button 
            onClick={() => toggleMenu('company')}
            className="w-full flex items-center justify-between px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Building2 size={18} />
              <span className="text-xs font-semibold">บริษัท</span>
            </div>
            {expanded.company ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expanded.company && (
            <div className="pl-9 pr-3 py-1 space-y-1 border-l border-gray-200 dark:border-slate-800 ml-5 mt-1 animate-in slide-in-from-top-1 duration-150">
              <Link 
                href="/admin/companies" 
                onClick={handleLinkClick}
                className={`block px-3 py-2 text-[11px] rounded-lg transition-colors ${
                  pathname === '/admin/companies' 
                    ? 'text-amber-700 dark:text-amber-500 font-bold bg-amber-50/60 dark:bg-slate-800/50' 
                    : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-slate-850/50'
                }`}
              >
                รายการบริษัท
              </Link>
              <Link 
                href="/admin/users" 
                onClick={handleLinkClick}
                className={`block px-3 py-2 text-[11px] rounded-lg transition-colors ${
                  pathname === '/admin/users' 
                    ? 'text-amber-700 dark:text-amber-500 font-bold bg-amber-50/60 dark:bg-slate-800/50' 
                    : 'text-slate-555 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-slate-850/50'
                }`}
              >
                ผู้ใช้บริษัท
              </Link>
              <Link 
                href="/admin/business-types" 
                onClick={handleLinkClick}
                className={`block px-3 py-2 text-[11px] rounded-lg transition-colors ${
                  pathname === '/admin/business-types' 
                    ? 'text-amber-700 dark:text-amber-500 font-bold bg-amber-50/60 dark:bg-slate-800/50' 
                    : 'text-slate-555 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-slate-850/50'
                }`}
              >
                ประเภทธุรกิจ
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
              ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-550 font-bold border-l-4 border-amber-500 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
          }`}
        >
          <Package size={18} />
          <span className="text-xs font-semibold">แพ็กเกจ</span>
        </Link>

        {/* เอกสาร (Documents) Group */}
        <div className="pt-1">
          <button 
            onClick={() => toggleMenu('documents')}
            className="w-full flex items-center justify-between px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} />
              <span className="text-xs font-semibold">เอกสาร</span>
            </div>
            {expanded.documents ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expanded.documents && (
            <div className="pl-9 pr-3 py-1 space-y-1 border-l border-gray-200 dark:border-slate-800 ml-5 mt-1 animate-in slide-in-from-top-1 duration-150">
              <Link 
                href="/admin/categories" 
                onClick={handleLinkClick}
                className={`block px-3 py-2 text-[11px] rounded-lg transition-colors ${
                  pathname === '/admin/categories' 
                    ? 'text-amber-700 dark:text-amber-500 font-bold bg-amber-50/60 dark:bg-slate-800/50' 
                    : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-slate-850/50'
                }`}
              >
                หมวดหมู่เอกสาร
              </Link>
              <Link 
                href="/admin/types" 
                onClick={handleLinkClick}
                className={`block px-3 py-2 text-[11px] rounded-lg transition-colors ${
                  pathname === '/admin/types' 
                    ? 'text-amber-700 dark:text-amber-500 font-bold bg-amber-50/60 dark:bg-slate-800/50' 
                    : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-slate-850/50'
                }`}
              >
                ประเภทเอกสาร
              </Link>
              <Link 
                href="/admin/templates" 
                onClick={handleLinkClick}
                className={`block px-3 py-2 text-[11px] rounded-lg transition-colors ${
                  pathname === '/admin/templates' 
                    ? 'text-amber-700 dark:text-amber-500 font-bold bg-amber-50/60 dark:bg-slate-800/50' 
                    : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-slate-850/50'
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
              ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-550 font-bold border-l-4 border-amber-500 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
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
              ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-550 font-bold border-l-4 border-amber-500 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
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
              ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-550 font-bold border-l-4 border-amber-500 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
          }`}
        >
          <Settings size={18} />
          <span className="text-xs font-semibold">ตั้งค่าระบบ</span>
        </Link>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-800 dark:text-slate-100 font-light transition-colors duration-200">
      
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 shrink-0 transition-colors duration-200">
        {/* Logo */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-xl text-slate-955 shadow-md">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-855 dark:text-white tracking-wider leading-tight">ADMIN PORTAL</h2>
            <p className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold tracking-widest uppercase">Backend Control</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {renderNavLinks(false)}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-between w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-205 dark:border-slate-800 rounded-lg transition-all"
          >
            <span className="flex items-center gap-2">
              <ExternalLink size={14} />
              สลับไปฝั่งผู้ใช้งาน
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-red-650 dark:text-red-400 hover:text-red-750 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all text-left cursor-pointer"
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
            className="w-64 bg-white dark:bg-slate-900 h-full border-r border-gray-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 p-2 rounded-xl text-slate-950">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-800 dark:text-white">ADMIN PORTAL</h2>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
              {renderNavLinks(true, () => setSidebarOpen(false))}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-xs text-slate-655 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-800"
              >
                <ExternalLink size={14} />
                สลับไปฝั่งผู้ใช้งาน
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-left"
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
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg md:hidden transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-semibold text-slate-600 dark:text-slate-400">ระบบควบคุมส่วนกลางสำหรับผู้ดูแลระบบ</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            {mounted ? (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 text-slate-550 hover:text-slate-855 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="สลับโหมดกลางวัน/กลางคืน"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            ) : (
              <div className="w-9 h-9" />
            )}

            <div className="h-4 w-px bg-gray-200 dark:bg-slate-800 hidden sm:block"></div>
            
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-amber-50/85 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-sm">
                SA
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">Super Admin</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
