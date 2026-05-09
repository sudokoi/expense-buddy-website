import { App } from 'octokit'
import type { OAuthAppAuthentication, OAuthUserAuthentication } from 'octokit'

import { env } from '@/lib/env.server'

export interface GitHubInstallationRepository {
  id: number
  name: string
  full_name: string
  private: boolean
  default_branch: string
  owner: {
    login: string
  }
}

export interface GitHubUserProfile {
  id: number
  login: string
  name: string | null
}

const app = new App({
  appId: env.githubAppId,
  privateKey: env.githubAppPrivateKey,
  oauth: {
    clientId: env.githubAppClientId,
    clientSecret: env.githubAppClientSecret,
  },
})

function createUserOctokit(token: string) {
  return app.getUserOctokit({
    token: {
      type: 'oauth',
      token,
    } as OAuthUserAuthentication,
  })
}

export function getGitHubAppInstallUrl() {
  if (!env.githubAppSlug) {
    throw new Error('Missing required environment variable: GITHUB_APP_SLUG')
  }

  return `https://github.com/apps/${env.githubAppSlug}/installations/new`
}

export function createGitHubAuthorizationUrl(state: string, redirectUri: string) {
  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', env.githubAppClientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)
  url.searchParams.set('prompt', 'select_account')
  return url.toString()
}

export async function exchangeGitHubCode(code: string, redirectUri: string) {
  const auth = (await app.oauth.createToken({
    code,
    redirectUri,
  })) as OAuthAppAuthentication

  if (!auth.token) {
    throw new Error('GitHub did not return a user token')
  }

  return {
    accessToken: auth.token,
    refreshToken: auth.refreshToken,
    expiresAt: auth.expiresAt,
  }
}

export async function getAuthenticatedUser(token: string): Promise<GitHubUserProfile> {
  const octokit = createUserOctokit(token)
  const { data } = await octokit.request('GET /user')
  return {
    id: data.id,
    login: data.login,
    name: data.name,
  }
}

export async function listUserInstallations(token: string) {
  const octokit = createUserOctokit(token)
  const { data } = await octokit.request('GET /user/installations', {
    per_page: 100,
  })

  return data.installations
}

export async function listInstallationRepositories(token: string, installationId: number) {
  const octokit = createUserOctokit(token)
  const { data } = await octokit.request('GET /user/installations/{installation_id}/repositories', {
    installation_id: installationId,
    per_page: 100,
  })

  return {
    repositorySelection: data.repository_selection,
    repositories: data.repositories as GitHubInstallationRepository[],
  }
}

export async function createInstallationOctokit(installationId: number, repositoryIds?: number[]) {
  return app.getInstallationOctokit(installationId, {
    repositoryIds,
    permissions: {
      contents: 'read',
    },
  })
}
