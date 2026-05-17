import { parseISO } from 'date-fns'

import { formatMonthLabel } from '@/features/analytics/time'
import {
  formatDate,
  getLocalDayKey,
  getLocalMonthKey,
  getZonedDatePart,
} from '@/features/analytics/date'
import { resolvePaymentMethodType } from '@/features/analytics/payment-methods'
import type { Expense } from '@/types/expense'

export type GraphChartType = 'bar' | 'line' | 'scatter' | 'pivot'
export type GraphAggregation = 'sum' | 'average' | 'count'
export type GraphSortBy = 'label' | 'value'
export type GraphSortOrder = 'asc' | 'desc'
export type GraphDimensionFieldId =
  | 'category'
  | 'paymentMethod'
  | 'month'
  | 'day'
  | 'weekday'
  | 'currency'
export type GraphMeasureFieldId = 'amount' | 'dayOfMonth' | 'noteLength'
export type GraphFieldId = GraphDimensionFieldId | GraphMeasureFieldId

export interface GraphSpec {
  title: string
  chartType: GraphChartType
  xField: GraphFieldId | null
  yField: GraphFieldId | null
  zField: GraphFieldId | null
  groupField: GraphFieldId | null
  rowField: GraphFieldId | null
  columnField: GraphFieldId | null
  aggregation: GraphAggregation
  sortBy: GraphSortBy
  sortOrder: GraphSortOrder
  limit: number | null
  filterField: GraphDimensionFieldId | null
  filterValue: string | null
}

export interface GraphFieldDefinition {
  id: GraphFieldId
  label: string
  kind: 'dimension' | 'measure'
  valueType: 'categorical' | 'temporal' | 'numeric'
  description: string
}

export interface GraphDimensionOption {
  value: string
  label: string
}

export interface GraphSeriesPoint {
  xKey: string
  xLabel: string
  value: number
}

export interface GraphSeries {
  key: string
  label: string
  points: GraphSeriesPoint[]
}

export interface AggregatedGraphModel {
  chartType: 'bar' | 'line'
  xField: GraphDimensionFieldId
  yField: GraphMeasureFieldId | null
  aggregation: GraphAggregation
  groups: GraphSeries[]
  xLabels: string[]
  maxValue: number
}

export interface ScatterGraphPoint {
  id: string
  x: number
  y: number
  z: number
  label: string
  group: string
}

export interface ScatterGraphModel {
  chartType: 'scatter'
  xField: GraphMeasureFieldId
  yField: GraphMeasureFieldId
  zField: GraphMeasureFieldId | null
  points: ScatterGraphPoint[]
  maxX: number
  maxY: number
  maxZ: number
}

export interface PivotGraphModel {
  chartType: 'pivot'
  rows: string[]
  columns: string[]
  values: Record<string, number>
  rowTotals: Record<string, number>
  columnTotals: Record<string, number>
  grandTotal: number
  aggregation: GraphAggregation
  valueField: GraphMeasureFieldId | null
}

export type CustomGraphModel = AggregatedGraphModel | ScatterGraphModel | PivotGraphModel

const WEEKDAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const GRAPH_FIELD_DEFINITIONS: GraphFieldDefinition[] = [
  {
    id: 'category',
    label: 'Category',
    kind: 'dimension',
    valueType: 'categorical',
    description: 'Expense category label',
  },
  {
    id: 'paymentMethod',
    label: 'Payment method',
    kind: 'dimension',
    valueType: 'categorical',
    description: 'Normalized payment method, including Other',
  },
  {
    id: 'month',
    label: 'Month',
    kind: 'dimension',
    valueType: 'temporal',
    description: 'Local month bucket',
  },
  {
    id: 'day',
    label: 'Day',
    kind: 'dimension',
    valueType: 'temporal',
    description: 'Local calendar day',
  },
  {
    id: 'weekday',
    label: 'Weekday',
    kind: 'dimension',
    valueType: 'categorical',
    description: 'Day of the week in local time',
  },
  {
    id: 'currency',
    label: 'Currency',
    kind: 'dimension',
    valueType: 'categorical',
    description: 'Tracked currency code',
  },
  {
    id: 'amount',
    label: 'Amount',
    kind: 'measure',
    valueType: 'numeric',
    description: 'Absolute spend amount',
  },
  {
    id: 'dayOfMonth',
    label: 'Day of month',
    kind: 'measure',
    valueType: 'numeric',
    description: 'Numeric local day inside the month',
  },
  {
    id: 'noteLength',
    label: 'Note length',
    kind: 'measure',
    valueType: 'numeric',
    description: 'Character count for the note field',
  },
]

