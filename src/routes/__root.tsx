import Main from '@/components/layout/main'
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <Main>
      <Outlet />
    </Main>
  ),
})
