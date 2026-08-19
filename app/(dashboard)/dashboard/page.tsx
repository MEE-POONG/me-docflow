"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";
import { getDashboardData } from "./actions";

type DashboardData = NonNullable<Awaited<ReturnType<typeof getDashboardData>>>;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const userStr = localStorage.getItem("me_docflow_current_user");
      let email = "melisara@siamretail.co.th";
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u.email) email = u.email;
        } catch {}
      }
      try {
        const res = await getDashboardData(email);
        setData(res);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: 'เอกสารทั้งหมด', value: data.summary.totalDocs.toLocaleString() },
    { label: 'ฉบับร่าง', value: data.summary.drafts.toLocaleString() },
    { label: 'รออนุมัติ', value: data.summary.pending.toLocaleString() },
    { label: 'อนุมัติแล้ว', value: data.summary.approved.toLocaleString() },
    { label: 'ลูกค้า', value: data.summary.customers.toLocaleString() },
    { label: 'พนักงาน', value: data.summary.employees.toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Company Workspace</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-serif">Dashboard บริษัท</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">ภาพรวมเอกสาร ลูกค้า พนักงาน งานรออนุมัติ และกราฟเอกสารของบริษัท</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-6">กราฟจำนวนเอกสารรายเดือน</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip cursor={{fill: 'rgba(148, 163, 184, 0.12)'}} contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.2)' }} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-6">กราฟแยกตามหมวดหมู่เอกสาร</h3>
          <div className="space-y-5 mt-2">
            {data.categories.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">ยังไม่มีข้อมูลหมวดหมู่</p>
            ) : data.categories.map((cat, i: number) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{cat.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2.5">
                  <div 
                    className="bg-emerald-500 h-2.5 rounded-full" 
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Documents */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm lg:col-span-2 min-h-[300px] flex flex-col">
          <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-4">เอกสารล่าสุด</h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="text-[13px] text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-slate-800">
                <tr>
                  <th className="pb-3 font-medium">เลขเอกสาร</th>
                  <th className="pb-3 font-medium">ชื่อเอกสาร</th>
                  <th className="pb-3 font-medium">หมวดหมู่</th>
                  <th className="pb-3 font-medium">ประเภท</th>
                  <th className="pb-3 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {data.recentDocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-gray-400">
                      ไม่มีเอกสาร
                    </td>
                  </tr>
                ) : (
                  data.recentDocs.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-50 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 font-medium text-gray-900 dark:text-gray-100">{doc.documentNo}</td>
                      <td className="py-3">{doc.title}</td>
                      <td className="py-3">{doc.category?.name || '-'}</td>
                      <td className="py-3">{doc.documentType?.name || '-'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                      doc.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                          doc.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                          doc.status === 'DRAFT' ? 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400' :
                          'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm min-h-[300px] flex flex-col">
          <h3 className="text-[15px] font-bold text-gray-800 dark:text-white mb-4">งานที่รออนุมัติ ({data.pendingDocs.length})</h3>
          <div className="flex-1 flex flex-col">
            {data.pendingDocs.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">ไม่มีงานที่รออนุมัติ</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.pendingDocs.map((doc) => (
                  <div key={doc.id} className="p-3 border border-gray-100 dark:border-slate-800 rounded-lg hover:border-amber-200 dark:hover:border-amber-500/30 hover:bg-amber-50/50 dark:hover:bg-amber-500/5 cursor-pointer transition-colors">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{doc.documentNo}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.title}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(doc.createdAt).toLocaleDateString('th-TH')}</span>
                      <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">รอพิจารณา</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
