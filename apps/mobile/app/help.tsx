import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Head from "expo-router/head";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";

const FAQS = [
  {
    q: "How does Crash Detection work?",
    a: "AeroFleet actively monitors your phone's gyroscope and accelerometer. If a sudden, extreme G-force change is detected combined with absolute deceleration, a Crash Event is triggered and automatically backed up to the cloud.",
  },
  {
    q: "Does it record the dashcam while the screen is off?",
    a: "Yes! As long as you have pressed 'Start Recording', your front or back camera will continue recording in the background even if your screen is locked. This saves valuable battery on long hauls.",
  },
  {
    q: "Who can see my camera feed?",
    a: "Your telemetry and dashcam footage is purely meant for your safety and liability. Only you and your authorized Fleet Manager can access the event uploads. Video feeds are end-to-end encrypted.",
  },
  {
    q: "Why can't I change my Driver ID?",
    a: "Your Driver ID is permanently assigned to you by your fleet organization. This ensures driving history, safety achievements, and liability records are accurately tracked to your employee profile.",
  },
  {
    q: "What happens when I hit 'Clear All Events'?",
    a: "This will permanently wipe the locally cached safety events from your device's log. However, any events that were automatically uploaded during a live session will still be retained on the backend cloud for your fleet manager.",
  },
];

function FAQItem({ q, a, index, C }: { q: string; a: string; index: number; C: ColorScheme }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <View style={[styles.faqCard, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
      <Pressable
        style={styles.faqHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={[styles.faqQ, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>{q}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={C.textMuted} />
      </Pressable>
      {expanded && (
        <View style={styles.faqBody}>
          <Text style={[styles.faqA, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>{a}</Text>
        </View>
      )}
    </View>
  );
}

export default function HelpScreen() {
  const { colors: C } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 20);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <Head>
        <title>Help & FAQ | AeroFleet</title>
        <meta name="description" content="Help documents and FAQ guidelines for AeroFleet navigation." />
      </Head>

      <LinearGradient
        colors={C.isDark
          ? ["rgba(6,8,16,1)", "rgba(6,8,16,0.9)", "transparent"]
          : ["rgba(240,244,251,1)", "rgba(240,244,251,0.9)", "transparent"]}
        style={[styles.headerGradient, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: C.backgroundElevated, borderColor: C.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: C.text, fontFamily: "Inter_700Bold" }]}>Help & FAQ</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 80, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.mainDescription, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
          Need help navigating the AeroFleet platform? Browse through our frequently asked questions to understand how tracking, telemetry logs, and privacy works on your device.
        </Text>

        <View style={styles.faqList}>
          {FAQS.map((faq, index) => (
            <FAQItem key={index} q={faq.q} a={faq.a} index={index} C={C} />
          ))}
        </View>

        <View style={[styles.contactCard, { backgroundColor: C.tint + "15", borderColor: C.tint + "40" }]}>
          <Ionicons name="headset" size={28} color={C.tint} style={{ marginBottom: 10 }} />
          <Text style={[styles.contactTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>Still need help?</Text>
          <Text style={[styles.contactSub, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            Reach out to your fleet administrator directly through your company portal.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
    paddingBottom: 20, paddingHorizontal: 16,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  backBtnPlaceholder: { width: 40 },
  headerTitle: { fontSize: 18 },
  scroll: { paddingHorizontal: 20 },
  mainDescription: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  faqList: { gap: 12, marginBottom: 32 },
  faqCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  faqHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  faqQ: { flex: 1, fontSize: 15, paddingRight: 10 },
  faqBody: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  faqA: { fontSize: 14, lineHeight: 21 },
  contactCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center" },
  contactTitle: { fontSize: 16 },
  contactSub: { fontSize: 13, textAlign: "center", marginTop: 4, lineHeight: 18 },
});
