import { format, parseISO } from 'date-fns'

function getFormatter(timeZone: string | undefined, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    ...options,
  })
}

function getDateValue(value: Date | string): Date {
  return typeof value === 'string' ? parseISO(value) : value
}

export function getZonedDatePart(
  value: Date | string,
  timeZone: string | undefined,
  part: 'year' | 'month' | 'day',
): string {
  const formatter = getFormatter(timeZone, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(getDateValue(value))
  return parts.find((entry) => entry.type === part)?.value ?? ''
}

export function getLocalDayKey(value: Date | string, timeZone?: string): string {
  if (!timeZone) {
    return format(getDateValue(value), 'yyyy-MM-dd')
  }

  const year = getZonedDatePart(value, timeZone, 'year')
  const month = getZonedDatePart(value, timeZone, 'month')
  const day = getZonedDatePart(value, timeZone, 'day')
  return `${year}-${month}-${day}`
}

export function getLocalMonthKey(value: Date | string, timeZone?: string): string {
  if (!timeZone) {
    const parsed = getDateValue(value)
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`
  }

  const year = getZonedDatePart(value, timeZone, 'year')
  const month = getZonedDatePart(value, timeZone, 'month')
  return `${year}-${month}`
}

export function formatDate(date: Date | string, pattern: string): string {
  const value = typeof date === 'string' ? parseISO(date) : date
  return format(value, pattern)
}
