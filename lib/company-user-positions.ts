export const companyUserPositions = ['หัวหน้า', 'ผู้ช่วย', 'รองผู้ช่วย', 'พนักงาน'] as const

export function isCompanyUserPosition(value: string): boolean {
  return companyUserPositions.some(position => position === value)
}

export function validateDepartmentPositions(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.some(item => typeof item !== 'string' || !isCompanyUserPosition(item))) {
    throw new Error('กรุณาเลือกตำแหน่งในแผนกอย่างน้อย 1 ตำแหน่ง')
  }
  return [...new Set(value)]
}
