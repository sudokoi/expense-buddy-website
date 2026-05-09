export const siteConfig = {
  name: 'Expense Buddy',
  appName: 'Expense Buddy Web',
  description: 'A read-only web companion for Expense Buddy users who sync their data to GitHub.',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.sudokoi.expensebuddy',
  githubRepoUrl: 'https://github.com/sudokoi/expense-buddy',
} as const

export const defaultMetaTitle = `${siteConfig.appName} | GitHub-backed expense analytics`
