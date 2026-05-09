import { createFileRoute, redirect } from '@tanstack/react-router'

import { beginGitHubAuthorization } from '@/features/auth/github.functions'

export const Route = createFileRoute('/github/setup')({
  validateSearch: (search) => ({
    installation_id:
      typeof search.installation_id === 'string'
        ? Number.parseInt(search.installation_id, 10)
        : undefined,
  }),
  beforeLoad: async ({ search }) => {
    if (!search.installation_id) {
      throw redirect({ to: '/', search: { authError: 'missing_installation_id' } })
    }

    await beginGitHubAuthorization({
      data: {
        installationId: search.installation_id,
      },
    })
  },
  component: GitHubSetupRoute,
})

function GitHubSetupRoute() {
  return null
}
