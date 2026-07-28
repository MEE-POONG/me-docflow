import { getDocuments, getDocumentCategories, getDocumentTypes } from './actions';
import DocumentsClient from './DocumentsClient';

export default async function DocumentsPage() {
  const [documents, categories, docTypes] = await Promise.all([
    getDocuments(),
    getDocumentCategories(),
    getDocumentTypes(),
  ]);

  return (
    <DocumentsClient
      initialDocuments={documents}
      categories={categories}
      docTypes={docTypes}
    />
  );
}
