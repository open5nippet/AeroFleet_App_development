import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useRecording } from "@/context/RecordingContext";
import { ThemePreference, useTheme } from "@/context/ThemeContext";

function MenuItem({
  icon, label, value, color, onPress, danger, tint, text, textMuted, backgroundCard, border,
}: {
  icon: string; label: string; value?: string;
  color?: string; onPress?: () => void; danger?: boolean;
  tint: string; text: string; textMuted: string; backgroundCard: string; border: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, {
        backgroundColor: backgroundCard,
        borderColor: border,
        opacity: pressed ? 0.75 : 1,
      }]}
    >
      <View style={[styles.menuIcon, { backgroundColor: (color ?? tint) + "22" }]}>
        <Ionicons name={icon as any} size={18} color={color ?? tint} />
      </View>
      <Text style={[styles.menuLabel, { color: danger ? "#FF3B30" : text, fontFamily: "Inter_500Medium" }]}>
        {label}
      </Text>
      {value ? (
        <Text style={[styles.menuValue, { color: textMuted, fontFamily: "Inter_400Regular" }]}>{value}</Text>
      ) : null}
      {!danger && <Ionicons name="chevron-forward" size={16} color={textMuted} />}
    </Pressable>
  );
}

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: string }[] = [
  { key: "light", label: "Light", icon: "sunny-outline" },
  { key: "dark", label: "Dark", icon: "moon-outline" },
  { key: "system", label: "System", icon: "phone-portrait-outline" },
];

