import posthog from 'posthog-js'

const posthogKey = import.meta.env.VITE_POSTHOG_KEY?.trim()
const posthogHost = import.meta.env.VITE_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com'

let hasInitializedPostHog = false

export function getPostHogKey() {
  return posthogKey
}

export function getPostHogOptions() {
  return {
    api_host: posthogHost,
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: 'identified_only' as const,
  }
}

export function getPostHogEnabled() {
  return Boolean(posthogKey)
}

export function initPostHog() {
  if (!posthogKey || hasInitializedPostHog || typeof window === 'undefined') {
    return false
  }

  posthog.init(posthogKey, getPostHogOptions())

  hasInitializedPostHog = true
  return true
}

export { posthog }
