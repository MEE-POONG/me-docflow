'use server';

import { prisma } from '@/lib/prisma';

// Helper to get a company by user email
async function getCompanyIdByEmail(email: string) {
  let company = await prisma.company.findFirst({
    where: { email }
  });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'My Company',
        legalName: 'My Company Ltd.',
        email: email
      }
    });
  }
  return company.id;
}

export async function getDashboardData(email: string) {
  if (!email) return null;
  const companyId = await getCompanyIdByEmail(email);

  // 1. Summary Cards
  const [
    totalDocs,
    drafts,
    pending,
    approved,
    customers,
    employees
  ] = await Promise.all([
    prisma.document.count({ where: { companyId } }),
    prisma.document.count({ where: { companyId, status: 'DRAFT' } }),
    prisma.document.count({ where: { companyId, status: 'PENDING' } }),
    prisma.document.count({ where: { companyId, status: 'APPROVED' } }),
    prisma.businessPartner.count({ where: { companyId } }),
    prisma.employee.count({ where: { companyId } })
  ]);

  // 2. Monthly Chart Data
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  
  const docsThisYear = await prisma.document.findMany({
    where: { companyId, createdAt: { gte: startOfYear } },
    select: { createdAt: true }
  });
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyCounts = Array(12).fill(0);
  docsThisYear.forEach(doc => {
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
    where: { companyId },
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

  // 4. Tables
  const recentDocs = await prisma.document.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      category: true,
      documentType: true
    }
  });
  
  const pendingDocs = await prisma.document.findMany({
    where: { companyId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      category: true,
      documentType: true
    }
  });

  return {
    summary: { totalDocs, drafts, pending, approved, customers, employees },
    chartData: chartData.length > 0 ? chartData : [{ name: monthNames[0], value: 0 }],
    categories,
    recentDocs,
    pendingDocs
  };
}
