import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Head from "expo-router/head";
import React, { useCallback, useRef, useState, useEffect, memo } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import RNMapView from "@/components/RNMapView";
import { ColorScheme } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useRecording } from "@/context/RecordingContext";
import { TAB_BAR_OFFSET } from "@/components/CustomTabBar";
import {
  Coordinates,
  GeocodeResult,
  RouteResult,
  formatDistance,
  formatDuration,
  geocodePlace,
  getRoute,
} from "@/services/mapbox";

const IS_WEB = Platform.OS === "web";
type SearchField = "origin" | "destination" | null;

const SuggestionItem = memo(function SuggestionItem({ item, onPress, C }: { item: GeocodeResult; onPress: () => void; C: ColorScheme }) {
  const [name, ...rest] = item.place_name.split(",");
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.suggItem,
        { backgroundColor: pressed ? C.backgroundElevated : C.backgroundCard, borderColor: C.border },
      ]}
    >
      <View style={[styles.suggIcon, { backgroundColor: C.tint + "1A" }]}>
        <Ionicons name="location-outline" size={14} color={C.tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.suggName, { color: C.text, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>{name}</Text>
        {rest.length > 0 && (
          <Text style={[styles.suggSub, { color: C.textMuted, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
            {rest.join(",").trim()}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

export default function MapScreen() {
  const { colors: C } = useTheme();
  const { isRecording, startRecording, stopRecording } = useRecording();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const topPad = IS_WEB ? 67 : insets.top;
  const bottomPad = IS_WEB ? 34 : insets.bottom;
  const isSmall = width < 380;

  const mapRef = useRef<any>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");
  const [activeField, setActiveField] = useState<SearchField>(null);
  const [originFocused, setOriginFocused] = useState(false);
  const [destFocused, setDestFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [originCoords, setOriginCoords] = useState<Coordinates | null>(null);
  const [destCoords, setDestCoords] = useState<Coordinates | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locPermission, requestLocPermission] = Location.useForegroundPermissions();
  const cardAnim = useRef(new Animated.Value(0)).current;
  const topUiAnim = useRef(new Animated.Value(1)).current;

  // Navigation Camera Animation Effect
  React.useEffect(() => {
    Animated.spring(topUiAnim, {
      toValue: isRecording ? 0 : 1,
      tension: 60,
      friction: 12,
      useNativeDriver: true,
    }).start();

    if (!IS_WEB && mapRef.current) {
      if (isRecording) {
        setTimeout(() => {
          mapRef.current?.animateCamera?.({
            center: userLocation || originCoords || { latitude: 28.6139, longitude: 77.209 },
            pitch: 65,
            zoom: 18.5,
            heading: 0,
          }, { duration: 1500 });
        }, 100);
      } else if (route) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates?.(route.coordinates, {
            edgePadding: { top: 120, right: 40, bottom: isSmall ? 280 : 320, left: 40 },
            animated: true,
          });
        }, 100);
      }
    }
  }, [isRecording]);

  // Cleanup debounce timeout on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, []);

  const search = useCallback((text: string) => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!text.trim() || text.length < 2) { setSuggestions([]); return; }
    setLoadingSugg(true);
    searchDebounce.current = setTimeout(async () => {
      const results = await geocodePlace(text);
      setSuggestions(results);
      setLoadingSugg(false);
    }, 350);
  }, []);

  const selectSuggestion = useCallback((item: GeocodeResult) => {
    Haptics.selectionAsync();
    const coords: Coordinates = { latitude: item.center[1], longitude: item.center[0] };
    if (activeField === "origin") {
      setOriginText(item.place_name.split(",")[0]);
      setOriginCoords(coords);
    } else {
      setDestText(item.place_name.split(",")[0]);
      setDestCoords(coords);
    }
    setSuggestions([]);
    setActiveField(null);
    Keyboard.dismiss();
  }, [activeField]);

  const useMyLocation = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!locPermission?.granted) {
      const result = await requestLocPermission();
      if (!result.granted) return;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords: Coordinates = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coords);
      setOriginCoords(coords);
      setOriginText("My Location");
      setSuggestions([]);
    } catch (error) {
      console.error('[Map] Failed to get current location:', error);
    }
  }, [locPermission, requestLocPermission]);

  const handleGetRoute = useCallback(async () => {
    if (!originCoords || !destCoords) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingRoute(true);
    setRouteError("");
    setRoute(null);
    cardAnim.setValue(0);
    try {
      const result = await getRoute(originCoords, destCoords);
      if (!result) {
        setRouteError("Could not find a route. Try different locations.");
      } else {
        setRoute(result);
        Animated.spring(cardAnim, { toValue: 1, tension: 80, friction: 9, useNativeDriver: !IS_WEB }).start();
        if (!IS_WEB) {
          mapRef.current?.fitToCoordinates(result.coordinates, {
            edgePadding: { top: 100, right: 40, bottom: isSmall ? 240 : 280, left: 40 },
            animated: true,
          });
        }
      }
    } catch {
      setRouteError("Network error. Please try again.");
    } finally {
      setLoadingRoute(false);
    }
  }, [originCoords, destCoords, isSmall, cardAnim]);

  const clearAll = useCallback(() => {
    setRoute(null); setOriginCoords(null); setDestCoords(null);
    setOriginText(""); setDestText(""); setRouteError("");
    cardAnim.setValue(0);
  }, [cardAnim]);

  const canRoute = !!originCoords && !!destCoords && !loadingRoute;

  const SearchPanel = (
    <View style={{ gap: 12 }}>
      <View style={[styles.searchCard, { backgroundColor: C.backgroundCard, borderColor: C.border }]}>
        <View
          style={[
            styles.inputRow,
            {
              borderBottomWidth: 1,
              borderBottomColor: C.border,
              backgroundColor: originFocused ? C.backgroundElevated : "transparent",
            },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: C.tint, shadowColor: C.tint, shadowOpacity: 0.6, shadowRadius: 3 }]} />
          <TextInput
            style={[styles.searchInput, { color: C.text, fontFamily: "Inter_400Regular", fontSize: isSmall ? 13 : 14 }]}
            placeholder="Origin (e.g. My Location)"
            placeholderTextColor={C.textMuted}
            value={originText}
            onChangeText={(t) => { setOriginText(t); setOriginCoords(null); setRoute(null); search(t); }}
            onFocus={() => { setActiveField("origin"); setOriginFocused(true); }}
            onBlur={() => setOriginFocused(false)}
            returnKeyType="next"
          />
          {originText ? (
            <Pressable onPress={() => { setOriginText(""); setOriginCoords(null); setRoute(null); }}>
              <Ionicons name="close-circle" size={18} color={C.textMuted} />
            </Pressable>
          ) : (
            <Pressable onPress={useMyLocation} style={{ padding: 4 }}>
              <Ionicons name="locate" size={18} color={C.tint} />
            </Pressable>
          )}
        </View>
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: destFocused ? C.backgroundElevated : "transparent",
            },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: C.danger, shadowColor: C.danger, shadowOpacity: 0.6, shadowRadius: 3 }]} />
          <TextInput
            style={[styles.searchInput, { color: C.text, fontFamily: "Inter_400Regular", fontSize: isSmall ? 13 : 14 }]}
            placeholder="Destination (e.g. Airport)"
            placeholderTextColor={C.textMuted}
            value={destText}
            onChangeText={(t) => { setDestText(t); setDestCoords(null); setRoute(null); search(t); }}
            onFocus={() => { setActiveField("destination"); setDestFocused(true); }}
            onBlur={() => setDestFocused(false)}
            returnKeyType="search"
            onSubmitEditing={handleGetRoute}
          />
          {destText ? (
            <Pressable onPress={() => { setDestText(""); setDestCoords(null); setRoute(null); }}>
              <Ionicons name="close-circle" size={18} color={C.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {(loadingSugg || suggestions.length > 0) && activeField && (
        <View style={[styles.suggList, { backgroundColor: C.backgroundCard, borderColor: C.borderStrong }]}>
          {loadingSugg ? (
            <View style={{ padding: 16, alignItems: "center" }}>
              <ActivityIndicator size="small" color={C.tint} />
            </View>
          ) : (
            <FlatList
              data={suggestions}
              keyExtractor={(i) => i.id}
              scrollEnabled={false}
              renderItem={({ item }) => <SuggestionItem item={item} C={C} onPress={() => selectSuggestion(item)} />}
              keyboardShouldPersistTaps="always"
            />
          )}
        </View>
      )}

      <Pressable
        onPress={handleGetRoute}
        disabled={!canRoute}
        style={({ pressed }) => [
          styles.routeBtn,
          {
            opacity: canRoute ? (pressed ? 0.88 : 1) : 0.5,
            transform: [{ scale: pressed && canRoute ? 0.98 : 1 }],
          },
        ]}
      >
        <LinearGradient
          colors={canRoute ? ["#00D4FF", "#0070A8", "#004E78"] : [C.backgroundElevated, C.backgroundElevated]}
          style={styles.routeBtnInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loadingRoute ? (
            <ActivityIndicator color={canRoute ? "#fff" : C.textMuted} size="small" />
          ) : (
            <>
              <Ionicons name="navigate" size={18} color={canRoute ? "#fff" : C.textMuted} />
              <Text style={[styles.routeBtnText, { color: canRoute ? "#fff" : C.textMuted, fontFamily: "Inter_600SemiBold", fontSize: isSmall ? 14 : 16 }]}>
                Get Route
              </Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      {routeError ? (
        <View style={[styles.errorBox, { backgroundColor: "rgba(255,59,48,0.1)", borderColor: "rgba(255,59,48,0.3)" }]}>
          <Ionicons name="alert-circle" size={16} color={C.danger} />
          <Text style={[styles.errorText, { color: C.danger, fontFamily: "Inter_500Medium" }]}>{routeError}</Text>
        </View>
      ) : null}
    </View>
  );

  const RouteCard = route ? (
    <Animated.View
      style={[
        styles.routeCard,
        {
          backgroundColor: C.backgroundCard,
          borderColor: C.borderStrong,
          shadowColor: C.tint,
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 10,
          opacity: cardAnim,
          transform: IS_WEB
            ? [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
            : [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) }],
        },
      ]}
    >
      <LinearGradient colors={["rgba(0,212,255,0.06)", "transparent"]} style={StyleSheet.absoluteFill} />
      <View style={styles.routeStats}>
        <View style={styles.routeStat}>
          <View style={[styles.statIconBox, { backgroundColor: C.tint + "20" }]}>
            <Ionicons name="map-outline" size={20} color={C.tint} />
          </View>
          <View>
            <Text style={[styles.routeStatVal, { color: C.text, fontFamily: "Inter_700Bold" }]}>
              {formatDistance(route.distance)}
            </Text>
            <Text style={[styles.routeStatLabel, { color: C.textMuted, fontFamily: "Inter_500Medium" }]}>Distance</Text>
          </View>
        </View>
        <View style={[styles.routeDivider, { backgroundColor: C.border }]} />
        <View style={styles.routeStat}>
          <View style={[styles.statIconBox, { backgroundColor: C.warning + "20" }]}>
            <Ionicons name="time-outline" size={20} color={C.warning} />
          </View>
          <View>
            <Text style={[styles.routeStatVal, { color: C.text, fontFamily: "Inter_700Bold" }]}>
              {formatDuration(route.duration)}
            </Text>
            <Text style={[styles.routeStatLabel, { color: C.textMuted, fontFamily: "Inter_500Medium" }]}>ETA</Text>
          </View>
        </View>
        <Pressable onPress={clearAll} style={[styles.clearBtn, { backgroundColor: C.backgroundElevated, borderColor: C.border }]}>
          <Ionicons name="close" size={16} color={C.textMuted} />
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: 18, paddingBottom: 16 }}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (isRecording) {
              stopRecording();
            } else {
              startRecording();
            }
          }}
          style={({ pressed }) => [styles.startBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <LinearGradient
            colors={isRecording ? ["#FF3B30", "#C81F16"] : ["#00D4FF", "#0070A8"]}
            style={styles.startBtnInner}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Ionicons name={isRecording ? "stop-circle" : "navigate-circle"} size={20} color="#fff" />
            <Text style={[styles.startBtnText, { fontFamily: "Inter_600SemiBold" }]}>
              {isRecording ? "Stop Navigation" : "Start Navigation"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Animated.View>
  ) : null;

  if (IS_WEB) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <Head>
          <title>Live Map | AeroFleet</title>
          <meta name="description" content="Plan routes and navigate with Mapbox-powered A→B directions for AeroFleet fleet drivers." />
          <meta property="og:title" content="Live Map | AeroFleet" />
          <meta property="og:description" content="AI Dashcam & Fleet Safety Platform — route planner and live map." />
        </Head>
        <ScrollView
          contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad + 24, paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.screenTitle, { color: C.text, fontFamily: "Inter_700Bold" }]}>Route Planner</Text>
          <Text style={[styles.screenSub, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>
            A → B navigation powered by Mapbox
          </Text>
          {SearchPanel}
          {(originCoords || destCoords) && (
            <View style={[styles.webMapBox, { borderColor: route ? C.borderStrong : C.border }]}>
              <RNMapView
                originCoords={originCoords}
                destCoords={destCoords}
                route={route}
              />
            </View>
          )}
          {RouteCard}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={isLandscape} style={C.isDark ? "light" : "dark"} />
      <RNMapView
        mapRef={mapRef}
        originCoords={originCoords}
        destCoords={destCoords}
        route={route}
        userLocation={userLocation}
        hasLocationPermission={!!locPermission?.granted}
      />

      <Animated.View
        style={[
          styles.topGradientWrapper,
          {
            opacity: topUiAnim,
            transform: [{ translateY: topUiAnim.interpolate({ inputRange: [0, 1], outputRange: [-250, 0] }) }],
          }
        ]}
        pointerEvents={isRecording ? "none" : "box-none"}
      >
        <LinearGradient
          colors={
            C.isDark
              ? ["rgba(6,8,16,0.95)", "rgba(6,8,16,0.85)", "rgba(6,8,16,0.2)", "transparent"]
              : ["rgba(240,244,251,0.95)", "rgba(240,244,251,0.85)", "rgba(240,244,251,0.2)", "transparent"]
          }
          style={[
            styles.topGradient, 
            { 
              paddingTop: topPad + 12,
              paddingLeft: isLandscape ? TAB_BAR_OFFSET : 0 
            }
          ]}
        >
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {SearchPanel}
          </View>
        </LinearGradient>
      </Animated.View>

      {RouteCard && (
        <View 
          style={[
            styles.bottomCard, 
            { 
              bottom: isLandscape ? 20 : bottomPad + 76, 
              left: isLandscape ? TAB_BAR_OFFSET + 20 : 20, 
              right: 20 
            }
          ]}
        >
          {RouteCard}
        </View>
      )}

      {!locPermission?.granted && (
        <Pressable
          onPress={useMyLocation}
          style={[
            styles.locFab,
            {
              bottom: isLandscape ? 80 : bottomPad + (route ? 180 : 86),
              right: 20,
              backgroundColor: C.backgroundCard,
              borderColor: C.border,
            },
          ]}
        >
          <Ionicons name="locate" size={22} color={C.tint} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGradientWrapper: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  screenTitle: { fontSize: 26, marginBottom: 4 },
  screenSub: { fontSize: 13, marginBottom: 20 },
  topGradient: { paddingBottom: 24 },
  searchCard: { borderRadius: 20, overflow: "hidden", borderWidth: 1 },
  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  searchInput: { flex: 1, paddingTop: Platform.OS === 'ios' ? 2 : 0 },
  suggList: { borderRadius: 18, borderWidth: 1, overflow: "hidden", marginTop: 4 },
  suggItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  suggIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  suggName: { fontSize: 15 },
  suggSub: { fontSize: 12, marginTop: 2 },
  routeBtn: { borderRadius: 16, overflow: "hidden", marginTop: 4 },
  routeBtnInner: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  routeBtnText: { color: "#fff" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 4 },
  errorText: { fontSize: 13, flex: 1 },
  webMapBox: { borderRadius: 18, overflow: "hidden", borderWidth: 1, height: 230, marginTop: 12, marginBottom: 12 },
  routeCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  bottomCard: { position: "absolute" },
  routeStats: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 16, gap: 14 },
  routeStat: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  statIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  routeStatVal: { fontSize: 20, marginBottom: 2 },
  routeStatLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  routeDivider: { width: 1, height: 44, marginHorizontal: 6 },
  clearBtn: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  locFab: { position: "absolute", width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  startBtn: { borderRadius: 14, overflow: "hidden" },
  startBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50 },
  startBtnText: { color: "#fff", fontSize: 16 },
});
