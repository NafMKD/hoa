import Dashboard from "@/admin/Dashboard"
import { ThemeProvider } from "@/components/theme-provider"
import LoginPage from "./login-page"

function App() {

  return (
    <ThemeProvider>
      <Dashboard/>
      {/* <LoginPage/> */}
    </ThemeProvider>
  )
}

export default App
