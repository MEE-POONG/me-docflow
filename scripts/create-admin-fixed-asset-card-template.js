const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const pageId = 'fixed-asset-card-page-1'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `fixed-asset-card-${sequence}`,
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

function detailTable(x, y, width, rows) {
  return element('table', x, y, width, 144, '[รายละเอียด]', {
    fontSize: 10,
    tableColumns: [
      { label: 'รายการ', field: 'label', width: Math.round(width * 0.35), align: 'left' },
      { label: 'ข้อมูล', field: 'value', width: Math.round(width * 0.65), align: 'left' },
    ],
    tableData: rows,
    tableHeaderBold: true,
    tableHeaderBg: '#f6f6f6',
  })
}

const elements = [
  element('heading', 23, 18, 549, 26, '{{company_name}}', { fontSize: 18, fontWeight: 'bold', textAlign: 'center' }),
  element('heading', 23, 46, 549, 28, 'บัตรประวัติสินทรัพย์ถาวร', { fontSize: 19, fontWeight: 'bold', textAlign: 'center' }),

  element('heading', 23, 84, 270, 22, 'รายละเอียดสินทรัพย์ถาวร', { fontSize: 14, fontWeight: 'bold', textAlign: 'center' }),
  element('heading', 302, 84, 270, 22, 'รายละเอียดเกี่ยวกับผู้ขาย', { fontSize: 14, fontWeight: 'bold', textAlign: 'center' }),
  detailTable(23, 107, 270, [
    ['รหัสสินทรัพย์', '{{asset_code}}'],
    ['Serial No.', '{{serial_number}}'],
    ['ชื่อสินทรัพย์', '{{asset_name}}'],
    ['ประเภท / อายุการใช้งาน', '{{asset_type}} / {{useful_life}} ปี'],
    ['วันที่เริ่มคิดค่าเสื่อม', '{{depreciation_start_date}}'],
    ['อัตราค่าเสื่อมราคา', '{{depreciation_rate}} %'],
    ['มูลค่าซาก', '{{salvage_value}}'],
    ['เลขที่เอกสาร / วันที่', '{{document_no}} / {{document_date}}'],
  ]),
  detailTable(302, 107, 270, [
    ['ชื่อผู้ขาย', '{{vendor_name}}'],
    ['ที่อยู่', '{{vendor_address}}'],
    ['โทรศัพท์', '{{vendor_phone}}'],
    ['ผู้ติดต่อ', '{{vendor_contact}}'],
    ['บริษัทประกันภัย', '{{insurance_company}}'],
    ['กรมธรรม์เลขที่', '{{policy_number}}'],
    ['เบี้ยประกัน', '{{insurance_premium}}'],
    ['ระยะเวลา', '{{insurance_period}}'],
  ]),

  element('heading', 23, 278, 270, 22, 'รายละเอียดต้นทุน', { fontSize: 14, fontWeight: 'bold', textAlign: 'center' }),
  element('heading', 302, 278, 270, 22, 'การจำหน่ายออกจากบัญชี', { fontSize: 14, fontWeight: 'bold', textAlign: 'center' }),
  element('table', 23, 301, 270, 145, '[รายละเอียดต้นทุน]', {
    fontSize: 10,
    tableColumns: [
      { label: 'รายการ', field: 'cost_name', width: 175, align: 'left' },
      { label: 'จำนวนเงิน', field: 'amount', width: 95, align: 'right' },
    ],
    tableData: [
      ['ราคาซื้อ', '{{purchase_price}}'],
      ['ค่าระวาง', '{{freight_cost}}'],
      ['ค่าขนส่ง', '{{transport_cost}}'],
      ['ค่าติดตั้ง', '{{installation_cost}}'],
      ['ค่าใช้จ่ายอื่น', '{{other_cost}}'],
      ['รวมต้นทุน', '{{total_asset_cost}}'],
    ],
    tableHeaderBold: true,
    tableHeaderBg: '#f6f6f6',
  }),
  detailTable(302, 301, 270, [
    ['เลขที่ใบขอจำหน่าย', '{{disposal_request_no}}'],
    ['วันที่', '{{disposal_date}}'],
    ['ราคาตามบัญชีสุทธิ', '{{net_book_value}}'],
    ['ราคาขาย', '{{sale_price}}'],
    ['กำไร (ขาดทุน)', '{{disposal_gain_loss}}'],
    ['เหตุผลในการจำหน่าย', '{{disposal_reason}}'],
  ]),

  element('heading', 23, 462, 549, 24, 'รายละเอียดผู้ใช้และการโอนสินทรัพย์', { fontSize: 14, fontWeight: 'bold', textAlign: 'center' }),
  element('table', 23, 488, 549, 260, '[ประวัติผู้รับผิดชอบและการโอน]', {
    fontSize: 9,
    tableColumns: [
      { label: 'รหัสแผนก', field: 'department_code', width: 55, align: 'center' },
      { label: 'ชื่อแผนก', field: 'department_name', width: 105, align: 'left' },
      { label: 'ชื่อที่ตั้ง', field: 'location_name', width: 100, align: 'left' },
      { label: 'วันที่โอน', field: 'transfer_date', width: 62, align: 'center' },
      { label: 'เลขที่เอกสาร', field: 'transfer_document_no', width: 70, align: 'center' },
      { label: 'โอนออกจาก', field: 'transfer_from', width: 78, align: 'center' },
      { label: 'โอนเข้า', field: 'transfer_to', width: 79, align: 'center' },
    ],
    tableData: [
      ['{{department_code}}', '{{department_name}}', '{{location_name}}', '{{transfer_date}}', '{{transfer_document_no}}', '{{transfer_from}}', '{{transfer_to}}'],
      ['', '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
    ],
    tableHeaderBold: true,
    tableHeaderBg: '#f6f6f6',
  }),

  element('table', 23, 767, 230, 56, '[ผู้บันทึก]', {
    fontSize: 10,
    tableColumns: [
      { label: 'ผู้บันทึก', field: 'recorded_by_label', width: 65, align: 'left' },
      { label: '{{recorded_by}}', field: 'recorded_by', width: 165, align: 'left' },
    ],
    tableData: [['วันที่', '{{recorded_date}}']],
    tableHeaderBold: false,
    tableHeaderBg: '#ffffff',
  }),
  element('table', 342, 767, 230, 56, '[ผู้ตรวจสอบ]', {
    fontSize: 10,
    tableColumns: [
      { label: 'ผู้ตรวจสอบ', field: 'checked_by_label', width: 65, align: 'left' },
      { label: '{{checked_by}}', field: 'checked_by', width: 165, align: 'left' },
    ],
    tableData: [['วันที่', '{{checked_date}}']],
    tableHeaderBold: false,
    tableHeaderBg: '#ffffff',
  }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { slug: 'FAR', isGlobal: true },
  })

  if (!documentType) throw new Error('ไม่พบประเภทเอกสารทะเบียนทรัพย์สิน (FAR) ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-fixed-asset-history-card-template'
  const data = {
    name: 'บัตรประวัติสินทรัพย์ถาวร',
    slug,
    description: 'เทมเพลตบัตรประวัติสินทรัพย์ถาวร ครอบคลุมข้อมูลสินทรัพย์ ผู้ขาย ต้นทุน ประกันภัย การจำหน่าย ผู้รับผิดชอบ และประวัติการโอน',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [{ id: pageId, name: 'บัตรประวัติสินทรัพย์ถาวร', order: 1, width: 595, height: 842, background: '#ffffff' }],
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
