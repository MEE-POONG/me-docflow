'use client';

import { useState, useTransition, useEffect } from 'react';
import { Search, Loader2, Tag } from 'lucide-react';
import { getCategoriesByCompany, toggleGlobalCategory, getGlobalCategories } from '@/app/(dashboard)/categories/actions';
import type { CategoryWithCount } from '@/app/(dashboard)/categories/actions';

export default function SettingsCategoriesPage() {
  const [allCategories, setAllCategories] = useState<CategoryWithCount[]>([]);
  const [enabledGlobalCategoryIds, setEnabledGlobalCategoryIds] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const userStr = localStorage.getItem("me_docflow_current_user");
        let cid = null;
        if (userStr) {
          const user = JSON.parse(userStr);
          cid = user.companyId;
        }
        if (!cid) {
          const companiesStr = localStorage.getItem("me_docflow_companies");
          if (companiesStr) {
            const comps = JSON.parse(companiesStr);
            if (comps && comps.length > 0) cid = comps[0].id;
          }
        }

        setUserCompanyId(cid);

        if (cid) {
          const res = await getCategoriesByCompany(cid);
          setAllCategories(res.categories);
          setEnabledGlobalCategoryIds(res.enabledGlobalCategoryIds);
        } else {
          const globalCats = await getGlobalCategories();
          setAllCategories(globalCats);
          setEnabledGlobalCategoryIds([]);
        }
      } catch (e) {
        console.error("Failed to fetch categories data", e);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const systemCategories = allCategories.filter(cat => cat.isGlobal);

  const filtered = systemCategories.filter((c) => {
    const q = searchQuery.toLowerCase();
    const match = c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
    
    const isEnabled = enabledGlobalCategoryIds.includes(c.id);
    const statusMatch = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? isEnabled : !isEnabled);
    
    return match && statusMatch;
  });

  const handleToggleGlobal = async (categoryId: string, currentEnabled: boolean) => {
    if (!userCompanyId) return;
    
    let newEnabledIds = [...enabledGlobalCategoryIds];
    if (currentEnabled) {
      newEnabledIds = newEnabledIds.filter(id => id !== categoryId);
    } else {
      newEnabledIds.push(categoryId);
    }
    setEnabledGlobalCategoryIds(newEnabledIds);

    startTransition(async () => {
      try {
        await toggleGlobalCategory(userCompanyId, categoryId, !currentEnabled);
      } catch (error) {
        console.error('Failed to toggle global category', error);
        const res = await getCategoriesByCompany(userCompanyId);
        setEnabledGlobalCategoryIds(res.enabledGlobalCategoryIds);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">การตั้งค่าระบบ</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-sans">ตั้งค่าหมวดหมู่เอกสารส่วนกลาง</h1>
        <p className="text-sm text-gray-500">เลือกเปิด-ปิดการใช้งานหมวดหมู่มาตรฐานจากระบบส่วนกลางสำหรับบริษัทของคุณ</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="text-sm text-gray-500">หมวดหมู่ที่เปิดใช้งาน จะไปปรากฏในหน้า Company Workspace ของบริษัทคุณ</div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาหมวดหมู่ส่วนกลาง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-300 dark:focus:border-gray-500 transition-colors"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="ACTIVE">เปิดใช้งาน</option>
            <option value="INACTIVE">ปิดใช้งาน</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30">
              <tr>
                <th className="px-6 py-4 font-normal">ชื่อหมวดหมู่</th>
                <th className="px-6 py-4 font-normal">Slug</th>
                <th className="px-6 py-4 font-normal">รายละเอียด</th>
                <th className="px-6 py-4 font-normal text-center">สถานะ</th>
                <th className="px-6 py-4 font-normal text-right">เปิด/ปิด ใช้งาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              {isLoadingData ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-emerald-500" />
                    <p className="text-sm font-medium">กำลังโหลดข้อมูลหมวดหมู่ส่วนกลาง...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
                      <Tag className="w-12 h-12 opacity-30" />
                      <p className="text-sm">ไม่พบหมวดหมู่</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((cat) => {
                  const isGlobalEnabled = enabledGlobalCategoryIds.includes(cat.id);
                  
                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {cat.icon && <span className="text-lg">{cat.icon}</span>}
                          {cat.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400 dark:text-gray-500">
                        {cat.slug}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-[300px]">
                        <span className="truncate block">{cat.description || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                            isGlobalEnabled
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {isGlobalEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={isGlobalEnabled}
                              onChange={() => handleToggleGlobal(cat.id, isGlobalEnabled)}
                              disabled={isPending || !userCompanyId}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                          </label>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoadingData && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
            แสดง {filtered.length} จาก {systemCategories.length} รายการ
          </div>
        )}
      </div>
    </div>
  );
}
