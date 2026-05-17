import { max } from 'd3-array'
import { scaleLinear } from 'd3-scale'

import { resolvePaymentMethodType } from '@/features/analytics/payment-methods'
import type { AnalyticsQueryResult } from '@/features/analytics/queries'

export interface PaymentCategoryRadarAxis {
  id: string
  label: string
  angle: number
  total: number
}

export interface PaymentCategoryRadarPoint {
  axisId: string
  label: string
  value: number
  x: number
  y: number
}

export interface PaymentCategoryRadarSeries {
  id: string
  label: string
  color: string
  total: number
  dominantCategory: string | null
  points: PaymentCategoryRadarPoint[]
}

export interface PaymentCategoryRadarData {
  axes: PaymentCategoryRadarAxis[]
  peakValue: number
  rings: number[]
  series: PaymentCategoryRadarSeries[]
}

export interface AnalyticsDashboardData {
  paymentCategoryRadar: PaymentCategoryRadarData
}

export function buildAnalyticsDashboardData(
  analytics: AnalyticsQueryResult,
): AnalyticsDashboardData {
  return {
    paymentCategoryRadar: buildPaymentCategoryRadarData(analytics),
  }
}

function buildPaymentCategoryRadarData(analytics: AnalyticsQueryResult): PaymentCategoryRadarData {
  const axes = analytics.categoryBreakdown.slice(0, 5).map((category, index, source) => ({
    id: category.category,
    label: category.text,
    total: category.value,
    angle: -Math.PI / 2 + (Math.PI * 2 * index) / source.length,
  }))
  const axisIds = new Set(axes.map((axis) => axis.id))
  const methodSeed = analytics.paymentMethodBreakdown.slice(0, 4)
  const methodIds = new Set(methodSeed.map((item) => item.paymentMethodType))
  const totalsByMethod = new Map<string, Map<string, number>>()

  for (const expense of analytics.filteredExpenses) {
    const method = resolvePaymentMethodType(expense.paymentMethod?.type)

    if (!methodIds.has(method) || !axisIds.has(expense.category)) continue

    const categoryTotals = totalsByMethod.get(method) ?? new Map<string, number>()
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) ?? 0) + Math.abs(expense.amount),
    )
    totalsByMethod.set(method, categoryTotals)
  }

  const peakValue =
    max(
      methodSeed.flatMap((method) =>
        axes.map((axis) => totalsByMethod.get(method.paymentMethodType)?.get(axis.id) ?? 0),
      ),
    ) ?? 0
  const ringScale = scaleLinear()
    .domain([0, peakValue || 1])
    .range([0, 150])
  const rings = ringScale.ticks(4).filter((value) => value > 0)

  return {
    axes,
    peakValue,
    rings,
    series: methodSeed.map((method) => {
      const points = axes.map((axis) => {
        const value = totalsByMethod.get(method.paymentMethodType)?.get(axis.id) ?? 0
        const radius = ringScale(value)

        return {
          axisId: axis.id,
          label: axis.label,
          value,
          x: Math.cos(axis.angle) * radius,
          y: Math.sin(axis.angle) * radius,
        }
      })

      const dominantPoint = points.reduce<PaymentCategoryRadarPoint | null>(
        (best, point) => (!best || point.value > best.value ? point : best),
        null,
      )

      return {
        id: method.paymentMethodType,
        label: method.text,
        color: method.color,
        total: method.value,
        dominantCategory: dominantPoint?.label ?? null,
        points,
      }
    }),
  }
}