export const DEFAULT_GRAPH_SPECS: Record<GraphChartType, GraphSpec> = {
  bar: {
    title: 'Spend by category',
    chartType: 'bar',
    xField: 'category',
    yField: 'amount',
    zField: null,
    groupField: 'paymentMethod',
    rowField: 'category',
    columnField: 'paymentMethod',
    aggregation: 'sum',
    sortBy: 'value',
    sortOrder: 'desc',
    limit: null,
    filterField: null,
    filterValue: null,
  },
  line: {
    title: 'Spend over days',
    chartType: 'line',
    xField: 'day',
    yField: 'amount',
    zField: null,
    groupField: 'paymentMethod',
    rowField: 'category',
    columnField: 'paymentMethod',
    aggregation: 'sum',
    sortBy: 'label',
    sortOrder: 'asc',
    limit: null,
    filterField: null,
    filterValue: null,
  },
  scatter: {
    title: 'Expense distribution',
    chartType: 'scatter',
    xField: 'dayOfMonth',
    yField: 'amount',
    zField: 'noteLength',
    groupField: 'paymentMethod',
    rowField: 'category',
    columnField: 'paymentMethod',
    aggregation: 'sum',
    sortBy: 'label',
    sortOrder: 'asc',
    limit: null,
    filterField: null,
    filterValue: null,
  },
  pivot: {
    title: 'Category x payment method',
    chartType: 'pivot',
    xField: 'category',
    yField: 'amount',
    zField: null,
    groupField: 'paymentMethod',
    rowField: 'category',
    columnField: 'paymentMethod',
    aggregation: 'sum',
    sortBy: 'value',
    sortOrder: 'desc',
    limit: null,
    filterField: null,
    filterValue: null,
  },
}

export function getDefaultGraphSpec(chartType: GraphChartType): GraphSpec {
  return { ...DEFAULT_GRAPH_SPECS[chartType] }
}

export function cloneGraphSpec(spec: GraphSpec): GraphSpec {
  return { ...spec }
}

export function getGraphFieldDefinition(fieldId: GraphFieldId | null | undefined) {
  return GRAPH_FIELD_DEFINITIONS.find((field) => field.id === fieldId) ?? null
}

export function getGraphFieldsByKind(kind: GraphFieldDefinition['kind']) {
  return GRAPH_FIELD_DEFINITIONS.filter((field) => field.kind === kind)
}

export function getGraphDimensionOptions(
  expenses: Expense[],
  fieldId: GraphDimensionFieldId,
  timeZone?: string | null,
): GraphDimensionOption[] {
  const values = new Set<string>()

  for (const expense of expenses) {
    values.add(getDimensionValue(expense, fieldId, timeZone || undefined))
  }

  return sortDimensionValues(fieldId, Array.from(values)).map((value) => ({
    value,
    label: formatDimensionValue(fieldId, value),
  }))
}

