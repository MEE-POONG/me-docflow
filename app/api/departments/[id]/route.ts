import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const companyId = await getDefaultCompanyId();

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, employees: true }
        }
      }
    });

    if (!department || department.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: department });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch department' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const companyId = await getDefaultCompanyId();
    const body = await request.json();

    const { name, description, isActive } = body;

    // Verify ownership
    const existing = await prisma.department.findUnique({
      where: { id }
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check name conflict if name is changing
    if (name && name !== existing.name) {
      const conflict = await prisma.department.findUnique({
        where: {
          companyId_name: {
            companyId,
            name
          }
        }
      });

      if (conflict) {
        return NextResponse.json(
          { success: false, error: 'Department with this name already exists' },
          { status: 400 }
        );
      }
    }

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      }
    });

    return NextResponse.json({ success: true, data: updatedDepartment });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update department' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const companyId = await getDefaultCompanyId();

    // Verify ownership
    const existing = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, employees: true }
        }
      }
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // Optional: Prevent deletion if there are users or employees
    if (existing._count.users > 0 || existing._count.employees > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete department that has users or employees assigned to it' },
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Department deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete department' },
      { status: 500 }
    );
  }
}
