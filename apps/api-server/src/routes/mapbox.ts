import { Router, type Request, type Response } from "express";
import { z } from "zod";

const router = Router();

const MAPBOX_KEY = process.env.MAPBOX_SECRET_KEY;
const MAPBOX_BASE = "https://api.mapbox.com";
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY;


const RouteGeometrySchema = z.object({
  coordinates: z.array(z.tuple([z.number(), z.number()])),
});

const RouteSchema = z.object({
  distance: z.number(),
  duration: z.number(),
  geometry: RouteGeometrySchema,
});

const DirectionsResponseSchema = z.object({
  routes: z.array(RouteSchema).optional(),
});

/**
 * Geocoding proxy endpoint
 * POST /api/mapbox/geocode
 * Body: { query: string, country?: string, bbox?: string }
 */
router.post("/geocode", async (req: Request, res: Response): Promise<void> => {
  if (!GOOGLE_MAPS_KEY) {
    res.status(500).json({ error: "Google Maps key not configured" });
    return;
  }

  const { query, country = "in", bbox = "76.8381,28.4042,77.3485,28.8835" } = req.body;

  if (!query || typeof query !== "string") {
    res.status(400).json({ error: "Query is required" });
    return;
  }

  if (query.length < 2) {
    res.status(400).json({ results: [] });
    return;
  }

  // --- TIER 1: INTERNAL CUSTOM FLEET LABELS RESOLUTION ---
  // In production, this would query the Postgres database for fleet waypoints.
  const normalizedQuery = query.trim().toLowerCase();
  const customWaypoints: Record<string, [number, number]> = {
    "hub a": [77.0266, 28.4595],
    "depot 4": [77.3485, 28.8835],
    "driver home": [77.1025, 28.7041],
  };

  for (const [label, coords] of Object.entries(customWaypoints)) {
    if (normalizedQuery.includes(label)) {
      res.json({
        results: [{
          id: `fleet_label_${label.replace(/\s+/g, '_')}`,
          place_name: `${label.toUpperCase()} (Internal Fleet Waypoint)`,
          center: coords,
        }]
      });
      return;
    }
  }
  // -------------------------------------------------------

  try {
    const url = new URL("https://places.googleapis.com/v1/places:searchText");
    
    const requestBody: any = {
      textQuery: query
    };

    // Add region code if country is provided (Places API New uses regionCode)
    if (country) {
      requestBody.regionCode = country.toUpperCase();
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Google Places API (New) error: ${response.statusText}`);
    }

    const data = await response.json();

    const results = (data.places || []).slice(0, 5).map((f: any) => ({
      id: f.id,
      place_name: f.displayName?.text ? `${f.displayName.text}, ${f.formattedAddress || ''}`.replace(/,\s*$/, '') : f.formattedAddress,
      center: [f.location.longitude, f.location.latitude], // [lng, lat]
    }));

    res.json({ results });
  } catch (error) {
    console.error("[Google Maps Geocode]", error);
    res.status(500).json({ error: "Geocoding failed", results: [] });
  }
});

/**
 * Routing proxy endpoint
 * POST /api/mapbox/route
 * Body: { originLat: number, originLng: number, destLat: number, destLng: number }
 */
router.post("/route", async (req: Request, res: Response): Promise<void> => {
  if (!MAPBOX_KEY) {
    res.status(500).json({ error: "Mapbox key not configured" });
    return;
  }

  const { originLat, originLng, destLat, destLng } = req.body;

  const lat1 = Number(originLat);
  const lng1 = Number(originLng);
  const lat2 = Number(destLat);
  const lng2 = Number(destLng);

  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
    res.status(400).json({ error: "Invalid coordinates" });
    return;
  }

  try {
    const url = new URL(
      `/directions/v5/mapbox/driving/${lng1},${lat1};${lng2},${lat2}`,
      MAPBOX_BASE
    );
    url.searchParams.set("access_token", MAPBOX_KEY);
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("overview", "full");
    url.searchParams.set("steps", "false");

    console.log(`[Mapbox Route] Received coords: origin(${lat1},${lng1}) dest(${lat2},${lng2})`);
    console.log(`[Mapbox Route] Calling: ${url.toString().replace(MAPBOX_KEY, "***")}`);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const text = await response.text();
      console.error(`[Mapbox Route] Mapbox API ${response.status}: ${text}`);
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    const data = await response.json();
    const validatedData = DirectionsResponseSchema.parse(data);
    const route = validatedData.routes?.[0];

    if (!route) {
      res.status(404).json({ error: "No route found" });
      return;
    }

    res.json({
      distance: Math.round(route.distance), // meters
      duration: Math.round(route.duration), // seconds
      coordinates: (route.geometry?.coordinates || []).map((coord: [number, number]) => ({
        latitude: coord[1],
        longitude: coord[0],
      })),
    });
  } catch (error) {
    console.error("[Mapbox Route]", error);
    res.status(500).json({ error: "Routing failed" });
  }
});

/**
 * Static map image proxy endpoint
 * GET /api/mapbox/staticmap
 * Query: originLat, originLng, destLat, destLng
 */
router.get("/staticmap", async (req: Request, res: Response): Promise<void> => {
  if (!MAPBOX_KEY) {
    res.status(500).send("Mapbox key not configured");
    return;
  }

  try {
    const originLat = parseFloat(req.query.originLat as string);
    const originLng = parseFloat(req.query.originLng as string);
    const destLat = parseFloat(req.query.destLat as string);
    const destLng = parseFloat(req.query.destLng as string);

    if ([originLat, originLng, destLat, destLng].some(isNaN)) {
      res.status(400).send("Invalid coordinates");
      return;
    }

    const markers: string[] = [];
    if (!isNaN(originLat) && !isNaN(originLng)) {
      markers.push(`pin-l-a+00D4FF(${originLng},${originLat})`);
    }
    if (!isNaN(destLat) && !isNaN(destLng)) {
      markers.push(`pin-l-b+FF3B30(${destLng},${destLat})`);
    }

    if (markers.length === 0) {
      res.status(400).send("No valid coordinates");
      return;
    }

    const staticUrl = new URL(
      `/styles/v1/mapbox/dark-v11/static/${markers.join(",")}/auto/640x360@2x`,
      MAPBOX_BASE
    );
    staticUrl.searchParams.set("access_token", MAPBOX_KEY);
    staticUrl.searchParams.set("padding", "60");

    res.redirect(staticUrl.toString());
  } catch (error) {
    console.error("[Mapbox StaticMap]", error);
    res.status(500).send("Static map generation failed");
  }
});

export default router;