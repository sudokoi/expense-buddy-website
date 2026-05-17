import type { PaymentMethodType } from '@/types/expense'

const PAYMENT_METHOD_TYPES = new Set<PaymentMethodType>([
  'Cash',
  'Amazon Pay',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Other',
])

export function resolvePaymentMethodType(value: string | null | undefined): PaymentMethodType {
  const normalized = value?.trim()

  if (normalized && PAYMENT_METHOD_TYPES.has(normalized as PaymentMethodType)) {
    return normalized as PaymentMethodType
  }

  return 'Other'
}
