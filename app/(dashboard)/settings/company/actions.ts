'use server'
import { requireDocumentUser } from '@/lib/document-access'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
export async function getCurrentCompany() {
  const user = await requireDocumentUser()
  const c = user.company
  return { canEdit: user.role === 'OWNER' || user.position === 'หัวหน้า', company: { name:c.name, legalName:c.legalName || '', taxId:c.taxId || '', address:c.address || '', phone:c.phone || '', email:c.email || '' } }
}
export async function saveCurrentCompany(input: {name:string;legalName:string;taxId:string;address:string;phone:string;email:string}) {
  try {
    const user = await requireDocumentUser()
    if (user.role !== 'OWNER' && user.position !== 'หัวหน้า') throw new Error('เฉพาะเจ้าของบริษัทหรือหัวหน้าเท่านั้นที่แก้ไขข้อมูลบริษัทได้')
    if (!input.name?.trim()) throw new Error('กรุณาระบุชื่อบริษัท')
    const data = {name:input.name,legalName:input.legalName,taxId:input.taxId,address:input.address,phone:input.phone,email:input.email}
    if (Object.values(data).some(v => typeof v !== 'string' || v.length > 2000)) throw new Error('ข้อมูลไม่ถูกต้อง')
    await prisma.company.update({where:{id:user.companyId},data:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.trim()]))})
    revalidatePath('/settings/company'); revalidatePath('/profile')
    return {success:true}
  } catch (e) { return {success:false,error:e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'} }
}
