import { createFileRoute, redirect } from '@tanstack/react-router'

import { beginGitHubInstallation } from '@/features/auth/github.functions'

export const Route = createFileRoute('/connect')({
  beforeLoad: async () => {
    await beginGitHubInstallation()
    throw redirect({ to: '/' })
  },
  component: ConnectRoute,
})

function ConnectRoute() {
  return null
}
