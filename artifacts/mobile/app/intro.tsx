import { useVideoPlayer, VideoView } from "expo-video";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

const { width, height } = Dimensions.get("window");

const videoSource =
  Platform.OS === "web"
    ? undefined
    : require("../assets/aerofleet_intro.mp4");

export default function IntroScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const skipOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  const player = useVideoPlayer(videoSource ?? null, (p) => {
    p.loop = false;
    p.muted = false;
    if (videoSource) p.play();
  });

  const navigateToLogin = useCallback(() => {
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: Platform.OS !== "web",
    }).start(() => {
      router.replace("/login");
    });
  }, [overlayOpacity]);

  useEffect(() => {
    const native = Platform.OS !== "web";
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: native }),
        Animated.spring(logoScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: native }),
      ]),
      Animated.delay(400),
      Animated.timing(skipOpacity, { toValue: 1, duration: 400, useNativeDriver: native }),
    ]).start();

    const timeout = setTimeout(navigateToLogin, 6000);
    return () => clearTimeout(timeout);
  }, [navigateToLogin]);

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener("playingChange", (event) => {
      if (!event.isPlaying && player.currentTime > 0.5) {
        setTimeout(navigateToLogin, 500);
      }
    });
    return () => sub.remove();
  }, [player, navigateToLogin]);

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlayOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }]}>
        {Platform.OS !== "web" && videoSource ? (
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            allowsFullscreen={false}
            nativeControls={false}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: C.background }]} />
        )}

        <View style={[StyleSheet.absoluteFill, styles.darkOverlay]} />
      </Animated.View>

      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <View style={styles.logoBg}>
          <Image
            source={require("../assets/images/aerofleet_logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.textRow}>
          <Text style={[styles.appTitle, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
            Aero<Text style={{ color: C.tint }}>Fleet</Text>
          </Text>
        </View>
        <Text style={[styles.appSubtitle, { color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular" }]}>
          AI Dashcam & Fleet Safety Platform
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.skipWrapper,
          {
            bottom: insets.bottom + (Platform.OS === "web" ? 34 : 24),
            opacity: skipOpacity,
          },
        ]}
      >
        <Pressable
          onPress={navigateToLogin}
          style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.skipText, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_500Medium" }]}>
            Skip
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  darkOverlay: { backgroundColor: "rgba(0,0,0,0.45)" },
  logoContainer: { alignItems: "center", gap: 16, paddingHorizontal: 40 },
  logoBg: {
    width: 200,
    height: 200,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: { width: 190, height: 190 },
  textRow: { flexDirection: "row", alignItems: "baseline" },
  appTitle: { fontSize: 42, letterSpacing: -1 },
  appSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  skipWrapper: { position: "absolute", right: 24 },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  skipText: { fontSize: 14 },
});
