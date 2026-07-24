"use client";

import { useState, useEffect } from "react";
import { 
  Package, 
  Search, 
  Edit2, 
  X, 
  Save, 
  CheckCircle2, 
  DollarSign, 
  Users, 
  FileText, 
  HardDrive 
} from "lucide-react";

interface PackageItem {
  id: string;
  name: string;
  price: number;
  billing: string;
  maxUsers: string;
  maxDocs: string;
  maxStorage: string;
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [billing, setBilling] = useState("เดือน");
  const [maxUsers, setMaxUsers] = useState("");
  const [maxDocs, setMaxDocs] = useState("");
  const [maxStorage, setMaxStorage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("me_docflow_packages");
    if (saved) {
      try {
        setPackages(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      const initial: PackageItem[] = [
        { id: "1", name: "Free Trial (ทดลองใช้)", price: 0, billing: "เดือน", maxUsers: "3 คน", maxDocs: "50 ฉบับ", maxStorage: "1 GB" },
        { id: "2", name: "SME Standard (แพ็กเกจเริ่มต้น)", price: 499, billing: "เดือน", maxUsers: "10 คน", maxDocs: "500 ฉบับ", maxStorage: "5 GB" },
        { id: "3", name: "Corporate Premium (แพ็กเกจยอดนิยม)", price: 1290, billing: "เดือน", maxUsers: "30 คน", maxDocs: "3,000 ฉบับ", maxStorage: "20 GB" },
        { id: "4", name: "Enterprise Custom (ปรับแต่งตามใจ)", price: 4990, billing: "เดือน", maxUsers: "ไม่จำกัด", maxDocs: "ไม่จำกัด", maxStorage: "100 GB" },
      ];
      setPackages(initial);
      localStorage.setItem("me_docflow_packages", JSON.stringify(initial));
    }
  }, []);

  const saveToLocalStorage = (updated: PackageItem[], actionMsg: string) => {
    setPackages(updated);
    localStorage.setItem("me_docflow_packages", JSON.stringify(updated));

    // Audit log
    const logs = localStorage.getItem("me_docflow_audit_logs");
    const currentLogs = logs ? JSON.parse(logs) : [];
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      user: "System Admin (admin)",
      action: actionMsg,
      type: "info"
    };
    localStorage.setItem("me_docflow_audit_logs", JSON.stringify([newLog, ...currentLogs]));
  };

  const handleOpenEdit = (pkg: PackageItem) => {
    setEditingPackage(pkg);
    setName(pkg.name);
    setPrice(pkg.price);
    setBilling(pkg.billing);
    setMaxUsers(pkg.maxUsers);
    setMaxDocs(pkg.maxDocs);
    setMaxStorage(pkg.maxStorage);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingPackage) {
      const updated = packages.map(p => 
        p.id === editingPackage.id 
          ? { ...p, name, price: Number(price), billing, maxUsers, maxDocs, maxStorage } 
          : p
      );
      saveToLocalStorage(updated, `อัปเดตข้อมูลแพ็กเกจบริการ "${name}" ราคา ${price} บาท/เดือน`);
    }

    setIsFormOpen(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 font-light">
      <div>
        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">Pricing Configuration</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-serif">จัดการแพ็กเกจระบบ</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">แก้ไขข้อมูลราคา ลิมิตจำนวนผู้ใช้ พื้นที่จัดเก็บเอกสาร และรายละเอียดสิทธิพิเศษของแต่ละแพ็กเกจ</p>
      </div>

      {isSaved && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          <p className="text-sm font-semibold">อัปเดตรายละเอียดแพ็กเกจระบบสำเร็จ!</p>
        </div>
      )}

      {isFormOpen && editingPackage && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 transition-colors duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-slate-850">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Package className="w-5 h-5 text-amber-550" />
              แก้ไขรายละเอียดแผนบริการ (แอดมิน)
            </h3>
            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 font-sans">ชื่อแพ็กเกจแผนงาน</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 font-sans">ราคาขายต่อเดือน (THB)</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-955 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 font-sans">ขีดจำกัดผู้ใช้ระบบ (Max Users)</label>
                <input
                  type="text"
                  required
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
                  placeholder="เช่น 10 คน"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 font-sans">โควตาเอกสารต่อเดือน (Max Docs)</label>
                <input
                  type="text"
                  required
                  value={maxDocs}
                  onChange={(e) => setMaxDocs(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
                  placeholder="เช่น 500 ฉบับ"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase mb-1.5 font-sans">พื้นที่คลาวด์จัดเก็บ (Max Storage)</label>
                <input
                  type="text"
                  required
                  value={maxStorage}
                  onChange={(e) => setMaxStorage(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
                  placeholder="เช่น 20 GB"
                />
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
                บันทึกการปรับแพ็กเกจ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Package Listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-amber-300 dark:hover:border-amber-500/50 transition-all shadow-sm duration-200">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-100 dark:border-amber-500/20">
                  <Package className="w-5 h-5" />
                </span>
                <button 
                  onClick={() => handleOpenEdit(pkg)}
                  className="p-1.5 text-slate-400 dark:text-slate-550 hover:text-slate-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 pt-1">{pkg.name}</h3>
              <div className="flex items-baseline gap-1 pt-1 font-sans">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{pkg.price.toLocaleString()}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">บาท / {pkg.billing}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-slate-800 pt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-550" />
                <span>จำกัดพนักงาน: <strong className="text-slate-800 dark:text-slate-205">{pkg.maxUsers}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-550" />
                <span>จำนวนเอกสาร/เดือน: <strong className="text-slate-800 dark:text-slate-200">{pkg.maxDocs}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-slate-400 dark:text-slate-550" />
                <span>พื้นที่เก็บ: <strong className="text-slate-800 dark:text-slate-200">{pkg.maxStorage}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
