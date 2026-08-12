import { PrismaClient } from '@prisma/client'
import PendingApprovalList from './PendingApprovalList'

const prisma = new PrismaClient()

export default async function PendingApprovalsPage() {
  // Fetch documents that are pending, approved, or rejected
  // In a real application, we would check the current user's approval queue
  const pendingDocuments = await prisma.document.findMany({
    where: {
      status: {
        in: ['PENDING', 'APPROVED', 'REJECTED']
      }
    },
    include: {
      createdBy: true,
      company: true,
      template: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const templates = await prisma.documentTemplate.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="max-w-[1600px] mx-auto pb-20 p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 tracking-wider mb-1 uppercase">
          Company Workspace
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">การอนุมัติเอกสาร</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          รายการเอกสารที่เกี่ยวข้องกับการตรวจสอบและอนุมัติ
        </p>
      </div>

      <PendingApprovalList documents={pendingDocuments as any} templates={templates as any} />
    </div>
  )
}
