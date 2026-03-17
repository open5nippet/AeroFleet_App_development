import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

import { ColorScheme, darkColors, lightColors } from "@/constants/colors";

export type ThemePreference = "dark" | "light" | "system";

type ThemeContextType = {
  theme: ThemePreference;
  resolvedTheme: "dark" | "light";
  colors: ColorScheme;
  setTheme: (t: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  resolvedTheme: "dark",
  colors: darkColors,
  setTheme: () => {},
});

const STORAGE_KEY = "aerofleet_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemePreference>("dark");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === "dark" || stored === "light" || stored === "system") {
          setThemeState(stored);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const setTheme = useCallback(async (t: ThemePreference) => {
    setThemeState(t);
    try { await AsyncStorage.setItem(STORAGE_KEY, t); } catch {}
  }, []);

  const resolvedTheme: "dark" | "light" =
    theme === "system" ? (systemScheme === "light" ? "light" : "dark") : theme;

  const colors = resolvedTheme === "light" ? lightColors : darkColors;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
