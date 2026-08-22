const { PrismaClient, TemplateMode, PaperSize, PaperOrientation } = require('@prisma/client')

const prisma = new PrismaClient()
const page1 = 'office-lease-page-1'
const page2 = 'office-lease-page-2'
const page3 = 'office-lease-page-3'
let sequence = 0

function element(pageId, type, x, y, width, height, content = '', extra = {}) {
  sequence += 1
  return {
    id: `office-lease-${sequence}`,
    pageId,
    type,
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Cordia New',
    fontSize: 16,
    color: '#111827',
    ...extra,
  }
}

const elements = [
  element(page1, 'heading', 45, 42, 505, 38, 'สัญญาเช่าสำนักงานหรือพื้นที่', { fontSize: 23, fontWeight: 'bold', textAlign: 'center' }),
  element(page1, 'text', 330, 104, 215, 24, 'เขียนที่ {{contract_place}}', { fontSize: 16 }),
  element(page1, 'text', 330, 140, 215, 24, 'วันที่ {{contract_date}}', { fontSize: 16 }),
  element(page1, 'paragraph', 48, 202, 499, 122,
    'สัญญาฉบับนี้ทำขึ้นระหว่าง {{lessor_name}} เลขประจำตัวประชาชน/เลขทะเบียนนิติบุคคล {{lessor_id}} ที่อยู่ {{lessor_address}} โดย {{lessor_representative}} ผู้มีอำนาจลงนาม ซึ่งต่อไปในสัญญานี้เรียกว่า “ผู้ให้เช่า” ฝ่ายหนึ่ง กับ',
    { fontSize: 16, textAlign: 'justify' }),
  element(page1, 'paragraph', 48, 338, 499, 122,
    '{{lessee_name}} เลขประจำตัวประชาชน/เลขทะเบียนนิติบุคคล {{lessee_id}} ที่อยู่ {{lessee_address}} โดย {{lessee_representative}} ผู้มีอำนาจลงนาม ซึ่งต่อไปในสัญญานี้เรียกว่า “ผู้เช่า” อีกฝ่ายหนึ่ง',
    { fontSize: 16, textAlign: 'justify' }),
  element(page1, 'paragraph', 48, 474, 499, 108,
    'คู่สัญญาตกลงให้เช่าและเช่าสำนักงาน/พื้นที่เลขที่ {{property_number}} ชั้น {{property_floor}} อาคาร {{building_name}} ตั้งอยู่ที่ {{property_address}} มีพื้นที่ประมาณ {{property_area}} ตารางเมตร พร้อมทรัพย์สินและอุปกรณ์ตามบัญชีแนบท้าย ซึ่งต่อไปเรียกว่า “ทรัพย์สินที่เช่า”',
    { fontSize: 16, textAlign: 'justify' }),
  element(page1, 'heading', 48, 598, 499, 26, 'ข้อ 1 ระยะเวลาการเช่าและค่าเช่า', { fontSize: 18, fontWeight: 'bold' }),
  element(page1, 'paragraph', 62, 632, 485, 86,
    'ผู้ให้เช่าตกลงให้เช่าและผู้เช่าตกลงเช่าทรัพย์สินเป็นเวลา {{lease_term}} เริ่มตั้งแต่วันที่ {{lease_start_date}} ถึงวันที่ {{lease_end_date}} โดยผู้เช่าชำระค่าเช่าเดือนละ {{monthly_rent}} บาท ({{monthly_rent_text}}) ภายในวันที่ {{rent_due_day}} ของทุกเดือน',
    { fontSize: 16, textAlign: 'justify' }),
  element(page1, 'heading', 48, 730, 499, 26, 'ข้อ 2 เงินประกันและค่าเช่าล่วงหน้า', { fontSize: 18, fontWeight: 'bold' }),
  element(page1, 'paragraph', 62, 764, 485, 48, 'ผู้เช่าชำระเงินประกัน {{security_deposit}} บาท และค่าเช่าล่วงหน้า {{advance_rent}} บาท', { fontSize: 15, textAlign: 'justify' }),
  element(page1, 'text', 500, 814, 48, 18, 'หน้า 1/3', { fontSize: 11, textAlign: 'right', color: '#6b7280' }),

  element(page2, 'heading', 45, 38, 505, 30, 'สัญญาเช่าสำนักงานหรือพื้นที่', { fontSize: 19, fontWeight: 'bold', textAlign: 'center' }),
  element(page2, 'paragraph', 48, 82, 499, 78,
    'เงินประกันไม่มีดอกเบี้ยและผู้ให้เช่าจะคืนให้ภายใน {{deposit_return_days}} วันนับแต่สัญญาสิ้นสุด หลังหักค่าเสียหาย ค่าใช้จ่าย หรือหนี้ค้างชำระของผู้เช่า (ถ้ามี)',
    { fontSize: 16, textAlign: 'justify' }),
  element(page2, 'heading', 48, 172, 499, 26, 'ข้อ 3 วัตถุประสงค์การใช้พื้นที่', { fontSize: 18, fontWeight: 'bold' }),
  element(page2, 'paragraph', 62, 206, 485, 82,
    'ผู้เช่าจะใช้ทรัพย์สินเพื่อ {{lease_purpose}} เท่านั้น ห้ามใช้เพื่อการผิดกฎหมาย ก่อความเดือดร้อน หรือเปลี่ยนแปลงวัตถุประสงค์โดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้ให้เช่า',
    { fontSize: 16, textAlign: 'justify' }),
  element(page2, 'heading', 48, 300, 499, 26, 'ข้อ 4 ค่าสาธารณูปโภคและค่าใช้จ่าย', { fontSize: 18, fontWeight: 'bold' }),
  element(page2, 'paragraph', 62, 334, 485, 94,
    'ผู้เช่ารับผิดชอบค่าไฟฟ้า น้ำประปา โทรศัพท์ อินเทอร์เน็ต ค่าส่วนกลาง และค่าใช้จ่ายจากการใช้ทรัพย์สินตามอัตราจริงหรืออัตรา {{utility_rate_details}} รวมทั้งภาษีหรือค่าธรรมเนียมที่กฎหมายกำหนดให้เป็นหน้าที่ของผู้เช่า',
    { fontSize: 16, textAlign: 'justify' }),
  element(page2, 'heading', 48, 440, 499, 26, 'ข้อ 5 การดูแล ซ่อมแซม และดัดแปลง', { fontSize: 18, fontWeight: 'bold' }),
  element(page2, 'paragraph', 62, 474, 485, 106,
    'ผู้เช่าต้องดูแลทรัพย์สินเสมือนวิญญูชน รับผิดชอบความเสียหายที่เกิดจากผู้เช่า พนักงาน หรือผู้มาติดต่อ การต่อเติม ดัดแปลง ติดตั้งป้าย หรือเคลื่อนย้ายอุปกรณ์ต้องได้รับความยินยอมล่วงหน้า ส่วนการซ่อมแซมโครงสร้างหลักเป็นหน้าที่ของผู้ให้เช่า เว้นแต่เกิดจากการกระทำของผู้เช่า',
    { fontSize: 16, textAlign: 'justify' }),
  element(page2, 'heading', 48, 592, 499, 26, 'ข้อ 6 การโอนสิทธิและการให้เช่าช่วง', { fontSize: 18, fontWeight: 'bold' }),
  element(page2, 'paragraph', 62, 626, 485, 72,
    'ผู้เช่าห้ามโอนสิทธิ ให้เช่าช่วง หรือยินยอมให้บุคคลอื่นใช้ทรัพย์สินทั้งหมดหรือบางส่วนโดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้ให้เช่า',
    { fontSize: 16, textAlign: 'justify' }),
  element(page2, 'heading', 48, 710, 499, 26, 'ข้อ 7 การตรวจสอบทรัพย์สิน', { fontSize: 18, fontWeight: 'bold' }),
  element(page2, 'paragraph', 62, 744, 485, 62, 'ผู้ให้เช่าหรือตัวแทนมีสิทธิเข้าตรวจสอบทรัพย์สินโดยแจ้งให้ผู้เช่าทราบล่วงหน้าตามสมควร เว้นแต่เป็นกรณีฉุกเฉิน', { fontSize: 15, textAlign: 'justify' }),
  element(page2, 'text', 500, 814, 48, 18, 'หน้า 2/3', { fontSize: 11, textAlign: 'right', color: '#6b7280' }),

  element(page3, 'heading', 45, 38, 505, 30, 'สัญญาเช่าสำนักงานหรือพื้นที่', { fontSize: 19, fontWeight: 'bold', textAlign: 'center' }),
  element(page3, 'heading', 48, 84, 499, 26, 'ข้อ 8 การผิดสัญญาและการเลิกสัญญา', { fontSize: 18, fontWeight: 'bold' }),
  element(page3, 'paragraph', 62, 118, 485, 112,
    'หากฝ่ายใดผิดสัญญา อีกฝ่ายมีสิทธิบอกกล่าวให้แก้ไขภายใน {{breach_cure_days}} วัน หากไม่แก้ไขภายในกำหนด อีกฝ่ายมีสิทธิบอกเลิกสัญญาและเรียกค่าเสียหายได้ การบอกเลิกโดยไม่มีเหตุผิดสัญญาต้องแจ้งล่วงหน้าไม่น้อยกว่า {{termination_notice_days}} วัน ทั้งนี้ ให้เป็นไปตามกฎหมายที่เกี่ยวข้อง',
    { fontSize: 16, textAlign: 'justify' }),
  element(page3, 'heading', 48, 242, 499, 26, 'ข้อ 9 การส่งคืนทรัพย์สิน', { fontSize: 18, fontWeight: 'bold' }),
  element(page3, 'paragraph', 62, 276, 485, 92,
    'เมื่อสัญญาสิ้นสุด ผู้เช่าต้องขนย้ายทรัพย์สินส่วนตัว ส่งคืนกุญแจ และคืนทรัพย์สินที่เช่าในสภาพเรียบร้อยตามการใช้งานปกติ หากส่งคืนล่าช้า ผู้เช่ารับผิดชอบค่าเสียหายและค่าใช้พื้นที่ตามอัตราที่กำหนด',
    { fontSize: 16, textAlign: 'justify' }),
  element(page3, 'heading', 48, 380, 499, 26, 'ข้อ 10 ข้อตกลงทั่วไป', { fontSize: 18, fontWeight: 'bold' }),
  element(page3, 'paragraph', 62, 414, 485, 104,
    'การแก้ไขเพิ่มเติมสัญญาต้องทำเป็นลายลักษณ์อักษรและลงนามโดยทั้งสองฝ่าย เอกสารแนบท้ายถือเป็นส่วนหนึ่งของสัญญา หากข้อกำหนดใดใช้บังคับไม่ได้ ให้ข้อกำหนดส่วนที่เหลือยังคงมีผล สัญญานี้อยู่ภายใต้กฎหมายไทย',
    { fontSize: 16, textAlign: 'justify' }),
  element(page3, 'paragraph', 48, 532, 499, 70,
    'สัญญานี้จัดทำจำนวน 2 ฉบับ มีข้อความถูกต้องตรงกัน คู่สัญญาได้อ่านและเข้าใจโดยตลอดแล้ว จึงลงลายมือชื่อไว้เป็นหลักฐานต่อหน้าพยาน และต่างฝ่ายต่างเก็บไว้ฝ่ายละหนึ่งฉบับ',
    { fontSize: 16, textAlign: 'justify' }),
  element(page3, 'line', 72, 680, 190, 1),
  element(page3, 'line', 333, 680, 190, 1),
  element(page3, 'text', 72, 690, 190, 22, '({{lessor_representative}})', { fontSize: 15, textAlign: 'center' }),
  element(page3, 'text', 333, 690, 190, 22, '({{lessee_representative}})', { fontSize: 15, textAlign: 'center' }),
  element(page3, 'text', 72, 716, 190, 22, 'ผู้ให้เช่า', { fontSize: 14, textAlign: 'center' }),
  element(page3, 'text', 333, 716, 190, 22, 'ผู้เช่า', { fontSize: 14, textAlign: 'center' }),
  element(page3, 'line', 105, 780, 130, 1),
  element(page3, 'line', 360, 780, 130, 1),
  element(page3, 'text', 90, 790, 160, 20, 'พยานฝ่ายผู้ให้เช่า', { fontSize: 13, textAlign: 'center' }),
  element(page3, 'text', 345, 790, 160, 20, 'พยานฝ่ายผู้เช่า', { fontSize: 13, textAlign: 'center' }),
  element(page3, 'text', 500, 814, 48, 18, 'หน้า 3/3', { fontSize: 11, textAlign: 'right', color: '#6b7280' }),
]

