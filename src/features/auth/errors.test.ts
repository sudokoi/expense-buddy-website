import { describe, expect, it } from 'vitest'

import { getAuthErrorMessage, getAuthErrorSearch } from '@/features/auth/errors'

describe('getAuthErrorSearch', () => {
  it('maps known GitHub auth failures to stable search codes', () => {
    expect(getAuthErrorSearch(new Error('GitHub OAuth state verification failed'))).toEqual({
      authError: 'oauth_state_mismatch',
    })
    expect(
      getAuthErrorSearch(
        new Error('GitHub App installation must be limited to selected repositories'),
      ),
    ).toEqual({ authError: 'selected_repositories_required' })
    expect(
      getAuthErrorSearch(new Error('Select exactly one GitHub repository for Expense Buddy Web')),
    ).toEqual({ authError: 'single_repository_required' })
  })

  it('falls back to a generic auth failure code', () => {
    expect(getAuthErrorSearch(new Error('something unexpected'))).toEqual({
      authError: 'auth_failed',
    })
  })
})

describe('getAuthErrorMessage', () => {
  it('returns a user-facing message for known and unknown codes', () => {
    expect(getAuthErrorMessage('installation_not_found')).toContain('authorized account')
    expect(getAuthErrorMessage('unknown_code')).toBe('GitHub connection failed. Try again.')
    expect(getAuthErrorMessage()).toBeNull()
  })
})
