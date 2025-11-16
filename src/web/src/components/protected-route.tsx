import { useAuthStore } from "@/stores/auth-store";
import { useEffect, useState } from "react";
import { Loader as LucideLoader } from "lucide-react";
import { Navigate } from "@tanstack/react-router";

interface ProtectedRouteProps {
  role?: "admin" | "accountant" | "secretary" | "homeowner" | "tenant";
  children: React.ReactNode;
}

export default function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const { user, initAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      initAuth().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LucideLoader className="animate-spin w-12 h-12 text-primary" />
      </div>
    );
  }

  if (!user || (role && user.role !== role)) {
    return <Navigate to="/sign-in" search={{redirect: null}} replace />;
  }

  return <>{children}</>;
}