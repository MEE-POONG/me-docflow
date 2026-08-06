"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, LayoutTemplate, Calendar, FileText, CheckCircle2, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import TemplateActions from './TemplateActions'

export default function TemplatesList({ initialTemplates }: { initialTemplates: any[] }) {
  const [templates, setTemplates] = useState<any[]>(initialTemplates)
  const [activeTab, setActiveTab] = useState<'company' | 'system'>('company')

  useEffect(() => {
    if (activeTab === 'company') {
      // เทมเพลตที่สร้างเอง (ไม่ใช่ส่วนกลาง)
      setTemplates(initialTemplates.filter(t => !t.isGlobal))
    } else {
      // เทมเพลตระบบส่วนกลาง (isGlobal = true)
      setTemplates(initialTemplates.filter(t => t.isGlobal))
    }
  }, [initialTemplates, activeTab])

  return (
    <div className="max-w-[1600px] mx-auto pb-20 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            Template ทั้งหมด
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 pl-12">
            จัดการและค้นหาแบบฟอร์มหรือเทมเพลตเอกสารทั้งหมดในระบบ
          </p>
        </div>

        <Link
          href="/templates/create"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-5 h-5" />
          สร้าง Template ใหม่
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-gray-200 dark:border-gray-800 mb-6 px-2">
        <button
          onClick={() => setActiveTab('company')}
          className={`pb-4 text-sm font-semibold transition-colors relative outline-none ${activeTab === 'company'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
          เทมเพลตของบริษัท
          {activeTab === 'company' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`pb-4 text-sm font-semibold transition-colors relative outline-none ${activeTab === 'system'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
          เทมเพลตจากระบบส่วนกลาง
          {activeTab === 'system' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อเทมเพลต, คำอธิบาย..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex items-center gap-3">
            <select className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">ทุกหมวดหมู่</option>
              <option value="ACTIVE">ใช้งานอยู่</option>
              <option value="INACTIVE">ปิดใช้งาน</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors text-sm font-medium">
              <Filter className="w-4 h-4" />
              คัดกรอง
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">ชื่อเทมเพลต</th>
                <th className="px-6 py-4 font-semibold">รายละเอียด</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">หมวดหมู่</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">โหมดการสร้าง</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">สถานะ</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">วันที่อัปเดต</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <LayoutTemplate className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-base font-medium">ยังไม่มีเทมเพลตในระบบ</p>
                    <p className="text-sm mt-1">เริ่มต้นสร้างฟอร์มเอกสารมาตรฐานของคุณได้ที่นี่</p>
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {activeTab === 'system' ? (
                        <span className="text-gray-800 dark:text-gray-200">{template.name}</span>
                      ) : (
                        <Link href={`/templates/${template.id}`} className="hover:underline">{template.name}</Link>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {template.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {template.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {template.templateMode === 'FORM' ? 'JSON Form' : 'Drag & Drop'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ใช้งานอยู่
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                          <XCircle className="w-3.5 h-3.5" /> ปิดใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(template.updatedAt), 'dd MMM yyyy', { locale: th })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <TemplateActions id={template.id} name={template.name} isGlobal={template.isGlobal} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
