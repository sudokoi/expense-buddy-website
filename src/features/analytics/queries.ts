import { differenceInCalendarDays } from 'date-fns'

import { DEFAULT_CATEGORIES } from '@/constants/default-categories'
import {
  aggregateByCategory,
  aggregateByDay,
  aggregatePaymentMethodTrendSeries,
  aggregateByPaymentMethod,
} from '@/features/analytics/aggregations'
import { groupExpensesByCurrency } from '@/features/analytics/currency'
import { getLocalDayKey, getLocalMonthKey } from '@/features/analytics/date'
import { calculateStatistics } from '@/features/analytics/statistics'
import {
  getDateRangeForFilters,
  getDayKeysForTimeWindow,
  getMonthKeysForTimeWindow,
} from '@/features/analytics/time'
import type {
  DateRange,
  FilterState,
  LineChartDataItem,
  PaymentMethodTrendSeries,
  PaymentMethodChartDataItem,
  PieChartDataItem,
} from '@/types/analytics'
import type { Category } from '@/types/category'
import type { Expense } from '@/types/expense'
import type { SyncedSettings } from '@/types/settings'

export interface AnalyticsQueryResult {
  dateRange: DateRange
  categories: Category[]
  availableCurrencies: string[]
  selectedCurrency: string
  filteredExpenses: Expense[]
  lineChartData: LineChartDataItem[]
  categoryBreakdown: PieChartDataItem[]
  paymentMethodBreakdown: PaymentMethodChartDataItem[]
  paymentMethodTrendSeries: PaymentMethodTrendSeries[]
  totalSpending: number
  averageDaily: number
  highestCategory: { category: string; amount: number } | null
  highestDay: { date: string; amount: number } | null
}

export function buildAnalyticsQueryResult(input: {
  expenses: Expense[]
  settings: SyncedSettings | null
  filters: FilterState
  timeZone?: string | null
}): AnalyticsQueryResult {
  const { expenses, settings, filters, timeZone } = input
  const categories = settings?.categories?.length ? settings.categories : DEFAULT_CATEGORIES
  const dateRange = getDateRangeForFilters(filters.timeWindow, filters.selectedMonth, expenses)
  const groupedByCurrency = groupExpensesByCurrency(expenses, settings?.defaultCurrency || 'INR')

  const availableCurrencies = Array.from(groupedByCurrency.keys()).sort()
  const selectedCurrency =
    filters.selectedCurrency && groupedByCurrency.has(filters.selectedCurrency)
      ? filters.selectedCurrency
      : availableCurrencies[0] || settings?.defaultCurrency || 'INR'

  const sourceExpenses = groupedByCurrency.get(selectedCurrency) ?? []
  const monthKeysInWindow = getMonthKeysForTimeWindow(
    filters.timeWindow,
    sourceExpenses,
    timeZone || undefined,
  )
  const dayKeysInWindow = getDayKeysForTimeWindow(filters.timeWindow, timeZone || undefined)

  const filteredExpenses = sourceExpenses.filter((expense) => {
    const dayKey = getLocalDayKey(expense.date, timeZone || undefined)
    const monthKey = getLocalMonthKey(expense.date, timeZone || undefined)
    const inRange = filters.selectedMonth
      ? monthKey === filters.selectedMonth
      : dayKeysInWindow.has(dayKey) && monthKeysInWindow.has(monthKey)

    if (!inRange) return false

    if (
      filters.selectedCategories.length &&
      !filters.selectedCategories.includes(expense.category)
    ) {
      return false
    }

    if (
      filters.selectedPaymentMethods.length &&
      !filters.selectedPaymentMethods.includes(expense.paymentMethod?.type ?? 'Other')
    ) {
      return false
    }

    return true
  })

  const categoryColorMap = Object.fromEntries(
    categories.map((category) => [category.label, category.color]),
  )
  const daysInPeriod = Math.max(1, differenceInCalendarDays(dateRange.end, dateRange.start) + 1)
  const statistics = calculateStatistics(filteredExpenses, daysInPeriod, timeZone || undefined)

  return {
    dateRange,
    categories,
    availableCurrencies,
    selectedCurrency,
    filteredExpenses,
    lineChartData: aggregateByDay(
      filteredExpenses,
      dateRange,
      selectedCurrency,
      timeZone || undefined,
    ),
    categoryBreakdown: aggregateByCategory(filteredExpenses, categoryColorMap),
    paymentMethodBreakdown: aggregateByPaymentMethod(filteredExpenses),
    paymentMethodTrendSeries: aggregatePaymentMethodTrendSeries(
      filteredExpenses,
      dateRange,
      selectedCurrency,
      timeZone || undefined,
    ),
    totalSpending: statistics.totalSpending,
    averageDaily: statistics.averageDaily,
    highestCategory: statistics.highestCategory,
    highestDay: statistics.highestDay,
  }
}
