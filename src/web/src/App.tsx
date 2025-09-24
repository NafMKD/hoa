import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminLayout from "@/admin/components/layout/admin-layout";
import ProtectedRoute from "@/components/protected-route";
import LoginPage from "@/login-page";
import { default as AdminDashboard } from "@/admin/Dashboard"; 
import { ThemeProvider } from "@/components/theme-provider";
import { useState } from "react";

const queryClient = new QueryClient();

export default function App() {
  const [breadcrumb, setBreadcrumb] = useState<React.ReactNode>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin protected routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute role="admin">
                  <AdminLayout breadcrumb={breadcrumb}>
                    <Routes>
                      <Route
                        index
                        element={<AdminDashboard setBreadcrumb={setBreadcrumb} />}
                      />
                      {/* Add more admin pages here */}
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
