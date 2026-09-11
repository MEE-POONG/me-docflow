import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const RESEND_DELAY_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
type OtpEntry = { hash: Buffer; expiresAt: number; sentAt: number; attempts: number; ready: boolean };

// Shared across route handlers and hot reloads on the local Node server.
// Multi-instance deployments need a shared persistent store instead.
const otpGlobal = globalThis as typeof globalThis & { registrationOtps?: Map<string, OtpEntry> };
const otps = otpGlobal.registrationOtps ??= new Map<string, OtpEntry>();

export class OtpError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function normalizeOtpEmail(value: unknown): string {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value.trim())) {
    throw new OtpError('กรุณาระบุอีเมลให้ถูกต้อง');
  }
  return value.trim().toLowerCase();
}

function hashOtp(otp: string) { return createHash('sha256').update(otp).digest(); }

export async function issueOtp(email: string, send: (email: string, otp: string) => Promise<void>) {
  const now = Date.now();
  for (const [key, value] of otps) {
    if (value.expiresAt <= now) otps.delete(key);
  }
  const previous = otps.get(email);
  if (previous && now - previous.sentAt < RESEND_DELAY_MS) {
    throw new OtpError('กรุณารอ 60 วินาทีก่อนขอรหัส OTP ใหม่', 429);
  }
  const otp = randomInt(100000, 1000000).toString();
  const entry: OtpEntry = {
    hash: hashOtp(otp), expiresAt: now + OTP_LIFETIME_MS,
    sentAt: now, attempts: 0, ready: false,
  };
  // Reserve before sending to prevent concurrent duplicate emails.
  otps.set(email, entry);
  try {
    await send(email, otp);
    entry.ready = true;
  } catch (error) {
    if (otps.get(email) === entry) {
      if (previous && previous.expiresAt > Date.now()) otps.set(email, previous);
      else otps.delete(email);
    }
    throw error;
  }
}

export function verifyOtp(email: string, otp: unknown) {
  const entry = otps.get(email);
  if (!entry || !entry.ready) throw new OtpError('ไม่พบข้อมูล OTP กรุณาขอใหม่');
  if (Date.now() >= entry.expiresAt) {
    otps.delete(email);
    throw new OtpError('รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่');
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    throw new OtpError('กรอกรหัสผิดเกินจำนวนครั้งที่กำหนด กรุณาขอรหัสใหม่', 429);
  }
  entry.attempts++;
  if (typeof otp !== 'string' || !/^\d{6}$/.test(otp) || !timingSafeEqual(entry.hash, hashOtp(otp))) {
    throw new OtpError('รหัส OTP ไม่ถูกต้อง');
  }
  otps.delete(email);
}
