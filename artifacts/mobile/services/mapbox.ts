export type Coordinates = { latitude: number; longitude: number };

export type GeocodeResult = {
  id: string;
  place_name: string;
  center: [number, number];
};

export type RouteResult = {
  distance: number;
  duration: number;
  coordinates: Coordinates[];
};

// Backend API endpoint for secure Mapbox proxying
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";

// Configurable location defaults (can be overridden via environment or config)
const DEFAULT_COUNTRY = process.env.EXPO_PUBLIC_LOCATION_COUNTRY ?? "in";
const DEFAULT_BBOX = process.env.EXPO_PUBLIC_LOCATION_BBOX ?? "76.8381,28.4042,77.3485,28.8835";
const DEFAULT_CENTER = process.env.EXPO_PUBLIC_LOCATION_CENTER ?? "77.2090,28.6139";

/**
 * Geocode a place by calling the backend proxy endpoint (Mapbox key is never exposed to client)
 */
export async function geocodePlace(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];
  
  try {
    const res = await fetch(`${API_BASE}/mapbox/geocode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query.trim(),
        country: DEFAULT_COUNTRY,
        bbox: DEFAULT_BBOX,
      }),
    });
    
    if (!res.ok) {
      console.error('[Geocode] Backend error:', res.status);
      return [];
    }
    
    const data = await res.json();
    return data.results ?? [];
  } catch (error) {
    console.error('[Geocode] Request failed:', error);
    return [];
  }
}

/**
 * Get route between two coordinates by calling the backend proxy endpoint
 */
export async function getRoute(
  origin: Coordinates,
  destination: Coordinates
): Promise<RouteResult | null> {
  try {
    const res = await fetch(`${API_BASE}/mapbox/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originLat: origin.latitude,
        originLng: origin.longitude,
        destLat: destination.latitude,
        destLng: destination.longitude,
      }),
    });
    
    if (!res.ok) {
      console.error('[Route] Backend error:', res.status);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('[Route] Request failed:', error);
    return null;
  }
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}
