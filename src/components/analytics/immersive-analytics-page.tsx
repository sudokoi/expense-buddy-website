'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3Icon,
  CircleDollarSignIcon,
  HistoryIcon,
  MenuIcon,
  PinIcon,
  SparklesIcon,
  TrendingUpIcon,
} from 'lucide-react'

import {
  CategoryBreakdownChart,
  DailySpendChart,
  formatCurrencyValue,
  PaymentCategoryRadarChart,
  PaymentShareChart,
} from '@/components/analytics/analytics-charts'
import { CustomGraphStudio } from '@/components/analytics/custom-graph-studio'
import { TransactionHistoryView } from '@/components/analytics/transaction-history-view'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalyticsDashboardData } from '@/features/analytics/dashboard-data'
import { formatDate } from '@/features/analytics/date'
import type { AnalyticsQueryResult } from '@/features/analytics/queries'
import { cn } from '@/lib/utils'
import type { SyncedSettings } from '@/types/settings'

interface ImmersiveAnalyticsPageProps {
  analytics: AnalyticsQueryResult
  dashboardData: AnalyticsDashboardData
  repoName: string
  branchName: string
  totalExpenses: number
  settings: SyncedSettings | null
  timeZone?: string | null
}

type AnalyticsSectionId = 'overview' | 'signals' | 'custom-graphs' | 'pinned-graphs' | 'history'

const panelClassName = 'analytics-card rounded-[2rem] text-foreground'
const ANALYTICS_SECTIONS: Array<{ id: AnalyticsSectionId; label: string; icon: ReactNode }> = [
  { id: 'overview', label: 'Overview', icon: <SparklesIcon className="size-4" /> },
  { id: 'signals', label: 'Signals', icon: <BarChart3Icon className="size-4" /> },
  { id: 'custom-graphs', label: 'Custom graphs', icon: <TrendingUpIcon className="size-4" /> },
  { id: 'pinned-graphs', label: 'Pinned graphs', icon: <PinIcon className="size-4" /> },
  { id: 'history', label: 'History', icon: <HistoryIcon className="size-4" /> },
]

