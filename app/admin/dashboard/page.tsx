"use client";

import { useEffect, useState } from "react";
import { Building2, Users, FileText, Activity, Server, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    companiesCount: 0,
    usersCount: 0,
    documentsCount: 1248,
    activeSessions: 14
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    // Read stats from localStorage
    const companies = localStorage.getItem("me_docflow_companies");
    const users = localStorage.getItem("me_docflow_users");
    const logs = localStorage.getItem("me_docflow_audit_logs");

    const compList = companies ? JSON.parse(companies) : [];
    const userList = users ? JSON.parse(users) : [];
    const logList = logs ? JSON.parse(logs) : [];

    setStats(prev => ({
      ...prev,
      companiesCount: compList.length || 2,
      usersCount: userList.length || 3
    }));

    if (logList.length > 0) {
      setRecentLogs(logList.slice(0, 5));
    } else {
      // Seed default logs
      const defaultLogs = [
        { id: "1", timestamp: new Date(Date.now() - 60000 * 5).toLocaleString(), user: "melisara@siamretail.co.th", action: "ล็อกอินเข้าสู่บริษัท สยาม รีเทล จำกัด", type: "info" },
        { id: "2", timestamp: new Date(Date.now() - 60000 * 20).toLocaleString(), user: "somchai@siamretail.co.th", action: "อัปเดตรหัสผ่านส่วนบุคคล", type: "warning" },
        { id: "3", timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString(), user: "system@medocflow.com", action: "สลับการตั้งค่าพ่วงปี/เดือนสำหรับเลขเอกสารใบเสนอราคา (QT)", type: "info" },
        { id: "4", timestamp: new Date(Date.now() - 3600000 * 4).toLocaleString(), user: "admin", action: "เข้าสู่ระบบและเริ่มเซสชันผู้ดูแลระบบหลังบ้าน", type: "security" }
      ];
      setRecentLogs(defaultLogs);
      localStorage.setItem("me_docflow_audit_logs", JSON.stringify(defaultLogs));
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">Backend Overview</p>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 font-serif">แผงสถิติภาพรวมระบบ</h1>
        <p className="text-sm text-slate-500">สรุปความเคลื่อนไหวทั้งหมดของผู้ใช้งาน บริษัท และเอกสารในเครือข่ายแอปพลิเคชัน</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "บริษัทลูกค้าจดทะเบียน", value: stats.companiesCount, icon: Building2, color: "text-amber-600 bg-amber-50 border border-amber-100" },
          { label: "สมาชิกผู้ใช้งานระบบ", value: stats.usersCount, icon: Users, color: "text-emerald-600 bg-emerald-50 border border-emerald-100" },
          { label: "เอกสารทั้งหมดออกในแอป", value: stats.documentsCount, icon: FileText, color: "text-blue-600 bg-blue-50 border border-blue-100" },
          { label: "เซสชันเปิดใช้งาน (Active)", value: stats.activeSessions, icon: Activity, color: "text-rose-600 bg-rose-50 border border-rose-100" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-550 font-medium mb-1">{stat.label}</p>
                <p className="text-3xl font-extrabold text-slate-900 font-sans">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Audit Logs */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Activity className="w-5 h-5 text-amber-550" />
              บันทึกกิจกรรมล่าสุดของระบบ (System Logs)
            </h3>
            <Link href="/admin/logs" className="text-xs text-amber-600 hover:text-amber-700 font-semibold transition-colors">
              ดูทั้งหมด
            </Link>
          </div>
          
          <div className="flow-root">
            <ul className="-mb-8">
              {recentLogs.map((log, idx) => (
                <li key={log.id}>
                  <div className="relative pb-8">
                    {idx !== recentLogs.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-150" aria-hidden="true"></span>
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white text-slate-900 font-bold ${
                          log.type === "security" ? "bg-amber-100 text-amber-700 border border-amber-200" : log.type === "warning" ? "bg-rose-100 text-rose-700 border border-rose-200" : "bg-slate-100 text-slate-650"
                        }`}>
                          {log.type === "security" ? "🔐" : log.type === "warning" ? "⚠️" : "ℹ️"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-xs text-slate-600">
                            {log.action} <span className="font-semibold text-slate-800">({log.user})</span>
                          </p>
                        </div>
                        <div className="text-right text-[10px] whitespace-nowrap text-slate-400 font-mono">
                          {log.timestamp}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Server Status & Controls */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Server className="w-5 h-5 text-amber-550" />
              สถานะเซิร์ฟเวอร์หลังบ้าน
            </h3>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-3 py-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-150">
              <span className="text-xs text-slate-500 font-medium">Database Engine</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-150">
              <span className="text-xs text-slate-500 font-medium">Web Engine API</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-150">
              <span className="text-xs text-slate-500 font-medium">Storage Driver API</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                Online
              </span>
            </div>
          </div>

          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 leading-tight">
              สิทธิ์การเข้าถึงข้อมูลได้รับการสโคปเฉพาะระบบผู้ดูแลหลังบ้านและบันทึกทุกคำสั่งแก้ไขลง Audit Logs
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
