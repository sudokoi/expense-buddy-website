import { format, parseISO } from 'date-fns'

export function getLocalDayKey(isoDate: string): string {
  return format(parseISO(isoDate), 'yyyy-MM-dd')
}

export function formatDate(date: Date | string, pattern: string): string {
  const value = typeof date === 'string' ? parseISO(date) : date
  return format(value, pattern)
}
