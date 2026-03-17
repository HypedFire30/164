import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface User {
  name: string;
  email: string;
  organization: string;
  role: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "164_auth";

const MOCK_USER: User = {
  name: "Ved Shah",
  email: "vedrshah@icloud.com",
  organization: "164 Investments",
  role: "Admin",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  });

  const user: User | null = isAuthenticated ? MOCK_USER : null;

  const login = useCallback((email: string, password: string): boolean => {
    if (
      email.trim() === "vedrshah@icloud.com" &&
      password === "iloveclaude"
    ) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