export function validateGraphSpec(spec: GraphSpec): string[] {
  const issues: string[] = []

  if (!spec.title.trim()) {
    issues.push('Add a title so the custom graph can be identified later.')
  }

  if (spec.limit !== null && (!Number.isInteger(spec.limit) || spec.limit < 1)) {
    issues.push('Top N should be a whole number greater than zero.')
  }

  if (spec.filterValue && !spec.filterField) {
    issues.push('Choose a filter field before selecting a filter value.')
  }

  if (spec.chartType === 'bar' || spec.chartType === 'line') {
    const xField = getGraphFieldDefinition(spec.xField)
    const yField = getGraphFieldDefinition(spec.yField)
    const groupField = getGraphFieldDefinition(spec.groupField)

    if (!xField || xField.kind !== 'dimension') {
      issues.push('Bar and line charts need a dimension on the x-axis.')
    }

    if (spec.aggregation !== 'count' && (!yField || yField.kind !== 'measure')) {
      issues.push('Bar and line charts need a numeric y-axis field unless aggregation is count.')
    }

    if (groupField && groupField.kind !== 'dimension') {
      issues.push('Grouped bar and line charts need a dimension for the series field.')
    }

    if (spec.groupField && spec.groupField === spec.xField) {
      issues.push('Choose a different series field than the x-axis field.')
    }
  }

  if (spec.chartType === 'scatter') {
    const xField = getGraphFieldDefinition(spec.xField)
    const yField = getGraphFieldDefinition(spec.yField)
    const zField = getGraphFieldDefinition(spec.zField)
    const groupField = getGraphFieldDefinition(spec.groupField)

    if (!xField || xField.kind !== 'measure') {
      issues.push('Scatter charts need a numeric x-axis field.')
    }

    if (!yField || yField.kind !== 'measure') {
      issues.push('Scatter charts need a numeric y-axis field.')
    }

    if (zField && zField.kind !== 'measure') {
      issues.push('Scatter chart z-axis values must be numeric because they control bubble size.')
    }

    if (groupField && groupField.kind !== 'dimension') {
      issues.push('Scatter chart grouping must use a dimension field.')
    }

    if (spec.xField && spec.xField === spec.yField) {
      issues.push('Use different fields on the scatter x and y axes.')
    }

    if (spec.zField && (spec.zField === spec.xField || spec.zField === spec.yField)) {
      issues.push('Use a different z-axis field so bubble size adds new information.')
    }
  }

  if (spec.chartType === 'pivot') {
    const rowField = getGraphFieldDefinition(spec.rowField)
    const columnField = getGraphFieldDefinition(spec.columnField)
    const valueField = getGraphFieldDefinition(spec.yField)

    if (!rowField || rowField.kind !== 'dimension') {
      issues.push('Pivot tables need a row dimension.')
    }

    if (!columnField || columnField.kind !== 'dimension') {
      issues.push('Pivot tables need a column dimension.')
    }

    if (spec.aggregation !== 'count' && (!valueField || valueField.kind !== 'measure')) {
      issues.push('Pivot tables need a numeric value field unless aggregation is count.')
    }

    if (spec.rowField && spec.rowField === spec.columnField) {
      issues.push('Use different fields for pivot rows and columns.')
    }
  }

  return issues
}

export function buildCustomGraphModel(
  expenses: Expense[],
  spec: GraphSpec,
  timeZone?: string | null,
): CustomGraphModel {
  const filteredExpenses = filterExpensesForGraphSpec(expenses, spec, timeZone || undefined)

  switch (spec.chartType) {
    case 'bar':
    case 'line':
      return buildAggregatedGraphModel(filteredExpenses, spec, timeZone || undefined)
    case 'scatter':
      return buildScatterGraphModel(filteredExpenses, spec, timeZone || undefined)
    case 'pivot':
      return buildPivotGraphModel(filteredExpenses, spec, timeZone || undefined)
  }
}

