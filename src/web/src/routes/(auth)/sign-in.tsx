import { createFileRoute } from '@tanstack/react-router'
import SignIn from '@/features/auth/sign-in'

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignIn,
  validateSearch: (search) => ({
    redirect: search.redirect ?? null,
  }),
})
