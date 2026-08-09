import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Reviewer } from "@/domain/models";
import { services } from "@/services";

interface AuthContextValue {
  reviewer: Reviewer | null;
  isAuthenticated: boolean;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [reviewer, setReviewer] = useState<Reviewer | null>(null);
  const queryClient = useQueryClient();

  const signIn = useCallback(async (input: { email: string; password: string }) => {
    const session = await services.auth.login(input);
    setReviewer(session.reviewer);
  }, []);

  const signOut = useCallback(async () => {
    await services.auth.logout();
    setReviewer(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ reviewer, isAuthenticated: reviewer !== null, signIn, signOut }),
    [reviewer, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
