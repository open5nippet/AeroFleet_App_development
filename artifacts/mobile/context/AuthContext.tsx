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
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "aerofleet_driver";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app launch
  useEffect(() => {
    (async () => {
      try {
        const storedDriver = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedDriver) {
          setDriver(JSON.parse(storedDriver));
        }
      } catch (error) {
        console.error('[AuthContext] Failed to restore session:', error);
      }
      setIsLoading(false);
    })();
  }, []);

  const login = async (name: string, email: string, password: string): Promise<boolean> => {
    if (!name.trim() || !email.trim() || !password.trim()) return false;

    try {
      // TODO: TEMPORARY MOCK LOGIN FOR TESTING
      // Simulate network delay for realistic UI feedback
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockDriver: Driver = {
        id: "mock-driver-123",
        name: name.trim(),
        email: email.trim(),
        vehicleId: "VEH-789-ALPHA",
      };

      // Store driver info and a dummy token
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockDriver));
      await AsyncStorage.setItem("auth_token", "dummy-mock-token-abc-123");

      setDriver(mockDriver);
      return true;

      /* 
      // Original real API implementation (commented out for now)
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
        }),
      });

      if (!response.ok) {
        console.error('[AuthContext] Login failed:', response.status);
        return false;
      }

      const authData = await response.json() as { driver?: Driver; token?: string };

      if (!authData.driver) {
        return false;
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authData.driver));
      if (authData.token) {
        await AsyncStorage.setItem("auth_token", authData.token);
      }

      setDriver(authData.driver);
      return true;
      */
    } catch (error) {
      console.error('[AuthContext] Login error (mock):', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setDriver(null);
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
    }
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
