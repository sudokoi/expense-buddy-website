'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { HistoryIcon, SearchIcon } from 'lucide-react'

import { formatCurrencyValue } from '@/components/analytics/analytics-charts'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCategoryColor } from '@/constants/category-colors'
import { formatDate } from '@/features/analytics/date'
import {
  getDefaultTransactionHistoryFilters,
  loadTransactionHistoryFilters,
  persistTransactionHistoryFilters,
} from '@/features/analytics/history-storage'
import type {
  HistorySortOrder,
  TransactionHistoryFilters,
} from '@/features/analytics/history-storage'
import { resolvePaymentMethodType } from '@/features/analytics/payment-methods'
import { cn } from '@/lib/utils'
import type { Expense } from '@/types/expense'
import type { SyncedSettings } from '@/types/settings'

const HISTORY_ROW_ESTIMATE = 160
const HISTORY_VIEWPORT_HEIGHT = 640

export function TransactionHistoryView({
  currency,
  expenses,
  settings,
}: {
  currency: string
  expenses: Expense[]
  settings: SyncedSettings | null
}) {
  const [filters, setFilters] = useState<TransactionHistoryFilters>(
    getDefaultTransactionHistoryFilters,
  )
  const [hasLoadedFilters, setHasLoadedFilters] = useState(false)
  const parentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setFilters(loadTransactionHistoryFilters())
    setHasLoadedFilters(true)
  }, [])

  useEffect(() => {
    if (!hasLoadedFilters) return

    persistTransactionHistoryFilters(filters)
  }, [filters, hasLoadedFilters])

  const categories = useMemo(
    () =>
      Array.from(new Set(expenses.map((expense) => expense.category))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [expenses],
  )
  const paymentMethods = useMemo(
    () =>
      Array.from(
        new Set(expenses.map((expense) => resolvePaymentMethodType(expense.paymentMethod?.type))),
      ).sort((a, b) => a.localeCompare(b)),
    [expenses],
  )
  const filteredExpenses = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase()

    return expenses
      .filter((expense) => {
        const paymentMethod = resolvePaymentMethodType(expense.paymentMethod?.type)
        const note = expense.note.trim().toLowerCase()

        if (filters.category && expense.category !== filters.category) {
          return false
        }

        if (filters.paymentMethod && paymentMethod !== filters.paymentMethod) {
          return false
        }

        if (!normalizedQuery) {
          return true
        }

        return [expense.category.toLowerCase(), paymentMethod.toLowerCase(), note]
          .filter(Boolean)
          .some((value) => value.includes(normalizedQuery))
      })
      .sort((left, right) => compareExpenses(left, right, filters.sortOrder))
  }, [expenses, filters])
  const instrumentLabels = useMemo(() => buildInstrumentLabelMap(settings), [settings])
  const rowVirtualizer = useVirtualizer({
    count: filteredExpenses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => HISTORY_ROW_ESTIMATE,
    overscan: 6,
  })

  function updateFilters(patch: Partial<TransactionHistoryFilters>) {
    setFilters((current) => ({ ...current, ...patch }))
  }

  return (
    <section>
      <Card className="analytics-card rounded-[2rem] text-foreground shadow-[0_18px_52px_rgba(74,68,88,0.1)]">
        <CardHeader className="gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <HistoryIcon className="size-4" />
              Transaction history
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Browse the actual synced transactions with independent local filters that persist in
              this browser.
            </CardDescription>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <HistoryField label="Search">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filters.query}
                  onChange={(event) => updateFilters({ query: event.target.value })}
                  className="border-border/70 bg-white/80 pl-8 text-foreground placeholder:text-muted-foreground"
                  placeholder="Search note, category, payment"
                />
              </div>
            </HistoryField>

            <HistoryField label="Category">
              <HistorySelect
                value={filters.category ?? ''}
                onChange={(event) => updateFilters({ category: event.target.value || null })}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </HistorySelect>
            </HistoryField>

            <HistoryField label="Payment">
              <HistorySelect
                value={filters.paymentMethod ?? ''}
                onChange={(event) => updateFilters({ paymentMethod: event.target.value || null })}
              >
                <option value="">All methods</option>
                {paymentMethods.map((paymentMethod) => (
                  <option key={paymentMethod} value={paymentMethod}>
                    {paymentMethod}
                  </option>
                ))}
              </HistorySelect>
            </HistoryField>

            <HistoryField label="Sort">
              <HistorySelect
                value={filters.sortOrder}
                onChange={(event) =>
                  updateFilters({ sortOrder: event.target.value as HistorySortOrder })
                }
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest amount</option>
                <option value="lowest">Lowest amount</option>
              </HistorySelect>
            </HistoryField>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-[1.2rem] border border-border/70 bg-white/70 px-4 py-3 text-sm text-muted-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing <span className="font-medium text-foreground">{filteredExpenses.length}</span>{' '}
              of {expenses.length} transactions
            </span>
            <button
              type="button"
              className="rounded-full border border-border/70 bg-white/80 px-3 py-1 text-xs text-foreground shadow-sm transition-colors hover:bg-white"
              onClick={() => setFilters(getDefaultTransactionHistoryFilters())}
            >
              Reset filters
            </button>
          </div>

          <div className="space-y-3">
            {filteredExpenses.length ? (
              <div
                ref={parentRef}
                className="overflow-y-auto rounded-[1.4rem] border border-border/70 bg-white/45 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                style={{ maxHeight: HISTORY_VIEWPORT_HEIGHT }}
              >
                <div
                  className="relative w-full"
                  style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const expense = filteredExpenses[virtualItem.index]

                    return (
                      <div
                        key={expense.id}
                        className="absolute top-0 left-0 w-full px-1 pb-3"
                        data-index={virtualItem.index}
                        ref={rowVirtualizer.measureElement}
                        style={{ transform: `translateY(${virtualItem.start}px)` }}
                      >
                        <HistoryRow
                          currency={currency}
                          expense={expense}
                          instrumentLabel={resolveInstrumentLabel(expense, instrumentLabels)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-[1.3rem] border border-border/70 bg-white/70 px-4 py-6 text-sm text-muted-foreground shadow-sm">
                No transactions match the current history filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function HistoryRow({
  currency,
  expense,
  instrumentLabel,
}: {
  currency: string
  expense: Expense
  instrumentLabel: string | null
}) {
  const paymentMethod = resolvePaymentMethodType(expense.paymentMethod?.type)

  return (
    <article className="rounded-[1.3rem] border border-border/70 bg-white/70 px-4 py-4 shadow-sm transition-colors hover:bg-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: `${getCategoryColor(expense.category)}1f`,
                color: getCategoryColor(expense.category),
              }}
            >
              {expense.category}
            </span>
            <span className="rounded-full border border-border/70 bg-white/80 px-2.5 py-1 text-xs text-muted-foreground shadow-sm">
              {paymentMethod}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(expense.date, 'MMM d, yyyy • h:mm a')}
            </span>
          </div>

          <div className="text-sm leading-6 text-foreground/80">
            {expense.note.trim() || 'No note provided'}
          </div>

          {instrumentLabel ? (
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>Instrument: {instrumentLabel}</span>
            </div>
          ) : null}
        </div>

        <div className="text-left sm:text-right">
          <div className="text-lg font-semibold text-foreground">
            {formatCurrencyValue(Math.abs(expense.amount), currency, {
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Updated {formatDate(expense.updatedAt, 'MMM d')}
          </div>
        </div>
      </div>
    </article>
  )
}

export function buildInstrumentLabelMap(settings: SyncedSettings | null) {
  const instruments = settings?.paymentInstruments ?? []

  return new Map(
    instruments
      .filter((instrument) => instrument.id)
      .map((instrument) => [instrument.id, formatInstrumentLabel(instrument)]),
  )
}

export function resolveInstrumentLabel(expense: Expense, instrumentLabels: Map<string, string>) {
  const instrumentId = expense.paymentMethod?.instrumentId

  if (!instrumentId) {
    return null
  }

  return instrumentLabels.get(instrumentId) ?? null
}

export function formatInstrumentLabel(
  instrument: NonNullable<SyncedSettings['paymentInstruments']>[number],
) {
  const segments = [instrument.nickname?.trim(), instrument.method?.trim()].filter(Boolean)
  const baseLabel = segments.join(' · ')

  if (instrument.lastDigits?.trim()) {
    return baseLabel
      ? `${baseLabel} • ${instrument.lastDigits.trim()}`
      : instrument.lastDigits.trim()
  }

  return baseLabel || instrument.id
}

function HistoryField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5">
      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      {children}
    </label>
  )
}

function HistorySelect(props: React.ComponentProps<'select'>) {
  return (
    <select
      {...props}
      className={cn(
        'h-8 w-full rounded-lg border border-border/70 bg-white/80 px-2.5 text-sm text-foreground outline-none transition-colors focus:border-ring',
        props.className,
      )}
    />
  )
}

function compareExpenses(left: Expense, right: Expense, sortOrder: HistorySortOrder) {
  switch (sortOrder) {
    case 'oldest':
      return left.date.localeCompare(right.date)
    case 'highest':
      return Math.abs(right.amount) - Math.abs(left.amount)
    case 'lowest':
      return Math.abs(left.amount) - Math.abs(right.amount)
    case 'newest':
    default:
      return right.date.localeCompare(left.date)
  }
}
