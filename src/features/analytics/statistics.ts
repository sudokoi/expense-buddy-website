import type { Expense } from '@/types/expense'

import { getLocalDayKey } from '@/features/analytics/date'

export interface AnalyticsStatistics {
  totalSpending: number
  averageDaily: number
  highestCategory: { category: string; amount: number } | null
  highestDay: { date: string; amount: number } | null
  daysInPeriod: number
}

export function calculateStatistics(
  expenses: Expense[],
  daysInPeriod: number,
): AnalyticsStatistics {
  const totalSpending = expenses.reduce((sum, expense) => sum + Math.abs(expense.amount), 0)
  const averageDaily = daysInPeriod > 0 ? totalSpending / daysInPeriod : 0

  const categoryTotals = new Map<string, number>()
  const dailyTotals = new Map<string, number>()

  for (const expense of expenses) {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) ?? 0) + Math.abs(expense.amount),
    )

    const dayKey = getLocalDayKey(expense.date)
    dailyTotals.set(dayKey, (dailyTotals.get(dayKey) ?? 0) + Math.abs(expense.amount))
  }

  let highestCategory: AnalyticsStatistics['highestCategory'] = null
  for (const [category, amount] of categoryTotals) {
    if (!highestCategory || amount > highestCategory.amount) {
      highestCategory = { category, amount }
    }
  }

  let highestDay: AnalyticsStatistics['highestDay'] = null
  for (const [date, amount] of dailyTotals) {
    if (!highestDay || amount > highestDay.amount) {
      highestDay = { date, amount }
    }
  }

  return {
    totalSpending,
    averageDaily,
    highestCategory,
    highestDay,
    daysInPeriod,
  }
}
