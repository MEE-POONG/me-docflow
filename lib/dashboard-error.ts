// Return only fixed, user-facing messages; never expose connector errors or URLs.
export function dashboardErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? error.code : undefined;

  if (code === 'P1000' || /AuthenticationFailed|SCRAM failure|bad auth|authentication failed/i.test(message)) {
    return 'ฐานข้อมูลปฏิเสธการยืนยันตัวตน กรุณาให้ผู้ดูแลระบบตรวจสอบบัญชีเชื่อมต่อฐานข้อมูล แล้วลองใหม่อีกครั้ง';
  }
  if (code === 'P1001' || code === 'P1002' || code === 'P1017' ||
      /server selection timeout|DNS resolution|connection refused|connection timed out/i.test(message)) {
    return 'ขณะนี้ระบบติดต่อฐานข้อมูลไม่ได้ กรุณาลองใหม่ หากยังพบปัญหาให้ติดต่อผู้ดูแลระบบ';
  }
  return 'เกิดข้อผิดพลาดขณะโหลดข้อมูล กรุณาลองใหม่ หากยังพบปัญหาให้ติดต่อผู้ดูแลระบบ';
}
