import {
  DEFAULT_GRAPH_SPECS,
  GRAPH_FIELD_DEFINITIONS,
  getDefaultGraphSpec,
  type GraphAggregation,
  type GraphChartType,
  type GraphDimensionFieldId,
  type GraphFieldId,
  type GraphSpec,
  type GraphSortBy,
  type GraphSortOrder,
} from '@/features/analytics/custom-graphs'

export interface SavedCustomGraph {
  id: string
  spec: GraphSpec
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'expense-buddy.saved-custom-graphs.v1'
const VALID_CHART_TYPES = new Set<GraphChartType>(
  Object.keys(DEFAULT_GRAPH_SPECS) as GraphChartType[],
)
const VALID_FIELD_IDS = new Set<GraphFieldId>(GRAPH_FIELD_DEFINITIONS.map((field) => field.id))
const VALID_DIMENSION_FIELD_IDS = new Set<GraphDimensionFieldId>(
  GRAPH_FIELD_DEFINITIONS.filter((field) => field.kind === 'dimension').map(
    (field) => field.id as GraphDimensionFieldId,
  ),
)
const VALID_AGGREGATIONS = new Set<GraphAggregation>(['sum', 'average', 'count'])
const VALID_SORT_BY = new Set<GraphSortBy>(['label', 'value'])
const VALID_SORT_ORDER = new Set<GraphSortOrder>(['asc', 'desc'])

export function loadSavedCustomGraphs(): SavedCustomGraph[] {
  if (typeof window === 'undefined') return []

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((entry) => normalizeSavedCustomGraph(entry))
      .filter((entry): entry is SavedCustomGraph => entry !== null)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  } catch {
    return []
  }
}

export function persistSavedCustomGraphs(savedGraphs: SavedCustomGraph[]) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedGraphs))
}

export function createSavedCustomGraph(spec: GraphSpec): SavedCustomGraph {
  const now = new Date().toISOString()

  return {
    id: createGraphId(),
    spec,
    createdAt: now,
    updatedAt: now,
  }
}

export function updateSavedCustomGraph(entry: SavedCustomGraph, spec: GraphSpec): SavedCustomGraph {
  return {
    ...entry,
    spec,
    updatedAt: new Date().toISOString(),
  }
}

export function duplicateSavedCustomGraph(entry: SavedCustomGraph): SavedCustomGraph {
  const now = new Date().toISOString()

  return {
    id: createGraphId(),
    spec: {
      ...entry.spec,
      title: `${entry.spec.title} copy`,
    },
    createdAt: now,
    updatedAt: now,
  }
}

function createGraphId() {
  return `graph_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function normalizeSavedCustomGraph(entry: unknown): SavedCustomGraph | null {
  if (!entry || typeof entry !== 'object') {
    return null
  }

  const candidate = entry as {
    id?: unknown
    spec?: unknown
    createdAt?: unknown
    updatedAt?: unknown
  }
  const spec = normalizeGraphSpec(candidate.spec)

  if (!spec || typeof candidate.id !== 'string') {
    return null
  }

  return {
    id: candidate.id,
    spec,
    createdAt:
      typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString(),
    updatedAt:
      typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
  }
}

function normalizeGraphSpec(value: unknown): GraphSpec | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Record<string, unknown>
  if (
    typeof candidate.chartType !== 'string' ||
    !VALID_CHART_TYPES.has(candidate.chartType as GraphChartType)
  ) {
    return null
  }

  const chartType = candidate.chartType as GraphChartType
  const fallback = getDefaultGraphSpec(chartType)

  return {
    ...fallback,
    title: typeof candidate.title === 'string' ? candidate.title : fallback.title,
    xField: normalizeField(candidate.xField, fallback.xField),
    yField: normalizeField(candidate.yField, fallback.yField),
    zField: normalizeField(candidate.zField, fallback.zField),
    groupField: normalizeField(candidate.groupField, fallback.groupField),
    rowField: normalizeField(candidate.rowField, fallback.rowField),
    columnField: normalizeField(candidate.columnField, fallback.columnField),
    aggregation:
      typeof candidate.aggregation === 'string' &&
      VALID_AGGREGATIONS.has(candidate.aggregation as GraphAggregation)
        ? (candidate.aggregation as GraphAggregation)
        : fallback.aggregation,
    sortBy:
      typeof candidate.sortBy === 'string' && VALID_SORT_BY.has(candidate.sortBy as GraphSortBy)
        ? (candidate.sortBy as GraphSortBy)
        : fallback.sortBy,
    sortOrder:
      typeof candidate.sortOrder === 'string' &&
      VALID_SORT_ORDER.has(candidate.sortOrder as GraphSortOrder)
        ? (candidate.sortOrder as GraphSortOrder)
        : fallback.sortOrder,
    limit: normalizeLimit(candidate.limit, fallback.limit),
    filterField: normalizeDimensionField(candidate.filterField, fallback.filterField),
    filterValue:
      typeof candidate.filterValue === 'string' ? candidate.filterValue : fallback.filterValue,
    chartType,
  }
}

function normalizeField(value: unknown, fallback: GraphFieldId | null): GraphFieldId | null {
  if (value === null) return null

  return typeof value === 'string' && VALID_FIELD_IDS.has(value as GraphFieldId)
    ? (value as GraphFieldId)
    : fallback
}

function normalizeDimensionField(
  value: unknown,
  fallback: GraphDimensionFieldId | null,
): GraphDimensionFieldId | null {
  if (value === null) return null

  return typeof value === 'string' && VALID_DIMENSION_FIELD_IDS.has(value as GraphDimensionFieldId)
    ? (value as GraphDimensionFieldId)
    : fallback
}

function normalizeLimit(value: unknown, fallback: number | null) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : fallback
}
