"use client";

import { useState, useEffect } from "react";
import { Search, Bell, Moon, ChevronDown, User } from "lucide-react";

export default function Navbar() {
  const [activeCompanyName, setActiveCompanyName] = useState("บริษัท สยาม รีเทล จำกัด (มหาชน)");

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

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      
      {/* Left side: Breadcrumb / Title */}
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-sm font-medium text-gray-700">Dashboard</h1>
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center relative max-w-md w-full ml-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-3" />
          <input 
            type="text" 
            placeholder="ค้นหาเอกสาร ลูกค้า พนักงาน ฯลฯ" 
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3">
        
        {/* Company Dropdown */}
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
          <span className="text-sm text-gray-700 truncate max-w-[150px]" title={activeCompanyName}>{activeCompanyName}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        <div className="h-4 w-px bg-gray-300 mx-1"></div>

        {/* Action Icons */}
        <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
          <Moon className="w-5 h-5" />
        </button>

        <div className="h-4 w-px bg-gray-300 mx-1"></div>

        {/* Language Dropdown */}
        <button className="hidden sm:flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded-lg transition-colors">
          <span className="text-sm font-medium text-gray-700">ไทย</span>
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>

        {/* User Profile */}
        <button className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg transition-colors ml-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm text-gray-700 hidden md:block">Melisara Chaimongkol</span>
        </button>
      </div>
    </header>
  );
}
