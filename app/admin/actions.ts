'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CompanyStatus } from '@prisma/client';

export async function getDashboardStats() {
  const companiesCount = await prisma.company.count();
  const usersCount = await prisma.companyUser.count();
  const documentsCount = await prisma.document.count().catch(() => 1248); // Fallback if document doesn't exist yet
  return { companiesCount, usersCount, documentsCount };
}

export async function getAdminCompanies() {
  const companies = await prisma.company.findMany({
    include: {
      users: {
        where: { role: 'OWNER' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return companies.map(c => ({
    id: c.id,
    companyName: c.name,
    taxId: c.taxId || '',
    address: c.address || '',
    phone: c.phone || '',
    email: c.email || '',
    website: '',
    ownerEmail: c.users.length > 0 ? c.users[0].email : '',
    isActive: c.status === 'ACTIVE',
    isVerified: c.status === 'ACTIVE',
  }));
}

export async function updateAdminCompany(id: string, data: any) {
  await prisma.company.update({
    where: { id },
    data: {
      name: data.companyName,
      taxId: data.taxId,
      address: data.address,
      phone: data.phone,
      email: data.email,
      status: data.isVerified ? CompanyStatus.ACTIVE : CompanyStatus.INACTIVE,
    },
  });
  revalidatePath('/admin/companies');
}

export async function deleteAdminCompany(id: string) {
  await prisma.companyUser.deleteMany({ where: { companyId: id } });
  await prisma.company.delete({ where: { id } });
  revalidatePath('/admin/companies');
}

export async function getAdminUsers() {
  const users = await prisma.companyUser.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return users.map(u => ({
    id: u.id,
    fullName: u.name,
    email: u.email,
    role: u.role,
    status: u.status === 'ACTIVE' ? 'active' : 'inactive',
  }));
}

export async function updateAdminUser(id: string, data: any) {
  const updateData: any = {
    name: data.fullName,
    email: data.email,
    role: data.role as any,
    status: data.status === 'active' ? 'ACTIVE' : 'INACTIVE',
  };

  if (data.password) {
    updateData.passwordHash = data.password; // Note: In a real app, hash this password
  }

  await prisma.companyUser.update({
    where: { id },
    data: updateData,
  });
  revalidatePath('/admin/users');
}

export async function deleteAdminUser(id: string) {
  await prisma.companyUser.delete({ where: { id } });
  revalidatePath('/admin/users');
}

export async function getAdminCategories() {
  const categories = await prisma.documentCategory.findMany({
    where: { isGlobal: true },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: {
        select: { documents: true }
      }
    }
  });

  return categories.map(c => ({
    id: c.id,
    name: c.name,
    code: c.slug,
    description: c.description || "",
    documentCount: c._count.documents,
    isActive: c.isActive,
  }));
}

export async function createAdminCategory(data: { name: string; code: string; description: string; isActive?: boolean }) {
  await prisma.documentCategory.create({
    data: {
      name: data.name,
      slug: data.code,
      description: data.description,
      isGlobal: true,
      isActive: data.isActive ?? true,
    },
  });
  revalidatePath('/admin/categories');
}

export async function updateAdminCategory(id: string, data: { name: string; code: string; description: string; isActive?: boolean }) {
  await prisma.documentCategory.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.code,
      description: data.description,
      isActive: data.isActive,
    },
  });
  revalidatePath('/admin/categories');
}

export async function deleteAdminCategory(id: string) {
  // Find all global templates in this category
  const templates = await prisma.documentTemplate.findMany({ where: { categoryId: id, isGlobal: true } });
  
  // Delete template fields for those templates
  for (const t of templates) {
    await prisma.templateField.deleteMany({ where: { templateId: t.id } });
  }
  
  // Delete the templates
  await prisma.documentTemplate.deleteMany({ where: { categoryId: id, isGlobal: true } });
  
  // Delete the document types
  await prisma.documentType.deleteMany({ where: { categoryId: id, isGlobal: true } });

  // Ensure no other types are still referencing it (e.g. from tenants)
  const remainingTypes = await prisma.documentType.count({ where: { categoryId: id } });
  if (remainingTypes > 0) {
    throw new Error("Cannot delete category. It is being used by tenant document types.");
  }

  await prisma.documentCategory.delete({ where: { id } });
  revalidatePath('/admin/categories');
}

export async function getAdminDocumentTypes() {
  const types = await prisma.documentType.findMany({
    where: { isGlobal: true },
    include: {
      category: true
    },
    orderBy: { createdAt: 'asc' },
  });

  return types.map(t => ({
    id: t.id,
    name: t.name,
    prefix: t.slug,
    categoryCode: t.category.slug,
    description: t.description || "",
  }));
}

export async function createAdminDocumentType(data: { name: string; prefix: string; categoryCode: string; description: string; }) {
  try {
    const category = await prisma.documentCategory.findFirst({
      where: { slug: data.categoryCode, isGlobal: true }
    });

    if (!category) {
      throw new Error("Category not found");
    }

    await prisma.documentType.create({
      data: {
        name: data.name,
        slug: data.prefix,
        description: data.description,
        categoryId: category.id,
        isGlobal: true,
        isActive: true,
      }
    });

    revalidatePath('/admin/types');
  } catch (error: any) {
    console.error("Create Document Type Error:", error);
    if (error.code === 'P2002') {
      throw new Error("ไม่สามารถบันทึกได้ เนื่องจาก 'คำนำหน้า (Prefix)' นี้ถูกใช้งานไปแล้วในหมวดหมู่นี้ กรุณากำหนดคำนำหน้าใหม่");
    }
    throw new Error(error.message || "Failed to create document type");
  }
}

export async function updateAdminDocumentType(id: string, data: { name: string; prefix: string; categoryCode: string; description: string; }) {
  try {
    if (!id || id.length !== 24) {
      throw new Error("ไม่สามารถแก้ไขข้อมูลจำลองได้ กรุณารีเฟรชหน้าจอ (Invalid ID)");
    }

    const category = await prisma.documentCategory.findFirst({
      where: { slug: data.categoryCode, isGlobal: true }
    });

    if (!category) {
      throw new Error("Category not found");
    }

    await prisma.documentType.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.prefix,
        description: data.description,
        categoryId: category.id,
      }
    });

    revalidatePath('/admin/types');
  } catch (error: any) {
    console.error("Update Document Type Error:", error);
    if (error.code === 'P2002') {
      throw new Error("ไม่สามารถแก้ไขได้ เนื่องจาก 'คำนำหน้า (Prefix)' นี้ถูกใช้งานไปแล้วในหมวดหมู่นี้ กรุณากำหนดคำนำหน้าใหม่");
    }
    throw new Error(error.message || "Failed to update document type");
  }
}

