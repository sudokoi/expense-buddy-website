export type DashboardWidgetKind = 'stat' | 'line_chart' | 'pie_chart' | 'table'

export interface DashboardWidgetDefinition {
  id: string
  kind: DashboardWidgetKind
  title: string
  query: string
}

export interface DashboardSectionDefinition {
  id: string
  title: string
  widgets: DashboardWidgetDefinition[]
}

export interface DashboardDefinition {
  id: string
  title: string
  description: string
  sections: DashboardSectionDefinition[]
}

export const overviewDashboard: DashboardDefinition = {
  id: 'overview',
  title: 'Overview',
  description: 'A high-level view of your spending trends from your GitHub sync repo.',
  sections: [
    {
      id: 'headline-stats',
      title: 'At a glance',
      widgets: [
        { id: 'total-spend', kind: 'stat', title: 'Total spending', query: 'totalSpending' },
        { id: 'average-daily', kind: 'stat', title: 'Average daily', query: 'averageDaily' },
        {
          id: 'highest-category',
          kind: 'stat',
          title: 'Highest category',
          query: 'highestCategory',
        },
        { id: 'highest-day', kind: 'stat', title: 'Highest day', query: 'highestDay' },
      ],
    },
    {
      id: 'charts',
      title: 'Breakdowns',
      widgets: [
        { id: 'spend-trend', kind: 'line_chart', title: 'Spend trend', query: 'lineChartData' },
        {
          id: 'category-breakdown',
          kind: 'pie_chart',
          title: 'Category breakdown',
          query: 'categoryBreakdown',
        },
        {
          id: 'payment-method-breakdown',
          kind: 'pie_chart',
          title: 'Payment methods',
          query: 'paymentMethodBreakdown',
        },
      ],
    },
  ],
}