export function ImmersiveAnalyticsPage({
  analytics,
  dashboardData,
  repoName,
  branchName,
  totalExpenses,
  settings,
  timeZone,
}: ImmersiveAnalyticsPageProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isStickyNavVisible, setIsStickyNavVisible] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<AnalyticsSectionId>('overview')
  const stickyNavSentinelRef = useRef<HTMLDivElement | null>(null)
  const currency = analytics.selectedCurrency
  const strongestPaymentMethod = analytics.paymentMethodBreakdown.at(0)
  const strongestCategory = analytics.categoryBreakdown.at(0)
  const sectionItems = useMemo(() => ANALYTICS_SECTIONS, [])

  useEffect(() => {
    const sentinel = stickyNavSentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStickyNavVisible(!entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: '-12px 0px 0px 0px',
      },
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return
    }

    const sections = ANALYTICS_SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter((section): section is HTMLElement => section instanceof HTMLElement)

    if (!sections.length) {
      return
    }

    const visibleSections = new Map<AnalyticsSectionId, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const sectionId = entry.target.id as AnalyticsSectionId

          if (entry.isIntersecting) {
            visibleSections.set(sectionId, entry.intersectionRatio)
          } else {
            visibleSections.delete(sectionId)
          }
        }

        const sortedVisibleSections = [...visibleSections.entries()].sort((left, right) => {
          if (right[1] !== left[1]) {
            return right[1] - left[1]
          }

          return (
            ANALYTICS_SECTIONS.findIndex((section) => section.id === left[0]) -
            ANALYTICS_SECTIONS.findIndex((section) => section.id === right[0])
          )
        })

        if (!sortedVisibleSections.length) {
          return
        }

        setActiveSectionId(sortedVisibleSections[0][0])
      },
      {
        rootMargin: '-25% 0px -55% 0px',
        threshold: [0.1, 0.2, 0.35, 0.5, 0.7],
      },
    )

    for (const section of sections) {
      observer.observe(section)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div className="flex min-h-[calc(100vh-6rem)] w-full flex-col gap-6 py-6 text-foreground sm:gap-8 sm:py-8">
      <section className="sticky top-0 z-30 -mx-4 h-0 sm:-mx-6">
        <div
          className={cn(
            'analytics-sticky-overlay transition-all duration-300 ease-out',
            isStickyNavVisible
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none -translate-y-4 opacity-0',
          )}
        >
          <div className="mx-auto w-full max-w-7xl px-4 pb-4 pt-3 sm:px-6 sm:pb-5">
            <AnalyticsSectionNav
              activeSectionId={activeSectionId}
              items={sectionItems}
              variant="sticky"
              className="rounded-[1.9rem]"
            />
          </div>
        </div>
      </section>

      <section id="overview" className="scroll-mt-44 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card
          className={cn(
            panelClassName,
            'analytics-hero-panel rounded-[2.25rem] shadow-[0_24px_72px_rgba(74,68,88,0.12)]',
          )}
        >
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge
                  variant="secondary"
                  className="rounded-full border-0 bg-white/75 px-3 py-1 text-foreground shadow-sm"
                >
                  Read-only GitHub analytics
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Calm, high-signal analytics for your spending history.
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    The main radar view highlights how payment methods distribute across your
                    largest categories, sourced from{' '}
                    <span className="font-medium text-foreground">{repoName}</span> on{' '}
                    <span className="font-medium text-foreground">{branchName}</span>.
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                className="rounded-full border border-border/70 bg-white/75 text-foreground shadow-sm hover:bg-white lg:hidden"
                onClick={() => setIsMenuOpen((current) => !current)}
              >
                <MenuIcon />
                Sections
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <AnalyticsSectionNav
                activeSectionId={activeSectionId}
                className="hidden lg:block"
                items={sectionItems}
              />

              <div className="max-w-sm rounded-[1.6rem] border border-border/70 bg-white/70 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] lg:justify-self-end">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <SparklesIcon className="size-4" />
                  Current focus
                </div>
                <div className="mt-3 text-lg font-medium text-foreground">
                  {selectedPaymentMethod ?? strongestPaymentMethod?.text ?? 'All payment methods'}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Select a payment mode from the radar legend or the share card to isolate its
                  profile.
                </p>
              </div>
            </div>

            <div ref={stickyNavSentinelRef} className="h-px w-full" aria-hidden="true" />

            {isMenuOpen ? (
              <AnalyticsSectionNav
                className="lg:hidden"
                activeSectionId={activeSectionId}
                items={sectionItems}
                onNavigate={() => setIsMenuOpen(false)}
              />
            ) : null}
          </CardHeader>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard
            icon={<CircleDollarSignIcon className="size-4" />}
            label="Total spending"
            value={formatCurrencyValue(analytics.totalSpending, currency, {
              maximumFractionDigits: 2,
            })}
            detail={`${totalExpenses} synced expenses`}
          />
          <MetricCard
            icon={<TrendingUpIcon className="size-4" />}
            label="Average daily"
            value={formatCurrencyValue(analytics.averageDaily, currency, {
              maximumFractionDigits: 2,
            })}
            detail={
              analytics.highestDay
                ? `Peak on ${formatDate(analytics.highestDay.date, 'MMM d')}`
                : 'No day peaks yet'
            }
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<BarChart3Icon className="size-4" />}
          label="Leading category"
          value={strongestCategory?.text ?? 'None yet'}
          detail={
            strongestCategory
              ? formatCurrencyValue(strongestCategory.value, currency)
              : 'No category data yet'
          }
        />
        <MetricCard
          icon={<TrendingUpIcon className="size-4" />}
          label="Top payment mode"
          value={strongestPaymentMethod?.text ?? 'None yet'}
          detail={
            strongestPaymentMethod
              ? formatCurrencyValue(strongestPaymentMethod.value, currency)
              : 'No payment data yet'
          }
        />
        <MetricCard
          icon={<SparklesIcon className="size-4" />}
          label="Highest day"
          value={analytics.highestDay ? formatDate(analytics.highestDay.date, 'MMM d') : 'None yet'}
          detail={
            analytics.highestDay
              ? formatCurrencyValue(analytics.highestDay.amount, currency)
              : 'No day totals yet'
          }
        />
        <MetricCard
          icon={<CircleDollarSignIcon className="size-4" />}
          label="Tracked currency"
          value={currency}
          detail={`${analytics.availableCurrencies.length} currencies available`}
        />
      </section>

      <section id="signals" className="scroll-mt-44 space-y-4">
        <SectionHeading
          title="Signals"
          description="Core distribution views, breakdowns, and daily rhythm summaries."
        />

        <div className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
          <PaymentCategoryRadarChart
            currency={currency}
            data={dashboardData.paymentCategoryRadar}
            selectedPaymentMethod={selectedPaymentMethod}
            onSelectPaymentMethod={setSelectedPaymentMethod}
          />
          <PaymentShareChart
            currency={currency}
            items={analytics.paymentMethodBreakdown}
            selectedPaymentMethod={selectedPaymentMethod}
            onSelectPaymentMethod={setSelectedPaymentMethod}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <CategoryBreakdownChart currency={currency} items={analytics.categoryBreakdown} />
          <DailySpendChart currency={currency} points={analytics.lineChartData} />
        </div>
      </section>

      <section id="custom-graphs" className="scroll-mt-44 space-y-4">
        <SectionHeading
          title="Custom Graphs"
          description="Build and save chart views from the synced expense dataset."
        />
        <CustomGraphStudio
          currency={currency}
          expenses={analytics.filteredExpenses}
          timeZone={timeZone}
        />
      </section>

      <section id="pinned-graphs" className="scroll-mt-44 space-y-4">
        <SectionHeading
          title="Pinned Graphs"
          description="Keep your strongest saved graph views one click away."
        />
        <CustomGraphStudio
          currency={currency}
          expenses={analytics.filteredExpenses}
          timeZone={timeZone}
          mode="pinned"
        />
      </section>

      <section id="history" className="scroll-mt-44 space-y-4">
        <SectionHeading
          title="History"
          description="Inspect the underlying synced transactions with independent local filters."
        />
        <TransactionHistoryView
          currency={currency}
          expenses={analytics.filteredExpenses}
          settings={settings}
        />
      </section>
    </div>
  )
}

