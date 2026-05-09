import type { PaymentMethodType } from '@/types/expense'

export const PAYMENT_METHOD_COLORS: Record<PaymentMethodType | 'Other', string> = {
  Cash: '#22c55e',
  'Amazon Pay': '#ff9900',
  UPI: '#8b5cf6',
  'Credit Card': '#f59e0b',
  'Debit Card': '#3b82f6',
  'Net Banking': '#06b6d4',
  Other: '#6b7280',
}
