import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useRouterState } from '@tanstack/react-router'
import { LoaderCircleIcon, LogOutIcon, Settings2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  disconnectGitHubRepo,
  updateConnectedBranch,
  updateConnectedSyncDirectory,
} from '@/features/auth/github.functions'
import { optionalSessionQueryOptions } from '@/features/auth/session-query'
import { normalizeSyncDirectory } from '@/features/github/repository-paths'
import { connectedRepositoryBranchesQueryOptions } from '@/features/github/repository-settings-query'
import { cn } from '@/lib/utils'
import { siteConfig } from '@/lib/site'

interface ImmersiveShellProps {
  children: ReactNode
  scene?: ReactNode
  className?: string
  contentClassName?: string
  surface: 'light' | 'immersive'
  sessionLabel?: string | null
  sessionInfo?: {
    repoFullName: string
    branch: string
    syncDirectory: string
  } | null
}

export function ImmersiveShell({
  children,
  scene,
  className,
  contentClassName,
  surface,
  sessionLabel,
  sessionInfo,
}: ImmersiveShellProps) {
  const queryClient = useQueryClient()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isHomeRoute = pathname === '/'
  const isAnalyticsRoute = pathname.startsWith('/app')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [syncDirectoryDraft, setSyncDirectoryDraft] = useState(sessionInfo?.syncDirectory ?? '')

  useEffect(() => {
    setSyncDirectoryDraft(sessionInfo?.syncDirectory ?? '')
  }, [sessionInfo?.syncDirectory])

  const branchesQuery = useQuery({
    ...connectedRepositoryBranchesQueryOptions(),
    enabled: isSettingsOpen && Boolean(sessionInfo),
  })
  const branchMutation = useMutation({
    mutationFn: async (branch: string) => {
      await updateConnectedBranch({
        data: { branch },
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: optionalSessionQueryOptions().queryKey }),
        queryClient.invalidateQueries({ queryKey: ['analytics-page'] }),
      ])
      setIsSettingsOpen(false)
    },
  })
  const syncDirectoryMutation = useMutation({
    mutationFn: async (syncDirectory: string) => {
      await updateConnectedSyncDirectory({
        data: { syncDirectory },
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: optionalSessionQueryOptions().queryKey }),
        queryClient.invalidateQueries({ queryKey: ['analytics-page'] }),
      ])
      setIsSettingsOpen(false)
    },
  })
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await disconnectGitHubRepo()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: optionalSessionQueryOptions().queryKey })
      window.location.assign('/')
    },
  })
  const isSavingSource = branchMutation.isPending || syncDirectoryMutation.isPending
  const selectedBranch = sessionInfo?.branch ?? ''
  const normalizedSyncDirectoryDraft = normalizeSyncDirectory(syncDirectoryDraft)

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
              {sessionInfo ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="border border-border/70 bg-white/70 text-foreground shadow-sm hover:bg-white"
                    onClick={() => setIsSettingsOpen(true)}
                  >
                    <Settings2Icon />
                    Source
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:bg-white hover:text-foreground"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      <LogOutIcon />
                    )}
                    Logout
                  </Button>
                </>
              ) : null}
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
        {isSettingsOpen && sessionInfo ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(74,68,88,0.22)] px-4 py-20 backdrop-blur-sm sm:px-6">
            <div className="immersive-nav w-full max-w-xl rounded-[2rem] p-5 text-sm text-foreground shadow-[0_30px_100px_rgba(74,68,88,0.18)]">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-base font-semibold text-foreground">Repository source</div>
                  <p className="text-sm text-muted-foreground">
                    Change the branch or sync directory for the connected repository.
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setIsSettingsOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-[1.4rem] border border-border/70 bg-white/70 px-4 py-3 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Repository
                  </div>
                  <div className="mt-1 font-medium text-foreground">{sessionInfo.repoFullName}</div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Repo changes require a fresh GitHub authorization because installation
                    permissions are scoped to the selected repository.
                  </p>
                  <div className="mt-3">
                    <Button size="sm" variant="outline" render={<Link to="/install" />}>
                      Change repository
                    </Button>
                  </div>
                </div>

                <label className="space-y-1.5">
                  <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Branch
                  </div>
                  <Select
                    value={selectedBranch}
                    onValueChange={(value) => {
                      if (!value || value === selectedBranch) {
                        return
                      }

                      branchMutation.mutate(value)
                    }}
                  >
                    <SelectTrigger className="h-10 w-full rounded-[1rem] border-border/70 bg-white/80 px-3 text-foreground shadow-sm">
                      <SelectValue
                        placeholder={
                          branchesQuery.isLoading ? 'Loading branches...' : 'Select branch'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent align="end" className="max-h-72">
                      {(branchesQuery.data ?? []).map((branch) => (
                        <SelectItem key={branch.name} value={branch.name}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {branchesQuery.isLoading ? (
                    <div className="text-xs text-muted-foreground">
                      Fetching available branches...
                    </div>
                  ) : null}
                  {branchesQuery.error ? (
                    <div className="text-xs text-destructive">
                      Could not load repository branches.
                    </div>
                  ) : null}
                </label>

                <label className="space-y-1.5">
                  <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Sync directory
                  </div>
                  <Input
                    value={syncDirectoryDraft}
                    onChange={(event) => setSyncDirectoryDraft(event.target.value)}
                    className="h-10 rounded-[1rem] border-border/70 bg-white/80 px-3 text-foreground shadow-sm"
                    placeholder="Root directory"
                  />
                  <div className="text-xs text-muted-foreground">
                    Leave blank for the repository root. Use a relative path like `sync` or
                    `exports/mobile`.
                  </div>
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:bg-white hover:text-foreground"
                    onClick={() => {
                      setSyncDirectoryDraft(sessionInfo.syncDirectory)
                      setIsSettingsOpen(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <div className="flex flex-wrap items-center gap-2">
                    {branchMutation.error || syncDirectoryMutation.error ? (
                      <span className="text-xs text-destructive">
                        Could not update repository source.
                      </span>
                    ) : null}
                    <Button
                      size="sm"
                      onClick={() => syncDirectoryMutation.mutate(normalizedSyncDirectoryDraft)}
                      disabled={
                        isSavingSource || normalizedSyncDirectoryDraft === sessionInfo.syncDirectory
                      }
                    >
                      {isSavingSource ? <LoaderCircleIcon className="animate-spin" /> : null}
                      Save directory
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
