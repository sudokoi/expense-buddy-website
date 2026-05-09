import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import type { AuthState } from '@/server/auth.server'

export interface RouterContext {
  auth: AuthState
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    context: {
      auth: {
        isAuthenticated: false,
        session: {},
      },
    } satisfies RouterContext,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
