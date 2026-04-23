import { Ionicons } from "@expo/vector-icons";
import Head from "expo-router/head";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState, useMemo, memo, useCallback } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useRecording } from "@/context/RecordingContext";
import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";
import { TAB_BAR_OFFSET } from "@/components/CustomTabBar";
import { useWindowDimensions } from "react-native";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Animated Circular Speed Gauge ──────────────────────────────────────────
const SpeedGauge = memo(function SpeedGauge({ speed, C }: { speed: number; C: ColorScheme }) {
  const animSpeed = useRef(new Animated.Value(0)).current;
  const MAX_SPEED = 200;

  useEffect(() => {
    Animated.spring(animSpeed, {
      toValue: Math.min(speed, MAX_SPEED),
      tension: 60,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [speed]);

  return (
    <View style={gaugeStyles.container}>
      <View style={gaugeStyles.arcWrapper}>
        {/* Background arc */}
        <View style={[gaugeStyles.arcBg, { borderColor: C.border }]} />
        {/* Speed number */}
        <View style={gaugeStyles.center}>
          <Text style={[gaugeStyles.speedNum, { color: C.tint, fontFamily: "Inter_700Bold" }]}>
            {Math.round(speed)}
          </Text>
          <Text style={[gaugeStyles.speedUnit, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
            km/h
          </Text>
        </View>
        {/* Glow ring */}
        <View
          style={[
            gaugeStyles.glowRing,
            {
              borderColor: speed > 0 ? C.tint : "transparent",
              opacity: speed > 0 ? 0.3 : 0,
            },
          ]}
        />
      </View>
      <Text style={[gaugeStyles.label, { color: C.textMuted, fontFamily: "Inter_500Medium" }]}>
        Speed
      </Text>
    </View>
  );
});

const gaugeStyles = StyleSheet.create({
  container: { alignItems: "center", gap: 4 },
  arcWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  arcBg: {
    position: "absolute",
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 4,
  },
  glowRing: {
    position: "absolute",
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 8,
  },
  center: { alignItems: "center" },
  speedNum: { fontSize: 28, lineHeight: 32 },
  speedUnit: { fontSize: 11 },
  label: { fontSize: 12 },
});

// ─── Sensor Card ─────────────────────────────────────────────────────────────
const SensorCard = memo(function SensorCard({
  label, icon, value, unit, color, C,
}: { label: string; icon: string; value: string; unit: string; color: string; C: ColorScheme }) {
  return (
    <View style={[sensorStyles.card, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
      <View style={[sensorStyles.iconCircle, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon as any} size={15} color={color} />
      </View>
      <Text style={[sensorStyles.label, { color: C.textMuted, fontFamily: "Inter_500Medium" }]}>{label}</Text>
      <Text style={[sensorStyles.value, { color: C.text, fontFamily: "Inter_700Bold" }]}>
        {value}
        <Text style={[sensorStyles.unit, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}> {unit}</Text>
      </Text>
    </View>
  );
});

const sensorStyles = StyleSheet.create({
  card: {
    flex: 1, borderRadius: 18, padding: 14, borderWidth: 1, gap: 6, minWidth: 140,
  },
  iconCircle: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11 },
  value: { fontSize: 17 },
  unit: { fontSize: 11 },
});

// ─── Alert Banner ─────────────────────────────────────────────────────────────
const AlertBanner = memo(function AlertBanner({ message, onDismiss, C }: { message: string; onDismiss: () => void; C: ColorScheme }) {
  const anim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }).start();
    // Clear any existing timeout before setting a new one
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }).start(onDismiss);
    }, 3500);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [message, anim, onDismiss]);

  return (
    <Animated.View
      style={[
        bannerStyles.banner,
        { borderColor: C.warning, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }] },
      ]}
    >
      <LinearGradient colors={["rgba(255,149,0,0.15)", "rgba(255,149,0,0.05)"]} style={StyleSheet.absoluteFill} />
      <Ionicons name="warning" size={16} color={C.warning} />
      <Text style={[bannerStyles.text, { color: C.warning, fontFamily: "Inter_600SemiBold" }]}>{message}</Text>
      <Pressable onPress={onDismiss} style={bannerStyles.close}>
        <Ionicons name="close" size={14} color={C.warning} />
      </Pressable>
    </Animated.View>
  );
});

