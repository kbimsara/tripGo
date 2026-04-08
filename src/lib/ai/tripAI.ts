/**
 * TripGo AI — supports Anthropic Claude API (cloud) and Ollama (local, free).
 *
 * Provider selection:
 *   - If ANTHROPIC_API_KEY is set → use Claude API
 *   - Otherwise → use Ollama (OLLAMA_BASE_URL + OLLAMA_MODEL)
 *
 * Coordinates are validated + corrected via Nominatim (free OSM geocoder)
 * because LLMs often hallucinate GPS values.
 */
import { TripFormData, Trip, Place, ChatMessage } from "@/types";

// ── Provider config ──────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY    = process.env.ANTHROPIC_API_KEY;
const OPENROUTER_API_KEY   = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL     = process.env.OPENROUTER_MODEL || "qwen/qwen3-235b-a22b:free";
const OLLAMA_BASE_URL      = process.env.OLLAMA_BASE_URL  || "http://localhost:11434";
const OLLAMA_MODEL         = process.env.OLLAMA_MODEL     || "qwen2.5:7b";

const USE_CLAUDE      = Boolean(ANTHROPIC_API_KEY);
const USE_OPENROUTER  = !USE_CLAUDE && Boolean(OPENROUTER_API_KEY);

// ── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are TripGo AI, an expert travel planner that creates detailed, personalized trip itineraries.

When generating a trip plan you MUST return ONLY valid JSON — no markdown, no explanation, no code fences.

The JSON must match this EXACT structure:
{
  "title": "string - catchy trip title",
  "description": "string - engaging trip overview (2-3 sentences)",
  "coverImageQuery": "string - 3-word image search term e.g. 'Paris Eiffel sunset'",
  "destinations": ["Paris, France"],
  "totalDays": 3,
  "totalDistance": "estimated total e.g. '45 km'",
  "tags": ["cultural", "food", "history"],
  "days": [
    {
      "day": 1,
      "title": "Day title — be specific",
      "description": "Day overview sentence",
      "places": [
        {
          "id": "place-1-day-1",
          "name": "Eiffel Tower",
          "description": "What to do here and why it is special (2-3 sentences)",
          "coordinates": [48.8584, 2.2945],
          "type": "destination",
          "duration": "2 hours",
          "tips": "Practical insider tip for this specific place",
          "imageQuery": "eiffel tower paris",
          "rating": 4.8,
          "address": "Champ de Mars, 5 Av. Anatole France, Paris, France"
        }
      ],
      "routes": [
        {
          "from": "Eiffel Tower",
          "to": "Trocadéro Gardens",
          "distance": "0.8 km",
          "duration": "10 minutes",
          "mode": "walking",
          "instructions": ["Cross the Seine via Pont d'Iéna", "Walk towards Place du Trocadéro"]
        }
      ]
    }
  ]
}

STRICT RULES:
1. type MUST be one of: destination | viewpoint | restaurant | hotel | activity
2. mode MUST be one of: driving | walking | cycling
3. coordinates MUST be real accurate GPS [lat, lng] — NEVER use 0,0 or rounded integers
4. Each day MUST have 3-5 places with a MIX of types (not all "destination")
5. Include at least one restaurant per day and a hotel on the last place of each day
6. name MUST be the REAL official name of the place (not made-up names)
7. address MUST include the city and country name — this is critical for geocoding
8. tips MUST be practical and specific to that place (not generic travel advice)
9. Each place description should be 2-3 sentences explaining what makes it special
10. routes MUST connect consecutive places in order
11. Return ONLY the JSON object — absolutely no text before or after it
12. All string values must be properly escaped — no unescaped quotes or newlines

