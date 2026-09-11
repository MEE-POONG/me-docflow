import nodemailer from 'nodemailer';

export class MailConfigurationError extends Error {}

export function createMailTransport() {
  const user = process.env.MAIL_USER?.trim();
  const pass = process.env.MAIL_PASS?.replace(/\s/g, '');
  if (!user || !pass) {
    throw new MailConfigurationError('กรุณาตั้งค่า MAIL_USER และ MAIL_PASS สำหรับส่งอีเมล');
  }
  return nodemailer.createTransport({
    service: 'gmail', auth: { user, pass },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
  });
}

export async function sendOtpEmail(email: string, otp: string) {
  const transporter = createMailTransport();
  const result = await transporter.sendMail({
    from: { name: 'ME DocFlow', address: process.env.MAIL_USER!.trim() },
    to: { name: '', address: email },
    subject: 'รหัส OTP สำหรับลงทะเบียน ME DocFlow',
    text: `รหัสยืนยันอีเมลของคุณคือ ${otp}\n\nรหัสนี้มีอายุ 5 นาที และใช้ได้เพียงครั้งเดียว\nหากคุณไม่ได้ขอลงทะเบียน สามารถละเว้นอีเมลนี้ได้`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#1f2937"><h2>ยืนยันอีเมล ME DocFlow</h2><p>รหัส OTP สำหรับลงทะเบียนของคุณคือ</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#059669">${otp}</p><p>รหัสนี้มีอายุ <strong>5 นาที</strong> และใช้ได้เพียงครั้งเดียว</p><p>หากคุณไม่ได้ขอลงทะเบียน สามารถละเว้นอีเมลนี้ได้</p></div>`,
  });
  if (result.accepted.length === 0) throw new Error('SMTP_RECIPIENT_REJECTED');
}
