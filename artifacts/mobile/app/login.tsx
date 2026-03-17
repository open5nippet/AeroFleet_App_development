import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your credentials");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const success = await login(email.trim(), password);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)/dashboard");
      } else {
        setError("Invalid credentials");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <LinearGradient
        colors={["rgba(0,212,255,0.08)", "transparent"]}
        style={styles.topGradient}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
      >
        <View style={styles.logoArea}>
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={["#00D4FF", "#0070A8"]}
              style={styles.iconGradient}
            >
              <Ionicons name="car" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={[styles.appName, { color: C.text }]}>AeroFleet</Text>
          <Text style={[styles.tagline, { color: C.textSecondary }]}>AI Dashcam & Fleet Safety</Text>
        </View>

        <View style={styles.formArea}>
          <Text style={[styles.formTitle, { color: C.text }]}>Driver Login</Text>

          <View style={[styles.inputWrapper, { backgroundColor: C.backgroundCard, borderColor: email ? C.borderStrong : C.border }]}>
            <Ionicons name="mail-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: C.text, fontFamily: "Inter_400Regular" }]}
              placeholder="Driver email"
              placeholderTextColor={C.textMuted}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(""); }}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: C.backgroundCard, borderColor: password ? C.borderStrong : C.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: C.text, fontFamily: "Inter_400Regular" }]}
              placeholder="Password"
              placeholderTextColor={C.textMuted}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(""); }}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={C.textMuted} />
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color={C.danger} />
              <Text style={[styles.errorText, { color: C.danger, fontFamily: "Inter_400Regular" }]}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            style={({ pressed }) => [styles.loginBtn, { opacity: pressed || isLoading ? 0.8 : 1 }]}
          >
            <LinearGradient colors={["#00D4FF", "#0070A8"]} style={styles.loginBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
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

          <Text style={[styles.hint, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
            Enter any email & password to continue
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={[styles.footerDot, { backgroundColor: C.border }]} />
          <Text style={[styles.footerText, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
            Secure • Encrypted • Monitored
          </Text>
          <View style={[styles.footerDot, { backgroundColor: C.border }]} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 300 },
  inner: { flex: 1, paddingHorizontal: 24 },
  logoArea: { alignItems: "center", marginBottom: 48 },
  iconWrapper: { marginBottom: 16 },
  iconGradient: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  appName: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  tagline: { fontSize: 14, marginTop: 4 },
  formArea: { flex: 1 },
  formTitle: { fontSize: 22, fontFamily: "Inter_600SemiBold", marginBottom: 24 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, height: 52, marginBottom: 12,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  eyeBtn: { padding: 4 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  errorText: { fontSize: 13 },
  loginBtn: { marginTop: 8, borderRadius: 14, overflow: "hidden" },
  loginBtnInner: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  loginBtnText: { color: "#fff", fontSize: 16 },
  hint: { textAlign: "center", fontSize: 12, marginTop: 16 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24 },
  footerDot: { width: 4, height: 4, borderRadius: 2 },
  footerText: { fontSize: 12 },
});
