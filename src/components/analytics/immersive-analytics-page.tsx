'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { BarChart3Icon, CircleDollarSignIcon, SparklesIcon, TrendingUpIcon } from 'lucide-react'

import {
  CategoryBreakdownChart,
  DailySpendChart,
  formatCurrencyValue,
  PaymentCategoryRadarChart,
  PaymentShareChart,
} from '@/components/analytics/analytics-charts'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalyticsDashboardData } from '@/features/analytics/dashboard-data'
import { formatDate } from '@/features/analytics/date'
import type { AnalyticsQueryResult } from '@/features/analytics/queries'
import { cn } from '@/lib/utils'

interface ImmersiveAnalyticsPageProps {
  analytics: AnalyticsQueryResult
  dashboardData: AnalyticsDashboardData
  repoName: string
  branchName: string
  totalExpenses: number
}

const panelClassName = 'analytics-card rounded-[2rem] text-white'

export function ImmersiveAnalyticsPage({
  analytics,
  dashboardData,
  repoName,
  branchName,
  totalExpenses,
}: ImmersiveAnalyticsPageProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const currency = analytics.selectedCurrency
  const strongestPaymentMethod = analytics.paymentMethodBreakdown.at(0)
  const strongestCategory = analytics.categoryBreakdown.at(0)

  return (
    <div className="flex min-h-[calc(100vh-6rem)] w-full flex-col gap-6 py-6 text-[#f7f2fb] sm:gap-8 sm:py-8">
      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card
          className={cn(
            panelClassName,
            'analytics-hero-panel rounded-[2.25rem] shadow-[0_24px_72px_rgba(10,8,18,0.22)]',
          )}
        >
          <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <Badge
                variant="secondary"
                className="rounded-full border-0 bg-white/12 px-3 py-1 text-[#f8f1ff]"
              >
                Read-only GitHub analytics
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Calm, high-signal analytics for your spending history.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-white/76 sm:text-base">
                  The main radar view highlights how payment methods distribute across your largest
                  categories, sourced from{' '}
                  <span className="font-medium text-white">{repoName}</span> on{' '}
                  <span className="font-medium text-white">{branchName}</span>.
                </p>
              </div>
            </div>

            <div className="max-w-sm rounded-[1.6rem] border border-white/12 bg-white/8 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
              <div className="flex items-center gap-2 text-sm text-white/68">
                <SparklesIcon className="size-4" />
                Current focus
              </div>
              <div className="mt-3 text-lg font-medium text-white">
                {selectedPaymentMethod ?? strongestPaymentMethod?.text ?? 'All payment methods'}
              </div>
              <p className="mt-2 text-sm leading-6 text-white/72">
                Select a payment mode from the radar legend or the share card to isolate its
                profile.
              </p>
            </div>
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

      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
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
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <CategoryBreakdownChart currency={currency} items={analytics.categoryBreakdown} />
        <DailySpendChart currency={currency} points={analytics.lineChartData} />
      </section>
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
      className={cn(panelClassName, 'rounded-[1.75rem] shadow-[0_16px_42px_rgba(8,6,18,0.14)]')}
    >
      <CardHeader className="gap-2">
        <CardDescription className="flex items-center gap-2 text-white/64">
          <span className="flex size-8 items-center justify-center rounded-full border border-white/12 bg-white/10 text-[#f8f1ff]">
            {icon}
          </span>
          {label}
        </CardDescription>
        <CardTitle className="text-[1.7rem] leading-none text-white">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-white/70">{detail}</CardContent>
    </Card>
  )
}
