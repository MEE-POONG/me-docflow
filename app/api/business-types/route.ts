import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const businessTypes = await prisma.masterBusinessType.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(businessTypes);
  } catch (error) {
    console.error('Error fetching business types:', error);
    return NextResponse.json({ error: 'Failed to fetch business types' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { value, label, isActive } = body;

    if (!value || !label) {
      return NextResponse.json({ error: 'Value and Label are required' }, { status: 400 });
    }

    const existing = await prisma.masterBusinessType.findUnique({
      where: { value }
    });

    if (existing) {
      return NextResponse.json({ error: 'Business type with this value already exists' }, { status: 409 });
    }

    const businessType = await prisma.masterBusinessType.create({
      data: {
        value,
        label,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json(businessType, { status: 201 });
  } catch (error) {
    console.error('Error creating business type:', error);
    return NextResponse.json({ error: 'Failed to create business type' }, { status: 500 });
  }
}
