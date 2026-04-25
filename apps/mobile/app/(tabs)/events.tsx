import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Head from "expo-router/head";
import { useFocusEffect } from "expo-router";
import React, { useState, useCallback, useMemo, memo } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EventType, SafetyEvent, useRecording } from "@/context/RecordingContext";
import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TAB_BAR_OFFSET } from "@/components/CustomTabBar";

const EVENT_CONFIG: Record<EventType, { label: string; icon: string; color: string; bg: string }> = {
  harsh_brake: { label: "Harsh Braking", icon: "warning", color: "#FF9500", bg: "rgba(255,149,0,0.15)" },
  acceleration: { label: "Sudden Acceleration", icon: "flash", color: "#00D4FF", bg: "rgba(0,212,255,0.12)" },
  crash: { label: "Crash Detected", icon: "alert-circle", color: "#FF3B30", bg: "rgba(255,59,48,0.15)" },
  sos: { label: "SOS Emergency", icon: "medkit", color: "#FF3B30", bg: "rgba(255,59,48,0.2)" },
  manual: { label: "Manual Report", icon: "document-text", color: "#8E8E93", bg: "rgba(142,142,147,0.15)" },
};

const FILTER_OPTIONS: { key: EventType | "all"; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "list-outline" },
  { key: "sos", label: "SOS", icon: "medkit-outline" },
  { key: "harsh_brake", label: "Braking", icon: "warning-outline" },
  { key: "acceleration", label: "Accel", icon: "flash-outline" },
  { key: "crash", label: "Crash", icon: "alert-circle-outline" },
];

