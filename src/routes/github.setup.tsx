import { createFileRoute } from '@tanstack/react-router'

import { beginGitHubAuthorization } from '@/features/auth/github.functions'

export const Route = createFileRoute('/github/setup')({
  validateSearch: (search) => ({
    installation_id:
      typeof search.installation_id === 'string'
        ? Number.parseInt(search.installation_id, 10)
        : undefined,
  }),
  beforeLoad: async ({ search }) => {
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
