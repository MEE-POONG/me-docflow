import React from 'react'
import { arabicToThaiText } from '@/lib/thai-baht-text'

type WithholdingTaxPrintLayoutProps = {
  data: any
}

const TaxIdBoxes = ({ taxId }: { taxId: string }) => {
  const digits = (taxId || '').replace(/[^0-9]/g, '').padEnd(13, ' ').split('').slice(0, 13)
  
  return (
    <div className="flex items-center gap-1">
      {digits.map((digit, i) => (
        <React.Fragment key={i}>
          <div className="w-5 h-6 border border-black flex items-center justify-center text-sm font-bold">
            {digit.trim() ? digit : '\u00A0'}
          </div>
          {(i === 0 || i === 4 || i === 9 || i === 11) && <div className="text-black font-bold mx-0.5">-</div>}
        </React.Fragment>
      ))}
    </div>
  )
}

const CheckboxSquare = ({ checked, label }: { checked?: boolean, label: string }) => (
  <div className="flex items-center gap-1">
    <div className="w-4 h-4 border border-black flex items-center justify-center text-xs">
      {checked && '✓'}
    </div>
    <span className="text-[11px]">{label}</span>
  </div>
)

export function WithholdingTaxPrintLayout({ data }: WithholdingTaxPrintLayoutProps) {
  // Try to parse WHT items if it's a string (from db) or just use the array
  let whtItems = data.wht_items || []
  if (typeof whtItems === 'string') {
    try {
      whtItems = JSON.parse(whtItems)
    } catch (e) {
      whtItems = []
    }
  }

  const totalAmount = whtItems.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0)
  const totalTax = whtItems.reduce((acc: number, item: any) => acc + (Number(item.tax) || 0), 0)

  return (
    <div className="w-full bg-white text-black print:p-0 p-8 max-w-[210mm] mx-auto min-h-[297mm] shadow-lg print:shadow-none text-[11px] font-sans relative">
      
      {/* Decorative Top Banner */}
      <div className="bg-[#4b96d1] text-white text-center py-2.5 px-6 rounded-full mx-auto max-w-3xl font-bold text-lg mb-6 shadow-sm print:shadow-none border-[3px] border-white ring-2 ring-[#4b96d1]/20">
        ตัวอย่าง ใบ 50 ทวิ หรือ หนังสือรับรองการหักภาษี ณ ที่จ่าย
      </div>

      <div className="mb-2 pl-4">
        <div className="font-bold">ฉบับที่ 1 <span className="font-normal ml-2">(สำหรับผู้ถูกหักภาษี ณ ที่จ่าย ใช้แนบพร้อมกับแบบแสดงรายการภาษี)</span></div>
        <div className="font-bold">ฉบับที่ 2 <span className="font-normal ml-2">(สำหรับผู้ถูกหักภาษี ณ ที่จ่าย เก็บไว้เป็นหลักฐาน)</span></div>
      </div>

      {/* Main Border Container */}
      <div className="border-[1.5px] border-black">
        
        {/* Header */}
        <div className="flex justify-between p-2 border-b-[1.5px] border-black relative">
          <div className="w-1/4"></div>
          <div className="w-2/4 text-center">
            <h1 className="text-xl font-bold mb-1">หนังสือรับรองการหักภาษี ณ ที่จ่าย</h1>
            <div className="text-sm">ตามมาตรา 50 ทวิแห่งประมวลรัษฎากร</div>
          </div>
          <div className="w-1/4 text-right pr-2">
            <div className="flex justify-end gap-2 mb-1">
              <span>เล่มที่</span>
              <span className="border-b border-dotted border-black w-24 text-center leading-none"></span>
            </div>
            <div className="flex justify-end gap-2">
              <span>เลขที่</span>
              <span className="border-b border-dotted border-black w-24 text-center leading-none">{data.doc_no || ''}</span>
            </div>
          </div>
        </div>

        {/* Payer */}
        <div className="p-2 border-b-[1.5px] border-black pb-3">
          <div className="flex justify-between mb-1">
            <div className="font-bold">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย : -</div>
            <div className="flex items-center gap-2">
              <span className="font-bold">เลขประจำตัวผู้เสียภาษีอากร (13หลัก)*</span>
              <TaxIdBoxes taxId={data.wht_payer_taxid || data.company_taxid || '1234567890123'} />
            </div>
          </div>
          
          <div className="flex items-end gap-2 mb-1">
            <span className="font-bold w-6">ชื่อ</span>
            <span className="border-b border-dotted border-black flex-1 leading-tight pb-0.5">{data.wht_payer_name || data.company_name || ''}</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[10px]">เลขประจำตัวผู้เสียภาษีอากร</span>
              <div className="flex gap-1">
                {[...Array(10)].map((_, i) => <div key={i} className="w-4 h-5 border border-black"></div>)}
              </div>
            </div>
          </div>
          <div className="text-[9px] text-gray-600 mb-1 ml-8">(ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท สมาคม หรือคณะบุคคล)</div>
          
          <div className="flex items-end gap-2">
            <span className="font-bold w-8">ที่อยู่</span>
            <span className="border-b border-dotted border-black flex-1 leading-tight pb-0.5">{data.wht_payer_address || data.company_address || ''}</span>
          </div>
          <div className="text-[9px] text-gray-600 ml-10">(ให้ระบุ ชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ตรอก/ซอย หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด)</div>
        </div>

        {/* Payee */}
        <div className="p-2 border-b-[1.5px] border-black pb-3">
          <div className="flex justify-between mb-1">
            <div className="font-bold">ผู้ถูกหักภาษี ณ ที่จ่าย : -</div>
            <div className="flex items-center gap-2">
              <span className="font-bold">เลขประจำตัวผู้เสียภาษีอากร (13หลัก)*</span>
              <TaxIdBoxes taxId={data.wht_payee_taxid || ''} />
            </div>
          </div>
          
          <div className="flex items-end gap-2 mb-1">
            <span className="font-bold w-6">ชื่อ</span>
            <span className="border-b border-dotted border-black flex-1 leading-tight pb-0.5">{data.wht_payee_name || ''}</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[10px]">เลขประจำตัวผู้เสียภาษีอากร</span>
              <div className="flex gap-1">
                {[...Array(10)].map((_, i) => <div key={i} className="w-4 h-5 border border-black"></div>)}
              </div>
            </div>
          </div>
          <div className="text-[9px] text-gray-600 mb-1 ml-8">(ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท สมาคม หรือคณะบุคคล)</div>
          
          <div className="flex items-end gap-2">
            <span className="font-bold w-8">ที่อยู่</span>
            <span className="border-b border-dotted border-black flex-1 leading-tight pb-0.5">{data.wht_payee_address || ''}</span>
          </div>
          <div className="text-[9px] text-gray-600 ml-10 mb-2">(ให้ระบุ ชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ตรอก/ซอย หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด)</div>
          
          <div className="flex gap-4 items-center">
            <span className="font-bold">ลำดับที่ <span className="border-b border-dotted border-black inline-block w-16"></span> ในแบบ</span>
            
            <CheckboxSquare label="(1) ภ.ง.ด.1ก" checked={data.wht_form_type === 'ภ.ง.ด.1ก'} />
            <CheckboxSquare label="(2) ภ.ง.ด.1ก พิเศษ" checked={data.wht_form_type === 'ภ.ง.ด.1ก พิเศษ'} />
            <CheckboxSquare label="(3) ภ.ง.ด.2" checked={data.wht_form_type === 'ภ.ง.ด.2'} />
            <CheckboxSquare label="(4) ภ.ง.ด.3" checked={data.wht_form_type === 'ภ.ง.ด.3'} />
          </div>
          
          <div className="flex gap-4 items-center mt-1">
            <span className="text-[9px] text-gray-600 w-[140px] leading-tight">(ให้สามารถอ้างอิงหรือสอบยันกันได้ระหว่างลำดับที่ตาม<br/>หนังสือรับรองฯ กับแบบยื่นรายการภาษีหักที่จ่าย)</span>
            
            <div className="flex gap-6">
              <CheckboxSquare label="(5) ภ.ง.ด.2ก" checked={data.wht_form_type === 'ภ.ง.ด.2ก'} />
              <CheckboxSquare label="(6) ภ.ง.ด.3ก" checked={data.wht_form_type === 'ภ.ง.ด.3ก'} />
              <CheckboxSquare label="(7) ภ.ง.ด.53" checked={data.wht_form_type === 'ภ.ง.ด.53' || !data.wht_form_type} />
            </div>
          </div>
        </div>

        {/* Income Table */}
        <table className="w-full text-[11px] border-b-[1.5px] border-black">
          <thead>
            <tr className="border-b border-black">
              <th className="py-2 px-1 border-r border-black font-bold text-center w-[55%]">ประเภทเงินได้พึงประเมินที่จ่าย</th>
              <th className="py-2 px-1 border-r border-black font-bold text-center leading-tight">วัน เดือน<br/>หรือปีภาษี ที่จ่าย</th>
              <th className="py-2 px-1 border-r border-black font-bold text-center">จำนวนเงินที่จ่าย</th>
              <th className="py-2 px-1 font-bold text-center leading-tight">ภาษีที่หัก<br/>และนำส่งไว้</th>
            </tr>
          </thead>
          <tbody>
            {/* The form has standard rows with very specific text */}
            <tr className="h-6">
              <td className="px-2 py-1 border-r border-black border-b border-dotted border-gray-300">1. เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส ฯลฯ ตามมาตรา 40 (1)</td>
              <td className="px-1 py-1 border-r border-black border-b border-dotted border-gray-300 text-center"></td>
              <td className="px-2 py-1 border-r border-black border-b border-dotted border-gray-300 text-right"></td>
              <td className="px-2 py-1 border-b border-dotted border-gray-300 text-right"></td>
            </tr>
            <tr className="h-6">
              <td className="px-2 py-1 border-r border-black border-b border-dotted border-gray-300">2. ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40 (2)</td>
              <td className="px-1 py-1 border-r border-black border-b border-dotted border-gray-300 text-center"></td>
              <td className="px-2 py-1 border-r border-black border-b border-dotted border-gray-300 text-right"></td>
              <td className="px-2 py-1 border-b border-dotted border-gray-300 text-right"></td>
            </tr>
            <tr className="h-6">
              <td className="px-2 py-1 border-r border-black border-b border-dotted border-gray-300">3. ค่าแห่งลิขสิทธิ์ ฯลฯ ตามมาตรา 40 (3)</td>
              <td className="px-1 py-1 border-r border-black border-b border-dotted border-gray-300 text-center"></td>
              <td className="px-2 py-1 border-r border-black border-b border-dotted border-gray-300 text-right"></td>
              <td className="px-2 py-1 border-b border-dotted border-gray-300 text-right"></td>
            </tr>
            <tr className="h-6">
              <td className="px-2 py-1 border-r border-black font-bold">4. (ก) ดอกเบี้ย ฯลฯ ตามมาตรา 40 (4)(ก)</td>
              <td className="px-1 py-1 border-r border-black text-center"></td>
              <td className="px-2 py-1 border-r border-black text-right"></td>
              <td className="px-2 py-1 text-right"></td>
            </tr>
            <tr>
              <td className="px-2 py-0 border-r border-black leading-tight pl-6 font-bold">(ข) เงินปันผล เงินส่วนแบ่งกำไร ฯลฯ ตามมาตรา 40 (4)(ข)</td>
              <td className="px-1 py-0 border-r border-black"></td>
              <td className="px-2 py-0 border-r border-black"></td>
              <td className="px-2 py-0"></td>
            </tr>
            <tr>
              <td className="px-2 py-0 border-r border-black leading-tight pl-8">(1) กรณีผู้ได้รับเงินปันผลได้รับเครดิตภาษี โดยจ่ายจากกำไรสุทธิของ<br/>กิจการที่ได้ต้องเสียภาษีเงินได้นิติบุคคลในอัตรา ดังนี้</td>
              <td className="px-1 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-b border-dotted border-gray-300"></td>
            </tr>
            <tr>
              <td className="px-2 py-0 border-r border-black leading-tight pl-12">(1.1) อัตราร้อยละ 30 ของกำไรสุทธิ</td>
              <td className="px-1 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-b border-dotted border-gray-300"></td>
            </tr>
            <tr>
              <td className="px-2 py-0 border-r border-black leading-tight pl-12">(1.2) อัตราร้อยละ 25 ของกำไรสุทธิ</td>
              <td className="px-1 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-b border-dotted border-gray-300"></td>
            </tr>
            <tr>
              <td className="px-2 py-0 border-r border-black leading-tight pl-12">(1.3) อัตราร้อยละ 20 ของกำไรสุทธิ</td>
              <td className="px-1 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-b border-dotted border-gray-300"></td>
            </tr>
            <tr>
              <td className="px-2 py-0 border-r border-black leading-tight pl-12">(1.4) อัตราอื่นๆ (ระบุ) .......................ของกำไรสุทธิ</td>
              <td className="px-1 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-b border-dotted border-gray-300"></td>
            </tr>
            <tr>
              <td className="px-2 py-0 border-r border-black leading-tight pl-8">(2) กรณีผู้ได้รับเงินปันผลไม่ได้รับเครดิตภาษีเนื่องจากจ่ายจาก</td>
              <td className="px-1 py-0 border-r border-black"></td>
              <td className="px-2 py-0 border-r border-black"></td>
              <td className="px-2 py-0"></td>
            </tr>
            <tr>
              <td className="px-2 py-0 border-r border-black leading-tight pl-12">(2.1) กำไรสุทธิของกิจการที่ได้รับยกเว้นภาษีเงินได้นิติบุคคล</td>
              <td className="px-1 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-b border-dotted border-gray-300"></td>
            </tr>
            <tr>
              <td className="px-2 py-0 border-r border-black leading-tight pl-12">(2.2) เงินปันผลหรือส่วนแบ่งของกำไรที่ได้รับยกเว้นไม่ต้องนำมารวม<br/><span className="pl-6">คำนวณเป็นรายได้เพื่อเสียภาษีเงินได้นิติบุคคล</span></td>
              <td className="px-1 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-b border-dotted border-gray-300"></td>
            </tr>
            <tr>
              <td className="px-2 py-0 border-r border-black leading-tight pl-12">(2.3) กำไรสุทธิที่ได้หักผลขาดทุนสุทธิยกมาไม่เกิน 5 ปีก่อนรอบระยะ<br/><span className="pl-6">เวลาบัญชีปีปัจจุบัน</span></td>
              <td className="px-1 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-b border-dotted border-gray-300"></td>
            </tr>
            <tr>
              <td className="px-2 py-0 border-r border-black leading-tight pl-12">(2.4) กำไรที่รับรู้ทางบัญชีโดยวิธีส่วนได้เสีย (equity method)</td>
              <td className="px-1 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-r border-black border-b border-dotted border-gray-300"></td>
              <td className="px-2 py-0 border-b border-dotted border-gray-300"></td>
            </tr>
            <tr>
              <td className="px-2 py-0 border-r border-black leading-tight pl-12 pb-1 border-b border-gray-400">(2.5) อื่นๆ (ระบุ) .......................................................................</td>
              <td className="px-1 py-0 border-r border-black border-b border-gray-400"></td>
              <td className="px-2 py-0 border-r border-black border-b border-gray-400"></td>
              <td className="px-2 py-0 border-b border-gray-400"></td>
            </tr>
            
            {/* Row 5 */}
            <tr>
              <td className="px-2 pt-1 border-r border-black leading-tight border-b border-dotted border-gray-300">5. การจ่ายเงินได้ที่ต้องหักภาษี ณ ที่จ่ายตามคำสั่งกรมสรรพากรที่ออกตาม<br/>มาตรา 3 เตรส เช่น รางวัล ส่วนลดหรือประโยชน์ใดๆ เนื่องจากการส่งเสริมการ<br/>ขาย รางวัลในการประกวด การแข่งขัน การชิงโชค ค่าแสดงของนักแสดงสาธารณะ<br/>ค่าจ้างทำของ ค่าโฆษณา ค่าเช่า ค่าขนส่ง ค่าบริการ ค่าเบี้ยประกันวินาศภัย ฯลฯ</td>
              <td className="px-1 py-1 border-r border-black border-b border-dotted border-gray-300 text-center align-bottom"></td>
              <td className="px-2 py-1 border-r border-black border-b border-dotted border-gray-300 text-right align-bottom"></td>
              <td className="px-2 py-1 border-b border-dotted border-gray-300 text-right align-bottom"></td>
            </tr>
            
            {/* Row 6 - We will inject the dynamic whtItems here if they don't explicitly match the top rows */}
            <tr className="h-6">
              <td className="px-2 py-1 border-r border-black border-b border-black">
                <div className="flex">
                  <span className="whitespace-nowrap">6. อื่นๆ (ระบุ)</span>
                  <span className="border-b border-dotted border-black flex-1 ml-1 text-[10px] pl-1 leading-tight text-blue-900 overflow-hidden text-ellipsis whitespace-nowrap">
                    {whtItems.map((i:any) => i.name).join(', ')}
                  </span>
                </div>
              </td>
              <td className="px-1 py-1 border-r border-black border-b border-black text-center text-blue-900">
                {whtItems.length > 0 ? (whtItems[0].date || data.doc_date) : ''}
              </td>
              <td className="px-2 py-1 border-r border-black border-b border-black text-right text-blue-900">
                {totalAmount > 0 ? totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
              </td>
              <td className="px-2 py-1 border-b border-black text-right text-blue-900">
                {totalTax > 0 ? totalTax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
              </td>
            </tr>

            {/* Total Row */}
            <tr className="bg-gray-50 h-8 border-t-[1.5px] border-black">
              <td className="px-2 py-1 border-r border-black font-bold text-right" colSpan={2}>
                รวมเงินที่จ่ายและภาษีที่หักนำส่ง
              </td>
              <td className="px-2 py-1 border-r border-black text-right font-bold text-blue-900 border-l-[1.5px] border-black">
                {totalAmount > 0 ? totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
              </td>
              <td className="px-2 py-1 text-right font-bold text-blue-900">
                {totalTax > 0 ? totalTax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount in words */}
        <div className="p-2 border-b-[1.5px] border-black flex gap-2 items-center">
          <span className="font-bold whitespace-nowrap">รวมเงินภาษีที่หักนำส่ง (ตัวอักษร)</span>
          <span className="text-blue-900 font-bold ml-2">
            ({totalTax > 0 ? arabicToThaiText(totalTax) : 'ศูนย์บาทถ้วน'})
          </span>
        </div>

        {/* Deductions row */}
        <div className="p-2 border-b-[1.5px] border-black flex items-center text-[10px]">
          <span className="font-bold whitespace-nowrap mr-2">เงินที่จ่ายเข้า</span>
          <span>กบข./กสจ./กองทุนสงเคราะห์ครูโรงเรียนเอกชน...........................................บาท</span>
          <span className="ml-4">กองทุนประกันสังคม................................................บาท</span>
          <span className="ml-4">กองทุนสำรองเลี้ยงชีพ.........................................บาท</span>
        </div>

        {/* Payer condition */}
        <div className="p-2 border-b-[1.5px] border-black flex items-center gap-6">
          <span className="font-bold whitespace-nowrap">ผู้ที่จ่ายเงิน</span>
          <CheckboxSquare label="(1) หัก ณ ที่จ่าย" checked={true} />
          <CheckboxSquare label="(2) ออกให้ตลอดไป" />
          <CheckboxSquare label="(3) ออกให้ครั้งเดียว" />
          <CheckboxSquare label="(4) อื่นๆ (ระบุ) ......................................................................." />
        </div>

        {/* Footer Notice & Signature */}
        <div className="flex h-36">
          <div className="w-[30%] p-2 border-r-[1.5px] border-black text-[10px] leading-tight">
            <span className="font-bold mr-1">คำเตือน</span>
            <span className="font-bold">ผู้มีหน้าที่ออกหนังสือรับรองการ<br/>หักภาษี ณ ที่จ่าย ฝ่าฝืนไม่ปฏิบัติ<br/>ตามมาตรา 50 ทวิ แห่งประมวล<br/>รัษฎากร ต้องรับโทษทางอาญา<br/>ตามมาตรา 35 แห่งประมวล<br/>รัษฎากร</span>
          </div>
          <div className="w-[70%] p-2 relative">
            <div className="text-[10px] text-center mb-8">
              ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความเป็นจริงทุกประการ
            </div>
            
            <div className="flex justify-center items-end gap-2 mb-1 pl-12">
              <span>ลงชื่อ</span>
              <span className="border-b border-dotted border-black w-48 inline-block text-center text-blue-800 text-sm italic h-6 pb-0.5">
                {data.wht_payer_name || data.company_name || ''}
              </span>
              <span>ผู้จ่ายเงิน</span>
            </div>
            
            <div className="flex justify-center items-end gap-2 text-[10px]">
              <span className="border-b border-dotted border-black w-8 text-center">{data.doc_date ? data.doc_date.split('/')[0] : '14'}</span>
              <span>/</span>
              <span className="border-b border-dotted border-black w-8 text-center">{data.doc_date ? data.doc_date.split('/')[1] : '7'}</span>
              <span>/</span>
              <span className="border-b border-dotted border-black w-12 text-center">{data.doc_date ? data.doc_date.split('/')[2] : '2020'}</span>
            </div>
            <div className="text-center text-[9px] text-gray-600 mt-1">
              (วัน เดือน ปี ที่ออกหนังสือรับรองฯ)
            </div>

            {/* Stamp Logo */}
            <div className="absolute right-6 top-8 w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center text-white transform -rotate-12 border-2 border-white shadow-sm opacity-80">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Notes */}
      <div className="mt-2 text-[9px] flex gap-2">
        <span className="font-bold whitespace-nowrap">หมายเหตุ</span>
        <div>
          เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)* หมายถึง
          <ol className="list-decimal pl-4 mt-0.5">
            <li>กรณีบุคคลธรรมดาไทย ให้ใช้เลขประจำตัวประชาชนของกรมการปกครอง</li>
            <li>กรณีนิติบุคคล ให้ใช้เลขทะเบียนนิติบุคคลของกรมพัฒนาธุรกิจการค้า</li>
            <li>กรณีอื่นๆ นอกเหนือจาก 1. และ 2. ให้ใช้เลขประจำตัวผู้เสียภาษีอากร (13 หลัก) ของกรมสรรพากร</li>
          </ol>
        </div>
      </div>

    </div>
  )
}
