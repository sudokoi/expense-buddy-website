import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { getConnectedSession } from '@/features/auth/github.functions'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    try {
      await getConnectedSession()
    } catch {
      throw redirect({ to: '/', search: { authError: undefined } })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
