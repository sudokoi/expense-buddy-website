import { extent, max } from 'd3-array'
import { scaleLinear, scalePoint } from 'd3-scale'

import type { AnalyticsQueryResult } from '@/features/analytics/queries'
import type { AnyAnalyticsViewDefinition } from '@/features/dashboards/schema'
import type { PieChartDataItem } from '@/types/analytics'

interface ScenePoint {
  x: number
  y: number
  value: number
  label: string
  date: string
  color: string
}

interface SceneSeries {
  id: string
  label: string
  color: string
  total: number
  percentage?: number
  points: ScenePoint[]
}

interface SceneCluster {
  id: string
  label: string
  color: string
  value: number
  percentage: number
  radius: number
  angle: number
}

export interface AnalyticsSceneData {
  view: AnyAnalyticsViewDefinition
  heroValue: number
  lineSeries: SceneSeries[]
  categoryClusters: SceneCluster[]
  maxLineValue: number
}

export function buildAnalyticsSceneData(input: {
  analytics: AnalyticsQueryResult
  view: AnyAnalyticsViewDefinition
}): AnalyticsSceneData {
  const { analytics, view } = input
  const dates = analytics.lineChartData.map((point) => point.date)
  const xScale = scalePoint(dates, [-4.6, 4.6]).padding(0.3)
  const maxLineValue = max(
    analytics.paymentMethodTrendSeries.flatMap((series) =>
      series.points.map((point) => point.value),
    ),
  )
  const yScale = scaleLinear([0, maxLineValue || 1], [-2.3, 2.3])

  const lineSeries = analytics.paymentMethodTrendSeries.map((series) => ({
    id: series.paymentMethodType,
    label: series.text,
    color: series.color,
    total: series.value,
    percentage: analytics.paymentMethodBreakdown.find(
      (item) => item.paymentMethodType === series.paymentMethodType,
    )?.percentage,
    points: series.points.map((point) => ({
      x: xScale(point.date) ?? 0,
      y: yScale(point.value),
      value: point.value,
      label: point.label,
      date: point.date,
      color: series.color,
    })),
  }))

  const [minCategoryValue = 0, maxCategoryValue = 1] = extent(
    analytics.categoryBreakdown,
    (item: PieChartDataItem) => item.value,
  )
  const radiusScale = scaleLinear([minCategoryValue, maxCategoryValue || 1], [0.8, 2.2])
  const angleStep = analytics.categoryBreakdown.length
    ? (Math.PI * 2) / analytics.categoryBreakdown.length
    : 0

  const categoryClusters = analytics.categoryBreakdown.map((item, index) => ({
    id: item.category,
    label: item.text,
    color: item.color,
    value: item.value,
    percentage: item.percentage,
    radius: radiusScale(item.value),
    angle: -Math.PI / 2 + angleStep * index,
  }))

  return {
    view,
    heroValue: analytics.totalSpending,
    lineSeries,
    categoryClusters,
    maxLineValue: maxLineValue || 1,
  }
}
