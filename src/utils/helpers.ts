// =====================================================================
//  Helper / Utility Functions
// =====================================================================

/**
 * Returns today's date as an ISO string (YYYY-MM-DD).
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Returns a future date offset by `days` from now as YYYY-MM-DD.
 */
export function getFutureDate(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().split('T')[0]
}

/**
 * Formats a YYYY-MM-DD date string into a long Thai locale date string.
 * e.g. "2025-07-09" → "9 กรกฎาคม 2568"
 */
export function formatThaiDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Returns only the first word (first name) from a full name string.
 * e.g. "อชิรญาณ์ รมยศิริไทย" → "อชิรญาณ์"
 */
export function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName
}