function EventRow({ item, C }: { item: SafetyEvent; C: ColorScheme }) {
  const cfg = EVENT_CONFIG[item.type];
  const date = new Date(item.timestamp);

  return (
    <View
      style={[
        rowStyles.row,
        {
          backgroundColor: C.backgroundCard,
          borderColor: C.border,
          borderLeftColor: cfg.color,
        },
      ]}
    >
      <View style={[rowStyles.icon, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
      </View>
      <View style={rowStyles.content}>
        <Text style={[rowStyles.type, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>{cfg.label}</Text>
        <Text style={[rowStyles.time, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
          {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        {item.location && (
          <Text style={[rowStyles.location, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            {item.location.lat.toFixed(4)}°, {item.location.lng.toFixed(4)}°
          </Text>
        )}
      </View>
      <View style={rowStyles.right}>
        {item.speed > 0 && (
          <View style={[rowStyles.speedBadge, { backgroundColor: C.backgroundElevated }]}>
            <Text style={[rowStyles.speedText, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
              {item.speed.toFixed(0)}
            </Text>
            <Text style={[rowStyles.speedUnit, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>km/h</Text>
          </View>
        )}
        <View style={[rowStyles.uploadDot, { backgroundColor: cfg.color + "33" }]}>
          <Ionicons name="cloud-upload-outline" size={12} color={cfg.color} />
        </View>
      </View>
    </View>
  );
}

const MemoizedEventRow = memo(EventRow);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, padding: 14, borderWidth: 1,
    borderLeftWidth: 3,
  },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, gap: 3 },
  type: { fontSize: 14 },
  time: { fontSize: 12 },
  location: { fontSize: 11 },
  right: { alignItems: "flex-end", gap: 6 },
  speedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignItems: "center" },
  speedText: { fontSize: 15 },
  speedUnit: { fontSize: 10 },
  uploadDot: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});

export default function EventsScreen() {
  const { colors: C } = useTheme();
  const { events, markEventsRead, clearAllEvents } = useRecording();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [filter, setFilter] = useState<EventType | "all">("all");

  useFocusEffect(
    useCallback(() => {
      markEventsRead();
    }, [markEventsRead])
  );

  const clearAll = () => {
    Alert.alert(
      "Clear All Events",
      "This will permanently delete all logged safety events. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: clearAllEvents,
        },
      ]
    );
  };

  const handleExport = () => {
    Alert.alert(
      "Export Events",
      "CSV export coming soon!\n\nThis feature will let you export your safety event log to share with your fleet manager.",
      [{ text: "Got it" }]
    );
  };

  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);

  // Optimize event counting with single pass instead of N+1 filtering
  const eventCounts = useMemo(() => {
    const counts: Record<EventType | 'all', number> = {
      sos: 0,
      harsh_brake: 0,
      acceleration: 0,
      crash: 0,
      manual: 0,
      all: events.length,
    };
    for (const e of events) {
      if (counts[e.type] !== undefined) counts[e.type]++;
    }
    return counts;
  }, [events]);

  const sosCount = eventCounts.sos;
  const brakeCount = eventCounts.harsh_brake;
  const accelCount = eventCounts.acceleration;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={["top"]}>
      <Head>
        <title>Safety Events | AeroFleet</title>
        <meta name="description" content="View all safety events including SOS alerts, harsh braking, and sudden acceleration logged by AeroFleet during your drive sessions." />
        <meta property="og:title" content="Safety Events | AeroFleet" />
        <meta property="og:description" content="AI Dashcam & Fleet Safety Platform — safety event log." />
      </Head>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.listContent, 
          { 
            paddingLeft: isLandscape ? TAB_BAR_OFFSET : 20,
            paddingRight: 20,
            paddingBottom: isLandscape ? 20 : TAB_BAR_OFFSET,
            paddingTop: Platform.OS === "web" ? 83 : 16 
          }
        ]}
        ListHeaderComponent={
          <>
            {/* Header Row */}
            <View style={styles.headerRow}>
              <Text style={[styles.screenTitle, { color: C.text, fontFamily: "Inter_700Bold" }]}>
                Safety Events
              </Text>
              <View style={styles.headerActions}>
                <Pressable
                  onPress={handleExport}
                  style={[styles.headerBtn, { backgroundColor: C.backgroundCard, borderColor: C.border }]}
                >
                  <Ionicons name="share-outline" size={16} color={C.tint} />
                </Pressable>
                <Pressable
                  onPress={clearAll}
                  style={[styles.headerBtn, { backgroundColor: C.backgroundCard, borderColor: C.border }]}
                >
                  <Ionicons name="trash-outline" size={16} color={C.danger} />
                </Pressable>
              </View>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryRow}>
              <LinearGradient
                colors={["rgba(255,59,48,0.15)", "rgba(255,59,48,0.05)"]}
                style={[styles.summaryCard, { borderColor: "rgba(255,59,48,0.3)" }]}
              >
                <Text style={[styles.summaryNum, { color: "#FF3B30", fontFamily: "Inter_700Bold" }]}>{sosCount}</Text>
                <Text style={[styles.summaryLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>SOS</Text>
              </LinearGradient>
              <LinearGradient
                colors={["rgba(255,149,0,0.15)", "rgba(255,149,0,0.05)"]}
                style={[styles.summaryCard, { borderColor: "rgba(255,149,0,0.3)" }]}
              >
                <Text style={[styles.summaryNum, { color: "#FF9500", fontFamily: "Inter_700Bold" }]}>{brakeCount}</Text>
                <Text style={[styles.summaryLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Harsh Brake</Text>
              </LinearGradient>
              <LinearGradient
                colors={["rgba(0,212,255,0.12)", "rgba(0,212,255,0.04)"]}
                style={[styles.summaryCard, { borderColor: "rgba(0,212,255,0.25)" }]}
              >
                <Text style={[styles.summaryNum, { color: "#00D4FF", fontFamily: "Inter_700Bold" }]}>{accelCount}</Text>
                <Text style={[styles.summaryLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Acceleration</Text>
              </LinearGradient>
            </View>

            {/* Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
              {FILTER_OPTIONS.map((opt) => {
                const active = filter === opt.key;
                const count = eventCounts[opt.key] ?? 0;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setFilter(opt.key)}
                    style={[
                      styles.filterTab,
                      active
                        ? { backgroundColor: C.tint + "22", borderColor: C.tint }
                        : { backgroundColor: C.backgroundCard, borderColor: C.border },
                    ]}
                  >
                    <Ionicons name={opt.icon as any} size={13} color={active ? C.tint : C.textMuted} />
                    <Text style={[styles.filterLabel, { color: active ? C.tint : C.textMuted, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                      {opt.label}
                    </Text>
                    {count > 0 && (
                      <View style={[styles.filterBadge, { backgroundColor: active ? C.tint : C.backgroundElevated }]}>
                        <Text style={[styles.filterBadgeText, { color: active ? "#000" : C.textMuted, fontFamily: "Inter_600SemiBold" }]}>
                          {count}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {filtered.length > 0 && (
              <Text style={[styles.sectionLabel, { color: C.textMuted, fontFamily: "Inter_500Medium" }]}>
                {filter === "all" ? "All Events" : `${EVENT_CONFIG[filter as EventType]?.label ?? ""} Events`}
                {" "}· {filtered.length}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <LinearGradient
              colors={["rgba(0,212,255,0.08)", "transparent"]}
              style={styles.emptyIconBg}
            >
              <Ionicons name="shield-checkmark" size={40} color={C.success} />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
              {filter === "all" ? "No Events Recorded" : "No Events in This Category"}
            </Text>
            <Text style={[styles.emptyDesc, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
              {filter === "all"
                ? "Safety events will appear here when detected while recording."
                : "Try a different filter or start recording to log events."}
            </Text>
          </View>
        }
        renderItem={useCallback(({ item }: { item: SafetyEvent }) => <MemoizedEventRow item={item} C={C} />, [C])}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        removeClippedSubviews={true}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListFooterComponent={null}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  screenTitle: { fontSize: 28 },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: "center", gap: 4, borderWidth: 1 },
  summaryNum: { fontSize: 28 },
  summaryLabel: { fontSize: 11, textAlign: "center" },
  filterScroll: { marginBottom: 16 },
  filterRow: { gap: 8, paddingBottom: 4 },
  filterTab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  filterLabel: { fontSize: 13 },
  filterBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  filterBadgeText: { fontSize: 10 },
  sectionLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIconBg: { width: 88, height: 88, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 21, maxWidth: 280 },
});
