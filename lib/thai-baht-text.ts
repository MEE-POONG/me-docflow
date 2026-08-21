/**
 * Converts a number into Thai Baht text representation
 */
export function arabicToThaiText(amount: number): string {
  if (amount === 0) return 'ศูนย์บาทถ้วน'

  // Ensure it's a number and format to 2 decimal places string
  const numberString = Number(amount).toFixed(2)
  const parts = numberString.split('.')
  let baht = parts[0]
  let satang = parts[1]

  const thaiNumerals = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
  const unitPositions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']

  const convertGroup = (numStr: string) => {
    let result = ''
    const length = numStr.length

    for (let i = 0; i < length; i++) {
      const digit = parseInt(numStr[i], 10)
      const position = length - i - 1

      if (digit !== 0) {
        if (position === 0 && digit === 1 && length > 1 && numStr[i - 1] !== '0') {
          result += 'เอ็ด'
        } else if (position === 1 && digit === 1) {
          result += 'สิบ'
        } else if (position === 1 && digit === 2) {
          result += 'ยี่สิบ'
        } else {
          // Adjust for million positions and above
          const posName = position > 5 ? unitPositions[position % 6] + (position % 6 === 0 ? 'ล้าน' : '') : unitPositions[position]
          // If it's a million boundary e.g. 1,000,000
          if (position > 5 && position % 6 === 0 && digit === 1 && numStr.length > 7) {
            result += 'เอ็ด' + posName
          } else {
             result += thaiNumerals[digit] + (position === 1 ? '' : posName)
          }
        }
      } else if (position > 5 && position % 6 === 0) {
         result += 'ล้าน'
      }
    }
    return result
  }

  // Handle numbers larger than a million correctly by splitting into million chunks
  // A simple implementation for common amounts
  let bahtText = ''
  if (baht.length > 6) {
    const millions = baht.slice(0, baht.length - 6)
    const rest = baht.slice(baht.length - 6)
    bahtText = convertGroup(millions) + 'ล้าน' + convertGroup(rest)
  } else {
    bahtText = convertGroup(baht)
  }
  
  if (bahtText) bahtText += 'บาท'

  let satangText = ''
  if (satang === '00') {
    satangText = 'ถ้วน'
  } else {
    satangText = convertGroup(satang) + 'สตางค์'
  }

  return bahtText + satangText
}
