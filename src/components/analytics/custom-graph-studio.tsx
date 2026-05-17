'use client'

import { scaleBand, scaleLinear, scalePoint } from 'd3-scale'
import { line } from 'd3-shape'
import { useEffect, useMemo, useState } from 'react'
import { CopyIcon, PencilLineIcon, PlusIcon, SaveIcon, Table2Icon, Trash2Icon } from 'lucide-react'

import { formatCurrencyValue } from '@/components/analytics/analytics-charts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  buildCustomGraphModel,
  cloneGraphSpec,
  getDefaultGraphSpec,
  getGraphDimensionOptions,
  getGraphFieldDefinition,
  getGraphFieldsByKind,
  graphSpecToDsl,
  validateGraphSpec,
  type AggregatedGraphModel,
  type CustomGraphModel,
  type GraphChartType,
  type GraphFieldId,
  type GraphMeasureFieldId,
  type GraphSpec,
  type PivotGraphModel,
  type ScatterGraphModel,
} from '@/features/analytics/custom-graphs'
import {
  createSavedCustomGraph,
  duplicateSavedCustomGraph,
  loadSavedCustomGraphs,
  persistSavedCustomGraphs,
  updateSavedCustomGraph,
  type SavedCustomGraph,
} from '@/features/analytics/custom-graph-storage'
import { cn } from '@/lib/utils'
import type { Expense } from '@/types/expense'

const GRAPH_TYPE_LABELS: Record<GraphChartType, string> = {
  bar: 'Bar',
  line: 'Line',
  scatter: 'Scatter',
  pivot: 'Pivot',
}

const SERIES_COLORS = ['#8f88c8', '#b98f74', '#7ca28e', '#c79b66', '#8a9abb', '#c5a3bb']

