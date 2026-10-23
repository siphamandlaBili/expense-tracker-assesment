import { createContext, useContext } from "react";
import type { SignInValues } from "../components/auth/signInSchema";
import type { Session } from "./session";

export type AuthContextValue = {
  session: Session | null;
  /** Resolves when signed in; rejects with ApiError (401 for bad credentials). */
  signIn: (credentials: SignInValues) => Promise<Session>;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

/** The signed-in session, for components that only render behind RequireAuth. */
export function useSession() {
  const { session } = useAuth();
  if (!session) throw new Error("useSession requires a signed-in user");
  return session;
}
