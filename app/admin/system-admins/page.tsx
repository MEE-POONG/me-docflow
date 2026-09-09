"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
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
  EyeOff,
  Plus
} from "lucide-react";
import { 
  getSystemAdmins, 
  createSystemAdmin, 
  updateSystemAdmin, 
  deleteSystemAdmin, 
  changeSystemAdminPassword 
} from "../actions";
import { SystemAdminRole } from "@prisma/client";

interface SystemAdminItem {
  id: string;
  name: string;
  username: string;
  email: string;
  role: SystemAdminRole;
  isActive: boolean;
  createdAt: Date;
}

export default function SystemAdminsPage() {
  const [admins, setAdmins] = useState<SystemAdminItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<SystemAdminItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SystemAdminRole>(SystemAdminRole.ADMIN);
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fetchAdmins = async () => {
    try {
      const data = await getSystemAdmins();
      setAdmins(data as unknown as SystemAdminItem[]);
    } catch (e) {
      console.error("Error fetching system admins", e);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const resetForm = () => {
    setEditingAdmin(null);
    setName("");
    setUsername("");
    setEmail("");
    setRole(SystemAdminRole.ADMIN);
    setIsActive(true);
    setPassword("");
    setShowPassword(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (admin: SystemAdminItem) => {
    setEditingAdmin(admin);
    setName(admin.name);
    setUsername(admin.username);
    setEmail(admin.email);
    setRole(admin.role);
    setIsActive(admin.isActive);
    setIsFormOpen(true);
  };

  const handleOpenPasswordForm = (admin: SystemAdminItem) => {
    setEditingAdmin(admin);
    setPassword("");
    setShowPassword(false);
    setIsPasswordFormOpen(true);
  };

  const handleDeleteAdmin = async (id: string, name: string, role: SystemAdminRole) => {
    if (role === SystemAdminRole.SUPER_ADMIN) {
      alert("ไม่สามารถลบ Super Admin ได้");
      return;
    }
    
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ System Admin "${name}" ออกจากระบบ?`)) {
      try {
        await deleteSystemAdmin(id);
        await fetchAdmins();
      } catch (e: any) {
        console.error(e);
        alert(e.message || "Error deleting system admin");
      }
    }
  };

  const handleToggleStatus = async (admin: SystemAdminItem) => {
    if (admin.role === SystemAdminRole.SUPER_ADMIN) {
      alert("ไม่สามารถระงับสิทธิ์ Super Admin ได้");
      return;
    }

    try {
      await updateSystemAdmin(admin.id, { 
        name: admin.name,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: !admin.isActive
      });
      await fetchAdmins();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error updating status");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !email || !role) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      if (editingAdmin) {
        await updateSystemAdmin(editingAdmin.id, {
          name, username, email, role, isActive
        });
      } else {
        if (!password) {
          alert("กรุณากำหนดรหัสผ่านเริ่มต้น");
          return;
        }
        await createSystemAdmin({
          name, username, email, role, password, isActive
        });
      }
      await fetchAdmins();
      setIsFormOpen(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error saving system admin");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin || !password) return;

    try {
      await changeSystemAdminPassword(editingAdmin.id, password);
      setIsPasswordFormOpen(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error changing password");
    }
  };

  // Filtered
  const filteredAdmins = admins.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-[11px] font-bold text-[#5C98A1] dark:text-[#7AB5BD] uppercase tracking-wider mb-1">System Security</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-serif">ผู้ดูแลระบบ</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">จัดการข้อมูลและสิทธิ์ของผู้ดูแลระบบส่วนกลาง (System Admins)</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#7AB5BD] hover:bg-[#6AA7B0] text-slate-900 font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          เพิ่มผู้ดูแลระบบ
        </button>
      </div>

      {/* Toast Save Message */}
      {isSaved && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500 shrink-0" />
          <p className="text-sm font-semibold">อัปเดตข้อมูลสำเร็จ!</p>
        </div>
      )}

      {/* Search and Stats bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อ, Username หรือ อีเมล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#7AB5BD] transition-colors duration-200"
          />
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          พบผู้ดูแลระบบทั้งหมด <span className="text-slate-800 dark:text-white font-bold">{filteredAdmins.length}</span> คน
        </div>
      </div>

      {/* Edit Form Modal Card */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                <ShieldAlert className="w-5 h-5 text-[#6AA7B0]" />
                {editingAdmin ? "แก้ไขข้อมูลผู้ดูแลระบบ" : "เพิ่มผู้ดูแลระบบคนใหม่"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7AB5BD] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">ชื่อผู้ใช้ (Username)</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7AB5BD] transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">อีเมล</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7AB5BD] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">ระดับสิทธิ์ (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as SystemAdminRole)}
                    className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7AB5BD] cursor-pointer transition-colors"
                  >
                    <option value="SUPER_ADMIN">Super Admin (จัดการได้ทุกอย่าง)</option>
                    <option value="ADMIN">Admin (จัดการผู้ใช้งานและเอกสาร)</option>
                    <option value="SUPPORT">Support (แก้ไขปัญหาเบื้องต้น)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">สถานะ</label>
                  <select
                    value={isActive ? "true" : "false"}
                    onChange={(e) => setIsActive(e.target.value === "true")}
                    className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7AB5BD] cursor-pointer transition-colors"
                  >
                    <option value="true">ปกติ (Active)</option>
                    <option value="false">ระงับการเข้าใช้ (Inactive)</option>
                  </select>
                </div>

                {!editingAdmin && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">รหัสผ่านสำหรับเข้าสู่ระบบ</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7AB5BD] font-mono transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#7AB5BD] hover:bg-[#6AA7B0] text-slate-900 rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {isPasswordFormOpen && editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                <KeyRound className="w-5 h-5 text-[#6AA7B0]" />
                เปลี่ยนรหัสผ่าน
              </h3>
              <button
                onClick={() => setIsPasswordFormOpen(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  เปลี่ยนรหัสผ่านสำหรับ: <span className="font-bold text-slate-800 dark:text-slate-200">{editingAdmin.name}</span>
                </p>
                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">รหัสผ่านใหม่</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7AB5BD] font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordFormOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#7AB5BD] hover:bg-[#6AA7B0] text-slate-900 rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  บันทึกรหัสผ่านใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
            <thead className="text-gray-500 dark:text-slate-400 uppercase bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 font-bold text-xs">
              <tr>
                <th className="py-4 px-6">ชื่อ-สกุล / ชื่อผู้ใช้</th>
                <th className="py-4 px-6">บทบาทระบบ (Role)</th>
                <th className="py-4 px-6">สถานะ</th>
                <th className="py-4 px-6 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 dark:text-slate-500">
                    ไม่พบข้อมูลผู้ดูแลระบบ
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white">{admin.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">@{admin.username}</span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{admin.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        admin.role === "SUPER_ADMIN" ? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/30" :
                        admin.role === "ADMIN" ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30" :
                        "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                      }`}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {admin.isActive ? (
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          className={`inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-3 py-1.5 rounded-full transition-all ${
                            admin.role === "SUPER_ADMIN" ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                          }`}
                        >
                          <UserCheck className="w-4 h-4" />
                          ปกติ
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-3 py-1.5 rounded-full cursor-pointer hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                        >
                          <UserX className="w-4 h-4" />
                          ระงับ
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenPasswordForm(admin)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors cursor-pointer"
                          title="เปลี่ยนรหัสผ่าน"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditForm(admin)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-[#5C98A1] dark:hover:text-[#7AB5BD] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.name, admin.role)}
                          disabled={admin.role === "SUPER_ADMIN"}
                          className={`p-2 rounded-lg transition-colors ${
                            admin.role === "SUPER_ADMIN"
                              ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                              : "text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                          }`}
                          title="ลบผู้ดูแลระบบ"
                        >
                          <Trash2 className="w-4 h-4" />
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
