import { describe, expect, it } from 'vitest'

import {
  buildInstrumentLabelMap,
  formatInstrumentLabel,
  resolveInstrumentLabel,
} from '@/components/analytics/transaction-history-view'
import type { Expense } from '@/types/expense'
import type { SyncedSettings } from '@/types/settings'

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'expense-1',
    amount: 461,
    currency: 'INR',
    category: 'Entertainment',
    date: '2026-04-19T13:49:00.000Z',
    note: 'Ticket Ayush',
    paymentMethod: {
      type: 'Credit Card',
      identifier: '7004',
      instrumentId: '1768137815512_68c60b8dce230c',
    },
    createdAt: '2026-04-19T13:49:00.000Z',
    updatedAt: '2026-04-19T13:49:00.000Z',
    ...overrides,
  }
}

function makeSettings(overrides: Partial<SyncedSettings> = {}): SyncedSettings {
  return {
    defaultCurrency: 'INR',
    paymentInstruments: [
      {
        id: '1768137815512_68c60b8dce230c',
        method: 'Credit Card',
        nickname: 'MMT',
        lastDigits: '7004',
      },
    ],
    ...overrides,
  }
}

describe('transaction history instrument labels', () => {
  it('formats readable instrument labels from synced settings metadata', () => {
    expect(
      formatInstrumentLabel({
        id: '1768137815512_68c60b8dce230c',
        method: 'Credit Card',
        nickname: 'MMT',
        lastDigits: '7004',
      }),
    ).toBe('MMT · Credit Card • 7004')
  })

  it('resolves an expense instrument id to a readable label', () => {
    const instrumentLabels = buildInstrumentLabelMap(makeSettings())

    expect(resolveInstrumentLabel(makeExpense(), instrumentLabels)).toBe('MMT · Credit Card • 7004')
  })

  it('returns null when an instrument id is not present in synced settings', () => {
    const instrumentLabels = buildInstrumentLabelMap(makeSettings({ paymentInstruments: [] }))

    expect(
      resolveInstrumentLabel(
        makeExpense({ paymentMethod: { type: 'Credit Card', instrumentId: 'missing' } }),
        instrumentLabels,
      ),
    ).toBeNull()
  })
})
