import { createServerFn } from '@tanstack/react-start'

import { importFromCSV } from '@/features/analytics/csv'
import type { ConnectedRepoSummary, GitHubSyncFile } from '@/features/github/types'
import { createInstallationOctokit } from '@/server/github-app'
import { requireConnectedSessionMiddleware } from '@/server/auth-middleware'
import type { Expense } from '@/types/expense'
import type { SyncedSettings } from '@/types/settings'

const EXPENSE_FILE_PATTERN = /^expenses-(\d{4}-\d{2}-\d{2})\.csv$/

export interface RepositorySnapshot {
  repo: ConnectedRepoSummary
  files: GitHubSyncFile[]
  expenses: Expense[]
  settings: SyncedSettings | null
}

async function getRepositoryTree(summary: ConnectedRepoSummary) {
  const octokit = await createInstallationOctokit(summary.installationId, [summary.repoId])
  const [owner, repo] = summary.repoFullName.split('/')

  const ref = await octokit.request('GET /repos/{owner}/{repo}/git/ref/heads/{branch}', {
    owner,
    repo,
    branch: summary.branch,
  })
  const commit = await octokit.request('GET /repos/{owner}/{repo}/git/commits/{commit_sha}', {
    owner,
    repo,
    commit_sha: ref.data.object.sha,
  })
  const tree = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
    owner,
    repo,
    tree_sha: commit.data.tree.sha,
    recursive: '1',
  })

  return tree.data.tree.filter(
    (entry: { type?: string | null }) => entry.type === 'blob',
  ) as GitHubSyncFile[]
}

async function getFileContent(summary: ConnectedRepoSummary, path: string) {
  const octokit = await createInstallationOctokit(summary.installationId, [summary.repoId])
  const [owner, repo] = summary.repoFullName.split('/')
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    path,
    ref: summary.branch,
  })

  if (Array.isArray(data) || data.type !== 'file' || !data.content) {
    throw new Error(`Unsupported file response for ${path}`)
  }

  return Buffer.from(data.content, 'base64').toString('utf-8')
}

export const loadRepositorySnapshot = createServerFn({ method: 'GET' })
  .middleware([requireConnectedSessionMiddleware])
  .handler(async ({ context }) => {
    const session = context.auth.session
    const summary: ConnectedRepoSummary = {
      installationId: session.installationId!,
      repoId: session.repoId!,
      repoFullName: session.repoFullName!,
      branch: session.branch!,
    }

    const files = await getRepositoryTree(summary)
    const expenseFiles = files.filter((file) => EXPENSE_FILE_PATTERN.test(file.path))

    let settings: SyncedSettings | null = null
    const settingsFile = files.find(
      (file) => file.path === 'settings.json' || file.path === 'sync/settings.json',
    )
    if (settingsFile) {
      try {
        settings = JSON.parse(await getFileContent(summary, settingsFile.path)) as SyncedSettings
      } catch {
        settings = null
      }
    }

    const expenses = (
      await Promise.all(
        expenseFiles.map(async (file) => importFromCSV(await getFileContent(summary, file.path))),
      )
    )
      .flat()
      .filter((expense) => !expense.deletedAt)
      .sort((a, b) => b.date.localeCompare(a.date))

    return {
      repo: summary,
      files,
      expenses,
      settings,
    } satisfies RepositorySnapshot
  })
