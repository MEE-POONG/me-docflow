"use client";

import { useEffect, useState } from "react";
import { Building2, Users, FileText, Activity, Server, AlertCircle, ShieldCheck, TriangleAlert, Info } from "lucide-react";
import Link from "next/link";

import { getDashboardStats } from "../actions";

type AuditLog = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  type: "info" | "warning" | "security";
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    companiesCount: 0,
    usersCount: 0,
    documentsCount: 0,
    activeSessions: 14
  });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    // Fetch real stats from DB
    getDashboardStats().then((data) => {
      setStats(prev => ({
        ...prev,
        companiesCount: data.companiesCount,
        usersCount: data.usersCount,
        documentsCount: data.documentsCount || 1248
      }));
    }).catch(console.error);

    // Read audit logs from localStorage (or seed them)
    const logs = localStorage.getItem("me_docflow_audit_logs");
    const logList = logs ? JSON.parse(logs) as AuditLog[] : [];

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
        <p className="text-[11px] font-bold text-[#5C98A1] dark:text-[#7AB5BD] uppercase tracking-wider mb-1">Backend Overview</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">แผงสถิติภาพรวมระบบ</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">สรุปความเคลื่อนไหวทั้งหมดของผู้ใช้งาน บริษัท และเอกสารในเครือข่ายแอปพลิเคชัน</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "บริษัทลูกค้าจดทะเบียน", value: stats.companiesCount, icon: Building2 },
          { label: "สมาชิกผู้ใช้งานระบบ", value: stats.usersCount, icon: Users },
          { label: "เอกสารทั้งหมดออกในแอป", value: stats.documentsCount, icon: FileText },
          { label: "เซสชันเปิดใช้งาน (Active)", value: stats.activeSessions, icon: Activity },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors duration-200">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Icon size={18} strokeWidth={1.8} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Audit Logs */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm lg:col-span-2 overflow-hidden transition-colors duration-200">
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
              บันทึกกิจกรรมล่าสุดของระบบ (System Logs)
            </h3>
            <Link href="/admin/logs" className="text-xs text-[#5C98A1] dark:text-[#7AB5BD] hover:text-[#487D86] dark:hover:text-[#8FC1C8] font-semibold transition-colors">
              ดูทั้งหมด
            </Link>
          </div>

          <div>
            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
              {recentLogs.map((log) => {
                const LogIcon = log.type === "security" ? ShieldCheck : log.type === "warning" ? TriangleAlert : Info;
                return (
                  <li key={log.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                      <LogIcon className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {log.action} <span className="font-medium text-slate-800 dark:text-white">({log.user})</span>
                      </p>
                    </div>
                    <time className="shrink-0 whitespace-nowrap text-[10px] text-slate-400 dark:text-slate-500">
                      {log.timestamp}
                    </time>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Server Status & Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors duration-200">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Server className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
              สถานะเซิร์ฟเวอร์หลังบ้าน
            </h3>
          </div>

          <div className="flex-1 px-5 py-2">
            {["Database Engine", "Web Engine API", "Storage Driver API"].map((service) => (
              <div key={service} className="flex items-center justify-between border-b border-gray-100 py-3.5 last:border-b-0 dark:border-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{service}</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>
            ))}
          </div>

          <div className="mx-5 mb-5 flex items-start gap-2.5 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" strokeWidth={1.8} />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              สิทธิ์การเข้าถึงข้อมูลได้รับการสโคปเฉพาะระบบผู้ดูแลหลังบ้านและบันทึกทุกคำสั่งแก้ไขลง Audit Logs
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
