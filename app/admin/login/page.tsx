"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldAlert, ArrowRight, Eye, EyeOff, User } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (email === "admin" && password === "password") {
      localStorage.setItem("me_docflow_admin_logged_in", "true");

      // Seed audit log for admin login
      const logs = localStorage.getItem("me_docflow_audit_logs");
      const currentLogs = logs ? JSON.parse(logs) : [];
      const newLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        user: "System Admin (admin)",
        action: "ล็อกอินเข้าสู่ระบบผู้ดูแลระบบหลังบ้าน",
        type: "security"
      };
      localStorage.setItem("me_docflow_audit_logs", JSON.stringify([newLog, ...currentLogs]));

      router.push("/admin/dashboard");
    } else {
      setError("อีเมลผู้ดูแลระบบหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-[#7AB5BD] p-3 rounded-2xl text-slate-950 shadow-lg shadow-[#7AB5BD]/20">
            <ShieldAlert size={36} className="animate-pulse" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          System Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          ระบบจัดการหลังบ้านผู้ดูแลระบบ ME-DocFlow
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl sm:rounded-3xl border border-slate-800 sm:px-10 relative overflow-hidden">

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-950/50 border border-red-800 text-red-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-300">ชื่อผู้ใช้งานผู้ดูแลระบบ (Admin Username)</label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-3 py-3 border border-slate-700 bg-slate-950 text-white rounded-xl shadow-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#7AB5BD] focus:border-[#7AB5BD] text-sm transition-all"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300">รหัสผ่าน (Password)</label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-10 py-3 border border-slate-700 bg-slate-950 text-white rounded-xl shadow-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#7AB5BD] focus:border-[#7AB5BD] text-sm transition-all font-mono"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 border-t border-slate-800/80 pt-4 space-y-1">
              <p>💡 บัญชีแอดมินสาธิตสำหรับทดลองใช้งาน:</p>
              <p>• Username: <span className="font-mono text-slate-300 select-all">admin</span></p>
              <p>• Password: <span className="font-mono text-slate-300 select-all">password</span></p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-slate-950 bg-[#7AB5BD] hover:bg-[#8FC1C8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7AB5BD] transition-all cursor-pointer shadow-[#7AB5BD]/10 hover:shadow-[#7AB5BD]/20"
              >
                เข้าสู่ระบบผู้ดูแลระบบ
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
