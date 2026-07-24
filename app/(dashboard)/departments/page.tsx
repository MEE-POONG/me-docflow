import { getDepartments } from './actions';
import DepartmentsClient from './DepartmentsClient';

export default async function DepartmentsPage() {
  const departments = await getDepartments();

  return (
    <DepartmentsClient initialDepartments={departments} />
  );
}
