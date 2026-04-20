"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { clearStoredToken, loadCurrentSession } from "../lib/auth-client";
import type { PortalUser } from "../types/portal";

type AuthContextValue = {
  user: PortalUser | null;
  ready: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  logout: () => undefined
});

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    void loadCurrentSession().then((session) => {
      if (!active) {
        return;
      }

      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  function logout() {
    clearStoredToken();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, ready, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
