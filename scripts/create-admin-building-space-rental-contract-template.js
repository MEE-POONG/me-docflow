const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()

const PAGE_WIDTH = 768
const PAGE_HEIGHT = 1024
const PAGE_ID = 'page-1'
const FONT_FAMILY = 'Cordia New'

function element(type, x, y, width, height, content, extra = {}) {
  return {
    id: `${type}-${crypto.randomUUID()}`,
    type,
    x,
    y,
    width,
    height,
    content,
    fontSize: extra.fontSize ?? 18,
    fontFamily: FONT_FAMILY,
    fontWeight: extra.fontWeight ?? 'normal',
    textAlign: extra.textAlign ?? 'left',
    pageId: PAGE_ID,
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

      if (overlaps) {
        throw new Error(`Layout overlap: ${a.id} overlaps ${b.id}`)
      }
    }
  }
}

async function main() {
  const admin = await prisma.systemAdmin.findFirst({
    select: { id: true },
  })

  const documentType = await prisma.documentType.findFirst({
    where: { slug: 'LEASE', isGlobal: true },
    select: { id: true, categoryId: true },
  })

  if (!admin) throw new Error('ไม่พบบัญชี SUPER_ADMIN')
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารส่วนกลาง slug=LEASE')

  const elements = [
    element('heading', 194, 88, 380, 34, 'สัญญาเช่าพื้นที่ในอาคาร', {
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
    }),
    element(
      'paragraph',
      514,
      140,
      190,
      48,
      'ทำที่ ........................................\n        {{contract_place}}',
      { fontSize: 17 },
    ),
    element(
      'paragraph',
      330,
      191,
      270,
      28,
      'วันที่ ........................................ {{contract_date}}',
      { fontSize: 17 },
    ),
    element(
      'paragraph',
      111,
      235,
      594,
      45,
      'สัญญาฉบับนี้ ทำขึ้นระหว่าง {{lessor_name}} ..............................................................\n........................................................................................................................................',
      { fontSize: 17 },
    ),
    element(
      'paragraph',
      111,
      286,
      594,
      77,
      'อยู่ ณ เลขที่ {{lessor_address}} ..............................................................................................\nซึ่งต่อไปในสัญญานี้เรียกว่า “ผู้ให้เช่า” ฝ่ายหนึ่ง กับ {{lessee_name}} ...........................................\n........................................................................................................................................',
      { fontSize: 17 },
    ),
    element(
      'paragraph',
      111,
      370,
      594,
      70,
      'อยู่ ณ เลขที่ {{lessee_address}} ..............................................................................................\nซึ่งต่อไปในสัญญานี้เรียกว่า “ผู้เช่า” อีกฝ่ายหนึ่ง',
      { fontSize: 17 },
    ),
    element(
      'paragraph',
      214,
      447,
      340,
      28,
      'ทั้งสองฝ่ายตกลงทำสัญญาดังมีข้อความต่อไปนี้',
      { fontSize: 17, textAlign: 'center' },
    ),
    element(
      'paragraph',
      111,
      489,
      594,
      132,
      'ข้อ 1. ผู้ให้เช่าตกลงให้เช่า และผู้เช่าตกลงเช่า พื้นที่บางส่วน บริเวณ ชั้นที่ {{property_floor}}\nห้องเลขที่ {{property_number}} ของอาคาร {{building_name}} มีเนื้อที่ประมาณ {{property_area}} ตารางเมตร\nตั้งอยู่ ณ เลขที่ {{property_address}} ตรอก/ซอย ................................ ถนน .................................\nตำบล/แขวง ................................................ อำเภอ/เขต ................................................\nจังหวัด ................................................ ซึ่งต่อไปนี้ในสัญญานี้เรียกว่า “พื้นที่เช่า”',
      { fontSize: 17 },
    ),
    element(
      'paragraph',
      111,
      632,
      594,
      153,
      'ข้อ 2. ผู้ให้เช่าตกลงให้ผู้เช่า เช่าพื้นที่เช่ามีกำหนดอายุ {{lease_term}} ปี เริ่มอายุการเช่าตั้งแต่\nวันที่ {{lease_start_date}} และสิ้นสุดในวันที่ {{lease_end_date}} โดยมีวัตถุ\nประสงค์ของการเช่าพื้นที่เช่า เพื่อการ {{lease_purpose}}\n        ในกรณีที่อายุการเช่าเกินกว่า 3 ปี ผู้ให้เช่าตกลงจะจดทะเบียนการเช่าตามสัญญานี้ต่อทาง\nราชการที่เกี่ยวข้อง ภายในกำหนด 30 วัน นับแต่วันที่ ผู้เช่าชำระเงินตามข้อ 4 ครบถ้วนแล้ว โดยผู้ให้เช่าจะ\nเป็นผู้รับผิดในบรรดาค่าธรรมเนียม ค่าภาษี และรวมถึงค่าใช้จ่ายอื่น ๆ ที่มีขึ้นในการจดทะเบียนการเช่าแต่เพียงผู้เดียว',
      { fontSize: 17 },
    ),
    element(
      'paragraph',
      111,
      797,
      594,
      108,
      'ข้อ 3. ผู้เช่า จะชำระค่าเช่าให้แก่ ผู้ให้เช่า ล่วงหน้าเป็นรายเดือน ภายในวันที่ {{rent_due_day}} ของแต่ละเดือน\nในอัตราเดือนละ {{monthly_rent}} บาท ({{monthly_rent_text}})\nณ สถานที่อยู่ของผู้ให้เช่า',
      { fontSize: 17 },
    ),
  ]

  assertNoOverlaps(elements)

  const slug = 'central-building-space-rental-contract-template'
  const data = {
    name: 'สัญญาเช่าพื้นที่ในอาคาร',
    slug,
    description: 'แม่แบบสัญญาเช่าพื้นที่ในอาคาร จัดวางตามเอกสารต้นฉบับแบบหนึ่งหน้า',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      version: 1,
      source: 'manual-layout-from-reference',
      pages: [{ id: PAGE_ID, width: PAGE_WIDTH, height: PAGE_HEIGHT, orientation: 'portrait' }],
      elements,
    },
    paperSize: PaperSize.A4,
    orientation: PaperOrientation.PORTRAIT,
    isGlobal: true,
    isActive: true,
    createdByAdminId: admin.id,
  }

  const existing = await prisma.documentTemplate.findFirst({ where: { slug } })
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
