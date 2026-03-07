import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthScreen } from "./features/auth/auth-screen.tsx";
import { InvoicesScreen } from "./features/invoices/invoices-screen.tsx";
import { PaymentScreen } from "./features/payment/payment-screen.tsx";
import { ProtectedRoute } from "./components/protected-route.tsx";
import { MobileShell } from "./components/mobile-shell.tsx";
import { TelegramGate } from "./components/telegram-gate.tsx";

function App() {
  return (
    <BrowserRouter>
      <TelegramGate>
        <MobileShell>
          <Routes>
            <Route path="/" element={<Navigate to="/invoices" replace />} />
            <Route path="/auth" element={<AuthScreen />} />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <InvoicesScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/:invoiceId"
              element={
                <ProtectedRoute>
                  <PaymentScreen />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MobileShell>
      </TelegramGate>
    </BrowserRouter>
  );
}

export default App;
