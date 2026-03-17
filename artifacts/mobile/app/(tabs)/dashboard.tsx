import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
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
import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function SensorCard({
  label, icon, value, unit, color, C,
}: { label: string; icon: string; value: string; unit: string; color: string; C: ColorScheme }) {
  return (
    <View style={[sensorStyles.card, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
      <View style={[sensorStyles.iconCircle, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <Text style={[sensorStyles.label, { color: C.textMuted }]}>{label}</Text>
      <Text style={[sensorStyles.value, { color: C.text }]}>
        {value}
        <Text style={[sensorStyles.unit, { color: C.textMuted }]}> {unit}</Text>
      </Text>
    </View>
  );
}

const sensorStyles = StyleSheet.create({
  card: {
    flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, gap: 6,
  },
  iconCircle: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, fontFamily: "Inter_500Medium" },
  value: { fontSize: 18, fontFamily: "Inter_700Bold" },
  unit: { fontSize: 12, fontFamily: "Inter_400Regular" },
});

export default function DashboardScreen() {
  const { colors: C } = useTheme();
  const insets = useSafeAreaInsets();
  const { driver } = useAuth();
  const {
    isRecording, recordingDuration, gpsActive, gpsCoords,
    speed, accelerometerData, gyroscopeData, events,
    startRecording, stopRecording,
  } = useRecording();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

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

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRecording) stopRecording();
    else startRecording();
  };

  const accelMag = Math.sqrt(accelerometerData.x ** 2 + accelerometerData.y ** 2 + (accelerometerData.z - 9.81) ** 2);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},
            </Text>
            <Text style={[styles.driverName, { color: C.text, fontFamily: "Inter_700Bold" }]}>
              {driver?.name ?? "Driver"}
            </Text>
          </View>
          <View style={[styles.vehicleBadge, { backgroundColor: C.backgroundCard, borderColor: C.borderStrong }]}>
            <Ionicons name="car-outline" size={13} color={C.tint} />
            <Text style={[styles.vehicleId, { color: C.tint, fontFamily: "Inter_500Medium" }]}>
              {driver?.vehicleId ?? "---"}
            </Text>
          </View>
        </View>

        <View style={[styles.statusBanner, {
          backgroundColor: isRecording ? "rgba(255,59,48,0.1)" : C.backgroundCard,
          borderColor: isRecording ? "rgba(255,59,48,0.4)" : C.border,
        }]}>
          <Animated.View style={[styles.recDot, {
            backgroundColor: isRecording ? C.danger : C.textMuted,
            transform: [{ scale: pulseAnim }],
          }]} />
          <Text style={[styles.statusText, {
            color: isRecording ? C.danger : C.textMuted,
            fontFamily: "Inter_600SemiBold",
          }]}>
            {isRecording ? `REC  ${formatDuration(recordingDuration)}` : "NOT RECORDING"}
          </Text>
          {isRecording && (
            <View style={[styles.clipBadge, { backgroundColor: "rgba(255,59,48,0.2)" }]}>
              <Text style={[styles.clipText, { color: C.danger, fontFamily: "Inter_500Medium" }]}>
                Clip {Math.floor(recordingDuration / 300) + 1}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bigButtonRow}>
          <Pressable onPress={handleToggle} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
            <LinearGradient
              colors={isRecording ? ["#FF3B30", "#C0392B"] : ["#00D4FF", "#0070A8"]}
              style={styles.bigBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={isRecording ? "stop" : "play"} size={28} color="#fff" />
              <Text style={[styles.bigBtnText, { fontFamily: "Inter_700Bold" }]}>
                {isRecording ? "Stop Recording" : "Start Recording"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
            Live Telemetry
          </Text>
          <View style={[styles.liveDot, { backgroundColor: isRecording ? C.success : C.textMuted }]} />
        </View>

        <View style={styles.sensorGrid}>
          <SensorCard C={C} label="Speed" icon="speedometer-outline" value={isRecording ? speed.toFixed(0) : "0"} unit="km/h" color={C.tint} />
          <SensorCard C={C} label="G-Force" icon="analytics-outline" value={isRecording ? accelMag.toFixed(2) : "0.00"} unit="m/s²" color={C.warning} />
        </View>
        <View style={styles.sensorGrid}>
          <SensorCard C={C} label="Accel X" icon="arrow-forward-outline" value={isRecording ? accelerometerData.x.toFixed(3) : "0.000"} unit="g" color={C.success} />
          <SensorCard C={C} label="Accel Z" icon="arrow-up-outline" value={isRecording ? accelerometerData.z.toFixed(3) : "0.000"} unit="g" color={C.success} />
        </View>

        <View style={[styles.gpsCard, { backgroundColor: C.backgroundCard, borderColor: gpsActive ? C.borderStrong : C.border }]}>
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
                <Text style={[styles.coordValue, { color: C.text, fontFamily: "Inter_500Medium" }]}>
                  {gpsCoords.lat.toFixed(6)}°
                </Text>
              </View>
              <View style={[styles.coordDivider, { backgroundColor: C.border }]} />
              <View style={styles.coordItem}>
                <Text style={[styles.coordLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Longitude</Text>
                <Text style={[styles.coordValue, { color: C.text, fontFamily: "Inter_500Medium" }]}>
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

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
            <Text style={[styles.statNum, { color: C.text, fontFamily: "Inter_700Bold" }]}>{events.length}</Text>
            <Text style={[styles.statLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Total Events</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
            <Text style={[styles.statNum, { color: C.success, fontFamily: "Inter_700Bold" }]}>
              {events.filter((e) => e.type === "sos").length === 0 ? "Safe" : `${events.filter((e) => e.type === "sos").length} SOS`}
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
        <View style={{ height: Platform.OS === "web" ? 34 : 100 }} />
      </ScrollView>
    </View>
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
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20,
  },
  recDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 13, flex: 1 },
  clipBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  clipText: { fontSize: 11 },
  bigButtonRow: { marginBottom: 28 },
  bigBtn: {
    borderRadius: 20, height: 64,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
  },
  bigBtnText: { fontSize: 18, color: "#fff" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 16 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  sensorGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  gpsCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
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
  statsRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  statBox: {
    flex: 1, borderRadius: 14, padding: 14, alignItems: "center",
    borderWidth: 1, gap: 4,
  },
  statNum: { fontSize: 17 },
  statLabel: { fontSize: 10, textAlign: "center" },
});
