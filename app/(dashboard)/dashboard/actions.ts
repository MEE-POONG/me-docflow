'use server';

import { prisma } from '@/lib/prisma';

async function resolveCompanyId(email: string, companyId?: string) {
  if (companyId) {
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } });
    if (company) return company.id;
  }

  const companyUser = await prisma.companyUser.findFirst({
    where: { email },
    select: { companyId: true },
    orderBy: { createdAt: 'asc' },
  });
  if (companyUser) return companyUser.companyId;

  const company = await prisma.company.findFirst({ where: { email }, select: { id: true } });
  return company?.id ?? null;
}

export async function getDashboardData(email: string, companyId?: string) {
  if (!email) return null;
  const resolvedCompanyId = await resolveCompanyId(email, companyId);
  if (!resolvedCompanyId) return null;
  const accessibleResourceWhere = { OR: [{ companyId: resolvedCompanyId }, { isGlobal: true }] };

  // 1. Summary Cards
  const [
    totalDocs,
    drafts,
    pending,
    approved,
    customers,
    employees
  ] = await Promise.all([
    prisma.document.count({ where: { companyId: resolvedCompanyId } }),
    prisma.document.count({ where: { companyId: resolvedCompanyId, status: 'DRAFT' } }),
    prisma.document.count({ where: { companyId: resolvedCompanyId, status: 'PENDING' } }),
    prisma.document.count({ where: { companyId: resolvedCompanyId, status: 'APPROVED' } }),
    prisma.businessPartner.count({ where: { companyId: resolvedCompanyId } }),
    prisma.employee.count({ where: { companyId: resolvedCompanyId } })
  ]);

  const [templateCount, categoryCount, typeCount, accessibleTemplates] = await Promise.all([
    prisma.documentTemplate.count({ where: accessibleResourceWhere }),
    prisma.documentCategory.count({ where: accessibleResourceWhere }),
    prisma.documentType.count({ where: accessibleResourceWhere }),
    prisma.documentTemplate.findMany({
      where: accessibleResourceWhere,
      orderBy: { createdAt: 'desc' },
      include: { category: true, documentType: true },
    }),
  ]);

  // 2. Monthly Chart Data
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  
  const docsThisYear = await prisma.document.findMany({
    where: { companyId: resolvedCompanyId, createdAt: { gte: startOfYear } },
    select: { createdAt: true }
  });
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyCounts = Array(12).fill(0);
  const chartSource = docsThisYear.length > 0
    ? docsThisYear
    : accessibleTemplates.filter(template => template.createdAt >= startOfYear);
  chartSource.forEach(doc => {
    monthlyCounts[doc.createdAt.getMonth()]++;
  });
  
  // Show all 12 months up to current month (or all 12)
  const currentMonth = new Date().getMonth();
  const chartData = monthNames.slice(0, currentMonth + 1).map((name, index) => ({
    name,
    value: monthlyCounts[index]
  }));

  // 3. Category Progress Bars
  const categoryGroups = await prisma.document.groupBy({
    by: ['categoryId'],
    where: { companyId: resolvedCompanyId },
    _count: { id: true }
  });
  
  const categoryIds = categoryGroups.map(g => g.categoryId).filter(Boolean);
  const categoriesDb = await prisma.documentCategory.findMany({
    where: { id: { in: categoryIds } }
  });
  
  const totalCategorized = categoryGroups.reduce((acc, curr) => acc + curr._count.id, 0);
  let categories = categoryGroups.map(g => {
    const cat = categoriesDb.find(c => c.id === g.categoryId);
    const percentage = totalCategorized > 0 ? Math.round((g._count.id / totalCategorized) * 100) : 0;
    return {
      name: cat ? cat.name : 'ไม่ระบุหมวดหมู่',
      percentage,
      count: g._count.id
    };
  });
  
  categories.sort((a, b) => b.count - a.count);
  categories = categories.slice(0, 5); // top 5

  if (categories.length === 0) {
    const templateCategoryCounts = new Map<string, number>();
    accessibleTemplates.forEach(template => {
      templateCategoryCounts.set(template.category.name, (templateCategoryCounts.get(template.category.name) ?? 0) + 1);
    });
    const totalTemplates = accessibleTemplates.length;
    categories = Array.from(templateCategoryCounts, ([name, count]) => ({
      name,
      count,
      percentage: totalTemplates > 0 ? Math.round((count / totalTemplates) * 100) : 0,
    })).sort((a, b) => b.count - a.count).slice(0, 5);
  }

  // 4. Tables
  const recentDocs = await prisma.document.findMany({
    where: { companyId: resolvedCompanyId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      category: true,
      documentType: true
    }
  });
  
  const pendingDocs = await prisma.document.findMany({
    where: { companyId: resolvedCompanyId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      category: true,
      documentType: true
    }
  });

  return {
    summary: { totalDocs, drafts, pending, approved, customers, employees, templateCount, categoryCount, typeCount },
    chartData: chartData.length > 0 ? chartData : [{ name: monthNames[0], value: 0 }],
    chartMetric: docsThisYear.length > 0 ? 'documents' : 'templates',
    categories,
    categoryMetric: categoryGroups.length > 0 ? 'documents' : 'templates',
    recentDocs,
    pendingDocs,
    recentTemplates: accessibleTemplates.slice(0, 5).map(template => ({
      id: template.id,
      name: template.name,
      category: template.category.name,
      documentType: template.documentType.name,
      isGlobal: template.isGlobal,
      createdAt: template.createdAt,
    })),
  };
}
