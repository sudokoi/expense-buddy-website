import { createFileRoute, redirect } from '@tanstack/react-router'

import { beginGitHubAuthorization } from '@/features/auth/github.functions'

export const Route = createFileRoute('/connect')({
  beforeLoad: async () => {
    await beginGitHubAuthorization({
      data: {
        installationId: undefined,
      },
    })

    throw redirect({ to: '/', search: { authError: undefined } })
  },
  component: ConnectRoute,
})

function ConnectRoute() {
  return null
}
