import { getDocuments, getDocumentCategories, getDocumentTypes, getDocumentTemplates } from './actions';
import DocumentsClient from './DocumentsClient';

export default async function DocumentsPage() {
  const [documents, categories, docTypes, templates] = await Promise.all([
    getDocuments(),
    getDocumentCategories(),
    getDocumentTypes(),
    getDocumentTemplates(),
  ]);

  return (
    <DocumentsClient
      initialDocuments={documents}
      categories={categories}
      docTypes={docTypes}
      initialTemplates={templates}
    />
  );
}
