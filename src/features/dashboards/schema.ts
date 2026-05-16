export type AnalyticsDimension = 'overview' | 'payment_method' | 'category'

export type AnalyticsPresentation = 'hero' | 'line_field' | 'radial_clusters'

export interface AnalyticsViewLayer {
  id: string
  dimension: AnalyticsDimension
  presentation: AnalyticsPresentation
  title: string
  description: string
}

export interface AnalyticsViewDefinition {
  id: string
  title: string
  description: string
  accentColor: string
  layers: AnalyticsViewLayer[]
}

export interface StoredAnalyticsViewDefinition extends AnalyticsViewDefinition {
  source: 'user'
}

export interface PresetAnalyticsViewDefinition extends AnalyticsViewDefinition {
  source: 'preset'
}

export type AnyAnalyticsViewDefinition =
  | PresetAnalyticsViewDefinition
  | StoredAnalyticsViewDefinition

export const analyticsLayerCatalog: AnalyticsViewLayer[] = [
  {
    id: 'overview-hero',
    dimension: 'overview',
    presentation: 'hero',
    title: 'Spending pulse',
    description: 'Keep the top-level totals in view while exploring the scene.',
  },
  {
    id: 'payment-method-line-field',
    dimension: 'payment_method',
    presentation: 'line_field',
    title: 'Payment modes',
    description: 'Animated ribbons reveal how each payment mode moves through time.',
  },
  {
    id: 'category-radial-clusters',
    dimension: 'category',
    presentation: 'radial_clusters',
    title: 'Category bloom',
    description: 'Category totals expand outward like petals around the spending core.',
  },
]

function getLayer(id: AnalyticsViewLayer['id']): AnalyticsViewLayer {
  return analyticsLayerCatalog.find((layer) => layer.id === id) ?? analyticsLayerCatalog[0]
}

export const analyticsViewPresets: PresetAnalyticsViewDefinition[] = [
  {
    id: 'payment-flow',
    source: 'preset',
    title: 'Payment flow',
    description: 'Follow spending over time, separated by the way you paid.',
    accentColor: '#ff91a4',
    layers: [getLayer('payment-method-line-field'), getLayer('overview-hero')],
  },
  {
    id: 'category-garden',
    source: 'preset',
    title: 'Category garden',
    description: 'See where your spending blooms across categories.',
    accentColor: '#d4c4fb',
    layers: [getLayer('category-radial-clusters'), getLayer('overview-hero')],
  },
  {
    id: 'category-payment-hybrid',
    source: 'preset',
    title: 'Hybrid view',
    description: 'Combine payment methods and categories in one immersive composition.',
    accentColor: '#98fb98',
    layers: [getLayer('payment-method-line-field'), getLayer('category-radial-clusters')],
  },
]

export const defaultAnalyticsViewId = analyticsViewPresets[0]?.id ?? 'payment-flow'

export function isValidAnalyticsViewDefinition(
  value: unknown,
): value is StoredAnalyticsViewDefinition {
  if (!value || typeof value !== 'object') return false

  const candidate = value as {
    source?: unknown
    id?: unknown
    title?: unknown
    description?: unknown
    accentColor?: unknown
    layers?: unknown
  }

  return (
    candidate.source === 'user' &&
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.accentColor === 'string' &&
    Array.isArray(candidate.layers) &&
    candidate.layers.length > 0 &&
    candidate.layers.every((layer) => {
      if (!layer || typeof layer !== 'object') return false

      const layerCandidate = layer as {
        id?: unknown
        title?: unknown
        description?: unknown
        dimension?: unknown
        presentation?: unknown
      }

      return (
        typeof layerCandidate.id === 'string' &&
        typeof layerCandidate.title === 'string' &&
        typeof layerCandidate.description === 'string' &&
        ['overview', 'payment_method', 'category'].includes(String(layerCandidate.dimension)) &&
        ['hero', 'line_field', 'radial_clusters'].includes(String(layerCandidate.presentation))
      )
    })
  )
}