const bannerStyles = StyleSheet.create({
  banner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 12, overflow: "hidden",
  },
  text: { flex: 1, fontSize: 13 },
  close: { padding: 2 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { colors: C } = useTheme();
  const { driver } = useAuth();
  const {
    isRecording, recordingDuration, gpsActive, gpsCoords,
    speed, accelerometerData, gyroscopeData, events,
    startRecording, stopRecording,
  } = useRecording();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const prevEventCount = useRef(events.length);

  // Header fade-in on mount
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  // Track max speed during session
  useEffect(() => {
    if (isRecording && speed > maxSpeed) setMaxSpeed(speed);
  }, [speed, isRecording]);

  // Reset max speed when session starts
  useEffect(() => {
    if (isRecording) setMaxSpeed(0);
  }, [isRecording]);

  // Alert banner when new safety event detected
  useEffect(() => {
    if (events.length > prevEventCount.current) {
      const latest = events[0];
      const labels: Record<string, string> = {
        harsh_brake: "⚠️ Harsh braking detected",
        acceleration: "⚡ Sudden acceleration detected",
        crash: "🚨 Crash detected!",
        sos: "🆘 SOS triggered",
        manual: "📋 Event manually logged",
      };
      setAlertMsg(labels[latest.type] ?? "Safety event logged");
    }
    prevEventCount.current = events.length;
  }, [events.length]);

  // Record button pulse
  useEffect(() => {
    if (isRecording) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: Platform.OS !== "web" }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== "web" }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const accelMag = useMemo(
    () => Math.sqrt(
      accelerometerData.x ** 2 + accelerometerData.y ** 2 + (accelerometerData.z - 9.81) ** 2
    ),
    [accelerometerData]
  );
  
  const stability = useMemo(
    () => Math.max(0, 1 - (Math.abs(gyroscopeData.x) + Math.abs(gyroscopeData.y)) * 5),
    [gyroscopeData]
  );
  
  const clipNum = useMemo(
    () => Math.floor(recordingDuration / 300) + 1,
    [recordingDuration]
  );

  const safetyStatusText = useMemo(() => {
    const sosCount = events.filter((e) => e.type === "sos").length;
    return sosCount === 0 ? "Safe" : `${sosCount} SOS`;
  }, [events]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={["top"]}>
      <Head>
        <title>Dashboard | AeroFleet</title>
        <meta name="description" content="Live dashcam telemetry, GPS tracking, speed, G-force sensors and fleet safety status for AeroFleet drivers." />
        <meta property="og:title" content="Dashboard | AeroFleet" />
        <meta property="og:description" content="AI Dashcam & Fleet Safety Platform — driver dashboard." />
      </Head>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll, 
          { 
            paddingTop: Platform.OS === "web" ? 83 : 16,
            paddingLeft: isLandscape ? TAB_BAR_OFFSET : 20,
            paddingRight: 20,
            paddingBottom: isLandscape ? 20 : TAB_BAR_OFFSET,
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={isLandscape ? styles.landscapeLayout : styles.portraitLayout}>
          <View style={isLandscape ? styles.leftColumn : null}>
        {/* Alert Banner */}
        {alertMsg && (
          <AlertBanner message={alertMsg} C={C} onDismiss={() => setAlertMsg(null)} />
        )}

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <View>
            <Text style={[styles.greeting, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
              {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"},
            </Text>
            <Text style={[styles.driverName, { color: C.text, fontFamily: "Inter_700Bold" }]}>
              {driver?.name ?? "Driver"}
            </Text>
          </View>
          <View style={[styles.vehicleBadge, { backgroundColor: C.backgroundCard, borderColor: C.borderStrong }]}>
            <Ionicons name="car-outline" size={13} color={C.tint} />
            <Text style={[styles.vehicleId, { color: C.tint, fontFamily: "Inter_600SemiBold" }]}>
              {driver?.vehicleId ?? "---"}
            </Text>
          </View>
        </Animated.View>

        {/* Recording Status Banner */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: isRecording ? "rgba(255,59,48,0.08)" : C.backgroundCard,
              borderColor: isRecording ? "rgba(255,59,48,0.35)" : C.border,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.recDot,
              {
                backgroundColor: isRecording ? C.danger : C.textMuted,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Text style={[styles.statusText, { color: isRecording ? C.danger : C.textMuted, fontFamily: "Inter_600SemiBold" }]}>
            {isRecording ? `REC  ${formatDuration(recordingDuration)}` : "NOT RECORDING"}
          </Text>
          {isRecording && (
            <View style={[styles.clipBadge, { backgroundColor: "rgba(255,59,48,0.18)" }]}>
              <Text style={[styles.clipText, { color: C.danger, fontFamily: "Inter_600SemiBold" }]}>
                CLIP {clipNum}
              </Text>
            </View>
          )}
        </View>

        {/* Main Record Button */}
        <View style={styles.bigButtonRow}>
          <Pressable onPress={handleToggle} style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}>
            <LinearGradient
              colors={isRecording ? ["#FF3B30", "#C0392B"] : ["#00D4FF", "#0070A8"]}
              style={styles.bigBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={isRecording ? "stop" : "play"} size={28} color="#fff" />
              <Text style={[styles.bigBtnText, { fontFamily: "Inter_700Bold" }]}>
                {isRecording ? "Stop" : "Start Recording"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <View style={isLandscape ? styles.rightColumn : null}>

        {/* Trip Summary Strip */}
        {isRecording && (
          <View style={[styles.tripStrip, { backgroundColor: C.backgroundCard, borderColor: C.borderStrong }]}>
            <LinearGradient colors={["rgba(0,212,255,0.06)", "transparent"]} style={StyleSheet.absoluteFill} />
            <View style={styles.tripStat}>
              <Text style={[styles.tripVal, { color: C.tint, fontFamily: "Inter_700Bold" }]}>
                {formatDuration(recordingDuration)}
              </Text>
              <Text style={[styles.tripLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Session</Text>
            </View>
            <View style={[styles.tripDivider, { backgroundColor: C.border }]} />
            <View style={styles.tripStat}>
              <Text style={[styles.tripVal, { color: C.warning, fontFamily: "Inter_700Bold" }]}>
                {maxSpeed.toFixed(0)} <Text style={{ fontSize: 11 }}>km/h</Text>
              </Text>
              <Text style={[styles.tripLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Max Speed</Text>
            </View>
            <View style={[styles.tripDivider, { backgroundColor: C.border }]} />
            <View style={styles.tripStat}>
              <Text style={[styles.tripVal, { color: C.success, fontFamily: "Inter_700Bold" }]}>
                {events.length}
              </Text>
              <Text style={[styles.tripLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Events</Text>
            </View>
          </View>
        )}

        {/* Live Telemetry Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
            Live Telemetry
          </Text>
          <View style={[styles.liveDot, { backgroundColor: isRecording ? C.success : C.textMuted }]} />
        </View>

        {/* Speed Gauge + G-Force row */}
        <View style={[styles.gaugeRow, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
          <SpeedGauge speed={isRecording ? speed : 0} C={C} />
          <View style={[styles.gaugeDivider, { backgroundColor: C.border }]} />
          <View style={styles.gaugeSide}>
            <View style={[styles.miniSensorCard, { backgroundColor: C.backgroundElevated }]}>
              <Ionicons name="analytics-outline" size={14} color={C.warning} />
              <Text style={[styles.miniLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>G-Force</Text>
              <Text style={[styles.miniVal, { color: C.text, fontFamily: "Inter_700Bold" }]}>
                {isRecording ? accelMag.toFixed(2) : "0.00"}
                <Text style={{ fontSize: 10, color: C.textMuted }}> m/s²</Text>
              </Text>
            </View>
            <View style={[styles.miniSensorCard, { backgroundColor: C.backgroundElevated }]}>
              <Ionicons name="pulse-outline" size={14} color={C.accent} />
              <Text style={[styles.miniLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Stability</Text>
              <Text style={[styles.miniVal, { color: stability > 0.7 ? C.success : C.warning, fontFamily: "Inter_700Bold" }]}>
                {isRecording ? `${(stability * 100).toFixed(0)}%` : "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Accel Sensors*/}
        <View style={styles.sensorGrid}>
          <SensorCard C={C} label="Accel X" icon="arrow-forward-outline"
            value={isRecording ? accelerometerData.x.toFixed(3) : "0.000"} unit="g" color={C.success} />
          <SensorCard C={C} label="Accel Z" icon="arrow-up-outline"
            value={isRecording ? accelerometerData.z.toFixed(3) : "0.000"} unit="g" color={C.success} />
        </View>

        {/* GPS Card */}
        <View style={[styles.gpsCard, { backgroundColor: C.backgroundCard, borderColor: gpsActive ? C.borderStrong : C.border }]}>
          <LinearGradient
            colors={gpsActive ? ["rgba(0,212,255,0.05)", "transparent"] : ["transparent", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.gpsHeader}>
            <View style={[styles.gpsIconCircle, { backgroundColor: gpsActive ? "rgba(0,212,255,0.15)" : C.backgroundElevated }]}>
              <Ionicons name="location" size={16} color={gpsActive ? C.tint : C.textMuted} />
            </View>
            <Text style={[styles.gpsTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>GPS Tracking</Text>
            <View style={[styles.gpsBadge, { backgroundColor: gpsActive ? "rgba(52,199,89,0.15)" : C.backgroundElevated }]}>
              <View style={[styles.gpsDot, { backgroundColor: gpsActive ? C.success : C.textMuted }]} />
              <Text style={[styles.gpsStatus, { color: gpsActive ? C.success : C.textMuted, fontFamily: "Inter_500Medium" }]}>
                {gpsActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
          {gpsCoords ? (
            <View style={styles.coordRow}>
              <View style={styles.coordItem}>
                <Text style={[styles.coordLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Latitude</Text>
                <Text style={[styles.coordValue, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
                  {gpsCoords.lat.toFixed(6)}°
                </Text>
              </View>
              <View style={[styles.coordDivider, { backgroundColor: C.border }]} />
              <View style={styles.coordItem}>
                <Text style={[styles.coordLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Longitude</Text>
                <Text style={[styles.coordValue, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
                  {gpsCoords.lng.toFixed(6)}°
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.noGps, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
              Start recording to enable GPS
            </Text>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
            <Text style={[styles.statNum, { color: C.text, fontFamily: "Inter_700Bold" }]}>{events.length}</Text>
            <Text style={[styles.statLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Total Events</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
            <Text style={[styles.statNum, { color: C.success, fontFamily: "Inter_700Bold" }]}>
              {safetyStatusText}
            </Text>
            <Text style={[styles.statLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Safety Status</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
            <Text style={[styles.statNum, { color: C.tint, fontFamily: "Inter_700Bold" }]}>
              {isRecording ? formatDuration(recordingDuration) : "--:--"}
            </Text>
            <Text style={[styles.statLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Session Time</Text>
          </View>
        </View>

        </View>
      </View>
    </ScrollView>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  greeting: { fontSize: 13 },
  driverName: { fontSize: 24, marginTop: 2 },
  vehicleBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1,
  },
  vehicleId: { fontSize: 13 },
  statusBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 20, overflow: "hidden",
  },
  recDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 13, flex: 1 },
  clipBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  clipText: { fontSize: 11 },
  bigButtonRow: { marginBottom: 20 },
  bigBtn: {
    borderRadius: 20, height: 64,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
  },
  bigBtnText: { fontSize: 18, color: "#fff" },
  tripStrip: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20, overflow: "hidden",
  },
  tripStat: { alignItems: "center", gap: 3 },
  tripVal: { fontSize: 18 },
  tripLabel: { fontSize: 10 },
  tripDivider: { width: 1, height: 36 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 16 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  gaugeRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 12, gap: 16, overflow: "hidden",
  },
  gaugeDivider: { width: 1, height: 100 },
  gaugeSide: { flex: 1, gap: 10 },
  miniSensorCard: { borderRadius: 12, padding: 12, gap: 4 },
  miniLabel: { fontSize: 10 },
  miniVal: { fontSize: 16 },
  sensorGrid: { flexDirection: "row", gap: 12, marginBottom: 12, flexWrap: "wrap" },
  gpsCard: { borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  gpsHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  gpsIconCircle: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  gpsTitle: { fontSize: 14, flex: 1 },
  gpsBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  gpsDot: { width: 6, height: 6, borderRadius: 3 },
  gpsStatus: { fontSize: 12 },
  coordRow: { flexDirection: "row", alignItems: "center" },
  coordItem: { flex: 1, alignItems: "center" },
  coordLabel: { fontSize: 11, marginBottom: 4 },
  coordValue: { fontSize: 15 },
  coordDivider: { width: 1, height: 36, marginHorizontal: 16 },
  noGps: { fontSize: 13, textAlign: "center", paddingVertical: 8 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 4, flexWrap: "wrap", justifyContent: "space-between" },
  statBox: {
    flex: 1, borderRadius: 14, padding: 14, alignItems: "center",
    borderWidth: 1, gap: 4, minWidth: 120, flexBasis: "30%",
  },
  statNum: { fontSize: 17 },
  statLabel: { fontSize: 10, textAlign: "center" },
  
  // Responsive dual-column
  landscapeLayout: { flexDirection: "column", gap: 12 },
  portraitLayout: { flexDirection: "column" },
  leftColumn: { width: "100%" },
  rightColumn: { width: "100%", gap: 4 },
});