GEOGRAPHIC CLUSTERING RULES (CRITICAL — violations will break the map):
13. ALL places MUST be physically located INSIDE the specified destination city or its immediate surroundings (within ~20 km). NEVER include places from other cities, regions, or countries unless the trip explicitly lists multiple destinations.
14. Each day's places MUST be geographically clustered in the SAME neighborhood or district — think of it as a walkable/short-drive loop. A tourist should be able to visit all places in one day without crossing the entire country.
15. Maximum total route distance per day: 30 km for city trips, 100 km for country/island trips.
16. For multi-day trips to a single city: vary the NEIGHBORHOOD each day (e.g. Day 1 = Old Town, Day 2 = Waterfront, Day 3 = Suburbs) — all still within the same city.
17. For country-level destinations (e.g. "Sri Lanka", "Japan"): assign each day to a SINGLE region or city within that country and keep all that day's places inside that region. Do NOT mix places from distant regions in the same day.
18. NEVER pick a famous landmark from a completely different country just because it sounds related. If the destination is Colombo, Sri Lanka — every single place must be in or near Colombo.`;

// ── LLM caller — routes to Claude → OpenRouter → Ollama ─────────────────────
async function llmChat(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  if (USE_CLAUDE) {
    return claudeChat(system, messages, opts);
  }
  if (USE_OPENROUTER) {
    return openRouterChat(system, messages, opts);
  }
  return ollamaChat(system, messages, {
    temperature: opts.temperature,
    num_predict: opts.maxTokens,
  });
}

// ── Anthropic Claude API ─────────────────────────────────────────────────────
async function claudeChat(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: opts.maxTokens ?? 8192,
    system,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    temperature: opts.temperature ?? 0.4,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

// ── OpenRouter API (OpenAI-compatible) ───────────────────────────────────────
async function openRouterChat(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const MAX_RETRIES = 4;
  const BASE_DELAY  = 8_000; // 8 s — free-tier rate limits reset quickly

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://github.com/kbimsara/tripGo",
        "X-Title": "TripGo",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: "system", content: system }, ...messages],
        max_tokens: opts.maxTokens ?? 8192,
        temperature: opts.temperature ?? 0.4,
      }),
      signal: AbortSignal.timeout(300_000),
    });

    // Rate-limited — wait and retry with exponential backoff
    if (res.status === 429) {
      if (attempt === MAX_RETRIES) {
        throw new Error(
          "OpenRouter rate limit: free tier is busy. Please wait a moment and try again."
        );
      }
      const delay = BASE_DELAY * Math.pow(2, attempt); // 8s, 16s, 32s, 64s
      console.warn(`[TripGo] OpenRouter 429 — retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText);
      throw new Error(`OpenRouter ${res.status}: ${body}`);
    }

    const data = await res.json();
    return (data.choices?.[0]?.message?.content as string) ?? "";
  }

  // Should never reach here
  throw new Error("OpenRouter: max retries exceeded");
}

