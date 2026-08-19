const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const firstPageId = 'mou-page-1'
const secondPageId = 'mou-page-2'
let sequence = 0

function element(pageId, type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `mou-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 15,
    color: '#111827',
    ...extra,
  }
}

const elements = [
  element(firstPageId, 'logo', 195, 28, 82, 82, '[โลโก้หน่วยงานที่ 1]'),
  element(firstPageId, 'logo', 318, 28, 82, 82, '[โลโก้หน่วยงานที่ 2]'),
  element(firstPageId, 'heading', 45, 124, 505, 34, 'บันทึกข้อตกลง (MOU) {{mou_subject}}', { fontSize: 21, fontWeight: 'bold', textAlign: 'center' }),
  element(firstPageId, 'heading', 45, 162, 505, 26, 'ระหว่าง', { fontSize: 18, fontWeight: 'bold', textAlign: 'center' }),
  element(firstPageId, 'heading', 45, 191, 505, 32, '{{party_one_name}} กับ {{party_two_name}}', { fontSize: 19, fontWeight: 'bold', textAlign: 'center' }),
  element(firstPageId, 'line', 205, 230, 185, 1),
  element(firstPageId, 'text', 45, 246, 505, 24, 'จัดทำ ณ {{agreement_location}} วันที่ {{agreement_date}}', { fontSize: 14, textAlign: 'center' }),
  element(firstPageId, 'paragraph', 48, 286, 499, 125,
    'บันทึกข้อตกลงความร่วมมือฉบับนี้จัดทำขึ้นระหว่าง {{party_one_name}} โดย {{party_one_representative}} ตำแหน่ง {{party_one_position}} และ {{party_two_name}} โดย {{party_two_representative}} ตำแหน่ง {{party_two_position}} เพื่อสนับสนุน ส่งเสริม และขับเคลื่อนความร่วมมือเรื่อง {{mou_subject}} ให้บรรลุวัตถุประสงค์และเป้าหมายที่กำหนดร่วมกัน',
    { fontSize: 15, textAlign: 'justify' }),
  element(firstPageId, 'heading', 48, 423, 499, 25, 'วัตถุประสงค์ของความร่วมมือ', { fontSize: 17, fontWeight: 'bold' }),
  element(firstPageId, 'paragraph', 62, 454, 485, 62, '๑. เพื่อกำหนดนโยบาย แผนปฏิบัติการ และแนวทางการดำเนินงานร่วมกันเกี่ยวกับ {{objective_one}}', { fontSize: 15, textAlign: 'justify' }),
  element(firstPageId, 'paragraph', 62, 522, 485, 62, '๒. เพื่อจัดสภาพแวดล้อม เฝ้าระวัง และดำเนินมาตรการตามกฎหมายหรือระเบียบที่เกี่ยวข้องกับ {{objective_two}}', { fontSize: 15, textAlign: 'justify' }),
  element(firstPageId, 'paragraph', 62, 590, 485, 62, '๓. เพื่อสอดแทรกองค์ความรู้ สนับสนุนกิจกรรม และส่งเสริมการมีส่วนร่วมของบุคลากร ชุมชน และภาคีเครือข่าย', { fontSize: 15, textAlign: 'justify' }),
  element(firstPageId, 'paragraph', 62, 658, 485, 75, '๔. เพื่อสนับสนุนสื่อรณรงค์ ประชาสัมพันธ์ ให้คำปรึกษา ติดตาม และช่วยเหลือกลุ่มเป้าหมายอย่างเป็นระบบ', { fontSize: 15, textAlign: 'justify' }),
  element(firstPageId, 'paragraph', 48, 750, 499, 50, 'ทั้งสองหน่วยงานตกลงประสานความร่วมมือ สนับสนุนการดำเนินงาน และติดตามประเมินผลเพื่อให้เกิดประโยชน์สูงสุดอย่างต่อเนื่อง', { fontSize: 14, textAlign: 'justify' }),
  element(firstPageId, 'text', 500, 808, 48, 18, 'หน้า 1/2', { fontSize: 11, textAlign: 'right', color: '#6b7280' }),

  element(secondPageId, 'heading', 45, 38, 505, 30, 'ขอบเขตและแนวทางการดำเนินงาน', { fontSize: 19, fontWeight: 'bold', textAlign: 'center' }),
  element(secondPageId, 'paragraph', 62, 88, 485, 72, '๕. {{party_one_name}} รับผิดชอบการกำหนดนโยบาย แต่งตั้งคณะทำงาน จัดทำแผนปฏิบัติการ และรายงานผลการดำเนินงานตามกรอบความร่วมมือ', { fontSize: 15, textAlign: 'justify' }),
  element(secondPageId, 'paragraph', 62, 166, 485, 72, '๖. {{party_two_name}} สนับสนุนองค์ความรู้ บุคลากร สื่อประชาสัมพันธ์ และประสานเครือข่ายเพื่อให้การดำเนินงานเป็นไปอย่างมีประสิทธิภาพ', { fontSize: 15, textAlign: 'justify' }),
  element(secondPageId, 'paragraph', 62, 244, 485, 72, '๗. ทั้งสองฝ่ายร่วมกันติดตาม ประเมินผล แลกเปลี่ยนข้อมูล และปรับปรุงแนวทางดำเนินงานให้เหมาะสมกับสถานการณ์', { fontSize: 15, textAlign: 'justify' }),
  element(secondPageId, 'paragraph', 62, 322, 485, 72, '๘. รายละเอียดกิจกรรม งบประมาณ ผู้รับผิดชอบ และระยะเวลาดำเนินงาน ให้เป็นไปตามแผนงานที่ทั้งสองฝ่ายเห็นชอบร่วมกัน', { fontSize: 15, textAlign: 'justify' }),

  element(secondPageId, 'heading', 48, 414, 499, 24, 'ระยะเวลาของบันทึกข้อตกลง', { fontSize: 17, fontWeight: 'bold' }),
  element(secondPageId, 'paragraph', 62, 444, 485, 62, 'บันทึกข้อตกลงฉบับนี้มีผลตั้งแต่วันที่ {{effective_date}} ถึงวันที่ {{expiry_date}} การแก้ไขเพิ่มเติมหรือการยกเลิกต้องได้รับความเห็นชอบเป็นลายลักษณ์อักษรจากทั้งสองฝ่าย', { fontSize: 15, textAlign: 'justify' }),
  element(secondPageId, 'paragraph', 48, 520, 499, 65, 'ผู้ทำข้อตกลงได้อ่านและเข้าใจข้อความในบันทึกข้อตกลงนี้โดยตลอดแล้ว เห็นว่าถูกต้องตรงตามเจตนารมณ์ จึงลงลายมือชื่อไว้เป็นหลักฐานต่อหน้าพยาน', { fontSize: 15, textAlign: 'justify' }),

  element(secondPageId, 'line', 75, 665, 185, 1),
  element(secondPageId, 'line', 335, 665, 185, 1),
  element(secondPageId, 'text', 75, 678, 185, 24, '({{party_one_representative}})', { fontSize: 15, textAlign: 'center' }),
  element(secondPageId, 'text', 335, 678, 185, 24, '({{party_two_representative}})', { fontSize: 15, textAlign: 'center' }),
  element(secondPageId, 'text', 75, 706, 185, 24, '{{party_one_position}}', { fontSize: 14, textAlign: 'center' }),
  element(secondPageId, 'text', 335, 706, 185, 24, '{{party_two_position}}', { fontSize: 14, textAlign: 'center' }),
  element(secondPageId, 'text', 75, 734, 185, 24, '{{party_one_name}}', { fontSize: 14, textAlign: 'center' }),
  element(secondPageId, 'text', 335, 734, 185, 24, '{{party_two_name}}', { fontSize: 14, textAlign: 'center' }),

  element(secondPageId, 'line', 140, 792, 120, 1),
  element(secondPageId, 'line', 335, 792, 120, 1),
  element(secondPageId, 'text', 120, 800, 160, 20, 'พยานฝ่ายที่ 1', { fontSize: 13, textAlign: 'center' }),
  element(secondPageId, 'text', 315, 800, 160, 20, 'พยานฝ่ายที่ 2', { fontSize: 13, textAlign: 'center' }),
  element(secondPageId, 'text', 500, 816, 48, 18, 'หน้า 2/2', { fontSize: 11, textAlign: 'right', color: '#6b7280' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({
    where: { slug: 'MOU', isGlobal: true },
  })

  if (!documentType) throw new Error('ไม่พบประเภทเอกสารบันทึกข้อตกลง (MOU) ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-cooperation-mou-template'
  const data = {
    name: 'บันทึกข้อตกลงความร่วมมือ (MOU)',
    slug,
    description: 'เทมเพลตบันทึกข้อตกลงความร่วมมือ 2 หน้า พร้อมตราสัญลักษณ์ คู่สัญญา วัตถุประสงค์ ขอบเขตการดำเนินงาน ระยะเวลา และลายเซ็น',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [
        { id: firstPageId, name: 'MOU หน้า 1', order: 1, width: 595, height: 842, background: '#ffffff' },
        { id: secondPageId, name: 'MOU หน้า 2', order: 2, width: 595, height: 842, background: '#ffffff' },
      ],
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
