import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
  className?: string
  hideNavigation?: boolean
}

export function AppShell({ children, className, hideNavigation = false }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {hideNavigation ? null : (
        <header className="border-b border-border/70 bg-background/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
            <Link
              to="/"
              search={{ authError: undefined }}
              className="text-sm font-semibold tracking-tight"
            >
              Expense Buddy Web
            </Link>
            <nav className="flex items-center gap-3 text-sm text-muted-foreground">
              <Link
                to="/"
                search={{ authError: undefined }}
                className="transition-colors hover:text-foreground"
              >
                Home
              </Link>
              <Link to="/app" className="transition-colors hover:text-foreground">
                Analytics
              </Link>
            </nav>
          </div>
        </header>
      )}
      <main className={cn('mx-auto w-full max-w-7xl px-6 py-8', className)}>{children}</main>
    </div>
  )
}
