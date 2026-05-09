import type { Category } from '@/types/category'

export interface SyncedSettings {
  defaultCurrency?: string
  categories?: Category[]
  updatedAt?: string
  version?: number
}
