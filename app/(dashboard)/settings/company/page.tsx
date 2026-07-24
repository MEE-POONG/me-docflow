"use client";

import { useState, useEffect } from "react";
import { Building2, Save, FileText, Phone, Mail, Globe, CheckCircle2 } from "lucide-react";

export default function CompanySettingsPage() {
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("me_docflow_company_settings");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCompanyName(parsed.companyName || "");
        setTaxId(parsed.taxId || "");
        setAddress(parsed.address || "");
        setPhone(parsed.phone || "");
        setEmail(parsed.email || "");
        setWebsite(parsed.website || "");
      } catch (e) {
        console.error("Error parsing saved company settings data", e);
      }
    } else {
      // Default initial values
      setCompanyName("บริษัท สยาม รีเทล จำกัด (มหาชน)");
      setTaxId("0107536000010");
      setAddress("999/9 ถนนพระรามที่ 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร 10330");
      setPhone("02-600-0000");
      setEmail("contact@siamretail.co.th");
      setWebsite("www.siamretail.co.th");
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      companyName,
      taxId,
      address,
      phone,
      email,
      website
    };
    localStorage.setItem("me_docflow_company_settings", JSON.stringify(dataToSave));
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">การตั้งค่าระบบ</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">ตั้งค่าข้อมูลบริษัท</h1>
        <p className="text-sm text-gray-500">จัดการข้อมูลทั่วไปของบริษัทสำหรับใช้ออกเอกสารบัญชีและการติดต่อลูกค้า</p>
      </div>

      {/* Save Success Banner */}
      {isSaved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold">บันทึกข้อมูลเรียบร้อยแล้ว!</p>
            <p className="text-xs text-emerald-600">ข้อมูลบริษัทได้รับการอัปเดตในระบบสำเร็จ</p>
          </div>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">ข้อมูลทั่วไป</h3>
            <p className="text-xs text-gray-500">กรอกข้อมูลอย่างถูกต้องเพื่อความถูกต้องทางกฎหมายภาษี</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Company Name */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อบริษัท (ภาษาไทย)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                  placeholder="เช่น บริษัท ของคุณ จำกัด"
                />
              </div>
            </div>

            {/* Tax ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                  placeholder="เช่น 0123456789012"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">เบอร์โทรศัพท์ติดต่อ</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                  placeholder="เช่น 02-123-4567"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">อีเมลติดต่อบริษัท</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                  placeholder="เช่น billing@company.com"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">เว็บไซต์บริษัท</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="appearance-none block w-full pl-11 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                  placeholder="เช่น www.company.com"
                />
              </div>
            </div>

            {/* Address */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">ที่อยู่สำนักงานใหญ่</label>
              <textarea
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all resize-none"
                placeholder="เลขที่ หมู่ ตึก ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
              />
            </div>

          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              บันทึกข้อมูลบริษัท
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
