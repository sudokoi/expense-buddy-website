export type ExpenseCategory = string

export type PaymentMethodType =
  | 'Cash'
  | 'Amazon Pay'
  | 'UPI'
  | 'Credit Card'
  | 'Debit Card'
  | 'Net Banking'
  | 'Other'

export interface PaymentMethod {
  type: PaymentMethodType
  identifier?: string
  instrumentId?: string
}

export interface Expense {
  id: string
  amount: number
  currency?: string
  category: ExpenseCategory
  date: string
  note: string
  paymentMethod?: PaymentMethod
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
