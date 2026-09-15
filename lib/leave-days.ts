/** Count calendar days inclusively, using UTC so daylight-saving changes have no effect. */
export function calculateLeaveDays(startDate: string, endDate: string): number | '' {
  const parseDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN
    const timestamp = Date.parse(`${value}T00:00:00.000Z`)
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
      ? timestamp : NaN
  }
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return ''
  return (end - start) / 86_400_000 + 1
}
