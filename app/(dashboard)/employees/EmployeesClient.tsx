'use client';

import { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, X, Search, Loader2 } from 'lucide-react';
import { createEmployee, updateEmployee, deleteEmployee } from './actions';

// Types matched to schema and actions
type Department = {
  id: string;
  name: string;
};

type Employee = {
  id: string;
  code: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  departmentId: string | null;
  department: Department | null;
  salarySatang: number | null;
  startDate: Date | null;
  endDate: Date | null;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DELETED';
};

export default function EmployeesClient({ 
  initialEmployees, 
  departments 
}: { 
  initialEmployees: Employee[];
  departments: Department[];
}) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    departmentId: '',
    salaryBaht: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DELETED',
  });

  // Derived filtered list
  const filteredEmployees = employees.filter(emp => {
    const searchMatch = (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (emp.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (emp.position || '').toLowerCase().includes(searchQuery.toLowerCase());
    const deptMatch = filterDepartment === 'ALL' || emp.departmentId === filterDepartment;
    const statusMatch = filterStatus === 'ALL' || emp.status === filterStatus;
    return searchMatch && deptMatch && statusMatch;
  });

  const formatDateString = (date?: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const handleOpenModal = (emp?: Employee) => {
    if (emp) {
      setEditingId(emp.id);
      setFormData({
        code: emp.code || '',
        name: emp.name,
        email: emp.email || '',
        phone: emp.phone || '',
        position: emp.position || '',
        departmentId: emp.departmentId || '',
        salaryBaht: emp.salarySatang ? (emp.salarySatang / 100).toString() : '',
        startDate: formatDateString(emp.startDate),
        endDate: formatDateString(emp.endDate),
        status: emp.status,
      });
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        name: '',
        email: '',
        phone: '',
        position: '',
        departmentId: '',
        salaryBaht: '',
        startDate: '',
        endDate: '',
        status: 'ACTIVE',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const { salaryBaht, ...restFormData } = formData;
        const payload = {
          ...restFormData,
          salarySatang: salaryBaht ? Math.round(parseFloat(salaryBaht) * 100) : undefined,
          startDate: restFormData.startDate ? new Date(restFormData.startDate) : null,
          endDate: restFormData.endDate ? new Date(restFormData.endDate) : null,
          departmentId: restFormData.departmentId || undefined,
        };

        if (editingId) {
          await updateEmployee(editingId, payload);
        } else {
          await createEmployee(payload);
        }
        window.location.reload();
      } catch (error) {
        console.error('Failed to save employee', error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) {
      startTransition(async () => {
        try {
          await deleteEmployee(id);
          setEmployees(employees.filter(e => e.id !== id));
        } catch (error) {
          console.error('Failed to delete employee', error);
        }
      });
    }
  };

  // Helper for formatting date to Thai display
  const formatDisplayDate = (date: Date | null | string) => {
    if (!date) return '-';
    const d = new Date(date);
    return new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  };

  const formatCurrency = (satang: number | null) => {
    if (satang === null || satang === undefined) return '-';
    return '฿' + (satang / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto py-8">
      
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs font-bold text-teal-700 tracking-wider mb-1">
          COMPANY WORKSPACE
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          พนักงาน
        </h1>
        <p className="text-sm text-gray-500">
          จัดการข้อมูลพนักงาน แผนก สถานะ และเอกสารที่เกี่ยวข้อง
        </p>
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> เพิ่มพนักงาน
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัส, ตำแหน่ง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-colors"
            />
          </div>
          
          <select 
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white focus:outline-none focus:border-gray-300"
          >
            <option value="ALL">ทุกแผนก</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white focus:outline-none focus:border-gray-300"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INVITED">INVITED</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="DELETED">DELETED</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-gray-500 font-medium">
              <tr>
                <th className="px-5 py-4 font-normal">รหัส</th>
                <th className="px-5 py-4 font-normal">ชื่อ-นามสกุล</th>
                <th className="px-5 py-4 font-normal">อีเมล</th>
                <th className="px-5 py-4 font-normal">เบอร์โทร</th>
                <th className="px-5 py-4 font-normal">ตำแหน่ง</th>
                <th className="px-5 py-4 font-normal">แผนก</th>
                <th className="px-5 py-4 font-normal">เงินเดือน</th>
                <th className="px-5 py-4 font-normal">เริ่มงาน</th>
                <th className="px-5 py-4 font-normal">ลาออก</th>
                <th className="px-5 py-4 font-normal">สถานะ</th>
                <th className="px-5 py-4 font-normal text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-400">
                    ไม่พบข้อมูลพนักงาน
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 text-gray-500">{emp.code || '-'}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{emp.name}</td>
                    <td className="px-5 py-3 text-gray-500">{emp.email || '-'}</td>
                    <td className="px-5 py-3 text-gray-500">{emp.phone || '-'}</td>
                    <td className="px-5 py-3 text-gray-500">{emp.position || '-'}</td>
                    <td className="px-5 py-3 text-gray-500">{emp.department?.name || '-'}</td>
                    <td className="px-5 py-3 text-gray-500">{formatCurrency(emp.salarySatang)}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDisplayDate(emp.startDate)}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDisplayDate(emp.endDate)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        emp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                        emp.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-700' :
                        emp.status === 'DELETED' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(emp)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded text-xs text-teal-600 hover:bg-teal-50 transition-colors font-medium"
                        >
                          <Edit2 className="w-3 h-3" /> แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded text-xs text-red-500 hover:bg-red-50 transition-colors font-medium"
                        >
                          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} ลบ
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

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">รหัสพนักงาน</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors text-sm text-gray-700"
                    placeholder="EMP-006"
                  />
                </div>
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">ชื่อ-นามสกุล *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors text-sm text-gray-700"
                    placeholder="กรอกชื่อ นามสกุล"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">อีเมล</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors text-sm text-gray-700"
                    placeholder="name@example.com"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors text-sm text-gray-700"
                    placeholder="081-xxx-xxxx"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors text-sm text-gray-700"
                    placeholder="เช่น Senior Accountant"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">แผนก</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors text-sm bg-white text-gray-700"
                  >
                    <option value="">เลือกแผนก</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">เงินเดือน (บาท)</label>
                  <input
                    type="number"
                    value={formData.salaryBaht}
                    onChange={(e) => setFormData({ ...formData, salaryBaht: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors text-sm text-gray-700"
                    placeholder="เช่น 55000"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">สถานะ</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DELETED' })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors text-sm bg-white text-gray-700"
                  >
                    <option value="ACTIVE">ACTIVE (ปกติ)</option>
                    <option value="INVITED">INVITED (รอตอบรับ)</option>
                    <option value="SUSPENDED">SUSPENDED (ระงับชั่วคราว)</option>
                    <option value="DELETED">DELETED (ลบ)</option>
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">วันที่เริ่มงาน</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors text-sm text-gray-700"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">วันที่ลาออก (ถ้ามี)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors text-sm text-gray-700"
                  />
                </div>

              </div>

              <div className="pt-6 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