export function graphSpecToDsl(spec: GraphSpec): string {
  if (spec.chartType === 'pivot') {
    return [
      `graph \"${spec.title.trim() || 'Untitled graph'}\" {`,
      `  type: ${spec.chartType}`,
      `  rows: ${spec.rowField ?? 'unset'}`,
      `  columns: ${spec.columnField ?? 'unset'}`,
      `  value: ${spec.yField ?? 'count'}`,
      `  aggregate: ${spec.aggregation}`,
      `  sort: ${spec.sortBy} ${spec.sortOrder}`,
      spec.limit ? `  top: ${spec.limit}` : null,
      spec.filterField && spec.filterValue
        ? `  where: ${spec.filterField} = \"${spec.filterValue}\"`
        : null,
      '}',
    ]
      .filter(Boolean)
      .join('\n')
  }

  return [
    `graph \"${spec.title.trim() || 'Untitled graph'}\" {`,
    `  type: ${spec.chartType}`,
    `  x: ${spec.xField ?? 'unset'}`,
    `  y: ${spec.yField ?? (spec.chartType === 'scatter' ? 'unset' : 'count')}`,
    spec.zField ? `  z: ${spec.zField}` : null,
    spec.groupField ? `  group: ${spec.groupField}` : null,
    spec.chartType === 'scatter' ? null : `  aggregate: ${spec.aggregation}`,
    spec.chartType === 'scatter' ? null : `  sort: ${spec.sortBy} ${spec.sortOrder}`,
    spec.chartType === 'scatter' || !spec.limit ? null : `  top: ${spec.limit}`,
    spec.filterField && spec.filterValue
      ? `  where: ${spec.filterField} = \"${spec.filterValue}\"`
      : null,
    '}',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildAggregatedGraphModel(
  expenses: Expense[],
  spec: GraphSpec,
  timeZone?: string,
): AggregatedGraphModel {
  const chartType: AggregatedGraphModel['chartType'] = spec.chartType === 'line' ? 'line' : 'bar'
  const xField = spec.xField as GraphDimensionFieldId
  const yField = spec.aggregation === 'count' ? null : (spec.yField as GraphMeasureFieldId)
  const grouped = new Map<string, { sum: number; count: number; xKey: string; groupKey: string }>()
  const xKeys = new Set<string>()
  const groupKeys = new Set<string>()

  for (const expense of expenses) {
    const xKey = getDimensionValue(expense, xField, timeZone)
    const groupKey = spec.groupField
      ? getDimensionValue(expense, spec.groupField as GraphDimensionFieldId, timeZone)
      : 'All expenses'
    const value = spec.aggregation === 'count' ? 1 : getMeasureValue(expense, yField!, timeZone)
    const key = `${xKey}:::${groupKey}`
    const current = grouped.get(key) ?? { sum: 0, count: 0, xKey, groupKey }

    current.sum += value
    current.count += 1

    grouped.set(key, current)
    xKeys.add(xKey)
    groupKeys.add(groupKey)
  }

  const xMetrics = new Map<string, { sum: number; count: number }>()

  for (const cell of grouped.values()) {
    const metric = xMetrics.get(cell.xKey) ?? { sum: 0, count: 0 }
    metric.sum += cell.sum
    metric.count += cell.count
    xMetrics.set(cell.xKey, metric)
  }

  const sortedXKeys = sortDimensionKeysForSpec(spec, xField, Array.from(xKeys), xMetrics).slice(
    0,
    spec.limit ?? Number.POSITIVE_INFINITY,
  )
  const sortedGroupKeys = spec.groupField
    ? sortDimensionValues(spec.groupField as GraphDimensionFieldId, Array.from(groupKeys))
    : ['All expenses']
  const groups = sortedGroupKeys.map((groupKey) => ({
    key: groupKey,
    label: formatDimensionValue(spec.groupField as GraphDimensionFieldId | null, groupKey),
    points: sortedXKeys.map((xKey) => {
      const cell = grouped.get(`${xKey}:::${groupKey}`)
      const value = !cell ? 0 : spec.aggregation === 'average' ? cell.sum / cell.count : cell.sum

      return {
        xKey,
        xLabel: formatDimensionValue(xField, xKey),
        value,
      }
    }),
  }))
  const maxValue = Math.max(
    0,
    ...groups.flatMap((group) => group.points.map((point) => point.value)),
  )

  return {
    chartType,
    xField,
    yField,
    aggregation: spec.aggregation,
    groups,
    xLabels: sortedXKeys.map((xKey) => formatDimensionValue(xField, xKey)),
    maxValue,
  }
}

function buildScatterGraphModel(
  expenses: Expense[],
  spec: GraphSpec,
  timeZone?: string,
): ScatterGraphModel {
  const xField = spec.xField as GraphMeasureFieldId
  const yField = spec.yField as GraphMeasureFieldId
  const zField = (spec.zField as GraphMeasureFieldId | null) ?? null
  const points = expenses.map((expense) => {
    const x = getMeasureValue(expense, xField, timeZone)
    const y = getMeasureValue(expense, yField, timeZone)
    const z = zField ? getMeasureValue(expense, zField, timeZone) : 1
    const group = spec.groupField
      ? formatDimensionValue(
          spec.groupField as GraphDimensionFieldId,
          getDimensionValue(expense, spec.groupField as GraphDimensionFieldId, timeZone),
        )
      : 'All expenses'

    return {
      id: expense.id,
      x,
      y,
      z,
      group,
      label: `${expense.category} • ${group} • ${getLocalDayKey(expense.date, timeZone)}`,
    }
  })

  return {
    chartType: 'scatter',
    xField,
    yField,
    zField,
    points,
    maxX: Math.max(0, ...points.map((point) => point.x)),
    maxY: Math.max(0, ...points.map((point) => point.y)),
    maxZ: Math.max(0, ...points.map((point) => point.z)),
  }
}

function buildPivotGraphModel(
  expenses: Expense[],
  spec: GraphSpec,
  timeZone?: string,
): PivotGraphModel {
  const rowField = spec.rowField as GraphDimensionFieldId
  const columnField = spec.columnField as GraphDimensionFieldId
  const valueField = spec.aggregation === 'count' ? null : (spec.yField as GraphMeasureFieldId)
  const cells = new Map<string, { sum: number; count: number }>()
  const rowMetrics = new Map<string, { sum: number; count: number }>()
  const rowKeys = new Set<string>()
  const columnKeys = new Set<string>()

  for (const expense of expenses) {
    const rowKey = getDimensionValue(expense, rowField, timeZone)
    const columnKey = getDimensionValue(expense, columnField, timeZone)
    const value = spec.aggregation === 'count' ? 1 : getMeasureValue(expense, valueField!, timeZone)
    const cellKey = `${rowKey}:::${columnKey}`
    const current = cells.get(cellKey) ?? { sum: 0, count: 0 }
    const rowMetric = rowMetrics.get(rowKey) ?? { sum: 0, count: 0 }

    current.sum += value
    current.count += 1
    rowMetric.sum += value
    rowMetric.count += 1

    cells.set(cellKey, current)
    rowMetrics.set(rowKey, rowMetric)
    rowKeys.add(rowKey)
    columnKeys.add(columnKey)
  }

  const sortedRowKeys = sortDimensionKeysForSpec(
    spec,
    rowField,
    Array.from(rowKeys),
    rowMetrics,
  ).slice(0, spec.limit ?? Number.POSITIVE_INFINITY)
  const rows = sortedRowKeys.map((key) => formatDimensionValue(rowField, key))
  const columns = sortDimensionValues(columnField, Array.from(columnKeys)).map((key) =>
    formatDimensionValue(columnField, key),
  )
  const rowTotals: Record<string, number> = {}
  const columnTotals: Record<string, number> = {}
  const values: Record<string, number> = {}
  let grandTotal = 0

  for (const rawRowKey of sortedRowKeys) {
    const rowLabel = formatDimensionValue(rowField, rawRowKey)

    for (const rawColumnKey of sortDimensionValues(columnField, Array.from(columnKeys))) {
      const columnLabel = formatDimensionValue(columnField, rawColumnKey)
      const cell = cells.get(`${rawRowKey}:::${rawColumnKey}`)
      const value = !cell ? 0 : spec.aggregation === 'average' ? cell.sum / cell.count : cell.sum

      values[`${rowLabel}:::${columnLabel}`] = value
      rowTotals[rowLabel] = (rowTotals[rowLabel] ?? 0) + value
      columnTotals[columnLabel] = (columnTotals[columnLabel] ?? 0) + value
      grandTotal += value
    }
  }

  return {
    chartType: 'pivot',
    rows,
    columns,
    values,
    rowTotals,
    columnTotals,
    grandTotal,
    aggregation: spec.aggregation,
    valueField,
  }
}

function getDimensionValue(
  expense: Expense,
  fieldId: GraphDimensionFieldId,
  timeZone?: string,
): string {
  switch (fieldId) {
    case 'category':
      return expense.category || 'Other'
    case 'paymentMethod':
      return resolvePaymentMethodType(expense.paymentMethod?.type)
    case 'month':
      return getLocalMonthKey(expense.date, timeZone)
    case 'day':
      return getLocalDayKey(expense.date, timeZone)
    case 'weekday': {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        timeZone,
      }).format(parseISO(expense.date))
    }
    case 'currency':
      return expense.currency || 'INR'
  }
}

