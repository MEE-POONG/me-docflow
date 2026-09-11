export type NumberConfig = { prefix: string; useDate: boolean; digits: number; startNumber: number }
export type NumberSettingsRow = NumberConfig & { documentTypeId: string; title: string; saved: boolean }

export function numberPeriod(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit' }).formatToParts(date)
  const year = Number(parts.find(p => p.type === 'year')!.value)
  const month = Number(parts.find(p => p.type === 'month')!.value)
  return { year, month, stamp: `${year}${String(month).padStart(2, '0')}` }
}

export function formatDocumentNumber(config: NumberConfig, number = config.startNumber, date = new Date()) {
  return `${config.prefix}${config.useDate ? `-${numberPeriod(date).stamp}-` : ''}${String(number).padStart(config.digits, '0')}`
}

export function defaultNumberConfig(type: { name: string; slug: string }): NumberConfig {
  const name = type.name.toLowerCase()
  const prefix = name.includes('ใบเสนอราคา') || name.includes('quotation') ? 'QT'
    : name.includes('ใบสั่งซื้อ') || name.includes('purchase order') ? 'PO'
    : name.includes('ใบสำคัญจ่าย') || name.includes('payment voucher') ? 'PV'
    : name.includes('ใบสำคัญรับ') || name.includes('receipt voucher') ? 'RV'
    : name.includes('ใบกำกับภาษี') || name.includes('invoice') || name.includes('ใบแจ้งหนี้') ? 'INV'
    : name.includes('ใบเสร็จ') || name.includes('receipt') ? 'RE'
    : type.slug.toUpperCase()
  return { prefix, useDate: true, digits: 4, startNumber: 1 }
}

export function validateNumberConfig(config: NumberConfig) {
  if (!config.prefix?.trim() || config.prefix.trim().length > 40 || /[\r\n]/.test(config.prefix)
    || typeof config.useDate !== 'boolean' || ![3, 4, 5, 6].includes(config.digits)
    || !Number.isSafeInteger(config.startNumber) || config.startNumber < 1 || config.startNumber > 2_000_000_000) {
    throw new Error('กรุณาตรวจสอบคำขึ้นต้น จำนวนหลัก และเลขเริ่มต้นของเอกสาร')
  }
  return { ...config, prefix: config.prefix.trim() }
}
