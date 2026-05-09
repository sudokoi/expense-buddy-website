import type { AuthSessionData } from '@/server/session'

export interface AuthState {
  isAuthenticated: boolean
  session: AuthSessionData
}

export function createAnonymousAuthState(): AuthState {
  return {
    isAuthenticated: false,
    session: {},
  }
}

export function isConnectedSession(session: AuthSessionData): boolean {
  return Boolean(session.installationId && session.repoId && session.repoFullName && session.branch)
}
