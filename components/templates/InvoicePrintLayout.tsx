import React from 'react'

type InvoicePrintLayoutProps = {
  data: any
}

export function InvoicePrintLayout({ data }: InvoicePrintLayoutProps) {
  return (
    <div className="w-full bg-white text-black print:p-0 p-8 max-w-[210mm] mx-auto min-h-[297mm] shadow-lg print:shadow-none text-[13px] leading-relaxed font-sans relative">
      {/* Decorative right top corner - triangle with number 1 */}
      <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden print:hidden">
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#714b9c] transform rotate-45 flex items-end justify-center pb-2">
          <span className="text-white text-xl font-bold transform -rotate-45 block pr-4 pt-10">1</span>
        </div>
      </div>
      <div className="hidden print:block absolute top-0 right-0 w-32 h-32 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#714b9c] transform rotate-45 flex items-end justify-center pb-2">
          <span className="text-white text-xl font-bold transform -rotate-45 block pr-4 pt-10">1</span>
        </div>
      </div>

      <div className="flex justify-between items-start mb-8">
        {/* Top Left: Logo & Company */}
        <div className="w-[55%] pr-4">
          <div className="flex items-center gap-2 mb-4">
            {/* Mock Flowaccount Logo */}
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              ✓
            </div>
            <span className="text-2xl font-light text-blue-500 tracking-wide">FLOWACCOUNT<span className="font-bold text-gray-800">.COM</span></span>
          </div>
          <div className="font-bold text-[13px]">{data.company_name || 'Tanai Digital Platform'}</div>
          <div className="text-gray-800 mt-1">
            {data.company_address || '141 ชั้น 11 ยูนิต 12B อาคารชุด สกุลไทย สุรวงศ์ ทาวเวอร์\nถนนสุรวงศ์ แขวงสุริยวงศ์ เขตบางรัก กรุงเทพมหานคร 10500'}
          </div>
          <div className="text-gray-800 mt-1">
            เลขประจำตัวผู้เสียภาษี {data.company_taxid || '1234567890123'}
          </div>
          <div className="text-gray-800">
            เบอร์มือถือ {data.company_phone || '0989549416'}
          </div>
        </div>

        {/* Top Right: Document Title & Meta */}
        <div className="w-[45%] pl-4 flex flex-col items-center pt-2">
          <div className="text-center mb-4 w-full border-b border-gray-200 pb-2">
            <h1 className="text-2xl font-normal text-[#714b9c]">
              ใบวางบิล/ใบแจ้งหนี้
            </h1>
            <div className="text-[#714b9c] text-sm">ต้นฉบับ</div>
          </div>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="text-[#714b9c] w-28 py-0.5">เลขที่</td>
                <td className="text-left text-gray-800">{data.inv_ref_no || data.doc_no || 'BL2020060011'}</td>
              </tr>
              <tr>
                <td className="text-[#714b9c] py-0.5">วันที่</td>
                <td className="text-left text-gray-800">{data.doc_date || '11/06/2020'}</td>
              </tr>
              <tr>
                <td className="text-[#714b9c] py-0.5">ครบกำหนด</td>
                <td className="text-left text-gray-800">{data.expire_date || '11/06/2020'}</td>
              </tr>
              <tr>
                <td className="text-[#714b9c] py-0.5">ผู้ขาย</td>
                <td className="text-left text-gray-800 uppercase">{data.inv_seller || data.employee?.name || 'TANAI NOPAKOON'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-start mb-6">
        {/* Middle Left: Customer Info */}
        <div className="w-[60%] pr-4">
          <div className="text-[#714b9c] font-normal mb-1">ลูกค้า</div>
          <div className="font-bold">{data.inv_customer_name || data.customer_name || 'บริษัท โฟลว์แอคเคาท์ จำกัด (สำนักงานใหญ่ 00000)'}</div>
          <div className="text-gray-800 mt-1 whitespace-pre-wrap">{data.inv_customer_address || data.customer_address || '141/12 ชั้น 11 ยูนิต 12B อาคารชุดสกุลไทย สุรวงศ์ ทาวเวอร์ ถนนสุรวงศ์ แขวงสุริยวงศ์ เขตบางรัก กรุงเทพมหานคร 10500'}</div>
          <div className="text-gray-800 mt-1">เลขประจำตัวผู้เสียภาษี {data.inv_customer_taxid || data.customer_taxid || '0105558096348'}</div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-gray-300">
              <th className="py-2 px-1 text-center font-normal w-12 text-gray-800">#</th>
              <th className="py-2 px-1 text-left font-normal text-gray-800">รายละเอียด</th>
              <th className="py-2 px-1 text-right font-normal w-24 text-gray-800">จำนวน</th>
              <th className="py-2 px-1 text-right font-normal w-32 text-gray-800">ราคาต่อหน่วย</th>
              <th className="py-2 px-1 text-right font-normal w-24 text-gray-800">ส่วนลด</th>
              <th className="py-2 px-1 text-right font-normal w-32 text-gray-800">มูลค่า</th>
            </tr>
          </thead>
          <tbody>
            {(data.items && data.items.length > 0) ? (
              data.items.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2 px-1 text-center align-top">{idx + 1}</td>
                  <td className="py-2 px-1 whitespace-pre-wrap align-top">{item.name}</td>
                  <td className="py-2 px-1 text-right align-top">{item.qty} {item.unit}</td>
                  <td className="py-2 px-1 text-right align-top">
                    {Number(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-1 text-right align-top">-</td>
                  <td className="py-2 px-1 text-right align-top">
                    {(Number(item.qty || 0) * Number(item.unitPrice || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-b border-gray-100">
                <td className="py-2 px-1 text-center align-top">1</td>
                <td className="py-2 px-1 whitespace-pre-wrap align-top">Unlimit x KBank Payroll{'\n'}Program FlowAccount</td>
                <td className="py-2 px-1 text-right align-top">1 ปี</td>
                <td className="py-2 px-1 text-right align-top">5,490.00</td>
                <td className="py-2 px-1 text-right align-top"></td>
                <td className="py-2 px-1 text-right align-top">5,490.00</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-between items-start mb-12">
        <div className="w-1/2 pt-16 pl-2">
          <div className="text-gray-800 font-bold">(ห้าพันสี่ร้อยเก้าสิบบาทถ้วน)</div>
        </div>
        <div className="w-1/2">
          <table className="w-full text-right text-sm">
            <tbody>
              <tr>
                <td className="text-[#714b9c] py-1.5 w-1/2">รวมเป็นเงิน</td>
                <td className="py-1.5 pr-2">{data.subtotal || '5,490.00'} <span className="text-gray-600 inline-block w-8 text-left">บาท</span></td>
              </tr>
              <tr>
                <td className="text-[#714b9c] py-1.5">ภาษีมูลค่าเพิ่ม 7%</td>
                <td className="py-1.5 pr-2">{data.vat || '359.16'} <span className="text-gray-600 inline-block w-8 text-left">บาท</span></td>
              </tr>
              {data.vat && parseFloat((data.vat || '0').replace(/,/g, '')) > 0 && (
                <tr>
                  <td className="text-[#714b9c] py-1.5">ราคาไม่รวมภาษีมูลค่าเพิ่ม</td>
                  <td className="py-1.5 pr-2">
                    {(() => {
                      const st = parseFloat((data.subtotal || '0').replace(/,/g, ''));
                      const vt = parseFloat((data.vat || '0').replace(/,/g, ''));
                      return (st - vt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    })()} <span className="text-gray-600 inline-block w-8 text-left">บาท</span>
                  </td>
                </tr>
              )}
              <tr>
                <td className="text-[#714b9c] py-1.5">จำนวนเงินรวมทั้งสิ้น</td>
                <td className="py-1.5 pr-2">{data.total_amount || '5,490.00'} <span className="text-gray-600 inline-block w-8 text-left">บาท</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Remarks */}
      <div className="mb-24">
        <div className="text-[#714b9c] font-normal mb-1 flex items-center gap-2">
          หมายเหตุ
        </div>
        <div className="whitespace-pre-wrap text-gray-800">{data.remarks || 'สามารถโอนเงินเข้าได้ที่\nบัญชีธนาคาร XXXXXXXXXXX'}</div>
      </div>

      {/* Signatures */}
      <div className="absolute bottom-12 left-8 right-8 flex justify-between items-end">
        <div className="w-[30%] text-center">
          <div className="text-left mb-16 text-sm text-gray-800">ในนาม {data.inv_customer_name || data.customer_name || 'บริษัท โฟลว์แอคเคาท์ จำกัด'}</div>
          <div className="border-b border-gray-300 w-full mb-2"></div>
          <div className="flex justify-between text-sm text-gray-800 px-4">
            <span>ผู้รับวางบิล</span>
            <span>วันที่</span>
          </div>
        </div>

        {/* Center Stamp */}
        <div className="w-[20%] flex justify-center mb-4">
          <div className="w-24 h-24 bg-[#1DA1F2] rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-sm border-4 border-white transform rotate-12">
            {/* simple generic checkmark/logo for the center stamp */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="w-[30%] text-center">
          <div className="text-right mb-16 text-sm text-gray-800">ในนาม {data.company_name || 'Tanai Digital Platform'}</div>
          <div className="flex justify-between items-end mb-2 px-2">
            <div className="text-[#3b82f6] text-sm italic pr-2 w-1/2 text-left">{data.inv_seller || data.employee?.name || 'Tanai Nopakoon'}</div>
            <div className="text-sm text-gray-800 w-1/2 text-right">{data.doc_date || '11/06/2020'}</div>
          </div>
          <div className="border-b border-gray-300 w-full mb-2"></div>
          <div className="flex justify-between text-sm text-gray-800 px-4">
            <span>ผู้วางบิล</span>
            <span>วันที่</span>
          </div>
        </div>
      </div>

    </div>
  )
}
