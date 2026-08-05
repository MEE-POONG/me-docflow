import { notFound } from 'next/navigation';
import { getAdminTemplateById, saveAdminDesignerLayout } from '../../actions';
import DocumentDesignerClient from '@/app/(dashboard)/templates/[id]/designer/DocumentDesignerClient';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminDesignerPage({ params }: Props) {
  const { id } = await params;
  const template = await getAdminTemplateById(id);

  if (!template || !template.isGlobal) notFound();

  // The tenant-side DocumentDesignerClient requires category and documentType,
  // which might be missing if we used a dummy, but our create action generates them.
  // We'll wrap the saveAdminDesignerLayout to match the expected signature.
  const handleSaveLayout = async (tempId: string, layoutJson: unknown) => {
    'use server';
    await saveAdminDesignerLayout(tempId, layoutJson);
  };

  return <DocumentDesignerClient template={template} onSave={handleSaveLayout} />;
}
