'use client'

import { DocumentDesigner } from '@/components/templates/builder/DocumentDesigner'

export default function DesignerPage() {
  return (
    <div className="max-w-[1600px] mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Designer</h1>
        <p className="text-gray-500 mt-1">
          ระบบออกแบบเอกสารด้วยการลากวาง (Playground)
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[800px] overflow-hidden">
        <DocumentDesigner />
      </div>
    </div>
  )
}
