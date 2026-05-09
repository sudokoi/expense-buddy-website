import { createHmac, timingSafeEqual } from 'node:crypto'

import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'

import { env } from '@/lib/env.server'
import { authCookieOptions, getScopedCookieName } from '@/server/cookie-settings'

const INSTALLATION_COOKIE = getScopedCookieName('expense-buddy-installation')
const INSTALLATION_TTL_SECONDS = 60 * 10

function sign(value: string): string {
  return createHmac('sha256', env.sessionPassword).update(value).digest('base64url')
}

export function issuePendingInstallationId(installationId: number) {
  const value = String(installationId)
  setCookie(INSTALLATION_COOKIE, `${value}.${sign(value)}`, {
    ...authCookieOptions,
    maxAge: INSTALLATION_TTL_SECONDS,
  })
}

export function clearPendingInstallationId() {
  deleteCookie(INSTALLATION_COOKIE, authCookieOptions)
}

export function consumePendingInstallationId(): number | null {
  const cookie = getCookie(INSTALLATION_COOKIE)
  deleteCookie(INSTALLATION_COOKIE, authCookieOptions)

  if (!cookie) return null

  const [value, signature] = cookie.split('.')
  if (!value || !signature) {
    return null
  }

  const actual = Buffer.from(signature)
  const expected = Buffer.from(sign(value))
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null
  }

  const installationId = Number.parseInt(value, 10)
  return Number.isSafeInteger(installationId) && installationId > 0 ? installationId : null
}
