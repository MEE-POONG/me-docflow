"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  CheckCircle2, 
  UserX, 
  UserCheck, 
  KeyRound, 
  Eye, 
  EyeOff 
} from "lucide-react";
import { getAdminUsers, updateAdminUser, deleteAdminUser } from "../actions";

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  password?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (e) {
      console.error("Error fetching users", e);
    }
  };

  // Load users
  useEffect(() => {
    fetchUsers();
  }, []);

  const logAdminAction = (logMessage: string) => {
    // Seed audit log
    const logs = localStorage.getItem("me_docflow_audit_logs");
    const currentLogs = logs ? JSON.parse(logs) : [];
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      user: "System Admin (admin)",
      action: logMessage,
      type: "info"
    };
    localStorage.setItem("me_docflow_audit_logs", JSON.stringify([newLog, ...currentLogs]));
  };

  const handleOpenEditForm = (user: UserItem) => {
    setEditingUser(user);
    setFullName(user.fullName);
    setEmail(user.email);
    setRole(user.role);
    setStatus(user.status);
    setPassword(user.password || "");
    setIsFormOpen(true);
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้ "${name}" ออกจากระบบ?`)) {
      try {
        await deleteAdminUser(id);
        await fetchUsers();
        logAdminAction(`ลบบัญชีผู้ใช้งาน "${name}" (อีเมล: ${users.find(u=>u.id===id)?.email})`);
      } catch (e) {
        console.error(e);
        alert("Error deleting user");
      }
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus: "active" | "inactive" = user.status === "active" ? "inactive" : "active";
    const actionMsg = nextStatus === "active" 
      ? `ปลดบล็อกบัญชีผู้ใช้ (Activate) "${user.fullName}"` 
      : `ระงับบัญชีผู้ใช้ (Block) "${user.fullName}" ห้ามเข้าใช้ระบบชั่วคราว`;
    
    try {
      await updateAdminUser(user.id, { ...user, status: nextStatus });
      await fetchUsers();
      logAdminAction(actionMsg);
    } catch (e) {
      console.error(e);
      alert("Error updating user status");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !role) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (editingUser) {
      try {
        await updateAdminUser(editingUser.id, { 
          fullName, email, role, status, password 
        });
        await fetchUsers();
        logAdminAction(`แก้ไขข้อมูลผู้ใช้ "${fullName}" (อีเมล: ${email}, ตำแหน่ง: ${role})`);
      } catch (e) {
        console.error(e);
        alert("Error updating user");
        return;
      }
    }

    setIsFormOpen(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Filtered users based on search
  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">User Administration</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-serif">จัดการผู้ใช้งานทั้งหมด</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">ระงับบัญชีผู้ใช้ ปรับข้อมูลบทบาทหน้าที่ หรือรีเซ็ตรหัสผ่านของพนักงานทุกคนในเครือข่ายแอปพลิเคชัน</p>
      </div>

      {/* Toast Save Message */}
      {isSaved && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500 shrink-0" />
          <p className="text-sm font-semibold">อัปเดตข้อมูลผู้ใช้งานสำเร็จ!</p>
        </div>
      )}

      {/* Search and Stats bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-505 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อพนักงาน หรือ อีเมล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors duration-200"
          />
        </div>
        <div className="text-xs text-slate-550 dark:text-slate-400 font-medium">
          พบพนักงานในระบบทั้งหมด <span className="text-slate-800 dark:text-white font-bold">{filteredUsers.length}</span> คน
        </div>
      </div>

      {/* Edit Form Modal Card */}
      {isFormOpen && editingUser && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 transition-colors duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-slate-850">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Users className="w-5 h-5 text-amber-550" />
              แก้ไขข้อมูลและรหัสผ่านบัญชี (สิทธิ์ระดับแอดมิน)
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1 font-sans">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1 font-sans">อีเมลสำหรับล็อกอิน</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1 font-sans">บทบาทพนักงาน (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-white dark:bg-slate-955 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer font-sans transition-colors duration-200"
                >
                  <option value="owner">เจ้าของธุรกิจ (Owner)</option>
                  <option value="accountant">นักบัญชีในบริษัท (Accountant)</option>
                  <option value="employee">พนักงาน (Employee)</option>
                  <option value="auditor">สำนักงานบัญชี/นักบัญชีอิสระ (Auditor)</option>
                  <option value="student">นักเรียน/นักศึกษา (Student)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1 font-sans">รหัสผ่านของบัญชี</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono transition-colors duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-555 dark:text-slate-400 uppercase mb-1 font-sans">สถานะบัญชี</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                  className="w-full bg-white dark:bg-slate-955 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition-colors duration-200"
                >
                  <option value="active">ปกติ (Active)</option>
                  <option value="inactive">ระงับการเข้าใช้ (Inactive / Blocked)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-150 dark:border-slate-850 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-sans"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-955 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer font-sans"
              >
                <Save className="w-4 h-4" />
                บันทึกการแก้ไขของแอดมิน
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-350">
            <thead className="text-gray-500 dark:text-slate-400 uppercase bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 font-bold">
              <tr>
                <th className="py-3.5 px-6">ชื่อ-สกุล / อีเมลผู้ใช้</th>
                <th className="py-3.5 px-6">บทบาทระบบ (Role)</th>
                <th className="py-3.5 px-6">รหัสผ่าน (Masked)</th>
                <th className="py-3.5 px-6">สิทธิ์เข้าใช้ระบบ</th>
                <th className="py-3.5 px-6 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-slate-500">
                    ไม่พบข้อมูลผู้ใช้งานพนักงานใดตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-xs">{user.fullName}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                      {user.role === "owner" && "เจ้าของธุรกิจ (Owner)"}
                      {user.role === "accountant" && "นักบัญชีในบริษัท (Accountant)"}
                      {user.role === "employee" && "พนักงาน (Employee)"}
                      {user.role === "auditor" && "สำนักงานบัญชี/นักบัญชีอิสระ (Auditor)"}
                      {user.role === "student" && "นักเรียน/นักศึกษา (Student)"}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-400 dark:text-slate-600">
                      ••••••••
                    </td>
                    <td className="py-4 px-6">
                      {user.status === "active" ? (
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={user.id === "1"}
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2.5 py-1 rounded-full transition-all ${
                            user.id === "1" ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                          }`}
                          title={user.id === "1" ? "" : "คลิกเพื่อระงับการเข้าใช้ (Block)"}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          ใช้งานได้ปกติ
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={user.id === "1"}
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-2.5 py-1 rounded-full cursor-pointer hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                          title="คลิกเพื่อปลดระงับการเข้าใช้ (Active)"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          ระงับชั่วคราว
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditForm(user)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="แก้ไขข้อมูลพนักงาน (แอดมิน)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.fullName)}
                          disabled={user.id === "1"}
                          className={`p-2 rounded-lg transition-colors ${
                            user.id === "1"
                              ? "text-slate-205 dark:text-slate-800 cursor-not-allowed"
                              : "text-slate-400 dark:text-slate-500 hover:text-red-655 dark:hover:text-red-400 hover:bg-red-55 dark:hover:bg-red-950/20 cursor-pointer"
                          }`}
                          title={user.id === "1" ? "ไม่สามารถลบบัญชีหลักของระบบได้" : "ลบพนักงาน"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
