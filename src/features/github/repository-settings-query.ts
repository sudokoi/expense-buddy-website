import { queryOptions } from '@tanstack/react-query'

import { getConnectedRepositoryBranches } from '@/features/auth/github.functions'

export function connectedRepositoryBranchesQueryOptions() {
  return queryOptions({
    queryKey: ['repository-settings', 'branches'],
    queryFn: () => getConnectedRepositoryBranches(),
    staleTime: 60_000,
  })
}
