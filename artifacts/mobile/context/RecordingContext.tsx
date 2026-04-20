import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export type EventType = "harsh_brake" | "acceleration" | "crash" | "sos" | "manual";

export type SafetyEvent = {
  id: string;
  type: EventType;
  timestamp: number;
  location: { lat: number; lng: number } | null;
  speed: number;
};

type RecordingContextType = {
  isRecording: boolean;
  recordingDuration: number;
  gpsActive: boolean;
  gpsCoords: { lat: number; lng: number } | null;
  speed: number;
  accelerometerData: { x: number; y: number; z: number };
  gyroscopeData: { x: number; y: number; z: number };
  events: SafetyEvent[];
  startRecording: () => void;
  stopRecording: () => void;
  triggerSOS: () => void;
  addEvent: (type: EventType) => void;
  unreadCount: number;
  markEventsRead: () => void;
  clearAllEvents: () => void;
};

const RecordingContext = createContext<RecordingContextType | null>(null);

const EVENTS_KEY = "aerofleet_events";

const MS_TO_KMH = 3.6;
const SPEED_THRESHOLD_MS = 0.5;

export function RecordingProvider({ children }: { children: React.ReactNode }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [speed, setSpeed] = useState(0);
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroscopeData, setGyroscopeData] = useState({ x: 0, y: 0, z: 0 });
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sensorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(EVENTS_KEY);
        if (stored) setEvents(JSON.parse(stored));
      } catch (error) {
        console.error('[RecordingContext] Failed to restore events from storage:', error);
      }
    })();
  }, []);

  const saveEvents = useCallback(async (evts: SafetyEvent[]) => {
    try {
      await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(evts.slice(-50)));
    } catch (error) {
      console.error('[RecordingContext] Failed to save events:', error);
    }
  }, []);

  const startRecording = useCallback(async () => {
    setIsRecording(true);
    setRecordingDuration(0);
    setSpeed(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    timerRef.current = setInterval(() => {
      setRecordingDuration((d) => d + 1);
    }, 1000);

    sensorRef.current = setInterval(() => {
      const t = Date.now() / 1000;
      setAccelerometerData({
        x: Math.sin(t * 1.1) * 0.3 + (Math.random() - 0.5) * 0.05,
        y: Math.sin(t * 0.7) * 0.2 + (Math.random() - 0.5) * 0.05,
        z: 9.81 + Math.sin(t * 1.3) * 0.1,
      });
      setGyroscopeData({
        x: Math.sin(t * 0.9) * 0.05,
        y: Math.sin(t * 1.2) * 0.03,
        z: Math.sin(t * 0.6) * 0.04,
      });
    }, 500);

    if (Platform.OS === "web") {
      setGpsActive(true);
      setGpsCoords({ lat: 28.6139 + (Math.random() - 0.5) * 0.01, lng: 77.2090 + (Math.random() - 0.5) * 0.01 });
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGpsActive(false);
        return;
      }

      setGpsActive(true);

      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 0,
        },
        (loc) => {
          setGpsCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });

          const rawSpeed = loc.coords.speed ?? 0;
          const clampedSpeed = rawSpeed < SPEED_THRESHOLD_MS ? 0 : rawSpeed;
          setSpeed(clampedSpeed * MS_TO_KMH);
        }
      );
    } catch {
      setGpsActive(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setGpsActive(false);
    setSpeed(0);
    setGpsCoords(null);

    if (timerRef.current) clearInterval(timerRef.current);
    if (sensorRef.current) clearInterval(sensorRef.current);
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const addEvent = useCallback((type: EventType) => {
    const newEvent: SafetyEvent = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      type,
      timestamp: Date.now(),
      location: gpsCoords,
      speed,
    };
    setEvents((prev) => {
      const updated = [newEvent, ...prev];
      saveEvents(updated);
      return updated;
    });
    setUnreadCount((c) => c + 1);
  }, [gpsCoords, speed, saveEvents]);

  const markEventsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearAllEvents = useCallback(() => {
    setEvents([]);
    setUnreadCount(0);
    saveEvents([]);
  }, [saveEvents]);

  const triggerSOS = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    addEvent("sos");
  }, [addEvent]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (sensorRef.current) clearInterval(sensorRef.current);
      if (locationSubRef.current) locationSubRef.current.remove();
    };
  }, []);

  return (
    <RecordingContext.Provider
      value={{
        isRecording,
        recordingDuration,
        gpsActive,
        gpsCoords,
        speed,
        accelerometerData,
        gyroscopeData,
        events,
        startRecording,
        stopRecording,
        triggerSOS,
        addEvent,
        unreadCount,
        markEventsRead,
        clearAllEvents,
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecording() {
  const ctx = useContext(RecordingContext);
  if (!ctx) throw new Error("useRecording must be used within RecordingProvider");
  return ctx;
}
