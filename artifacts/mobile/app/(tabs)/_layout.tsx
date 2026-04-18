import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Ionicons, Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { useRecording } from "@/context/RecordingContext";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="dashboard">
        <Icon sf={{ default: "gauge", selected: "gauge.with.dots.needle.67percent" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="camera">
        <Icon sf={{ default: "video", selected: "video.fill" }} />
        <Label>Camera</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="map">
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>Map</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="events">
        <Icon sf={{ default: "exclamationmark.triangle", selected: "exclamationmark.triangle.fill" }} />
        <Label>Events</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

import { CustomTabBar } from "@/components/CustomTabBar";

function ClassicTabLayout() {
  const { colors: C } = useTheme();
  const { unreadCount } = useRecording();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { width } = useWindowDimensions();
  const isSmall = width < 380;
  const eventBadge = unreadCount > 0 ? unreadCount : undefined;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // CustomTabBar owns all rendering
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="gauge" tintColor={color} size={22} />
            ) : (
              <Ionicons name="speedometer-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="video" tintColor={color} size={22} />
            ) : (
              <Feather name="video" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="map" tintColor={color} size={22} />
            ) : (
              <Ionicons name="map-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarBadge: eventBadge,
          tabBarBadgeStyle: { backgroundColor: C.danger, fontSize: 10 },
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="exclamationmark.triangle" tintColor={color} size={22} />
            ) : (
              <Ionicons name="warning-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={22} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
