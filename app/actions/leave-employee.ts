'use server'
import { leaveEmployeeFields } from '@/lib/leave-employee'
export async function getLeaveEmployeeInfo(documentId?: string) {
  return leaveEmployeeFields(documentId)
}
