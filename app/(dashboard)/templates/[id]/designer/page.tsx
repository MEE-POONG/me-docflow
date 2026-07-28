import { notFound } from 'next/navigation';
import { getTemplateById } from '../../actions';
import DocumentDesignerClient from './DocumentDesignerClient';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DesignerPage({ params }: Props) {
  const { id } = await params;
  const template = await getTemplateById(id);

  if (!template) notFound();

  return <DocumentDesignerClient template={template} />;
}
