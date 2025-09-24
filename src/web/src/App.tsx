import Dashboard from "@/admin/Dashboard"
import { ThemeProvider } from "@/components/theme-provider"

function App() {

  return (
    <ThemeProvider>
      <Dashboard/>
    </ThemeProvider>
  )
}

export default App
