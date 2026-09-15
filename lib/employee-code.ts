import { prisma } from '@/lib/prisma'

// The company counter and profile are committed together; conflicts retry.
export async function ensureEmployeeCode(userId: string, previousEmail?: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.$transaction(async tx => {
        const user = await tx.companyUser.findUniqueOrThrow({where:{id:userId}})
        const profiles = await tx.employee.findMany({where:{companyId:user.companyId,email:{equals:previousEmail || user.email,mode:'insensitive'}},take:2})
        if (profiles.length > 1) throw new Error('พบข้อมูลพนักงานซ้ำ กรุณาให้หัวหน้าตรวจสอบ')
        const existing = profiles[0]
        if (existing?.code) {
          if (existing.email !== user.email) await tx.employee.update({where:{id:existing.id},data:{email:user.email}})
          return existing.code
        }
        const company = await tx.company.findUniqueOrThrow({where:{id:user.companyId},select:{settings:true}})
        const settings = company.settings && typeof company.settings === 'object' && !Array.isArray(company.settings) ? company.settings : {}
        const codes = await tx.employee.findMany({where:{companyId:user.companyId},select:{code:true}})
        const last = codes.reduce((max,row)=>row.code && /^\d+$/.test(row.code) ? Math.max(max,Number(row.code)) : max, Number(settings.employeeCodeSequence) || 0)
        if (!Number.isSafeInteger(last) || last >= 999999999) throw new Error('เลขรหัสพนักงานเกินขอบเขต')
        const next = last + 1
        const code = String(next).padStart(3,'0')
        await tx.company.update({where:{id:user.companyId},data:{settings:{...settings,employeeCodeSequence:next}}})
        if (existing) await tx.employee.update({where:{id:existing.id},data:{code,email:user.email}})
        else await tx.employee.create({data:{companyId:user.companyId,email:user.email,name:user.name,phone:user.phone,departmentId:user.departmentId,position:user.position,status:user.status,code}})
        return code
      })
    } catch(error) {
      if (attempt < 4 && ['P2034','P2002'].includes((error as {code?:string}).code || '')) continue
      throw error
    }
  }
  throw new Error('สร้างรหัสพนักงานไม่สำเร็จ กรุณาลองใหม่')
}
