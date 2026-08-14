<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# งานแก้ไข
# 1.http://localhost:3000/documents/pending ปุ่มปริ้นให้เลือกเทมเพลตเอกสารก่อนแล้วถึงปริ้น จะทำแบบไหนก็ได้ เป็นแยก โชว์ ตัวอย่างที่เลิอกก่อน แล้วค่อยคอมเฟิร์ม หรือ โชว์เป็น modal ก็ได้
# 2. http://localhost:3000/documents/create การจะสร้างเอกสารได้ ต้องเลือก หมวดหมู่และประเภทเอกสารก่อนเป็น step แรก แล้วถึงจะสร้างเอกสารได้ step2 ให้กรอกข้อมูลก่อนแล้วจึงบันทึก step3ดูข้อมูลเป็นตัวอย่างโดยเลือก doc-format และสามารถย้อนกลับไปแก้ไข step 2 ได้
# หมายเหตุ รายการเอกสาร 1 รายการ สามารถมีแบบฟอร์มได้มากกว่า 1 แบบฟอร์ม และ 1แบบฟอร์ม สามารถมี templant ได้มากกว่า 1 templant
# 3.http://localhost:3000/doc-format ดึงข้อมูลจากหน้ากรอกแบบฟอรืมเอกสารมาแสดงบนเทมเพลต
# 4.http://localhost:3000/documents/create ให้มีปุ่ม preview สำหรับตรวจทานความถูกต้องของการดึงข้อมูลจากฟอร์มที่กรอก มาแสดงบนเทมเพลต


# งานแก้ไข02
# 1. http://localhost:3000/documents ปรับปรุงลำดับการทำงาน