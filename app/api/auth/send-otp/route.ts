import { NextResponse } from 'next/server';
import { issueOtp, normalizeOtpEmail, OtpError } from '@/lib/otp';
import { MailConfigurationError, sendOtpEmail } from '@/lib/mail';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeOtpEmail(body?.email);
    await issueOtp(email, sendOtpEmail);
    return NextResponse.json({ message: 'รหัส OTP ถูกส่งไปยังอีเมลของคุณแล้ว' });
  } catch (error: unknown) {
    if (error instanceof OtpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'ข้อมูลคำขอไม่ถูกต้อง' }, { status: 400 });
    }
    // Do not log credentials, the OTP, or SMTP response bodies.
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'UNKNOWN';
    console.error('OTP email delivery failed:', code);
    const configurationError = error instanceof MailConfigurationError || code === 'EAUTH';
    return NextResponse.json(
      { error: configurationError
        ? 'ระบบส่งอีเมลยังไม่พร้อม กรุณาให้ผู้ดูแลตรวจสอบ MAIL_USER และ Gmail App Password ใน MAIL_PASS'
        : 'ส่งอีเมล OTP ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' },
      { status: 503 }
    );
  }
}
