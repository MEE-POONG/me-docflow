import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { value, label, isActive } = body;

    if (!value || !label) {
      return NextResponse.json({ error: 'Value and Label are required' }, { status: 400 });
    }

    const businessType = await prisma.masterBusinessType.update({
      where: { id },
      data: {
        value,
        label,
        isActive
      }
    });

    return NextResponse.json(businessType);
  } catch (error) {
    console.error('Error updating business type:', error);
    return NextResponse.json({ error: 'Failed to update business type' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.masterBusinessType.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Business type deleted successfully' });
  } catch (error) {
    console.error('Error deleting business type:', error);
    return NextResponse.json({ error: 'Failed to delete business type' }, { status: 500 });
  }
}
