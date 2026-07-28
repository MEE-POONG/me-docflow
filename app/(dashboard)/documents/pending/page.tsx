import { getDocuments, getDocumentCategories, getDocumentTypes, getDocumentTemplates } from '../actions';
import DocumentsClient from '../DocumentsClient';

export default async function DocumentsPendingPage() {
  const [documents, categories, docTypes, templates] = await Promise.all([
    getDocuments(),
    getDocumentCategories(),
    getDocumentTypes(),
    getDocumentTemplates(),
  ]);

  // Pre-filter to only pending documents
  const pendingDocs = documents.filter((d) => d.status === 'PENDING');

  return (
    <DocumentsClient
      initialDocuments={pendingDocs}
      categories={categories}
      docTypes={docTypes}
      initialTemplates={templates}
    />
  );
}
