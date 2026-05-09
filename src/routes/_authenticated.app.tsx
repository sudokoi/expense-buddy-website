import { useEffect } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { BreakdownList } from '@/components/analytics/breakdown-list'
import { StatCard } from '@/components/analytics/stat-card'
import { TrendList } from '@/components/analytics/trend-list'
import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buildAnalyticsQueryResult } from '@/features/analytics/queries'
import { getCurrencySymbol } from '@/features/analytics/currency'
import { parseFilters } from '@/features/analytics/filters'
import { getUserTimezone } from '@/features/analytics/timezone.functions'
import { loadRepositorySnapshot } from '@/features/github/repository'
import { formatDate } from '@/features/analytics/date'
import { USER_TIMEZONE_COOKIE, getScopedCookieName, shouldUseSecureCookies } from '@/lib/cookies'

export const Route = createFileRoute('/_authenticated/app')({
  validateSearch: (search) => search,
  loader: async ({ location }) => {
    const snapshot = await loadRepositorySnapshot()
    const filters = parseFilters(location.search)
    const timeZone = await getUserTimezone()
    const analytics = buildAnalyticsQueryResult({
      expenses: snapshot.expenses,
      settings: snapshot.settings,
      filters,
      timeZone,
    })

    return {
      snapshot,
      filters,
      analytics,
      timeZone,
    }
  },
  component: AnalyticsRoute,
})

function AnalyticsRoute() {
  const { snapshot, analytics, timeZone } = Route.useLoaderData()
  const router = useRouter()
  const currency = analytics.availableCurrencies[0] || snapshot.settings?.defaultCurrency || 'INR'
  const symbol = getCurrencySymbol(currency)
  const hasExpenses = snapshot.expenses.length > 0
  const hasFilteredExpenses = analytics.filteredExpenses.length > 0

  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!browserTimeZone || browserTimeZone === timeZone) {
      return
    }

    const secure = shouldUseSecureCookies(window.location.origin) ? '; Secure' : ''
    const cookieName = getScopedCookieName(USER_TIMEZONE_COOKIE, window.location.origin)
    document.cookie = `${cookieName}=${encodeURIComponent(browserTimeZone)}; Path=/; SameSite=Lax${secure}`
    void router.invalidate()
  }, [router, timeZone])

  return (
    <AppShell className="space-y-8">
      <section className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/60 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary">Read-only GitHub analytics</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Overview dashboard</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Your web companion is reading synced CSV files from{' '}
              <span className="font-medium text-foreground">{snapshot.repo.repoFullName}</span> on{' '}
              <span className="font-medium text-foreground">{snapshot.repo.branch}</span>.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            <div>{snapshot.expenses.length} active expenses</div>
            <div>{snapshot.files.length} synced files discovered</div>
          </div>
        </div>
      </section>

      {!hasExpenses ? (
        <Card>
          <CardHeader>
            <CardTitle>No synced expenses found yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              The connected repository is readable, but no expense CSV files were discovered on the
              selected branch.
            </p>
            <p>
              Sync at least one `expenses-YYYY-MM-DD.csv` file from the Android app, then refresh
              this page.
            </p>
          </CardContent>
        </Card>
      ) : !hasFilteredExpenses ? (
        <Card>
          <CardHeader>
            <CardTitle>No expenses match the active filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              The repository contains synced expenses, but the current filters exclude all of them.
            </p>
            <p>Clear or widen the filters to see the overview analytics again.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total spending"
              value={`${symbol}${analytics.totalSpending.toFixed(2)}`}
            />
            <StatCard
              label="Average daily"
              value={`${symbol}${analytics.averageDaily.toFixed(2)}`}
            />
            <StatCard
              label="Highest category"
              value={analytics.highestCategory?.category ?? 'None yet'}
              helper={
                analytics.highestCategory
                  ? `${symbol}${analytics.highestCategory.amount.toFixed(2)}`
                  : undefined
              }
            />
            <StatCard
              label="Highest day"
              value={
                analytics.highestDay ? formatDate(analytics.highestDay.date, 'MMM d') : 'None yet'
              }
              helper={
                analytics.highestDay
                  ? `${symbol}${analytics.highestDay.amount.toFixed(2)}`
                  : undefined
              }
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr]">
            <TrendList
              title="Recent trend"
              items={analytics.lineChartData.slice(-10).map((item) => ({
                label: item.label,
                value: `${symbol}${item.value.toFixed(2)}`,
              }))}
            />
            <BreakdownList
              title="Category breakdown"
              items={analytics.categoryBreakdown.slice(0, 8).map((item) => ({
                label: item.text,
                value: `${item.percentage.toFixed(1)}%`,
                color: item.color,
              }))}
            />
            <BreakdownList
              title="Payment methods"
              items={analytics.paymentMethodBreakdown.map((item) => ({
                label: item.text,
                value: `${item.percentage.toFixed(1)}%`,
                color: item.color,
              }))}
            />
          </section>
        </>
      )}

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Preset-ready dashboard model</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This first release ships the overview preset, but the analytics domain has already been
            separated from dashboard definitions so we can add more presets and browser-local custom
            dashboards later without changing the GitHub data contract.
          </CardContent>
        </Card>
      </section>
    </AppShell>
  )
}
