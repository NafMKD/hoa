import {
  QueryClientProvider,
} from '@tanstack/react-query'
import { FontProvider } from '@/context/font-provider'
import { ThemeProvider } from '@/context/theme-provider'
import { RouterProvider } from '@tanstack/react-router'
import '@/index.css'
import queryClient, { router } from './QueryClient'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
              <RouterProvider router={router} />
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
  )
}

export default App