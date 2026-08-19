'use server';

import { prisma } from '@/lib/prisma';

export async function getReportsData(email: string, period: '30d' | 'year' | 'all' = 'year') {
  const company = await prisma.company.findFirst({ where: { email } });
  if (!company) return null;

  const now = new Date();
  const dateFrom = period === '30d'
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    : period === 'year'
      ? new Date(now.getFullYear(), 0, 1)
      : undefined;
  const where = { companyId: company.id, ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}) };

  const documents = await prisma.document.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { category: { select: { name: true } }, documentType: { select: { name: true } } },
  });

  const statuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ARCHIVED'] as const;
  const statusCounts = statuses.map((status) => ({
    status,
    count: documents.filter((document) => document.status === status).length,
  }));

  const categoryMap = new Map<string, number>();
  documents.forEach((document) => categoryMap.set(document.category.name, (categoryMap.get(document.category.name) ?? 0) + 1));
  const categories = Array.from(categoryMap, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const monthMap = new Map<string, number>();
  documents.forEach((document) => {
    const key = `${document.createdAt.getFullYear()}-${String(document.createdAt.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  });
  const monthly = Array.from(monthMap, ([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month));

  const totalValueSatang = documents.reduce((sum, document) => sum + (document.totalSatang ?? 0), 0);
  const approvedValueSatang = documents
    .filter((document) => document.status === 'APPROVED')
    .reduce((sum, document) => sum + (document.totalSatang ?? 0), 0);

  return {
    companyName: company.name,
    summary: {
      total: documents.length,
      approved: statusCounts.find((item) => item.status === 'APPROVED')?.count ?? 0,
      pending: statusCounts.find((item) => item.status === 'PENDING')?.count ?? 0,
      totalValueSatang,
      approvedValueSatang,
    },
    statuses: statusCounts,
    categories: categories.slice(0, 8),
    monthly,
    documents: documents.slice(0, 100).map((document) => ({
      id: document.id,
      documentNo: document.documentNo,
      title: document.title,
      category: document.category.name,
      type: document.documentType.name,
      status: document.status,
      totalSatang: document.totalSatang ?? 0,
      createdAt: document.createdAt.toISOString(),
    })),
  };
}
