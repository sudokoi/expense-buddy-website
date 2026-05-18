# Expense Buddy Web

Expense Buddy Web is a read-only web companion for the Expense Buddy Android app.

It reads already-synced expense data from a user-selected GitHub repository and renders a lightweight analytics dashboard. The web app does not create, edit, or delete expense data.

GitHub Actions runs the full verification suite for every pull request and every push to `main`.

## Current Scope

- Public landing page for unauthenticated users
- GitHub App based connect flow
- Read-only repository snapshot loading from the selected sync repo
- Overview analytics dashboard built from synced CSV files
- Empty and auth error states for common onboarding and data issues

## Product Constraints

- The Android app remains the source of truth
- The website is optional and must not be required for mobile usage
- Web auth is separate from mobile auth
- GitHub access is least-privilege and read-only
- Users must install the GitHub App with `Only select repositories`
- Exactly one repository must be selected during setup

## Tech Stack

- TanStack Start
- TanStack Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui with Base UI primitives
- Octokit for GitHub App and repository access
- Vitest for unit tests

## Data Contract

The web app expects the same synced repository shape produced by the Android app.

Primary inputs:

- daily expense files named `expenses-YYYY-MM-DD.csv`
- optional `settings.json`

If no expense CSV files are present, the dashboard shows an empty state instead of failing.

## Environment Variables

Copy `.env.example` and provide real values:

```bash
cp .env.example .env
```

Required variables:

- `GITHUB_APP_ID`
- `GITHUB_APP_SLUG`
- `GITHUB_APP_CLIENT_ID`
- `GITHUB_APP_CLIENT_SECRET`
- `GITHUB_APP_PRIVATE_KEY`
- `SESSION_PASSWORD`

Optional variables:

- `APP_ORIGIN`
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`

Local development usually uses:

```bash
APP_ORIGIN=http://localhost:3000
```

PostHog notes:

- `VITE_POSTHOG_KEY` should be your PostHog project API key and is safe to expose to the browser
- do not put personal API keys or any server-only PostHog credentials in `VITE_` variables
- `VITE_POSTHOG_HOST` should match your PostHog project region, for example `https://us.i.posthog.com` or `https://eu.i.posthog.com`

Node.js version is pinned in `.node-version`. The pnpm version is declared in `package.json` via `packageManager`.

## GitHub App Setup

Configure the GitHub App to support the current flow:

- use a valid app slug matching `GITHUB_APP_SLUG`
- add the callback URL: `http://localhost:3000/auth/github/callback`
- add the setup URL: `http://localhost:3000/github/setup`
- request read-only repository contents access
- require installation with `Only select repositories`

The app currently validates that:

- the installation belongs to the authenticated user
- repository selection mode is `selected`
- exactly one repository is available to the installation

## Local Development

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

The app runs on:

```text
http://localhost:3000
```

## Scripts

```bash
pnpm dev
pnpm build
pnpm preview
pnpm test
pnpm lint
pnpm typecheck
pnpm format
pnpm format:check
```

Run the full local verification flow with:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Project Structure

```text
src/
  components/          Shared UI and dashboard components
  constants/           Static colors and default category definitions
  features/
    analytics/         CSV parsing, filters, aggregations, statistics
    auth/              GitHub auth helpers and server functions
    dashboards/        Dashboard schema and browser-local storage stubs
    github/            Repository snapshot loading
  lib/                 Site config and env access
  routes/              TanStack Start file routes
  server/              Session, cookie, middleware, GitHub App helpers
  types/               Domain and analytics types
```

## Important Routes

- `/` public landing page
- `/connect` starts GitHub App installation
- `/github/setup` handles GitHub's post-install redirect
- `/auth/github/callback` completes GitHub user authorization
- `/app` authenticated analytics dashboard

## Current Testing

Unit coverage currently focuses on small, stable domain logic:

- auth error mapping
- analytics filter parsing
- analytics query currency selection
- custom analytics view validation

Run tests with:

```bash
pnpm test
```

## Continuous Integration

The repository runs one GitHub Actions checks workflow at a time with repository-wide concurrency.

It runs on:

- every pull request
- every push to `main`

The workflow executes:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

It uses the Node.js version declared in `.node-version` instead of hardcoding a version in the workflow.

CI installs pnpm from the repository's `packageManager` declaration before enabling pnpm cache support in `actions/setup-node`.

## Notes

- `src/routeTree.gen.ts` is generated by TanStack Router
- `dist/` is build output and should not be committed
- the current dashboard is intentionally read-only and preset-oriented
- custom dashboard persistence is planned to remain browser-local
