const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const PAGE_ID = 'page-1'
const PAGE_WIDTH = 768
const PAGE_HEIGHT = 1024
const FONT_FAMILY = 'Cordia New'
let sequence = 0

function element(type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `warning-reference-${sequence}`,
    pageId: PAGE_ID,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: FONT_FAMILY,
    fontSize: extra.fontSize ?? 18,
    fontWeight: extra.fontWeight ?? 'normal',
    textAlign: extra.textAlign ?? 'left',
    color: extra.color ?? '#111111',
    ...extra,
  }
}

function assertNoOverlaps(elements) {
  for (let i = 0; i < elements.length; i += 1) {
    for (let j = i + 1; j < elements.length; j += 1) {
      const a = elements[i]
      const b = elements[j]
      const overlaps =
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y

      if (overlaps) throw new Error(`Layout overlap: ${a.id} overlaps ${b.id}`)
    }
  }
}

async function main() {
  const admin = await prisma.systemAdmin.findFirst({ select: { id: true } })
  const documentType = await prisma.documentType.findFirst({
    where: { name: 'หนังสือเตือน / หนังสือเลิกจ้าง', isGlobal: true },
    select: { id: true, categoryId: true },
  })

  if (!admin) throw new Error('ไม่พบบัญชี SUPER_ADMIN')
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารหนังสือเตือน / หนังสือเลิกจ้าง')

  const elements = [
    element('heading', 174, 40, 420, 34, 'หนังสือเตือน', {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
    }),
    element('text', 180, 82, 408, 28, 'บริษัท {{company_name}} ....................................................................', {
      fontSize: 18,
      textAlign: 'center',
    }),
    element('text', 74, 139, 620, 30, 'เรื่อง     การฝ่าฝืนคำสั่ง ระเบียบ หรือข้อบังคับเกี่ยวกับการทำงาน', {
      fontSize: 18,
    }),
    element('text', 74, 176, 620, 30, 'เรียน     นาย / นาง / นางสาว {{employee_name}} ........................................................', {
      fontSize: 18,
    }),
    element(
      'paragraph',
      74,
      232,
      620,
      96,
      'เนื่องด้วยเมื่อวันที่ {{incident_day}} เดือน {{incident_month}} พ.ศ. {{incident_year}} ถึงวันที่ {{incident_end_day}} เดือน {{incident_end_month}}\nพ.ศ. {{incident_end_year}} ท่านได้กระทำการฝ่าฝืนคำสั่ง ระเบียบ หรือข้อบังคับเกี่ยวกับการทำงานของบริษัท กล่าวคือ',
      { fontSize: 17 },
    ),
    element(
      'paragraph',
      98,
      350,
      280,
      174,
      '□ ขาดความรับผิดชอบในหน้าที่\n□ ฝ่าฝืนระเบียบข้อบังคับของบริษัท\n□ ขาดงานติดต่อกันโดยไม่แจ้ง\n□ เข้าทำงานสายเป็นประจำ\n□ เจตนาขัดคำสั่งผู้บังคับบัญชา\n□ มีพฤติกรรมอันส่อไปในทางทุจริต',
      { fontSize: 18 },
    ),
    element(
      'paragraph',
      391,
      350,
      303,
      174,
      '□ หนีงานหรือละทิ้งหน้าที่ในระหว่างเวลางาน\n□ ก่อการทะเลาะวิวาทในที่ทำงาน\n□ เสพสิ่งมึนเมาในบริเวณที่ทำงาน\n□ เล่นการพนันในบริเวณที่ทำงาน\n□ ยุยง ชักชวน สนับสนุนให้มีการฝ่าฝืนข้อบังคับการทำงาน\n□ อื่น ๆ {{other_violation}} ........................................',
      { fontSize: 18 },
    ),
    element('line', 74, 548, 620, 1, '', { color: '#555555' }),
    element(
      'paragraph',
      74,
      570,
      620,
      100,
      'ดังนั้น จึงให้ท่านแก้ไข ปรับปรุง งดเว้น หรือละเว้นการกระทำเช่นว่านั้น มิฉะนั้นหากกระทำผิดอีก บริษัท\nจะพิจารณาลงโทษ ซึ่งอาจถึงขั้นเลิกจ้างในลำดับถัดไป\n          จึงแจ้งมาเพื่อทราบ',
      { fontSize: 18 },
    ),
    element('text', 388, 686, 306, 28, 'ในนาม บริษัท {{company_name}} ........................................', {
      fontSize: 18,
      textAlign: 'center',
    }),
    element(
      'paragraph',
      436,
      730,
      210,
      104,
      'ลงชื่อ ................................................\n({{authorized_signatory}})\nผู้มีอำนาจลงนาม',
      { fontSize: 18, textAlign: 'center' },
    ),
    element('text', 74, 838, 270, 28, 'ได้รับทราบหนังสือเตือนแล้ว', { fontSize: 18 }),
    element(
      'paragraph',
      74,
      878,
      270,
      100,
      'ลงชื่อ ................................................\n({{employee_name}})\nวันที่รับทราบ {{acknowledged_date}} ........................',
      { fontSize: 18, textAlign: 'center' },
    ),
  ]

  assertNoOverlaps(elements)

  const slug = 'central-warning-letter-reference-template'
  const data = {
    name: 'หนังสือเตือนพนักงาน',
    slug,
    description: 'แม่แบบหนังสือเตือนพนักงาน จัดวางตามเอกสารอ้างอิง พร้อมรายการความผิดสองคอลัมน์และช่องลงนามรับทราบ',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      version: 1,
      source: 'manual-layout-from-reference',
      pages: [{ id: PAGE_ID, name: 'หนังสือเตือน', order: 1, width: PAGE_WIDTH, height: PAGE_HEIGHT, background: '#ffffff' }],
      elements,
    },
    paperSize: PaperSize.A4,
    orientation: PaperOrientation.PORTRAIT,
    isGlobal: true,
    isActive: true,
    createdByAdminId: admin.id,
  }

  const existing = await prisma.documentTemplate.findFirst({ where: { slug, isGlobal: true } })
  const template = existing
    ? await prisma.documentTemplate.update({ where: { id: existing.id }, data })
    : await prisma.documentTemplate.create({ data })

  console.log(`Template ready: ${template.name} (${template.id})`)
  console.log(`Elements: ${elements.length}, overlap check: passed`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
