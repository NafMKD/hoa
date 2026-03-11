import { Navigate } from "react-router-dom";
import { TOKEN_KEY } from "@/lib/api.ts";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}
