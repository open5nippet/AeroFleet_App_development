import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";

import { useRecording } from "@/context/RecordingContext";
import { useTheme } from "@/context/ThemeContext";

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
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [permission, requestPermission] = useCameraPermissions();
  const { isRecording, recordingDuration, speed, gpsActive, startRecording, stopRecording, triggerSOS, addEvent } =
    useRecording();

  const [sosPressed, setSosPressed] = useState(false);
  const [videoQuality, setVideoQuality] = useState<VideoQuality>("1080p");
  const [showQualityPicker, setShowQualityPicker] = useState(false);
  const qualityPanelAnim = useRef(new Animated.Value(0)).current;
  const sosAnim = useRef(new Animated.Value(1)).current;
  const recPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(QUALITY_KEY);
        if (stored && QUALITY_OPTIONS.includes(stored as VideoQuality)) {
          setVideoQuality(stored as VideoQuality);
        }
      } catch {}
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

  return (
    <View style={styles.container}>
      {Platform.OS !== "web" ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
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
        colors={["rgba(0,0,0,0.7)", "transparent"]}
        style={[styles.topOverlay, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            {isRecording && (
              <Animated.View style={[styles.recBadge, { transform: [{ scale: recPulse }] }]}>
                <View style={styles.recDot} />
                <Text style={[styles.recText, { fontFamily: "Inter_600SemiBold" }]}>
                  REC {formatDuration(recordingDuration)}
                </Text>
              </Animated.View>
            )}
          </View>
          <View style={styles.topRight}>
            {isRecording && (
              <View style={[styles.speedBadge, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
                <Text style={[styles.speedVal, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                  {speed.toFixed(0)}
                </Text>
                <Text style={[styles.speedUnit, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
                  km/h
                </Text>
              </View>
            )}
            <Pressable
              onPress={openQualityPicker}
              style={[styles.qualityBadge, { backgroundColor: "rgba(0,0,0,0.55)" }]}
            >
              <Ionicons name="videocam-outline" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={[styles.qualityText, { fontFamily: "Inter_600SemiBold" }]}>{videoQuality}</Text>
            </Pressable>
            <View style={[styles.gpsBadge, { backgroundColor: gpsActive ? "rgba(52,199,89,0.3)" : "rgba(0,0,0,0.4)" }]}>
              <Ionicons name="location" size={12} color={gpsActive ? "#34C759" : "rgba(255,255,255,0.4)"} />
              <Text style={[styles.gpsText, { color: gpsActive ? "#34C759" : "rgba(255,255,255,0.4)", fontFamily: "Inter_500Medium" }]}>
                GPS
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.85)"]}
        style={[styles.bottomOverlay, { paddingBottom: bottomPad + 16 }]}
      >
        <View style={styles.eventRow}>
          <Pressable
            onPress={() => handleEvent("harsh_brake")}
            style={({ pressed }) => [styles.eventBtn, { opacity: pressed ? 0.7 : 1, backgroundColor: "rgba(255,149,0,0.2)", borderColor: "rgba(255,149,0,0.5)" }]}
          >
            <Ionicons name="warning" size={16} color="#FF9500" />
            <Text style={[styles.eventBtnText, { color: "#FF9500", fontFamily: "Inter_500Medium" }]}>
              Harsh Brake
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleEvent("acceleration")}
            style={({ pressed }) => [styles.eventBtn, { opacity: pressed ? 0.7 : 1, backgroundColor: "rgba(0,212,255,0.15)", borderColor: "rgba(0,212,255,0.4)" }]}
          >
            <Ionicons name="flash" size={16} color="#00D4FF" />
            <Text style={[styles.eventBtnText, { color: "#00D4FF", fontFamily: "Inter_500Medium" }]}>
              Accel
            </Text>
          </Pressable>
        </View>

        <View style={styles.controlRow}>
          <View style={styles.controlSide}>
            <Pressable
              onPress={handleToggle}
              style={({ pressed }) => [styles.recordBtn, {
                backgroundColor: isRecording ? "rgba(255,59,48,0.9)" : "rgba(0,212,255,0.9)",
                transform: [{ scale: pressed ? 0.93 : 1 }],
              }]}
            >
              <Ionicons name={isRecording ? "stop" : "play"} size={26} color="#fff" />
            </Pressable>
            <Text style={[styles.recordLabel, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
              {isRecording ? "Stop" : "Record"}
            </Text>
          </View>

          <Animated.View style={[styles.sosWrapper, { transform: [{ scale: sosAnim }] }]}>
            <Pressable
              onPress={handleSOS}
              style={({ pressed }) => [styles.sosBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient
                colors={["#FF3B30", "#8B0000"]}
                style={styles.sosBtnInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[styles.sosBtnText, { fontFamily: "Inter_700Bold" }]}>SOS</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <View style={styles.controlSide} />
        </View>
      </LinearGradient>

      {showQualityPicker && (
        <Pressable style={styles.qualityBackdrop} onPress={closeQualityPicker}>
          <Animated.View
            style={[
              styles.qualityPanel,
              { transform: [{ translateY: panelTranslate }] },
            ]}
          >
            <View style={styles.qualityPanelHandle} />
            <Text style={[styles.qualityPanelTitle, { fontFamily: "Inter_700Bold" }]}>
              Recording Quality
            </Text>
            <Text style={[styles.qualityPanelSubtitle, { fontFamily: "Inter_400Regular" }]}>
              Higher quality uses more storage
            </Text>
            <View style={styles.qualityOptions}>
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
                      <View>
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
            </View>
          </Animated.View>
        </Pressable>
      )}
    </View>
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
  topOverlay: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 40 },
  topBar: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  topLeft: {},
  topRight: { flexDirection: "row", gap: 8, alignItems: "center" },
  recBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,59,48,0.8)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#fff" },
  recText: { color: "#fff", fontSize: 12 },
  speedBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    alignItems: "center",
  },
  speedVal: { fontSize: 20, lineHeight: 24 },
  speedUnit: { fontSize: 10 },
  qualityBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8,
  },
  qualityText: { color: "#fff", fontSize: 11 },
  gpsBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  gpsText: { fontSize: 11 },
  bottomOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingTop: 60, paddingHorizontal: 20,
  },
  eventRow: { flexDirection: "row", gap: 12, justifyContent: "center", marginBottom: 24 },
  eventBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 12, borderWidth: 1,
  },
  eventBtnText: { fontSize: 13 },
  controlRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  controlSide: { flex: 1, alignItems: "center" },
  recordBtn: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  recordLabel: { fontSize: 12, marginTop: 6 },
  sosWrapper: {},
  sosBtn: { overflow: "hidden", borderRadius: 46 },
  sosBtnInner: {
    width: 92, height: 92, borderRadius: 46,
    alignItems: "center", justifyContent: "center",
  },
  sosBtnText: { color: "#fff", fontSize: 22 },
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
    paddingBottom: 40,
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
  qualityOptions: { gap: 10 },
  qualityOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  qualityOptionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  qualityDot: { width: 10, height: 10, borderRadius: 5 },
  qualityOptionLabel: { fontSize: 16, marginBottom: 2 },
  qualityOptionDesc: { fontSize: 12 },
});