// ── Ollama local LLM ────────────────────────────────────────────────────────
async function ollamaChat(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  opts: { temperature?: number; num_predict?: number } = {}
): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: "system", content: system }, ...messages],
      stream: false,
      options: {
        temperature:    opts.temperature  ?? 0.4,
        num_predict:    opts.num_predict  ?? 8192,
        top_p:          0.85,
        repeat_penalty: 1.1,
      },
    }),
    signal: AbortSignal.timeout(300_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Ollama ${res.status}: ${body}`);
  }

  const data = await res.json();
  return (data.message?.content as string) ?? "";
}

// ── Strip <think> blocks (Qwen3 / reasoning models emit these) ───────────────
function stripThinkingTags(text: string): string {
  // Remove <think>...</think> blocks (may span multiple lines)
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

// ── JSON extractor + repair ─────────────────────────────────────────────────
function extractJSON(raw: string): string {
  // Remove reasoning blocks FIRST — Qwen3 thinks in <think> tags that often
  // contain { } characters, which would fool indexOf("{") into grabbing the
  // wrong position and producing corrupted coordinates.
  let text = stripThinkingTags(raw);

  // Strip markdown fences
  text = text
    .replace(/^```(?:json)?\s*/gm, "")
    .replace(/\s*```\s*$/gm, "")
    .trim();

  // Extract the outermost JSON object by finding the last balanced } that
  // closes the first {. Using lastIndexOf is good enough for a single object.
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start !== -1 && end > start) text = text.slice(start, end + 1);

  // Repair common LLM JSON mistakes
  text = repairJSON(text);

  return text;
}

function repairJSON(json: string): string {
  // Remove trailing commas before } or ]
  json = json.replace(/,\s*([\]}])/g, "$1");

  // Fix single-quoted strings → double quotes (only outside existing double-quoted strings)
  // This is a simplified approach — handles most LLM outputs
  json = json.replace(/:\s*'([^']*)'/g, ': "$1"');
  json = json.replace(/\[\s*'([^']*)'/g, '["$1"');
  json = json.replace(/,\s*'([^']*)'/g, ', "$1"');

  // Remove control characters that break JSON.parse
  json = json.replace(/[\x00-\x1F\x7F]/g, (ch) => {
    if (ch === "\n" || ch === "\r" || ch === "\t") return ch;
    return "";
  });

  // Fix unescaped newlines inside string values
  json = json.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, "\\n");

  return json;
}

// ── Coordinate validation ────────────────────────────────────────────────────
function isValidCoord(coords: unknown): coords is [number, number] {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lat, lng] = coords as [number, number];
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat === 0 && lng === 0) return false;           // null island
  if (lat < -90 || lat > 90) return false;            // invalid lat
  if (lng < -180 || lng > 180) return false;          // invalid lng
  // Reject exact integer pairs (e.g. 35, 139) — obvious LLM hallucination
  if (Number.isInteger(lat) && Number.isInteger(lng)) return false;
  return true;
}

// ── Nominatim geocoder (free OpenStreetMap — no API key needed) ──────────────
async function geocode(query: string): Promise<[number, number] | null> {
  try {
    const url =
      "https://nominatim.openstreetmap.org/search?" +
      new URLSearchParams({ q: query, format: "json", limit: "1" });

    const res = await fetch(url, {
      headers: {
        "User-Agent": "TripGo/1.0 (https://github.com/kbimsara/tripGo)",
        "Accept-Language": "en",
      },
      signal: AbortSignal.timeout(6_000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (!isValidCoord([lat, lng])) return null;

    return [lat, lng];
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Haversine distance (km) between two [lat,lng] pairs ──────────────────────
function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// ── Look up destination center + bounding box via Nominatim ─────────────────
interface DestinationBounds {
  center: [number, number];
  /** Radius in km that covers the destination's bounding box */
  radiusKm: number;
}

async function getDestinationBounds(
  destination: string
): Promise<DestinationBounds | null> {
  try {
    const url =
      "https://nominatim.openstreetmap.org/search?" +
      new URLSearchParams({ q: destination, format: "json", limit: "1" });

    const res = await fetch(url, {
      headers: {
        "User-Agent": "TripGo/1.0 (https://github.com/kbimsara/tripGo)",
        "Accept-Language": "en",
      },
      signal: AbortSignal.timeout(6_000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;

    const item = data[0];
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (!isValidCoord([lat, lng])) return null;

    // Nominatim returns boundingbox as [minLat, maxLat, minLng, maxLng] strings
    const bb: number[] = (item.boundingbox ?? []).map(Number);
    let radiusKm = 50; // default fallback
    if (bb.length === 4) {
      const [minLat, maxLat, minLng, maxLng] = bb;
      // Half-diagonal of the bounding box as the max allowed radius
      const corner: [number, number] = [minLat, minLng];
      const opposite: [number, number] = [maxLat, maxLng];
      radiusKm = haversineKm(corner, opposite) / 2;
      // Clamp: city ≥ 15 km, country-level ≤ 600 km
      radiusKm = Math.max(15, Math.min(radiusKm, 600));
    }

    return { center: [lat, lng], radiusKm };
  } catch {
    return null;
  }
}

/**
 * Fix every place's coordinates using Nominatim, then validate each result
 * is geographically close to the destination (snaps strays back to dest center).
 *
 * Strategy per place (tries each in order until a valid coord is found):
 *   1. name + full address  (most specific)
 *   2. name + each destination  (tries all — fixes multi-city trips)
 *   3. name alone
 *   4. Keep LLM coordinates if they look valid AND are near the destination
 *   5. Fall back to each destination city center in turn
 *
 * After geocoding, any place whose coordinates land more than
 * (destBounds.radiusKm * 1.5) away from the nearest destination center is
 * snapped to that destination center so it doesn't break the map route.
 */
async function geocodePlaces(
  places: Place[],
  destinations: string[],
  destBoundsMap: Map<string, DestinationBounds>
): Promise<Place[]> {
  // Helper: find the closest destination center to a coord
  const nearestDest = (coord: [number, number]): { center: [number, number]; radiusKm: number } | null => {
    let best: { center: [number, number]; radiusKm: number } | null = null;
    let bestDist = Infinity;
    for (const bounds of destBoundsMap.values()) {
      const d = haversineKm(coord, bounds.center);
      if (d < bestDist) { bestDist = d; best = bounds; }
    }
    return best;
  };

  const fixed: Place[] = [];

  for (const place of places) {
    let coord: [number, number] | null = null;

    // Build search queries from most to least specific.
    const queries: string[] = [];
    if (place.address && place.address.length > 4)
      queries.push(`${place.name}, ${place.address}`);
    for (const dest of destinations)
      queries.push(`${place.name}, ${dest}`);
    queries.push(place.name);

    for (const q of queries) {
      const candidate = await geocode(q);
      await sleep(1_100);
      if (!candidate) continue;

      // Accept this geocode result only if it's within the destination area
      const nearest = nearestDest(candidate);
      if (!nearest || haversineKm(candidate, nearest.center) <= nearest.radiusKm * 1.5) {
        coord = candidate;
        break;
      }
      // Result is too far — try the next query
      console.warn(`[TripGo] "${place.name}" geocoded far from destination (${Math.round(haversineKm(candidate, nearest!.center))} km) — trying next query`);
    }

    // If Nominatim failed/was out-of-bounds, trust the LLM coord only if near destination
    if (!coord && isValidCoord(place.coordinates)) {
      const nearest = nearestDest(place.coordinates as [number, number]);
      if (!nearest || haversineKm(place.coordinates as [number, number], nearest.center) <= nearest.radiusKm * 1.5) {
        coord = place.coordinates as [number, number];
      }
    }

    // Last resort: snap to the nearest destination center
    if (!coord) {
      for (const dest of destinations) {
        const bounds = destBoundsMap.get(dest);
        if (bounds) { coord = bounds.center; break; }
        const fallback = await geocode(dest);
        await sleep(1_100);
        if (fallback) { coord = fallback; break; }
      }
    }

    fixed.push({ ...place, coordinates: coord ?? [0, 0] });
  }

  return fixed;
}

// ── Sanitize trip output ─────────────────────────────────────────────────────
function sanitizeTrip(trip: Trip, formData: TripFormData): Trip {
  // Ensure required fields have sane defaults
  trip.title       = trip.title || `Trip to ${formData.destinations.join(" & ")}`;
  trip.description = trip.description || "";
  trip.destinations = trip.destinations || formData.destinations;
  trip.totalDays    = trip.totalDays || formData.days;
  trip.tags         = Array.isArray(trip.tags) ? trip.tags : [];

  if (!Array.isArray(trip.days)) trip.days = [];

  for (const day of trip.days) {
    day.places = Array.isArray(day.places) ? day.places : [];
    day.routes = Array.isArray(day.routes) ? day.routes : [];

    // Ensure every place has an id
    day.places = day.places.map((p, i) => ({
      ...p,
      id: p.id || `place-${i + 1}-day-${day.day}`,
      type: (["destination", "viewpoint", "restaurant", "hotel", "activity"].includes(p.type)
        ? p.type
        : "destination") as Place["type"],
      coordinates: Array.isArray(p.coordinates) && p.coordinates.length === 2
        ? p.coordinates
        : [0, 0],
    }));
  }

  return trip;
}

// ── Public: generate full trip plan ─────────────────────────────────────────
export async function generateTripPlan(formData: TripFormData): Promise<Trip> {
  // Scale token budget: ~1500 tokens per day of trip
  const maxTokens = Math.min(Math.max(formData.days * 1500, 4096), 16384);

  const destList = formData.destinations.join(", ");
  const isSingleDest = formData.destinations.length === 1;

  const prompt =
    `Create a ${formData.days}-day trip itinerary for: ${destList}

Budget: ${formData.budget}
Interests: ${(formData.interests ?? []).join(", ") || "general sightseeing"}
Travelers: ${formData.travelers ?? 1}
${formData.startDate ? `Start date: ${formData.startDate}` : ""}
${formData.notes     ? `Special requests: ${formData.notes}` : ""}

IMPORTANT REQUIREMENTS:
- Each day must have 3-5 places with a variety of types (destination, viewpoint, restaurant, hotel, activity)
- Use REAL place names that actually exist — do NOT invent fictional places
- The address field MUST include the city and country (e.g. "123 Main St, Paris, France")
- Coordinates should be as accurate as possible (they will be verified)
- Include practical, specific tips for each place (opening hours, best time to visit, what to order, etc.)
- Routes should use realistic travel modes: walking for <2km, driving for >5km

⚠️  GEOGRAPHIC CONSTRAINT — THIS IS THE MOST IMPORTANT RULE:
${isSingleDest
  ? `ALL places must be physically located INSIDE "${destList}" — every single place, every single day.
- Do NOT include places from other cities or countries.
- Keep each day's places in the same neighborhood (within 5–15 km of each other).
- Vary the district each day (e.g. Day 1 = city centre, Day 2 = coastal area) but stay within "${destList}".`
  : `Assign each day to ONE of the destinations: ${destList}.
- All places on a given day must be in that day's assigned destination city.
- Do NOT mix places from different destinations on the same day.
- Keep each day's places within 20 km of each other.`}

Return ONLY the JSON object — no commentary, no markdown fences.`;

  // Attempt generation with retry on JSON failure
  let trip: Trip | null = null;
  let lastError = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      { role: "user", content: prompt },
    ];

    // On retry, add a correction nudge
    if (attempt > 0) {
      messages.push(
        { role: "assistant", content: lastError },
        { role: "user", content: "That was invalid JSON. Please try again — return ONLY a valid JSON object with no markdown, no trailing commas, and no comments. Start with { and end with }." }
      );
    }

    const raw = await llmChat(
      SYSTEM_PROMPT,
      messages,
      { maxTokens, temperature: attempt === 0 ? 0.4 : 0.2 }
    );

    const jsonText = extractJSON(raw);

    try {
      trip = JSON.parse(jsonText) as Trip;
      break; // success
    } catch {
      lastError = raw.slice(0, 300);
      console.error(`[TripGo] JSON parse failed (attempt ${attempt + 1}). Preview:\n`, lastError);
      if (attempt === 1) {
        throw new Error(
          "AI returned invalid JSON after 2 attempts. " +
          (USE_CLAUDE ? "Please try again." : "Try a larger model (e.g. qwen2.5:14b) or retry.")
        );
      }
    }
  }

  // Sanitize the trip data
  trip = sanitizeTrip(trip!, formData);

  // ── Pre-fetch destination centers (used to validate geocoded coords) ─────
  console.log(`[TripGo] Resolving destination bounds for: ${formData.destinations.join(", ")}`);
  const destBoundsMap = new Map<string, DestinationBounds>();
  for (const dest of formData.destinations) {
    const bounds = await getDestinationBounds(dest);
    await sleep(1_100); // respect Nominatim rate limit
    if (bounds) {
      destBoundsMap.set(dest, bounds);
      console.log(`[TripGo]  → "${dest}" center=${bounds.center} radius=${Math.round(bounds.radiusKm)} km`);
    } else {
      console.warn(`[TripGo]  → "${dest}" bounds lookup failed — will skip distance validation`);
    }
  }

  // ── Fix coordinates with Nominatim + bounds validation ───────────────────
  console.log(`[TripGo] Geocoding coordinates for ${trip.days?.length ?? 0} days…`);

  if (Array.isArray(trip.days)) {
    for (const day of trip.days) {
      if (Array.isArray(day.places) && day.places.length > 0) {
        day.places = await geocodePlaces(day.places, formData.destinations, destBoundsMap);
      }
    }
  }

  console.log("[TripGo] Geocoding complete ✓");
  return trip;
}

// ── Public: chat to customize existing trip ──────────────────────────────────
export async function chatWithAI(
  trip: Partial<Trip>,
  messages: ChatMessage[],
  userMessage: string
): Promise<{ text: string; updatedTrip?: Partial<Trip> }> {
  const tripSummary = `Current trip:
Title: ${trip.title}
Destinations: ${trip.destinations?.join(", ")}
Days: ${trip.totalDays}  |  Budget: ${trip.budget}
${trip.days?.map((d) =>
  `Day ${d.day}: ${d.title} — Places: ${d.places?.map((p) => `${p.name} (${p.type})`).join(", ")}`
).join("\n")}`;

  const system = `${SYSTEM_PROMPT}

${tripSummary}

RESPONSE RULES:
- If the user requests changes to the itinerary, you MUST respond in exactly TWO parts:
  PART 1: A friendly explanation of what you changed (1-3 sentences, plain text)
  PART 2: The separator "---TRIP_JSON_START---" on its own line, followed by the COMPLETE updated trip JSON

- If the user is just chatting, asking travel questions, or asking for advice, reply conversationally WITHOUT any JSON or separator.

- When adding new places, use REAL place names with full addresses including city and country.
- NEVER remove places the user didn't ask to remove.
- Keep all existing place IDs unchanged — only new places get new IDs.

Example change response format:
I've added the Tsukiji Outer Market as a morning food stop on Day 2!
---TRIP_JSON_START---
{"title": "...", ...}`;

  const history = messages.slice(-10).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const rawLlm = await llmChat(
    system,
    [...history, { role: "user", content: userMessage }],
    { maxTokens: 8192, temperature: 0.5 }
  );

  // Strip reasoning blocks before any parsing — Qwen3 <think> tags may
  // contain separator strings or { } chars that break the split logic.
  const raw = stripThinkingTags(rawLlm);

  // Try multiple separator patterns (models are unreliable with exact markers)
  const separators = [
    "---TRIP_JSON_START---",
    "UPDATED_TRIP_JSON:",
    "TRIP_JSON_START",
    "```json",
  ];

  let explanation = raw;
  let jsonPart: string | null = null;

  for (const sep of separators) {
    const idx = raw.indexOf(sep);
    if (idx !== -1) {
      explanation = raw.slice(0, idx).trim();
      jsonPart = raw.slice(idx + sep.length).trim();
      break;
    }
  }

  // Also detect if the response ends with a JSON object (no separator)
  if (!jsonPart) {
    const lastBrace = raw.lastIndexOf("}");
    const firstBrace = raw.indexOf("{");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const possibleJson = raw.slice(firstBrace, lastBrace + 1);
      // Only treat as JSON if it looks like a trip (has "days" key)
      if (possibleJson.includes('"days"') && possibleJson.includes('"places"')) {
        explanation = raw.slice(0, firstBrace).trim();
        jsonPart = possibleJson;
      }
    }
  }

  if (jsonPart) {
    try {
      const updatedTrip = JSON.parse(extractJSON(jsonPart)) as Partial<Trip>;

      // Fix coordinates on any newly added / changed places
      if (Array.isArray(updatedTrip.days) && trip.destinations) {
        // Build a best-effort bounds map for the chat context (no rate-limit
        // delay needed here — we accept imprecision for chat updates)
        const chatBoundsMap = new Map<string, DestinationBounds>();
        for (const dest of trip.destinations) {
          const bounds = await getDestinationBounds(dest);
          await sleep(1_100);
          if (bounds) chatBoundsMap.set(dest, bounds);
        }

        for (const day of updatedTrip.days) {
          if (!Array.isArray(day.places)) continue;

          // Only geocode places whose coordinates look wrong
          const needsGeocode = day.places.filter((p) => !isValidCoord(p.coordinates));
          if (needsGeocode.length > 0) {
            const fixed = await geocodePlaces(needsGeocode, trip.destinations, chatBoundsMap);
            const fixedMap = Object.fromEntries(fixed.map((p) => [p.id, p]));
            day.places = day.places.map((p) => fixedMap[p.id] ?? p);
          }
        }
      }

      // Clean up explanation — remove trailing separators or leftover markers
      explanation = explanation
        .replace(/---+\s*$/, "")
        .replace(/TRIP_JSON_START[\s\S]*$/, "")
        .replace(/UPDATED_TRIP_JSON[\s\S]*$/, "")
        .trim();

      return { text: explanation || "Trip updated!", updatedTrip };
    } catch {
      // JSON parse failed — return just the text
      return { text: explanation || raw.trim() };
    }
  }

  return { text: raw.trim() };
}
