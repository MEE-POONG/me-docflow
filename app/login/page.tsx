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
  Mail,
  Eye,
  EyeOff
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
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">(initialTab);
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState(""); // Email or Phone
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register State
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<string>("");

  // Forgot Password State
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotUser, setForgotUser] = useState<any>(null);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");

  // Password Visibility States
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginIdentifier && loginPassword) {
      if (loginIdentifier === "admin" && loginPassword === "password") {
        localStorage.setItem("me_docflow_admin_logged_in", "true");
        router.push("/admin/dashboard");
        return;
      }

      // Load users
      const savedData = localStorage.getItem("me_docflow_users");
      let allUsers: any[] = [];
      if (savedData) {
        try {
          allUsers = JSON.parse(savedData);
        } catch (err) {}
      } else {
        allUsers = [
          { id: "1", fullName: "Melisara Chaimongkol", email: "melisara@siamretail.co.th", role: "owner", status: "active", password: "password123" },
          { id: "2", fullName: "สมชาย ใจดี", email: "somchai@siamretail.co.th", role: "accountant", status: "active", password: "password123" },
          { id: "3", fullName: "สมศรี สุขใจ", email: "somsri@siamretail.co.th", role: "employee", status: "inactive", password: "password123" },
        ];
        localStorage.setItem("me_docflow_users", JSON.stringify(allUsers));
      }

      // Find user
      const matched = allUsers.find(
        (u: any) =>
          (u.email.toLowerCase() === loginIdentifier.toLowerCase() || u.phone === loginIdentifier) &&
          u.password === loginPassword
      );

      if (matched) {
        localStorage.setItem("me_docflow_current_user", JSON.stringify(matched));
        localStorage.setItem("me_docflow_user_session", "true");
        window.dispatchEvent(new Event("activeCompanyChanged"));
        router.push("/dashboard");
      } else {
        alert("อีเมล/เบอร์โทรศัพท์ หรือรหัสผ่านไม่ถูกต้อง");
      }
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPhone || !regRole || !regPassword) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // Load existing users from localStorage or default seed
    const savedData = localStorage.getItem("me_docflow_users");
    let allUsers: any[] = [];
    if (savedData) {
      try {
        allUsers = JSON.parse(savedData);
      } catch (err) {}
    } else {
      allUsers = [
        { id: "1", fullName: "Melisara Chaimongkol", email: "melisara@siamretail.co.th", role: "owner", status: "active", password: "password123" },
        { id: "2", fullName: "สมชาย ใจดี", email: "somchai@siamretail.co.th", role: "accountant", status: "active", password: "password123" },
        { id: "3", fullName: "สมศรี สุขใจ", email: "somsri@siamretail.co.th", role: "employee", status: "inactive", password: "password123" },
      ];
    }

    // Check if email already registered
    const exists = allUsers.some((u: any) => u.email.toLowerCase() === regEmail.toLowerCase());
    if (exists) {
      alert("อีเมลนี้ได้รับการลงทะเบียนแล้ว");
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      fullName: regFullName,
      email: regEmail,
      phone: regPhone,
      role: regRole,
      status: "active",
      password: regPassword
    };

    const updatedUsers = [...allUsers, newUser];
    localStorage.setItem("me_docflow_users", JSON.stringify(updatedUsers));
    
    // Auto login
    localStorage.setItem("me_docflow_current_user", JSON.stringify(newUser));
    localStorage.setItem("me_docflow_user_session", "true");
    
    // Dispatch activeCompanyChanged to ensure any listening components update
    setTimeout(() => {
      window.dispatchEvent(new Event("activeCompanyChanged"));
    }, 100);

    router.push("/dashboard");
  };

  const handleFindForgotAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier) {
      alert("กรุณากรอกอีเมลหรือเบอร์โทรศัพท์");
      return;
    }

    // Load users
    const savedData = localStorage.getItem("me_docflow_users");
    let allUsers: any[] = [];
    if (savedData) {
      try {
        allUsers = JSON.parse(savedData);
      } catch (err) {}
    } else {
      allUsers = [
        { id: "1", fullName: "Melisara Chaimongkol", email: "melisara@siamretail.co.th", role: "owner", status: "active", password: "password123" },
        { id: "2", fullName: "สมชาย ใจดี", email: "somchai@siamretail.co.th", role: "accountant", status: "active", password: "password123" },
        { id: "3", fullName: "สมศรี สุขใจ", email: "somsri@siamretail.co.th", role: "employee", status: "inactive", password: "password123" },
      ];
      localStorage.setItem("me_docflow_users", JSON.stringify(allUsers));
    }

    const matched = allUsers.find(
      (u: any) =>
        u.email.toLowerCase() === forgotIdentifier.toLowerCase() ||
        u.phone === forgotIdentifier
    );

    if (matched) {
      setForgotUser(matched);
      setForgotStep(2);
    } else {
      alert("ไม่พบอีเมลหรือเบอร์โทรศัพท์นี้ในระบบ");
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotNewPassword || !forgotConfirmPassword) {
      alert("กรุณากรอกรหัสผ่านใหม่ให้ครบถ้วน");
      return;
    }

    if (forgotNewPassword.length < 6) {
      alert("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      alert("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    // Load users
    const savedData = localStorage.getItem("me_docflow_users");
    let allUsers: any[] = [];
    if (savedData) {
      try {
        allUsers = JSON.parse(savedData);
      } catch (err) {}
    } else {
      allUsers = [
        { id: "1", fullName: "Melisara Chaimongkol", email: "melisara@siamretail.co.th", role: "owner", status: "active", password: "password123" },
        { id: "2", fullName: "สมชาย ใจดี", email: "somchai@siamretail.co.th", role: "accountant", status: "active", password: "password123" },
        { id: "3", fullName: "สมศรี สุขใจ", email: "somsri@siamretail.co.th", role: "employee", status: "inactive", password: "password123" },
      ];
    }

    const updatedUsers = allUsers.map((u: any) => {
      if (u.id === forgotUser.id) {
        return { ...u, password: forgotNewPassword };
      }
      return u;
    });

    localStorage.setItem("me_docflow_users", JSON.stringify(updatedUsers));
    alert("เปลี่ยนรหัสผ่านสำเร็จแล้ว! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่");
    
    // Reset states and go back to login tab
    setForgotIdentifier("");
    setForgotStep(1);
    setForgotUser(null);
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setActiveTab("login");
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
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-10 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
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
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("forgot");
                      setForgotStep(1);
                      setForgotUser(null);
                    }}
                    className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors bg-transparent border-0 p-0 cursor-pointer"
                  >
                    ลืมรหัสผ่าน?
                  </button>
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
          ) : activeTab === "register" ? (
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
                <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                    placeholder="you@example.com"
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
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-10 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
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
          ) : (
            /* ================= FORGOT PASSWORD FORM ================= */
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
                <h3 className="font-bold text-gray-800 text-lg">กู้คืนรหัสผ่าน</h3>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setForgotStep(1);
                  }}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-500 cursor-pointer bg-transparent border-0 p-0"
                >
                  ย้อนกลับไปเข้าสู่ระบบ
                </button>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleFindForgotAccount} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">อีเมล หรือ เบอร์โทรศัพท์ของบัญชีผู้ใช้</label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        className="appearance-none block w-full pl-11 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                        placeholder="you@example.com หรือ 0812345678"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all cursor-pointer"
                    >
                      ค้นหาบัญชีผู้ใช้
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl">
                    <p className="text-xs text-emerald-800">
                      <strong>พบบัญชีผู้ใช้:</strong> {forgotUser?.fullName} ({forgotUser?.email})
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showForgotNewPassword ? "text" : "password"}
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        className="appearance-none block w-full pl-11 pr-10 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showForgotNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showForgotConfirmPassword ? "text" : "password"}
                        required
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        className="appearance-none block w-full pl-11 pr-10 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showForgotConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all cursor-pointer"
                    >
                      ตั้งรหัสผ่านใหม่
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
