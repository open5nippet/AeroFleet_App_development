import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  const C = Colors.light;
  return (
    <>
      <Stack.Screen options={{ title: "Oops!", headerStyle: { backgroundColor: C.background }, headerTintColor: C.text }} />
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <Ionicons name="warning-outline" size={48} color={C.textMuted} />
        <Text style={[styles.title, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>Screen Not Found</Text>
        <Link href="/" style={[styles.link, { color: C.tint, fontFamily: "Inter_500Medium" }]}>
          Go to Home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  title: { fontSize: 22 },
  link: { fontSize: 16 },
});
