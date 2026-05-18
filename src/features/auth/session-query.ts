import { queryOptions } from '@tanstack/react-query'

import { getOptionalConnectedSession } from '@/features/auth/github.functions'

export function optionalSessionQueryOptions() {
  return queryOptions({
    queryKey: ['session', 'optional'],
    queryFn: () => getOptionalConnectedSession(),
  })
}
