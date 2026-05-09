import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useSession } from '@tanstack/react-start/server'
import { z } from 'zod'
import type { AuthSessionData } from '@/server/session'

import { env } from '@/lib/env.server'
import {
  createGitHubAuthorizationUrl,
  exchangeGitHubCode,
  getAuthenticatedUser,
  getGitHubAppInstallUrl,
  listInstallationRepositories,
  listUserInstallations,
} from '@/server/github-app'
import {
  clearPendingInstallationId,
  consumePendingInstallationId,
  issuePendingInstallationId,
} from '@/server/installation-state'
import { consumeOAuthState, issueOAuthState } from '@/server/oauth-state'
import { authSessionConfig } from '@/server/session'
import type { GitHubInstallationRepository, GitHubUserInstallation } from '@/server/github-app'

async function resolveInstallation(
  accessToken: string,
  installationId?: number | null,
): Promise<{
  installation: GitHubUserInstallation
  repositories?: {
    repositorySelection: string | undefined
    repositories: GitHubInstallationRepository[]
  }
}> {
  const installations = await listUserInstallations(accessToken)

  if (installationId) {
    const installation = installations.find((item) => item.id === installationId)
    if (!installation) {
      throw new Error('GitHub installation not found for this user')
    }

    return { installation }
  }

  if (installations.length === 0) {
    throw new Error('GitHub installation not found for this user')
  }

  if (installations.length === 1) {
    return { installation: installations[0] }
  }

  const candidates = await Promise.all(
    installations.map(async (installation) => ({
      installation,
      repositories: await listInstallationRepositories(accessToken, installation.id),
    })),
  )

  const matchingCandidates = candidates.filter(
    ({ repositories }) =>
      repositories.repositorySelection === 'selected' && repositories.repositories.length === 1,
  )

  if (matchingCandidates.length === 1) {
    return matchingCandidates[0]
  }

  throw new Error('GitHub installation could not be determined automatically')
}

export const beginGitHubInstallation = createServerFn({ method: 'GET' }).handler(async () => {
  throw redirect({
    href: getGitHubAppInstallUrl(),
  })
})

export const beginGitHubAuthorization = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      installationId: z.number().int().positive().optional(),
    }),
  )
  .handler(async ({ data }) => {
    if (data.installationId) {
      issuePendingInstallationId(data.installationId)
    } else {
      clearPendingInstallationId()
    }

    const state = issueOAuthState()

    throw redirect({
      href: createGitHubAuthorizationUrl(state, `${env.appOrigin}/auth/github/callback`),
    })
  })

export const completeGitHubAuthorization = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      code: z.string(),
      state: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    if (!consumeOAuthState(data.state)) {
      throw new Error('GitHub OAuth state verification failed')
    }

    const installationId = consumePendingInstallationId()

    const tokenResponse = await exchangeGitHubCode(
      data.code,
      `${env.appOrigin}/auth/github/callback`,
    )
    const user = await getAuthenticatedUser(tokenResponse.accessToken)
    const resolvedInstallation = await resolveInstallation(
      tokenResponse.accessToken,
      installationId,
    )
    const installation = resolvedInstallation.installation

    const repositories =
      resolvedInstallation.repositories ??
      (await listInstallationRepositories(tokenResponse.accessToken, installation.id))

    const repositorySelection = installation.repositorySelection ?? repositories.repositorySelection

    if (repositorySelection === 'all') {
      throw new Error('GitHub App installation must be limited to selected repositories')
    }

    if (repositories.repositories.length !== 1) {
      throw new Error('Select exactly one GitHub repository for Expense Buddy Web')
    }

    const [repo] = repositories.repositories
    const session = await useSession<AuthSessionData>(authSessionConfig)
    await session.update(() => ({
      installationId: installation.id,
      repoId: repo.id,
      repoFullName: repo.full_name,
      branch: repo.default_branch,
      userId: user.id,
      userLogin: user.login,
    }))

    return {
      installationId: installation.id,
      repoId: repo.id,
      repoFullName: repo.full_name,
      branch: repo.default_branch,
      userLogin: user.login,
    }
  })

export const updateConnectedBranch = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ branch: z.string().min(1) }))
  .handler(async ({ data }) => {
    const session = await useSession<AuthSessionData>(authSessionConfig)
    if (!session.data.installationId || !session.data.repoId || !session.data.repoFullName) {
      throw new Error('No connected repository')
    }

    await session.update((oldData) => ({
      ...oldData,
      branch: data.branch.trim(),
    }))

    return { branch: data.branch.trim() }
  })

export const disconnectGitHubRepo = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useSession<AuthSessionData>(authSessionConfig)
  await session.clear()
  return { ok: true }
})
