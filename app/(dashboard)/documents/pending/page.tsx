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
      <PendingApprovalList documents={pendingDocuments as any} templates={templates as any} />
    </div>
  )
}
