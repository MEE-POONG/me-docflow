"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  UserPlus, 
  Edit2, 
  Trash2, 
  Users, 
  Mail, 
  Check, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Lock, 
  Key,
  LogOut
} from "lucide-react";

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  password?: string;
}

const roleNames: Record<string, string> = {
  owner: "เจ้าของธุรกิจ",
  accountant: "นักบัญชีในบริษัท",
  employee: "พนักงาน",
  accounting_firm: "สำนักงานบัญชี/นักบัญชีอิสระ",
  student: "นักเรียน/นักศึกษา",
};

export default function UsersSettingsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // Form states (Add/Edit User)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaved, setIsSaved] = useState(false);



  // Load from localStorage or seed mock data
  useEffect(() => {
    const currentUserData = localStorage.getItem("me_docflow_current_user");
    let currentUser: any = null;
    if (currentUserData) {
      try { currentUser = JSON.parse(currentUserData); } catch (e) {}
    }

    const savedData = localStorage.getItem("me_docflow_users");
    let allUsers: any[] = [];
    if (savedData) {
      try {
        allUsers = JSON.parse(savedData);
      } catch (e) {
        console.error("Error parsing users settings data", e);
      }
    } else {
      const mockUsers = [
        { id: "1", fullName: "Melisara Chaimongkol", email: "melisara@siamretail.co.th", role: "owner", status: "active", password: "password123" },
        { id: "2", fullName: "สมชาย ใจดี", email: "somchai@siamretail.co.th", role: "accountant", status: "active", password: "password123" },
        { id: "3", fullName: "สมศรี สุขใจ", email: "somsri@siamretail.co.th", role: "employee", status: "inactive", password: "password123" },
      ];
      allUsers = mockUsers;
      localStorage.setItem("me_docflow_users", JSON.stringify(mockUsers));
    }

    if (currentUser && currentUser.companyId) {
      const companyUsers = allUsers.filter((u: any) => u.companyId === currentUser.companyId);
      setUsers(companyUsers);
    } else {
      setUsers(allUsers);
    }
  }, []);

  const saveToLocalStorage = (updatedCompanyUsers: any[]) => {
    setUsers(updatedCompanyUsers);
    
    // Merge back with other companies' users
    const currentUserData = localStorage.getItem("me_docflow_current_user");
    let currentUser: any = null;
    if (currentUserData) {
      try { currentUser = JSON.parse(currentUserData); } catch (e) {}
    }

    const savedData = localStorage.getItem("me_docflow_users");
    let allUsers: any[] = [];
    if (savedData) {
      try { allUsers = JSON.parse(savedData); } catch (e) {}
    }

    if (currentUser && currentUser.companyId) {
      const otherUsers = allUsers.filter((u: any) => u.companyId !== currentUser.companyId);
      localStorage.setItem("me_docflow_users", JSON.stringify([...otherUsers, ...updatedCompanyUsers]));
    } else {
      localStorage.setItem("me_docflow_users", JSON.stringify(updatedCompanyUsers));
    }
  };

  const handleOpenAddForm = () => {
    setEditingUser(null);
    setFullName("");
    setEmail("");
    setRole("employee");
    setStatus("active");
    setPassword("");
    setShowPassword(false);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (user: UserItem) => {
    setEditingUser(user);
    setFullName(user.fullName);
    setEmail(user.email);
    setRole(user.role);
    setStatus(user.status);
    setPassword(user.password || "");
    setShowPassword(false);
    setIsFormOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งานนี้?")) {
      const updated = users.filter((u) => u.id !== id);
      saveToLocalStorage(updated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (editingUser) {
      // Edit mode
      const updated = users.map((u) =>
        u.id === editingUser.id ? { ...u, fullName, email, role, status, password } : u
      );
      saveToLocalStorage(updated);
    } else {
      // Add mode
      const currentUserData = localStorage.getItem("me_docflow_current_user");
      let companyId = null;
      if (currentUserData) {
        try { companyId = JSON.parse(currentUserData).companyId; } catch (e) {}
      }

      const newUser: any = {
        id: Date.now().toString(),
        fullName,
        email,
        role,
        status,
        password,
        companyId: companyId
      };
      saveToLocalStorage([...users, newUser]);
    }

    setIsFormOpen(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">การตั้งค่าระบบ</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-sans">จัดการผู้ใช้งาน</h1>
          <p className="text-sm text-gray-500">เพิ่ม ลบ หรือแก้ไขบทบาท สถานะการเข้าใช้งาน และรหัสผ่านของพนักงานภายในบริษัท</p>
        </div>
        <div>
          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-5 rounded-xl shadow-md transition-colors cursor-pointer text-sm"
          >
            <UserPlus className="w-4 h-4" />
            เพิ่มผู้ใช้งาน
          </button>
        </div>
      </div>

      {/* Toast Save Message */}
      {isSaved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">บันทึกข้อมูลผู้ใช้งานสำเร็จ!</p>
        </div>
      )}

      {/* Add / Edit Form Card */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              {editingUser ? "แก้ไขข้อมูลผู้ใช้งาน" : "เพิ่มผู้ใช้งานใหม่"}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ชื่อ-สกุล</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="สมชาย ใจดี"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">อีเมลผู้ใช้งาน</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="somchai@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">รหัสผ่านสำหรับเข้าใช้งาน</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="อย่างน้อย 6 หลัก"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ตำแหน่ง / บทบาท</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
              >
                <option value="owner">เจ้าของธุรกิจ</option>
                <option value="accountant">นักบัญชีในบริษัท</option>
                <option value="employee">พนักงาน</option>
                <option value="accounting_firm">สำนักงานบัญชี/นักบัญชีอิสระ</option>
                <option value="student">นักเรียน/นักศึกษา</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">สถานะผู้ใช้งาน</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={status === "active"}
                    onChange={() => setStatus("active")}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 mr-2"
                  />
                  ใช้งานอยู่ (Active)
                </label>
                <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={status === "inactive"}
                    onChange={() => setStatus("inactive")}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 mr-2"
                  />
                  ระงับการใช้งาน (Inactive)
                </label>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 pt-2 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                บันทึกผู้ใช้งาน
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">รายชื่อผู้ใช้งานทั้งหมด ({users.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="text-xs font-bold text-gray-500 uppercase bg-gray-50/70 border-b border-gray-100">
              <tr>
                <th className="py-3 px-6">ชื่อ-สกุล</th>
                <th className="py-3 px-6">อีเมล</th>
                <th className="py-3 px-6">ตำแหน่ง / บทบาท</th>
                <th className="py-3 px-6">สถานะ</th>
                <th className="py-3 px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    ไม่มีรายชื่อผู้ใช้งานในระบบ
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold uppercase">
                        {user.fullName.substring(0, 2)}
                      </div>
                      <div>
                        <p>{user.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-mono">PWD: {user.password ? "••••••••" : "ไม่ได้กำหนด"}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      <span className="text-xs text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                        {roleNames[user.role] || user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {user.status === "active" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <Check className="w-3 h-3 text-emerald-600" />
                          ใช้งานอยู่
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                          <X className="w-3 h-3 text-red-500" />
                          ระงับการใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditForm(user)}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="ลบผู้ใช้"
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
