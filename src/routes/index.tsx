import { ArrowRightIcon } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/app-shell'
import { getOptionalConnectedSession } from '@/features/auth/github.functions'
import { getAuthErrorMessage } from '@/features/auth/errors'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { siteConfig } from '@/lib/site'

const PLAY_STORE_BADGE_URL =
  'https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png'

export const Route = createFileRoute('/')({
  validateSearch: (search) => ({
    authError: typeof search.authError === 'string' ? search.authError : undefined,
  }),
  loader: async () => {
    const session = await getOptionalConnectedSession()
    return { session }
  },
  component: Home,
})

function Home() {
  const { authError } = Route.useSearch()
  const authErrorMessage = getAuthErrorMessage(authError)
  const { session } = Route.useLoaderData()

  return (
    <AppShell
      hideNavigation
      className="flex min-h-screen max-w-4xl items-center justify-center py-12"
    >
      {authErrorMessage ? (
        <div className="absolute top-6 left-1/2 w-full max-w-xl -translate-x-1/2 px-6">
          <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
            <CardHeader>
              <CardTitle>GitHub connection could not be completed</CardTitle>
              <CardDescription>{authErrorMessage}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      ) : null}

      <section className="flex w-full flex-col items-center justify-center gap-8 text-center">
        <img
          src="/expense-buddy.png"
          alt="Expense Buddy"
          className="h-40 w-40 rounded-[2rem] object-cover shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:h-48 sm:w-48"
        />
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Expense Buddy Web</h1>
          <p className="mx-auto max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Read-only analytics for Expense Buddy users who sync their data through GitHub.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {session ? (
            <Button size="lg" render={<a href="/app" />}>
              Open dashboard
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          ) : (
            <>
              <Button size="lg" render={<a href="/connect" />}>
                Continue with GitHub
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button size="lg" variant="outline" render={<a href="/install" />}>
                Install GitHub App
              </Button>
            </>
          )}
          <Button
            size="lg"
            variant="ghost"
            render={<a href={siteConfig.playStoreUrl} target="_blank" rel="noreferrer" />}
          >
            Get the Android app
          </Button>
        </div>
        <Card className="w-full max-w-2xl border-border/70 bg-card/60 text-left shadow-sm">
          <CardHeader className="gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <CardTitle>Track expenses on Android</CardTitle>
              <CardDescription>
                Expense entry, SMS import, and sync setup live in the Android app. Install it from
                the Play Store to get started.
              </CardDescription>
            </div>
            <a href={siteConfig.playStoreUrl} target="_blank" rel="noreferrer" className="shrink-0">
              <img src={PLAY_STORE_BADGE_URL} alt="Get it on Google Play" className="h-16 w-auto" />
            </a>
          </CardHeader>
        </Card>
        {session ? (
          <p className="text-sm text-muted-foreground">Connected as `{session.userLogin}`.</p>
        ) : null}
      </section>
    </AppShell>
  )
}
