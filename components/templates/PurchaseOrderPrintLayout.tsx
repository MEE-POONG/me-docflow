import React from 'react'

type PurchaseOrderPrintLayoutProps = {
  data: any
}

export function PurchaseOrderPrintLayout({ data }: PurchaseOrderPrintLayoutProps) {
  return (
    <div className="w-full bg-white text-black print:p-0 p-8 max-w-[210mm] mx-auto min-h-[297mm] shadow-lg print:shadow-none text-[13px] leading-relaxed font-sans relative">
      {/* Decorative right top corner */}
      <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden print:hidden">
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-pink-500 transform rotate-45"></div>
      </div>

      <div className="flex justify-between items-start mb-8">
        {/* Top Left: Logo & Company */}
        <div className="w-1/2 pr-4">
          <div className="flex items-center gap-2 mb-4">
            {/* Mock Flowaccount Logo */}
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              ✓
            </div>
            <span className="text-2xl font-bold text-blue-500 tracking-wide">FLOWACCOUNT</span>
          </div>
          <div className="font-bold text-[14px]">{data.company_name || 'บริษัท โฟลว์แอคเคาท์ จำกัด (สำนักงานใหญ่)'}</div>
          <div className="text-gray-700 mt-1">
            {data.company_address || '141/12 ชั้น 11 ยูนิต 12B อาคารชุด สกุลไทย สุรวงศ์ ทาวเวอร์ ถนนสุรวงศ์\nแขวงสุริยวงศ์ เขตบางรัก กรุงเทพมหานคร 10500'}
          </div>
          <div className="text-gray-700 mt-1">
            เลขประจำตัวผู้เสียภาษี {data.company_taxid || '0105558096348'}
          </div>
          <div className="text-gray-700">
            โทร. {data.company_phone || '020268989'}
          </div>
        </div>

        {/* Top Right: Document Title & Meta */}
        <div className="w-1/2 pl-8 flex flex-col items-end">
          <h1 className="text-3xl font-normal text-pink-600 mb-4 border-b-2 border-gray-200 pb-2 w-full text-center">
            ใบสั่งซื้อ
          </h1>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="text-pink-600 w-28 py-1">เลขที่</td>
                <td className="text-right">{data.po_ref_no || data.doc_no || '-'}</td>
              </tr>
              <tr>
                <td className="text-pink-600 py-1">วันที่</td>
                <td className="text-right">{data.doc_date || '-'}</td>
              </tr>
              <tr>
                <td className="text-pink-600 py-1">ครบกำหนด</td>
                <td className="text-right">{data.expire_date || '-'}</td>
              </tr>
              <tr>
                <td className="text-pink-600 py-1">ผู้สั่งซื้อ</td>
                <td className="text-right">{data.po_buyer || data.employee?.name || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-start mb-6">
        {/* Middle Left: Vendor Info */}
        <div className="w-[45%] pr-4">
          <div className="text-pink-600 font-normal mb-1">ผู้จำหน่าย</div>
          <div className="font-bold">{data.po_vendor_name || '-'}</div>
          <div className="text-gray-700 mt-1 whitespace-pre-wrap">{data.po_vendor_address || '-'}</div>
          {data.po_vendor_taxid && (
            <div className="text-gray-700 mt-1">เลขประจำตัวผู้เสียภาษี {data.po_vendor_taxid}</div>
          )}
        </div>

        {/* Middle Right: Project Info */}
        <div className="w-[45%]">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="text-pink-600 w-24 py-1">ชื่องาน</td>
                <td>{data.po_project_name || '-'}</td>
              </tr>
              <tr>
                <td className="text-pink-600 py-1">ผู้ติดต่อ</td>
                <td>{data.po_contact_name || '-'}</td>
              </tr>
              <tr>
                <td className="text-pink-600 py-1">เบอร์โทร</td>
                <td>{data.po_contact_phone || '-'}</td>
              </tr>
              <tr>
                <td className="text-pink-600 py-1">อีเมล</td>
                <td>{data.po_contact_email || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-y border-gray-300">
              <th className="py-2 px-1 text-center font-normal w-12">#</th>
              <th className="py-2 px-1 text-left font-normal">รายละเอียด</th>
              <th className="py-2 px-1 text-right font-normal w-24">จำนวน</th>
              <th className="py-2 px-1 text-right font-normal w-32">ราคาต่อหน่วย</th>
              <th className="py-2 px-1 text-right font-normal w-24">ส่วนลด</th>
              <th className="py-2 px-1 text-right font-normal w-32">มูลค่า</th>
            </tr>
          </thead>
          <tbody>
            {(data.items && data.items.length > 0) ? (
              data.items.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2 px-1 text-center">{idx + 1}</td>
                  <td className="py-2 px-1">{item.name}</td>
                  <td className="py-2 px-1 text-right">{item.qty} {item.unit}</td>
                  <td className="py-2 px-1 text-right">
                    {Number(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-1 text-right">-</td>
                  <td className="py-2 px-1 text-right">
                    {(Number(item.qty || 0) * Number(item.unitPrice || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-b border-gray-100">
                <td colSpan={6} className="py-4 text-center text-gray-400">ไม่มีรายการสินค้า</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-between items-start mb-12">
        <div className="w-1/2 pt-16">
          <div className="text-gray-700">(แปดร้อยสี่สิบเอ็ดบาทสิบสองสตางค์)</div>
        </div>
        <div className="w-1/2">
          <table className="w-full text-right">
            <tbody>
              <tr>
                <td className="text-pink-600 py-1.5 w-1/2">รวมเป็นเงิน</td>
                <td className="py-1.5">{data.subtotal || '0.00'} บาท</td>
              </tr>
              <tr>
                <td className="text-pink-600 py-1.5">ภาษีมูลค่าเพิ่ม 7%</td>
                <td className="py-1.5">{data.vat || '0.00'} บาท</td>
              </tr>
              {data.vat && parseFloat((data.vat || '0').replace(/,/g, '')) > 0 && (
                <tr>
                  <td className="text-pink-600 py-1.5">ราคาไม่รวมภาษีมูลค่าเพิ่ม</td>
                  <td className="py-1.5">
                    {(() => {
                      const st = parseFloat((data.subtotal || '0').replace(/,/g, ''));
                      const vt = parseFloat((data.vat || '0').replace(/,/g, ''));
                      return (st - vt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    })()} บาท
                  </td>
                </tr>
              )}
              <tr>
                <td className="text-pink-600 py-1.5 font-bold">จำนวนเงินรวมทั้งสิ้น</td>
                <td className="py-1.5 font-bold">{data.total_amount || '0.00'} บาท</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Remarks */}
      {data.remarks && (
        <div className="mb-24">
          <div className="text-pink-600 font-normal mb-1 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-pink-600 inline-block"></span>
            หมายเหตุ
          </div>
          <div className="whitespace-pre-wrap text-gray-800">{data.remarks}</div>
        </div>
      )}

      {/* Signatures */}
      <div className="absolute bottom-16 left-8 right-8 flex justify-between items-end">
        <div className="w-[30%] text-center">
          <div className="text-left mb-16 text-xs">ในนาม {data.po_vendor_name || 'บริษัท พวกเราเอง จำกัด'}</div>
          <div className="border-b border-gray-300 w-full mb-2"></div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>ผู้ขาย</span>
            <span>วันที่</span>
          </div>
        </div>

        {/* Center Stamp */}
        <div className="w-[20%] flex justify-center">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-md border-4 border-white transform rotate-12 opacity-90" style={{ background: 'radial-gradient(circle, #3b82f6 0%, #1d4ed8 100%)' }}>
            ✓
          </div>
        </div>

        <div className="w-[30%] text-center">
          <div className="text-right mb-16 text-xs">ในนาม {data.company_name || 'บริษัท โฟลว์แอคเคาท์ จำกัด'}</div>
          <div className="border-b border-gray-300 w-full mb-2"></div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>ผู้อนุมัติ</span>
            <span>วันที่</span>
          </div>
        </div>
      </div>

    </div>
  )
}
