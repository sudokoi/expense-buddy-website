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
    })

    const expenseDate = new Date('2026-01-31T23:30:00.000Z')
    const localMonth = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`

    expect(localMonth).toBe('2026-02')
    expect(result.filteredExpenses).toHaveLength(1)
  })
})
