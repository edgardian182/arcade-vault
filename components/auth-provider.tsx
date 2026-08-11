"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { clearUser, readUser, writeUser, type User } from "@/lib/auth";

type AuthContextValue = {
  user: User;
  login: (user: User) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    setUser(readUser());
  }, []);

  const login = (nextUser: User) => {
    setUser(nextUser);
    writeUser(nextUser);
  };

  const signOut = () => {
    setUser(null);
    clearUser();
  };

  return <AuthContext.Provider value={{ user, login, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
