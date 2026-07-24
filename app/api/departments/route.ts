import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper for dev environment (since auth isn't fully set up yet)
async function getDefaultCompanyId() {
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Default Company',
        legalName: 'Default Company Ltd.',
      },
    });
  }
  return company.id;
}

export async function GET(request: NextRequest) {
  try {
    const companyId = await getDefaultCompanyId();
    
    // Check for query params if needed
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const whereClause: any = { companyId };
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true';
    }

    const departments = await prisma.department.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, employees: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: departments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyId = await getDefaultCompanyId();
    const body = await request.json();

    const { name, description, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Department name is required' },
        { status: 400 }
      );
    }

    // Check for existing department with same name in the company
    const existing = await prisma.department.findUnique({
      where: {
        companyId_name: {
          companyId,
          name
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Department with this name already exists' },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: {
        companyId,
        name,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, data: department }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create department' },
      { status: 500 }
    );
  }
}
