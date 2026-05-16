'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRightIcon, PlusIcon, SparklesIcon } from 'lucide-react'

import { ImmersiveAnalyticsScene } from '@/components/analytics/immersive-analytics-scene'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { buildAnalyticsSceneData } from '@/features/analytics/scene-data'
import type { AnalyticsQueryResult } from '@/features/analytics/queries'
import { dashboardStorage } from '@/features/dashboards/storage'
import {
  analyticsLayerCatalog,
  analyticsViewPresets,
  defaultAnalyticsViewId,
} from '@/features/dashboards/schema'
import { getCurrencySymbol } from '@/features/analytics/currency'
import { formatDate } from '@/features/analytics/date'
import type { StoredAnalyticsViewDefinition } from '@/features/dashboards/schema'
import { useMounted } from '@/hooks/use-mounted'

interface ImmersiveAnalyticsPageProps {
  analytics: AnalyticsQueryResult
  repoName: string
  branchName: string
  totalExpenses: number
}

function createViewId() {
  return `view-${Math.random().toString(36).slice(2, 10)}`
}

export function ImmersiveAnalyticsPage({
  analytics,
  repoName,
  branchName,
  totalExpenses,
}: ImmersiveAnalyticsPageProps) {
  const mounted = useMounted()
  const [storedViews, setStoredViews] = useState<StoredAnalyticsViewDefinition[]>([])
  const [activeViewId, setActiveViewId] = useState(defaultAnalyticsViewId)
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('My layered view')
  const [draftAccentColor, setDraftAccentColor] = useState('#ff91a4')
  const [primaryLayerId, setPrimaryLayerId] = useState('payment-method-line-field')
  const [secondaryLayerId, setSecondaryLayerId] = useState('category-radial-clusters')

  useEffect(() => {
    if (!mounted) return

    void dashboardStorage.loadDashboardConfigs().then((views) => {
      setStoredViews(views)
    })
  }, [mounted])

  const views = useMemo(() => [...analyticsViewPresets, ...storedViews], [storedViews])
  const activeView = views.find((view) => view.id === activeViewId) ?? analyticsViewPresets[0]
  const activeLayer =
    activeView.layers.find((layer) => layer.id === activeLayerId) ?? activeView.layers[0]
  const sceneData = useMemo(
    () => buildAnalyticsSceneData({ analytics, view: activeView }),
    [activeView, analytics],
  )
  const currency = analytics.availableCurrencies[0] || 'INR'
  const currencySymbol = getCurrencySymbol(currency)

  async function saveCustomView() {
    const layers = [primaryLayerId, secondaryLayerId]
      .map((layerId) => analyticsLayerCatalog.find((layer) => layer.id === layerId))
      .filter(
        (layer, index, source): layer is (typeof analyticsLayerCatalog)[number] =>
          !!layer && source.findIndex((candidate) => candidate?.id === layer.id) === index,
      )

    if (!layers.length) return

    const nextView: StoredAnalyticsViewDefinition = {
      id: createViewId(),
      source: 'user',
      title: draftTitle.trim() || 'Custom view',
      description: 'A browser-saved immersive view assembled from your selected layers.',
      accentColor: draftAccentColor,
      layers,
    }

    const nextViews = [...storedViews, nextView]
    setStoredViews(nextViews)
    setActiveViewId(nextView.id)
    setActiveLayerId(nextView.layers[0]?.id ?? null)
    await dashboardStorage.saveDashboardConfigs(nextViews)
  }

  return (
    <div className="flex min-h-[calc(100vh-6rem)] w-full flex-col gap-6 py-6 sm:gap-8 sm:py-8">
      <section className="immersive-hero-grid grid min-h-[70vh] gap-4 lg:grid-cols-[1.55fr_0.8fr]">
        <div className="immersive-panel relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 p-0 shadow-[0_40px_120px_rgba(7,4,16,0.45)] backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-white/10 text-white ring-1 ring-white/10">
                Read-only GitHub analytics
              </Badge>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {activeView.title}
                </h1>
                <p className="max-w-xl text-sm text-white/72 sm:text-base">
                  {activeView.description}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeView.layers.map((layer) => (
                <Button
                  key={layer.id}
                  size="sm"
                  variant="ghost"
                  className={
                    layer.id === activeLayer.id
                      ? 'border border-white/20 bg-white/14 text-white hover:bg-white/18'
                      : 'border border-transparent bg-white/6 text-white/75 hover:bg-white/12 hover:text-white'
                  }
                  onClick={() => setActiveLayerId(layer.id)}
                >
                  {layer.title}
                </Button>
              ))}
            </div>
          </div>

          <div className="absolute inset-0">
            {mounted ? (
              <ImmersiveAnalyticsScene
                data={sceneData}
                activeLayer={activeLayer}
                highlightedSeriesId={selectedPaymentMethod}
              />
            ) : null}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="immersive-overlay-card rounded-[1.5rem] border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-xl">
                <div className="text-xs uppercase tracking-[0.24em] text-white/55">
                  Total spending
                </div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {currencySymbol}
                  {analytics.totalSpending.toFixed(2)}
                </div>
              </div>
              <div className="immersive-overlay-card rounded-[1.5rem] border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-xl">
                <div className="text-xs uppercase tracking-[0.24em] text-white/55">
                  Highest category
                </div>
                <div className="mt-1 text-lg font-medium text-white">
                  {analytics.highestCategory?.category ?? 'None yet'}
                </div>
              </div>
              <div className="immersive-overlay-card rounded-[1.5rem] border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-xl">
                <div className="text-xs uppercase tracking-[0.24em] text-white/55">Highest day</div>
                <div className="mt-1 text-lg font-medium text-white">
                  {analytics.highestDay
                    ? formatDate(analytics.highestDay.date, 'MMM d')
                    : 'None yet'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="rounded-[2rem] border-white/12 bg-white/8 text-white shadow-[0_24px_80px_rgba(7,4,16,0.3)] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Data source</CardTitle>
              <CardDescription className="text-white/68">
                Synced from <span className="font-medium text-white">{repoName}</span> on{' '}
                <span className="font-medium text-white">{branchName}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.25rem] border border-white/10 bg-black/12 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.24em] text-white/50">Expenses</div>
                <div className="mt-1 text-xl font-semibold text-white">{totalExpenses}</div>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-black/12 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.24em] text-white/50">
                  Average daily
                </div>
                <div className="mt-1 text-xl font-semibold text-white">
                  {currencySymbol}
                  {analytics.averageDaily.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-white/12 bg-white/8 text-white shadow-[0_24px_80px_rgba(7,4,16,0.3)] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Views</CardTitle>
              <CardDescription className="text-white/68">
                Presets are built in. Custom views stay in this browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {views.map((view) => (
                  <button
                    key={view.id}
                    type="button"
                    className={
                      view.id === activeView.id
                        ? 'rounded-full border border-white/20 bg-white/16 px-3 py-2 text-left text-sm text-white transition-colors'
                        : 'rounded-full border border-white/8 bg-black/10 px-3 py-2 text-left text-sm text-white/72 transition-colors hover:bg-white/10 hover:text-white'
                    }
                    onClick={() => {
                      setActiveViewId(view.id)
                      setActiveLayerId(view.layers[0]?.id ?? null)
                    }}
                  >
                    {view.title}
                  </button>
                ))}
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-black/12 p-4">
                <div className="flex items-start gap-3">
                  <SparklesIcon className="mt-0.5 size-4 text-[#ffb6c1]" />
                  <div>
                    <div className="text-sm font-medium text-white">{activeLayer.title}</div>
                    <p className="mt-1 text-sm text-white/68">{activeLayer.description}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-white/12 bg-white/8 text-white shadow-[0_24px_80px_rgba(7,4,16,0.3)] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Create a view</CardTitle>
              <CardDescription className="text-white/68">
                Mix immersive layers now so new combinations can scale beyond this release.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                className="h-10 rounded-xl border-white/10 bg-black/14 text-white placeholder:text-white/38"
                placeholder="Custom view title"
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Select
                  value={primaryLayerId}
                  onValueChange={(value) => value && setPrimaryLayerId(value)}
                >
                  <SelectTrigger className="h-10 w-full rounded-xl border-white/10 bg-black/14 text-white">
                    <SelectValue placeholder="Primary layer" />
                  </SelectTrigger>
                  <SelectContent>
                    {analyticsLayerCatalog.map((layer) => (
                      <SelectItem key={layer.id} value={layer.id}>
                        {layer.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={secondaryLayerId}
                  onValueChange={(value) => value && setSecondaryLayerId(value)}
                >
                  <SelectTrigger className="h-10 w-full rounded-xl border-white/10 bg-black/14 text-white">
                    <SelectValue placeholder="Secondary layer" />
                  </SelectTrigger>
                  <SelectContent>
                    {analyticsLayerCatalog.map((layer) => (
                      <SelectItem key={layer.id} value={layer.id}>
                        {layer.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-white/72">
                  Accent
                  <input
                    type="color"
                    value={draftAccentColor}
                    onChange={(event) => setDraftAccentColor(event.target.value)}
                    className="h-10 w-12 rounded-xl border border-white/10 bg-transparent"
                  />
                </label>
                <Button
                  className="rounded-full bg-white text-[#1a1625] hover:bg-white/88"
                  onClick={() => void saveCustomView()}
                >
                  <PlusIcon data-icon="inline-start" />
                  Save view
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-white/12 bg-white/8 text-white shadow-[0_24px_80px_rgba(7,4,16,0.3)] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Payment focus</CardTitle>
              <CardDescription className="text-white/68">
                Narrow the line field to a single payment method without changing the view preset.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                type="button"
                className={
                  selectedPaymentMethod === null
                    ? 'flex w-full items-center justify-between rounded-[1.2rem] border border-white/20 bg-white/14 px-3 py-2 text-left text-sm text-white'
                    : 'flex w-full items-center justify-between rounded-[1.2rem] border border-white/8 bg-black/10 px-3 py-2 text-left text-sm text-white/72 hover:bg-white/10 hover:text-white'
                }
                onClick={() => setSelectedPaymentMethod(null)}
              >
                <span>Show all payment modes</span>
                <ArrowRightIcon className="size-4" />
              </button>
              {analytics.paymentMethodTrendSeries.map((series) => (
                <button
                  key={series.paymentMethodType}
                  type="button"
                  className={
                    selectedPaymentMethod === series.paymentMethodType
                      ? 'flex w-full items-center justify-between rounded-[1.2rem] border border-white/20 bg-white/14 px-3 py-2 text-left text-sm text-white'
                      : 'flex w-full items-center justify-between rounded-[1.2rem] border border-white/8 bg-black/10 px-3 py-2 text-left text-sm text-white/72 hover:bg-white/10 hover:text-white'
                  }
                  onClick={() => setSelectedPaymentMethod(series.paymentMethodType)}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: series.color }}
                    />
                    {series.text}
                  </span>
                  <span>
                    {currencySymbol}
                    {series.value.toFixed(0)}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
