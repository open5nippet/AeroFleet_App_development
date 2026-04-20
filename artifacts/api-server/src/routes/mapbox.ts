import { Router, type Request, type Response } from "express";

const router = Router();

const MAPBOX_KEY = process.env.MAPBOX_KEY;
const MAPBOX_BASE = "https://api.mapbox.com";

/**
 * Geocoding proxy endpoint
 * POST /api/mapbox/geocode
 * Body: { query: string, country?: string, bbox?: string }
 */
router.post("/geocode", async (req: Request, res: Response): Promise<void> => {
  if (!MAPBOX_KEY) {
    res.status(500).json({ error: "Mapbox key not configured" });
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

  try {
    const encoded = encodeURIComponent(query);
    const url = [
      `${MAPBOX_BASE}/geocoding/v5/mapbox.places/${encoded}.json`,
      `?access_token=${MAPBOX_KEY}`,
      `&limit=5`,
      `&types=place,address,poi,locality,neighborhood`,
      `&country=${country}`,
      `&bbox=${bbox}`,
    ].join("");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    const data = (await response.json()) as { features?: Array<{ id: string; place_name: string; center: [number, number] }> };
    const results = (data.features || []).map((f) => ({
      id: f.id,
      place_name: f.place_name,
      center: f.center, // [lng, lat]
    }));

    res.json({ results });
  } catch (error) {
    console.error("[Mapbox Geocode]", error);
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

  if (
    typeof originLat !== "number" ||
    typeof originLng !== "number" ||
    typeof destLat !== "number" ||
    typeof destLng !== "number"
  ) {
    res.status(400).json({ error: "Invalid coordinates" });
    return;
  }

  try {
    const url = [
      `${MAPBOX_BASE}/directions/v5/mapbox/driving-traffic`,
      `/${originLng},${originLat};${destLng},${destLat}`,
      `?access_token=${MAPBOX_KEY}`,
      `&geometries=geojson`,
      `&overview=full`,
      `&steps=false`,
      `&bannerInstructions=false`,
      `&voiceInstructions=false`,
    ].join("");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    const data = (await response.json()) as unknown;
    if (!data || typeof data !== "object" || !("routes" in data)) {
      throw new Error("Invalid route response");
    }

    const routeData = data as { routes?: Array<{ distance: number; duration: number; geometry: { coordinates: Array<[number, number]> } }> };
    const route = routeData.routes?.[0];

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

    const staticUrl = `${MAPBOX_BASE}/styles/v1/mapbox/dark-v11/static/${markers.join(
      ","
    )}/auto/640x360@2x?access_token=${MAPBOX_KEY}&padding=60`;

    res.redirect(staticUrl);
  } catch (error) {
    console.error("[Mapbox StaticMap]", error);
    res.status(500).send("Static map generation failed");
  }
});

export default router;