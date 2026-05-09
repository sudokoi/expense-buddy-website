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
  consumePendingInstallationId,
  issuePendingInstallationId,
} from '@/server/installation-state'
import { consumeOAuthState, issueOAuthState } from '@/server/oauth-state'
import { authSessionConfig } from '@/server/session'

export const beginGitHubInstallation = createServerFn({ method: 'GET' }).handler(async () => {
  throw redirect({
    href: getGitHubAppInstallUrl(),
  })
})

export const beginGitHubAuthorization = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      installationId: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    issuePendingInstallationId(data.installationId)
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
    if (!installationId) {
      throw new Error('GitHub installation verification expired. Start the connection flow again')
    }

    const tokenResponse = await exchangeGitHubCode(
      data.code,
      `${env.appOrigin}/auth/github/callback`,
    )
    const user = await getAuthenticatedUser(tokenResponse.accessToken)
    const installations = await listUserInstallations(tokenResponse.accessToken)
    const installation = installations.find((item: { id: number }) => item.id === installationId)

    if (!installation) {
      throw new Error('GitHub installation not found for this user')
    }

    const repositories = await listInstallationRepositories(
      tokenResponse.accessToken,
      installation.id,
    )
    if (repositories.repositorySelection !== 'selected') {
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
