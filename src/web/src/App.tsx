import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminLayout from "@/admin/components/layout/admin-layout";
import ProtectedRoute from "@/components/protected-route";
import LoginPage from "@/login-page";
import { default as AdminDashboard } from "@/admin/Dashboard";
import { ThemeProvider } from "@/components/theme-provider";
import { useState } from "react";
import AddUser from "./admin/components/User-Management/Add-user";
import AllUsers from "./admin/components/User-Management/All-users";
import Invoices from "./admin/components/Financials/Invoices";
import Payments from "./admin/components/Financials/Payments";
import Reconciliation from "./admin/components/Financials/Reconciliation";
import Reports from "./admin/components/Financials/Reports";
import Expenses from "./admin/components/Expenses-Payroll/Expenses";
import Payroll from "./admin/components/Expenses-Payroll/Payroll";
import Vehicles from "./admin/components/Vehicle-Management/Vehicles";
import LostReplacement from "./admin/components/Vehicle-Management/Lost-Replacement";
import Stickers from "./admin/components/Vehicle-Management/Stickers";
import Roles from "./admin/System-Settings/Roles";
import AuditLogs from "./admin/System-Settings/Audit-Logs";
import Documentation from "./admin/Support/Documentation";

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
                        element={
                          <AdminDashboard setBreadcrumb={setBreadcrumb} />
                        }
                      />
                      <Route
                        path="users/add"
                        element={<AddUser setBreadcrumb={setBreadcrumb} />}
                      />
                      <Route
                        path="users/all"
                        element={<AllUsers setBreadcrumb={setBreadcrumb} />}
                      />
                      <Route
                        path="financials/invoices"
                        element={<Invoices setBreadcrumb={setBreadcrumb} />}
                      />
                      <Route
                        path="financials/payments"
                        element={<Payments setBreadcrumb={setBreadcrumb} />}
                      />
                      <Route
                        path="financials/reconciliation"
                        element={<Reconciliation setBreadcrumb={setBreadcrumb} />}
                      />
                      <Route
                        path="financials/reports"
                        element={<Reports />}
                      />
                      <Route
                        path="expenses/list"
                        element={<Expenses />}
                      />
                      <Route
                        path="expenses/payroll"
                        element={<Payroll />}
                      />
                      <Route
                        path="vehicles/list"
                        element={<Vehicles />}
                      />
                      <Route
                        path="vehicles/stickers"
                        element={<Stickers/>}
                      />
                      <Route
                        path="vehicles/replacement"
                        element={<LostReplacement />}
                      />
                      <Route
                        path="settings/roles"
                        element={<Roles />}
                      />
                      <Route
                        path="settings/logs"
                        element={<AuditLogs />}
                      />
                      <Route
                        path="support/docs"
                        element={<Documentation />}
                      />
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