export default function ProfileScreen() {
  const { colors: C, theme, setTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { driver, logout } = useAuth();
  const { events, isRecording } = useRecording();

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const totalSOS = events.filter((e) => e.type === "sos").length;
  const safeScore = Math.max(0, 100 - events.filter((e) => e.type !== "manual").length * 5);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarArea}>
          <LinearGradient
            colors={["#00D4FF", "#0070A8"]}
            style={styles.avatarCircle}
          >
            <Text style={[styles.avatarInitial, { fontFamily: "Inter_700Bold" }]}>
              {(driver?.name ?? "D")[0].toUpperCase()}
            </Text>
          </LinearGradient>
          <Text style={[styles.driverName, { color: C.text, fontFamily: "Inter_700Bold" }]}>
            {driver?.name ?? "Driver"}
          </Text>
          <Text style={[styles.driverEmail, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            {driver?.email ?? "—"}
          </Text>
          <View style={[styles.driverIdBadge, { backgroundColor: C.backgroundCard, borderColor: C.borderStrong }]}>
            <Ionicons name="car" size={13} color={C.tint} />
            <Text style={[styles.driverIdText, { color: C.tint, fontFamily: "Inter_600SemiBold" }]}>
              {driver?.vehicleId ?? "---"}
            </Text>
          </View>
        </View>

        <View style={styles.scoreRow}>
          <View style={[styles.scoreCard, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
            <LinearGradient
              colors={safeScore >= 80 ? ["#34C759", "#1A6E30"] : safeScore >= 60 ? ["#FF9500", "#7A4700"] : ["#FF3B30", "#7A1A15"]}
              style={styles.scoreGradient}
            >
              <Text style={[styles.scoreNum, { fontFamily: "Inter_700Bold" }]}>{safeScore}</Text>
              <Text style={[styles.scoreMax, { fontFamily: "Inter_400Regular" }]}>/100</Text>
            </LinearGradient>
            <Text style={[styles.scoreLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
              Safety Score
            </Text>
          </View>
          <View style={[styles.scoreCard, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
            <View style={[styles.scoreGradient, { backgroundColor: C.tint + "1A", alignItems: "center", justifyContent: "center" }]}>
              <Text style={[styles.scoreNum, { color: C.tint, fontFamily: "Inter_700Bold" }]}>{events.length}</Text>
            </View>
            <Text style={[styles.scoreLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
              Total Events
            </Text>
          </View>
          <View style={[styles.scoreCard, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
            <View style={[styles.scoreGradient, { backgroundColor: totalSOS > 0 ? "rgba(255,59,48,0.12)" : "rgba(52,199,89,0.12)", alignItems: "center", justifyContent: "center" }]}>
              <Text style={[styles.scoreNum, { color: totalSOS > 0 ? C.danger : C.success, fontFamily: "Inter_700Bold" }]}>
                {totalSOS}
              </Text>
            </View>
            <Text style={[styles.scoreLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>SOS Alerts</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textMuted, fontFamily: "Inter_500Medium" }]}>
            DRIVER INFO
          </Text>
          <View style={styles.sectionItems}>
            <MenuItem icon="person-outline" label="Driver ID" value={driver?.id?.slice(0, 12) ?? "---"} color={C.tint} tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} />
            <MenuItem icon="car-outline" label="Vehicle" value={driver?.vehicleId ?? "---"} color={C.tint} tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} />
            <MenuItem
              icon="radio-button-on" label="Status"
              value={isRecording ? "Recording" : "Standby"}
              color={isRecording ? C.danger : C.success}
              tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textMuted, fontFamily: "Inter_500Medium" }]}>
            APPEARANCE
          </Text>
          <View style={[styles.themeCard, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map((opt) => {
                const active = theme === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTheme(opt.key);
                    }}
                    style={[
                      styles.themePill,
                      active
                        ? { backgroundColor: C.tint, borderColor: C.tint }
                        : { backgroundColor: C.backgroundElevated, borderColor: C.border },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={15}
                      color={active ? "#fff" : C.textMuted}
                    />
                    <Text style={[
                      styles.themePillText,
                      { color: active ? "#fff" : C.textMuted, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" },
                    ]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.themeHint, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
              {theme === "system" ? "Follows your device appearance setting" : `Always use ${theme} mode`}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textMuted, fontFamily: "Inter_500Medium" }]}>
            APP SETTINGS
          </Text>
          <View style={styles.sectionItems}>
            <MenuItem icon="notifications-outline" label="Alerts" color={C.warning} tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} />
            <MenuItem icon="cloud-upload-outline" label="Auto Upload" color="#8E8E93" value="On" tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} />
            <MenuItem icon="time-outline" label="Clip Duration" value="5 min" color="#8E8E93" tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} />
            <MenuItem icon="shield-checkmark-outline" label="Privacy" color={C.success} tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textMuted, fontFamily: "Inter_500Medium" }]}>
            SUPPORT
          </Text>
          <View style={styles.sectionItems}>
            <MenuItem icon="help-circle-outline" label="Help & FAQ" color={C.tint} tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} />
            <MenuItem icon="information-circle-outline" label="App Version" value="1.0.0" color="#8E8E93" tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} />
          </View>
        </View>

        <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.8 : 1 }]}>
          <View style={[styles.logoutInner, { backgroundColor: "rgba(255,59,48,0.1)", borderColor: "rgba(255,59,48,0.3)" }]}>
            <Ionicons name="log-out-outline" size={18} color={C.danger} />
            <Text style={[styles.logoutText, { color: C.danger, fontFamily: "Inter_600SemiBold" }]}>Sign Out</Text>
          </View>
        </Pressable>

        <View style={{ height: Platform.OS === "web" ? 34 : 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  avatarArea: { alignItems: "center", marginBottom: 28, gap: 8 },
  avatarCircle: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 38, color: "#fff" },
  driverName: { fontSize: 24, marginTop: 4 },
  driverEmail: { fontSize: 14 },
  driverIdBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
  },
  driverIdText: { fontSize: 13 },
  scoreRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  scoreCard: { flex: 1, borderRadius: 16, padding: 12, alignItems: "center", gap: 8, borderWidth: 1 },
  scoreGradient: { width: "100%", height: 56, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  scoreNum: { fontSize: 22, color: "#fff" },
  scoreMax: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
  scoreLabel: { fontSize: 11, textAlign: "center" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  sectionItems: { gap: 8 },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 1,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15 },
  menuValue: { fontSize: 14 },
  themeCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  themeRow: { flexDirection: "row", gap: 10 },
  themePill: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  themePillText: { fontSize: 13 },
  themeHint: { fontSize: 12, textAlign: "center" },
  logoutBtn: { marginBottom: 12 },
  logoutInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 14, padding: 16, borderWidth: 1,
  },
  logoutText: { fontSize: 16 },
});
