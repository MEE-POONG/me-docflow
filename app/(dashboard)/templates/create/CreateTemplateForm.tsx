'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft, Loader2, LayoutTemplate } from 'lucide-react'
import { DocumentDesigner } from '@/components/templates/builder/DocumentDesigner'
import Link from 'next/link'

type CreateTemplateFormProps = {
  categories: any[]
  documentTypes: any[]
}

export default function CreateTemplateForm({ categories, documentTypes }: CreateTemplateFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    documentTypeId: '',
    layoutJson: '',
    htmlContent: ''
  })
  
  const [builderMode, setBuilderMode] = useState<'JSON' | 'DESIGNER'>('DESIGNER')

  const filteredTypes = documentTypes.filter(t => t.categoryId === formData.categoryId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      // Mock save
      await new Promise(r => setTimeout(r, 1000))
      router.push('/templates')
      router.refresh()
    })
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden pb-20">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4">
        <Link href="/templates" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">แบบฟอร์มสร้างเทมเพลต</h2>
            <p className="text-sm text-gray-500">สร้างแบบฟอร์มหรือเทมเพลตเอกสารใหม่สำหรับใช้งานในองค์กร</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Section 1: ข้อมูลทั่วไป */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b pb-2 mb-4">1. ข้อมูลทั่วไป (General Information)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ชื่อเทมเพลต <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-lg transition-all outline-none"
                placeholder="เช่น เทมเพลตใบสั่งซื้อมาตรฐาน, แบบฟอร์มลางาน..."
              />
            </div>
            
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">คำอธิบาย</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                placeholder="อธิบายการใช้งานเทมเพลตสั้นๆ"
              />
            </div>
          </div>
        </div>

        {/* Section 2: การจัดหมวดหมู่ */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b pb-2 mb-4">2. การจัดหมวดหมู่ (Classification)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">หมวดหมู่เอกสาร <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.categoryId}
                onChange={e => {
                  const newCat = e.target.value;
                  const typesForCat = documentTypes.filter(t => t.categoryId === newCat)
                  setFormData({ 
                    ...formData, 
                    categoryId: newCat, 
                    documentTypeId: typesForCat.length > 0 ? typesForCat[0].id : ''
                  })
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              >
                <option value="" disabled>เลือกหมวดหมู่</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ประเภทเอกสาร <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.documentTypeId}
                onChange={e => setFormData({ ...formData, documentTypeId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 outline-none"
                disabled={!formData.categoryId}
              >
                <option value="" disabled>เลือกประเภทเอกสาร</option>
                {filteredTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: โครงสร้างและเนื้อหา */}
        <div>
          <div className="border-b pb-2 mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">3. โครงสร้างและเนื้อหา (Structure & Content)</h3>
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setBuilderMode('JSON')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${builderMode === 'JSON' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                JSON Mode
              </button>
              <button
                type="button"
                onClick={() => setBuilderMode('DESIGNER')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${builderMode === 'DESIGNER' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Visual Designer
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            {builderMode === 'JSON' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Layout JSON (การตั้งค่าฟิลด์) <span className="text-red-500">*</span></label>
                <textarea
                  required
                  value={formData.layoutJson}
                  onChange={e => setFormData({ ...formData, layoutJson: e.target.value })}
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl font-mono text-sm h-48 resize-y bg-gray-900 text-green-400 focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner outline-none"
                />
              </div>
            ) : (
              <div className="min-h-[800px] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white">
                <DocumentDesigner />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">HTML Content (ตัวเลือกเสริม)</label>
              <textarea
                value={formData.htmlContent}
                onChange={e => setFormData({ ...formData, htmlContent: e.target.value })}
                className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl font-mono text-sm h-32 resize-y bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                placeholder='<div><h1>{{title}}</h1></div>'
              />
              <p className="text-xs text-gray-500 mt-2">ใส่รหัส HTML หากต้องการออกแบบรูปแบบการแสดงผลหรือปริ้นแบบพิเศษ</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
          <Link
            href="/templates"
            className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl font-medium transition-colors"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={isPending || !formData.categoryId || !formData.documentTypeId}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            บันทึกสร้างเทมเพลต
          </button>
        </div>
      </form>
    </div>
  )
}
