"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Key, 
  Lock, 
  LogOut, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  User
} from "lucide-react";

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  password?: string;
}

export default function ChangePasswordPage() {
  const router = useRouter();
  
  // Users database state
  const [users, setUsers] = useState<UserItem[]>([]);

  // Form states
  const [myCurrentPassword, setMyCurrentPassword] = useState("");
  const [myNewPassword, setMyNewPassword] = useState("");
  const [myConfirmPassword, setMyConfirmPassword] = useState("");
  const [showMyCurrentPass, setShowMyCurrentPass] = useState(false);
  const [showMyNewPass, setShowMyNewPass] = useState(false);
  const [showMyConfirmPass, setShowMyConfirmPass] = useState(false);
  
  // Feedback states
  const [myPasswordSuccess, setMyPasswordSuccess] = useState(false);
  const [myPasswordError, setMyPasswordError] = useState("");
  const [currentUser, setCurrentUser] = useState<UserItem | null>(null);

  // Load users from localStorage and set currentUser
  useEffect(() => {
    const userStr = localStorage.getItem("me_docflow_current_user");
    let currentUsr: any = null;
    if (userStr) {
      try {
        currentUsr = JSON.parse(userStr);
      } catch (e) {}
    }

    const savedData = localStorage.getItem("me_docflow_users");
    let allUsers: UserItem[] = [];
    if (savedData) {
      try {
        allUsers = JSON.parse(savedData);
        setUsers(allUsers);
      } catch (e) {
        console.error("Error parsing users", e);
      }
    } else {
      // Seed default user list if not present
      const defaultUsers: UserItem[] = [
        {
          id: "1",
          fullName: "Melisara Chaimongkol",
          email: "melisara@siamretail.co.th",
          role: "owner",
          status: "active",
          password: "password123"
        }
      ];
      allUsers = defaultUsers;
      setUsers(defaultUsers);
      localStorage.setItem("me_docflow_users", JSON.stringify(defaultUsers));
    }

    if (currentUsr) {
      const matched = allUsers.find(u => u.id === currentUsr.id || u.email.toLowerCase() === currentUsr.email.toLowerCase());
      if (matched) {
        setCurrentUser(matched);
      } else {
        setCurrentUser(currentUsr);
      }
    } else {
      const matched = allUsers.find(u => u.id === "1");
      setCurrentUser(matched || {
        id: "1",
        fullName: "Melisara Chaimongkol",
        email: "melisara@siamretail.co.th",
        role: "owner",
        status: "active",
        password: "password123"
      });
    }
  }, []);

  const handleChangeMyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMyPasswordError("");
    setMyPasswordSuccess(false);

    if (!myCurrentPassword || !myNewPassword || !myConfirmPassword) {
      setMyPasswordError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    // Find the logged-in user
    const myAccount = users.find((u) => u.id === currentUser?.id || u.email.toLowerCase() === currentUser?.email.toLowerCase());
    if (!myAccount) {
      setMyPasswordError("ไม่พบบัญชีผู้ใช้งานปัจจุบันในระบบ");
      return;
    }

    const currentPassInDb = myAccount.password || "password123";

    if (myCurrentPassword !== currentPassInDb) {
      setMyPasswordError("รหัสผ่านปัจจุบันไม่ถูกต้อง");
      return;
    }

    if (myNewPassword !== myConfirmPassword) {
      setMyPasswordError("รหัสผ่านใหม่และยืนยันรหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    if (myNewPassword.length < 6) {
      setMyPasswordError("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    // Update the password in database
    const updatedUsers = users.map((u) => 
      u.id === myAccount.id ? { ...u, password: myNewPassword } : u
    );

    setUsers(updatedUsers);
    localStorage.setItem("me_docflow_users", JSON.stringify(updatedUsers));
    
    // Also update currentUser in localStorage
    const updatedUserObj = { ...myAccount, password: myNewPassword };
    localStorage.setItem("me_docflow_current_user", JSON.stringify(updatedUserObj));
    setCurrentUser(updatedUserObj);

    setMyPasswordSuccess(true);
    setMyCurrentPassword("");
    setMyNewPassword("");
    setMyConfirmPassword("");
    
    setTimeout(() => setMyPasswordSuccess(false), 4000);
  };

  const handleLogout = () => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?")) {
      localStorage.removeItem("me_docflow_user_session");
      localStorage.removeItem("me_docflow_current_user");
      router.push("/login");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">การตั้งค่าความปลอดภัย</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">เปลี่ยนรหัสผ่านของฉัน</h1>
        <p className="text-sm text-gray-500">จัดการข้อมูลรหัสความปลอดภัยในการล็อกอิน หรือออกจากเซสชันสิทธิ์การเข้าใช้งานของบัญชีนี้</p>
      </div>

      {/* Account Info Profile Panel */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-4 max-w-4xl">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl border border-emerald-100 uppercase">
          {currentUser?.fullName ? currentUser.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "MC"}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h3 className="font-bold text-gray-800 text-lg leading-tight">{currentUser?.fullName || "Melisara Chaimongkol"}</h3>
          <p className="text-xs text-gray-400 font-mono">
            อีเมล: {currentUser?.email || "melisara@siamretail.co.th"} | สิทธิ์: {
              currentUser?.role === "owner" ? "เจ้าของธุรกิจ (Owner)" :
              currentUser?.role === "accountant_in" ? "นักบัญชีในบริษัท (Accountant)" :
              currentUser?.role === "employee" ? "พนักงาน (Staff)" :
              currentUser?.role === "accounting_firm" ? "สำนักงานบัญชี/นักบัญชีอิสระ" :
              currentUser?.role === "student" ? "นักเรียน/นักศึกษา" :
              currentUser?.role || "เจ้าของธุรกิจ (Owner)"
            }
          </p>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-4xl">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">ฟอร์มปรับเปลี่ยนรหัสความปลอดภัย</h3>
            <p className="text-xs text-gray-500">รหัสผ่านใหม่ต้องมีความยาวขั้นต่ำอย่างน้อย 6 ตัวอักษรขึ้นไป</p>
          </div>
        </div>

        <form onSubmit={handleChangeMyPassword} className="p-6 space-y-5">
          {/* Notification Messages */}
          {myPasswordSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold">เปลี่ยนรหัสผ่านส่วนตัวของคุณสำเร็จแล้ว!</p>
            </div>
          )}

          {myPasswordError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm font-semibold">{myPasswordError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 font-sans">รหัสผ่านปัจจุบัน</label>
              <div className="relative">
                <input
                  type={showMyCurrentPass ? "text" : "password"}
                  required
                  value={myCurrentPassword}
                  onChange={(e) => setMyCurrentPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                  placeholder="รหัสผ่านปัจจุบัน"
                />
                <button
                  type="button"
                  onClick={() => setShowMyCurrentPass(!showMyCurrentPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showMyCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 font-sans">รหัสผ่านใหม่</label>
              <div className="relative">
                <input
                  type={showMyNewPass ? "text" : "password"}
                  required
                  value={myNewPassword}
                  onChange={(e) => setMyNewPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                  placeholder="รหัสผ่านใหม่"
                />
                <button
                  type="button"
                  onClick={() => setShowMyNewPass(!showMyNewPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showMyNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 font-sans">ยืนยันรหัสผ่านใหม่</label>
              <div className="relative">
                <input
                  type={showMyConfirmPass ? "text" : "password"}
                  required
                  value={myConfirmPassword}
                  onChange={(e) => setMyConfirmPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                  placeholder="ยืนยันรหัสผ่านใหม่"
                />
                <button
                  type="button"
                  onClick={() => setShowMyConfirmPass(!showMyConfirmPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showMyConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 px-5 rounded-xl text-sm border border-red-200 transition-colors cursor-pointer font-sans"
            >
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm shadow-sm transition-colors cursor-pointer font-sans"
            >
              <Lock className="w-4 h-4" />
              อัปเดตรหัสผ่านของฉัน
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
