import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'

import { USER_TIMEZONE_COOKIE } from '@/lib/cookies'
import { getScopedCookieName } from '@/server/cookie-settings'

function readUserTimezone(): string | null {
  const cookieName = getScopedCookieName(USER_TIMEZONE_COOKIE)
  const value = getCookie(cookieName)?.trim()
  if (!value) {
    return null
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date())
    return value
  } catch {
    return null
  }
}

export const getUserTimezone = createServerFn({ method: 'GET' }).handler(async () => {
  return readUserTimezone()
})
