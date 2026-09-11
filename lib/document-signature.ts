import { createHash } from 'node:crypto'

export function signaturePayload(data: unknown): Record<string, any> {
  const parsed = typeof data === 'string' ? JSON.parse(data) : data
  const { electronicSignature: _signature, submitterSignature: _submitterSignature, approvalSubmittedAt: _approvalSubmittedAt, ...content } = (parsed || {}) as Record<string, any>
  return content
}

export function documentDigest(document: { documentNo: string; title: string; dataJson: unknown; templateId: string | null; documentTypeId: string }, layout: unknown) {
  const canonical = (value: any): any => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value
  return createHash('sha256').update(JSON.stringify(canonical({ documentNo: document.documentNo, title: document.title,
    documentTypeId: document.documentTypeId, templateId: document.templateId, layout, data: signaturePayload(document.dataJson) }))).digest('hex')
}

export function validateSignatureImage(image: string) {
  if (typeof image !== 'string' || image.length > 350_000 || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(image)) throw new Error('รูปแบบลายเซ็นไม่ถูกต้อง')
  const bytes = Buffer.from(image.split(',')[1], 'base64')
  if (bytes.length < 100 || !bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error('ลายเซ็นต้องเป็นรูป PNG')
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20)
  if (width < 100 || width > 1600 || height < 50 || height > 800) throw new Error('ขนาดลายเซ็นไม่ถูกต้อง')
}
