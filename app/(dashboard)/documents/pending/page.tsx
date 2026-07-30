import { PrismaClient } from '@prisma/client'
import PendingApprovalList from './PendingApprovalList'
import { FileCheck } from 'lucide-react'

const prisma = new PrismaClient()

export default async function PendingApprovalsPage() {
  // Fetch documents that have a status of 'PENDING'
  // In a real application, we would check the current user's approval queue
  const pendingDocuments = await prisma.document.findMany({
    where: {
      status: 'PENDING'
    },
    include: {
      createdBy: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="max-w-[1600px] mx-auto pb-20 p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <FileCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">รออนุมัติ</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mt-1 pl-14">
          รายการเอกสารที่รอการตรวจสอบและอนุมัติจากคุณ
        </p>
      </div>

      <PendingApprovalList documents={pendingDocuments as any} />
    </div>
  )
}
