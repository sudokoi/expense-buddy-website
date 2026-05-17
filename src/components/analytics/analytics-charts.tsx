'use client'

import { max } from 'd3-array'
import { scaleBand, scaleLinear } from 'd3-scale'
import { arc, curveLinearClosed, line, pie } from 'd3-shape'
import type { PieArcDatum } from 'd3-shape'
import { useId, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { PaymentCategoryRadarData } from '@/features/analytics/dashboard-data'
import { getCurrencySymbol } from '@/features/analytics/currency'
import { cn } from '@/lib/utils'
import type {
  LineChartDataItem,
  PaymentMethodChartDataItem,
  PieChartDataItem,
} from '@/types/analytics'

const CALM_PAYMENT_METHOD_COLORS: Record<string, string> = {
  Cash: '#7ca28e',
  'Amazon Pay': '#c79b66',
  UPI: '#8f88c8',
  'Credit Card': '#b98f74',
  'Debit Card': '#7c98b6',
  'Net Banking': '#6ea6a1',
  Other: '#938a9c',
}

const CATEGORY_PALETTE = [
  '#8a9abb',
  '#b695ae',
  '#7ea79a',
  '#c7a173',
  '#8f87bf',
  '#bf9480',
  '#91adc4',
  '#c5a3bb',
]

function getPaymentMethodColor(method: string) {
  return CALM_PAYMENT_METHOD_COLORS[method] ?? CALM_PAYMENT_METHOD_COLORS.Other
}

function getCategoryDisplayColor(index: number) {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]
}

export function formatCurrencyValue(
  value: number,
  currency: string,
  options: {
    maximumFractionDigits?: number
    minimumFractionDigits?: number
    notation?: Intl.NumberFormatOptions['notation']
  } = {},
) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: options.maximumFractionDigits ?? 0,
      minimumFractionDigits: options.minimumFractionDigits,
      notation: options.notation,
    }).format(value)
  } catch {
    return `${getCurrencySymbol(currency)}${value.toFixed(options.maximumFractionDigits ?? 0)}`
  }
}

function formatPercentage(value: number) {
  return `${value.toFixed(0)}%`
}

function sampleXAxisLabels(labels: string[], targetCount: number) {
  if (labels.length <= targetCount) return labels

  const step = Math.max(1, Math.floor(labels.length / (targetCount - 1)))

  return labels.filter(
    (_, index) => index === 0 || index === labels.length - 1 || index % step === 0,
  )
}

