import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "REFEREE" | "PLAYER";

export type Permission =
  | "MANAGE_USERS"
  | "MANAGE_PLAYERS"
  | "MANAGE_REFEREES"
  | "MANAGE_TOURNAMENTS"
  | "MANAGE_REGISTRATIONS"
  | "MANAGE_MATCHES"
  | "MANAGE_RESULTS"
  | "MANAGE_RANKINGS"
  | "MANAGE_CLUB_MEMBERSHIPS";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isSuperAdmin: boolean;
  adminRequestStatus?: string;
  permissions?: Permission[];
  isEmailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const { token, user } = response.data.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setToken(token);
    setUser(user);
    return user;
  };

  const register = async (userData: any) => {
    const response = await api.post("/auth/register", userData);
    const { token, user } = response.data.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const refetchUser = async () => {
    try {
      const response = await api.get("/users/profile");
      const updatedUser = response.data.data;
      if (updatedUser) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch {
      // Ignore background refetch failure
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    if (user.role === "SUPER_ADMIN" || user.isSuperAdmin) return true;
    if (user.role === "ADMIN") {
      return user.permissions?.includes(permission) ?? false;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, isLoading, hasPermission, refetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
