import { z } from 'zod'

import type { FilterState, TimeWindow } from '@/types/analytics'

const timeWindowSchema = z.enum(['7d', '15d', '1m', '3m', '6m', '1y', 'all'])

const filtersSchema = z.object({
  timeWindow: timeWindowSchema.default('1m'),
  selectedMonth: z.string().nullable().default(null),
  selectedCategories: z.array(z.string()).default([]),
  selectedPaymentMethods: z.array(z.string()).default([]),
  selectedCurrency: z.string().nullable().default(null),
})

export function parseFilters(search: Record<string, unknown>): FilterState {
  const selectedCategories = toStringArray(search.categories)
  const selectedPaymentMethods = toStringArray(search.methods)

  return filtersSchema.parse({
    timeWindow: typeof search.window === 'string' ? (search.window as TimeWindow) : undefined,
    selectedMonth: typeof search.month === 'string' ? search.month : null,
    selectedCategories,
    selectedPaymentMethods,
    selectedCurrency: typeof search.currency === 'string' ? search.currency : null,
  })
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  if (typeof value === 'string' && value.length > 0) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}
