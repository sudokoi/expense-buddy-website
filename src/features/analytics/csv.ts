import Papa from 'papaparse'

import type { Expense, PaymentMethodType } from '@/types/expense'

export interface CSVRow {
  id: string
  amount: string
  currency?: string
  category: string
  date: string
  note: string
  paymentMethodType: string
  paymentMethodId: string
  paymentInstrumentId: string
  createdAt: string
  updatedAt: string
  deletedAt: string
}

const FALLBACK_CURRENCY = 'INR'

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
    const paymentMethod = row.paymentMethodType.trim()
      ? {
          type: row.paymentMethodType as PaymentMethodType,
          identifier: row.paymentMethodId.trim() || undefined,
          instrumentId: row.paymentInstrumentId.trim() || undefined,
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
      deletedAt: row.deletedAt.trim() || undefined,
    }
  })
}
