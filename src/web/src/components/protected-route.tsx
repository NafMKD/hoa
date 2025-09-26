import { Navigate } from "react-router-dom";
import { useAuthStore } from "../lib/store";
import React from "react";

interface ProtectedRouteProps {
  role?: "admin" | "user";
  children: React.ReactNode;
}

export default function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  // const { user } = useAuthStore();

  // if (!user) return <Navigate to="/login" replace />;
  // if (role && user.role !== role) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
