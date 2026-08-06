import { NextResponse } from 'next/server';

// In a real app, this would use a database to store OTPs.
// For prototype/testing, we store them in a global variable.
const globalOtpStore = global as any;
globalOtpStore.otps = globalOtpStore.otps || {};

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'กรุณาระบุอีเมล' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store it in memory with 5 minutes expiration
    globalOtpStore.otps[email] = {
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    };

    console.log(`[Mock Email] Sending OTP ${otp} to ${email}`);

    // Return the OTP in the response for easy testing during prototyping
    // IN PRODUCTION: DO NOT return the OTP to the client!
    return NextResponse.json({ 
      message: 'รหัส OTP ถูกส่งไปยังอีเมลของคุณแล้ว',
      mockOtp: otp // Included for testing alert
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการส่ง OTP' },
      { status: 500 }
    );
  }
}
