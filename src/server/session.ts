import type { SessionConfig } from '@tanstack/react-start/server'

import { env } from '@/lib/env.server'
import { authCookieOptions, getScopedCookieName } from '@/server/cookie-settings'

export interface AuthSessionData {
  installationId?: number
  repoId?: number
  repoFullName?: string
  branch?: string
  userLogin?: string
  userId?: number
}

export const authSessionConfig: SessionConfig = {
  password: env.sessionPassword,
  name: getScopedCookieName('expense-buddy-web'),
  maxAge: 60 * 60 * 24 * 30,
  cookie: authCookieOptions,
}
