import React, { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import Mapbox from "@rnmapbox/maps";

import type { Coordinates, RouteResult } from "@/services/mapbox";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_KEY || "");

type Props = {
  mapRef: React.RefObject<any>;
  originCoords: Coordinates | null;
  destCoords: Coordinates | null;
  route: RouteResult | null;
  userLocation: Coordinates | null;
  hasLocationPermission: boolean;
};

const DEFAULT_CENTER = [77.209, 28.6139];

export default function RNMapView({
  mapRef,
  originCoords,
  destCoords,
  route,
  userLocation,
  hasLocationPermission,
}: Props) {
  return (
    <Mapbox.MapView style={StyleSheet.absoluteFill} logoEnabled={false} scaleBarEnabled={false}>
      <Mapbox.Camera
        zoomLevel={12}
        centerCoordinate={
          userLocation
            ? [userLocation.longitude, userLocation.latitude]
            : DEFAULT_CENTER
        }
        animationMode="flyTo"
        animationDuration={2000}
      />
      
      {userLocation && hasLocationPermission && (
        <Mapbox.UserLocation visible={true} showsUserHeadingIndicator={true} />
      )}

      {originCoords && (
        <Mapbox.PointAnnotation
          id="origin"
          coordinate={[originCoords.longitude, originCoords.latitude]}
        >
          <MarkerPin label="A" color="#00D4FF" />
        </Mapbox.PointAnnotation>
      )}

      {destCoords && (
        <Mapbox.PointAnnotation
          id="destination"
          coordinate={[destCoords.longitude, destCoords.latitude]}
        >
          <MarkerPin label="B" color="#FF3B30" />
        </Mapbox.PointAnnotation>
      )}

      {route && route.coordinates.length > 0 && (
        <Mapbox.ShapeSource
          id="routeSource"
          shape={{
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: route.coordinates.map((c) => [c.longitude, c.latitude]),
            },
            properties: {},
          }}
        >
          <Mapbox.LineLayer
            id="routeLine"
            style={{
              lineColor: "#00D4FF",
              lineWidth: 4,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        </Mapbox.ShapeSource>
      )}
    </Mapbox.MapView>
  );
}

function MarkerPin({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#fff",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>{label}</Text>
    </View>
  );
}
