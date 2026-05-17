import { describe, expect, it } from 'vitest'

import { buildAnalyticsDashboardData } from '@/features/analytics/dashboard-data'
import { buildAnalyticsQueryResult } from '@/features/analytics/queries'
import type { FilterState } from '@/types/analytics'
import type { Expense } from '@/types/expense'

const baseFilters: FilterState = {
  timeWindow: '1m',
  selectedMonth: '2026-01',
  selectedCategories: [],
  selectedPaymentMethods: [],
  selectedCurrency: 'INR',
}

function makeExpense(overrides: Partial<Expense>): Expense {
  return {
    id: 'expense-1',
    amount: 100,
    currency: 'INR',
    category: 'Food',
    date: '2026-01-10T12:00:00.000Z',
    note: '',
    createdAt: '2026-01-10T12:00:00.000Z',
    updatedAt: '2026-01-10T12:00:00.000Z',
    ...overrides,
  }
}

describe('buildAnalyticsDashboardData', () => {
  it('builds radar axes from top categories and series from payment methods', () => {
    const analytics = buildAnalyticsQueryResult({
      expenses: [
        makeExpense({
          id: 'upi-food',
          category: 'Food',
          amount: 400,
          paymentMethod: { type: 'UPI' },
        }),
        makeExpense({
          id: 'upi-rent',
          category: 'Rent',
          amount: 250,
          paymentMethod: { type: 'UPI' },
        }),
        makeExpense({
          id: 'cash-food',
          category: 'Food',
          amount: 150,
          paymentMethod: { type: 'Cash' },
        }),
        makeExpense({
          id: 'cash-health',
          category: 'Health',
          amount: 300,
          paymentMethod: { type: 'Cash' },
        }),
      ],
      settings: { defaultCurrency: 'INR' },
      filters: baseFilters,
      timeZone: 'Asia/Kolkata',
    })

    const dashboardData = buildAnalyticsDashboardData(analytics)

    expect(dashboardData.paymentCategoryRadar.axes.map((axis) => axis.label)).toEqual([
      'Food',
      'Health',
      'Rent',
    ])
    expect(dashboardData.paymentCategoryRadar.series.map((series) => series.label)).toEqual([
      'UPI',
      'Cash',
    ])
    expect(dashboardData.paymentCategoryRadar.series[0]?.dominantCategory).toBe('Food')
    expect(dashboardData.paymentCategoryRadar.series[1]?.dominantCategory).toBe('Health')
  })

  it('includes Other when payment method is missing', () => {
    const analytics = buildAnalyticsQueryResult({
      expenses: [
        makeExpense({ id: 'missing-1', category: 'Other', amount: 120, paymentMethod: undefined }),
        makeExpense({ id: 'upi-1', category: 'Food', amount: 80, paymentMethod: { type: 'UPI' } }),
      ],
      settings: { defaultCurrency: 'INR' },
      filters: baseFilters,
      timeZone: 'Asia/Kolkata',
    })

    const dashboardData = buildAnalyticsDashboardData(analytics)

    expect(dashboardData.paymentCategoryRadar.series.map((series) => series.label)).toContain(
      'Other',
    )
  })
})
