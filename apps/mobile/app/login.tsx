import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Head from "expo-router/head";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors: C } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(1)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill out all fields");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shake();
      return;
    }
    setError("");
    setIsLoading(true);
    Animated.spring(btnAnim, { toValue: 0.95, useNativeDriver: true, tension: 200, friction: 10 }).start();
    try {
      const success = await login(name.trim(), email.trim(), password);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)/dashboard");
      } else {
        setError("Invalid credentials");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shake();
      }
    } finally {
      setIsLoading(false);
      Animated.spring(btnAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <Head>
        <title>Login | AeroFleet</title>
        <meta name="description" content="Sign in to AeroFleet — the AI Dashcam & Fleet Safety Platform for professional drivers." />
        <meta property="og:title" content="Login | AeroFleet" />
        <meta property="og:description" content="Driver login for the AeroFleet fleet safety and dashcam platform." />
      </Head>

      {/* Background Gradients */}
      <LinearGradient
        colors={["rgba(0,212,255,0.12)", "transparent"]}
        style={styles.topGradient}
      />
      <LinearGradient
        colors={["transparent", "rgba(124,58,237,0.06)"]}
        style={styles.bottomGradient}
      />

      {/* Decorative circles */}
      <View style={[styles.orb1, { backgroundColor: "rgba(0,212,255,0.06)" }]} />
      <View style={[styles.orb2, { backgroundColor: "rgba(124,58,237,0.05)" }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        enabled={Platform.OS === "ios"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        >
        {/* Logo Area */}
        <View style={styles.logoArea}>
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={["#00D4FF", "#0070A8"]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Ionicons name="car" size={34} color="#fff" />
            </LinearGradient>
            {/* Glow */}
            <View style={styles.iconGlow} />
          </View>
          <Text style={[styles.appName, { color: C.text, fontFamily: "Inter_700Bold" }]}>AeroFleet</Text>
          <Text style={[styles.tagline, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            AI Dashcam & Fleet Safety
          </Text>
        </View>

        {/* Form */}
        <Animated.View style={[styles.formArea, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={[styles.formTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
            Driver Login
          </Text>

          {/* Name */}
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: C.backgroundCard,
                borderColor: nameFocused ? C.tint : C.border,
              },
            ]}
          >
            <Ionicons name="person-outline" size={18} color={nameFocused ? C.tint : C.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: C.text, fontFamily: "Inter_400Regular" }]}
              placeholder="Driver name"
              placeholderTextColor={C.textMuted}
              value={name}
              onChangeText={(t) => { setName(t); setError(""); }}
              autoCapitalize="words"
              returnKeyType="next"
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
          </View>

          {/* Email */}
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: C.backgroundCard,
                borderColor: emailFocused ? C.tint : C.border,
              },
            ]}
          >
            <Ionicons name="mail-outline" size={18} color={emailFocused ? C.tint : C.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: C.text, fontFamily: "Inter_400Regular" }]}
              placeholder="Driver email"
              placeholderTextColor={C.textMuted}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(""); }}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          {/* Password */}
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: C.backgroundCard,
                borderColor: passFocused ? C.tint : C.border,
              },
            ]}
          >
            <Ionicons name="lock-closed-outline" size={18} color={passFocused ? C.tint : C.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: C.text, fontFamily: "Inter_400Regular" }]}
              placeholder="Password"
              placeholderTextColor={C.textMuted}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(""); }}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={C.textMuted} />
            </Pressable>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color={C.danger} />
              <Text style={[styles.errorText, { color: C.danger, fontFamily: "Inter_400Regular" }]}>{error}</Text>
            </View>
          ) : null}

          {/* Login Button */}
          <Animated.View style={{ transform: [{ scale: btnAnim }] }}>
            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              style={({ pressed }) => [styles.loginBtn, { opacity: pressed || isLoading ? 0.88 : 1 }]}
            >
              <LinearGradient
                colors={["#00D4FF", "#0070A8", "#004E78"]}
                style={styles.loginBtnInner}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={18} color="#fff" />
                    <Text style={[styles.loginBtnText, { fontFamily: "Inter_600SemiBold" }]}>Sign In</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Text style={[styles.hint, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
            Enter your name, email & password to continue
          </Text>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.footerPill, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
            <Ionicons name="shield-checkmark-outline" size={12} color={C.textMuted} />
            <Text style={[styles.footerText, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
              Secure · Encrypted · Monitored
            </Text>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 320 },
  bottomGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 280 },
  orb1: {
    position: "absolute", top: -60, right: -60,
    width: 240, height: 240, borderRadius: 120,
  },
  orb2: {
    position: "absolute", bottom: 60, left: -80,
    width: 200, height: 200, borderRadius: 100,
  },
  inner: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "center" },
  logoArea: { alignItems: "center", marginBottom: 48 },
  iconWrapper: { marginBottom: 16, position: "relative" },
  iconGradient: {
    width: 80, height: 80, borderRadius: 26,
    alignItems: "center", justifyContent: "center",
  },
  iconGlow: {
    position: "absolute",
    top: -6, left: -6, right: -6, bottom: -6,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.25)",
  },
  appName: { fontSize: 34, letterSpacing: -0.5 },
  tagline: { fontSize: 14, marginTop: 5 },
  formArea: { width: "100%", marginTop: 10 },
  formTitle: { fontSize: 22, marginBottom: 24 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 14, height: 54, marginBottom: 12,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  eyeBtn: { padding: 4 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  errorText: { fontSize: 13 },
  loginBtn: { marginTop: 8, borderRadius: 16, overflow: "hidden" },
  loginBtnInner: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  loginBtnText: { color: "#fff", fontSize: 16 },
  hint: { textAlign: "center", fontSize: 12, marginTop: 18 },
  footer: { alignItems: "center", marginTop: "auto", paddingTop: 40 },
  footerPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  footerText: { fontSize: 12 },
});
