'use client';

import { useState, useEffect, useTransition } from 'react';
import { Settings, Save, CheckCircle2, LayoutTemplate } from 'lucide-react';
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

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">หมวดหมู่เทมเพลตกลางที่มีในระบบ</h3>
              <p className="text-xs text-gray-500">ติ๊กเลือกเพื่อเปิดใช้งาน หรือเอาออกเพื่อซ่อนหมวดหมู่นั้นๆ</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500">ไม่มีหมวดหมู่เทมเพลตกลางในระบบ</p>
            ) : (
              categories.map((cat) => (
                <label 
                  key={cat.id} 
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    enabledIds.has(cat.id) 
                      ? 'border-indigo-500 bg-indigo-50/50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={enabledIds.has(cat.id)}
                      onChange={() => handleToggle(cat.id)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-0.5"
                    />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${enabledIds.has(cat.id) ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {cat.name}
                    </p>
                    {cat.description && (
                      <p className={`text-xs mt-1 ${enabledIds.has(cat.id) ? 'text-indigo-700/70' : 'text-gray-500'}`}>
                        {cat.description}
                      </p>
                    )}
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors disabled:opacity-50"
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
