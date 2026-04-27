import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import type { Coordinates, RouteResult } from "@/services/mapbox";

const C = Colors.light;
const API_BASE = process.env.EXPO_PUBLIC_API_URL;

type Props = {
  isDark?: boolean;
  isRecording?: boolean;
  is3D?: boolean;
  originCoords: Coordinates | null;
  destCoords: Coordinates | null;
  route: RouteResult | null;
  userLocation?: Coordinates | null;
  hasLocationPermission?: boolean;
};

function buildStaticMapUrl(origin: Coordinates | null, dest: Coordinates | null): string | null {
  if (!origin && !dest) return null;
  
  if (!API_BASE?.trim()) return null;
  const base = API_BASE.trim().replace(/\/+$/, "");

  const params = new URLSearchParams();
  if (origin) {
    params.append("originLat", origin.latitude.toString());
    params.append("originLng", origin.longitude.toString());
  }
  if (dest) {
    params.append("destLat", dest.latitude.toString());
    params.append("destLng", dest.longitude.toString());
  }
  
  return `${base}/mapbox/staticmap?${params.toString()}`;
}

export default function RNMapView({ originCoords, destCoords, route }: Props) {
  const mapUrl = buildStaticMapUrl(originCoords, destCoords);

  if (!mapUrl) {
    return (
      <View style={[styles.placeholder, { backgroundColor: C.backgroundElevated }]}>
        <Text style={[styles.placeholderText, { color: C.textMuted }]}>
          Enter locations to see map
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: mapUrl }} style={styles.image} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", height: "100%" },
  image: { width: "100%", height: "100%" },
  placeholder: {
    width: "100%", height: "100%",
    alignItems: "center", justifyContent: "center",
    borderRadius: 18,
  },
  placeholderText: { fontSize: 13 },
});
