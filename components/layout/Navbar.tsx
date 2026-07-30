"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Bell, Moon, Sun, ChevronDown, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSidebar } from "./SidebarContext";

export default function Navbar() {
  const [activeCompanyName, setActiveCompanyName] = useState("บริษัท สยาม รีเทล จำกัด (มหาชน)");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { toggle } = useSidebar();
  const router = useRouter();

  const handleLogout = () => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?")) {
      localStorage.removeItem("me_docflow_user_session");
      router.push("/login");
    }
  };

  useEffect(() => {
    setMounted(true);
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
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
          <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={activeCompanyName}>{activeCompanyName}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

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
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
