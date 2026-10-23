import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "./AuthContext";

/** Renders its children only when signed in; otherwise back to the landing page. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  return session ? children : <Navigate to="/" replace />;
}
