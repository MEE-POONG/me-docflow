"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Globe,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  UserCheck
} from "lucide-react";

interface CompanyItem {
  id: string;
  companyName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  isActive: boolean;
  ownerEmail: string; // To track ownership
}

export default function CompanySettingsPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null>(null);

  // Current logged in user details
  const [currentUserEmail, setCurrentUserEmail] = useState("melisara@siamretail.co.th");

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Load from localStorage or seed initial data
  useEffect(() => {
    const userStr = localStorage.getItem("me_docflow_current_user");
    let currentEmail = "melisara@siamretail.co.th";
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.email) {
          currentEmail = u.email;
          setCurrentUserEmail(u.email);
        }
      } catch (e) { }
    }

    const savedData = localStorage.getItem("me_docflow_companies");
    if (savedData) {
      try {
        const list = JSON.parse(savedData);
        const hasCompany = list.some((c: any) => c.ownerEmail === currentEmail);
        if (!hasCompany) {
          const newCompany = {
            id: Date.now().toString(),
            companyName: "บริษัท ของคุณ จำกัด",
            taxId: "",
            address: "",
            phone: "",
            email: currentEmail,
            website: "",
            isActive: true,
            ownerEmail: currentEmail
          };
          const updated = list.map((c: any) => ({ ...c, isActive: false })).concat(newCompany);
          setCompanies(updated);
          localStorage.setItem("me_docflow_companies", JSON.stringify(updated));
          window.dispatchEvent(new Event("activeCompanyChanged"));
        } else {
          setCompanies(list);
        }
      } catch (e) {
        console.error("Error parsing companies settings data", e);
      }
    } else {
      const initialCompanies: CompanyItem[] = [
        {
          id: "1",
          companyName: "บริษัท สยาม รีเทล จำกัด (มหาชน)",
          taxId: "0107536000010",
          address: "999/9 ถนนพระรามที่ 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร 10330",
          phone: "02-600-0000",
          email: "contact@siamretail.co.th",
          website: "www.siamretail.co.th",
          isActive: currentEmail === "melisara@siamretail.co.th",
          ownerEmail: "melisara@siamretail.co.th"
        }
      ];
      if (currentEmail !== "melisara@siamretail.co.th") {
        initialCompanies.push({
          id: Date.now().toString(),
          companyName: "บริษัท ของคุณ จำกัด",
          taxId: "",
          address: "",
          phone: "",
          email: currentEmail,
          website: "",
          isActive: true,
          ownerEmail: currentEmail
        });
      }
      setCompanies(initialCompanies);
      localStorage.setItem("me_docflow_companies", JSON.stringify(initialCompanies));
    }
  }, []);

  const saveToLocalStorage = (updatedCompanies: CompanyItem[]) => {
    setCompanies(updatedCompanies);
    localStorage.setItem("me_docflow_companies", JSON.stringify(updatedCompanies));
    // Dispatch event to sync sidebar and navbar
    window.dispatchEvent(new Event("activeCompanyChanged"));
  };

  const handleOpenAddForm = () => {
    setEditingCompany(null);
    setCompanyName("");
    setTaxId("");
    setAddress("");
    setPhone("");
    setEmail("");
    setWebsite("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (company: CompanyItem) => {
    if (company.ownerEmail !== currentUserEmail) {
      alert("คุณไม่มีสิทธิ์แก้ไขข้อมูลบริษัทนี้ เนื่องจากคุณไม่ใช่เจ้าของสิทธิ์ของบริษัทนี้");
      return;
    }
    setEditingCompany(company);
    setCompanyName(company.companyName);
    setTaxId(company.taxId);
    setAddress(company.address);
    setPhone(company.phone);
    setEmail(company.email);
    setWebsite(company.website);
    setIsFormOpen(true);
  };

  const handleDeleteCompany = (id: string) => {
    const target = companies.find((c) => c.id === id);
    if (!target) return;

    if (target.ownerEmail !== currentUserEmail) {
      alert("คุณไม่มีสิทธิ์ลบข้อมูลบริษัทนี้ เนื่องจากคุณไม่ใช่เจ้าของสิทธิ์ของบริษัทนี้");
      return;
    }

    if (target.isActive) {
      alert("ไม่สามารถลบบริษัทหลักที่กำลังเปิดใช้งานอยู่ได้ กรุณาสลับไปเปิดใช้บริษัทอื่นก่อนทำการลบ");
      return;
    }

    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลบริษัท "${target.companyName}"?`)) {
      const updated = companies.filter((c) => c.id !== id);
      saveToLocalStorage(updated);
    }
  };

  const handleSetActive = (id: string) => {
    const updated = companies.map((c) => ({
      ...c,
      isActive: c.id === id
    }));
    saveToLocalStorage(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !taxId || !address || !phone || !email) {
      alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    if (editingCompany) {
      // Edit mode (Preserve the original ownerEmail)
      const updated = companies.map((c) =>
        c.id === editingCompany.id
          ? { ...c, companyName, taxId, address, phone, email, website }
          : c
      );
      saveToLocalStorage(updated);
    } else {
      // Add mode (Automatically set current user as ownerEmail)
      const isFirstOwnCompany = companies.filter(c => c.ownerEmail === currentUserEmail).length === 0;
      const newCompany: CompanyItem = {
        id: Date.now().toString(),
        companyName,
        taxId,
        address,
        phone,
        email,
        website,
        isActive: isFirstOwnCompany,
        ownerEmail: currentUserEmail
      };

      let updatedList = [...companies];
      if (isFirstOwnCompany) {
        updatedList = updatedList.map(c => ({ ...c, isActive: false }));
      }
      saveToLocalStorage([...updatedList, newCompany]);
    }

    setIsFormOpen(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const userOwnCompanies = companies.filter(c => c.ownerEmail === currentUserEmail);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">การตั้งค่าระบบ</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-sans">จัดการข้อมูลบริษัท</h1>
          <p className="text-sm text-gray-500">เพิ่ม ลบ แก้ไขข้อมูลบริษัทสำหรับใช้ออกเอกสาร และสลับเปลี่ยนบริษัทที่ต้องการเปิดใช้งาน (จัดการได้เฉพาะบริษัทที่เป็นเจ้าของ)</p>
        </div>
        <div>
          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-5 rounded-xl shadow-md transition-colors cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            เพิ่มข้อมูลบริษัท
          </button>
        </div>
      </div>

      {/* Save Success Banner */}
      {isSaved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">บันทึกข้อมูลบริษัทสำเร็จ!</p>
        </div>
      )}

      {/* Add / Edit Form Card */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              {editingCompany ? "แก้ไขข้อมูลบริษัท" : "เพิ่มข้อมูลบริษัทใหม่"}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ชื่อบริษัท (ภาษาไทย)</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="เช่น บริษัท สยาม คอร์ปอเรชั่น จำกัด"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">เลขประจำตัวผู้เสียภาษี (13 หลัก)</label>
                <input
                  type="text"
                  required
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                  placeholder="เช่น 0107536000010"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="เช่น 02-123-4567"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">อีเมลติดต่อ</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="เช่น contact@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">เว็บไซต์</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="เช่น www.company.com"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ที่อยู่สำนักงานใหญ่</label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                  placeholder="เลขที่ หมู่ ตึก ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                บันทึกข้อมูลบริษัท
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Companies List Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">รายชื่อบริษัททั้งหมด ({userOwnCompanies.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="text-xs font-bold text-gray-500 uppercase bg-gray-50/70 border-b border-gray-100">
              <tr>
                <th className="py-3 px-6">ชื่อบริษัท</th>
                <th className="py-3 px-6">เลขประจำตัวผู้เสียภาษี</th>
                <th className="py-3 px-6">ข้อมูลติดต่อ</th>
                <th className="py-3 px-6">สถานะการใช้งาน</th>
                <th className="py-3 px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {userOwnCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    ไม่มีรายชื่อบริษัทในระบบ
                  </td>
                </tr>
              ) : (
                userOwnCompanies.map((company) => {
                  const isOwner = company.ownerEmail === currentUserEmail;
                  return (
                    <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-gray-900">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isOwner ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"
                            }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p>{company.companyName}</p>
                              {!isOwner && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
                                  <Lock className="w-2.5 h-2.5 text-gray-400" />
                                  สิทธิ์อ่านอย่างเดียว
                                </span>
                              )}
                              {isOwner && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  <UserCheck className="w-2.5 h-2.5 text-emerald-500" />
                                  บริษัทของคุณ
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium truncate max-w-xs">{company.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-gray-600">
                        {company.taxId}
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {company.phone}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {company.email}
                        </div>
                        {company.website && (
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-gray-400" />
                            {company.website}
                          </div>
                        )}
                        <div className="text-[10px] text-gray-400 font-mono">
                          เจ้าของ: {company.ownerEmail}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {company.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            กำลังเปิดใช้งานหลัก
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetActive(company.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-300 hover:border-emerald-500 hover:text-emerald-600 px-3 py-1.5 rounded-full transition-all cursor-pointer"
                          >
                            ตั้งเป็นบริษัทหลัก
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditForm(company)}
                            disabled={!isOwner}
                            className={`p-2 rounded-lg transition-colors ${isOwner
                                ? "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                : "text-gray-200 cursor-not-allowed"
                              }`}
                            title={isOwner ? "แก้ไขข้อมูล" : "คุณไม่มีสิทธิ์แก้ไขบริษัทอื่น"}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCompany(company.id)}
                            disabled={!isOwner || company.isActive}
                            className={`p-2 rounded-lg transition-colors ${isOwner && !company.isActive
                                ? "text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                : "text-gray-200 cursor-not-allowed"
                              }`}
                            title={
                              !isOwner
                                ? "คุณไม่มีสิทธิ์ลบบริษัทอื่น"
                                : company.isActive
                                  ? "ไม่สามารถลบบริษัทหลักได้"
                                  : "ลบข้อมูลบริษัท"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
