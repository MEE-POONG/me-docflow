import { NextResponse } from 'next/server';

const globalOtpStore = global as any;
globalOtpStore.otps = globalOtpStore.otps || {};

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    const storedOtp = globalOtpStore.otps[email];

    if (!storedOtp) {
      return NextResponse.json({ error: 'ไม่พบข้อมูล OTP กรุณาขอใหม่' }, { status: 400 });
    }

    if (Date.now() > storedOtp.expiresAt) {
      delete globalOtpStore.otps[email];
      return NextResponse.json({ error: 'รหัส OTP หมดอายุแล้ว' }, { status: 400 });
    }

    if (storedOtp.code !== otp) {
      return NextResponse.json({ error: 'รหัส OTP ไม่ถูกต้อง' }, { status: 400 });
    }

    // OTP matches, we can clear it
    delete globalOtpStore.otps[email];

    return NextResponse.json({ message: 'ยืนยัน OTP สำเร็จ' }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการตรวจสอบ OTP' },
      { status: 500 }
    );
  }
}
