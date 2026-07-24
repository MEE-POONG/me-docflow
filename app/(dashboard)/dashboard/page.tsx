"use client";

import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";

const chartData = [
  { name: 'Jan', value: 40 },
  { name: 'Feb', value: 55 },
  { name: 'Mar', value: 45 },
  { name: 'Apr', value: 70 },
  { name: 'May', value: 85 },
  { name: 'Jun', value: 80 },
  { name: 'Jul', value: 75 },
];

const categories = [
  { name: 'บัญชีและการเงิน', percentage: 42 },
  { name: 'ภาษี', percentage: 26 },
  { name: 'บุคคล', percentage: 14 },
  { name: 'การดำเนินงาน', percentage: 12 },
  { name: 'จดทะเบียน', percentage: 6 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Company Workspace</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">Dashboard บริษัท</h1>
        <p className="text-sm text-gray-500">ภาพรวมเอกสาร ลูกค้า พนักงาน งานรออนุมัติ และกราฟเอกสารของบริษัท</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'เอกสารทั้งหมด', value: '1,248' },
          { label: 'ฉบับร่าง', value: '82' },
          { label: 'รออนุมัติ', value: '36' },
          { label: 'อนุมัติแล้ว', value: '904' },
          { label: 'ลูกค้า', value: '186' },
          { label: 'พนักงาน', value: '64' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
            <p className="text-[13px] text-gray-500 font-medium mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-[15px] font-bold text-gray-800 mb-6">กราฟจำนวนเอกสารรายเดือน</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-[15px] font-bold text-gray-800 mb-6">กราฟแยกตามหมวดหมู่เอกสาร</h3>
          <div className="space-y-5 mt-2">
            {categories.map((cat, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                  <span className="text-sm font-bold text-gray-900">{cat.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
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
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2 min-h-[300px] flex flex-col">
          <h3 className="text-[15px] font-bold text-gray-800 mb-4">เอกสารล่าสุด</h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="text-[13px] text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="pb-3 font-medium">เลขเอกสาร</th>
                  <th className="pb-3 font-medium">ชื่อเอกสาร</th>
                  <th className="pb-3 font-medium">หมวดหมู่</th>
                  <th className="pb-3 font-medium">ประเภท</th>
                  <th className="pb-3 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {/* Empty State */}
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400">
                    ไม่มีเอกสาร
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Scrollbar placeholder area to match image */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-gray-400 px-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            <div className="h-1.5 w-64 bg-gray-200 rounded-full">
              <div className="h-1.5 w-1/3 bg-gray-400 rounded-full"></div>
            </div>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[300px] flex flex-col">
          <h3 className="text-[15px] font-bold text-gray-800 mb-4">งานที่รออนุมัติ (0)</h3>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400">ไม่มีงานที่รออนุมัติ</p>
          </div>
        </div>

      </div>
    </div>
  );
}
