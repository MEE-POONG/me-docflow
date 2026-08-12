'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { TemplateMode, PaperSize, PaperOrientation } from '@prisma/client';

async function getOrCreateGlobalCategoryAndType(typeSlug: string) {
  // Find or create global category
  let category = await prisma.documentCategory.findFirst({
    where: { isGlobal: true, slug: 'ADMIN-CAT' },
  });
  if (!category) {
    category = await prisma.documentCategory.create({
      data: {
        name: 'Admin Global Category',
        slug: 'ADMIN-CAT',
        isGlobal: true,
        isActive: true,
      },
    });
  }

  // Find or create global document type
  let docType = await prisma.documentType.findFirst({
    where: { isGlobal: true, categoryId: category.id, slug: typeSlug },
  });
  if (!docType) {
    docType = await prisma.documentType.create({
      data: {
        name: `${typeSlug} Document`,
        slug: typeSlug,
        categoryId: category.id,
        isGlobal: true,
        isActive: true,
      },
    });
  }

  return { categoryId: category.id, documentTypeId: docType.id };
}

export async function getAdminTemplates() {
  const templates = await prisma.documentTemplate.findMany({
    where: { isGlobal: true },
    orderBy: { createdAt: 'desc' },
    include: {
      documentType: true,
      createdByUser: true,
      createdByAdmin: true,
    }
  });

  return templates.map(t => ({
    id: t.id,
    name: t.name,
    type: t.documentType?.slug || 'QT',
    description: t.description || "",
    isActive: t.isActive,
    designer: t.createdByAdmin?.name || t.createdByUser?.name || "System Designer",
    layoutJson: t.layoutJson ? JSON.stringify(t.layoutJson) : null,
  }));
}

export async function createAdminTemplate(data: { name: string; type: string; description: string; isActive: boolean; designer: string }) {
  const { categoryId, documentTypeId } = await getOrCreateGlobalCategoryAndType(data.type);

  // Find an admin user to associate, or just leave null
  const admin = await prisma.systemAdmin.findFirst();

  await prisma.documentTemplate.create({
    data: {
      name: data.name,
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      description: data.description,
      categoryId,
      documentTypeId,
      templateMode: TemplateMode.DESIGNER,
      layoutJson: { elements: [] },
      paperSize: PaperSize.A4,
      orientation: PaperOrientation.PORTRAIT,
      isGlobal: true,
      isActive: data.isActive,
      createdByAdminId: admin?.id,
    },
  });
  revalidatePath('/admin/templates');
}

export async function updateAdminTemplate(id: string, data: { name: string; type: string; description: string; isActive: boolean; designer: string }) {
  const { categoryId, documentTypeId } = await getOrCreateGlobalCategoryAndType(data.type);

  await prisma.documentTemplate.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      description: data.description,
      categoryId,
      documentTypeId,
      isActive: data.isActive,
    },
  });
  revalidatePath('/admin/templates');
}

export async function deleteAdminTemplate(id: string) {
  await prisma.documentTemplate.delete({ where: { id } });
  revalidatePath('/admin/templates');
}

export async function saveAdminDesignerLayout(id: string, layoutJson: any) {
  await prisma.documentTemplate.update({
    where: { id },
    data: { layoutJson },
  });
  revalidatePath(`/admin/templates/${id}/designer`);
}

export async function getAdminTemplateById(id: string) {
  return prisma.documentTemplate.findUnique({
    where: { id },
    include: {
      category: true,
      documentType: true,
    }
  });
}
