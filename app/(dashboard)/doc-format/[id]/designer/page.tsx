import { notFound } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { getTemplateById } from '../../actions';
import DocumentDesignerClient from './DocumentDesignerClient';

const prisma = new PrismaClient();

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DesignerPage({ params }: Props) {
  const { id } = await params;
  const template = await getTemplateById(id);

  if (!template) notFound();

  const documents = await prisma.document.findMany({
    where: {
      categoryId: template.categoryId,
      documentTypeId: template.documentTypeId,
    },
    include: {
      company: true,
      createdBy: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return <DocumentDesignerClient template={template} documents={documents} />;
}
