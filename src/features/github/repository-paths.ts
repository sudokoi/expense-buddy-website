import type { GitHubSyncFile } from '@/features/github/types'

export const EXPENSE_FILE_PATTERN = /^expenses-(\d{4}-\d{2}-\d{2})\.csv$/

export interface ScopedRepositoryFile extends GitHubSyncFile {
  relativePath: string
}

export function normalizeSyncDirectory(value: string | null | undefined) {
  const normalized = (value ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')

  return normalized === '.' ? '' : normalized
}

export function scopeRepositoryFiles(files: GitHubSyncFile[], syncDirectory: string) {
  const normalizedDirectory = normalizeSyncDirectory(syncDirectory)

  if (!normalizedDirectory) {
    return files
      .filter((file) => !file.path.includes('/'))
      .map((file) => ({ ...file, relativePath: file.path }))
  }

  const prefix = `${normalizedDirectory}/`

  return files
    .filter((file) => file.path.startsWith(prefix))
    .map((file) => ({
      ...file,
      relativePath: file.path.slice(prefix.length),
    }))
    .filter((file) => file.relativePath.length > 0 && !file.relativePath.includes('/'))
}
