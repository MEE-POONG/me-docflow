import { chromium } from 'playwright'
import { prisma } from '@/lib/prisma'
import { getDocumentCompany } from '@/app/actions/documents'

export const runtime = 'nodejs'
export const maxDuration = 90

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let browser
  try {
    const { id } = await params
    const input = await request.json()
    const company = await getDocumentCompany(input)
    const document = await prisma.document.findFirst({ where: { id, companyId: company.id } })
    if (!document) return Response.json({ error: 'ไม่พบเอกสารในบริษัทนี้' }, { status: 404 })
    const templateId = document.isLocked ? document.templateId || '' : String(input.templateId ?? document.templateId ?? '')
    if (templateId && !document.isLocked) {
      const template = await prisma.documentTemplate.findFirst({ where: { id: templateId, documentTypeId: document.documentTypeId, OR: [{ companyId: company.id }, { isGlobal: true }], isActive: true } })
      if (!template) return Response.json({ error: 'เทมเพลตไม่ตรงกับเอกสาร' }, { status: 400 })
    }
    const base = process.env.DOCUMENT_PDF_BASE_URL || `http://localhost:${process.env.PORT || '3000'}`
    const url = new URL(`/documents/${id}`, base)
    url.searchParams.set('preview', 'true')
    url.searchParams.set('templateId', templateId)
    browser = await chromium.launch(process.env.PDF_CHROME_PATH ? { executablePath: process.env.PDF_CHROME_PATH } : process.platform === 'win32' ? { channel: 'chrome' } : {})
    const page = await browser.newPage()
    const response = await page.goto(url.toString(), { waitUntil: 'networkidle', timeout: 60000 })
    if (!response?.ok()) throw new Error('โหลดเอกสารสำหรับ PDF ไม่สำเร็จ')
    await page.locator('.print-section').first().waitFor()
    await page.evaluate(async () => {
      await window.document.fonts.ready
      await Promise.all(Array.from(window.document.querySelectorAll<HTMLImageElement>('.print-section img')).map(img => img.decode()))
    })
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, margin: { top: 0, bottom: 0, left: 0, right: 0 } })
    const current = await prisma.document.findFirst({ where: { id, companyId: company.id }, select: { updatedAt: true } })
    if (!current || current.updatedAt.getTime() !== document.updatedAt.getTime()) return Response.json({ error: 'เอกสารถูกแก้ไขระหว่างส่งออก กรุณาลองอีกครั้ง' }, { status: 409 })
    return new Response(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="document.pdf"; filename*=UTF-8''${encodeURIComponent(document.documentNo + '.pdf')}`, 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('PDF export failed', error instanceof Error ? error.message : 'Unknown error')
    return Response.json({ error: 'ส่งออก PDF ไม่สำเร็จ กรุณาลองอีกครั้ง' }, { status: 500 })
  } finally { await browser?.close() }
}
