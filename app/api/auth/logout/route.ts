import { clearProfileSession } from '@/lib/profile-session'

export async function POST() {
  await clearProfileSession()
  return Response.json({ success: true })
}
