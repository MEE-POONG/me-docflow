import { getPartners } from './actions';
import OrganizationsClient from './OrganizationsClient';

export default async function OrganizationsPage() {
  const partners = await getPartners();

  return (
    <OrganizationsClient initialPartners={partners} />
  );
}
