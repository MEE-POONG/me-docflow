'use client';

import { useState, useTransition, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, Loader2 } from 'lucide-react';
import { createEmployee, updateEmployee, deleteEmployee, getEmployees } from './actions';
import { useLanguage } from '@/lib/i18n/LanguageContext';

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const { t } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  useEffect(() => {
    const fetchMyEmployees = async () => {
      const userStr = localStorage.getItem("me_docflow_current_user");
      let currentEmail = "melisara@siamretail.co.th";
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u.email) currentEmail = u.email;
        } catch (e) {}
      }
      try {
        const myEmps = await getEmployees(currentEmail);
        setEmployees(myEmps as any);
      } catch (err) {
        setEmployees(initialEmployees);
      }
    };
    fetchMyEmployees();
  }, [initialEmployees]);
  
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

        const userStr = localStorage.getItem("me_docflow_current_user");
        let currentEmail = "melisara@siamretail.co.th";
        if (userStr) {
          try {
            const u = JSON.parse(userStr);
            if (u.email) currentEmail = u.email;
          } catch (e) {}
        }

        if (editingId) {
          await updateEmployee(editingId, currentEmail, { ...payload, employeeEmail: payload.email });
        } else {
          await createEmployee(currentEmail, { ...payload, employeeEmail: payload.email });
        }
        
        // Refetch employees after mutation to update the list locally
        const myEmps = await getEmployees(currentEmail);
        setEmployees(myEmps as any);
        
        setIsModalOpen(false);
      } catch (error) {
        console.error('Failed to save employee', error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm(t.employees.confirmDelete)) {
      startTransition(async () => {
        try {
          const userStr = localStorage.getItem("me_docflow_current_user");
          let currentEmail = "melisara@siamretail.co.th";
          if (userStr) {
            try {
              const u = JSON.parse(userStr);
              if (u.email) currentEmail = u.email;
            } catch (e) {}
          }
          await deleteEmployee(id, currentEmail);
          
          const myEmps = await getEmployees(currentEmail);
          setEmployees(myEmps as any);
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
        <div className="text-xs font-bold text-teal-700 dark:text-teal-500 tracking-wider mb-1">
          {t.common.companyWorkspace}
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
          {t.employees.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.employees.subtitle}
        </p>
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> {t.employees.addEmployee}
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 flex flex-wrap items-center gap-3 transition-colors">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.employees.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:border-gray-300 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-600 transition-colors"
            />
          </div>
          
          <select 
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-300 dark:focus:border-gray-500 transition-colors"
          >
            <option value="ALL">{t.employees.allDepartments}</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-300 dark:focus:border-gray-500 transition-colors"
          >
            <option value="ALL">{t.common.allStatus}</option>
            <option value="ACTIVE">{t.employees.statusActive}</option>
            <option value="INVITED">{t.employees.statusInvited}</option>
            <option value="SUSPENDED">{t.employees.statusSuspended}</option>
            <option value="DELETED">{t.employees.statusDeleted}</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-3 py-3 font-normal whitespace-nowrap">{t.employees.colCode}</th>
                <th className="px-3 py-3 font-normal">{t.employees.colName}</th>
                <th className="px-3 py-3 font-normal">{t.employees.colEmail}</th>
                <th className="px-3 py-3 font-normal whitespace-nowrap">{t.employees.colPhone}</th>
                <th className="px-3 py-3 font-normal">{t.employees.colPosition}</th>
                <th className="px-3 py-3 font-normal">{t.employees.colDepartment}</th>
                <th className="px-3 py-3 font-normal whitespace-nowrap">{t.employees.colSalary}</th>
                <th className="px-3 py-3 font-normal whitespace-nowrap">{t.employees.colStartDate}</th>
                <th className="px-3 py-3 font-normal whitespace-nowrap">{t.employees.colEndDate}</th>
                <th className="px-3 py-3 font-normal whitespace-nowrap">{t.common.status}</th>
                <th className="px-3 py-3 font-normal text-right whitespace-nowrap">{t.common.manage}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-gray-400 dark:text-gray-500">
                    {t.employees.empty}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{emp.code || '-'}</td>
                    <td className="px-3 py-3 font-medium text-gray-900 dark:text-white min-w-[120px]">{emp.name}</td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 break-all min-w-[140px]">{emp.email || '-'}</td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{emp.phone || '-'}</td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 min-w-[100px]">{emp.position || '-'}</td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 min-w-[100px]">{emp.department?.name || '-'}</td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatCurrency(emp.salarySatang)}</td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDisplayDate(emp.startDate)}</td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDisplayDate(emp.endDate)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        emp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                        emp.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        emp.status === 'DELETED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenModal(emp)}
                          className="flex items-center gap-1.5 px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-xs text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors font-medium"
                        >
                          <Edit2 className="w-3 h-3" /> {t.common.edit}
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="flex items-center gap-1.5 px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-medium"
                        >
                          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} {t.common.delete}
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                {editingId ? t.employees.modalEditTitle : t.employees.modalAddTitle}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.employees.formCode}</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                    placeholder="EMP-006"
                  />
                </div>
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.employees.formName}</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                    placeholder="กรอกชื่อ นามสกุล"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.employees.formEmail}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                    placeholder="name@example.com"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.employees.formPhone}</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                    placeholder="081-xxx-xxxx"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.employees.formPosition}</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                    placeholder="เช่น Senior Accountant"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.employees.formDepartment}</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 transition-colors text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                  >
                    <option value="">{t.employees.selectDepartment}</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.employees.formSalary}</label>
                  <input
                    type="number"
                    value={formData.salaryBaht}
                    onChange={(e) => setFormData({ ...formData, salaryBaht: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                    placeholder="เช่น 55000"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.employees.formStatus}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DELETED' })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 transition-colors text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                  >
                    <option value="ACTIVE">{t.employees.statusActive}</option>
                    <option value="INVITED">{t.employees.statusInvited}</option>
                    <option value="SUSPENDED">{t.employees.statusSuspended}</option>
                    <option value="DELETED">{t.employees.statusDeleted}</option>
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.employees.formStartDate}</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.employees.formEndDate}</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  />
                </div>

              </div>

              <div className="pt-6 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                >
                  {t.employees.btnCancel}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? t.employees.btnSave : t.employees.btnAdd}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