function getMeasureValue(
  expense: Expense,
  fieldId: GraphMeasureFieldId,
  timeZone?: string,
): number {
  switch (fieldId) {
    case 'amount':
      return Math.abs(expense.amount)
    case 'dayOfMonth':
      return Number.parseInt(getZonedDatePart(expense.date, timeZone, 'day'), 10) || 0
    case 'noteLength':
      return expense.note.trim().length
  }
}

function sortDimensionValues(fieldId: GraphDimensionFieldId, values: string[]): string[] {
  if (fieldId === 'weekday') {
    return [...values].sort(
      (left, right) => WEEKDAY_ORDER.indexOf(left) - WEEKDAY_ORDER.indexOf(right),
    )
  }

  return [...values].sort((left, right) => left.localeCompare(right))
}

function filterExpensesForGraphSpec(expenses: Expense[], spec: GraphSpec, timeZone?: string) {
  if (!spec.filterField || !spec.filterValue) {
    return expenses
  }

  return expenses.filter(
    (expense) => getDimensionValue(expense, spec.filterField!, timeZone) === spec.filterValue,
  )
}

function sortDimensionKeysForSpec(
  spec: GraphSpec,
  fieldId: GraphDimensionFieldId,
  keys: string[],
  metrics: Map<string, { sum: number; count: number }>,
) {
  const labelSortedKeys = sortDimensionValues(fieldId, keys)

  if (spec.sortBy === 'label') {
    return spec.sortOrder === 'asc' ? labelSortedKeys : [...labelSortedKeys].reverse()
  }

  return [...keys].sort((left, right) => {
    const leftMetric = metrics.get(left) ?? { sum: 0, count: 0 }
    const rightMetric = metrics.get(right) ?? { sum: 0, count: 0 }
    const leftValue =
      spec.aggregation === 'average' ? leftMetric.sum / (leftMetric.count || 1) : leftMetric.sum
    const rightValue =
      spec.aggregation === 'average' ? rightMetric.sum / (rightMetric.count || 1) : rightMetric.sum

    if (leftValue === rightValue) {
      return formatDimensionValue(fieldId, left).localeCompare(formatDimensionValue(fieldId, right))
    }

    return spec.sortOrder === 'asc' ? leftValue - rightValue : rightValue - leftValue
  })
}

function formatDimensionValue(fieldId: GraphDimensionFieldId | null, value: string): string {
  switch (fieldId) {
    case 'month':
      return formatMonthLabel(value)
    case 'day':
      return formatDate(value, 'MMM d')
    default:
      return value
  }
}
