import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Head from "expo-router/head";
import React, { useEffect, useRef, useState, useCallback, memo } from "react";
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
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";

import { useRecording } from "@/context/RecordingContext";
import { useTheme } from "@/context/ThemeContext";
import { TAB_BAR_OFFSET } from "@/components/CustomTabBar";

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
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(recPulse, { toValue: 1.15, duration: 700, useNativeDriver: Platform.OS !== "web" }),
          Animated.timing(recPulse, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== "web" }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      recPulse.setValue(1);
    }
  }, [isRecording]);

  const showEventToast = useCallback((msg: string) => {
    setToastMsg(msg);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: Platform.OS !== "web" }),
      Animated.delay(1800),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: Platform.OS !== "web" }),
    ]).start(() => setToastMsg(null));
  }, [toastAnim]);

  const openQualityPicker = useCallback(() => {
    setShowQualityPicker(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(qualityPanelAnim, { toValue: 1, useNativeDriver: Platform.OS !== "web", tension: 60, friction: 10 }).start();
  }, [qualityPanelAnim]);

  const closeQualityPicker = useCallback(() => {
    Animated.timing(qualityPanelAnim, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== "web" }).start(() => {
      setShowQualityPicker(false);
    });
  }, [qualityPanelAnim]);

  const selectQuality = useCallback(async (q: VideoQuality) => {
    Haptics.selectionAsync();
    setVideoQuality(q);
    try { await AsyncStorage.setItem(QUALITY_KEY, q); } catch {}
    closeQualityPicker();
  }, [closeQualityPicker]);

  const handleSOS = useCallback(() => {
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
  }, [sosPressed, triggerSOS, showEventToast, sosAnim]);

  const handleToggle = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, stopRecording, startRecording]);

  const handleEvent = useCallback((type: "harsh_brake" | "acceleration") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    addEvent(type);
    const labels = { harsh_brake: "⚠️ Harsh Brake logged", acceleration: "⚡ Acceleration logged" };
    showEventToast(labels[type]);
  }, [addEvent, showEventToast]);

  const handleFlipCamera = useCallback(() => {
    Haptics.selectionAsync();
    setFacing((f) => (f === "back" ? "front" : "back"));
  }, []);

  if (!permission) return null;

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
        </View>
      </View>
    );
  }

  const panelTranslate = qualityPanelAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });
  const clipNum = Math.floor(recordingDuration / 300) + 1;
  const clipProgress = (recordingDuration % 300) / 300;

  const PortraitHUD = () => (
    <>
      <LinearGradient colors={["rgba(0,0,0,0.8)", "transparent"]} style={[styles.topOverlay, { paddingTop: topPad + 12 }]}>
        <View style={styles.topBar}>
          <View style={styles.topBarSide}>
            {isRecording && (
              <View style={styles.speedBadge}>
                <Text style={[styles.speedVal, { color: "#fff", fontFamily: "Inter_700Bold" }]}>{speed.toFixed(0)}</Text>
                <Text style={[styles.speedUnit, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>km/h</Text>
              </View>
            )}
          </View>
          <View style={styles.topBarCenter}>
            {isRecording && (
              <Animated.View style={[styles.recBadge, { transform: [{ scale: recPulse }] }]}>
                <View style={styles.recDot} />
                <Text style={[styles.recText, { fontFamily: "Inter_600SemiBold" }]}>{formatDuration(recordingDuration)}</Text>
              </Animated.View>
            )}
          </View>
          <View style={styles.topBarRight}>
            <Pressable onPress={openQualityPicker} style={styles.qualityBadge}>
              <Ionicons name="videocam-outline" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={[styles.qualityText, { fontFamily: "Inter_600SemiBold" }]}>{videoQuality}</Text>
            </Pressable>
            <View style={[styles.gpsBadge, { borderColor: gpsActive ? "#34C759" : "rgba(255,255,255,0.15)" }]}>
              <Ionicons name="location" size={14} color={gpsActive ? "#34C759" : "rgba(255,255,255,0.4)"} />
            </View>
          </View>
        </View>
      </LinearGradient>

      <LinearGradient colors={["transparent", "rgba(0,0,0,0.9)"]} style={[styles.bottomOverlay, { paddingBottom: Math.max(bottomPad, 20) + 75 }]}>
        <View style={styles.portraitSimulation}>
          <Text style={styles.mockTitle}>SIMULATE AI EVENTS</Text>
          <View style={styles.mockPills}>
            <Pressable onPress={() => handleEvent("harsh_brake")} style={styles.eventBtnOrange}>
              <Ionicons name="warning" size={18} color="#FF9500" />
              <Text style={styles.eventBtnTextOrange}>Brake</Text>
            </Pressable>
            <Pressable onPress={() => handleEvent("acceleration")} style={styles.eventBtnCyan}>
              <Ionicons name="flash" size={18} color="#00D4FF" />
              <Text style={styles.eventBtnTextCyan}>Accel</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.controlRowPortrait}>
          <Pressable onPress={handleFlipCamera} style={styles.sideActionBtnGrey}>
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </Pressable>

          <View style={{ alignItems: "center" }}>
            <View style={styles.clipRingWrapper}>
              {isRecording && <View style={[styles.clipRing, { borderColor: `rgba(0,212,255,${0.15 + clipProgress * 0.6})`, borderTopColor: "#00D4FF" }]} />}
              <Pressable onPress={handleToggle} style={[styles.recordBtn, { backgroundColor: isRecording ? "#FF3B30" : "#00D4FF" }]}>
                <Ionicons name={isRecording ? "stop" : "play"} size={32} color="#fff" />
              </Pressable>
            </View>
            <Text style={styles.recordLabel}>{isRecording ? `CLIP ${clipNum}` : "STANDBY"}</Text>
          </View>

          <AnimatedSosBtnPortrait sosAnim={sosAnim} onPress={handleSOS} />
        </View>
      </LinearGradient>
    </>
  );

  const LandscapeHUD = () => (
    <>
      <View style={[styles.landscapeTopRow, { top: topPad + 10, left: TAB_BAR_OFFSET + 20, right: 20 }]}>
        <View style={styles.eventRowLandscape}>
          <Pressable onPress={() => handleEvent("harsh_brake")} style={styles.eventBtnOrangeSmall}>
            <Ionicons name="warning" size={16} color="#FF9500" />
            <Text style={styles.eventBtnTextOrange}>Brake</Text>
          </Pressable>
          <Pressable onPress={() => handleEvent("acceleration")} style={styles.eventBtnCyanSmall}>
            <Ionicons name="flash" size={16} color="#00D4FF" />
            <Text style={styles.eventBtnTextCyan}>Accel</Text>
          </Pressable>
        </View>
        
        <View style={styles.topBarRight}>
           <Pressable onPress={openQualityPicker} style={styles.qualityBadge}>
              <Text style={styles.qualityText}>{videoQuality}</Text>
            </Pressable>
            <View style={[styles.gpsBadge, { borderColor: gpsActive ? "#34C759" : "rgba(255,255,255,0.15)" }]}>
              <Ionicons name="location" size={16} color={gpsActive ? "#34C759" : "rgba(255,255,255,0.4)"} />
            </View>
        </View>
      </View>

      <View style={styles.landscapeControls}>
        <Pressable onPress={handleFlipCamera} style={styles.sideActionBtnGrey}>
          <Ionicons name="camera-reverse" size={26} color="#fff" />
        </Pressable>
        
        <View style={{ alignItems: "center" }}>
          <Pressable onPress={handleToggle} style={[styles.recordBtn, { backgroundColor: isRecording ? "#FF3B30" : "#00D4FF" }]}>
            <Ionicons name={isRecording ? "stop" : "play"} size={32} color="#fff" />
          </Pressable>
          <Text style={styles.recordLabelSmall}>{isRecording ? "REC" : "STANDBY"}</Text>
        </View>

        <AnimatedSosBtnPortrait sosAnim={sosAnim} onPress={handleSOS} />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <Head>
        <title>Camera | AeroFleet</title>
      </Head>
      <StatusBar hidden={isLandscape} style="light" />
      
      {Platform.OS !== "web" ? (
        <CameraView style={StyleSheet.absoluteFill} facing={facing} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]}>
          <LinearGradient colors={["rgba(0,212,255,0.05)", "transparent", "rgba(0,0,0,0.8)"]} style={StyleSheet.absoluteFill} />
        </View>
      )}

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {isLandscape ? <LandscapeHUD /> : <PortraitHUD />}
      </View>

      {showQualityPicker && (
        <View style={styles.qualityBackdrop} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={closeQualityPicker} />
          <Animated.View style={[styles.qualityPanel, { paddingBottom: Math.max(bottomPad, 16) + 90, transform: [{ translateY: panelTranslate }] }]}>
            <View style={styles.qualityPanelHandle} />
            <Text style={styles.qualityPanelTitle}>Resolution</Text>
            <ScrollView contentContainerStyle={styles.qualityOptions}>
              {QUALITY_OPTIONS.map((q) => (
                <Pressable key={q} onPress={() => selectQuality(q)} style={[styles.qualityOption, videoQuality === q && styles.qualityOptionActive]}>
                  <Text style={[styles.qualityOptionLabel, { color: videoQuality === q ? "#00D4FF" : "#fff" }]}>{q}</Text>
                  {videoQuality === q && <Ionicons name="checkmark-circle" size={20} color="#00D4FF" />}
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {toastMsg && (
        <Animated.View style={[styles.toast, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }] }]}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const AnimatedSosBtnPortrait = memo(function AnimatedSosBtnPortrait({ sosAnim, onPress }: { sosAnim: Animated.Value; onPress: () => void }) {
  return (
    <Animated.View style={{ transform: [{ scale: sosAnim }] }}>
      <Pressable onPress={onPress} style={styles.sosBtnCircle}>
        <Text style={styles.sosBtnText}>SOS</Text>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  permBox: { borderRadius: 24, padding: 28, alignItems: "center", borderWidth: 1, width: "100%", maxWidth: 360, gap: 12 },
  permIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  permTitle: { fontSize: 22 },
  permDesc: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  permBtn: { width: "100%", borderRadius: 14, overflow: "hidden", marginTop: 8 },
  permBtnInner: { height: 52, alignItems: "center", justifyContent: "center" },
  permBtnText: { color: "#fff", fontSize: 16 },
  topOverlay: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 20 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topBarSide: { flex: 1 },
  topBarCenter: { flex: 1, alignItems: "center" },
  topBarRight: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 10 },
  recBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,59,48,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30" },
  recText: { color: "#FF3B30", fontSize: 13 },
  speedBadge: { backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  speedVal: { fontSize: 20 },
  speedUnit: { fontSize: 10 },
  qualityBadge: { backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 4 },
  qualityText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  gpsBadge: { width: 34, height: 34, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", borderWidth: 1 },
  bottomOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20 },
  portraitSimulation: { alignItems: "center", marginBottom: 25 },
  mockTitle: { color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: 1.5, marginBottom: 12 },
  mockPills: { flexDirection: "row", gap: 16 },
  eventBtnOrange: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, backgroundColor: "rgba(255,149,0,0.15)", borderWidth: 1, borderColor: "rgba(255,149,0,0.4)" },
  eventBtnCyan: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, backgroundColor: "rgba(0,212,255,0.15)", borderWidth: 1, borderColor: "rgba(0,212,255,0.4)" },
  eventBtnOrangeSmall: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(255,149,0,0.2)", borderWidth: 1, borderColor: "rgba(255,149,0,0.4)" },
  eventBtnCyanSmall: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(0,212,255,0.2)", borderWidth: 1, borderColor: "rgba(0,212,255,0.4)" },
  eventBtnTextOrange: { color: "#FF9500", fontWeight: "600" },
  eventBtnTextCyan: { color: "#00D4FF", fontWeight: "600" },
  controlRowPortrait: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10 },
  sideActionBtnGrey: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  sosBtnCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,59,48,0.25)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,59,48,0.5)" },
  sosBtnText: { color: "#FF3B30", fontWeight: "700", fontSize: 15 },
  recordBtn: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  recordLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600", marginTop: 8 },
  recordLabelSmall: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "600", marginTop: 4 },
  clipRingWrapper: { position: "relative" },
  clipRing: { position: "absolute", top: -5, left: -5, right: -5, bottom: -5, borderRadius: 45, borderWidth: 4, borderColor: "transparent" },
  landscapeTopRow: { position: "absolute", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eventRowLandscape: { flexDirection: "row", gap: 12 },
  landscapeControls: { position: "absolute", right: 40, top: 0, bottom: 0, justifyContent: "center", alignItems: "center", gap: 20 },
  qualityBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  qualityPanel: { backgroundColor: "#0E1525", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  qualityPanelHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginBottom: 20 },
  qualityPanelTitle: { fontSize: 20, color: "#fff", fontWeight: "700", marginBottom: 15 },
  qualityOptions: { gap: 12 },
  qualityOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)" },
  qualityOptionActive: { borderColor: "#00D4FF", borderWidth: 1 },
  qualityOptionLabel: { fontSize: 16, fontWeight: "600" },
  toast: { position: "absolute", top: 100, alignSelf: "center", backgroundColor: "rgba(0,0,0,0.8)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "#00D4FF" },
  toastText: { color: "#fff", fontWeight: "600" },
});
