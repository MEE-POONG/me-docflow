"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  Phone, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  User, 
  Briefcase, 
  Building2, 
  Users, 
  GraduationCap, 
  Check,
  Mail
} from "lucide-react";

const roles = [
  {
    id: "owner",
    title: "เจ้าของธุรกิจ",
    description: "บริหารจัดการธุรกิจและอนุมัติเอกสาร",
    icon: Building2,
  },
  {
    id: "accountant_in",
    title: "นักบัญชีในบริษัท",
    description: "จัดการบัญชีและเอกสารภายในบริษัท",
    icon: Briefcase,
  },
  {
    id: "employee",
    title: "พนักงาน",
    description: "สร้างและตรวจสอบเอกสารของตนเอง",
    icon: User,
  },
  {
    id: "accounting_firm",
    title: "สำนักงานบัญชี/นักบัญชีอิสระ",
    description: "ดูแลบัญชีให้ลูกค้าหลายบริษัท",
    icon: Users,
  },
  {
    id: "student",
    title: "นักเรียน/นักศึกษา",
    description: "ใช้งานเพื่อการเรียนรู้และทดลองระบบ",
    icon: GraduationCap,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Decide which tab to display initially based on pathname
  const initialTab = pathname === "/register" ? "register" : "login";
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState(""); // Email or Phone
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register State
  const [regFullName, setRegFullName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<string>("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginIdentifier && loginPassword) {
      if (loginIdentifier === "admin" && loginPassword === "password") {
        localStorage.setItem("me_docflow_admin_logged_in", "true");
        router.push("/admin/dashboard");
      } else {
        localStorage.setItem("me_docflow_user_session", "true");
        router.push("/dashboard");
      }
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regPhone || !regRole || !regPassword) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    // Simulate successful registration and redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
            <ShieldCheck size={36} className="animate-pulse" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          ME-DocFlow
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          ระบบจัดการเอกสารบัญชีและการดำเนินงานอัจฉริยะ
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-3xl border border-gray-100 sm:px-10 relative overflow-hidden">
          
          {/* Tabs Selector */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`flex-1 text-center py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === "login"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`flex-1 text-center py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === "register"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              สมัครใช้งาน
            </button>
          </div>

          {activeTab === "login" ? (
            /* ================= LOGIN FORM ================= */
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">อีเมล หรือ เบอร์โทรศัพท์</label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                    placeholder="you@example.com หรือ 0812345678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    จดจำฉันไว้
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
                    ลืมรหัสผ่าน?
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all cursor-pointer"
                >
                  เข้าสู่ระบบ
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </form>
          ) : (
            /* ================= REGISTER FORM ================= */
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">ชื่อ-สกุล</label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                    placeholder="สมชาย ใจดี"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์ของผู้สมัครใช้งาน</label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                    placeholder="0812345678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คุณเป็นใครในบริษัท?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = regRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setRegRole(role.id)}
                        className={`flex items-start text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer relative ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                        } ${role.id === "student" ? "sm:col-span-2" : ""}`}
                      >
                        <div className={`p-2 rounded-lg mr-3 shrink-0 ${
                          isSelected ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
                        }`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className={`text-sm font-bold truncate ${
                            isSelected ? "text-emerald-950" : "text-gray-900"
                          }`}>
                            {role.title}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">
                            {role.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 text-emerald-600 bg-emerald-100 rounded-full p-0.5 animate-in fade-in zoom-in duration-200">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">กำหนดรหัสผ่าน</label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all cursor-pointer"
                >
                  สมัครใช้งานสมาชิก
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
