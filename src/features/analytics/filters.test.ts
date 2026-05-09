import { describe, expect, it } from 'vitest'

import { parseFilters } from '@/features/analytics/filters'

describe('parseFilters', () => {
  it('parses comma-separated category and payment method filters', () => {
    expect(
      parseFilters({
        window: '3m',
        month: '2026-05',
        categories: 'Food, Transport',
        methods: 'UPI,Cash',
        currency: 'USD',
      }),
    ).toEqual({
      timeWindow: '3m',
      selectedMonth: '2026-05',
      selectedCategories: ['Food', 'Transport'],
      selectedPaymentMethods: ['UPI', 'Cash'],
      selectedCurrency: 'USD',
    })
  })

  it('preserves array search params and applies defaults', () => {
    expect(
      parseFilters({
        categories: ['Food', 'Rent'],
        methods: ['Credit Card'],
      }),
    ).toEqual({
      timeWindow: '1m',
      selectedMonth: null,
      selectedCategories: ['Food', 'Rent'],
      selectedPaymentMethods: ['Credit Card'],
      selectedCurrency: null,
    })
  })
})
