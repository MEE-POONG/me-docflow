import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CompanyUserRole } from '@prisma/client';

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { userId, companyId } = body;

    if (!userId || !companyId) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน (userId, companyId)' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าผู้ใช้นี้มีอยู่จริง และมี role อะไร
    const user = await prisma.companyUser.findUnique({
      where: { id: userId },
    });

    if (!user || user.companyId !== companyId) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้งาน หรือข้อมูลไม่ตรงกัน' },
        { status: 404 }
      );
    }

    if (user.role === CompanyUserRole.OWNER) {
      // กรณี OWNER (เจ้าของบริษัท) ให้ทำการลบข้อมูลทั้งหมดที่เชื่อมกับ Company นี้
      // ต้องลบข้อมูลจากล่างขึ้นบน เพื่อไม่ให้ติด Relation
      
      await prisma.$transaction([
        prisma.documentFile.deleteMany({ where: { companyId } }),
        prisma.documentApproval.deleteMany({ where: { companyId } }),
        prisma.document.deleteMany({ where: { companyId } }),
        prisma.templateField.deleteMany({ where: { companyId } }),
        prisma.documentTemplate.deleteMany({ where: { companyId } }),
        prisma.employee.deleteMany({ where: { companyId } }),
        prisma.businessPartner.deleteMany({ where: { companyId } }),
        prisma.documentNumberSetting.deleteMany({ where: { companyId } }),
        prisma.approvalStep.deleteMany({ where: { companyId } }),
        prisma.approvalFlow.deleteMany({ where: { companyId } }),
        prisma.documentType.deleteMany({ where: { companyId } }),
        prisma.documentCategory.deleteMany({ where: { companyId } }),
        prisma.subscription.deleteMany({ where: { companyId } }),
        prisma.auditLog.deleteMany({ where: { companyId } }),
        
        // ลบ User ก่อน ลบ Department
        prisma.companyUser.deleteMany({ where: { companyId } }),
        prisma.department.deleteMany({ where: { companyId } }),
        
        // ลบ Company ตัวหลัก เป็นลำดับสุดท้าย
        prisma.company.delete({ where: { id: companyId } })
      ]);

      return NextResponse.json({ success: true, message: 'ลบข้อมูลบริษัทและบัญชีผู้ใช้ทั้งหมดสำเร็จ' }, { status: 200 });
      
    } else {
      // กรณี ไม่ใช่ OWNER ให้ลบแค่ CompanyUser ของตัวเองคนเดียว
      await prisma.companyUser.delete({
        where: { id: userId }
      });
      
      return NextResponse.json({ success: true, message: 'ลบบัญชีผู้ใช้งานสำเร็จ' }, { status: 200 });
    }

  } catch (error: any) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบข้อมูล', details: error?.message },
      { status: 500 }
    );
  }
}
