import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            Expense Buddy Web
          </Link>
          <nav className="flex items-center gap-3 text-sm text-muted-foreground">
            <Link to="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
            <Link to="/app" className="transition-colors hover:text-foreground">
              Analytics
            </Link>
            <Button variant="outline" size="sm" render={<a href="/connect" />}>
              Connect GitHub
            </Button>
          </nav>
        </div>
      </header>
      <main className={cn('mx-auto w-full max-w-7xl px-6 py-8', className)}>{children}</main>
    </div>
  )
}
