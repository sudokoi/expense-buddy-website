export interface GitHubSyncFile {
  path: string
  sha: string
  type: 'blob' | 'tree'
}

export interface ConnectedRepoSummary {
  installationId: number
  repoId: number
  repoFullName: string
  branch: string
  syncDirectory: string
}
