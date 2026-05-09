import { ArrowRightIcon, GithubIcon, ShieldCheckIcon, SmartphoneIcon } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/app-shell'
import { FeatureCard } from '@/components/marketing/feature-card'
import { getAuthErrorMessage } from '@/features/auth/errors'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { siteConfig } from '@/lib/site'

export const Route = createFileRoute('/')({
  validateSearch: (search) => ({
    authError: typeof search.authError === 'string' ? search.authError : undefined,
  }),
  component: Home,
})

function Home() {
  const { authError } = Route.useSearch()
  const authErrorMessage = getAuthErrorMessage(authError)

  return (
    <AppShell className="space-y-10">
      {authErrorMessage ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardHeader>
            <CardTitle>GitHub connection could not be completed</CardTitle>
            <CardDescription>{authErrorMessage}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <Badge variant="secondary">Android-first. GitHub-backed. Read-only web analytics.</Badge>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
              A wider-screen analytics view for Expense Buddy users who sync through GitHub.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Expense Buddy Web is an optional companion for people who already keep their confirmed
              expense history in their own GitHub repo. No editing. No separate backend. Just a
              calmer place to inspect your data.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" render={<a href="/connect" />}>
              Connect GitHub
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<a href={siteConfig.playStoreUrl} target="_blank" rel="noreferrer" />}
            >
              Get the Android app
            </Button>
          </div>
        </div>

        <Card className="border-border/70 bg-linear-to-br from-card via-card to-muted/50 shadow-sm">
          <CardHeader>
            <CardTitle>Privacy model stays intact</CardTitle>
            <CardDescription>
              The website reads your already-synced expense files from the single GitHub repo you
              explicitly grant access to.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <ShieldCheckIcon className="mt-0.5 size-4 text-foreground" />
              <p>GitHub App permissions are read-only and limited to the selected sync repo.</p>
            </div>
            <div className="flex items-start gap-3">
              <GithubIcon className="mt-0.5 size-4 text-foreground" />
              <p>The mobile app keeps working independently. The web app is entirely opt-in.</p>
            </div>
            <div className="flex items-start gap-3">
              <SmartphoneIcon className="mt-0.5 size-4 text-foreground" />
              <p>
                Expense entry and editing remain on Android. The web stays a read-only analytics
                surface.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FeatureCard
          title="Repo-backed analytics"
          description="Reads the same daily CSV files that the mobile app syncs to your GitHub repo."
        />
        <FeatureCard
          title="No separate expense backend"
          description="The web product derives analytics from your existing sync source instead of duplicating storage."
        />
        <FeatureCard
          title="Extensible dashboards"
          description="Starts with an overview preset, with room for more presets and browser-local custom dashboards."
        />
        <FeatureCard
          title="Android remains primary"
          description="Expense capture, SMS import, and syncing stay in the mobile app where they already work."
        />
      </section>
    </AppShell>
  )
}
