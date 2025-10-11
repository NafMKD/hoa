import { Navigate } from "react-router-dom";
import { EncryptedStorage } from "@/lib/EncryptedStorage";

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  // check if token exists in local storage
  const token = EncryptedStorage.getItem("token");

  if (token) {
    return <Navigate to="/admin" replace />;
  }

  // Otherwise show the page (login, register, etc.)
  return <>{children}</>;
}
