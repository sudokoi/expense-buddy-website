const requiredEnvKeys = [
  'GITHUB_APP_ID',
  'GITHUB_APP_CLIENT_ID',
  'GITHUB_APP_CLIENT_SECRET',
  'GITHUB_APP_PRIVATE_KEY',
  'SESSION_PASSWORD',
] as const

type RequiredEnvKey = (typeof requiredEnvKeys)[number]

function readRequiredEnv(name: RequiredEnvKey): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function normalizePrivateKey(value: string): string {
  return value.includes('\\n') ? value.replace(/\\n/g, '\n') : value
}

export const env = {
  githubAppId: readRequiredEnv('GITHUB_APP_ID'),
  githubAppSlug: process.env.GITHUB_APP_SLUG?.trim(),
  githubAppClientId: readRequiredEnv('GITHUB_APP_CLIENT_ID'),
  githubAppClientSecret: readRequiredEnv('GITHUB_APP_CLIENT_SECRET'),
  githubAppPrivateKey: normalizePrivateKey(readRequiredEnv('GITHUB_APP_PRIVATE_KEY')),
  sessionPassword: readRequiredEnv('SESSION_PASSWORD'),
  appOrigin: process.env.APP_ORIGIN?.trim() || 'http://localhost:3000',
} as const
