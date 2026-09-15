import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const cookieName = 'me_docflow_profile_session'
const lifetime = 60 * 60 * 24

function sign(value: string) {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error('Session configuration is missing')
  return createHmac('sha256', secret).update(value).digest('base64url')
}

export async function createProfileSession(userId: string, companyId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, companyId, expires: Date.now() + lifetime * 1000 })).toString('base64url')
  const jar = await cookies()
  jar.set(cookieName, `${payload}.${sign(payload)}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: lifetime })
}

export async function readProfileSession() {
  const token = (await cookies()).get(cookieName)?.value
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null
    const [payload, signature] = parts
    const expected = Buffer.from(sign(payload))
    const actual = Buffer.from(signature)
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!/^[a-f\d]{24}$/i.test(session.userId) || !/^[a-f\d]{24}$/i.test(session.companyId) || !Number.isFinite(session.expires) || session.expires <= Date.now()) return null
    return session as { userId: string; companyId: string; expires: number }
  } catch { return null }
}

export async function clearProfileSession() {
  (await cookies()).delete(cookieName)
}
