import type { Expense } from '@/types/expense'

export function getCurrencySymbol(currencyCode: string): string {
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).formatToParts(0)

    return parts.find((part) => part.type === 'currency')?.value ?? currencyCode
  } catch {
    return currencyCode
  }
}

export function groupExpensesByCurrency(
  expenses: Expense[],
  defaultCurrency: string = 'INR',
): Map<string, Expense[]> {
  const groups = new Map<string, Expense[]>()

  for (const expense of expenses) {
    const currency = expense.currency || defaultCurrency
    const existing = groups.get(currency)
    if (existing) {
      existing.push(expense)
      continue
    }

    groups.set(currency, [expense])
  }

  return groups
}
