import { NextResponse } from 'next/server';
import { normalizeOtpEmail, OtpError, verifyOtp } from '@/lib/otp';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    verifyOtp(normalizeOtpEmail(body?.email), body?.otp);
    return NextResponse.json({ message: 'ยืนยัน OTP สำเร็จ' });
  } catch (error: unknown) {
    if (error instanceof OtpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการตรวจสอบ OTP' },
      { status: error instanceof SyntaxError ? 400 : 500 }
    );
  }
}
