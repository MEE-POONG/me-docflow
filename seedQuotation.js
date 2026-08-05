const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Quotation Template...");

  // Find or create global category
  let category = await prisma.documentCategory.findFirst({
    where: { isGlobal: true, slug: 'ADMIN-CAT' },
  });
  if (!category) {
    category = await prisma.documentCategory.create({
      data: {
        name: 'Admin Global Category',
        slug: 'ADMIN-CAT',
        isGlobal: true,
        isActive: true,
      },
    });
  }

  // Find or create global document type for QT
  let docType = await prisma.documentType.findFirst({
    where: { isGlobal: true, categoryId: category.id, slug: 'QT' },
  });
  if (!docType) {
    docType = await prisma.documentType.create({
      data: {
        name: 'ใบเสนอราคา',
        slug: 'QT',
        categoryId: category.id,
        isGlobal: true,
        isActive: true,
      },
    });
  }

  const elements = [
    // 1. โลโก้บริษัท (Company Logo)
    { id: 'el-logo', type: 'logo', x: 40, y: 40, width: 100, height: 100, content: '[Logo]' },
    
    // 3. ข้อมูลผู้ซื้อ (Buyer info)
    { id: 'el-buyer', type: 'paragraph', x: 40, y: 150, width: 250, height: 60, content: 'ลูกค้า / Customer: {{customer_name}}\nที่อยู่ / Address: {{customer_address}}\nเลขประจำตัวผู้เสียภาษี: {{customer_taxid}}', fontSize: 12 },
    
    // 2. ข้อมูลผู้ขาย (Seller info)
    { id: 'el-seller', type: 'paragraph', x: 150, y: 40, width: 250, height: 60, content: '{{company_name}}\n{{company_address}}\nโทรศัพท์: {{company_phone}}\nTax ID: {{company_taxid}}', fontSize: 12 },

    // Header Right
    { id: 'el-title', type: 'heading', x: 400, y: 40, width: 155, height: 40, content: 'ใบเสนอราคา\nQUOTATION', fontSize: 22, fontWeight: 'bold', color: '#d97706' },
    
    // 6. เลขที่รันเอกสาร (Doc No, Date, etc.)
    { id: 'el-docinfo', type: 'paragraph', x: 400, y: 100, width: 155, height: 70, content: 'เลขที่ / Doc No.: {{doc_no}}\nวันที่ / Date: {{doc_date}}\nมีผลถึง / Expire Date: {{expire_date}}\nเงื่อนไขชำระ / Credit: {{credit_term}} วัน', fontSize: 11 },

    // 4. รายการสินค้า/บริการ (Table)
    { id: 'el-table', type: 'table', x: 40, y: 230, width: 515, height: 200, content: '[Table]' },

    // 5. เงื่อนไขเพิ่มเติม (Remarks)
    { id: 'el-remarks', type: 'paragraph', x: 40, y: 450, width: 250, height: 80, content: 'หมายเหตุ / Remarks:\n{{remarks}}', fontSize: 11 },

    // Summary Box
    { id: 'el-sumbox', type: 'box', x: 350, y: 450, width: 205, height: 100, content: '' },
    { id: 'el-sumtext', type: 'paragraph', x: 355, y: 455, width: 195, height: 90, content: 'รวมเงิน / Subtotal: {{subtotal}}\nส่วนลด / Discount: {{discount}}\nภาษีมูลค่าเพิ่ม 7% / VAT 7%: {{vat}}\nยอดสุทธิ / Total: {{total_amount}}', fontSize: 11 },

    // 8. ลายเซ็นผู้เสนอราคา (Seller Signature)
    { id: 'el-sig1', type: 'signature', x: 80, y: 650, width: 150, height: 60, content: '[Signature]' },
    { id: 'el-sig1-text', type: 'paragraph', x: 80, y: 710, width: 150, height: 30, content: 'ผู้เสนอราคา / Salesperson\nวันที่: ___/___/___', fontSize: 11 },

    // 9. ลายเซ็นผู้อนุมัติฝั่งผู้ซื้อ (Buyer Signature)
    { id: 'el-sig2', type: 'signature', x: 350, y: 650, width: 150, height: 60, content: '[Signature]' },
    { id: 'el-sig2-text', type: 'paragraph', x: 350, y: 710, width: 150, height: 30, content: 'ผู้อนุมัติสั่งซื้อ / Authorized By\nวันที่: ___/___/___', fontSize: 11 },
  ];

  const admin = await prisma.systemAdmin.findFirst();

  await prisma.documentTemplate.create({
    data: {
      name: 'Standard Quotation Template',
      slug: 'standard-quotation-template',
      description: 'แม่แบบใบเสนอราคามาตรฐาน ประกอบด้วย โลโก้ ข้อมูลผู้ซื้อ/ขาย ตารางสินค้า และลายเซ็น',
      categoryId: category.id,
      documentTypeId: docType.id,
      templateMode: 'DESIGNER',
      layoutJson: { elements },
      paperSize: 'A4',
      orientation: 'PORTRAIT',
      isGlobal: true,
      isActive: true,
      createdByAdminId: admin ? admin.id : null,
    },
  });

  console.log("Quotation template seeded successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
