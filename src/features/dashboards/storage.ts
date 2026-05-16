import type { StoredAnalyticsViewDefinition } from '@/features/dashboards/schema'
import { isValidAnalyticsViewDefinition } from '@/features/dashboards/schema'

const STORAGE_KEY = 'expense-buddy.analytics-views'

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function parseStoredViews(raw: string | null): StoredAnalyticsViewDefinition[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidAnalyticsViewDefinition)
  } catch {
    return []
  }
}

export const dashboardStorage = {
  async loadDashboardConfigs(): Promise<StoredAnalyticsViewDefinition[]> {
    if (!isBrowser()) return []
    return parseStoredViews(window.localStorage.getItem(STORAGE_KEY))
  },

  async saveDashboardConfigs(dashboards: StoredAnalyticsViewDefinition[]): Promise<void> {
    if (!isBrowser()) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards))
  },

  async resetDashboardConfigs(): Promise<void> {
    if (!isBrowser()) return
    window.localStorage.removeItem(STORAGE_KEY)
  },
}
