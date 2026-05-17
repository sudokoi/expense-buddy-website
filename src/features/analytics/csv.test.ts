import { describe, expect, it } from 'vitest'

import { importFromCSV } from '@/features/analytics/csv'

describe('importFromCSV', () => {
  it('handles legacy csv files without deletedAt and payment instrument columns', () => {
    const legacyCsv = `id,amount,category,date,note,paymentMethodType,paymentMethodId,createdAt,updatedAt
abc123,100,Food,2024-01-15,Lunch,Cash,,2024-01-15T12:00:00.000Z,2024-01-15T12:00:00.000Z
def456,50.5,Transport,2024-01-16,Bus fare,UPI,1234,2024-01-16T08:00:00.000Z,2024-01-16T08:00:00.000Z`

    const imported = importFromCSV(legacyCsv)

    expect(imported).toHaveLength(2)
    expect(imported[0].deletedAt).toBeUndefined()
    expect(imported[1].deletedAt).toBeUndefined()
    expect(imported[0].currency).toBe('INR')
    expect(imported[1].paymentMethod).toEqual({
      type: 'UPI',
      identifier: '1234',
      instrumentId: undefined,
    })
  })

  it('marks legacy is_deleted rows as deleted for analytics filtering', () => {
    const legacyDeletedCsv = `id,amount,currency,category,date,note,paymentMethodType,paymentMethodId,createdAt,updatedAt,is_deleted
abc123,100,INR,Food,2024-01-15,Lunch,Cash,,2024-01-15T12:00:00.000Z,2024-01-15T12:05:00.000Z,true
def456,50,INR,Transport,2024-01-16,Bus fare,UPI,1234,2024-01-16T08:00:00.000Z,2024-01-16T08:05:00.000Z,false`

    const imported = importFromCSV(legacyDeletedCsv)

    expect(imported).toHaveLength(2)
    expect(imported[0].deletedAt).toBe('2024-01-15T12:05:00.000Z')
    expect(imported[1].deletedAt).toBeUndefined()
  })

  it('prefers explicit deletedAt-style columns when present', () => {
    const csv = `id,amount,currency,category,date,note,createdAt,updatedAt,deleted_at,is_deleted
abc123,100,INR,Food,2024-01-15,Lunch,2024-01-15T12:00:00.000Z,2024-01-15T12:05:00.000Z,2024-01-15T12:06:00.000Z,true`

    const imported = importFromCSV(csv)

    expect(imported[0].deletedAt).toBe('2024-01-15T12:06:00.000Z')
  })

  it('treats whitespace-only deletedAt cells as active and timestamped ones as deleted', () => {
    const csv = `id,amount,category,date,note,paymentMethodType,paymentMethodId,paymentInstrumentId,createdAt,updatedAt,deletedAt
1766487213438,80,Food,2025-12-23T10:52:00.000Z,Pakora,,,,2025-12-23T10:53:33.438Z,2025-12-23T10:53:33.438Z,
1766487169469,75,Transport,2025-12-23T10:52:37.922Z,Uber from Orane,,,,2025-12-23T10:52:49.469Z,2025-12-23T10:52:49.469Z,2025-12-24T10:52:49.469Z
1766460499034,332,Groceries,2025-12-23T03:28:10.353Z,Instamart,,,,2025-12-23T03:28:19.034Z,2025-12-23T03:28:19.034Z, `

    const imported = importFromCSV(csv)

    expect(imported).toHaveLength(3)
    expect(imported[0].deletedAt).toBeUndefined()
    expect(imported[1].deletedAt).toBe('2025-12-24T10:52:49.469Z')
    expect(imported[2].deletedAt).toBeUndefined()
  })

  it('normalizes unknown payment methods to Other', () => {
    const csv = `id,amount,category,date,note,paymentMethodType,createdAt,updatedAt
abc123,100,Food,2024-01-15,Lunch,Cardless,2024-01-15T12:00:00.000Z,2024-01-15T12:00:00.000Z`

    const imported = importFromCSV(csv)

    expect(imported[0].paymentMethod).toEqual({
      type: 'Other',
      identifier: undefined,
      instrumentId: undefined,
    })
  })
})
