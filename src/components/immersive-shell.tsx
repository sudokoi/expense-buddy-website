import type { ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { siteConfig } from '@/lib/site'

interface ImmersiveShellProps {
  children: ReactNode
  scene?: ReactNode
  className?: string
  contentClassName?: string
  surface: 'light' | 'immersive'
  sessionLabel?: string | null
}

export function ImmersiveShell({
  children,
  scene,
  className,
  contentClassName,
  surface,
  sessionLabel,
}: ImmersiveShellProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isHomeRoute = pathname === '/'
  const isAnalyticsRoute = pathname.startsWith('/app')

  return (
    <div
      className={cn(
        'immersive-shell min-h-screen',
        surface === 'immersive' && 'immersive-shell-dark',
        className,
      )}
    >
      <div className="immersive-shell__ambient" aria-hidden="true" />
      {scene ? (
        <div className="immersive-shell__scene" aria-hidden="true">
          {scene}
        </div>
      ) : null}
      <div className="relative z-10 min-h-screen">
        <header className="px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="immersive-nav mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 rounded-[2rem] px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                search={{ authError: undefined }}
                className="text-sm font-semibold tracking-tight sm:text-base"
              >
                Expense Buddy Web
              </Link>
              {sessionLabel ? (
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {sessionLabel}
                </span>
              ) : null}
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  isHomeRoute &&
                    'border border-border/70 bg-white/80 text-foreground shadow-sm hover:bg-white',
                )}
                render={<Link to="/" search={{ authError: undefined }} />}
              >
                Home
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  isAnalyticsRoute &&
                    'border border-border/70 bg-white/80 text-foreground shadow-sm hover:bg-white',
                )}
                render={<Link to="/app" />}
              >
                Analytics
              </Button>
              <Button
                size="sm"
                variant="outline"
                render={<a href={siteConfig.playStoreUrl} target="_blank" rel="noreferrer" />}
              >
                Android app
              </Button>
            </nav>
          </div>
        </header>
        <main
          className={cn(
            'relative mx-auto flex w-full max-w-7xl flex-1 px-4 pb-8 sm:px-6 sm:pb-10',
            contentClassName,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
