import type { Category } from '@/types/category'

export interface PaymentInstrument {
  id: string
  method?: string
  nickname?: string
  lastDigits?: string
  createdAt?: string
  updatedAt?: string
}

export interface SyncedSettings {
  defaultCurrency?: string
  categories?: Category[]
  paymentInstruments?: PaymentInstrument[]
  updatedAt?: string
  version?: number
}
