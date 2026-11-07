"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Bell, Moon, Sun, ChevronDown, User, LogOut, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useTheme } from "next-themes";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSidebar } from "./SidebarContext";
import { storeCompanySession, type SessionCompany } from '@/lib/company-session-client';

export default function Navbar() {
  const [activeCompanyName, setActiveCompanyName] = useState("บริษัท ของคุณ จำกัด");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
  const companyMenuRef = useRef<HTMLDivElement>(null);
  const [companies, setCompanies] = useState<SessionCompany[]>([]);
  const [pendingCompanyId, setPendingCompanyId] = useState('');
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchError, setSwitchError] = useState('');
  const [isSwitchingCompany, setIsSwitchingCompany] = useState(false);
  const { toggle } = useSidebar();
  const router = useRouter();
  const companyGroups = [
    { key: 'owned', label: 'บริษัทที่เป็นเจ้าของ', companies: companies.filter(company => company.role?.toLowerCase() === 'owner') },
    { key: 'member', label: 'บริษัทที่เป็นสมาชิก', companies: companies.filter(company => company.role?.toLowerCase() !== 'owner') },
  ];

  const handleLogout = async () => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?")) {
      try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (!response.ok) throw new Error();
      } catch { alert('ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง'); return; }
      localStorage.removeItem("me_docflow_user_session");
      localStorage.removeItem("me_docflow_current_user");
      window.location.href = '/login';
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!currentUser || !currentUser.id) {
      alert("ไม่พบข้อมูลผู้ใช้งาน (อาจเป็นบัญชีจำลอง)");
      return;
    }
    
    const isOwner = currentUser.role === "OWNER";
    const confirmMsg = isOwner 
      ? "⚠️ คำเตือน: คุณคือเจ้าของธุรกิจ (OWNER)\n\nการลบบัญชีจะส่งผลให้ **ข้อมูลทั้งหมดของบริษัท** รวมถึงเอกสาร, พนักงาน, ลูกค้า และข้อมูลอื่นๆ ถูกลบอย่างถาวร!\n\nคุณแน่ใจหรือไม่ว่าต้องการลบบัญชีและลบข้อมูลบริษัท?"
      : "คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้ของคุณ? ข้อมูลนี้จะไม่สามารถกู้คืนได้";

    if (window.confirm(confirmMsg)) {
      try {
        setIsDeleting(true);
        const res = await fetch("/api/auth/delete-account", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id, companyId: currentUser.companyId })
        });
        
        if (res.ok) {
          alert("ลบบัญชีและข้อมูลสำเร็จ");
          localStorage.removeItem("me_docflow_user_session");
          localStorage.removeItem("me_docflow_current_user");
          localStorage.removeItem("me_docflow_companies");
          router.push("/login");
        } else {
          const data = await res.json();
          alert("เกิดข้อผิดพลาด: " + (data.error || "ไม่สามารถลบข้อมูลได้"));
        }
      } catch (err) {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSelectCompany = (companyId: string) => {
    setIsCompanyMenuOpen(false);
    const storedUser = JSON.parse(localStorage.getItem('me_docflow_current_user') || '{}');
    if (companyId === storedUser.companyId) return;
    setPendingCompanyId(companyId);
    setSwitchPassword('');
    setSwitchError('');
  };

  const handleSwitchCompany = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingCompanyId || !switchPassword) return;
    setIsSwitchingCompany(true);
    setSwitchError('');
    try {
      const response = await fetch('/api/auth/switch-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: pendingCompanyId, password: switchPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'สลับบริษัทไม่สำเร็จ');

      const user = data.user;
      const nextCompanies = storeCompanySession(user);
      setCurrentUser(user);
      setActiveCompanyName(user.companyName);
      setCompanies(nextCompanies);
      setPendingCompanyId('');
      setSwitchPassword('');
      // Reload the tenant shell and discard any open form from the previous company.
      window.location.assign('/dashboard');
    } catch (error) {
      setSwitchError(error instanceof Error ? error.message : 'สลับบริษัทไม่สำเร็จ');
    } finally {
      setIsSwitchingCompany(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const updateActiveCompany = () => {
      const saved = localStorage.getItem("me_docflow_companies");
      const userStr = localStorage.getItem("me_docflow_current_user");
      let currentEmail = "melisara@siamretail.co.th";
      let currentCompanyId = "";
      let registeredCompanyName = "";
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u.email) currentEmail = u.email;
          if (u.companyId) currentCompanyId = u.companyId;
          if (u.companyName) registeredCompanyName = u.companyName;
        } catch (e) {}
      }

      if (saved) {
        try {
          const list = JSON.parse(saved);
          const userCompanies = list.filter((c: any) =>
            (currentCompanyId && c.id === currentCompanyId) || c.ownerEmail === currentEmail
          ).map((c: any) => ({
            ...c,
            companyName: currentCompanyId && c.id === currentCompanyId && registeredCompanyName
              ? registeredCompanyName
              : c.companyName,
          }));
          setCompanies(userCompanies);
          const active = userCompanies.find((c: any) => c.isActive) || userCompanies[0];
          if (active) {
            setActiveCompanyName(
              currentCompanyId && active.id === currentCompanyId && registeredCompanyName
                ? registeredCompanyName
                : active.companyName
            );
            return;
          }
        } catch (e) {}
      }

      if (registeredCompanyName) {
        setActiveCompanyName(registeredCompanyName);
        setCompanies([{
          id: currentCompanyId,
          companyName: registeredCompanyName,
          ownerEmail: currentEmail,
          isActive: true,
        }]);
      }
    };

    const updateCurrentUser = () => {
      const userStr = localStorage.getItem("me_docflow_current_user");
      if (userStr) {
        try {
          setCurrentUser(JSON.parse(userStr));
        } catch (e) {}
      } else {
        setCurrentUser({
          fullName: "Melisara Chaimongkol",
          email: "melisara@siamretail.co.th"
        });
      }
    };

    updateActiveCompany();
    updateCurrentUser();
    window.addEventListener("activeCompanyChanged", updateActiveCompany);
    window.addEventListener("activeCompanyChanged", updateCurrentUser);

    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (companyMenuRef.current && !companyMenuRef.current.contains(event.target as Node)) {
        setIsCompanyMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("activeCompanyChanged", updateActiveCompany);
      window.removeEventListener("activeCompanyChanged", updateCurrentUser);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-6 transition-colors">
      
      {/* Left side: Breadcrumb / Title */}
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.common.dashboard}</h1>
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center relative max-w-md w-full ml-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-3" />
          <input 
            type="text" 
            placeholder={t.common.searchPlaceholder} 
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3">
        
        {/* Company Dropdown */}
        <div className="relative" ref={companyMenuRef}>
          <button 
            onClick={() => setIsCompanyMenuOpen(!isCompanyMenuOpen)}
            aria-label="เลือกบริษัท"
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
          >
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={activeCompanyName}>{activeCompanyName}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCompanyMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {isCompanyMenuOpen && companies.length > 0 && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="max-h-60 overflow-y-auto p-1">
                {companyGroups.filter(group => group.companies.length > 0).map(group => (
                  <div key={group.key} className="py-1">
                    <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">{group.label} ({group.companies.length})</p>
                    {group.companies.map(company => (
                      <button
                        key={company.id}
                        onClick={() => handleSelectCompany(company.id)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          company.isActive
                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        {company.companyName}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>

        {/* Action Icons */}
        <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {mounted && theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>

        {/* Language Dropdown */}
        <div className="relative" ref={langMenuRef}>
          <button 
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === "th" ? "ไทย" : "EN"}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>
          
          {isLangMenuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
              <button 
                onClick={() => { setLanguage("th"); setIsLangMenuOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${language === "th" ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-gray-700 dark:text-gray-300"}`}
              >
                {t.common.thai}
              </button>
              <button 
                onClick={() => { setLanguage("en"); setIsLangMenuOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${language === "en" ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-gray-700 dark:text-gray-300"}`}
              >
                {t.common.english}
              </button>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative ml-2" ref={userMenuRef}>
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 font-bold text-xs uppercase shrink-0">
              {currentUser?.fullName ? currentUser.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : <User className="w-4 h-4" />}
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 hidden md:block">{currentUser?.fullName || "Melisara Chaimongkol"}</span>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50">
              <div className="p-4 flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 font-bold text-sm uppercase shrink-0">
                  {currentUser?.fullName ? currentUser.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : <User className="w-5 h-5" />}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{currentUser?.fullName || "Melisara Chaimongkol"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{activeCompanyName}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 p-2">
                <Link href="/profile" onClick={() => setIsUserMenuOpen(false)} className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-200 dark:hover:bg-gray-700">
                  <User className="h-4 w-4" /><span>โปรไฟล์ของฉัน</span>
                </Link>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left mb-1 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span>{isDeleting ? "กำลังลบข้อมูล..." : "ลบบัญชีผู้ใช้งาน"}</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {pendingCompanyId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" role="presentation">
          <form onSubmit={handleSwitchCompany} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900" role="dialog" aria-modal="true" aria-labelledby="switch-company-title">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700">สลับบริษัท</p>
                <h2 id="switch-company-title" className="mt-1 text-lg font-bold text-gray-900 dark:text-white">ยืนยันบัญชีบริษัท</h2>
              </div>
              <button type="button" onClick={() => setPendingCompanyId('')} aria-label="ปิด" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">กรอกรหัสผ่านของบัญชีอีเมล {currentUser?.email || ''} ในบริษัท {companies.find(company => company.id === pendingCompanyId)?.companyName || ''}</p>
            {switchError && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{switchError}</p>}
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="switch-company-password">รหัสผ่าน</label>
            <input id="switch-company-password" type="password" autoComplete="current-password" required autoFocus value={switchPassword} onChange={event => setSwitchPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800" />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingCompanyId('')} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">ยกเลิก</button>
              <button type="submit" disabled={isSwitchingCompany} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isSwitchingCompany ? 'กำลังสลับ...' : 'ยืนยันและสลับ'}</button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