export function CustomGraphStudio({
  currency,
  expenses,
  timeZone,
}: {
  currency: string
  expenses: Expense[]
  timeZone?: string | null
}) {
  const [spec, setSpec] = useState<GraphSpec>(() => getDefaultGraphSpec('bar'))
  const [savedGraphs, setSavedGraphs] = useState<SavedCustomGraph[]>([])
  const [selectedSavedGraphId, setSelectedSavedGraphId] = useState<string | null>(null)
  const [renamingGraphId, setRenamingGraphId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const issues = useMemo(() => validateGraphSpec(spec), [spec])
  const filterOptions = useMemo(
    () => (spec.filterField ? getGraphDimensionOptions(expenses, spec.filterField, timeZone) : []),
    [expenses, spec.filterField, timeZone],
  )
  const activeSavedGraph =
    savedGraphs.find((savedGraph) => savedGraph.id === selectedSavedGraphId) ?? null
  const isDirty = activeSavedGraph
    ? JSON.stringify(activeSavedGraph.spec) !== JSON.stringify(spec)
    : true
  const model = useMemo<CustomGraphModel | null>(() => {
    if (issues.length) return null

    return buildCustomGraphModel(expenses, spec, timeZone)
  }, [expenses, issues.length, spec, timeZone])
  const graphDsl = useMemo(() => graphSpecToDsl(spec), [spec])

  useEffect(() => {
    setSavedGraphs(loadSavedCustomGraphs())
  }, [])

  function updateSpec(patch: Partial<GraphSpec>) {
    setSpec((current) => ({ ...current, ...patch }))
  }

  function handleChartTypeChange(nextType: GraphChartType) {
    setSpec((current) => ({
      ...getDefaultGraphSpec(nextType),
      title: current.title,
    }))
    setSelectedSavedGraphId(null)
  }

  function handleSaveAsNew() {
    if (issues.length) return

    const nextEntry = createSavedCustomGraph(cloneGraphSpec(spec))
    const nextSavedGraphs = [nextEntry, ...savedGraphs].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    )

    setSavedGraphs(nextSavedGraphs)
    setSelectedSavedGraphId(nextEntry.id)
    persistSavedCustomGraphs(nextSavedGraphs)
  }

  function handleUpdateSaved() {
    if (!activeSavedGraph || issues.length) return

    const nextSavedGraphs = savedGraphs
      .map((entry) =>
        entry.id === activeSavedGraph.id
          ? updateSavedCustomGraph(entry, cloneGraphSpec(spec))
          : entry,
      )
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

    setSavedGraphs(nextSavedGraphs)
    persistSavedCustomGraphs(nextSavedGraphs)
  }

  function handleLoadSaved(entry: SavedCustomGraph) {
    setSpec(cloneGraphSpec(entry.spec))
    setSelectedSavedGraphId(entry.id)
    setRenamingGraphId(null)
  }

  function handleDeleteSaved(entry: SavedCustomGraph) {
    const nextSavedGraphs = savedGraphs.filter((savedGraph) => savedGraph.id !== entry.id)
    setSavedGraphs(nextSavedGraphs)
    if (selectedSavedGraphId === entry.id) {
      setSelectedSavedGraphId(null)
      setSpec(getDefaultGraphSpec('bar'))
    }
    persistSavedCustomGraphs(nextSavedGraphs)
  }

  function handleResetDraft() {
    setSelectedSavedGraphId(null)
    setSpec(getDefaultGraphSpec(spec.chartType))
  }

  function handleDuplicateSaved(entry: SavedCustomGraph) {
    const duplicate = duplicateSavedCustomGraph(entry)
    const nextSavedGraphs = [duplicate, ...savedGraphs].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    )

    setSavedGraphs(nextSavedGraphs)
    setSelectedSavedGraphId(duplicate.id)
    setSpec(cloneGraphSpec(duplicate.spec))
    persistSavedCustomGraphs(nextSavedGraphs)
  }

  function handleStartRename(entry: SavedCustomGraph) {
    setRenamingGraphId(entry.id)
    setRenameDraft(entry.spec.title)
  }

  function handleRenameSaved(entry: SavedCustomGraph) {
    const trimmedTitle = renameDraft.trim()
    if (!trimmedTitle) return

    const nextSavedGraphs = savedGraphs
      .map((savedGraph) =>
        savedGraph.id === entry.id
          ? updateSavedCustomGraph(savedGraph, {
              ...savedGraph.spec,
              title: trimmedTitle,
            })
          : savedGraph,
      )
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

    setSavedGraphs(nextSavedGraphs)
    if (selectedSavedGraphId === entry.id) {
      setSpec((current) => ({ ...current, title: trimmedTitle }))
    }
    setRenamingGraphId(null)
    persistSavedCustomGraphs(nextSavedGraphs)
  }

  function handleFilterFieldChange(value: GraphFieldId | null) {
    updateSpec({
      filterField: value as GraphSpec['filterField'],
      filterValue: null,
    })
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="analytics-card rounded-[2rem] text-white shadow-[0_18px_52px_rgba(10,8,18,0.16)]">
        <CardHeader className="gap-4">
          <div className="space-y-1">
            <CardTitle className="text-white">Custom graph studio</CardTitle>
            <CardDescription className="text-white/72">
              Build your own charts from synced expenses, validate the minimum fields needed for
              each graph type, and save them locally for later reuse.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(GRAPH_TYPE_LABELS) as GraphChartType[]).map((chartType) => (
              <Button
                key={chartType}
                size="sm"
                variant="ghost"
                className={cn(
                  'rounded-full border px-3 text-white',
                  spec.chartType === chartType
                    ? 'border-white/16 bg-white/12 hover:bg-white/15'
                    : 'border-white/10 bg-white/7 text-white/76 hover:bg-white/11 hover:text-white',
                )}
                onClick={() => handleChartTypeChange(chartType)}
              >
                {GRAPH_TYPE_LABELS[chartType]}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <StudioField label="Graph title">
              <Input
                value={spec.title}
                onChange={(event) => updateSpec({ title: event.target.value })}
                className="border-white/12 bg-white/8 text-white placeholder:text-white/36"
                placeholder="Monthly spend vs payment method"
              />
            </StudioField>

            {spec.chartType !== 'scatter' ? (
              <StudioField label="Aggregation">
                <NativeSelect
                  value={spec.aggregation}
                  onChange={(event) =>
                    updateSpec({
                      aggregation: event.target.value as GraphSpec['aggregation'],
                    })
                  }
                >
                  <option value="sum">Sum</option>
                  <option value="average">Average</option>
                  <option value="count">Count</option>
                </NativeSelect>
              </StudioField>
            ) : (
              <StudioField label="Marker sizing">
                <NativeSelect
                  value={spec.zField ?? ''}
                  onChange={(event) => updateSpec({ zField: toNullableField(event.target.value) })}
                >
                  <option value="">No z-axis</option>
                  {getGraphFieldsByKind('measure').map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </NativeSelect>
              </StudioField>
            )}
          </div>

          <ChartFieldControls spec={spec} onChange={updateSpec} />

          <div className="grid gap-3 md:grid-cols-4">
            {spec.chartType !== 'scatter' ? (
              <StudioField label="Sort by">
                <NativeSelect
                  value={spec.sortBy}
                  onChange={(event) =>
                    updateSpec({ sortBy: event.target.value as GraphSpec['sortBy'] })
                  }
                >
                  <option value="label">Label</option>
                  <option value="value">Value</option>
                </NativeSelect>
              </StudioField>
            ) : (
              <StudioField label="Sort by">
                <NativeSelect value="label" disabled>
                  <option value="label">Input order</option>
                </NativeSelect>
              </StudioField>
            )}

            {spec.chartType !== 'scatter' ? (
              <StudioField label="Sort order">
                <NativeSelect
                  value={spec.sortOrder}
                  onChange={(event) =>
                    updateSpec({ sortOrder: event.target.value as GraphSpec['sortOrder'] })
                  }
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </NativeSelect>
              </StudioField>
            ) : (
              <StudioField label="Sort order">
                <NativeSelect value="asc" disabled>
                  <option value="asc">Not used</option>
                </NativeSelect>
              </StudioField>
            )}

            <StudioField label="Top N">
              <Input
                type="number"
                min="1"
                value={spec.limit ?? ''}
                onChange={(event) =>
                  updateSpec({
                    limit: event.target.value ? Number.parseInt(event.target.value, 10) : null,
                  })
                }
                className="border-white/12 bg-white/8 text-white placeholder:text-white/36"
                placeholder="All"
                disabled={spec.chartType === 'scatter'}
              />
            </StudioField>

            <StudioField label="Filter field">
              <FieldSelect
                kind="dimension"
                value={spec.filterField}
                includeBlank
                blankLabel="No filter"
                onChange={handleFilterFieldChange}
              />
            </StudioField>
          </div>

          {spec.filterField ? (
            <div className="grid gap-3 md:grid-cols-2">
              <StudioField label="Filter value">
                <NativeSelect
                  value={spec.filterValue ?? ''}
                  onChange={(event) => updateSpec({ filterValue: event.target.value || null })}
                >
                  <option value="">All values</option>
                  {filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect>
              </StudioField>
              <div className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/64">
                Filter narrows the custom graph before aggregation. This keeps saved graphs focused
                without changing the main dashboard filters.
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              className="rounded-full border border-white/12 bg-white/10 text-white hover:bg-white/14"
              onClick={handleSaveAsNew}
              disabled={issues.length > 0}
            >
              <SaveIcon />
              Save as new
            </Button>
            <Button
              variant="ghost"
              className="rounded-full border border-white/12 bg-white/8 text-white hover:bg-white/12"
              onClick={handleUpdateSaved}
              disabled={!activeSavedGraph || !isDirty || issues.length > 0}
            >
              <PencilLineIcon />
              Update selected
            </Button>
            <Button
              variant="ghost"
              className="rounded-full border border-white/10 bg-white/7 text-white/82 hover:bg-white/10"
              onClick={handleResetDraft}
            >
              <PlusIcon />
              New draft
            </Button>
          </div>

          <div className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-white">Generated graph DSL</div>
                <div className="text-xs text-white/58">
                  Local-only for now. This is the export shape we can later sync to GitHub.
                </div>
              </div>
              <Table2Icon className="size-4 text-white/48" />
            </div>
            <pre className="mt-3 overflow-x-auto rounded-[1rem] border border-white/8 bg-[#171423]/70 p-3 text-xs leading-5 text-white/76">
              {graphDsl}
            </pre>
          </div>

          {issues.length ? (
            <div className="rounded-[1.25rem] border border-rose-200/20 bg-rose-300/8 px-4 py-3 text-sm text-rose-100/90">
              {issues.map((issue) => (
                <div key={issue}>{issue}</div>
              ))}
            </div>
          ) : (
            <CustomGraphPreview currency={currency} model={model} spec={spec} />
          )}
        </CardContent>
      </Card>

      <Card className="analytics-card rounded-[2rem] text-white shadow-[0_18px_52px_rgba(10,8,18,0.16)]">
        <CardHeader>
          <CardTitle className="text-white">Saved locally</CardTitle>
          <CardDescription className="text-white/72">
            Graphs are stored in this browser only. GitHub sync can come later without changing the
            graph spec format.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {savedGraphs.length ? (
            savedGraphs.map((entry) => {
              const isSelected = entry.id === selectedSavedGraphId

              return (
                <div
                  key={entry.id}
                  className={cn(
                    'rounded-[1.2rem] border px-4 py-3 transition-colors',
                    isSelected ? 'border-white/16 bg-white/12' : 'border-white/10 bg-white/7',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {renamingGraphId === entry.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={renameDraft}
                            onChange={(event) => setRenameDraft(event.target.value)}
                            className="h-8 border-white/12 bg-white/8 text-white"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full border border-white/10 bg-white/8 text-white/82 hover:bg-white/12"
                            onClick={() => handleRenameSaved(entry)}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <div className="font-medium text-white">{entry.spec.title}</div>
                      )}
                      <div className="mt-1 text-xs text-white/54">
                        {GRAPH_TYPE_LABELS[entry.spec.chartType]} • updated{' '}
                        {new Date(entry.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full border border-white/10 bg-white/8 text-white/82 hover:bg-white/12"
                        onClick={() => handleLoadSaved(entry)}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full border border-white/10 bg-white/8 text-white/82 hover:bg-white/12"
                        onClick={() => handleStartRename(entry)}
                      >
                        <PencilLineIcon />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full border border-white/10 bg-white/8 text-white/82 hover:bg-white/12"
                        onClick={() => handleDuplicateSaved(entry)}
                      >
                        <CopyIcon />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full border border-white/10 bg-white/6 text-white/72 hover:bg-white/10"
                        onClick={() => handleDeleteSaved(entry)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-[1.2rem] border border-white/10 bg-white/7 px-4 py-4 text-sm text-white/68">
              No saved graphs yet. Build one in the studio and store it locally.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function ChartFieldControls({
  spec,
  onChange,
}: {
  spec: GraphSpec
  onChange: (patch: Partial<GraphSpec>) => void
}) {
  if (spec.chartType === 'pivot') {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        <StudioField label="Rows">
          <FieldSelect
            kind="dimension"
            value={spec.rowField}
            onChange={(value) => onChange({ rowField: value })}
          />
        </StudioField>
        <StudioField label="Columns">
          <FieldSelect
            kind="dimension"
            value={spec.columnField}
            onChange={(value) => onChange({ columnField: value })}
          />
        </StudioField>
        <StudioField label="Value field">
          <FieldSelect
            kind="measure"
            value={spec.yField}
            disabled={spec.aggregation === 'count'}
            onChange={(value) => onChange({ yField: value })}
          />
        </StudioField>
      </div>
    )
  }

  if (spec.chartType === 'scatter') {
    return (
      <div className="grid gap-3 md:grid-cols-4">
        <StudioField label="X-axis">
          <FieldSelect
            kind="measure"
            value={spec.xField}
            onChange={(value) => onChange({ xField: value })}
          />
        </StudioField>
        <StudioField label="Y-axis">
          <FieldSelect
            kind="measure"
            value={spec.yField}
            onChange={(value) => onChange({ yField: value })}
          />
        </StudioField>
        <StudioField label="Z-axis">
          <FieldSelect
            kind="measure"
            value={spec.zField}
            includeBlank
            blankLabel="No z-axis"
            onChange={(value) => onChange({ zField: value })}
          />
        </StudioField>
        <StudioField label="Group by">
          <FieldSelect
            kind="dimension"
            value={spec.groupField}
            includeBlank
            blankLabel="Single series"
            onChange={(value) => onChange({ groupField: value })}
          />
        </StudioField>
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <StudioField label="X-axis">
        <FieldSelect
          kind="dimension"
          value={spec.xField}
          onChange={(value) => onChange({ xField: value })}
        />
      </StudioField>
      <StudioField label="Y-axis">
        <FieldSelect
          kind="measure"
          value={spec.yField}
          disabled={spec.aggregation === 'count'}
          onChange={(value) => onChange({ yField: value })}
        />
      </StudioField>
      <StudioField label="Group by">
        <FieldSelect
          kind="dimension"
          value={spec.groupField}
          includeBlank
          blankLabel="Single series"
          onChange={(value) => onChange({ groupField: value })}
        />
      </StudioField>
    </div>
  )
}

function FieldSelect({
  kind,
  value,
  onChange,
  includeBlank = false,
  blankLabel = 'None',
  disabled = false,
}: {
  kind: 'dimension' | 'measure'
  value: GraphFieldId | null
  onChange: (value: GraphFieldId | null) => void
  includeBlank?: boolean
  blankLabel?: string
  disabled?: boolean
}) {
  return (
    <NativeSelect
      value={value ?? ''}
      disabled={disabled}
      onChange={(event) => onChange(toNullableField(event.target.value))}
    >
      {includeBlank ? <option value="">{blankLabel}</option> : null}
      {getGraphFieldsByKind(kind).map((field) => (
        <option key={field.id} value={field.id}>
          {field.label}
        </option>
      ))}
    </NativeSelect>
  )
}

function NativeSelect(props: React.ComponentProps<'select'>) {
  return (
    <select
      {...props}
      className={cn(
        'h-8 w-full rounded-lg border border-white/12 bg-white/8 px-2.5 text-sm text-white outline-none transition-colors focus:border-white/24',
        'disabled:cursor-not-allowed disabled:opacity-50',
        props.className,
      )}
    />
  )
}

function StudioField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5">
      <div className="text-xs uppercase tracking-[0.16em] text-white/50">{label}</div>
      {children}
    </label>
  )
}

function CustomGraphPreview({
  currency,
  model,
  spec,
}: {
  currency: string
  model: CustomGraphModel | null
  spec: GraphSpec
}) {
  if (!model) {
    return null
  }

  if (model.chartType === 'pivot') {
    return <PivotPreview currency={currency} model={model} spec={spec} />
  }

  if (model.chartType === 'scatter') {
    return <ScatterPreview currency={currency} model={model} spec={spec} />
  }

  return <SeriesPreview currency={currency} model={model} spec={spec} />
}

function SeriesPreview({
  currency,
  model,
  spec,
}: {
  currency: string
  model: AggregatedGraphModel
  spec: GraphSpec
}) {
  const width = 760
  const height = 320
  const margin = { top: 20, right: 16, bottom: 48, left: 44 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom
  const xScale =
    model.chartType === 'bar'
      ? scaleBand<string>().domain(model.xLabels).range([0, innerWidth]).padding(0.18)
      : scalePoint<string>().domain(model.xLabels).range([0, innerWidth]).padding(0.5)
  const yScale = scaleLinear()
    .domain([0, model.maxValue || 1])
    .range([innerHeight, 0])
    .nice(4)
  const groupScale = scaleBand<string>()
    .domain(model.groups.map((group) => group.label))
    .range([0, xScale.bandwidth ? xScale.bandwidth() : 0])
    .padding(0.14)
  const tickValues = yScale.ticks(4)

  return (
    <div className="space-y-4 rounded-[1.4rem] border border-white/10 bg-white/7 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">Live preview</div>
          <div className="text-xs text-white/56">
            {GRAPH_TYPE_LABELS[spec.chartType]} chart with {model.groups.length} series.
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-white/62">
          {model.groups.map((group, index) => (
            <span
              key={group.key}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-2.5 py-1"
            >
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: getSeriesColor(group.label, index) }}
              />
              {group.label}
            </span>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="analytics-svg w-full overflow-visible">
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {tickValues.map((tick) => (
            <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
              <line x2={innerWidth} className="analytics-grid-line" />
              <text x={-10} y={4} textAnchor="end" className="analytics-axis-text">
                {formatGraphValue(tick, model.yField, model.aggregation, currency)}
              </text>
            </g>
          ))}

          {model.chartType === 'bar'
            ? model.groups.map((group, groupIndex) => (
                <g key={group.key}>
                  {group.points.map((point) => {
                    const x = (xScale(point.xLabel) ?? 0) + (groupScale(group.label) ?? 0)
                    const barWidth = Math.max(10, groupScale.bandwidth())
                    const barHeight = innerHeight - yScale(point.value)

                    return (
                      <rect
                        key={`${group.key}-${point.xKey}`}
                        x={x}
                        y={yScale(point.value)}
                        width={barWidth}
                        height={barHeight}
                        rx={Math.min(8, barWidth / 2)}
                        fill={getSeriesColor(group.label, groupIndex)}
                        opacity={0.94}
                      >
                        <title>
                          {group.label} • {point.xLabel}:{' '}
                          {formatGraphValue(point.value, model.yField, model.aggregation, currency)}
                        </title>
                      </rect>
                    )
                  })}
                </g>
              ))
            : model.groups.map((group, groupIndex) => {
                const path = line<(typeof group.points)[number]>()
                  .x((point) => xScale(point.xLabel) ?? 0)
                  .y((point) => yScale(point.value))(group.points)

                return (
                  <g key={group.key}>
                    <path
                      d={path ?? undefined}
                      fill="none"
                      stroke={getSeriesColor(group.label, groupIndex)}
                      strokeWidth={2.75}
                    />
                    {group.points.map((point) => (
                      <circle
                        key={`${group.key}-${point.xKey}`}
                        cx={xScale(point.xLabel) ?? 0}
                        cy={yScale(point.value)}
                        r={4}
                        fill={getSeriesColor(group.label, groupIndex)}
                        stroke="rgba(18, 15, 29, 0.9)"
                        strokeWidth={1.5}
                      >
                        <title>
                          {group.label} • {point.xLabel}:{' '}
                          {formatGraphValue(point.value, model.yField, model.aggregation, currency)}
                        </title>
                      </circle>
                    ))}
                  </g>
                )
              })}

          {sampleLabels(model.xLabels, 7).map((label) => {
            const x = xScale(label) ?? 0
            const xPosition = model.chartType === 'bar' ? x + xScale.bandwidth() / 2 : x

            return (
              <text
                key={label}
                x={xPosition}
                y={innerHeight + 24}
                textAnchor="middle"
                className="analytics-axis-text"
              >
                {label}
              </text>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

function ScatterPreview({
  currency,
  model,
  spec,
}: {
  currency: string
  model: ScatterGraphModel
  spec: GraphSpec
}) {
  const width = 760
  const height = 320
  const margin = { top: 18, right: 18, bottom: 42, left: 44 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom
  const xScale = scaleLinear()
    .domain([0, model.maxX || 1])
    .range([0, innerWidth])
    .nice(4)
  const yScale = scaleLinear()
    .domain([0, model.maxY || 1])
    .range([innerHeight, 0])
    .nice(4)
  const sizeScale = scaleLinear()
    .domain([0, model.maxZ || 1])
    .range([4, 18])
  const groups = Array.from(new Set(model.points.map((point) => point.group)))

  return (
    <div className="space-y-4 rounded-[1.4rem] border border-white/10 bg-white/7 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">Live preview</div>
          <div className="text-xs text-white/56">
            Scatter plot using {getGraphFieldDefinition(spec.xField)?.label?.toLowerCase()} vs{' '}
            {getGraphFieldDefinition(spec.yField)?.label?.toLowerCase()}.
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-white/62">
          {groups.map((group, index) => (
            <span
              key={group}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-2.5 py-1"
            >
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: getSeriesColor(group, index) }}
              />
              {group}
            </span>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="analytics-svg w-full overflow-visible">
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {xScale.ticks(5).map((tick) => (
            <text
              key={`x-${tick}`}
              x={xScale(tick)}
              y={innerHeight + 24}
              textAnchor="middle"
              className="analytics-axis-text"
            >
              {formatGraphValue(tick, spec.xField as GraphMeasureFieldId, 'sum', currency)}
            </text>
          ))}

          {yScale.ticks(5).map((tick) => (
            <g key={`y-${tick}`} transform={`translate(0, ${yScale(tick)})`}>
              <line x2={innerWidth} className="analytics-grid-line" />
              <text x={-10} y={4} textAnchor="end" className="analytics-axis-text">
                {formatGraphValue(tick, spec.yField as GraphMeasureFieldId, 'sum', currency)}
              </text>
            </g>
          ))}

          {model.points.map((point) => {
            const groupIndex = Math.max(0, groups.indexOf(point.group))

            return (
              <circle
                key={point.id}
                cx={xScale(point.x)}
                cy={yScale(point.y)}
                r={sizeScale(point.z)}
                fill={getSeriesColor(point.group, groupIndex)}
                fillOpacity={0.72}
                stroke="rgba(255,255,255,0.24)"
                strokeWidth={1.2}
              >
                <title>
                  {point.label}\nX:{' '}
                  {formatGraphValue(point.x, spec.xField as GraphMeasureFieldId, 'sum', currency)}
                  \nY:{' '}
                  {formatGraphValue(point.y, spec.yField as GraphMeasureFieldId, 'sum', currency)}
                </title>
              </circle>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

function PivotPreview({
  currency,
  model,
  spec,
}: {
  currency: string
  model: PivotGraphModel
  spec: GraphSpec
}) {
  return (
    <div className="space-y-4 rounded-[1.4rem] border border-white/10 bg-white/7 px-4 py-4">
      <div>
        <div className="text-sm font-medium text-white">Live preview</div>
        <div className="text-xs text-white/56">
          Pivoting {getGraphFieldDefinition(spec.rowField)?.label?.toLowerCase()} by{' '}
          {getGraphFieldDefinition(spec.columnField)?.label?.toLowerCase()}.
        </div>
      </div>

      <div className="overflow-x-auto rounded-[1rem] border border-white/8 bg-[#171423]/45">
        <table className="min-w-full border-collapse text-sm text-white/78">
          <thead>
            <tr className="border-b border-white/8 bg-white/5 text-left text-xs uppercase tracking-[0.12em] text-white/54">
              <th className="px-3 py-2">Row</th>
              {model.columns.map((column) => (
                <th key={column} className="px-3 py-2 text-right">
                  {column}
                </th>
              ))}
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row) => (
              <tr key={row} className="border-b border-white/6 last:border-b-0">
                <td className="px-3 py-2 text-white">{row}</td>
                {model.columns.map((column) => (
                  <td key={`${row}-${column}`} className="px-3 py-2 text-right">
                    {formatGraphValue(
                      model.values[`${row}:::${column}`] ?? 0,
                      model.valueField,
                      model.aggregation,
                      currency,
                    )}
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-medium text-white">
                  {formatGraphValue(
                    model.rowTotals[row] ?? 0,
                    model.valueField,
                    model.aggregation,
                    currency,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-white/5 font-medium text-white">
              <td className="px-3 py-2">Total</td>
              {model.columns.map((column) => (
                <td key={column} className="px-3 py-2 text-right">
                  {formatGraphValue(
                    model.columnTotals[column] ?? 0,
                    model.valueField,
                    model.aggregation,
                    currency,
                  )}
                </td>
              ))}
              <td className="px-3 py-2 text-right">
                {formatGraphValue(model.grandTotal, model.valueField, model.aggregation, currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function toNullableField(value: string): GraphFieldId | null {
  return value ? (value as GraphFieldId) : null
}

function getSeriesColor(label: string, index: number) {
  let hash = 0

  for (const character of label) {
    hash = (hash * 31 + character.charCodeAt(0)) % SERIES_COLORS.length
  }

  return SERIES_COLORS[(hash + index) % SERIES_COLORS.length]
}

function formatGraphValue(
  value: number,
  field: GraphFieldId | null,
  aggregation: GraphSpec['aggregation'],
  currency: string,
) {
  if (aggregation === 'count') {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)
  }

  if (field === 'amount') {
    return formatCurrencyValue(value, currency, {
      maximumFractionDigits: value < 100 ? 1 : 0,
      notation: value >= 1000 ? 'compact' : 'standard',
    })
  }

  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: value < 100 ? 1 : 0,
    notation: value >= 1000 ? 'compact' : 'standard',
  }).format(value)
}

function sampleLabels(labels: string[], targetCount: number) {
  if (labels.length <= targetCount) return labels

  const step = Math.max(1, Math.floor(labels.length / (targetCount - 1)))

  return labels.filter(
    (_, index) => index === 0 || index === labels.length - 1 || index % step === 0,
  )
}
