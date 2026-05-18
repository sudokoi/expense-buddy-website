import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { PostHogProvider as PostHogReactProvider, usePostHog } from '@posthog/react'

import type { AuthSessionData } from '@/server/session'
import { getPostHogEnabled, getPostHogKey, initPostHog, posthog } from '@/lib/posthog'

interface PostHogProviderProps {
  session: AuthSessionData
}

export function PostHogProvider({ session }: PostHogProviderProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!getPostHogEnabled()) {
      return
    }

    initPostHog()
    setIsReady(true)
  }, [])

  const posthogKey = getPostHogKey()

  if (!posthogKey) {
    return null
  }

  return (
    <PostHogReactProvider client={posthog}>
      {isReady ? <PostHogTracker session={session} /> : null}
    </PostHogReactProvider>
  )
}

function PostHogTracker({ session }: PostHogProviderProps) {
  const posthogClient = usePostHog()
  const location = useRouterState({
    select: (state) => state.location,
  })

  useEffect(() => {
    const url = `${location.pathname}${location.searchStr}${location.hash}`

    posthogClient.capture('$pageview', {
      $current_url: window.location.href,
      pathname: location.pathname,
      search: location.searchStr,
      hash: location.hash,
      url,
    })
  }, [location.hash, location.pathname, location.searchStr, posthogClient])

  useEffect(() => {
    if (session.userId) {
      posthogClient.identify(String(session.userId), {
        userLogin: session.userLogin,
        repoFullName: session.repoFullName,
        branch: session.branch,
      })

      return
    }

    posthogClient.reset()
  }, [posthogClient, session.branch, session.repoFullName, session.userId, session.userLogin])

  return null
}
