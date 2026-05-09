import { createMiddleware } from '@tanstack/react-start'
import { useSession } from '@tanstack/react-start/server'
import type { AuthSessionData } from '@/server/session'

import { createAnonymousAuthState, isConnectedSession } from '@/server/auth.server'
import { authSessionConfig } from '@/server/session'

export const requestAuthMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ next }) => {
    const session = await useSession<AuthSessionData>(authSessionConfig)
    const authState = isConnectedSession(session.data)
      ? { isAuthenticated: true, session: session.data }
      : createAnonymousAuthState()

    return next({ context: { auth: authState } })
  },
)

export const requireConnectedSessionMiddleware = createMiddleware({
  type: 'function',
}).server(async ({ next }) => {
  const session = await useSession<AuthSessionData>(authSessionConfig)

  if (!isConnectedSession(session.data)) {
    throw new Error('Unauthorized')
  }

  return next({ context: { auth: { isAuthenticated: true, session: session.data } } })
})