function AnalyticsSectionNav({
  activeSectionId,
  className,
  items,
  onNavigate,
  variant = 'panel',
}: {
  activeSectionId: AnalyticsSectionId
  className?: string
  items: Array<{ id: AnalyticsSectionId; label: string; icon: ReactNode }>
  onNavigate?: () => void
  variant?: 'panel' | 'sticky'
}) {
  return (
    <div
      className={cn(
        variant === 'sticky'
          ? 'analytics-subnav rounded-[1.75rem] p-2'
          : 'rounded-[1.6rem] border border-border/70 bg-white/70 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-sm',
        className,
      )}
    >
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              'inline-flex min-w-0 items-center gap-2 rounded-full border px-3 py-2 text-sm shadow-sm transition-colors',
              activeSectionId === item.id
                ? 'border-border bg-white text-foreground shadow-[0_10px_24px_rgba(74,68,88,0.12)]'
                : 'border-border/70 bg-white/80 text-muted-foreground hover:bg-white hover:text-foreground',
            )}
            onClick={onNavigate}
            aria-current={activeSectionId === item.id ? 'location' : undefined}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </div>
    </div>
  )
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <Card
      className={cn(panelClassName, 'rounded-[1.75rem] shadow-[0_16px_42px_rgba(74,68,88,0.1)]')}
    >
      <CardHeader className="gap-2">
        <CardDescription className="flex items-center gap-2 text-muted-foreground">
          <span className="flex size-8 items-center justify-center rounded-full border border-border/70 bg-white/70 text-foreground shadow-sm">
            {icon}
          </span>
          {label}
        </CardDescription>
        <CardTitle className="text-[1.7rem] leading-none text-foreground">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-muted-foreground">{detail}</CardContent>
    </Card>
  )
}
