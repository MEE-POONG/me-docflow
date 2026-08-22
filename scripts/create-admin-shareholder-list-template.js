const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'shareholder-list-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `shareholder-list-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 13,
    color: '#111827',
    ...extra,
  }
}

const border = '#64748b'

const elements = [
  element('text', 28, 22, 80, 20, 'แบบ บอจ. 5', { fontSize: 12, fontWeight: 'bold' }),
  element('heading', 120, 22, 355, 28, 'สำเนาบัญชีรายชื่อผู้ถือหุ้น', { fontSize: 19, fontWeight: 'bold', textAlign: 'center' }),
  element('qrCode', 500, 20, 54, 54, '{{verification_url}}'),
  element('box', 28, 76, 539, 48, '', { borderColor: border }),
  element('text', 38, 85, 90, 20, 'ชื่อบริษัท', { fontSize: 13, fontWeight: 'bold' }),
  element('text', 126, 85, 270, 20, '{{company_name}}', { fontSize: 14 }),
  element('text', 408, 85, 78, 20, 'ทะเบียนเลขที่', { fontSize: 12, fontWeight: 'bold' }),
  element('text', 486, 85, 72, 20, '{{company_registration_number}}', { fontSize: 12, textAlign: 'right' }),
  element('text', 38, 106, 360, 16, 'ที่ตั้งสำนักงานใหญ่ {{company_address}}', { fontSize: 11 }),

  element('box', 28, 130, 539, 104, '', { borderColor: border }),
  element('text', 38, 139, 180, 20, 'ประเภทการประชุม/มติ', { fontSize: 13, fontWeight: 'bold' }),
  element('checkbox', 38, 166, 15, 15, ''),
  element('text', 58, 163, 108, 20, 'ประชุมจัดตั้งบริษัท', { fontSize: 12 }),
  element('checkbox', 172, 166, 15, 15, ''),
  element('text', 192, 163, 105, 20, 'ประชุมสามัญ', { fontSize: 12 }),
  element('checkbox', 303, 166, 15, 15, ''),
  element('text', 323, 163, 110, 20, 'ประชุมวิสามัญ', { fontSize: 12 }),
  element('checkbox', 439, 166, 15, 15, ''),
  element('text', 459, 163, 96, 20, 'มติผู้ถือหุ้น', { fontSize: 12 }),
  element('text', 38, 190, 240, 20, 'ทุนจดทะเบียน {{registered_capital}} บาท', { fontSize: 12 }),
  element('text', 288, 190, 267, 20, 'แบ่งเป็น {{total_registered_shares}} หุ้น มูลค่าหุ้นละ {{par_value}} บาท', { fontSize: 12 }),
  element('text', 38, 211, 245, 18, 'วันที่ประชุม/วันที่มีมติ {{meeting_date}}', { fontSize: 11 }),
  element('text', 288, 211, 267, 18, 'วันที่จัดทำบัญชีรายชื่อ {{list_date}}', { fontSize: 11 }),

  element('table', 28, 244, 539, 430, '[บัญชีรายชื่อผู้ถือหุ้น]', {
    fontSize: 9,
    tableColumns: [
      { label: 'ลำดับ', field: 'index', width: 31, align: 'center' },
      { label: 'ชื่อ-นามสกุล/ชื่อบริษัท และที่อยู่', field: 'shareholder', width: 185, align: 'left' },
      { label: 'สัญชาติ', field: 'nationality', width: 48, align: 'center' },
      { label: 'อาชีพ', field: 'occupation', width: 55, align: 'left' },
      { label: 'จำนวนหุ้น', field: 'shares', width: 61, align: 'right' },
      { label: 'จำนวนเงินค่าหุ้นที่ชำระแล้ว', field: 'paidAmount', width: 72, align: 'right' },
      { label: 'เลขหมายใบหุ้น/วันที่ลงทะเบียน', field: 'certificate', width: 87, align: 'left' },
    ],
    tableRows: 10,
    tableHeaderBold: true,
    tableHeaderBg: '#f8fafc',
    borderColor: border,
  }),

  element('box', 28, 684, 539, 48, '', { borderColor: border }),
  element('text', 38, 693, 245, 20, 'รวมจำนวนผู้ถือหุ้น {{shareholder_count}} ราย', { fontSize: 12, fontWeight: 'bold' }),
  element('text', 290, 693, 126, 20, 'รวมจำนวนหุ้น', { fontSize: 12, fontWeight: 'bold', textAlign: 'right' }),
  element('text', 426, 693, 131, 20, '{{total_shares}} หุ้น', { fontSize: 13, fontWeight: 'bold', textAlign: 'right' }),
  element('text', 290, 713, 126, 16, 'รวมเงินค่าหุ้นชำระแล้ว', { fontSize: 10, textAlign: 'right' }),
  element('text', 426, 713, 131, 16, '{{total_paid_amount}} บาท', { fontSize: 11, textAlign: 'right' }),

  element('paragraph', 48, 748, 499, 34, 'ขอรับรองว่ารายชื่อผู้ถือหุ้น จำนวนหุ้น และรายละเอียดข้างต้นถูกต้องตรงตามสมุดทะเบียนผู้ถือหุ้นของบริษัททุกประการ', { fontSize: 12, textAlign: 'center' }),
  element('line', 335, 804, 180, 1, '', { color: border }),
  element('text', 335, 810, 180, 18, '({{authorized_director}}) กรรมการผู้มีอำนาจ', { fontSize: 11, textAlign: 'center' }),
  element('text', 48, 807, 220, 18, 'ประทับตราบริษัท (ถ้ามี)', { fontSize: 10, color: '#64748b' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({ where: { slug: 'บอจ.5', isGlobal: true } })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารบัญชีรายชื่อผู้ถือหุ้น (บอจ.5) ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-shareholder-list-bor-or-jor-5-template'
  const data = {
    name: 'บัญชีรายชื่อผู้ถือหุ้น (บอจ.5)',
    slug,
    description: 'เทมเพลตบัญชีรายชื่อผู้ถือหุ้น บอจ.5 รูปแบบ A4 พร้อมข้อมูลบริษัท ทุนจดทะเบียน ตารางผู้ถือหุ้น 10 รายการ ยอดรวมหุ้น QR ตรวจสอบ และส่วนรับรองโดยกรรมการ',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'บัญชีรายชื่อผู้ถือหุ้น (บอจ.5)', order: 1, width: 595, height: 842, background: '#ffffff' }],
      elements,
    },
    paperSize: PaperSize.A4,
    orientation: PaperOrientation.PORTRAIT,
    isGlobal: true,
    isActive: true,
    createdByAdminId: admin?.id,
  }

  const existing = await prisma.documentTemplate.findFirst({ where: { slug, isGlobal: true } })
  const template = existing
    ? await prisma.documentTemplate.update({ where: { id: existing.id }, data })
    : await prisma.documentTemplate.create({ data })

  console.log(JSON.stringify({ id: template.id, name: template.name, slug: template.slug }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
