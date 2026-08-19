'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, Clock3, Download, FileText, Loader2, WalletCards } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getReportsData } from './actions';

type ReportData = NonNullable<Awaited<ReturnType<typeof getReportsData>>>;
type Period = '30d' | 'year' | 'all';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'ฉบับร่าง', PENDING: 'รออนุมัติ', APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ไม่อนุมัติ', CANCELLED: 'ยกเลิก', ARCHIVED: 'จัดเก็บ',
};

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  PENDING: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  REJECTED: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
  CANCELLED: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700',
  DRAFT: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  ARCHIVED: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
};

const formatMoney = (satang: number) => new Intl.NumberFormat('th-TH', {
  style: 'currency', currency: 'THB', minimumFractionDigits: 2,
}).format(satang / 100);

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('year');
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReport = useCallback(async (selectedPeriod: Period) => {
    setIsLoading(true);
    const userData = localStorage.getItem('me_docflow_current_user');
    let email = 'melisara@siamretail.co.th';
    try { email = JSON.parse(userData ?? '{}').email || email; } catch { /* use fallback */ }
    try { setData(await getReportsData(email, selectedPeriod)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadReport('year'));
  }, [loadReport]);

  const changePeriod = (value: Period) => {
    setPeriod(value);
    void loadReport(value);
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['เลขเอกสาร', 'ชื่อเอกสาร', 'หมวดหมู่', 'ประเภท', 'สถานะ', 'มูลค่า', 'วันที่สร้าง'],
      ...data.documents.map((document) => [
        document.documentNo, document.title, document.category, document.type,
        STATUS_LABELS[document.status] ?? document.status,
        (document.totalSatang / 100).toFixed(2), new Date(document.createdAt).toLocaleDateString('th-TH'),
      ]),
    ];
    const csv = '\uFEFF' + rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `document-report-${period}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (isLoading && !data) return <div className="h-96 flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Company Reports</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">รายงาน</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">สรุปผลการดำเนินงานและสถานะเอกสารภายในบริษัท</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={(event) => changePeriod(event.target.value as Period)} className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:border-emerald-600">
            <option value="30d">30 วันล่าสุด</option><option value="year">ปีปัจจุบัน</option><option value="all">ข้อมูลทั้งหมด</option>
          </select>
          <button onClick={exportCsv} disabled={!data} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50">
            <Download className="w-4 h-4" /> ส่งออก CSV
          </button>
        </div>
      </div>

      {!data ? <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-12 text-center text-sm text-gray-500 dark:text-gray-400">ไม่พบข้อมูลรายงานของบริษัท</div> : <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'เอกสารทั้งหมด', value: data.summary.total.toLocaleString(), icon: FileText },
            { label: 'อนุมัติแล้ว', value: data.summary.approved.toLocaleString(), icon: CheckCircle2 },
            { label: 'รออนุมัติ', value: data.summary.pending.toLocaleString(), icon: Clock3 },
            { label: 'มูลค่ารวม', value: formatMoney(data.summary.totalValueSatang), icon: WalletCards },
          ].map((item) => <div key={item.label} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-5 py-4 shadow-sm flex items-center justify-between gap-3">
            <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.label}</p><p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{item.value}</p></div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg"><item.icon className="w-5 h-5" /></div>
          </div>)}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6"><BarChart3 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /><h2 className="font-semibold text-gray-900 dark:text-white">แนวโน้มจำนวนเอกสาร</h2></div>
            <div className="h-72 text-gray-200 dark:text-slate-700"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.monthly}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" /><XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="count" name="เอกสาร" fill="#059669" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-5">สถานะเอกสาร</h2>
            <div className="space-y-4">{data.statuses.map((item) => <div key={item.status}><div className="flex justify-between text-sm mb-1.5"><span className="text-gray-600 dark:text-gray-400">{STATUS_LABELS[item.status]}</span><span className="font-semibold text-gray-900 dark:text-white">{item.count}</span></div><div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-600 rounded-full" style={{ width: `${data.summary.total ? (item.count / data.summary.total) * 100 : 0}%` }} /></div></div>)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm p-6"><h2 className="font-semibold text-gray-900 dark:text-white mb-4">หมวดหมู่ที่มีการใช้งานสูงสุด</h2><div className="divide-y divide-gray-100 dark:divide-slate-800">{data.categories.length ? data.categories.map((category, index) => <div key={category.name} className="py-3 flex items-center justify-between text-sm"><span className="text-gray-700 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500 mr-2 tabular-nums">{index + 1}.</span>{category.name}</span><span className="font-semibold text-gray-900 dark:text-white">{category.count}</span></div>) : <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">ไม่มีข้อมูลหมวดหมู่</p>}</div></div>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"><div className="px-5 py-4 border-b border-gray-200 dark:border-slate-800"><h2 className="font-semibold text-gray-900 dark:text-white">รายการเอกสารล่าสุด</h2><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">แสดงสูงสุด 100 รายการตามช่วงเวลาที่เลือก</p></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 dark:bg-slate-800/70 text-xs text-gray-500 dark:text-gray-400"><tr><th className="px-5 py-3 text-left font-semibold">เลขเอกสาร</th><th className="px-5 py-3 text-left font-semibold">ชื่อเอกสาร</th><th className="px-5 py-3 text-left font-semibold">หมวดหมู่</th><th className="px-5 py-3 text-left font-semibold">สถานะ</th><th className="px-5 py-3 text-right font-semibold">มูลค่า</th></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-slate-800">{data.documents.length ? data.documents.map((document) => <tr key={document.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50"><td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{document.documentNo}</td><td className="px-5 py-3 text-gray-700 dark:text-gray-300">{document.title}</td><td className="px-5 py-3 text-gray-500 dark:text-gray-400">{document.category}</td><td className="px-5 py-3"><span className={`inline-flex px-2 py-1 border rounded-full text-[11px] font-medium ${STATUS_STYLES[document.status]}`}>{STATUS_LABELS[document.status]}</span></td><td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatMoney(document.totalSatang)}</td></tr>) : <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">ไม่พบเอกสารในช่วงเวลานี้</td></tr>}</tbody></table></div></div>
        </div>
      </>}
      {isLoading && data && <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />กำลังอัปเดตรายงาน</div>}
    </div>
  );
}