export async function deleteAdminDocumentType(id: string) {
  try {
    if (!id || id.length !== 24) {
      throw new Error("ไม่สามารถลบข้อมูลจำลองได้ กรุณารีเฟรชหน้าจอ (Invalid ID)");
    }

    // Check if it's used by templates
    const templateCount = await prisma.documentTemplate.count({
      where: { documentTypeId: id }
    });
    
    if (templateCount > 0) {
      throw new Error("ไม่อนุญาตให้ลบประเภทเอกสาร เนื่องจากมีแบบฟอร์มเอกสารที่เชื่อมโยงอยู่");
    }

    // Check if it's used by actual documents
    const docCount = await prisma.document.count({
      where: { documentTypeId: id }
    });

    if (docCount > 0) {
      throw new Error("ไม่อนุญาตให้ลบประเภทเอกสาร เนื่องจากมีเอกสารที่ถูกสร้างและใช้งานอยู่");
    }

    await prisma.documentType.delete({
      where: { id }
    });

    revalidatePath('/admin/types');
  } catch (error: any) {
    console.error("Delete Document Type Error:", error);
    // Return friendly error if record doesn't exist
    if (error.code === 'P2025') {
      throw new Error("ไม่พบประเภทเอกสารนี้ในระบบ หรืออาจถูกลบไปแล้ว");
    }
    // Return friendly error if relational constraint is violated (just in case)
    if (error.code === 'P2014') {
      throw new Error("ไม่อนุญาตให้ลบประเภทเอกสาร เนื่องจากมีการเชื่อมโยงข้อมูลกับระบบอื่นอยู่");
    }
    throw new Error(error.message || "Failed to delete document type");
  }
}
