import { redirect } from 'next/navigation';
import { getPeopleManager } from '@/lib/people-access';
import { getEmployees, getDepartments } from './actions';
import EmployeesClient from './EmployeesClient';

export default async function EmployeesPage() {
  if (!await getPeopleManager()) redirect('/profile');
  const [employees, departments] = await Promise.all([
    getEmployees(),
    getDepartments()
  ]);

  return (
    <EmployeesClient initialEmployees={employees} departments={departments} />
  );
}