export function PaymentCategoryRadarChart({
  currency,
  data,
  selectedPaymentMethod,
  onSelectPaymentMethod,
}: {
  currency: string
  data: PaymentCategoryRadarData
  selectedPaymentMethod: string | null
  onSelectPaymentMethod: (paymentMethod: string | null) => void
}) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    axisId: string
    axisLabel: string
    seriesId: string
    seriesLabel: string
    value: number
  } | null>(null)
  const width = 720
  const height = 520
  const centerX = width / 2
  const centerY = height / 2 + 10
  const activeMethod = selectedPaymentMethod ?? data.series.at(0)?.id ?? null
  const activeSeries = data.series.find((series) => series.id === activeMethod) ?? data.series.at(0)
  const [zoomLevel, setZoomLevel] = useState(1)
  const radarRadius = 150 * zoomLevel

  function updateZoom(nextZoom: number) {
    setZoomLevel(Math.min(2.4, Math.max(0.75, Number(nextZoom.toFixed(2)))))
  }

  function handleWheel(event: React.WheelEvent<SVGSVGElement>) {
    event.preventDefault()
    updateZoom(zoomLevel - event.deltaY * 0.0012)
  }

  return (
    <Card className="analytics-card rounded-[2rem] text-foreground shadow-[0_20px_56px_rgba(74,68,88,0.1)]">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-foreground">Payment method radar</CardTitle>
            <CardDescription className="text-muted-foreground">
              Compare how each payment method distributes across your biggest spending categories.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-border/70 bg-white/80 p-1 text-sm text-muted-foreground shadow-sm">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-full border border-border/60 bg-transparent px-3 text-muted-foreground hover:bg-white hover:text-foreground"
              onClick={() => updateZoom(zoomLevel - 0.2)}
            >
              -
            </Button>
            <span className="min-w-12 text-center text-xs font-medium tracking-[0.14em] text-muted-foreground">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-full border border-border/60 bg-transparent px-3 text-muted-foreground hover:bg-white hover:text-foreground"
              onClick={() => updateZoom(zoomLevel + 0.2)}
            >
              +
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-full border border-border/60 bg-transparent px-3 text-muted-foreground hover:bg-white hover:text-foreground"
              onClick={() => updateZoom(1)}
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              'rounded-full border px-3 text-foreground',
              selectedPaymentMethod === null
                ? 'border-border bg-white shadow-sm hover:bg-white'
                : 'border-border/70 bg-white/70 text-muted-foreground hover:bg-white hover:text-foreground',
            )}
            onClick={() => onSelectPaymentMethod(null)}
          >
            All methods
          </Button>

          {data.series.map((series) => (
            <Button
              key={series.id}
              size="sm"
              variant="ghost"
              className={cn(
                'rounded-full border px-3 text-foreground',
                selectedPaymentMethod === series.id
                  ? 'border-border bg-white shadow-sm hover:bg-white'
                  : 'border-border/70 bg-white/70 text-muted-foreground hover:bg-white hover:text-foreground',
              )}
              onClick={() => onSelectPaymentMethod(series.id)}
            >
              <span
                className="mr-2 inline-block size-2.5 rounded-full"
                style={{ backgroundColor: getPaymentMethodColor(series.id) }}
              />
              {series.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-center">
        <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="analytics-svg min-w-[38rem] overflow-visible sm:min-w-0 sm:w-full"
            onWheel={handleWheel}
          >
            <g transform={`translate(${centerX}, ${centerY})`}>
              {data.rings.map((ring) => {
                const ringRadius = data.peakValue > 0 ? (ring / data.peakValue) * radarRadius : 0
                const ringPath = line<{ x: number; y: number }>()
                  .x((point) => point.x)
                  .y((point) => point.y)
                  .curve(curveLinearClosed)(
                  data.axes.map((axis) => ({
                    x: Math.cos(axis.angle) * ringRadius,
                    y: Math.sin(axis.angle) * ringRadius,
                  })),
                )

                return (
                  <g key={ring}>
                    <path d={ringPath ?? undefined} className="analytics-radar-ring" />
                    <text x={8} y={-ringRadius + 12} className="analytics-axis-text">
                      {formatCurrencyValue(ring, currency, { notation: 'compact' })}
                    </text>
                  </g>
                )
              })}

              {data.axes.map((axis) => {
                const labelRadius = radarRadius + 34
                const labelX = Math.cos(axis.angle) * labelRadius
                const labelY = Math.sin(axis.angle) * labelRadius

                return (
                  <g key={axis.id}>
                    <line
                      x1={0}
                      y1={0}
                      x2={Math.cos(axis.angle) * radarRadius}
                      y2={Math.sin(axis.angle) * radarRadius}
                      className="analytics-grid-line"
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor={Math.abs(labelX) < 12 ? 'middle' : labelX > 0 ? 'start' : 'end'}
                      className="analytics-axis-strong"
                    >
                      {axis.label}
                    </text>
                    <text
                      x={labelX}
                      y={labelY + 16}
                      textAnchor={Math.abs(labelX) < 12 ? 'middle' : labelX > 0 ? 'start' : 'end'}
                      className="analytics-axis-text"
                    >
                      {formatCurrencyValue(axis.total, currency, { notation: 'compact' })}
                    </text>
                  </g>
                )
              })}

              {data.series.map((series) => {
                const polygonPath = line<(typeof series.points)[number]>()
                  .x((point) => point.x)
                  .y((point) => point.y)
                  .curve(curveLinearClosed)(series.points)
                const isSelected =
                  selectedPaymentMethod === null || selectedPaymentMethod === series.id

                return (
                  <g key={series.id} opacity={isSelected ? 1 : 0.24}>
                    <path
                      d={polygonPath ?? undefined}
                      fill={getPaymentMethodColor(series.id)}
                      fillOpacity={0.16}
                      stroke={getPaymentMethodColor(series.id)}
                      strokeWidth={isSelected ? 3 : 2}
                    />
                    {series.points.map((point) => (
                      <circle
                        key={`${series.id}-${point.axisId}`}
                        cx={point.x}
                        cy={point.y}
                        r={isSelected ? 4.5 : 3}
                        fill={getPaymentMethodColor(series.id)}
                        stroke="rgba(18, 15, 29, 0.9)"
                        strokeWidth={2}
                        onPointerEnter={() =>
                          setHoveredPoint({
                            axisId: point.axisId,
                            axisLabel: point.label,
                            seriesId: series.id,
                            seriesLabel: series.label,
                            value: point.value,
                          })
                        }
                        onPointerLeave={() => setHoveredPoint(null)}
                      />
                    ))}
                  </g>
                )
              })}
            </g>
          </svg>
        </div>

        <div className="space-y-3">
          <div className="rounded-[1.25rem] border border-border/70 bg-white/70 px-4 py-4 shadow-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {hoveredPoint ? 'Hovered point' : 'Active profile'}
            </div>
            <div className="mt-2 text-lg font-semibold text-foreground">
              {hoveredPoint?.seriesLabel ?? activeSeries?.label ?? 'All methods'}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {hoveredPoint?.axisLabel ??
                (activeSeries?.dominantCategory
                  ? `Strongest in ${activeSeries.dominantCategory}`
                  : 'No dominant category yet')}
            </div>
            <div className="mt-3 text-sm text-foreground/80">
              {hoveredPoint
                ? `Value: ${formatCurrencyValue(hoveredPoint.value, currency)}`
                : `Total: ${formatCurrencyValue(activeSeries?.total ?? 0, currency)}`}
            </div>
          </div>

          {data.series.map((series) => {
            const isSelected = activeMethod === series.id

            return (
              <button
                key={series.id}
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-[1.2rem] border px-3 py-3 text-left transition-colors',
                  isSelected
                    ? 'border-border bg-white shadow-sm'
                    : 'border-border/70 bg-white/70 hover:bg-white',
                )}
                onClick={() =>
                  onSelectPaymentMethod(series.id === selectedPaymentMethod ? null : series.id)
                }
              >
                <span className="flex min-w-0 items-center gap-3 text-sm text-foreground/80">
                  <span
                    className="inline-block size-3 rounded-full"
                    style={{ backgroundColor: getPaymentMethodColor(series.id) }}
                  />
                  <span className="truncate">{series.label}</span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-medium text-foreground">
                    {formatCurrencyValue(series.total, currency)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {series.dominantCategory ?? 'No category'}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function CategoryBreakdownChart({
  currency,
  items,
}: {
  currency: string
  items: PieChartDataItem[]
}) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const width = 760
  const rowHeight = 52
  const margin = { top: 8, right: 110, bottom: 10, left: 132 }
  const height = Math.max(260, items.length * rowHeight + margin.top + margin.bottom)
  const boundedWidth = width - margin.left - margin.right
  const maxValue = max(items.map((item) => item.value)) ?? 0
  const xScale = scaleLinear()
    .domain([0, maxValue || 1])
    .range([0, boundedWidth])
  const tickValues = xScale.ticks(4)
  const summaryItem =
    items.find((item) => item.category === hoveredCategory) ??
    items.find((item) => item.category === activeCategory) ??
    items.at(0) ??
    null

  return (
    <Card className="analytics-card rounded-[2rem] text-foreground shadow-[0_18px_52px_rgba(74,68,88,0.1)]">
      <CardHeader>
        <CardTitle className="text-foreground">Category balance</CardTitle>
        <CardDescription className="text-muted-foreground">
          Sorted bars make the strongest spending categories easy to compare.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[1.25rem] border border-border/70 bg-white/70 px-4 py-3 shadow-sm">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {hoveredCategory ? 'Hovered category' : 'Leading category'}
          </div>
          <div className="mt-1 text-lg font-semibold text-foreground">
            {summaryItem?.text ?? 'No categories yet'}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {summaryItem
              ? `${formatCurrencyValue(summaryItem.value, currency)} • ${formatPercentage(summaryItem.percentage)}`
              : 'No category totals available'}
          </div>
        </div>

        <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="analytics-svg min-w-[42rem] overflow-visible sm:min-w-0 sm:w-full"
          >
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {tickValues.map((tick) => (
                <g key={tick} transform={`translate(${xScale(tick)}, 0)`}>
                  <line y2={height - margin.top - margin.bottom} className="analytics-grid-line" />
                  <text
                    y={height - margin.top - margin.bottom + 20}
                    textAnchor="middle"
                    className="analytics-axis-text"
                  >
                    {formatCurrencyValue(tick, currency, { notation: 'compact' })}
                  </text>
                </g>
              ))}

              {items.map((item, index) => {
                const y = index * rowHeight + 6
                const color = getCategoryDisplayColor(index)
                const isActive = activeCategory === null || activeCategory === item.category

                return (
                  <g
                    key={item.category}
                    transform={`translate(0, ${y})`}
                    opacity={isActive ? 1 : 0.44}
                    onPointerEnter={() => {
                      setActiveCategory(item.category)
                      setHoveredCategory(item.category)
                    }}
                    onPointerLeave={() => {
                      setActiveCategory(null)
                      setHoveredCategory(null)
                    }}
                  >
                    <text x={-14} y={17} textAnchor="end" className="analytics-axis-strong">
                      {item.text}
                    </text>
                    <text x={-14} y={34} textAnchor="end" className="analytics-axis-text">
                      {formatPercentage(item.percentage)}
                    </text>
                    <rect width={boundedWidth} height={18} rx={9} className="analytics-bar-track" />
                    <rect
                      width={xScale(item.value)}
                      height={18}
                      rx={9}
                      fill={color}
                      opacity={0.95}
                    />
                    <text
                      x={Math.min(boundedWidth + 8, xScale(item.value) + 12)}
                      y={13}
                      className="analytics-axis-strong"
                    >
                      {formatCurrencyValue(item.value, currency)}
                    </text>
                  </g>
                )
              })}
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}

export function PaymentShareChart({
  currency,
  items,
  selectedPaymentMethod,
  onSelectPaymentMethod,
}: {
  currency: string
  items: PaymentMethodChartDataItem[]
  selectedPaymentMethod: string | null
  onSelectPaymentMethod: (paymentMethod: string | null) => void
}) {
  const chartId = useId()
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const width = 320
  const height = 240
  const centerX = 160
  const centerY = 118
  const pieLayout = useMemo(
    () =>
      pie<PaymentMethodChartDataItem>()
        .sort(null)
        .value((item) => item.value)(items),
    [items],
  )
  const activeMethod = selectedPaymentMethod ?? items.at(0)?.paymentMethodType ?? null
  const activeItem = items.find((item) => item.paymentMethodType === activeMethod) ?? items.at(0)
  const displayItem =
    items.find((item) => item.paymentMethodType === hoveredMethod) ?? activeItem ?? null

  return (
    <Card className="analytics-card rounded-[2rem] text-foreground shadow-[0_18px_52px_rgba(74,68,88,0.1)]">
      <CardHeader>
        <CardTitle className="text-foreground">Payment share</CardTitle>
        <CardDescription className="text-muted-foreground">
          A calmer summary of where the spending volume is flowing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="analytics-svg mx-auto max-w-[19rem] overflow-visible"
          onPointerLeave={() => setHoveredMethod(null)}
        >
          <defs>
            <filter id={`${chartId}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="rgba(0,0,0,0.24)" />
            </filter>
          </defs>
          <g transform={`translate(${centerX}, ${centerY})`} filter={`url(#${chartId}-shadow)`}>
            {pieLayout.map((datum) => {
              const isActive =
                activeMethod === null || activeMethod === datum.data.paymentMethodType
              const path = arc<PieArcDatum<PaymentMethodChartDataItem>>()
                .innerRadius(60)
                .outerRadius(isActive ? 106 : 100)
                .cornerRadius(14)
                .padAngle(0.026)(datum)

              return (
                <path
                  key={datum.data.paymentMethodType}
                  d={path ?? undefined}
                  fill={getPaymentMethodColor(datum.data.paymentMethodType)}
                  opacity={isActive ? 0.96 : 0.42}
                  onPointerEnter={() => setHoveredMethod(datum.data.paymentMethodType)}
                  onClick={() =>
                    onSelectPaymentMethod(
                      datum.data.paymentMethodType === selectedPaymentMethod
                        ? null
                        : datum.data.paymentMethodType,
                    )
                  }
                />
              )
            })}
            <circle r={48} fill="#fff8f0" />
            <text y={-4} textAnchor="middle" className="analytics-axis-text">
              {displayItem?.text ?? 'Leading share'}
            </text>
            <text
              y={12}
              textAnchor="middle"
              className="fill-[var(--foreground)] text-[15px] font-semibold"
            >
              {displayItem
                ? formatCurrencyValue(displayItem.value, currency, { notation: 'compact' })
                : formatCurrencyValue(0, currency)}
            </text>
            <text y={30} textAnchor="middle" className="analytics-axis-text">
              {displayItem ? formatPercentage(displayItem.percentage) : '0%'}
            </text>
          </g>
        </svg>

        <div className="space-y-2">
          {items.map((item) => {
            const isActive = activeMethod === item.paymentMethodType

            return (
              <button
                key={item.paymentMethodType}
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-[1.2rem] border px-3 py-3 text-left transition-colors',
                  isActive
                    ? 'border-border bg-white shadow-sm'
                    : 'border-border/70 bg-white/70 hover:bg-white',
                )}
                onClick={() =>
                  onSelectPaymentMethod(
                    item.paymentMethodType === selectedPaymentMethod
                      ? null
                      : item.paymentMethodType,
                  )
                }
                onPointerEnter={() => setHoveredMethod(item.paymentMethodType)}
                onPointerLeave={() => setHoveredMethod(null)}
              >
                <span className="flex items-center gap-3 text-sm text-foreground/80">
                  <span
                    className="inline-block size-3 rounded-full"
                    style={{ backgroundColor: getPaymentMethodColor(item.paymentMethodType) }}
                  />
                  <span>{item.text}</span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-medium text-foreground">
                    {formatCurrencyValue(item.value, currency)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatPercentage(item.percentage)}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="rounded-[1.25rem] border border-border/70 bg-white/70 px-4 py-3 text-sm text-muted-foreground shadow-sm">
          Total tracked volume:{' '}
          <span className="font-medium text-foreground">
            {formatCurrencyValue(total, currency)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function DailySpendChart({
  currency,
  points,
}: {
  currency: string
  points: LineChartDataItem[]
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const width = 520
  const height = 260
  const margin = { top: 16, right: 12, bottom: 36, left: 12 }
  const boundedWidth = width - margin.left - margin.right
  const boundedHeight = height - margin.top - margin.bottom
  const maxValue = max(points.map((point) => point.value)) ?? 0
  const xScale = scaleBand<string>()
    .domain(points.map((point) => point.date))
    .range([0, boundedWidth])
    .padding(0.18)
  const yScale = scaleLinear()
    .domain([0, maxValue || 1])
    .range([boundedHeight, 0])
    .nice(4)
  const strongestPoint = points.reduce<LineChartDataItem | null>(
    (best, point) => (!best || point.value > best.value ? point : best),
    null,
  )
  const activePoint =
    hoveredIndex === null ? strongestPoint : (points[hoveredIndex] ?? strongestPoint)

  return (
    <Card className="analytics-card rounded-[2rem] text-foreground shadow-[0_18px_52px_rgba(74,68,88,0.1)]">
      <CardHeader>
        <CardTitle className="text-foreground">Daily rhythm</CardTitle>
        <CardDescription className="text-muted-foreground">
          Quick scan of busy and quiet days across the current filter window.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[1.25rem] border border-border/70 bg-white/70 px-4 py-3 shadow-sm">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {hoveredIndex === null ? 'Peak day' : activePoint?.label}
          </div>
          <div className="mt-1 text-xl font-semibold text-foreground">
            {formatCurrencyValue(activePoint?.value ?? 0, currency)}
          </div>
        </div>

        <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="analytics-svg min-w-[32rem] overflow-visible sm:min-w-0 sm:w-full"
          >
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const tick = (maxValue || 1) * ratio
                return (
                  <g key={ratio} transform={`translate(0, ${yScale(tick)})`}>
                    <line x2={boundedWidth} className="analytics-grid-line" />
                  </g>
                )
              })}

              {points.map((point, index) => {
                const x = xScale(point.date) ?? 0
                const barHeight = boundedHeight - yScale(point.value)
                const isActive = hoveredIndex === index
                const opacity = maxValue > 0 ? 0.28 + (point.value / maxValue) * 0.68 : 0.28

                return (
                  <g key={point.date} transform={`translate(${x}, 0)`}>
                    <rect
                      y={yScale(point.value)}
                      width={xScale.bandwidth()}
                      height={barHeight}
                      rx={Math.min(10, xScale.bandwidth() / 2)}
                      fill="#8f88c8"
                      opacity={isActive ? 1 : opacity}
                      onPointerEnter={() => setHoveredIndex(index)}
                      onPointerLeave={() => setHoveredIndex(null)}
                    />
                  </g>
                )
              })}

              {sampleXAxisLabels(
                points.map((point) => point.date),
                6,
              ).map((date) => (
                <g
                  key={date}
                  transform={`translate(${(xScale(date) ?? 0) + xScale.bandwidth() / 2}, ${boundedHeight})`}
                >
                  <text y={22} textAnchor="middle" className="analytics-axis-text">
                    {points.find((point) => point.date === date)?.label ?? date}
                  </text>
                </g>
              ))}
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}
