import { eachDayOfInterval, format } from 'date-fns'

import { getCategoryColor } from '@/constants/category-colors'
import { PAYMENT_METHOD_COLORS } from '@/constants/payment-method-colors'
import { getCurrencySymbol } from '@/features/analytics/currency'
import { getLocalDayKey } from '@/features/analytics/date'
import type { DateRange } from '@/types/analytics'
import type { Expense, PaymentMethodType } from '@/types/expense'

export type CategoryColorMap = Record<string, string>

export interface PieChartDataItem {
  value: number
  color: string
  text: string
  percentage: number
  category: string
}

export interface PaymentMethodChartDataItem {
  value: number
  color: string
  text: string
  percentage: number
  paymentMethodType: PaymentMethodType | 'Other'
}

export interface LineChartDataItem {
  value: number
  date: string
  label: string
  dataPointText?: string
}

export interface PaymentMethodTrendSeries {
  value: number
  color: string
  text: string
  paymentMethodType: PaymentMethodType | 'Other'
  points: LineChartDataItem[]
}

export function aggregateByCategory(
  expenses: Expense[],
  categoryColors?: CategoryColorMap,
): PieChartDataItem[] {
  const categoryTotals = new Map<string, number>()

  for (const expense of expenses) {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) ?? 0) + Math.abs(expense.amount),
    )
  }

  const total = Array.from(categoryTotals.values()).reduce((sum, value) => sum + value, 0)
  if (total === 0) return []

  return Array.from(categoryTotals.entries())
    .filter(([, amount]) => amount > 0)
    .map(([category, amount]) => ({
      value: amount,
      color: categoryColors?.[category] ?? getCategoryColor(category),
      text: category,
      percentage: (amount / total) * 100,
      category,
    }))
    .sort((a, b) => b.value - a.value)
}

export function aggregateByPaymentMethod(expenses: Expense[]): PaymentMethodChartDataItem[] {
  const totals = new Map<PaymentMethodType | 'Other', number>()

  for (const expense of expenses) {
    const method = expense.paymentMethod?.type ?? 'Other'
    totals.set(method, (totals.get(method) ?? 0) + Math.abs(expense.amount))
  }

  const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0)
  if (total === 0) return []

  return Array.from(totals.entries())
    .filter(([, amount]) => amount > 0)
    .map(([paymentMethodType, amount]) => ({
      value: amount,
      color: PAYMENT_METHOD_COLORS[paymentMethodType],
      text: paymentMethodType,
      percentage: (amount / total) * 100,
      paymentMethodType,
    }))
    .sort((a, b) => b.value - a.value)
}

export function aggregateByDay(
  expenses: Expense[],
  dateRange: DateRange,
  currencyCode: string = 'INR',
  timeZone?: string,
): LineChartDataItem[] {
  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
  const symbol = getCurrencySymbol(currencyCode)
  const totals = new Map<string, number>()

  for (const expense of expenses) {
    const dayKey = getLocalDayKey(expense.date, timeZone)
    totals.set(dayKey, (totals.get(dayKey) ?? 0) + Math.abs(expense.amount))
  }

  return days.map((day) => {
    const dayKey = format(day, 'yyyy-MM-dd')
    const value = totals.get(dayKey) ?? 0

    return {
      value,
      date: dayKey,
      label: format(day, 'MMM d'),
      dataPointText: value > 0 ? `${symbol}${value.toFixed(0)}` : undefined,
    }
  })
}

export function aggregatePaymentMethodTrendSeries(
  expenses: Expense[],
  dateRange: DateRange,
  currencyCode: string = 'INR',
  timeZone?: string,
): PaymentMethodTrendSeries[] {
  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
  const symbol = getCurrencySymbol(currencyCode)
  const totalsByMethod = new Map<PaymentMethodType | 'Other', Map<string, number>>()

  for (const expense of expenses) {
    const method = expense.paymentMethod?.type ?? 'Other'
    const totals = totalsByMethod.get(method) ?? new Map<string, number>()
    const dayKey = getLocalDayKey(expense.date, timeZone)
    totals.set(dayKey, (totals.get(dayKey) ?? 0) + Math.abs(expense.amount))
    totalsByMethod.set(method, totals)
  }

  return Array.from(totalsByMethod.entries())
    .map(([paymentMethodType, totals]) => {
      const points = days.map((day) => {
        const dayKey = format(day, 'yyyy-MM-dd')
        const value = totals.get(dayKey) ?? 0

        return {
          value,
          date: dayKey,
          label: format(day, 'MMM d'),
          dataPointText: value > 0 ? `${symbol}${value.toFixed(0)}` : undefined,
        }
      })

      return {
        value: points.reduce((sum, point) => sum + point.value, 0),
        color: PAYMENT_METHOD_COLORS[paymentMethodType],
        text: paymentMethodType,
        paymentMethodType,
        points,
      }
    })
    .filter((series) => series.value > 0)
    .sort((a, b) => b.value - a.value)
}
