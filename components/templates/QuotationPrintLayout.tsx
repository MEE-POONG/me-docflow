import React from 'react'

const money = (value: unknown) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export type OnlineSignature = { image: string; name: string; signedAt: string }

export function QuotationPrintLayout({ data, signature, submitterSignature, documentTitle = 'ใบเสนอราคา', dateLabel = 'วันที่เสนอราคา', dueDateLabel = 'ยืนราคาถึงวันที่', partyLabel = 'ลูกค้า', submitterLabel = 'ผู้เสนอราคา', approverLabel = 'ผู้อนุมัติสั่งซื้อ', children, details }: {
  data: any; signature?: OnlineSignature | null; submitterSignature?: OnlineSignature | null;
  documentTitle?: string; dateLabel?: string; dueDateLabel?: string; partyLabel?: string;
  submitterLabel?: string; approverLabel?: string; children?: React.ReactNode; details?: React.ReactNode;
}) {
  return (
    <article className="document-print-page relative mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col bg-white p-8 text-[13px] leading-relaxed text-black shadow-lg print:shadow-none">
      <svg aria-hidden="true" className="absolute right-0 top-0 h-20 w-20 text-sky-500" viewBox="0 0 100 100" fill="currentColor"><path d="M0 0H100V100Z" /></svg>
      <header className="mb-8 grid grid-cols-2 gap-8">
        <div>
          <h2 className="mb-3 text-xl font-bold text-sky-700">{data.company_name || 'ชื่อบริษัท'}</h2>
          <p className="whitespace-pre-wrap">{data.company_address || '-'}</p>
          <p>เลขประจำตัวผู้เสียภาษี {data.company_taxid || '-'}</p>
          <p>โทร. {data.company_phone || '-'}</p>
        </div>
        <div className="pr-6">
          <h1 className="mb-4 border-b border-sky-500 pb-3 text-center text-3xl font-semibold text-sky-600 break-words">{documentTitle}</h1>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
            <dt>เลขที่เอกสาร</dt><dd className="text-right">{data.doc_no || '-'}</dd>
            <dt>{dateLabel}</dt><dd className="text-right">{data.doc_date || '-'}</dd>
            {dueDateLabel && <><dt>{dueDateLabel}</dt><dd className="text-right">{data.expire_date || '-'}</dd></>}
          </dl>
        </div>
      </header>
      {children ?? <>
      <section className="mb-8 grid grid-cols-2 gap-8">
        <div><h2 className="font-semibold text-sky-700">{partyLabel}</h2><p className="font-semibold">{data.customer_name || '-'}</p><p className="whitespace-pre-wrap">{data.customer_address || '-'}</p></div>
        <div><h2 className="font-semibold text-sky-700">เลขที่อ้างอิง / ชื่อโครงการ</h2><p>{data.quotation_ref_no || '-'}</p></div>
      </section>
      {details}
      <table className="mb-6 w-full border-collapse">
        <thead className="table-header-group"><tr className="border-y border-sky-200 bg-sky-50">
          {['#', 'รายละเอียด', 'จำนวน', 'หน่วย', 'ราคาต่อหน่วย', 'มูลค่า'].map((heading, index) => <th key={heading} className={'p-2 font-semibold ' + (index >= 2 ? 'text-right' : 'text-left')}>{heading}</th>)}
        </tr></thead>
        <tbody>{(data.items || []).map((item: any, index: number) => <tr key={index} className="break-inside-avoid border-b border-gray-100">
          <td className="p-2">{index + 1}</td><td className="p-2 whitespace-pre-wrap">{item.name}</td><td className="p-2 text-right">{item.qty}</td><td className="p-2 text-right">{item.unit}</td><td className="p-2 text-right">{money(item.unitPrice)}</td><td className="p-2 text-right">{money(Number(item.qty) * Number(item.unitPrice))}</td>
        </tr>)}</tbody>
      </table>
      <dl className="mb-8 ml-auto grid w-1/2 grid-cols-[1fr_auto] gap-x-6 gap-y-2 break-inside-avoid text-right">
        <dt>รวมเป็นเงิน</dt><dd>{data.subtotal} บาท</dd>
        <dt>ส่วนลด</dt><dd>{data.discount} บาท</dd>
        <dt>ราคาหลังหักส่วนลด</dt><dd>{data.after_discount} บาท</dd>
        <dt>ภาษีมูลค่าเพิ่ม 7%{data.price_type === 'include_vat' ? ' (รวมในราคา)' : ''}</dt><dd>{data.vat} บาท</dd>
        <dt className="border-t pt-3 font-bold text-sky-700">จำนวนเงินรวมทั้งสิ้น</dt><dd className="border-t pt-3 font-bold">{data.total_amount} บาท</dd>
      </dl>
      {data.payment_terms && <section className="mb-5"><h2 className="font-semibold text-sky-700">เงื่อนไขการชำระเงิน</h2><p className="whitespace-pre-wrap">{data.payment_terms}</p></section>}
      {data.remarks && <section className="mb-5"><h2 className="font-semibold text-sky-700">หมายเหตุ</h2><p className="whitespace-pre-wrap">{data.remarks}</p></section>}
      </>}
      <footer className="mt-auto grid grid-cols-2 items-start gap-20 pt-8 text-center break-inside-avoid">
        <div>
          <div className="flex h-24 items-end justify-center pb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {submitterSignature && <img src={submitterSignature.image} alt="ลายเซ็นผู้ยื่นขออนุมัติ" width={240} height={88} className="h-full w-full object-contain" />}
          </div>
          <p className="border-t pt-3">{submitterLabel}</p>
          <p>{submitterSignature?.name || data.employee?.name || '-'}</p>
          {submitterSignature && <p>วันที่ {new Date(submitterSignature.signedAt).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })}</p>}
        </div>
        <div>
          <div className="flex h-24 items-end justify-center pb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {signature && <img src={signature.image} alt="ลายเซ็นผู้อนุมัติ" width={240} height={88} className="h-full w-full object-contain" />}
          </div>
          <p className="border-t pt-3">{approverLabel}</p>
          {signature && <p>{signature.name}</p>}
          <p>{signature ? `วันที่ ${new Date(signature.signedAt).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })}` : 'วันที่ ................................'}</p>
        </div>
      </footer>
    </article>
  )
}
