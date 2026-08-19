'use client';

import { useState, useEffect, useTransition } from 'react';
import { Save, CheckCircle2, LayoutTemplate } from 'lucide-react';
import { getGlobalCategoriesAndSettings, updateGlobalCategoriesSettings } from './actions';

type GlobalCategory = {
  id: string;
  name: string;
  description: string | null;
};

export default function GlobalTemplatesSettingsPage() {
  const [categories, setCategories] = useState<GlobalCategory[]>([]);
  const [enabledIds, setEnabledIds] = useState<Set<string>>(new Set());
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getGlobalCategoriesAndSettings().then((data) => {
      setCategories(data.categories);
      if (data.enabledGlobalCategoryIds === null) {
        // If not configured, default to all enabled
        setEnabledIds(new Set(data.categories.map((c) => c.id)));
      } else {
        setEnabledIds(new Set(data.enabledGlobalCategoryIds));
      }
      setIsLoading(false);
    });
  }, []);

  const handleToggle = (id: string) => {
    const next = new Set(enabledIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setEnabledIds(next);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateGlobalCategoriesSettings(Array.from(enabledIds));
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      }
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">การตั้งค่าระบบ</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-sans">ตั้งค่าเทมเพลตกลาง</h1>
        <p className="text-sm text-gray-500">เลือกเปิด-ปิด หมวดหมู่เทมเพลตกลาง (Global Templates) ที่ต้องการใช้งานในระบบ</p>
      </div>

      {/* Save Success Banner */}
      {isSaved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold">บันทึกการตั้งค่าสำเร็จ!</p>
            <p className="text-xs text-emerald-600">เปลี่ยนแปลงการใช้งานเทมเพลตเรียบร้อยแล้ว</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-emerald-700">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">หมวดหมู่เทมเพลตกลางที่มีในระบบ</h3>
              <p className="text-xs text-gray-500 mt-0.5">กำหนดสิทธิ์การแสดงหมวดหมู่เทมเพลตสำหรับผู้ใช้งานในบริษัท</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 tabular-nums">
            เปิดใช้งาน <span className="font-semibold text-gray-800">{enabledIds.size}</span> จาก <span className="font-semibold text-gray-800">{categories.length}</span> หมวดหมู่
          </div>
        </div>
        <div>
          <div className="hidden sm:grid grid-cols-[1fr_140px] gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50/70 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            <span>รายละเอียดหมวดหมู่</span>
            <span className="text-right">สถานะการใช้งาน</span>
          </div>
          <div className="divide-y divide-gray-100">
            {categories.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-gray-500">ไม่มีหมวดหมู่เทมเพลตกลางในระบบ</p>
            ) : (
              categories.map((cat) => (
                <label key={cat.id} className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3 sm:gap-4 px-6 py-4 cursor-pointer bg-white hover:bg-gray-50/70 transition-colors">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-4xl">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex items-center sm:justify-end gap-2">
                    <span className={`text-xs font-medium ${enabledIds.has(cat.id) ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {enabledIds.has(cat.id) ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                    <input
                      type="checkbox"
                      checked={enabledIds.has(cat.id)}
                      onChange={() => handleToggle(cat.id)}
                      className="w-4 h-4 accent-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    />
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/40 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isPending ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
