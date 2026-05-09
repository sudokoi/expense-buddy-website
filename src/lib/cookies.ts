export const USER_TIMEZONE_COOKIE = 'expense-buddy-timezone'

export function shouldUseSecureCookies(appOrigin: string): boolean {
  return appOrigin.startsWith('https://')
}

export function getScopedCookieName(name: string, appOrigin: string): string {
  return shouldUseSecureCookies(appOrigin) ? `__Host-${name}` : name
}
