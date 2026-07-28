import { getTemplates, getCategories, getDocumentTypes } from './actions';
import TemplatesClient from './TemplatesClient';

export default async function TemplatesPage() {
  const [templates, categories, docTypes] = await Promise.all([
    getTemplates(),
    getCategories(),
    getDocumentTypes(),
  ]);

  return (
    <TemplatesClient
      initialTemplates={templates}
      categories={categories}
      docTypes={docTypes}
    />
  );
}
