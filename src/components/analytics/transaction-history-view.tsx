'use client'

import { useEffect, useMemo, useState } from 'react'
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

export function TransactionHistoryView({
  currency,
  expenses,
}: {
  currency: string
  expenses: Expense[]
}) {
  const [filters, setFilters] = useState<TransactionHistoryFilters>(
    getDefaultTransactionHistoryFilters,
  )
  const [hasLoadedFilters, setHasLoadedFilters] = useState(false)

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

  function updateFilters(patch: Partial<TransactionHistoryFilters>) {
    setFilters((current) => ({ ...current, ...patch }))
  }

  return (
    <section>
      <Card className="analytics-card rounded-[2rem] text-white shadow-[0_18px_52px_rgba(10,8,18,0.16)]">
        <CardHeader className="gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-white">
              <HistoryIcon className="size-4" />
              Transaction history
            </CardTitle>
            <CardDescription className="text-white/72">
              Browse the actual synced transactions with independent local filters that persist in
              this browser.
            </CardDescription>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <HistoryField label="Search">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-white/38" />
                <Input
                  value={filters.query}
                  onChange={(event) => updateFilters({ query: event.target.value })}
                  className="border-white/12 bg-white/8 pl-8 text-white placeholder:text-white/36"
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
          <div className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-white/10 bg-white/7 px-4 py-3 text-sm text-white/68">
            <span>
              Showing <span className="font-medium text-white">{filteredExpenses.length}</span> of{' '}
              {expenses.length} transactions
            </span>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-white/76 transition-colors hover:bg-white/12"
              onClick={() => setFilters(getDefaultTransactionHistoryFilters())}
            >
              Reset filters
            </button>
          </div>

          <div className="space-y-3">
            {filteredExpenses.length ? (
              filteredExpenses.map((expense) => {
                const paymentMethod = resolvePaymentMethodType(expense.paymentMethod?.type)

                return (
                  <article
                    key={expense.id}
                    className="rounded-[1.3rem] border border-white/10 bg-white/7 px-4 py-4 transition-colors hover:bg-white/9"
                  >
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
                          <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-xs text-white/66">
                            {paymentMethod}
                          </span>
                          <span className="text-xs text-white/46">
                            {formatDate(expense.date, 'MMM d, yyyy • h:mm a')}
                          </span>
                        </div>

                        <div className="text-sm leading-6 text-white/74">
                          {expense.note.trim() || 'No note provided'}
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-white/46">
                          <span>ID: {expense.id}</span>
                          {expense.paymentMethod?.identifier ? (
                            <span>Method ID: {expense.paymentMethod.identifier}</span>
                          ) : null}
                          {expense.paymentMethod?.instrumentId ? (
                            <span>Instrument: {expense.paymentMethod.instrumentId}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-semibold text-white">
                          {formatCurrencyValue(Math.abs(expense.amount), currency, {
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className="mt-1 text-xs text-white/48">
                          Updated {formatDate(expense.updatedAt, 'MMM d')}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="rounded-[1.3rem] border border-white/10 bg-white/7 px-4 py-6 text-sm text-white/64">
                No transactions match the current history filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function HistoryField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5">
      <div className="text-xs uppercase tracking-[0.16em] text-white/50">{label}</div>
      {children}
    </label>
  )
}

function HistorySelect(props: React.ComponentProps<'select'>) {
  return (
    <select
      {...props}
      className={cn(
        'h-8 w-full rounded-lg border border-white/12 bg-white/8 px-2.5 text-sm text-white outline-none transition-colors focus:border-white/24',
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
