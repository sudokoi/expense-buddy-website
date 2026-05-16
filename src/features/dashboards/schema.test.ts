import { describe, expect, it } from 'vitest'

import { isValidAnalyticsViewDefinition } from '@/features/dashboards/schema'

describe('isValidAnalyticsViewDefinition', () => {
  it('rejects stored views without any layers', () => {
    expect(
      isValidAnalyticsViewDefinition({
        id: 'empty-view',
        source: 'user',
        title: 'Empty',
        description: 'No layers configured.',
        accentColor: '#ff91a4',
        layers: [],
      }),
    ).toBe(false)
  })

  it('accepts stored views with at least one valid layer', () => {
    expect(
      isValidAnalyticsViewDefinition({
        id: 'valid-view',
        source: 'user',
        title: 'Valid',
        description: 'Includes one valid layer.',
        accentColor: '#ff91a4',
        layers: [
          {
            id: 'overview-hero',
            title: 'Spending pulse',
            description: 'Overview layer.',
            dimension: 'overview',
            presentation: 'hero',
          },
        ],
      }),
    ).toBe(true)
  })
})