async function main() {
  const documentType = await prisma.documentType.findFirst({ where: { slug: 'LEASE', isGlobal: true } })
  if (!documentType) throw new Error('ไม่พบประเภทเอกสารสัญญาเช่าสำนักงานหรือพื้นที่ในระบบ')

  const admin = await prisma.systemAdmin.findFirst()
  const slug = 'central-office-space-lease-template'
  const data = {
    name: 'สัญญาเช่าสำนักงานหรือพื้นที่',
    slug,
    description: 'เทมเพลตสัญญาเช่าสำนักงานหรือพื้นที่ 3 หน้า พร้อมข้อมูลคู่สัญญา ทรัพย์สิน ระยะเวลา ค่าเช่า เงินประกัน ค่าสาธารณูปโภค การดูแล การเลิกสัญญา และช่องลงนาม',
    categoryId: documentType.categoryId,
    documentTypeId: documentType.id,
    templateMode: TemplateMode.DESIGNER,
    layoutJson: {
      pages: [
        { id: page1, name: 'สัญญาเช่า หน้า 1', order: 1, width: 595, height: 842, background: '#ffffff' },
        { id: page2, name: 'สัญญาเช่า หน้า 2', order: 2, width: 595, height: 842, background: '#ffffff' },
        { id: page3, name: 'สัญญาเช่า หน้า 3', order: 3, width: 595, height: 842, background: '#ffffff' },
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
