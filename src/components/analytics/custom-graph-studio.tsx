'use client'

import { scaleBand, scaleLinear, scalePoint } from 'd3-scale'
import { line } from 'd3-shape'
import { useEffect, useMemo, useState } from 'react'
import {
  CopyIcon,
  PencilLineIcon,
  PinIcon,
  PlusIcon,
  SaveIcon,
  Table2Icon,
  Trash2Icon,
  UnplugIcon,
} from 'lucide-react'

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
} from '@/features/analytics/custom-graphs'
import type {
  AggregatedGraphModel,
  CustomGraphModel,
  GraphChartType,
  GraphFieldId,
  GraphSpec,
  PivotGraphModel,
  ScatterGraphModel,
} from '@/features/analytics/custom-graphs'
import {
  createSavedCustomGraph,
  duplicateSavedCustomGraph,
  loadSavedCustomGraphs,
  persistSavedCustomGraphs,
  setSavedCustomGraphPinned,
  updateSavedCustomGraph,
} from '@/features/analytics/custom-graph-storage'
import type { SavedCustomGraph } from '@/features/analytics/custom-graph-storage'
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
  mode = 'studio',
}: {
  currency: string
  expenses: Expense[]
  timeZone?: string | null
  mode?: 'studio' | 'pinned'
}) {
  const [spec, setSpec] = useState<GraphSpec>(() => getDefaultGraphSpec('bar'))
  const [savedGraphs, setSavedGraphs] = useState<SavedCustomGraph[]>([])
  const [selectedSavedGraphId, setSelectedSavedGraphId] = useState<string | null>(null)
  const [renamingGraphId, setRenamingGraphId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [hasLoadedSavedGraphs, setHasLoadedSavedGraphs] = useState(false)
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
  const pinnedGraphs = useMemo(
    () => savedGraphs.filter((savedGraph) => savedGraph.pinned),
    [savedGraphs],
  )
  const visibleSavedGraphs = mode === 'pinned' ? pinnedGraphs : savedGraphs

  useEffect(() => {
    setSavedGraphs(loadSavedCustomGraphs())
    setHasLoadedSavedGraphs(true)
  }, [])

  useEffect(() => {
    if (!hasLoadedSavedGraphs) return

    persistSavedCustomGraphs(savedGraphs)
  }, [hasLoadedSavedGraphs, savedGraphs])

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
    setSavedGraphs((current) => sortSavedGraphs([nextEntry, ...current]))
    setSelectedSavedGraphId(nextEntry.id)
  }

  function handleUpdateSaved() {
    if (!activeSavedGraph || issues.length) return

    setSavedGraphs((current) =>
      sortSavedGraphs(
        current.map((entry) =>
          entry.id === activeSavedGraph.id
            ? updateSavedCustomGraph(entry, cloneGraphSpec(spec))
            : entry,
        ),
      ),
    )
  }

  function handleLoadSaved(entry: SavedCustomGraph) {
    setSpec(cloneGraphSpec(entry.spec))
    setSelectedSavedGraphId(entry.id)
    setRenamingGraphId(null)
  }

  function handleDeleteSaved(entry: SavedCustomGraph) {
    setSavedGraphs((current) => current.filter((savedGraph) => savedGraph.id !== entry.id))
    if (selectedSavedGraphId === entry.id) {
      setSelectedSavedGraphId(null)
      setSpec(getDefaultGraphSpec('bar'))
    }
  }

  function handleResetDraft() {
    setSelectedSavedGraphId(null)
    setSpec(getDefaultGraphSpec(spec.chartType))
  }

  function handleDuplicateSaved(entry: SavedCustomGraph) {
    const duplicate = duplicateSavedCustomGraph(entry)
    setSavedGraphs((current) => sortSavedGraphs([duplicate, ...current]))
    setSelectedSavedGraphId(duplicate.id)
    setSpec(cloneGraphSpec(duplicate.spec))
  }

  function handleStartRename(entry: SavedCustomGraph) {
    setRenamingGraphId(entry.id)
    setRenameDraft(entry.spec.title)
  }

  function handleRenameSaved(entry: SavedCustomGraph) {
    const trimmedTitle = renameDraft.trim()
    if (!trimmedTitle) return

    setSavedGraphs((current) =>
      sortSavedGraphs(
        current.map((savedGraph) =>
          savedGraph.id === entry.id
            ? updateSavedCustomGraph(savedGraph, {
                ...savedGraph.spec,
                title: trimmedTitle,
              })
            : savedGraph,
        ),
      ),
    )

    if (selectedSavedGraphId === entry.id) {
      setSpec((current) => ({ ...current, title: trimmedTitle }))
    }

    setRenamingGraphId(null)
  }

  function handleFilterFieldChange(value: GraphFieldId | null) {
    updateSpec({
      filterField: value as GraphSpec['filterField'],
      filterValue: null,
    })
  }

  function handleTogglePinned(entry: SavedCustomGraph) {
    setSavedGraphs((current) =>
      sortSavedGraphs(
        current.map((savedGraph) =>
          savedGraph.id === entry.id
            ? setSavedCustomGraphPinned(savedGraph, !savedGraph.pinned)
            : savedGraph,
        ),
      ),
    )
  }

  if (mode === 'pinned') {
    return (
      <Card className="analytics-card rounded-[2rem] text-foreground shadow-[0_18px_52px_rgba(74,68,88,0.1)]">
        <CardHeader>
          <CardTitle className="text-foreground">Pinned graphs</CardTitle>
          <CardDescription className="text-muted-foreground">
            Promote your best custom graphs here so they stay easy to revisit without scrolling
            through the full studio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pinnedGraphs.length ? (
            pinnedGraphs.map((entry) => (
              <PinnedGraphCard
                key={entry.id}
                currency={currency}
                entry={entry}
                expenses={expenses}
                onLoad={handleLoadSaved}
                onTogglePinned={handleTogglePinned}
                timeZone={timeZone}
              />
            ))
          ) : (
            <div className="rounded-[1.2rem] border border-border/70 bg-white/70 px-4 py-6 text-sm text-muted-foreground shadow-sm">
              No pinned graphs yet. Pin any saved custom graph from the studio to surface it here.
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="analytics-card rounded-[2rem] text-foreground shadow-[0_18px_52px_rgba(74,68,88,0.1)]">
        <CardHeader className="gap-4">
          <div className="space-y-1">
            <CardTitle className="text-foreground">Custom graph studio</CardTitle>
            <CardDescription className="text-muted-foreground">
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
                  'rounded-full border px-3 text-foreground',
                  spec.chartType === chartType
                    ? 'border-border bg-white shadow-sm hover:bg-white'
                    : 'border-border/70 bg-white/70 text-muted-foreground hover:bg-white hover:text-foreground',
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
                className="border-border/70 bg-white/80 text-foreground placeholder:text-muted-foreground"
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
                className="border-border/70 bg-white/80 text-foreground placeholder:text-muted-foreground"
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
              <div className="rounded-[1rem] border border-border/70 bg-white/70 px-4 py-3 text-sm text-muted-foreground shadow-sm">
                Filter narrows the custom graph before aggregation. This keeps saved graphs focused
                without changing the main dashboard filters.
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              className="w-full rounded-full border border-border/70 bg-white text-foreground shadow-sm hover:bg-white sm:w-auto"
              onClick={handleSaveAsNew}
              disabled={issues.length > 0}
            >
              <SaveIcon />
              Save as new
            </Button>
            <Button
              variant="ghost"
              className="w-full rounded-full border border-border/70 bg-white/80 text-foreground shadow-sm hover:bg-white sm:w-auto"
              onClick={handleUpdateSaved}
              disabled={!activeSavedGraph || !isDirty || issues.length > 0}
            >
              <PencilLineIcon />
              Update selected
            </Button>
            <Button
              variant="ghost"
              className="w-full rounded-full border border-border/70 bg-white/70 text-muted-foreground shadow-sm hover:bg-white hover:text-foreground sm:w-auto"
              onClick={handleResetDraft}
            >
              <PlusIcon />
              New draft
            </Button>
          </div>

          <div className="rounded-[1.3rem] border border-border/70 bg-white/75 px-4 py-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-foreground">Generated graph DSL</div>
                <div className="text-xs text-muted-foreground">
                  Local-only for now. This is the export shape we can later sync to GitHub.
                </div>
              </div>
              <Table2Icon className="size-4 text-muted-foreground" />
            </div>
            <pre className="mt-3 overflow-x-auto rounded-[1rem] border border-border/60 bg-[#fffaf5] p-3 text-xs leading-5 whitespace-pre-wrap break-words text-foreground/80">
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

      <Card className="analytics-card rounded-[2rem] text-foreground shadow-[0_18px_52px_rgba(74,68,88,0.1)]">
        <CardHeader>
          <CardTitle className="text-foreground">Saved locally</CardTitle>
          <CardDescription className="text-muted-foreground">
            Graphs are stored in this browser only. Pin the strongest ones to surface them in a
            dedicated analytics section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleSavedGraphs.length ? (
            visibleSavedGraphs.map((entry) => {
              const isSelected = entry.id === selectedSavedGraphId

              return (
                <div
                  key={entry.id}
                  className={cn(
                    'rounded-[1.2rem] border px-4 py-3 transition-colors',
                    isSelected
                      ? 'border-border bg-white shadow-sm'
                      : 'border-border/70 bg-white/70',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {renamingGraphId === entry.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={renameDraft}
                            onChange={(event) => setRenameDraft(event.target.value)}
                            className="h-8 border-border/70 bg-white/80 text-foreground"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full border border-border/70 bg-white/80 text-foreground shadow-sm hover:bg-white"
                            onClick={() => handleRenameSaved(entry)}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <div className="font-medium text-foreground">{entry.spec.title}</div>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">
                        {GRAPH_TYPE_LABELS[entry.spec.chartType]} • updated{' '}
                        {new Date(entry.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full border border-border/70 bg-white/80 text-foreground shadow-sm hover:bg-white"
                        onClick={() => handleLoadSaved(entry)}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full border border-border/70 bg-white/80 text-foreground shadow-sm hover:bg-white"
                        onClick={() => handleTogglePinned(entry)}
                      >
                        {entry.pinned ? <UnplugIcon /> : <PinIcon />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full border border-border/70 bg-white/80 text-foreground shadow-sm hover:bg-white"
                        onClick={() => handleStartRename(entry)}
                      >
                        <PencilLineIcon />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full border border-border/70 bg-white/80 text-foreground shadow-sm hover:bg-white"
                        onClick={() => handleDuplicateSaved(entry)}
                      >
                        <CopyIcon />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full border border-border/70 bg-white/70 text-muted-foreground shadow-sm hover:bg-white hover:text-foreground"
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
            <div className="rounded-[1.2rem] border border-border/70 bg-white/70 px-4 py-4 text-sm text-muted-foreground shadow-sm">
              No saved graphs yet. Build one in the studio and store it locally.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function PinnedGraphCard({
  currency,
  entry,
  expenses,
  onLoad,
  onTogglePinned,
  timeZone,
}: {
  currency: string
  entry: SavedCustomGraph
  expenses: Expense[]
  onLoad: (entry: SavedCustomGraph) => void
  onTogglePinned: (entry: SavedCustomGraph) => void
  timeZone?: string | null
}) {
  const issues = useMemo(() => validateGraphSpec(entry.spec), [entry.spec])
  const model = useMemo(
    () => (issues.length ? null : buildCustomGraphModel(expenses, entry.spec, timeZone)),
    [entry.spec, expenses, issues.length, timeZone],
  )

  return (
    <div className="rounded-[1.4rem] border border-border/70 bg-white/70 px-4 py-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-medium text-foreground">{entry.spec.title}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {GRAPH_TYPE_LABELS[entry.spec.chartType]} view
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full border border-border/70 bg-white/80 text-foreground shadow-sm hover:bg-white"
            onClick={() => onLoad(entry)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full border border-border/70 bg-white/80 text-foreground shadow-sm hover:bg-white"
            onClick={() => onTogglePinned(entry)}
          >
            <UnplugIcon />
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {issues.length ? (
          <div className="rounded-[1rem] border border-rose-200/20 bg-rose-300/8 px-4 py-3 text-sm text-rose-100/90">
            {issues[0]}
          </div>
        ) : (
          <CustomGraphPreview currency={currency} model={model} spec={entry.spec} compact />
        )}
      </div>
    </div>
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
        'h-8 w-full rounded-lg border border-border/70 bg-white/80 px-2.5 text-sm text-foreground outline-none transition-colors focus:border-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        props.className,
      )}
    />
  )
}

function StudioField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5">
      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      {children}
    </label>
  )
}

function CustomGraphPreview({
  currency,
  model,
  spec,
  compact = false,
}: {
  currency: string
  model: CustomGraphModel | null
  spec: GraphSpec
  compact?: boolean
}) {
  if (!model) {
    return null
  }

  if (model.chartType === 'pivot') {
    return <PivotPreview currency={currency} model={model} spec={spec} compact={compact} />
  }

  if (model.chartType === 'scatter') {
    return <ScatterPreview currency={currency} model={model} spec={spec} compact={compact} />
  }

  return <SeriesPreview currency={currency} model={model} spec={spec} compact={compact} />
}

function SeriesPreview({
  currency,
  model,
  spec,
  compact,
}: {
  currency: string
  model: AggregatedGraphModel
  spec: GraphSpec
  compact: boolean
}) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    group: string
    label: string
    value: number
  } | null>(null)
  const width = 760
  const height = compact ? 260 : 320
  const margin = { top: 20, right: 16, bottom: 48, left: 44 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom
  const barScale = scaleBand<string>().domain(model.xLabels).range([0, innerWidth]).padding(0.18)
  const pointScale = scalePoint<string>().domain(model.xLabels).range([0, innerWidth]).padding(0.5)
  const yScale = scaleLinear()
    .domain([0, model.maxValue || 1])
    .range([innerHeight, 0])
    .nice(4)
  const groupScale = scaleBand<string>()
    .domain(model.groups.map((group) => group.label))
    .range([0, barScale.bandwidth()])
    .padding(0.14)
  const tickValues = yScale.ticks(4)

  return (
    <div className="space-y-4 rounded-[1.4rem] border border-border/70 bg-white/70 px-4 py-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-foreground">Live preview</div>
          <div className="text-xs text-muted-foreground">
            {hoveredPoint
              ? `${hoveredPoint.group} • ${hoveredPoint.label}`
              : `${GRAPH_TYPE_LABELS[spec.chartType]} chart with ${model.groups.length} series.`}
          </div>
        </div>
        {hoveredPoint ? (
          <div className="rounded-full border border-border/70 bg-white/80 px-3 py-1.5 text-xs text-foreground shadow-sm">
            {formatGraphValue(hoveredPoint.value, model.yField, model.aggregation, currency)}
          </div>
        ) : null}
        {!compact ? (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {model.groups.map((group, index) => (
              <span
                key={group.key}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-2.5 py-1 shadow-sm"
              >
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: getSeriesColor(group.label, index) }}
                />
                {group.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="analytics-svg min-w-[38rem] overflow-visible sm:min-w-0 sm:w-full"
        >
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
                      const x = (barScale(point.xLabel) ?? 0) + (groupScale(group.label) ?? 0)
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
                          onPointerEnter={() =>
                            setHoveredPoint({
                              group: group.label,
                              label: point.xLabel,
                              value: point.value,
                            })
                          }
                          onPointerLeave={() => setHoveredPoint(null)}
                        />
                      )
                    })}
                  </g>
                ))
              : model.groups.map((group, groupIndex) => {
                  const path = line<(typeof group.points)[number]>()
                    .x((point) => pointScale(point.xLabel) ?? 0)
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
                          cx={pointScale(point.xLabel) ?? 0}
                          cy={yScale(point.value)}
                          r={4}
                          fill={getSeriesColor(group.label, groupIndex)}
                          stroke="rgba(18, 15, 29, 0.9)"
                          strokeWidth={1.5}
                          onPointerEnter={() =>
                            setHoveredPoint({
                              group: group.label,
                              label: point.xLabel,
                              value: point.value,
                            })
                          }
                          onPointerLeave={() => setHoveredPoint(null)}
                        />
                      ))}
                    </g>
                  )
                })}

            {sampleLabels(model.xLabels, compact ? 5 : 7).map((label) => {
              const xPosition =
                model.chartType === 'bar'
                  ? (barScale(label) ?? 0) + barScale.bandwidth() / 2
                  : (pointScale(label) ?? 0)

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
    </div>
  )
}

function ScatterPreview({
  currency,
  model,
  spec,
  compact,
}: {
  currency: string
  model: ScatterGraphModel
  spec: GraphSpec
  compact: boolean
}) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    group: string
    label: string
    x: number
    y: number
    z: number
  } | null>(null)
  const width = 760
  const height = compact ? 260 : 320
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
  const xFieldLabel = getGraphFieldDefinition(spec.xField)?.label.toLowerCase() ?? 'x-axis'
  const yFieldLabel = getGraphFieldDefinition(spec.yField)?.label.toLowerCase() ?? 'y-axis'

  return (
    <div className="space-y-4 rounded-[1.4rem] border border-border/70 bg-white/70 px-4 py-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-foreground">Live preview</div>
          <div className="text-xs text-muted-foreground">
            {hoveredPoint
              ? `${hoveredPoint.group} • ${hoveredPoint.label}`
              : `Scatter plot using ${xFieldLabel} vs ${yFieldLabel}.`}
          </div>
        </div>
        {hoveredPoint ? (
          <div className="rounded-[1rem] border border-border/70 bg-white/80 px-3 py-2 text-xs text-foreground shadow-sm">
            <div>X: {formatGraphValue(hoveredPoint.x, spec.xField, 'sum', currency)}</div>
            <div>Y: {formatGraphValue(hoveredPoint.y, spec.yField, 'sum', currency)}</div>
            {spec.zField ? (
              <div>Z: {formatGraphValue(hoveredPoint.z, spec.zField, 'sum', currency)}</div>
            ) : null}
          </div>
        ) : null}
        {!compact ? (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {groups.map((group, index) => (
              <span
                key={group}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-2.5 py-1 shadow-sm"
              >
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: getSeriesColor(group, index) }}
                />
                {group}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="analytics-svg min-w-[38rem] overflow-visible sm:min-w-0 sm:w-full"
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {xScale.ticks(5).map((tick) => (
              <text
                key={`x-${tick}`}
                x={xScale(tick)}
                y={innerHeight + 24}
                textAnchor="middle"
                className="analytics-axis-text"
              >
                {formatGraphValue(tick, spec.xField, 'sum', currency)}
              </text>
            ))}

            {yScale.ticks(5).map((tick) => (
              <g key={`y-${tick}`} transform={`translate(0, ${yScale(tick)})`}>
                <line x2={innerWidth} className="analytics-grid-line" />
                <text x={-10} y={4} textAnchor="end" className="analytics-axis-text">
                  {formatGraphValue(tick, spec.yField, 'sum', currency)}
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
                  onPointerEnter={() =>
                    setHoveredPoint({
                      group: point.group,
                      label: point.label,
                      x: point.x,
                      y: point.y,
                      z: point.z,
                    })
                  }
                  onPointerLeave={() => setHoveredPoint(null)}
                />
              )
            })}
          </g>
        </svg>
      </div>
    </div>
  )
}

function PivotPreview({
  currency,
  model,
  spec,
  compact,
}: {
  currency: string
  model: PivotGraphModel
  spec: GraphSpec
  compact: boolean
}) {
  const rowFieldLabel = getGraphFieldDefinition(spec.rowField)?.label.toLowerCase() ?? 'rows'
  const columnFieldLabel =
    getGraphFieldDefinition(spec.columnField)?.label.toLowerCase() ?? 'columns'
  const columns = compact ? model.columns.slice(0, 4) : model.columns

  return (
    <div className="space-y-4 rounded-[1.4rem] border border-border/70 bg-white/70 px-4 py-4 shadow-sm">
      <div>
        <div className="text-sm font-medium text-foreground">Live preview</div>
        <div className="text-xs text-muted-foreground">
          Pivoting {rowFieldLabel} by {columnFieldLabel}.
        </div>
      </div>

      <div className="overflow-x-auto rounded-[1rem] border border-border/60 bg-[#fffaf5]">
        <table className="min-w-full border-collapse text-sm text-foreground/80">
          <thead>
            <tr className="border-b border-border/60 bg-white/70 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-3 py-2">Row</th>
              {columns.map((column) => (
                <th key={column} className="px-3 py-2 text-right">
                  {column}
                </th>
              ))}
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row) => (
              <tr key={row} className="border-b border-border/50 last:border-b-0">
                <td className="px-3 py-2 text-foreground">{row}</td>
                {columns.map((column) => (
                  <td key={`${row}-${column}`} className="px-3 py-2 text-right">
                    {formatGraphValue(
                      model.values[`${row}:::${column}`] ?? 0,
                      model.valueField,
                      model.aggregation,
                      currency,
                    )}
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-medium text-foreground">
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

function sortSavedGraphs(savedGraphs: SavedCustomGraph[]) {
  return [...savedGraphs].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}
