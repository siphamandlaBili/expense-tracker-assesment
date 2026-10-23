import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { authApi } from "../api/auth";
import { AuthContext } from "./AuthContext";
import {
  clearSession,
  readSession,
  writeSession,
  type Session,
} from "./session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(readSession);

  const signIn = useCallback(
    async (credentials: { accountNumber: string; pin: string }) => {
      const next = await authApi.signIn(credentials);
      writeSession(next);
      setSession(next);
      return next;
    },
    [],
  );

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
    // Drop every cached response so the next user never sees this one's data.
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ session, signIn, signOut }),
    [session, signIn, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
