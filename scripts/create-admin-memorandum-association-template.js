const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'memorandum-association-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `memorandum-association-${sequence}`,
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
  element('text', 28, 23, 90, 20, 'แบบ บอจ. 2', { fontSize: 12, fontWeight: 'bold' }),
  element('heading', 145, 23, 305, 28, 'หนังสือบริคณห์สนธิ', { fontSize: 20, fontWeight: 'bold', textAlign: 'center' }),
  element('qrCode', 500, 18, 54, 54, '{{verification_url}}'),
  element('heading', 48, 63, 499, 26, 'บริษัท {{company_name_th}} จำกัด', { fontSize: 17, fontWeight: 'bold', textAlign: 'center' }),
  element('text', 48, 94, 499, 20, 'ทะเบียนเลขที่ {{company_registration_number}}', { fontSize: 12, textAlign: 'center' }),
  element('line', 145, 120, 305, 1, '', { color: border }),
  element('text', 48, 132, 499, 21, 'หนังสือบริคณห์สนธิฉบับนี้ทำขึ้นเมื่อวันที่ {{memorandum_date}} มีรายการดังต่อไปนี้', { fontSize: 13 }),

  element('heading', 48, 163, 54, 21, 'ข้อ 1', { fontSize: 14, fontWeight: 'bold' }),
  element('paragraph', 102, 163, 445, 38, 'ชื่อบริษัท “{{company_name_th}} จำกัด” เขียนเป็นภาษาอังกฤษว่า “{{company_name_en}} COMPANY LIMITED”', { fontSize: 13, textAlign: 'justify' }),
  element('heading', 48, 207, 54, 21, 'ข้อ 2', { fontSize: 14, fontWeight: 'bold' }),
  element('paragraph', 102, 207, 445, 38, 'สำนักงานของบริษัทตั้งอยู่ ณ จังหวัด {{registered_province}} ที่อยู่ {{registered_address}}', { fontSize: 13, textAlign: 'justify' }),
  element('heading', 48, 251, 54, 21, 'ข้อ 3', { fontSize: 14, fontWeight: 'bold' }),
  element('paragraph', 102, 251, 445, 45, 'วัตถุประสงค์ทั้งหลายของบริษัทมีจำนวน {{objective_count}} ข้อ ดังปรากฏในแบบ ว. ที่แนบมาพร้อมหนังสือนี้', { fontSize: 13, textAlign: 'justify' }),
  element('heading', 48, 302, 54, 21, 'ข้อ 4', { fontSize: 14, fontWeight: 'bold' }),
  element('paragraph', 102, 302, 445, 45, 'ผู้ถือหุ้นของบริษัทมีความรับผิดจำกัดเพียงไม่เกินจำนวนเงินที่ตนยังส่งใช้ไม่ครบมูลค่าหุ้นที่ตนถือ', { fontSize: 13, textAlign: 'justify' }),
  element('heading', 48, 353, 54, 21, 'ข้อ 5', { fontSize: 14, fontWeight: 'bold' }),
  element('paragraph', 102, 353, 445, 58,
    'ทุนของบริษัทกำหนดไว้ {{registered_capital}} บาท ({{registered_capital_text}}) แบ่งออกเป็น {{total_shares}} หุ้น มูลค่าหุ้นละ {{par_value}} บาท โดยแบ่งเป็นหุ้นสามัญ {{ordinary_shares}} หุ้น และหุ้นบุริมสิทธิ {{preferred_shares}} หุ้น',
    { fontSize: 13, textAlign: 'justify' }),
  element('heading', 48, 418, 54, 21, 'ข้อ 6', { fontSize: 14, fontWeight: 'bold' }),
  element('paragraph', 102, 418, 445, 40, 'รายชื่อ ที่อยู่ อาชีพ และจำนวนหุ้นที่ผู้เริ่มก่อการแต่ละคนเข้าชื่อซื้อ มีรายละเอียดดังต่อไปนี้', { fontSize: 13, textAlign: 'justify' }),

  element('table', 28, 466, 539, 270, '[รายชื่อผู้เริ่มก่อการ]', {
    fontSize: 9,
    tableColumns: [
      { label: 'ลำดับ', field: 'index', width: 30, align: 'center' },
      { label: 'ชื่อ-นามสกุล', field: 'name', width: 112, align: 'left' },
      { label: 'เลขประจำตัว/หนังสือเดินทาง', field: 'idNumber', width: 98, align: 'left' },
      { label: 'อายุ', field: 'age', width: 32, align: 'center' },
      { label: 'โทรศัพท์', field: 'phone', width: 66, align: 'left' },
      { label: 'ที่อยู่และอาชีพ', field: 'addressOccupation', width: 129, align: 'left' },
      { label: 'หุ้นที่เข้าชื่อซื้อ', field: 'subscribedShares', width: 72, align: 'right' },
    ],
    tableRows: 5,
    tableHeaderBold: true,
    tableHeaderBg: '#f8fafc',
    borderColor: border,
  }),

  element('paragraph', 48, 748, 499, 28, 'ข้าพเจ้าผู้เริ่มก่อการทุกคนลงลายมือชื่อไว้เป็นสำคัญ และยินยอมให้ผู้รับผิดชอบดำเนินการยื่นจดทะเบียน', { fontSize: 11, textAlign: 'center' }),
  element('line', 85, 802, 170, 1, '', { color: border }),
  element('line', 340, 802, 170, 1, '', { color: border }),
  element('text', 85, 808, 170, 18, '({{authorized_promoter}}) ผู้เริ่มก่อการ', { fontSize: 10, textAlign: 'center' }),
  element('text', 340, 808, 170, 18, '({{registrar_name}}) ผู้รับคำขอ/นายทะเบียน', { fontSize: 10, textAlign: 'center' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({ where: { slug: 'บอจ.2', isGlobal: true } })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารหนังสือบริคณห์สนธิ (บอจ.2) ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-memorandum-association-bor-or-jor-2-template'
  const data = {
    name: 'หนังสือบริคณห์สนธิ (บอจ.2)',
    slug,
    description: 'เทมเพลตหนังสือบริคณห์สนธิ บอจ.2 แบบ A4 พร้อมชื่อและที่ตั้งบริษัท วัตถุประสงค์ ทุนจดทะเบียน โครงสร้างหุ้น ตารางผู้เริ่มก่อการ QR ตรวจสอบ และส่วนรับรอง',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'หนังสือบริคณห์สนธิ (บอจ.2)', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
