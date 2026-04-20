import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Head from "expo-router/head";
import React, { useEffect, useState, useMemo } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "@/context/AuthContext";
import { useRecording } from "@/context/RecordingContext";
import { ThemePreference, useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";
import { TAB_BAR_OFFSET } from "@/components/CustomTabBar";
import { useWindowDimensions } from "react-native";

// ─── Achievement Badge ─────────────────────────────────────────────────────
function AchievementBadge({
  icon, label, desc, unlocked, C,
}: { icon: string; label: string; desc: string; unlocked: boolean; C: ColorScheme }) {
  return (
    <View
      style={[
        achieveStyles.badge,
        {
          backgroundColor: unlocked ? C.backgroundCard : C.backgroundElevated,
          borderColor: unlocked ? C.tint : C.border,
          opacity: unlocked ? 1 : 0.5,
        },
      ]}
    >
      <LinearGradient
        colors={unlocked ? ["rgba(0,212,255,0.1)", "transparent"] : ["transparent", "transparent"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[achieveStyles.iconBox, { backgroundColor: unlocked ? C.tint + "22" : C.backgroundElevated }]}>
        <Ionicons name={icon as any} size={20} color={unlocked ? C.tint : C.textMuted} />
      </View>
      <Text style={[achieveStyles.label, { color: unlocked ? C.text : C.textMuted, fontFamily: "Inter_600SemiBold" }]}>
        {label}
      </Text>
      <Text style={[achieveStyles.desc, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>{desc}</Text>
    </View>
  );
}

const achieveStyles = StyleSheet.create({
  badge: {
    flex: 1, borderRadius: 16, padding: 14, borderWidth: 1,
    alignItems: "center", gap: 6, overflow: "hidden",
  },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 12, textAlign: "center" },
  desc: { fontSize: 10, textAlign: "center" },
});


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
  const { driver, logout } = useAuth();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { events, isRecording, recordingDuration, speed, stopRecording, clearAllEvents } = useRecording();

  // Simulated session distance: speed × time in seconds → meters → km
  const sessionDistanceKm = (speed * recordingDuration) / 3600;
  const clipsRecorded = Math.floor(recordingDuration / 300) + (isRecording ? 1 : 0);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoUpload, setAutoUpload] = useState(true);
  const [clipDuration, setClipDuration] = useState("5 min");

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("aerofleet_profile_pic");
        if (stored) setProfileImage(stored);
      } catch (error) {
        console.error('[Profile] Failed to restore profile image:', error);
      }
    })();
  }, []);

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Profile Photo",
      "Choose a method to update your photo",
      [
        {
          text: "Take a Photo",
          onPress: async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
              Alert.alert("Permission Required", "Camera access is needed to take photos.");
              return;
            }
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled) {
              const uri = result.assets[0].uri;
              setProfileImage(uri);
              try { await AsyncStorage.setItem("aerofleet_profile_pic", uri); } catch (error) { console.error('[Profile] Failed to save profile image (camera):', error); }
            }
          }
        },
        {
          text: "Choose from Gallery",
          onPress: async () => {
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled) {
              const uri = result.assets[0].uri;
              setProfileImage(uri);
              try { await AsyncStorage.setItem("aerofleet_profile_pic", uri); } catch (error) { console.error('[Profile] Failed to save profile image (gallery):', error); }
            }
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleSwitchProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Switch Profile", "Are you sure you want to sign out? This allows another driver to log in on this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Switch",
        style: "destructive",
        onPress: async () => {
          if (isRecording) stopRecording();
          clearAllEvents();
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out of this device?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          if (isRecording) stopRecording();
          clearAllEvents();
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  const handleAlertsToggle = () => {
    Haptics.selectionAsync();
    setAlertsEnabled(!alertsEnabled);
  };

  const handleUploadToggle = () => {
    Haptics.selectionAsync();
    setAutoUpload(!autoUpload);
  };

  const handleClipDuration = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Clip Duration", "Select loop recording video segment duration.", [
      { text: "1 min", onPress: () => setClipDuration("1 min") },
      { text: "3 min", onPress: () => setClipDuration("3 min") },
      { text: "5 min", onPress: () => setClipDuration("5 min") },
      { text: "10 min", onPress: () => setClipDuration("10 min") },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const handlePrivacy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Privacy Overview", "AeroFleet uses end-to-end encryption. Your telemetry data is only visible to your authorized fleet administrator.", [{text: "I Understand"}]);
  };

  // Optimize event-based calculations with memoization
  const profileStats = useMemo(() => {
    let sosCount = 0;
    let nonManualCount = 0;
    for (const e of events) {
      if (e.type === "sos") sosCount++;
      if (e.type !== "manual") nonManualCount++;
    }
    return {
      totalSOS: sosCount,
      safeScore: Math.max(0, 100 - nonManualCount * 5),
    };
  }, [events]);

  const { totalSOS, safeScore } = profileStats;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={["top"]}>
      <Head>
        <title>Profile | AeroFleet</title>
        <meta name="description" content="Driver profile, safety score, theme settings and account management for AeroFleet fleet drivers." />
        <meta property="og:title" content="Profile | AeroFleet" />
        <meta property="og:description" content="AI Dashcam & Fleet Safety Platform — driver profile." />
      </Head>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingTop: 16,
          paddingLeft: isLandscape ? TAB_BAR_OFFSET : 20,
          paddingRight: 20,
          paddingBottom: isLandscape ? 20 : TAB_BAR_OFFSET,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarArea}>
          <Pressable onPress={handlePickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarCircle} />
            ) : (
              <LinearGradient
                colors={["#00D4FF", "#0070A8"]}
                style={styles.avatarCircle}
              >
                <Text style={[styles.avatarInitial, { fontFamily: "Inter_700Bold" }]}>
                  {(driver?.name ?? "D")[0].toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            <View style={[styles.editBadge, { backgroundColor: C.backgroundCard, borderColor: C.borderStrong }]}>
              <Ionicons name="camera" size={14} color={C.tint} />
            </View>
          </Pressable>
          <Text style={[styles.driverName, { color: C.text, fontFamily: "Inter_700Bold" }]}>
            {driver?.name ?? "Driver"}
          </Text>
          <Text style={[styles.driverEmail, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            {driver?.email ?? "—"}
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <View style={[styles.driverIdBadge, { backgroundColor: C.backgroundCard, borderColor: C.borderStrong }]}>
              <Ionicons name="car" size={13} color={C.tint} />
              <Text style={[styles.driverIdText, { color: C.tint, fontFamily: "Inter_600SemiBold" }]}>
                {driver?.vehicleId ?? "---"}
              </Text>
            </View>
            <Pressable onPress={handleSwitchProfile} style={[styles.driverIdBadge, { backgroundColor: "rgba(255,59,48,0.1)", borderColor: "rgba(255,59,48,0.3)" }]}>
              <Ionicons name="swap-horizontal" size={13} color={C.danger} />
              <Text style={[styles.driverIdText, { color: C.danger, fontFamily: "Inter_600SemiBold" }]}>
                Switch Profile
              </Text>
            </Pressable>
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

        {/* Session Stats */}
        {isRecording && (
          <View style={[sessionStyles.card, { backgroundColor: C.backgroundCard, borderColor: C.borderStrong }]}>
            <LinearGradient colors={["rgba(0,212,255,0.06)", "transparent"]} style={StyleSheet.absoluteFill} />
            <Text style={[sessionStyles.title, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>Live Session</Text>
            <View style={sessionStyles.row}>
              <View style={sessionStyles.stat}>
                <Text style={[sessionStyles.val, { color: C.tint, fontFamily: "Inter_700Bold" }]}>
                  {sessionDistanceKm.toFixed(2)} <Text style={{ fontSize: 11 }}>km</Text>
                </Text>
                <Text style={[sessionStyles.label, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Distance</Text>
              </View>
              <View style={[sessionStyles.divider, { backgroundColor: C.border }]} />
              <View style={sessionStyles.stat}>
                <Text style={[sessionStyles.val, { color: C.warning, fontFamily: "Inter_700Bold" }]}>{clipsRecorded}</Text>
                <Text style={[sessionStyles.label, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Clips</Text>
              </View>
              <View style={[sessionStyles.divider, { backgroundColor: C.border }]} />
              <View style={sessionStyles.stat}>
                <Text style={[sessionStyles.val, { color: C.danger, fontFamily: "Inter_700Bold" }]}>{events.length}</Text>
                <Text style={[sessionStyles.label, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Events</Text>
              </View>totalSOS
            </View>
          </View>
        )}

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textMuted, fontFamily: "Inter_500Medium" }]}>ACHIEVEMENTS</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <AchievementBadge
              icon="shield-checkmark"
              label="Safe Driver"
              desc="Zero SOS events"
              unlocked={events.filter((e) => e.type === "sos").length === 0}
              C={C}
            />
            <AchievementBadge
              icon="navigate"
              label="Navigator"
              desc="Used Route Planner"
              unlocked={false}
              C={C}
            />
            <AchievementBadge
              icon="trophy"
              label="Veteran"
              desc="10+ events logged"
              unlocked={events.length >= 10}
              C={C}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textMuted, fontFamily: "Inter_500Medium" }]}>
            DRIVER INFO
          </Text>
          <View style={styles.sectionItems}>
            <MenuItem 
              icon="person-outline" label="Driver ID" value={driver?.id?.slice(0, 12) ?? "---"} color={C.tint} tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} 
              onPress={() => Alert.alert("Restricted", "Driver ID is permanently assigned by your fleet organization and cannot be changed on this device.")}
            />
            <MenuItem 
              icon="car-outline" label="Vehicle" value={driver?.vehicleId ?? "---"} color={C.tint} tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} 
              onPress={() => Alert.alert("Vehicle Info", "Vehicle mapping is managed via the backend control center.")}
            />
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
            <MenuItem onPress={handleAlertsToggle} icon={alertsEnabled ? "notifications-outline" : "notifications-off-outline"} label="Alerts" value={alertsEnabled ? "On" : "Off"} color={alertsEnabled ? C.warning : C.textMuted} tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} />
            <MenuItem onPress={handleUploadToggle} icon="cloud-upload-outline" label="Auto Upload" color={autoUpload ? "#00D4FF" : "#8E8E93"} value={autoUpload ? "On" : "Off"} tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} />
            <MenuItem onPress={handleClipDuration} icon="time-outline" label="Clip Duration" value={clipDuration} color="#8E8E93" tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} />
            <MenuItem onPress={handlePrivacy} icon="shield-checkmark-outline" label="Privacy" color={C.success} tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textMuted, fontFamily: "Inter_500Medium" }]}>
            SUPPORT
          </Text>
          <View style={styles.sectionItems}>
            <MenuItem onPress={() => router.push("/help")} icon="help-circle-outline" label="Help & FAQ" color={C.tint} tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} />
            <MenuItem icon="information-circle-outline" label="App Version" value="2.0.0" color="#8E8E93" tint={C.tint} text={C.text} textMuted={C.textMuted} backgroundCard={C.backgroundCard} border={C.border} />
          </View>
        </View>

        <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.8 : 1 }]}>
          <View style={[styles.logoutInner, { backgroundColor: "rgba(255,59,48,0.1)", borderColor: "rgba(255,59,48,0.3)" }]}>
            <Ionicons name="log-out-outline" size={18} color={C.danger} />
            <Text style={[styles.logoutText, { color: C.danger, fontFamily: "Inter_600SemiBold" }]}>Sign Out</Text>
          </View>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  avatarArea: { alignItems: "center", marginBottom: 28, gap: 8 },
  avatarCircle: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 38, color: "#fff" },
  editBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center", borderWidth: 2,
  },
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

const sessionStyles = StyleSheet.create({
  card: {
    borderRadius: 18, borderWidth: 1, padding: 16,
    marginBottom: 24, overflow: "hidden", gap: 12,
  },
  title: { fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  stat: { alignItems: "center", gap: 3 },
  val: { fontSize: 18 },
  label: { fontSize: 10 },
  divider: { width: 1, height: 36 },
});
