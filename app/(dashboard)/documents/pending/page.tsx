import { getDocuments, getDocumentCategories, getDocumentTypes } from '../actions';
import DocumentsClient from '../DocumentsClient';

export default async function DocumentsPendingPage() {
  const [documents, categories, docTypes] = await Promise.all([
    getDocuments(),
    getDocumentCategories(),
    getDocumentTypes(),
  ]);

  // Pre-filter to only pending documents
  const pendingDocs = documents.filter((d) => d.status === 'PENDING');

  return (
    <DocumentsClient
      initialDocuments={pendingDocs}
      categories={categories}
      docTypes={docTypes}
    />
  );
}
