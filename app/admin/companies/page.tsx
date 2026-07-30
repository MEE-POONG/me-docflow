"use client";

import { useState, useEffect } from "react";
import { 
  Building2, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  CheckCircle2, 
  Phone, 
  Mail, 
  ShieldCheck, 
  AlertCircle 
} from "lucide-react";

interface CompanyItem {
  id: string;
  companyName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  ownerEmail: string;
  isVerified?: boolean;
  isActive?: boolean; // Core system seed demo company (Melisara)
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  // Load companies
  useEffect(() => {
    const savedData = localStorage.getItem("me_docflow_companies");
    if (savedData) {
      try {
        setCompanies(JSON.parse(savedData));
      } catch (e) {
        console.error("Error parsing companies", e);
      }
    }
  }, []);

  const saveToLocalStorage = (updated: CompanyItem[], logMessage: string) => {
    setCompanies(updated);
    localStorage.setItem("me_docflow_companies", JSON.stringify(updated));

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

    // Dispatch event to sync sidebar and navbar
    window.dispatchEvent(new Event("activeCompanyChanged"));
  };

  const handleOpenEditForm = (company: CompanyItem) => {
    setEditingCompany(company);
    setCompanyName(company.companyName);
    setTaxId(company.taxId);
    setAddress(company.address);
    setPhone(company.phone);
    setEmail(company.email);
    setWebsite(company.website);
    setOwnerEmail(company.ownerEmail);
    setIsVerified(!!company.isVerified);
    setIsFormOpen(true);
  };

  const handleDeleteCompany = (id: string, name: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลบริษัท "${name}" ออกจากระบบถาวร?`)) {
      const updated = companies.filter((c) => c.id !== id);
      saveToLocalStorage(updated, `ลบข้อมูลบริษัท "${name}" (ID: ${id}) ออกจากระบบ`);
    }
  };

  const handleToggleVerify = (company: CompanyItem) => {
    const nextVerifyState = !company.isVerified;
    const updated = companies.map((c) => 
      c.id === company.id ? { ...c, isVerified: nextVerifyState } : c
    );
    const actionMsg = nextVerifyState 
      ? `กดยืนยันตัวตนบริษัท (Verify) "${company.companyName}" สำเร็จ` 
      : `ยกเลิกการยืนยันตัวตนบริษัท "${company.companyName}"`;
    saveToLocalStorage(updated, actionMsg);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !taxId || !address || !phone || !email || !ownerEmail) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (editingCompany) {
      const updated = companies.map((c) =>
        c.id === editingCompany.id
          ? { ...c, companyName, taxId, address, phone, email, website, ownerEmail, isVerified }
          : c
      );
      saveToLocalStorage(updated, `แก้ไขข้อมูลบริษัท "${companyName}" (เจ้าของ: ${ownerEmail})`);
    }

    setIsFormOpen(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Filtered companies based on search
  const filteredCompanies = companies.filter(c => 
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.taxId.includes(searchTerm) ||
    c.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">Company Administration</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-serif">จัดการบริษัทลูกค้า</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">ตรวจสอบ แก้ไขข้อมูล หรืออนุมัติการยืนยันความถูกต้องให้กับบริษัทลูกค้าทั้งหมดในระบบ</p>
      </div>

      {/* Toast Save Message */}
      {isSaved && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500 shrink-0" />
          <p className="text-sm font-semibold">อัปเดตข้อมูลบริษัทสำเร็จ!</p>
        </div>
      )}

      {/* Search and Stats bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="ค้นหาชื่อบริษัท เลขผู้เสียภาษี หรืออีเมลเจ้าของ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors duration-200"
          />
        </div>
        <div className="text-xs text-slate-550 dark:text-slate-400 font-medium">
          พบข้อมูลบริษัทในระบบทั้งหมด <span className="text-slate-800 dark:text-white font-bold">{filteredCompanies.length}</span> บริษัท
        </div>
      </div>

      {/* Edit Form Modal Card */}
      {isFormOpen && editingCompany && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 transition-colors duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Building2 className="w-5 h-5 text-amber-500" />
              แก้ไขข้อมูลบริษัทหลักระบบ (สิทธิ์ระดับแอดมิน)
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-605 dark:hover:text-white p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 font-sans">ชื่อบริษัท</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 font-sans">เลขผู้เสียภาษี (13 หลัก)</label>
                <input
                  type="text"
                  required
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 font-sans">อีเมลเจ้าของบัญชี (Owner Email)</label>
                <input
                  type="email"
                  required
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 font-sans">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white dark:bg-slate-955 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 font-sans">เว็บไซต์</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 font-sans">อีเมลบริษัท</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 font-sans">สถานะยืนยันตัวตนเอกสาร</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-sans select-none">
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={(e) => setIsVerified(e.target.checked)}
                      className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-950 rounded mr-2"
                    />
                    เปิดสถานะการอนุมัติ (Verified Company)
                  </label>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 font-sans">ที่อยู่</label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white dark:bg-slate-955 border border-gray-300 dark:border-slate-800 rounded-xl p-3 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-sans transition-colors duration-200"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-150 dark:border-slate-800 flex justify-end gap-2">
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

      {/* Companies List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-650 dark:text-slate-350">
            <thead className="text-gray-500 dark:text-slate-400 uppercase bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 font-bold">
              <tr>
                <th className="py-3.5 px-6">ข้อมูลบริษัท / ที่อยู่</th>
                <th className="py-3.5 px-6">เลขผู้เสียภาษี</th>
                <th className="py-3.5 px-6">ข้อมูลเจ้าของและติดต่อ</th>
                <th className="py-3.5 px-6">การรับรองระบบ</th>
                <th className="py-3.5 px-6 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-slate-800">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-slate-500">
                    ไม่พบข้อมูลบริษัทใดตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          company.isVerified ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-100 dark:border-amber-500/20" : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-700"
                        }`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-xs">{company.companyName}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs truncate mt-0.5" title={company.address}>
                            {company.address}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {company.taxId}
                    </td>
                    <td className="py-4 px-6 space-y-1 text-[11px] text-slate-500 dark:text-slate-450">
                      <div className="text-slate-850 dark:text-slate-200 font-semibold truncate max-w-[180px]">
                        Owner: {company.ownerEmail}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        {company.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        {company.email}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {company.isVerified ? (
                        <button
                          onClick={() => handleToggleVerify(company)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-550 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-2.5 py-1 rounded-full cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all font-sans"
                          title="คลิกเพื่อยกเลิกการยืนยัน"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleVerify(company)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2.5 py-1 rounded-full cursor-pointer hover:border-amber-300 dark:hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-500 hover:bg-amber-50/30 dark:hover:bg-amber-500/5 transition-all font-sans"
                          title="คลิกเพื่ออนุมัติการยืนยันตัวตน"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          Unverified
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditForm(company)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="แก้ไขข้อมูล (แอดมิน)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(company.id, company.companyName)}
                          disabled={company.isActive}
                          className={`p-2 rounded-lg transition-colors ${
                            company.isActive
                              ? "text-slate-200 dark:text-slate-800 cursor-not-allowed"
                              : "text-slate-400 dark:text-slate-500 hover:text-red-650 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                          }`}
                          title={company.isActive ? "ไม่สามารถลบบริษัทหลักของระบบได้" : "ลบข้อมูลบริษัท"}
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
