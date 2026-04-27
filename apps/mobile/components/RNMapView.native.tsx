import React, { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { UserTrackingMode } from "@rnmapbox/maps";

import type { Coordinates, RouteResult } from "@/services/mapbox";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_KEY || "");

type Props = {
  isDark: boolean;
  isRecording: boolean;
  is3D: boolean;
  mapStyle: "traffic" | "satellite" | "standard";
  originCoords: Coordinates | null;
  destCoords: Coordinates | null;
  route: RouteResult | null;
  userLocation: Coordinates | null;
  hasLocationPermission: boolean;
};

const DEFAULT_CENTER = [77.209, 28.6139];

export default function RNMapView({
  isDark,
  isRecording,
  is3D,
  mapStyle,
  originCoords,
  destCoords,
  route,
  userLocation,
  hasLocationPermission,
}: Props) {
  const cameraProps = React.useMemo(() => {
    if (isRecording) {
      return {
        followUserLocation: true,
        followUserMode: UserTrackingMode.FollowWithCourse,
        followZoomLevel: is3D ? 18.5 : 16,
        followPitch: is3D ? 65 : 0,
        animationDuration: 1500,
        animationMode: "flyTo" as const,
      };
    }

    if (route && route.coordinates.length > 0) {
      const lats = route.coordinates.map((c) => c.latitude);
      const lngs = route.coordinates.map((c) => c.longitude);
      return {
        bounds: {
          ne: [Math.max(...lngs), Math.max(...lats)],
          sw: [Math.min(...lngs), Math.min(...lats)],
          paddingTop: 120,
          paddingRight: 40,
          paddingBottom: 320,
          paddingLeft: 40,
        },
        pitch: is3D ? 65 : 0,
        animationDuration: 1500,
        animationMode: "flyTo" as const,
      };
    }

    return {
      zoomLevel: 12,
      pitch: is3D ? 65 : 0,
      centerCoordinate: userLocation
        ? [userLocation.longitude, userLocation.latitude]
        : originCoords
          ? [originCoords.longitude, originCoords.latitude]
          : DEFAULT_CENTER,
      animationDuration: 1000,
      animationMode: "flyTo" as const,
    };
  }, [route, userLocation, originCoords, isRecording, is3D]);

  return (
    <Mapbox.MapView 
      style={StyleSheet.absoluteFill} 
      logoEnabled={false} 
      scaleBarEnabled={false}
      compassEnabled={true}
      compassViewPosition={1}
      compassViewMargins={{ x: 20, y: 70 }}
      styleURL={
        mapStyle === "satellite" 
          ? Mapbox.StyleURL.SatelliteStreet 
          : mapStyle === "standard" 
            ? (isDark ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Street) 
            : (isDark ? Mapbox.StyleURL.TrafficNight : Mapbox.StyleURL.TrafficDay)
      }
    >
      <Mapbox.Camera {...cameraProps} />
      
      {(isRecording || (userLocation && hasLocationPermission)) && (
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

      {/* 3D Buildings Layer attached directly to the style's built-in composite source */}
      {mapStyle !== "satellite" && (
        <Mapbox.FillExtrusionLayer
          id="building3d"
          sourceID="composite"
          sourceLayerID="building"
          minZoomLevel={15}
          maxZoomLevel={24}
          filter={["==", "extrude", "true"]}
          style={{
            fillExtrusionOpacity: 0.8,
            fillExtrusionColor: isDark ? "#2a2a2a" : "#e2e2e2",
            fillExtrusionHeight: ["get", "height"],
            fillExtrusionBase: ["get", "min_height"],
            fillExtrusionColorTransition: { duration: 2000, delay: 0 },
          }}
        />
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
