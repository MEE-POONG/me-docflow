import { redirect } from 'next/navigation'
import { getPeopleManager } from '@/lib/people-access'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  if (!await getPeopleManager()) redirect('/profile')
  return <UsersClient />
}
