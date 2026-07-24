"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Trash2, Search, ShieldAlert, AlertTriangle, Info } from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  type: "info" | "warning" | "security";
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const loadLogs = () => {
    const saved = localStorage.getItem("me_docflow_audit_logs");
    if (saved) {
      try {
        setLogs(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearLogs = () => {
    if (confirm("คุณต้องการล้างประวัติกิจกรรมทั้งหมดในระบบใช่หรือไม่? (การกระทำนี้ไม่สามารถย้อนคืนได้)")) {
      localStorage.setItem("me_docflow_audit_logs", JSON.stringify([]));
      setLogs([]);
    }
  };

  // Filter logs based on search and type filter
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.timestamp.includes(searchTerm);
    const matchesType = filterType === "all" || log.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 font-light">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">Audit Trails</p>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-serif">บันทึกกิจกรรมระบบ</h1>
          <p className="text-sm text-slate-500">ตรวจสอบและสืบค้นประวัติกิจกรรม กิจกรรมความปลอดภัย และประวัติธุรกรรมทั้งหมดของแอปพลิเคชัน</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadLogs}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-gray-200 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer font-sans"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            โหลดประวัติใหม่
          </button>
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer font-sans"
          >
            <Trash2 className="w-3.5 h-3.5" />
            ล้างประวัติ
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="ค้นหาข้อความกิจกรรม หรือบัญชีผู้กระทำ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {/* Filter type buttons */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: "all", label: "ทั้งหมด" },
            { id: "info", label: "ทั่วไป (Info)" },
            { id: "warning", label: "คำเตือน (Warning)" },
            { id: "security", label: "ความปลอดภัย (Security)" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-semibold font-sans border ${
                filterType === type.id
                  ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm"
                  : "bg-gray-50 text-slate-600 hover:text-slate-900 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs List Container */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-650">
            <thead className="text-gray-500 uppercase bg-gray-50 border-b border-gray-200 font-bold">
              <tr>
                <th className="py-3.5 px-6">ระดับความสำคัญ</th>
                <th className="py-3.5 px-6">เวลาเหตุการณ์</th>
                <th className="py-3.5 px-6">บัญชีผู้กระทำ</th>
                <th className="py-3.5 px-6">กิจกรรม / คำสั่งประมวลผล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-450 font-sans">
                    ไม่พบบันทึกกิจกรรมตามเงื่อนไขที่กำหนด
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6">
                      {log.type === "security" ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full font-sans">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-550" />
                          Security
                        </span>
                      ) : log.type === "warning" ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full font-sans">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-550" />
                          Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-sans">
                          <Info className="w-3.5 h-3.5 text-slate-500" />
                          Info
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-550 text-xs">
                      {log.timestamp}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900 text-xs">
                      {log.user}
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs font-sans font-light">
                      {log.action}
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
