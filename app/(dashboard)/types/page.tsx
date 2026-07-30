import { getDocumentTypes, getCategories } from './actions';
import TypesClient from './TypesClient';

export default async function TypesPage() {
  const [types, categories] = await Promise.all([getDocumentTypes(), getCategories()]);
  return <TypesClient initialTypes={types} categories={categories} />;
}
