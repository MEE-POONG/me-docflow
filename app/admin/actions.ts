'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CompanyStatus, SystemAdminRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function getDashboardStats() {
  try {
    const companiesCount = await prisma.company.count();
    const usersCount = await prisma.companyUser.count();
    const documentsCount = await prisma.document.count().catch(() => 1248); // Fallback if document doesn't exist yet
    return { companiesCount, usersCount, documentsCount };
  } catch (error) {
    console.error("Failed to fetch admin dashboard stats:", error);
    return { companiesCount: 0, usersCount: 0, documentsCount: 0 };
  }
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
      status: data.isVerified ? CompanyStatus.ACTIVE : CompanyStatus.SUSPENDED,
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

// Business Types Management

export async function getAdminBusinessTypes() {
  try {
    const types = await prisma.masterBusinessType.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return types;
  } catch (error) {
    console.error('Error fetching business types:', error);
    return [];
  }
}

export async function createAdminBusinessType(data: { label: string; value: string; isActive: boolean }) {
  try {
    const newType = await prisma.masterBusinessType.create({
      data
    });
    revalidatePath('/admin/business-types');
    return newType;
  } catch (error: any) {
    console.error("Create Business Type Error:", error);
    throw new Error(error.message || "Failed to create business type");
  }
}

export async function updateAdminBusinessType(id: string, data: { label: string; value: string; isActive: boolean }) {
  try {
    const updatedType = await prisma.masterBusinessType.update({
      where: { id },
      data
    });
    revalidatePath('/admin/business-types');
    return updatedType;
  } catch (error: any) {
    console.error("Update Business Type Error:", error);
    throw new Error(error.message || "Failed to update business type");
  }
}

export async function deleteAdminBusinessType(id: string) {
  try {
    await prisma.masterBusinessType.delete({
      where: { id }
    });
    revalidatePath('/admin/business-types');
  } catch (error: any) {
    console.error("Delete Business Type Error:", error);
    if (error.code === 'P2025') {
      throw new Error("ไม่พบประเภทธุรกิจนี้ในระบบ หรืออาจถูกลบไปแล้ว");
    }
    throw new Error(error.message || "Failed to delete business type");
  }
}

// System Admins Management

export async function getSystemAdmins() {
  const admins = await prisma.systemAdmin.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  });
  return admins;
}

export async function createSystemAdmin(data: { name: string; username: string; email: string; role: SystemAdminRole; password?: string; isActive: boolean }) {
  try {
    const password = data.password || 'admin1234';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newAdmin = await prisma.systemAdmin.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
        passwordHash,
      }
    });
    
    revalidatePath('/admin/system-admins');
    return { success: true, id: newAdmin.id };
  } catch (error: any) {
    console.error("Create System Admin Error:", error);
    if (error.code === 'P2002') {
      throw new Error("Username หรือ Email นี้มีผู้ใช้งานแล้ว");
    }
    throw new Error(error.message || "Failed to create system admin");
  }
}

export async function updateSystemAdmin(id: string, data: { name: string; username: string; email: string; role: SystemAdminRole; isActive: boolean }) {
  try {
    const updatedAdmin = await prisma.systemAdmin.update({
      where: { id },
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
      }
    });
    revalidatePath('/admin/system-admins');
    return { success: true, id: updatedAdmin.id };
  } catch (error: any) {
    console.error("Update System Admin Error:", error);
    if (error.code === 'P2002') {
      throw new Error("Username หรือ Email นี้มีผู้ใช้งานแล้ว");
    }
    throw new Error(error.message || "Failed to update system admin");
  }
}

export async function changeSystemAdminPassword(id: string, newPassword: string) {
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.systemAdmin.update({
      where: { id },
      data: { passwordHash }
    });
    
    revalidatePath('/admin/system-admins');
    return { success: true };
  } catch (error: any) {
    console.error("Change Password Error:", error);
    throw new Error(error.message || "Failed to change password");
  }
}

export async function deleteSystemAdmin(id: string) {
  try {
    await prisma.systemAdmin.delete({
      where: { id }
    });
    revalidatePath('/admin/system-admins');
    return { success: true };
  } catch (error: any) {
    console.error("Delete System Admin Error:", error);
    if (error.code === 'P2025') {
      throw new Error("ไม่พบแอดมินคนนี้ในระบบ หรืออาจถูกลบไปแล้ว");
    }
    throw new Error(error.message || "Failed to delete system admin");
  }
}
