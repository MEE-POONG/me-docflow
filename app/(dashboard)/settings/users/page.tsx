import type { Metadata } from 'next';
import { redirect } from 'next/navigation'
import { getPeopleManager } from '@/lib/people-access'
import UsersClient from './UsersClient'

export const metadata: Metadata = {
  title: 'จัดการผู้ใช้งาน | ME Docflow',
  description: 'เพิ่มและจัดการบัญชีพนักงานภายในบริษัท',
};

export default async function UsersPage() {
  if (!await getPeopleManager()) redirect('/profile')
  return <UsersClient />
}
