import { queryOptions } from '@tanstack/react-query'

import { buildAnalyticsDashboardData } from '@/features/analytics/dashboard-data'
import { parseFilters } from '@/features/analytics/filters'
import { buildAnalyticsQueryResult } from '@/features/analytics/queries'
import { getUserTimezone } from '@/features/analytics/timezone.functions'
import { loadRepositorySnapshot } from '@/features/github/repository'

export async function loadAnalyticsPageData(search: Record<string, unknown>) {
  const snapshot = await loadRepositorySnapshot()
  const filters = parseFilters(search)
  const timeZone = await getUserTimezone()
  const analytics = buildAnalyticsQueryResult({
    expenses: snapshot.expenses,
    settings: snapshot.settings,
    filters,
    timeZone,
  })
  const dashboardData = buildAnalyticsDashboardData(analytics)

  return {
    snapshot,
    filters,
    analytics,
    dashboardData,
    timeZone,
  }
}

export function analyticsPageQueryOptions(search: Record<string, unknown>) {
  return queryOptions({
    queryKey: ['analytics-page', search],
    queryFn: () => loadAnalyticsPageData(search),
  })
}
