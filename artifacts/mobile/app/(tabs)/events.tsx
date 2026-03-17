import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EventType, SafetyEvent, useRecording } from "@/context/RecordingContext";
import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";

const EVENT_CONFIG: Record<EventType, { label: string; icon: string; color: string; bg: string }> = {
  harsh_brake: { label: "Harsh Braking", icon: "warning", color: "#FF9500", bg: "rgba(255,149,0,0.15)" },
  acceleration: { label: "Sudden Acceleration", icon: "flash", color: "#00D4FF", bg: "rgba(0,212,255,0.12)" },
  crash: { label: "Crash Detected", icon: "alert-circle", color: "#FF3B30", bg: "rgba(255,59,48,0.15)" },
  sos: { label: "SOS Emergency", icon: "medkit", color: "#FF3B30", bg: "rgba(255,59,48,0.2)" },
  manual: { label: "Manual Report", icon: "document-text", color: "#8E8E93", bg: "rgba(142,142,147,0.15)" },
};

function EventRow({ item, C }: { item: SafetyEvent; C: ColorScheme }) {
  const cfg = EVENT_CONFIG[item.type];
  const date = new Date(item.timestamp);

  return (
    <View style={[styles.eventRow, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
      <View style={[styles.eventIcon, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
      </View>
      <View style={styles.eventContent}>
        <Text style={[styles.eventType, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>{cfg.label}</Text>
        <Text style={[styles.eventTime, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
          {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        {item.location && (
          <Text style={[styles.eventLocation, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            {item.location.lat.toFixed(4)}°, {item.location.lng.toFixed(4)}°
          </Text>
        )}
      </View>
      <View style={styles.eventRight}>
        {item.speed > 0 && (
          <View style={[styles.speedBadge, { backgroundColor: C.backgroundElevated }]}>
            <Text style={[styles.speedText, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
              {item.speed.toFixed(0)}
            </Text>
            <Text style={[styles.speedUnit, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
              km/h
            </Text>
          </View>
        )}
        <View style={[styles.uploadDot, { backgroundColor: cfg.color + "44" }]}>
          <Ionicons name="cloud-upload-outline" size={12} color={cfg.color} />
        </View>
      </View>
    </View>
  );
}

export default function EventsScreen() {
  const { colors: C } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { events } = useRecording();

  const sosCount = events.filter((e) => e.type === "sos").length;
  const brakeCount = events.filter((e) => e.type === "harsh_brake").length;
  const accelCount = events.filter((e) => e.type === "acceleration").length;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.listContent, { paddingTop: topPad + 16 }]}
        ListHeaderComponent={
          <>
            <Text style={[styles.screenTitle, { color: C.text, fontFamily: "Inter_700Bold" }]}>Safety Events</Text>

            <View style={styles.summaryRow}>
              <LinearGradient colors={["rgba(255,59,48,0.15)", "rgba(255,59,48,0.05)"]} style={[styles.summaryCard, { borderColor: "rgba(255,59,48,0.3)" }]}>
                <Text style={[styles.summaryNum, { color: "#FF3B30", fontFamily: "Inter_700Bold" }]}>{sosCount}</Text>
                <Text style={[styles.summaryLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>SOS</Text>
              </LinearGradient>
              <LinearGradient colors={["rgba(255,149,0,0.15)", "rgba(255,149,0,0.05)"]} style={[styles.summaryCard, { borderColor: "rgba(255,149,0,0.3)" }]}>
                <Text style={[styles.summaryNum, { color: "#FF9500", fontFamily: "Inter_700Bold" }]}>{brakeCount}</Text>
                <Text style={[styles.summaryLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Harsh Brake</Text>
              </LinearGradient>
              <LinearGradient colors={["rgba(0,212,255,0.12)", "rgba(0,212,255,0.04)"]} style={[styles.summaryCard, { borderColor: "rgba(0,212,255,0.25)" }]}>
                <Text style={[styles.summaryNum, { color: "#00D4FF", fontFamily: "Inter_700Bold" }]}>{accelCount}</Text>
                <Text style={[styles.summaryLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Acceleration</Text>
              </LinearGradient>
            </View>

            {events.length > 0 && (
              <Text style={[styles.sectionLabel, { color: C.textMuted, fontFamily: "Inter_500Medium" }]}>
                Recent Events
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: C.backgroundCard }]}>
              <Ionicons name="shield-checkmark" size={40} color={C.success} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>No Events Recorded</Text>
            <Text style={[styles.emptyDesc, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
              Safety events will appear here when detected while recording.
            </Text>
          </View>
        }
        renderItem={({ item }) => <EventRow item={item} C={C} />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListFooterComponent={<View style={{ height: Platform.OS === "web" ? 34 : 100 }} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 20 },
  screenTitle: { fontSize: 28, marginBottom: 20 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  summaryCard: {
    flex: 1, borderRadius: 16, padding: 16, alignItems: "center",
    gap: 4, borderWidth: 1,
  },
  summaryNum: { fontSize: 28 },
  summaryLabel: { fontSize: 11, textAlign: "center" },
  sectionLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  eventRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, padding: 14, borderWidth: 1,
  },
  eventIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  eventContent: { flex: 1, gap: 3 },
  eventType: { fontSize: 14 },
  eventTime: { fontSize: 12 },
  eventLocation: { fontSize: 11 },
  eventRight: { alignItems: "flex-end", gap: 6 },
  speedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignItems: "center" },
  speedText: { fontSize: 15 },
  speedUnit: { fontSize: 10 },
  uploadDot: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: { width: 88, height: 88, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 21, maxWidth: 280 },
});
