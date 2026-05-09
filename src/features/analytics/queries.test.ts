import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildAnalyticsQueryResult } from '@/features/analytics/queries'
import type { FilterState } from '@/types/analytics'
import type { Expense } from '@/types/expense'

const baseFilters: FilterState = {
  timeWindow: '1m',
  selectedMonth: null,
  selectedCategories: [],
  selectedPaymentMethods: [],
  selectedCurrency: null,
}

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'expense-1',
    amount: 100,
    currency: 'INR',
    category: 'Food',
    date: '2026-01-31T23:30:00.000Z',
    note: '',
    createdAt: '2026-01-31T23:30:00.000Z',
    updatedAt: '2026-01-31T23:30:00.000Z',
    ...overrides,
  }
}

describe('buildAnalyticsQueryResult', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('matches app-style local month filtering near timezone boundaries', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-15T12:00:00.000Z'))

    const result = buildAnalyticsQueryResult({
      expenses: [makeExpense()],
      settings: { defaultCurrency: 'INR' },
      filters: { ...baseFilters, selectedMonth: '2026-02' },
      timeZone: 'Asia/Kolkata',
    })

    expect(result.filteredExpenses).toHaveLength(1)
  })

  it('keeps the same expense in January for a western timezone', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-15T12:00:00.000Z'))

    const result = buildAnalyticsQueryResult({
      expenses: [makeExpense()],
      settings: { defaultCurrency: 'INR' },
      filters: { ...baseFilters, selectedMonth: '2026-01' },
      timeZone: 'America/Los_Angeles',
    })

    expect(result.filteredExpenses).toHaveLength(1)
  })

  it('groups highest-day statistics using the provided timezone', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-15T12:00:00.000Z'))

    const result = buildAnalyticsQueryResult({
      expenses: [
        makeExpense({ id: 'expense-1', amount: 100, date: '2026-01-31T23:30:00.000Z' }),
        makeExpense({ id: 'expense-2', amount: 50, date: '2026-02-01T00:15:00.000Z' }),
      ],
      settings: { defaultCurrency: 'INR' },
      filters: { ...baseFilters, selectedMonth: '2026-02' },
      timeZone: 'Asia/Kolkata',
    })

    expect(result.highestDay).toEqual({
      date: '2026-02-01',
      amount: 150,
    })
  })
})
