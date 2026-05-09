import {
  endOfDay,
  endOfMonth,
  format,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
  subDays,
} from 'date-fns'

import type { DateRange, TimeWindow } from '@/types/analytics'
import type { Expense } from '@/types/expense'

import { formatDate, getLocalDayKey, getLocalMonthKey } from '@/features/analytics/date'

export function getTimeWindowDays(timeWindow: TimeWindow): number {
  switch (timeWindow) {
    case '7d':
      return 7
    case '15d':
      return 15
    case '1m':
      return 30
    case '3m':
      return 90
    case '6m':
      return 180
    case '1y':
      return 365
    case 'all':
      return -1
  }
}

export function getDateRangeForTimeWindow(timeWindow: TimeWindow, expenses?: Expense[]): DateRange {
  const end = endOfDay(new Date())

  if (timeWindow === 'all' && expenses?.length) {
    let earliestDate = new Date()

    for (const expense of expenses) {
      const expenseDate = new Date(expense.date)
      if (expenseDate < earliestDate) {
        earliestDate = expenseDate
      }
    }

    return { start: startOfDay(earliestDate), end }
  }

  const days = getTimeWindowDays(timeWindow)
  return { start: startOfDay(subDays(end, days - 1)), end }
}

export function getMonthStartDate(monthKey: string): Date {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) {
    return startOfMonth(new Date(0))
  }

  const parsed = parse(monthKey, 'yyyy-MM', new Date(0))
  if (!isValid(parsed) || format(parsed, 'yyyy-MM') !== monthKey) {
    return startOfMonth(new Date(0))
  }

  return startOfMonth(parsed)
}

export function getDateRangeForMonth(monthKey: string): DateRange {
  const start = getMonthStartDate(monthKey)
  return { start, end: endOfMonth(start) }
}

export function getDateRangeForFilters(
  timeWindow: TimeWindow,
  selectedMonth: string | null,
  expenses?: Expense[],
): DateRange {
  if (selectedMonth) {
    return getDateRangeForMonth(selectedMonth)
  }

  return getDateRangeForTimeWindow(timeWindow, expenses)
}

export function getMonthKeysForTimeWindow(
  timeWindow: TimeWindow,
  expenses: Expense[],
  timeZone?: string,
): Set<string> {
  if (timeWindow === 'all') {
    return new Set(expenses.map((expense) => getLocalMonthKey(expense.date, timeZone)))
  }

  const { start, end } = getDateRangeForTimeWindow(timeWindow)
  const monthKeys = new Set<string>()
  const cursor = new Date(start)

  while (cursor <= end) {
    monthKeys.add(getLocalMonthKey(cursor, timeZone))
    cursor.setDate(cursor.getDate() + 1)
  }

  return monthKeys
}

export function getDayKeysForTimeWindow(timeWindow: TimeWindow, timeZone?: string): Set<string> {
  if (timeWindow === 'all') {
    return new Set()
  }

  const { start, end } = getDateRangeForTimeWindow(timeWindow)
  const dayKeys = new Set<string>()
  const cursor = new Date(start)

  while (cursor <= end) {
    dayKeys.add(getLocalDayKey(cursor, timeZone))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dayKeys
}

export function getAvailableMonths(expenses: Expense[], timeZone?: string): string[] {
  const months = new Set<string>()

  for (const expense of expenses) {
    months.add(getLocalMonthKey(expense.date, timeZone))
  }

  return Array.from(months).sort((a, b) => b.localeCompare(a))
}

export function formatMonthLabel(monthKey: string): string {
  return formatDate(getMonthStartDate(monthKey), 'MMM yyyy')
}
