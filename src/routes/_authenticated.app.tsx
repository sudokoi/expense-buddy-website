import { Suspense, lazy, useEffect, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { ImmersiveShell } from '@/components/immersive-shell'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { analyticsPageQueryOptions } from '@/features/analytics/analytics-query'
import { USER_TIMEZONE_COOKIE, getScopedCookieName, shouldUseSecureCookies } from '@/lib/cookies'

const ImmersiveAnalyticsPage = lazy(() =>
  import('@/components/analytics/immersive-analytics-page').then((module) => ({
    default: module.ImmersiveAnalyticsPage,
  })),
)

export const Route = createFileRoute('/_authenticated/app')({
  validateSearch: (search) => search,
  loader: async ({ context, location }) => {
    await context.queryClient.ensureQueryData(analyticsPageQueryOptions(location.search))
  },
  component: AnalyticsRoute,
})

function AnalyticsRoute() {
  const search = Route.useSearch()
  const { data } = useSuspenseQuery(analyticsPageQueryOptions(search))
  const { snapshot, analytics, dashboardData, timeZone } = data
  const router = useRouter()
  const [isSyncingTimezone, setIsSyncingTimezone] = useState(false)
  const hasExpenses = snapshot.expenses.length > 0
  const hasFilteredExpenses = analytics.filteredExpenses.length > 0

  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!browserTimeZone || browserTimeZone === timeZone) {
      setIsSyncingTimezone(false)
      return
    }

    setIsSyncingTimezone(true)
    const secure = shouldUseSecureCookies(window.location.origin) ? '; Secure' : ''
    const cookieName = getScopedCookieName(USER_TIMEZONE_COOKIE, window.location.origin)
    document.cookie = `${cookieName}=${encodeURIComponent(browserTimeZone)}; Path=/; SameSite=Lax${secure}`
    void router.invalidate()
  }, [router, timeZone])

  if (isSyncingTimezone) {
    return (
      <ImmersiveShell surface="light" contentClassName="py-8">
        <section className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/60 p-6 shadow-sm">
          <div className="space-y-2">
            <Badge variant="secondary">Read-only GitHub analytics</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Overview dashboard</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Syncing your local timezone so the dashboard matches the Expense Buddy app.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr]">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </section>
      </ImmersiveShell>
    )
  }

  return (
    <ImmersiveShell
      surface="light"
      contentClassName="py-4 sm:py-6"
      sessionLabel={snapshot.repo.repoFullName}
      sessionInfo={{
        repoFullName: snapshot.repo.repoFullName,
        branch: snapshot.repo.branch,
        syncDirectory: snapshot.repo.syncDirectory,
      }}
    >
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
        <Suspense fallback={<Skeleton className="min-h-[70vh] w-full rounded-[2rem]" />}>
          <ImmersiveAnalyticsPage
            analytics={analytics}
            dashboardData={dashboardData}
            repoName={snapshot.repo.repoFullName}
            branchName={snapshot.repo.branch}
            totalExpenses={snapshot.expenses.length}
            settings={snapshot.settings}
            timeZone={timeZone}
          />
        </Suspense>
      )}
    </ImmersiveShell>
  )
}
