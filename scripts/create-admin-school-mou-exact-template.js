const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const TEMPLATE_SLUG = 'central-school-alcohol-tobacco-free-mou-exact'
const PAGE_ID = 'school-mou-editable-page-1'
const PAGE_WIDTH = 718
const PAGE_HEIGHT = 1024
const FONT = 'Cordia New'

function element(id, type, x, y, width, height, content, extra = {}) {
  return {
    id,
    pageId: PAGE_ID,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: FONT,
    fontSize: extra.fontSize ?? 13,
    color: extra.color ?? '#2f2b28',
    textAlign: extra.textAlign ?? 'left',
    lineHeight: extra.lineHeight ?? 1.35,
    ...extra,
  }
}

function assertLayout(elements) {
  for (const item of elements) {
    if (item.x < 0 || item.y < 0 || item.x + item.width > PAGE_WIDTH || item.y + item.height > PAGE_HEIGHT) {
      throw new Error(`องค์ประกอบ ${item.id} อยู่นอกขอบกระดาษ`)
    }
  }

  for (let i = 0; i < elements.length; i += 1) {
    for (let j = i + 1; j < elements.length; j += 1) {
      const a = elements[i]
      const b = elements[j]
      const overlaps = a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
      if (overlaps) throw new Error(`องค์ประกอบซ้อนกัน: ${a.id} / ${b.id}`)
    }
  }
}

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { slug: 'MOU', isGlobal: true },
  })

  if (!documentType) throw new Error('ไม่พบประเภทเอกสารบันทึกข้อตกลง (MOU) ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const elements = [
    element('mou-logo-school', 'logo', 258, 28, 82, 62, 'ตราโรงเรียน', { textAlign: 'center' }),
    element('mou-logo-organization', 'logo', 378, 28, 82, 62, 'ตราหน่วยงาน', { textAlign: 'center' }),
    element('mou-title', 'heading', 92, 102, 534, 28, 'บันทึกข้อตกลง (MOU) การดำเนินงานโรงเรียนปลอดเหล้าและบุหรี่', {
      fontSize: 20,
      fontWeight: 700,
      textAlign: 'center',
    }),
    element('mou-between', 'heading', 270, 134, 178, 23, 'ระหว่าง', { fontSize: 18, fontWeight: 700, textAlign: 'center' }),
    element('mou-parties', 'heading', 112, 161, 494, 25, 'โรงเรียนอุเทนพัฒนา กับ องค์การบริหารส่วนตำบลโนนตาล', {
      fontSize: 18,
      fontWeight: 700,
      textAlign: 'center',
    }),
    element('mou-divider', 'line', 280, 196, 158, 1, '', { stroke: '#8f8a85', strokeWidth: 1 }),
    element('mou-introduction', 'paragraph', 72, 216, 574, 139,
      'บันทึกข้อตกลงความร่วมมือฉบับนี้ทำขึ้นระหว่างโรงเรียนอุเทนพัฒนา และ องค์การบริหารส่วนตำบลโนนตาล เพื่อให้การสนับสนุนและส่งเสริมความร่วมมือในการดำเนินงานโรงเรียนปลอดเหล้าและบุหรี่ ซึ่งสืบเนื่องมาจากสถานการณ์การบริโภคเหล้าและยาสูบของเยาวชนไทยมีแนวโน้มเพิ่มขึ้น ผู้ที่เข้าไปเกี่ยวข้องกับเหล้าและบุหรี่ที่มีอายุน้อยลง ซึ่งเป็นพฤติกรรมที่จะนำไปสู่การเข้าไปเกี่ยวข้องกับสารเสพติดที่ร้ายแรงชนิดอื่นได้ง่ายยิ่งขึ้น ดังนั้นจึงกำหนดแนวทางการดำเนินงานที่สำคัญร่วมกัน เพื่อสนับสนุน ส่งเสริมและขับเคลื่อนให้การดำเนินงานของโรงเรียนปลอดเหล้าและบุหรี่ ให้บรรลุวัตถุประสงค์และเป้าหมายที่กำหนดร่วมกัน ตลอดจนส่งเสริมความร่วมมือของเครือข่ายผู้ปกครอง องค์กรภาครัฐ และเอกชนเพื่อระดมสรรพกำลังในการดำเนินงานโรงเรียนปลอดเหล้าและบุหรี่ จึงตกลงจัดทำบันทึกข้อตกลงความร่วมมือ ดังต่อไปนี้',
      { fontSize: 13, textAlign: 'justify', lineHeight: 1.28 }),
    element('mou-clause-1', 'paragraph', 72, 368, 574, 116,
      '๑. โรงเรียนต้องกำหนดและจัดทำนโยบาย “โรงเรียนปลอดเหล้าและบุหรี่” โดยผู้บริหารเป็นผู้ลงนามและนำนโยบายบรรจุในแผนปฏิบัติการของโรงเรียน ต้องจัดตั้งคณะทำงานโรงเรียนปลอดเหล้าและบุหรี่ กำหนดบทบาทหน้าที่อย่างชัดเจน และมีการสำรวจข้อมูลการดื่มเหล้าและสูบบุหรี่ มีการติดตามและรายงานผลการดำเนินงานอย่างต่อเนื่อง รวมทั้งมีการประกาศข้อห้าม บทลงโทษ และระบุทุกพื้นที่ของโรงเรียนเป็นเขตห้ามสูบบุหรี่และดื่มเหล้า รวมทั้งมีการเผยแพร่ประชาสัมพันธ์นโยบายผ่านช่องทางที่หลากหลาย',
      { fontSize: 13, textAlign: 'justify', lineHeight: 1.28 }),
    element('mou-clause-2', 'paragraph', 72, 497, 574, 77,
      '๒. จะดำเนินการจัดสภาพแวดล้อมภายในโรงเรียน องค์การบริหารส่วนตำบลโนนตาล ชุมชนหมู่บ้านให้เป็นเขตปลอดเหล้าและบุหรี่ตามที่กฎหมายกำหนด เช่น มีเครื่องหมายห้ามที่ชัดเจน มีการเฝ้าระวังและจัดสภาพแวดล้อมไม่ให้เอื้อต่อการดื่มเหล้าและสูบบุหรี่',
      { fontSize: 13, textAlign: 'justify', lineHeight: 1.28 }),
    element('mou-clause-3', 'paragraph', 72, 587, 574, 77,
      '๓. โรงเรียนอุเทนพัฒนา ต้องมีการสอดแทรกเรื่องเหล้าและบุหรี่ในกระบวนการเรียนการสอนและทุกกลุ่มสาระการเรียนรู้ และสนับสนุนการจัดกิจกรรมและการมีส่วนร่วมในการรณรงค์ต่อต้านของนักเรียนแกนนำ',
      { fontSize: 13, textAlign: 'justify', lineHeight: 1.28 }),
    element('mou-clause-4', 'paragraph', 72, 677, 574, 92,
      '๔. องค์การบริหารส่วนตำบลโนนตาล จะสนับสนุนและส่งเสริม ด้านสื่อรณรงค์ประชาสัมพันธ์และองค์ความรู้ที่เกี่ยวข้องให้แก่โรงเรียน ในกระบวนการคัดกรองและติดตามนักเรียนกลุ่มเสี่ยง เพื่อป้องกันการเข้าไปเกี่ยวข้องกับบุหรี่และเหล้าของนักเรียน ให้คำปรึกษา ดูแลช่วยเหลือ และติดตามผลการเลิกสูบบุหรี่หรือดื่มเหล้าอย่างเป็นระบบ',
      { fontSize: 13, textAlign: 'justify', lineHeight: 1.28 }),
    element('mou-closing', 'paragraph', 72, 786, 574, 58,
      'ทั้งนี้ หน่วยงานจะประสานความร่วมมือระหว่างกันและจะสนับสนุนการดำเนินงาน ตลอดจนติดตามประเมินผลการดำเนินงาน ตามบันทึกข้อตกลงเพื่อให้เกิดประโยชน์สูงสุดเป็นระยะต่อไป',
      { fontSize: 13, textAlign: 'justify', lineHeight: 1.28 }),
    element('mou-acknowledgement', 'paragraph', 72, 856, 574, 41,
      'ผู้ทำข้อตกลงได้ทำความเข้าใจในบันทึกข้อตกลงและเห็นพ้องกันแล้ว จึงลงลายมือชื่อไว้เป็นสำคัญ',
      { fontSize: 13, textAlign: 'center', lineHeight: 1.3 }),
    element('mou-signature-left', 'signature', 88, 904, 230, 35, 'ลายมือชื่อผู้แทนองค์การบริหารส่วนตำบล', { textAlign: 'center' }),
    element('mou-signature-right', 'signature', 400, 904, 230, 35, 'ลายมือชื่อผู้แทนโรงเรียน', { textAlign: 'center' }),
    element('mou-name-left', 'text', 88, 943, 230, 18, '( นายสุภวิทย์ พรรณวงศ์ )', { fontSize: 13, textAlign: 'center' }),
    element('mou-name-right', 'text', 400, 943, 230, 18, '( นายไพโรจน์ กิติศรีวรพันธุ์ )', { fontSize: 13, textAlign: 'center' }),
    element('mou-position-left', 'text', 88, 965, 230, 20, 'นายกองค์การบริหารส่วนตำบลโนนตาล', { fontSize: 13, textAlign: 'center' }),
    element('mou-position-right', 'text', 400, 965, 230, 20, 'ผู้อำนวยการโรงเรียนอุเทนพัฒนา', { fontSize: 13, textAlign: 'center' }),
  ]

  assertLayout(elements)

  const data = {
    name: 'บันทึกข้อตกลงโรงเรียนปลอดเหล้าและบุหรี่ (MOU)',
    slug: TEMPLATE_SLUG,
    description: 'เทมเพลตกลางแบบแก้ไขได้ สร้างจากองค์ประกอบข้อความ โลโก้ เส้น และลายเซ็นแยกชิ้น จัดวางตามเอกสารอ้างอิงโดยไม่มีองค์ประกอบซ้อนกัน',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      source: 'editable-manual-layout-from-reference',
      pages: [{ id: PAGE_ID, name: 'บันทึกข้อตกลง หน้า 1', order: 1, width: PAGE_WIDTH, height: PAGE_HEIGHT, background: '#ffffff' }],
      elements,
    },
    paperSize: PaperSize.A4,
    orientation: PaperOrientation.PORTRAIT,
    isGlobal: true,
    isActive: true,
    createdByAdminId: admin?.id,
  }

  const existing = await prisma.documentTemplate.findFirst({ where: { slug: TEMPLATE_SLUG, isGlobal: true } })
  const template = existing
    ? await prisma.documentTemplate.update({ where: { id: existing.id }, data })
    : await prisma.documentTemplate.create({ data })

  console.log(JSON.stringify({ id: template.id, slug: template.slug, page: `${PAGE_WIDTH}x${PAGE_HEIGHT}`, elements: elements.length }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
