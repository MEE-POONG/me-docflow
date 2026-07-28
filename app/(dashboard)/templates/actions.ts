'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { TemplateMode, PaperSize, PaperOrientation, FieldType } from '@prisma/client';

// ─── Helpers ───────────────────────────────────────────────────────────────

async function getDefaultCompanyId() {
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: { name: 'Default Company', legalName: 'Default Company Ltd.' },
    });
  }
  return company.id;
}

async function getDefaultUserId(companyId: string) {
  let user = await prisma.companyUser.findFirst({ where: { companyId } });
  if (!user) {
    user = await prisma.companyUser.create({
      data: {
        companyId,
        name: 'Admin',
        email: 'admin@default.com',
        passwordHash: 'hashed',
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });
  }
  return user.id;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type TemplateWithRelations = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  templateMode: TemplateMode;
  paperSize: PaperSize;
  orientation: PaperOrientation;
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string };
  documentType: { id: string; name: string };
  _count: { fields: number; documents: number };
};

export type TemplateFieldData = {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder: string | null;
  showOrder: number;
  options: unknown;
  defaultValue: unknown;
};

// ─── Template CRUD ──────────────────────────────────────────────────────────

export async function getTemplates(): Promise<TemplateWithRelations[]> {
  const companyId = await getDefaultCompanyId();
  return prisma.documentTemplate.findMany({
    where: { OR: [{ companyId }, { isGlobal: true }] },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      templateMode: true,
      paperSize: true,
      orientation: true,
      version: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { id: true, name: true } },
      documentType: { select: { id: true, name: true } },
      _count: { select: { fields: true, documents: true } },
    },
  });
}

export async function getTemplateById(id: string) {
  return prisma.documentTemplate.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      templateMode: true,
      paperSize: true,
      orientation: true,
      version: true,
      isActive: true,
      htmlContent: true,
      cssContent: true,
      layoutJson: true,
      categoryId: true,
      documentTypeId: true,
      category: { select: { id: true, name: true } },
      documentType: { select: { id: true, name: true } },
      fields: {
        orderBy: { showOrder: 'asc' },
        select: {
          id: true,
          key: true,
          label: true,
          type: true,
          required: true,
          placeholder: true,
          showOrder: true,
          options: true,
          defaultValue: true,
        },
      },
    },
  });
}

export async function getCategories() {
  const companyId = await getDefaultCompanyId();
  return prisma.documentCategory.findMany({
    where: { OR: [{ companyId }, { isGlobal: true }], isActive: true },
    orderBy: { showOrder: 'asc' },
    select: { id: true, name: true },
  });
}

export async function getDocumentTypes(categoryId?: string) {
  const companyId = await getDefaultCompanyId();
  return prisma.documentType.findMany({
    where: {
      OR: [{ companyId }, { isGlobal: true }],
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { showOrder: 'asc' },
    select: { id: true, name: true, categoryId: true },
  });
}

export async function createTemplate(data: {
  name: string;
  categoryId: string;
  documentTypeId: string;
  description?: string | null;
  templateMode: TemplateMode;
  paperSize: PaperSize;
  orientation: PaperOrientation;
  isActive: boolean;
}) {
  const companyId = await getDefaultCompanyId();
  const userId = await getDefaultUserId(companyId);

  await prisma.documentTemplate.create({
    data: {
      companyId,
      categoryId: data.categoryId,
      documentTypeId: data.documentTypeId,
      name: data.name,
      slug: slugify(data.name),
      description: data.description || null,
      templateMode: data.templateMode,
      paperSize: data.paperSize,
      orientation: data.orientation,
      isActive: data.isActive,
      isGlobal: false,
      layoutJson: {},
      createdByUserId: userId,
    },
  });
  revalidatePath('/templates');
}

export async function updateTemplate(
  id: string,
  data: {
    name: string;
    categoryId: string;
    documentTypeId: string;
    description?: string | null;
    templateMode: TemplateMode;
    paperSize: PaperSize;
    orientation: PaperOrientation;
    isActive: boolean;
  }
) {
  await prisma.documentTemplate.update({
    where: { id },
    data: {
      name: data.name,
      slug: slugify(data.name),
      categoryId: data.categoryId,
      documentTypeId: data.documentTypeId,
      description: data.description || null,
      templateMode: data.templateMode,
      paperSize: data.paperSize,
      orientation: data.orientation,
      isActive: data.isActive,
    },
  });
  revalidatePath('/templates');
  revalidatePath(`/templates/${id}`);
}

export async function deleteTemplate(id: string) {
  // Delete all fields first, then template
  await prisma.templateField.deleteMany({ where: { templateId: id } });
  await prisma.documentTemplate.delete({ where: { id } });
  revalidatePath('/templates');
}

// ─── Template Fields CRUD ───────────────────────────────────────────────────

export async function createTemplateField(
  templateId: string,
  data: {
    key: string;
    label: string;
    type: FieldType;
    required: boolean;
    placeholder?: string | null;
    showOrder: number;
    options?: unknown;
    defaultValue?: unknown;
  }
) {
  const companyId = await getDefaultCompanyId();
  await prisma.templateField.create({
    data: {
      templateId,
      companyId,
      key: data.key,
      label: data.label,
      type: data.type,
      required: data.required,
      placeholder: data.placeholder || null,
      showOrder: data.showOrder,
      options: (data.options as object) ?? undefined,
      defaultValue: (data.defaultValue as object) ?? undefined,
    },
  });
  revalidatePath(`/templates/${templateId}`);
}

export async function updateTemplateField(
  fieldId: string,
  templateId: string,
  data: {
    key: string;
    label: string;
    type: FieldType;
    required: boolean;
    placeholder?: string | null;
    showOrder: number;
    options?: unknown;
    defaultValue?: unknown;
  }
) {
  await prisma.templateField.update({
    where: { id: fieldId },
    data: {
      key: data.key,
      label: data.label,
      type: data.type,
      required: data.required,
      placeholder: data.placeholder || null,
      showOrder: data.showOrder,
      options: (data.options as object) ?? undefined,
      defaultValue: (data.defaultValue as object) ?? undefined,
    },
  });
  revalidatePath(`/templates/${templateId}`);
}

export async function deleteTemplateField(fieldId: string, templateId: string) {
  await prisma.templateField.delete({ where: { id: fieldId } });
  revalidatePath(`/templates/${templateId}`);
}

export async function reorderTemplateFields(
  templateId: string,
  fieldOrders: { id: string; showOrder: number }[]
) {
  await Promise.all(
    fieldOrders.map((f) =>
      prisma.templateField.update({
        where: { id: f.id },
        data: { showOrder: f.showOrder },
      })
    )
  );
  revalidatePath(`/templates/${templateId}`);
}

// ─── Designer Layout ─────────────────────────────────────────────────────────

export async function saveDesignerLayout(
  templateId: string,
  layoutJson: object
) {
  await prisma.documentTemplate.update({
    where: { id: templateId },
    data: { layoutJson },
  });
  revalidatePath(`/templates/${templateId}/designer`);
}
