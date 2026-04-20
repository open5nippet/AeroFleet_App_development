import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Driver = {
  id: string;
  name: string;
  vehicleId: string;
  email: string;
};

type AuthContextType = {
  driver: Driver | null;
  isLoading: boolean;
  login: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "aerofleet_driver";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setDriver(JSON.parse(stored));
      } catch (error) {
        console.error('[AuthContext] Failed to restore driver from storage:', error);
      }
      setIsLoading(false);
    })();
  }, []);

  const login = async (name: string, email: string, password: string): Promise<boolean> => {
    if (!name.trim() || !email.trim() || !password.trim()) return false;
    const mockDriver: Driver = {
      id: "DRV-" + Date.now().toString(36).toUpperCase(),
      name: name.trim(),
      vehicleId: "VH-" + Math.floor(1000 + Math.random() * 9000),
      email,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockDriver));
    setDriver(mockDriver);
    return true;
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setDriver(null);
  };

  return (
    <AuthContext.Provider value={{ driver, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
