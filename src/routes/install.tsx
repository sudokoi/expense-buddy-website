import { createFileRoute, redirect } from '@tanstack/react-router'

import { beginGitHubInstallation } from '@/features/auth/github.functions'

export const Route = createFileRoute('/install')({
  beforeLoad: async () => {
    await beginGitHubInstallation()
    throw redirect({ to: '/', search: { authError: undefined } })
  },
  component: InstallRoute,
})

function InstallRoute() {
  return null
}
