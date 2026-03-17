export type ColorScheme = {
  text: string;
  textSecondary: string;
  textMuted: string;
  background: string;
  backgroundSecondary: string;
  backgroundCard: string;
  backgroundElevated: string;
  border: string;
  borderStrong: string;
  tint: string;
  tintDark: string;
  tabIconDefault: string;
  tabIconSelected: string;
  danger: string;
  success: string;
  warning: string;
  recording: string;
  gpsActive: string;
  sensorActive: string;
  isDark: boolean;
};

export const darkColors: ColorScheme = {
  text: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.6)",
  textMuted: "rgba(255,255,255,0.35)",
  background: "#0A0E1A",
  backgroundSecondary: "#111827",
  backgroundCard: "#151D2E",
  backgroundElevated: "#1C2539",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(0,212,255,0.25)",
  tint: "#00D4FF",
  tintDark: "#0095B3",
  tabIconDefault: "rgba(255,255,255,0.4)",
  tabIconSelected: "#00D4FF",
  danger: "#FF3B30",
  success: "#34C759",
  warning: "#FF9500",
  recording: "#FF3B30",
  gpsActive: "#34C759",
  sensorActive: "#FF9500",
  isDark: true,
};

export const lightColors: ColorScheme = {
  text: "#0A0E1A",
  textSecondary: "rgba(10,14,26,0.65)",
  textMuted: "rgba(10,14,26,0.38)",
  background: "#F0F4FB",
  backgroundSecondary: "#E4EAF5",
  backgroundCard: "#FFFFFF",
  backgroundElevated: "#EBF0FA",
  border: "rgba(10,14,26,0.1)",
  borderStrong: "rgba(0,100,180,0.35)",
  tint: "#0070A8",
  tintDark: "#005484",
  tabIconDefault: "rgba(10,14,26,0.38)",
  tabIconSelected: "#0070A8",
  danger: "#D92D20",
  success: "#1A9E44",
  warning: "#C46A00",
  recording: "#D92D20",
  gpsActive: "#1A9E44",
  sensorActive: "#C46A00",
  isDark: false,
};

export default {
  dark: darkColors,
  light: darkColors,
};
