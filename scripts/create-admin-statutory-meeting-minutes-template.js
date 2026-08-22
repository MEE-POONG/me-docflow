const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'statutory-meeting-minutes-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `statutory-minutes-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 14,
    color: '#111827',
    ...extra,
  }
}

const accent = '#0f766e'

const elements = [
  element('heading', 45, 32, 505, 34, 'รายงานการประชุมตั้งบริษัท ครั้งที่ {{meeting_number}}/{{meeting_year}}', { fontSize: 21, fontWeight: 'bold', textAlign: 'center' }),
  element('heading', 45, 72, 505, 30, 'บริษัท {{company_name}} จำกัด', { fontSize: 19, fontWeight: 'bold', textAlign: 'center', color: accent }),
  element('line', 175, 110, 245, 1, '', { color: '#94a3b8' }),

  element('text', 48, 132, 499, 24, 'ประชุมเมื่อวันที่ {{meeting_date}} ณ {{meeting_location}}', { fontSize: 15 }),
  element('text', 48, 163, 499, 24, 'เปิดประชุมเวลา {{meeting_start_time}} น.', { fontSize: 15 }),
  element('paragraph', 48, 196, 499, 54,
    'มีกรรมการมาประชุม {{attending_directors}} คน จากทั้งหมด {{total_directors}} คน ครบองค์ประชุม โดยมี {{chairperson_name}} เป็นประธานที่ประชุม และ {{secretary_name}} เป็นผู้บันทึกรายงานการประชุม',
    { fontSize: 15, textAlign: 'justify' }),
  element('paragraph', 48, 254, 499, 30, 'ประธานกล่าวเปิดประชุมและดำเนินการตามระเบียบวาระ ดังต่อไปนี้', { fontSize: 15, textAlign: 'justify' }),

  element('heading', 48, 298, 499, 27, 'วาระที่ 1  เรื่องขอเปิดบัญชีเงินฝากธนาคารเพื่อใช้ในกิจการ', { fontSize: 17, fontWeight: 'bold', color: accent }),
  element('paragraph', 62, 334, 485, 62,
    'ประธานเสนอให้ที่ประชุมพิจารณาเปิดบัญชีเงินฝากและสมัครใช้บริการธุรกรรมออนไลน์ในนามบริษัท {{company_name}} จำกัด กับธนาคารตามรายละเอียดต่อไปนี้',
    { fontSize: 15, textAlign: 'justify' }),
  element('table', 62, 405, 471, 90, '[รายละเอียดบัญชีธนาคาร]', {
    fontSize: 12,
    tableColumns: [
      { label: 'ลำดับ', field: 'index', width: 42, align: 'center' },
      { label: 'ธนาคาร', field: 'bankName', width: 142, align: 'left' },
      { label: 'สาขา', field: 'branchName', width: 122, align: 'left' },
      { label: 'ประเภทบัญชี', field: 'accountType', width: 100, align: 'left' },
      { label: 'สกุลเงิน', field: 'currency', width: 65, align: 'center' },
    ],
    tableRows: 2,
    tableHeaderBold: true,
    tableHeaderBg: '#f0fdfa',
    borderColor: '#64748b',
  }),
  element('paragraph', 62, 506, 485, 58,
    'กำหนดให้ {{authorized_signatory}} เป็นผู้มีอำนาจลงนามสั่งจ่าย ถอนเงิน ทำธุรกรรม และประทับตราสำคัญของบริษัท ภายใต้เงื่อนไข {{signing_condition}}',
    { fontSize: 15, textAlign: 'justify' }),
  element('heading', 62, 572, 110, 24, 'มติที่ประชุม', { fontSize: 16, fontWeight: 'bold' }),
  element('paragraph', 170, 572, 363, 48, 'ที่ประชุมมีมติเป็นเอกฉันท์อนุมัติตามที่ประธานเสนอ และมอบหมายให้ผู้มีอำนาจดำเนินการจนแล้วเสร็จ', { fontSize: 14, textAlign: 'justify' }),

  element('heading', 48, 632, 499, 27, 'วาระที่ 2  เรื่องอื่น ๆ (ถ้ามี)', { fontSize: 17, fontWeight: 'bold', color: accent }),
  element('paragraph', 62, 668, 485, 45, '{{other_agenda_details}}', { fontSize: 15, textAlign: 'justify' }),
  element('heading', 62, 717, 110, 24, 'มติที่ประชุม', { fontSize: 16, fontWeight: 'bold' }),
  element('paragraph', 170, 717, 363, 38, '{{other_agenda_resolution}}', { fontSize: 14, textAlign: 'justify' }),
  element('text', 48, 764, 250, 22, 'ปิดประชุมเวลา {{meeting_end_time}} น.', { fontSize: 15 }),
  element('line', 325, 786, 205, 1, '', { color: '#64748b' }),
  element('text', 325, 794, 205, 20, '({{chairperson_name}})', { fontSize: 13, textAlign: 'center' }),
  element('text', 325, 814, 205, 18, 'ประธานที่ประชุม', { fontSize: 12, textAlign: 'center' }),
  element('text', 48, 804, 220, 18, 'ผู้บันทึก {{secretary_name}}', { fontSize: 11, color: '#64748b' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({ where: { slug: 'MSM', isGlobal: true } })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารรายงานการประชุมตั้งบริษัทในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-statutory-meeting-minutes-template'
  const data = {
    name: 'รายงานการประชุมตั้งบริษัท',
    slug,
    description: 'เทมเพลตรายงานการประชุมตั้งบริษัท A4 พร้อมข้อมูลองค์ประชุม วาระเปิดบัญชีธนาคาร รายละเอียดบัญชี ผู้มีอำนาจลงนาม มติ เรื่องอื่น และส่วนรับรองโดยประธาน',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'รายงานการประชุมตั้งบริษัท', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
