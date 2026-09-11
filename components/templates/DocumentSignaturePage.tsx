import React from 'react'

export function DocumentSignaturePage({ signature, documentNo, signerLabel = 'ผู้ลงนาม' }: { signature: any; documentNo: string; signerLabel?: string }) {
  return <section className="document-print-page signature-record mx-auto mt-6 min-h-[297mm] max-w-[210mm] bg-white p-12 text-black shadow print:shadow-none" style={{ breakBefore: 'page' }}>
    <h2 className="mb-8 text-2xl font-bold">บันทึกการลงนามออนไลน์</h2>
    <p className="mb-2">เอกสารเลขที่ {documentNo}</p>
    <p className="mb-8">{signerLabel}ยืนยันลงนามในเอกสารฉบับที่แสดงก่อนหน้านี้</p>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={signature.image} alt={`ลายเซ็น${signerLabel}`} width={400} height={160} className="mb-4 h-40 w-96 max-w-full object-contain object-left" />
    <p className="font-semibold">{signature.name}</p>
    <p>ลงนามเมื่อ {new Date(signature.signedAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</p>
    <div className="mt-12 border-t pt-5 text-xs text-gray-600"><p>รหัสตรวจสอบเนื้อหาเอกสาร (SHA-256)</p><p className="mt-2 break-all font-mono">{signature.hash}</p></div>
  </section>
}
