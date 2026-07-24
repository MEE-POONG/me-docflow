import { getEmployees, getDepartments } from './actions';
import EmployeesClient from './EmployeesClient';

export default async function EmployeesPage() {
  const [employees, departments] = await Promise.all([
    getEmployees(),
    getDepartments()
  ]);

  return (
    <EmployeesClient initialEmployees={employees} departments={departments} />
  );
}
