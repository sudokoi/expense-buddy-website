export const authErrorMessages: Record<string, string> = {
  missing_callback_params: 'GitHub did not return the data needed to finish the connection.',
  missing_installation_id: 'GitHub installation setup did not return a valid installation ID.',
  oauth_state_mismatch: 'The GitHub authorization request expired or was interrupted. Try again.',
  installation_state_missing:
    'The GitHub installation confirmation expired before sign-in completed. Try again.',
  installation_not_found:
    'The installed GitHub App could not be matched to your authorized account.',
  selected_repositories_required: 'Install the GitHub App with Only select repositories enabled.',
  single_repository_required: 'Select exactly one repository when installing the GitHub App.',
  auth_failed: 'GitHub connection failed. Try again.',
}

export function getAuthErrorMessage(authError?: string) {
  if (!authError) return null
  return authErrorMessages[authError] ?? authErrorMessages.auth_failed
}

export function getAuthErrorSearch(error: unknown) {
  const message = error instanceof Error ? error.message : ''

  if (message === 'GitHub OAuth state verification failed') {
    return { authError: 'oauth_state_mismatch' }
  }

  if (message === 'GitHub installation verification expired. Start the connection flow again') {
    return { authError: 'installation_state_missing' }
  }

  if (message === 'GitHub installation not found for this user') {
    return { authError: 'installation_not_found' }
  }

  if (message === 'GitHub App installation must be limited to selected repositories') {
    return { authError: 'selected_repositories_required' }
  }

  if (message === 'Select exactly one GitHub repository for Expense Buddy Web') {
    return { authError: 'single_repository_required' }
  }

  return { authError: 'auth_failed' }
}
