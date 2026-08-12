import { notFound } from 'next/navigation';
import { getTemplateById } from '../actions';
import TemplateDetailClient from './TemplateDetailClient';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TemplateDetailPage({ params }: Props) {
  const { id } = await params;
  const template = await getTemplateById(id);

  if (!template) {
    notFound();
  }

  return <TemplateDetailClient template={template} />;
}
