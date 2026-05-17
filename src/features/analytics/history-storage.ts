export type HistorySortOrder = 'newest' | 'oldest' | 'highest' | 'lowest'

export interface TransactionHistoryFilters {
  query: string
  category: string | null
  paymentMethod: string | null
  sortOrder: HistorySortOrder
}

const STORAGE_KEY = 'expense-buddy.transaction-history-filters.v1'
const VALID_SORT_ORDERS = new Set<HistorySortOrder>(['newest', 'oldest', 'highest', 'lowest'])

export function getDefaultTransactionHistoryFilters(): TransactionHistoryFilters {
  return {
    query: '',
    category: null,
    paymentMethod: null,
    sortOrder: 'newest',
  }
}

export function loadTransactionHistoryFilters(): TransactionHistoryFilters {
  if (typeof window === 'undefined') {
    return getDefaultTransactionHistoryFilters()
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return getDefaultTransactionHistoryFilters()
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    return normalizeTransactionHistoryFilters(parsed)
  } catch {
    return getDefaultTransactionHistoryFilters()
  }
}

export function persistTransactionHistoryFilters(filters: TransactionHistoryFilters) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
}

function normalizeTransactionHistoryFilters(value: unknown): TransactionHistoryFilters {
  const fallback = getDefaultTransactionHistoryFilters()

  if (!value || typeof value !== 'object') {
    return fallback
  }

  const candidate = value as Record<string, unknown>

  return {
    query: typeof candidate.query === 'string' ? candidate.query : fallback.query,
    category:
      typeof candidate.category === 'string' && candidate.category ? candidate.category : null,
    paymentMethod:
      typeof candidate.paymentMethod === 'string' && candidate.paymentMethod
        ? candidate.paymentMethod
        : null,
    sortOrder:
      typeof candidate.sortOrder === 'string' &&
      VALID_SORT_ORDERS.has(candidate.sortOrder as HistorySortOrder)
        ? (candidate.sortOrder as HistorySortOrder)
        : fallback.sortOrder,
  }
}
