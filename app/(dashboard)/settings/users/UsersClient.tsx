"use client";

import { useState, useEffect, useRef } from "react";
import { getCompanyUsers, getCompanyUserDepartments, saveCompanyUser, deactivateCompanyUser } from './actions';
import { getDocumentActor } from '@/lib/document-actor';
import { normalizeLegacyCompanyRole } from '@/lib/company-user-roles';
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
  departmentId?: string | null;
  departmentName?: string | null;
  position?: string | null;
}

export default function UsersSettingsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string; positions: string[] }[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [position, setPosition] = useState('');
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
  const [adminPassword, setAdminPassword] = useState('');
  const [loadError, setLoadError] = useState('');
  const [departmentError, setDepartmentError] = useState('');
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const loadRequest = useRef(0);
  const availablePositions = departments.find(item => item.id === departmentId)?.positions || [];



  async function loadUsers() {
    const request = ++loadRequest.current;
    const actor = getDocumentActor();
    setUsers([]);
    setDepartments([]);
    setLoadError('');
    setDepartmentError('');
    setDepartmentsLoading(true);
    try {
      if (!actor.companyId || !actor.userEmail) throw new Error('กรุณาเลือกบริษัทและเข้าสู่ระบบก่อนจัดการผู้ใช้งาน');
      const [usersResult, departmentsResult] = await Promise.allSettled([getCompanyUsers(actor), getCompanyUserDepartments(actor)]);
      if (request !== loadRequest.current || getDocumentActor().companyId !== actor.companyId) return;
      if (departmentsResult.status === 'fulfilled') setDepartments(departmentsResult.value);
      else setDepartmentError('โหลดแผนกไม่สำเร็จ กรุณาลองโหลดรายชื่ออีกครั้ง');
      if (usersResult.status === 'rejected') throw usersResult.reason;
      const saved = usersResult.value;
      let legacy: any[] = [];
      try { legacy = JSON.parse(localStorage.getItem('me_docflow_users') || '[]'); } catch {}
      const pending = legacy.filter(user => user.companyId === actor.companyId && !saved.some(existing => existing.email.toLowerCase() === user.email?.toLowerCase()));
      setUsers([...saved, ...pending.map(user => ({ ...user, id: 'local-' + user.id, fullName: user.fullName || user.name }))]);
    } catch (error) {
      if (request !== loadRequest.current || getDocumentActor().companyId !== actor.companyId) return;
      setUsers([]); setLoadError(error instanceof Error ? error.message : 'โหลดผู้ใช้ไม่สำเร็จ');
    } finally {
      if (request === loadRequest.current) setDepartmentsLoading(false);
    }
  }
  useEffect(() => {
    void loadUsers();
    const handleCompanyChange = () => {
      setIsFormOpen(false);
      setEditingUser(null);
      setDepartmentId('');
      setPosition('');
      setPassword('');
      setAdminPassword('');
      setIsSaved(false);
      void loadUsers();
    };
    window.addEventListener('activeCompanyChanged', handleCompanyChange);
    return () => {
      ++loadRequest.current;
      window.removeEventListener('activeCompanyChanged', handleCompanyChange);
    };
  }, []);

  const handleOpenAddForm = () => {
    setEditingUser(null);
    setDepartmentId('');
    setPosition('');
    setAdminPassword('');
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
    setDepartmentId(user.departmentId || '');
    setPosition(user.position || '');
    setFullName(user.fullName);
    setAdminPassword('');
    setEmail(user.email);
    setRole(normalizeLegacyCompanyRole(user.role));
    setStatus(user.status);
    setPassword(user.id.startsWith('local-') ? user.password || "" : "");
    setShowPassword(false);
    setIsFormOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('ต้องการปิดใช้งานผู้ใช้นี้หรือไม่?')) return;
    const password = prompt('กรอกรหัสผ่านบัญชีผู้ดูแลเพื่อยืนยัน') || '';
    if (!password) return;
    const result = await deactivateCompanyUser(getDocumentActor(), id, password);
    if (!result.success) { alert(result.error); return; }
    await loadUsers();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const actor = getDocumentActor();
    try {
      const result = await saveCompanyUser(actor, { id: editingUser?.id, fullName, email, role, status, password, adminPassword, departmentId, position });
      if (getDocumentActor().companyId !== actor.companyId) return;
      if (!result.success || !result.user) throw new Error(result.error);
      if (result.user.email.toLowerCase() === actor.userEmail.toLowerCase() || editingUser?.email.toLowerCase() === actor.userEmail.toLowerCase()) {
        const current = JSON.parse(localStorage.getItem('me_docflow_current_user') || '{}');
        localStorage.setItem('me_docflow_current_user', JSON.stringify({ ...current, ...result.user }));
      }
      // Remove the browser-only copy after the authorized database save succeeds.
      const localUsers = JSON.parse(localStorage.getItem('me_docflow_users') || '[]');
      localStorage.setItem('me_docflow_users', JSON.stringify(localUsers.filter((user: any) => !(user.companyId === actor.companyId && user.email?.toLowerCase() === result.user!.email.toLowerCase()))));
      setIsFormOpen(false); setAdminPassword(''); setPassword(''); setIsSaved(true);
      await loadUsers();
    } catch (error) { alert(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      {loadError && <div role="alert" className="rounded bg-red-50 p-4 text-red-700">{loadError} <a href="/login" className="underline">เข้าสู่ระบบผู้ดูแล</a></div>}
      {users.some(user => user.id.startsWith('local-')) && <p className="rounded bg-amber-50 p-4 text-amber-800">พบผู้ใช้เดิมที่ยังอยู่เฉพาะในเบราว์เซอร์ กดแก้ไขและบันทึกแต่ละบัญชีเพื่อเพิ่มลงบริษัทจริง</p>}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">การตั้งค่าระบบ</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-sans">จัดการผู้ใช้งาน</h1>
          <p className="text-sm text-gray-500">เพิ่ม ลบ หรือแก้ไขข้อมูล สถานะการเข้าใช้งาน และรหัสผ่านของพนักงานภายในบริษัท</p>
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
            <label className="block text-sm font-semibold">รหัสผ่านบัญชีผู้ดูแลเพื่อยืนยันการบันทึก<input required autoComplete="current-password" type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="mt-1 w-full rounded border p-2" /></label>

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
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">รหัสผ่านสำหรับเข้าใช้งาน (แก้ไขผู้ใช้เดิม: เว้นว่างเพื่อใช้รหัสเดิม)</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required={!editingUser || editingUser.id.startsWith('local-')}
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
              <label htmlFor="user-department" className="block text-xs font-bold text-gray-700 uppercase mb-1">แผนก</label>
              <select id="user-department" disabled={departmentsLoading || !!departmentError} value={departmentId} onChange={e => { setDepartmentId(e.target.value); setPosition(''); }} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="">ยังไม่ระบุแผนก</option>
                {departmentId && !departments.some(item => item.id === departmentId) && <option value={departmentId} disabled>{editingUser?.departmentName || 'แผนกเดิม'} (ไม่เปิดใช้งาน กรุณาเลือกใหม่)</option>}
                {departments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              {departmentsLoading && <p className="mt-1 text-xs text-gray-500">กำลังโหลดแผนก...</p>}
              {departmentError && <p role="alert" className="mt-1 text-xs text-red-600">{departmentError}</p>}
              {!departmentsLoading && !departmentError && departments.length === 0 && <p className="mt-1 text-xs text-gray-500">ยังไม่มีแผนกที่เปิดใช้งาน <a href="/departments" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">เพิ่มแผนกของบริษัท</a></p>}
              <button type="button" onClick={() => void loadUsers()} className="mt-1 text-xs text-emerald-700 underline">โหลดรายชื่อแผนกใหม่</button>
            </div>

            <div>
              <label htmlFor="user-position" className="block text-xs font-bold text-gray-700 uppercase mb-1">ตำแหน่งงาน</label>
              <select id="user-position" disabled={!departmentId || departmentsLoading || !!departmentError} value={position} onChange={e => setPosition(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="">ยังไม่ระบุตำแหน่ง</option>
                {position && !availablePositions.includes(position) && <option value={position} disabled>{position} (ไม่ได้กำหนดในแผนก กรุณาเลือกใหม่)</option>}
                {availablePositions.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
              {!departmentId && <p className="mt-1 text-xs text-gray-500">เลือกแผนกก่อนเลือกตำแหน่งงาน</p>}
              {departmentId && !departmentsLoading && !departmentError && availablePositions.length === 0 && <p className="mt-1 text-xs text-amber-700">แผนกนี้ยังไม่ได้กำหนดตำแหน่ง กรุณาแก้ไขแผนกและเลือกตำแหน่งก่อน</p>}
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
                type="submit" disabled={saving}
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
                <th className="py-3 px-6">แผนก</th>
                <th className="py-3 px-6">ตำแหน่งงาน</th>
                <th className="py-3 px-6">สถานะ</th>
                <th className="py-3 px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
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
                    <td className="py-4 px-6">{user.departmentName || '-'}</td>
                    <td className="py-4 px-6">{user.position || '-'}</td>
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
