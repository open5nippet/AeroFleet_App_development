import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useRef, useState } from "react";
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

function SuggestionItem({ item, onPress, C }: { item: GeocodeResult; onPress: () => void; C: ColorScheme }) {
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
}

export default function MapScreen() {
  const { colors: C } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const topPad = IS_WEB ? 67 : insets.top;
  const bottomPad = IS_WEB ? 34 : insets.bottom;
  const isSmall = width < 380;

  const mapRef = useRef<any>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");
  const [activeField, setActiveField] = useState<SearchField>(null);
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

  const selectSuggestion = (item: GeocodeResult) => {
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
  };

  const useMyLocation = async () => {
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
    } catch {}
  };

  const handleGetRoute = async () => {
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
  };

  const clearAll = () => {
    setRoute(null); setOriginCoords(null); setDestCoords(null);
    setOriginText(""); setDestText(""); setRouteError("");
    cardAnim.setValue(0);
  };

  const canRoute = !!originCoords && !!destCoords && !loadingRoute;

  const SearchPanel = (
    <View style={{ gap: 8 }}>
      <View style={[styles.searchCard, { backgroundColor: C.backgroundSecondary }]}>
        <View style={[styles.inputRow, { borderBottomWidth: 1, borderBottomColor: C.border }]}>
          <View style={[styles.dot, { backgroundColor: C.tint }]} />
          <TextInput
            style={[styles.searchInput, { color: C.text, fontFamily: "Inter_400Regular", fontSize: isSmall ? 13 : 14 }]}
            placeholder="Point A — origin"
            placeholderTextColor={C.textMuted}
            value={originText}
            onChangeText={(t) => { setOriginText(t); setOriginCoords(null); setRoute(null); search(t); }}
            onFocus={() => setActiveField("origin")}
            returnKeyType="next"
          />
          {originText ? (
            <Pressable onPress={() => { setOriginText(""); setOriginCoords(null); setRoute(null); }}>
              <Ionicons name="close-circle" size={16} color={C.textMuted} />
            </Pressable>
          ) : (
            <Pressable onPress={useMyLocation} style={{ padding: 2 }}>
              <Ionicons name="locate" size={16} color={C.tint} />
            </Pressable>
          )}
        </View>
        <View style={styles.inputRow}>
          <View style={[styles.dot, { backgroundColor: C.danger }]} />
          <TextInput
            style={[styles.searchInput, { color: C.text, fontFamily: "Inter_400Regular", fontSize: isSmall ? 13 : 14 }]}
            placeholder="Point B — destination"
            placeholderTextColor={C.textMuted}
            value={destText}
            onChangeText={(t) => { setDestText(t); setDestCoords(null); setRoute(null); search(t); }}
            onFocus={() => setActiveField("destination")}
            returnKeyType="search"
            onSubmitEditing={handleGetRoute}
          />
          {destText ? (
            <Pressable onPress={() => { setDestText(""); setDestCoords(null); setRoute(null); }}>
              <Ionicons name="close-circle" size={16} color={C.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {(loadingSugg || suggestions.length > 0) && activeField && (
        <View style={[styles.suggList, { backgroundColor: C.backgroundSecondary, borderColor: C.border }]}>
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
        style={({ pressed }) => [styles.routeBtn, { opacity: canRoute ? (pressed ? 0.85 : 1) : 0.4 }]}
      >
        <LinearGradient colors={["#00D4FF", "#0070A8"]} style={styles.routeBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          {loadingRoute ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={[styles.routeBtnText, { fontFamily: "Inter_600SemiBold", fontSize: isSmall ? 13 : 15 }]}>Get Route</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      {routeError ? (
        <View style={[styles.errorBox, { backgroundColor: "rgba(255,59,48,0.1)", borderColor: "rgba(255,59,48,0.3)" }]}>
          <Ionicons name="alert-circle" size={14} color={C.danger} />
          <Text style={[styles.errorText, { color: C.danger, fontFamily: "Inter_400Regular" }]}>{routeError}</Text>
        </View>
      ) : null}
    </View>
  );

  const RouteCard = route ? (
    <Animated.View
      style={[
        styles.routeCard,
        {
          backgroundColor: C.backgroundSecondary,
          borderColor: C.borderStrong,
          opacity: cardAnim,
          transform: IS_WEB
            ? [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
            : [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) }],
        },
      ]}
    >
      <View style={styles.routeStats}>
        <View style={styles.routeStat}>
          <Ionicons name="map-outline" size={20} color={C.tint} />
          <View>
            <Text style={[styles.routeStatVal, { color: C.text, fontFamily: "Inter_700Bold" }]}>
              {formatDistance(route.distance)}
            </Text>
            <Text style={[styles.routeStatLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>Distance</Text>
          </View>
        </View>
        <View style={[styles.routeDivider, { backgroundColor: C.border }]} />
        <View style={styles.routeStat}>
          <Ionicons name="time-outline" size={20} color={C.warning} />
          <View>
            <Text style={[styles.routeStatVal, { color: C.text, fontFamily: "Inter_700Bold" }]}>
              {formatDuration(route.duration)}
            </Text>
            <Text style={[styles.routeStatLabel, { color: C.textMuted, fontFamily: "Inter_400Regular" }]}>ETA</Text>
          </View>
        </View>
        <Pressable onPress={clearAll} style={[styles.clearBtn, { backgroundColor: C.backgroundElevated }]}>
          <Ionicons name="close" size={16} color={C.textMuted} />
        </Pressable>
      </View>
    </Animated.View>
  ) : null;

  if (IS_WEB) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
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
      <RNMapView
        mapRef={mapRef}
        originCoords={originCoords}
        destCoords={destCoords}
        route={route}
        userLocation={userLocation}
        hasLocationPermission={!!locPermission?.granted}
      />

      <LinearGradient
        colors={C.isDark
          ? ["rgba(10,14,26,0.93)", "rgba(10,14,26,0.85)", "rgba(10,14,26,0.3)", "transparent"]
          : ["rgba(240,244,251,0.97)", "rgba(240,244,251,0.9)", "rgba(240,244,251,0.3)", "transparent"]}
        style={[styles.topGradient, { paddingTop: topPad + 8 }]}
      >
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          {SearchPanel}
        </View>
      </LinearGradient>

      {RouteCard && (
        <View style={[styles.bottomCard, { bottom: bottomPad + 12, left: 16, right: 16 }]}>
          {RouteCard}
        </View>
      )}

      {!locPermission?.granted && (
        <Pressable
          onPress={useMyLocation}
          style={[
            styles.locFab,
            {
              bottom: bottomPad + (route ? 108 : 16),
              right: 16,
              backgroundColor: C.backgroundSecondary,
              borderColor: C.border,
            },
          ]}
        >
          <Ionicons name="locate" size={20} color={C.tint} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 26, marginBottom: 4 },
  screenSub: { fontSize: 13, marginBottom: 20 },
  topGradient: { paddingBottom: 16 },
  searchCard: { borderRadius: 16, overflow: "hidden" },
  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  searchInput: { flex: 1 },
  suggList: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  suggItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  suggIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  suggName: { fontSize: 14 },
  suggSub: { fontSize: 11, marginTop: 1 },
  routeBtn: { borderRadius: 14, overflow: "hidden" },
  routeBtnInner: { height: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  routeBtnText: { color: "#fff" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, borderWidth: 1, padding: 10 },
  errorText: { fontSize: 13, flex: 1 },
  webMapBox: { borderRadius: 18, overflow: "hidden", borderWidth: 1, height: 230, marginTop: 12, marginBottom: 12 },
  routeCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  bottomCard: { position: "absolute" },
  routeStats: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  routeStat: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  routeStatVal: { fontSize: 18 },
  routeStatLabel: { fontSize: 11, marginTop: 1 },
  routeDivider: { width: 1, height: 40, marginHorizontal: 4 },
  clearBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  locFab: { position: "absolute", width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
