import Papa from 'papaparse'

import { resolvePaymentMethodType } from '@/features/analytics/payment-methods'
import type { Expense } from '@/types/expense'

export interface CSVRow {
  id: string
  amount: string
  currency?: string
  category: string
  date: string
  note: string
  paymentMethodType?: string
  paymentMethodId?: string
  paymentInstrumentId?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
  deleted_at?: string
  is_deleted?: string
}

const FALLBACK_CURRENCY = 'INR'

function isLegacyDeletedFlag(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

function resolveDeletedAt(row: CSVRow): string | undefined {
  const deletedAt = row.deletedAt?.trim() || row.deleted_at?.trim()
  if (deletedAt) {
    return deletedAt
  }

  return isLegacyDeletedFlag(row.is_deleted) ? row.updatedAt || row.createdAt || 'true' : undefined
}

export function importFromCSV(csvString: string): Expense[] {
  const result = Papa.parse<CSVRow>(csvString, {
    header: true,
    skipEmptyLines: true,
  })

  if (result.errors.length > 0) {
    throw new Error(`CSV parsing failed: ${result.errors[0].message}`)
  }

  const now = new Date().toISOString()

  return result.data.map((row) => {
    const paymentMethod = row.paymentMethodType?.trim()
      ? {
          type: resolvePaymentMethodType(row.paymentMethodType),
          identifier: row.paymentMethodId?.trim() || undefined,
          instrumentId: row.paymentInstrumentId?.trim() || undefined,
        }
      : undefined

    return {
      id: row.id,
      amount: Number.parseFloat(row.amount),
      currency: row.currency?.trim() || FALLBACK_CURRENCY,
      category: row.category,
      date: row.date,
      note: row.note || '',
      paymentMethod,
      createdAt: row.createdAt || now,
      updatedAt: row.updatedAt || now,
      deletedAt: resolveDeletedAt(row),
    }
  })
}
