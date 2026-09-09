import PendingApprovalList from './PendingApprovalList'

export default async function PendingApprovalsPage() {
  return (
    <div className="max-w-[1600px] mx-auto pb-20 p-4 md:p-6 lg:p-8">
      <PendingApprovalList documents={[]} templates={[]} />
    </div>
  )
}
