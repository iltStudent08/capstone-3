import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
