import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'

import { env } from '@/lib/env.server'
import { authCookieOptions, getScopedCookieName } from '@/server/cookie-settings'

const OAUTH_COOKIE = getScopedCookieName('expense-buddy-oauth')
const OAUTH_TTL_SECONDS = 60 * 10

function toBase64Url(value: Buffer | string): string {
  return Buffer.from(value).toString('base64url').replace(/=/g, '')
}

function sign(value: string): string {
  return createHmac('sha256', env.sessionPassword).update(value).digest('base64url')
}

export function issueOAuthState() {
  const state = toBase64Url(randomBytes(32))
  const payload = `${state}.${sign(state)}`

  setCookie(OAUTH_COOKIE, payload, {
    ...authCookieOptions,
    maxAge: OAUTH_TTL_SECONDS,
  })

  return state
}

export function consumeOAuthState(expectedState: string): boolean {
  const cookie = getCookie(OAUTH_COOKIE)
  deleteCookie(OAUTH_COOKIE, authCookieOptions)

  if (!cookie) return false

  const [state, signature] = cookie.split('.')
  if (!state || !signature || state !== expectedState) {
    return false
  }

  const actual = Buffer.from(signature)
  const expected = Buffer.from(sign(state))
  if (actual.length !== expected.length) {
    return false
  }

  return timingSafeEqual(actual, expected)
}
