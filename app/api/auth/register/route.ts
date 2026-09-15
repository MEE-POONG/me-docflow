import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createProfileSession } from '@/lib/profile-session';
import { CompanyUserRole, CompanyStatus, UserStatus, Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, role, password, businessName, businessPhone, businessType } = body;

    // 1. Validate required fields
    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // 2. Check if user exists
    const existingUser = await prisma.companyUser.findFirst({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'อีเมลนี้ได้รับการลงทะเบียนในระบบแล้ว' },
        { status: 409 }
      );
    }

    // 3. Map frontend role to Prisma CompanyUserRole
    let dbRole: CompanyUserRole = CompanyUserRole.STAFF;
    switch (role) {
      case 'owner':
        dbRole = CompanyUserRole.OWNER;
        break;
      case 'accountant_in':
      case 'accounting_firm':
        dbRole = CompanyUserRole.ACCOUNTANT;
        break;
      case 'employee':
        dbRole = CompanyUserRole.STAFF;
        break;
      case 'student':
        dbRole = CompanyUserRole.VIEWER;
        break;
      default:
        dbRole = CompanyUserRole.STAFF;
    }

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 5. Create default company and user inside a transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 5.1 Create a default company for the new user
      const company = await tx.company.create({
        data: {
          name: businessName || `บริษัทของ ${fullName}`,
          email: email.toLowerCase(),
          phone: businessPhone || phone || null,
          status: CompanyStatus.ACTIVE,
          settings: {
            businessType: businessType || "other"
          }
        }
      });

      // 5.2 Create the company user
      const user = await tx.companyUser.create({
        data: {
          companyId: company.id,
          name: fullName,
          email: email.toLowerCase(),
          phone: phone || null,
          passwordHash,
          role: dbRole,
          status: UserStatus.ACTIVE,
        },
        include: {
          company: true
        }
      });

      return user;
    });

    // 6. Return response (excluding password hash)
    const { passwordHash: _, ...userWithoutPassword } = result;
    await createProfileSession(result.id, result.companyId);

    return NextResponse.json(
      { 
        message: 'ลงทะเบียนสำเร็จ',
        user: {
          // Map backend object to match frontend expected format for localStorage
          id: userWithoutPassword.id,
          fullName: userWithoutPassword.name,
          email: userWithoutPassword.email,
          phone: userWithoutPassword.phone,
          role: role, // Keep original frontend role for UI compatibility
          status: "active",
          companyId: userWithoutPassword.companyId,
          companyName: userWithoutPassword.company?.name
        } 
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('Registration Error:', error);
    // MongoDB connection failures can surface as P2010 raw-query errors.
    const databaseUnavailable =
      (error instanceof Prisma.PrismaClientInitializationError &&
        ['P1001', 'P1002', 'P1011', 'P1017'].includes(error.errorCode ?? '')) ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        (['P1001', 'P1002', 'P1011', 'P1017'].includes(error.code) ||
          (error.code === 'P2010' &&
            /server selection timeout|no available servers|connection refused|connection reset|TLS handshake/i.test(
              String(error.meta?.message ?? error.message)
            ))));

    if (databaseUnavailable) {
      return NextResponse.json(
        {
          code: 'DATABASE_UNAVAILABLE',
          error: 'ขณะนี้ระบบเชื่อมต่อฐานข้อมูลไม่ได้ กรุณาติดต่อผู้ดูแลระบบเพื่อตรวจสอบการเชื่อมต่อ MongoDB Atlas แล้วลองลงทะเบียนอีกครั้ง',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
