import { env } from '@/lib/env.server'

const usesSecureCookies = env.appOrigin.startsWith('https://')

export const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: usesSecureCookies,
  path: '/',
}

export function getScopedCookieName(name: string) {
  return usesSecureCookies ? `__Host-${name}` : name
}
