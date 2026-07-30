'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'
import { DocumentPreview } from '@/components/templates/builder/DocumentPreview'
import { createDocument } from '@/app/actions/documents'

type CreateDocumentFormProps = {
  folders: any[]
  tags: any[]
  categories: any[]
  documentTypes: any[]
  templates: any[]
}

export default function CreateDocumentForm({ folders, tags, categories, documentTypes, templates }: CreateDocumentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    documentTypeId: '',
    templateId: '',
    folderId: '',
    tagIds: [] as string[],
    dataJson: ''
  })

  const filteredTypes = documentTypes.filter(t => t.categoryId === formData.categoryId)
  const filteredTemplates = templates.filter(t => t.documentTypeId === formData.documentTypeId)
  
  const selectedTemplate = templates.find(t => t.id === formData.templateId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.categoryId || !formData.documentTypeId) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน')
      return
    }

    startTransition(async () => {
      const result = await createDocument({
        title: formData.title,
        categoryId: formData.categoryId,
        documentTypeId: formData.documentTypeId,
        templateId: formData.templateId || undefined,
        dataJson: formData.dataJson || '{}'
      })

      if (result.success) {
        router.push('/documents')
        router.refresh()
      } else {
        alert('เกิดข้อผิดพลาดในการสร้างเอกสาร: ' + result.error)
      }
    })
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
      {/* Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">สร้างเอกสารใหม่</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ชื่อเอกสาร</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">หมวดหมู่</label>
              <select
                required
                value={formData.categoryId}
                onChange={e => {
                  const newCat = e.target.value;
                  const typesForCat = documentTypes.filter(t => t.categoryId === newCat)
                  const newType = typesForCat.length > 0 ? typesForCat[0].id : ''
                  const templatesForType = templates.filter(t => t.documentTypeId === newType)
                  setFormData({ 
                    ...formData, 
                    categoryId: newCat, 
                    documentTypeId: newType,
                    templateId: templatesForType.length > 0 ? templatesForType[0].id : ''
                  })
                }}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              >
                <option value="" disabled>เลือกหมวดหมู่</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ประเภทเอกสาร</label>
              <select
                required
                value={formData.documentTypeId}
                onChange={e => {
                  const newType = e.target.value;
                  const templatesForType = templates.filter(t => t.documentTypeId === newType)
                  setFormData({ 
                    ...formData, 
                    documentTypeId: newType, 
                    templateId: templatesForType.length > 0 ? templatesForType[0].id : '' 
                  })
                }}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 outline-none"
                disabled={!formData.categoryId}
              >
                <option value="" disabled>เลือกประเภทเอกสาร</option>
                {filteredTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            
            {filteredTemplates.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">เทมเพลต (ถ้ามีหลายแบบ)</label>
                <select
                  value={formData.templateId}
                  onChange={e => setFormData({ ...formData, templateId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                >
                  {filteredTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Folder */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">โฟลเดอร์สำหรับจัดเก็บ</label>
              <select
                value={formData.folderId}
                onChange={e => setFormData({ ...formData, folderId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              >
                <option value="">ไม่มี (หน้าหลัก)</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ป้ายกำกับ (Tags)</label>
            <div className="flex flex-wrap gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              {tags.length === 0 ? <span className="text-gray-500 text-sm">ไม่มีป้ายกำกับในระบบ</span> : tags.map(tag => (
                <label key={tag.id} className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors shadow-sm">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    checked={formData.tagIds.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, tagIds: [...formData.tagIds, tag.id] })
                      } else {
                        setFormData({ ...formData, tagIds: formData.tagIds.filter(id => id !== tag.id) })
                      }
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{tag.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Data JSON is hidden since we use Document Designer */}
          <input type="hidden" name="dataJson" value={formData.dataJson} />

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isPending || !formData.categoryId || !formData.documentTypeId}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              บันทึกสร้างเอกสาร
            </button>
          </div>
        </form>
      </div>

      {/* Preview Card */}
      {selectedTemplate && (
        <DocumentPreview layoutJsonString={(selectedTemplate as any).layoutJson || null} />
      )}
    </div>
  )
}
