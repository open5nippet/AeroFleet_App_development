import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Head from "expo-router/head";
import React, { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";

import { useRecording } from "@/context/RecordingContext";
import { useTheme } from "@/context/ThemeContext";
import { TAB_BAR_OFFSET } from "@/components/CustomTabBar";
import { useWindowDimensions } from "react-native";

type VideoQuality = "480p" | "720p" | "1080p" | "4K";
const QUALITY_OPTIONS: VideoQuality[] = ["480p", "720p", "1080p", "4K"];
const QUALITY_KEY = "aerofleet_camera_quality";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function CameraScreen() {
  const { colors: C } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [permission, requestPermission] = useCameraPermissions();
  const { isRecording, recordingDuration, speed, gpsActive, startRecording, stopRecording, triggerSOS, addEvent } =
    useRecording();

  const [sosPressed, setSosPressed] = useState(false);
  const [videoQuality, setVideoQuality] = useState<VideoQuality>("1080p");
  const [showQualityPicker, setShowQualityPicker] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const qualityPanelAnim = useRef(new Animated.Value(0)).current;
  const sosAnim = useRef(new Animated.Value(1)).current;
  const recPulse = useRef(new Animated.Value(1)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(QUALITY_KEY);
        if (stored && QUALITY_OPTIONS.includes(stored as VideoQuality)) {
          setVideoQuality(stored as VideoQuality);
        }
      } catch (error) {
        console.error('[Camera] Failed to restore video quality preference:', error);
      }
    })();
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recPulse, { toValue: 1.15, duration: 700, useNativeDriver: Platform.OS !== "web" }),
          Animated.timing(recPulse, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== "web" }),
        ])
      ).start();
    } else {
      recPulse.setValue(1);
    }
  }, [isRecording]);

  const showEventToast = (msg: string) => {
    setToastMsg(msg);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: Platform.OS !== "web" }),
      Animated.delay(1800),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: Platform.OS !== "web" }),
    ]).start(() => setToastMsg(null));
  };

  const openQualityPicker = () => {
    setShowQualityPicker(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(qualityPanelAnim, { toValue: 1, useNativeDriver: Platform.OS !== "web", tension: 60, friction: 10 }).start();
  };

  const closeQualityPicker = () => {
    Animated.timing(qualityPanelAnim, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== "web" }).start(() => {
      setShowQualityPicker(false);
    });
  };

  const selectQuality = async (q: VideoQuality) => {
    Haptics.selectionAsync();
    setVideoQuality(q);
    try { await AsyncStorage.setItem(QUALITY_KEY, q); } catch {}
    closeQualityPicker();
  };

  const handleSOS = () => {
    if (sosPressed) return;
    setSosPressed(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    triggerSOS();
    showEventToast("🆘 SOS sent!");
    Animated.sequence([
      Animated.timing(sosAnim, { toValue: 1.2, duration: 100, useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(sosAnim, { toValue: 1, duration: 100, useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(sosAnim, { toValue: 1.15, duration: 100, useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(sosAnim, { toValue: 1, duration: 150, useNativeDriver: Platform.OS !== "web" }),
    ]).start();
    setTimeout(() => setSosPressed(false), 3000);
    Alert.alert("🚨 SOS Sent", "Emergency alert uploaded. Help is on the way.", [{ text: "OK" }]);
  };

  const handleToggle = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleEvent = (type: "harsh_brake" | "acceleration") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    addEvent(type);
    const labels = { harsh_brake: "⚠️ Harsh Brake logged", acceleration: "⚡ Acceleration logged" };
    showEventToast(labels[type]);
  };

  const handleFlipCamera = () => {
    Haptics.selectionAsync();
    setFacing((f) => (f === "back" ? "front" : "back"));
  };

  if (!permission) {
    return (
      <View style={[styles.centered, { backgroundColor: C.background }]}>
        <Ionicons name="camera" size={48} color={C.textMuted} />
        <Text style={[styles.permText, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>Loading...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { backgroundColor: C.background, paddingTop: topPad }]}>
        <View style={[styles.permBox, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
          <View style={[styles.permIcon, { backgroundColor: C.tint + "1A" }]}>
            <Ionicons name="camera" size={32} color={C.tint} />
          </View>
          <Text style={[styles.permTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>Camera Access</Text>
          <Text style={[styles.permDesc, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            AeroFleet needs camera access to record your drive and detect safety events.
          </Text>
          <Pressable onPress={requestPermission} style={styles.permBtn}>
            <LinearGradient colors={["#00D4FF", "#0070A8"]} style={styles.permBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[styles.permBtnText, { fontFamily: "Inter_600SemiBold" }]}>Allow Camera</Text>
            </LinearGradient>
          </Pressable>
          {!permission.canAskAgain && Platform.OS !== "web" && (
            <Text style={[styles.settingsHint, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
              Go to Settings to enable camera access
            </Text>
          )}
        </View>
      </View>
    );
  }

  const panelTranslate = qualityPanelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  const clipNum = Math.floor(recordingDuration / 300) + 1;
  const clipProgress = (recordingDuration % 300) / 300;

  return (
    <View style={styles.container}>
      <Head>
        <title>Camera | AeroFleet</title>
        <meta name="description" content="AeroFleet dashcam view — record your drive, monitor speed, trigger SOS, and log safety events in real time." />
        <meta property="og:title" content="Camera | AeroFleet" />
        <meta property="og:description" content="AI Dashcam & Fleet Safety Platform — live camera view." />
      </Head>
      <StatusBar hidden={isLandscape} style={C.isDark ? "light" : "dark"} />
      {Platform.OS !== "web" ? (
        <CameraView style={StyleSheet.absoluteFill} facing={facing} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]}>
          <LinearGradient
            colors={["rgba(0,212,255,0.05)", "transparent", "rgba(0,0,0,0.8)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.webCamPlaceholder}>
            <Ionicons name="videocam" size={64} color="rgba(255,255,255,0.15)" />
            <Text style={[styles.webCamText, { color: "rgba(255,255,255,0.25)", fontFamily: "Inter_400Regular" }]}>
              Camera preview (Android/iOS)
            </Text>
          </View>
        </View>
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.8)", "transparent"]}
        style={[
          styles.topOverlay, 
          { 
            paddingTop: topPad + 12,
            paddingLeft: isLandscape ? TAB_BAR_OFFSET + 10 : 20 
          }
        ]}
      >
        <View style={styles.topBar}>
          {/* Left: Speed */}
          <View style={styles.topBarSide}>
            {isRecording && (
              <View style={styles.speedBadge}>
                <Text style={[styles.speedVal, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                  {speed.toFixed(0)}
                </Text>
                <Text style={[styles.speedUnit, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
                  km/h
                </Text>
              </View>
            )}
          </View>
          
          {/* Center: Rec Status */}
          <View style={styles.topBarCenter}>
            {isRecording && (
              <Animated.View style={[styles.recBadge, { transform: [{ scale: recPulse }] }]}>
                <View style={styles.recDot} />
                <Text style={[styles.recText, { fontFamily: "Inter_600SemiBold" }]}>
                  {formatDuration(recordingDuration)}
                </Text>
              </Animated.View>
            )}
          </View>

          {/* Right: GPS & Quality */}
          <View style={styles.topBarRight}>
            <Pressable onPress={openQualityPicker} style={styles.qualityBadge}>
              <Ionicons name="videocam-outline" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={[styles.qualityText, { fontFamily: "Inter_600SemiBold" }]}>{videoQuality}</Text>
            </Pressable>
            <View style={[styles.gpsBadge, { borderColor: gpsActive ? "rgba(52,199,89,0.4)" : "rgba(255,255,255,0.15)" }]}>
              <Ionicons name="location" size={14} color={gpsActive ? "#34C759" : "rgba(255,255,255,0.4)"} />
            </View>
          </View>
        </View>
      </LinearGradient>

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.95)"]}
        style={[
          styles.bottomOverlay, 
          { 
            paddingBottom: bottomPad > 0 ? bottomPad + 75 : 90,
            paddingLeft: isLandscape ? TAB_BAR_OFFSET + 10 : 20
          }
        ]}
      >
        {/* Mock Triggers Row */}
        <View style={styles.eventRow}>
          <Text style={[styles.mockTitle, { fontFamily: "Inter_500Medium" }]}>Simulate AI Events</Text>
          <View style={styles.mockPills}>
            <Pressable onPress={() => handleEvent("harsh_brake")} style={({ pressed }) => [styles.eventBtn, { opacity: pressed ? 0.7 : 1, backgroundColor: "rgba(255,149,0,0.15)", borderColor: "rgba(255,149,0,0.3)" }]}>
              <Ionicons name="warning" size={16} color="#FF9500" />
              <Text style={[styles.eventBtnText, { color: "#FF9500", fontFamily: "Inter_500Medium" }]}>Brake</Text>
            </Pressable>
            <Pressable onPress={() => handleEvent("acceleration")} style={({ pressed }) => [styles.eventBtn, { opacity: pressed ? 0.7 : 1, backgroundColor: "rgba(0,212,255,0.15)", borderColor: "rgba(0,212,255,0.4)" }]}>
              <Ionicons name="flash" size={16} color="#00D4FF" />
              <Text style={[styles.eventBtnText, { color: "#00D4FF", fontFamily: "Inter_500Medium" }]}>Accel</Text>
            </Pressable>
          </View>
        </View>

        {/* Symmetrical Control Bar */}
        <View style={[styles.controlRow, isLandscape ? { position: "absolute", right: TAB_BAR_OFFSET + 12, bottom: bottomPad + 30, flexDirection: "column", alignItems: "center", gap: 12 } : null]}>
          {/* Left: Flip */}
          <Pressable onPress={handleFlipCamera} style={({ pressed }) => [styles.sideActionBtn, { opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </Pressable>

          {/* Center: Record */}
          <View style={{ alignItems: "center" }}>
            <View style={styles.clipRingWrapper}>
              {isRecording && (
                <View
                  style={[
                    styles.clipRing,
                    {
                      borderColor: `rgba(0,212,255,${0.15 + clipProgress * 0.6})`,
                      borderTopColor: "#00D4FF",
                    },
                  ]}
                />
              )}
              <Pressable
                onPress={handleToggle}
                style={({ pressed }) => [styles.recordBtn, {
                  backgroundColor: isRecording ? "rgba(255,59,48,0.9)" : "rgba(0,212,255,0.9)",
                  transform: [{ scale: pressed ? 0.93 : 1 }],
                }]}
              >
                <Ionicons name={isRecording ? "stop" : "play"} size={32} color="#fff" />
              </Pressable>
            </View>
            <Text style={[styles.recordLabel, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_600SemiBold" }]}>
              {isRecording ? `CLIP ${clipNum}` : "STANDBY"}
            </Text>
          </View>

          {/* Right: SOS */}
          <AnimatedSosBtn sosAnim={sosAnim} onPress={handleSOS} />
        </View>
      </LinearGradient>

      {showQualityPicker && (
        <View style={styles.qualityBackdrop} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={closeQualityPicker} />
          <Animated.View
            style={[styles.qualityPanel, { paddingBottom: Math.max(bottomPad, 16) + 90, transform: [{ translateY: panelTranslate }] }]}
          >
            <View style={styles.qualityPanelHandle} />
            <Text style={[styles.qualityPanelTitle, { fontFamily: "Inter_700Bold" }]}>
              Recording Quality
            </Text>
            <Text style={[styles.qualityPanelSubtitle, { fontFamily: "Inter_400Regular" }]}>
              Higher quality uses more storage
            </Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.qualityOptions}
              bounces={false}
            >
              {QUALITY_OPTIONS.map((q) => {
                const active = videoQuality === q;
                const labels: Record<VideoQuality, string> = {
                  "480p": "Standard · 854×480 · Low storage",
                  "720p": "HD · 1280×720 · Balanced",
                  "1080p": "Full HD · 1920×1080 · Recommended",
                  "4K": "4K UHD · 3840×2160 · High quality",
                };
                return (
                  <Pressable
                    key={q}
                    onPress={() => selectQuality(q)}
                    style={({ pressed }) => [
                      styles.qualityOption,
                      active
                        ? { borderColor: "#00D4FF", backgroundColor: "rgba(0,212,255,0.12)" }
                        : { borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)" },
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <View style={styles.qualityOptionLeft}>
                      <View style={[styles.qualityDot, { backgroundColor: active ? "#00D4FF" : "rgba(255,255,255,0.3)" }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.qualityOptionLabel, { color: active ? "#00D4FF" : "#fff", fontFamily: "Inter_600SemiBold" }]}>
                          {q}
                        </Text>
                        <Text style={[styles.qualityOptionDesc, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }]}>
                          {labels[q]}
                        </Text>
                      </View>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={20} color="#00D4FF" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      )}
      {/* Event Toast */}
      {toastMsg && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
            },
          ]}
        >
          <Text style={[styles.toastText, { fontFamily: "Inter_600SemiBold" }]}>{toastMsg}</Text>
        </Animated.View>
      )}
    </View>
  );
}

function AnimatedSosBtn({ sosAnim, onPress }: { sosAnim: Animated.Value; onPress: () => void }) {
  return (
    <Animated.View style={{ transform: [{ scale: sosAnim }] }}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.sideActionBtn, { backgroundColor: "rgba(255,59,48,0.2)", borderColor: "rgba(255,59,48,0.5)", opacity: pressed ? 0.7 : 1 }]}>
        <Text style={{ color: "#FF3B30", fontFamily: "Inter_700Bold", fontSize: 16 }}>SOS</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  permBox: {
    borderRadius: 24, padding: 28, alignItems: "center",
    borderWidth: 1, width: "100%", maxWidth: 360, gap: 12,
  },
  permIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  permTitle: { fontSize: 22 },
  permDesc: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  permBtn: { width: "100%", borderRadius: 14, overflow: "hidden", marginTop: 8 },
  permBtnInner: { height: 52, alignItems: "center", justifyContent: "center" },
  permBtnText: { color: "#fff", fontSize: 16 },
  settingsHint: { fontSize: 12, textAlign: "center" },
  permText: { fontSize: 16, marginTop: 12 },
  webCamPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  webCamText: { fontSize: 14 },
  topOverlay: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 50 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topBarSide: { flex: 1, alignItems: "flex-start" },
  topBarCenter: { flex: 1, alignItems: "center" },
  topBarRight: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  recBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,59,48,0.15)", borderColor: "rgba(255,59,48,0.4)", borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30" },
  recText: { color: "#FF3B30", fontSize: 13, letterSpacing: 0.5 },
  speedBadge: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
    alignItems: "center", alignSelf: "flex-start",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  speedVal: { fontSize: 20, lineHeight: 24 },
  speedUnit: { fontSize: 9, opacity: 0.8 },
  qualityBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  qualityText: { color: "#fff", fontSize: 12 },
  gpsBadge: {
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1,
    width: 30, height: 30, borderRadius: 10,
  },
  bottomOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingTop: 80, paddingHorizontal: 20,
  },
  eventRow: { alignItems: "center", marginBottom: 30 },
  mockTitle: { color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  mockPills: { flexDirection: "row", gap: 12 },
  eventBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  eventBtnText: { fontSize: 13 },
  controlRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 12 },
  sideActionBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center", justifyContent: "center",
    marginTop: 6,
  },
  clipRingWrapper: { position: "relative", alignItems: "center", justifyContent: "center" },
  clipRing: {
    position: "absolute",
    width: 86, height: 86, borderRadius: 43,
    borderWidth: 3, borderColor: "transparent",
  },
  recordBtn: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  recordLabel: { fontSize: 11, marginTop: 12, textTransform: "uppercase", letterSpacing: 1 },
  qualityBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  qualityPanel: {
    backgroundColor: "#0E1525",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 4,
  },
  qualityPanelHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center", marginBottom: 16,
  },
  qualityPanelTitle: { fontSize: 18, color: "#fff", marginBottom: 2 },
  qualityPanelSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 16 },
  qualityOptions: { gap: 10, paddingBottom: 4 },
  qualityOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  qualityOptionLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, paddingRight: 12 },
  qualityDot: { width: 10, height: 10, borderRadius: 5 },
  qualityOptionLabel: { fontSize: 16, marginBottom: 2 },
  qualityOptionDesc: { fontSize: 12 },

  toast: {
    position: "absolute", top: 100, alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 10,
    borderWidth: 1, borderColor: "rgba(0,212,255,0.4)",
  },
  toastText: { color: "#fff", fontSize: 14 },
});
