/**
 * TripGo AI — powered by Ollama (local LLM, zero API cost)
 * Coordinates are validated + corrected via Nominatim (free OSM geocoder)
 * because LLMs often hallucinate GPS values.
 */
import { TripFormData, Trip, Place, ChatMessage } from "@/types";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL    = process.env.OLLAMA_MODEL    || "qwen2.5:7b";

// ── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are TripGo AI, an expert travel planner that creates detailed, personalized trip itineraries.

When generating a trip plan you MUST return ONLY valid JSON — no markdown, no explanation, no code fences.

The JSON must match this exact structure:
{
  "title": "string - catchy trip title",
  "description": "string - engaging trip overview (2-3 sentences)",
  "coverImageQuery": "string - 3-word image search term e.g. 'Paris Eiffel sunset'",
  "destinations": ["array", "of", "destination", "names"],
  "totalDays": number,
  "totalDistance": "estimated total distance e.g. '320 km'",
  "tags": ["cultural", "adventure", "beach"],
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "description": "Day overview sentence",
      "places": [
        {
          "id": "place-1-day-1",
          "name": "Exact Place Name",
          "description": "What to do here and why it is special",
          "coordinates": [latitude_number, longitude_number],
          "type": "destination",
          "duration": "2 hours",
          "tips": "Practical insider tip",
          "imageQuery": "place landmark photo",
          "rating": 4.5,
          "address": "Street, City, Country"
        }
      ],
      "routes": [
        {
          "from": "First Place Name",
          "to": "Second Place Name",
          "distance": "3 km",
          "duration": "10 minutes",
          "mode": "walking",
          "instructions": ["Head north on Main Street", "Turn right at the plaza"]
        }
      ]
    }
  ]
}

STRICT rules:
- type must be one of: destination | viewpoint | restaurant | hotel | activity
- mode must be one of: driving | walking | cycling
- coordinates must be real accurate GPS numbers [lat, lng] — never use 0,0
- Return ONLY the JSON object — no text before or after it`;

// ── Ollama low-level caller ──────────────────────────────────────────────────
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
        temperature:    opts.temperature  ?? 0.65,
        num_predict:    opts.num_predict  ?? 8192,
        top_p:          0.9,
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

// ── JSON extractor (handles markdown code fences from stubborn models) ────────
function extractJSON(raw: string): string {
  let text = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start !== -1 && end > start) text = text.slice(start, end + 1);
  return text;
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
  // Reject suspiciously round numbers (e.g. 48.0, 2.0) — signs of hallucination
  const isRound = (n: number) => Math.abs(n - Math.round(n)) < 0.001;
  if (isRound(lat) && isRound(lng)) return false;
  return true;
}

// ── Nominatim geocoder (free OpenStreetMap — no API key needed) ──────────────
// Rate limit: 1 req / second per IP. We wait 1 100 ms between each call.
async function geocode(query: string): Promise<[number, number] | null> {
  try {
    const url =
      "https://nominatim.openstreetmap.org/search?" +
      new URLSearchParams({ q: query, format: "json", limit: "1" });

    const res = await fetch(url, {
      headers: {
        // Nominatim requires a descriptive User-Agent
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

// Respect Nominatim's 1 req/sec policy
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fix every place's coordinates using Nominatim.
 * Strategy (tries each in order until a valid coord is found):
 *   1. name + full address  (most specific)
 *   2. name + first destination  (context-aware)
 *   3. name alone
 *   4. Keep LLM coordinates if they look valid
 *   5. Fall back to the destination city center
 */
async function geocodePlaces(
  places: Place[],
  destinations: string[]
): Promise<Place[]> {
  const destContext = destinations[0] ?? "";

  const fixed: Place[] = [];

  for (const place of places) {
    let coord: [number, number] | null = null;

    // Build search queries from most to least specific
    const queries: string[] = [];
    if (place.address && place.address.length > 4)
      queries.push(`${place.name}, ${place.address}`);
    if (destContext)
      queries.push(`${place.name}, ${destContext}`);
    queries.push(place.name);

    for (const q of queries) {
      coord = await geocode(q);
      await sleep(1_100); // Nominatim rate limit
      if (coord) break;
    }

    // If Nominatim failed, trust the LLM coord only if it passes validation
    if (!coord && isValidCoord(place.coordinates)) {
      coord = place.coordinates;
    }

    // Last resort: geocode the destination city itself
    if (!coord && destContext) {
      coord = await geocode(destContext);
      await sleep(1_100);
    }

    fixed.push({ ...place, coordinates: coord ?? [0, 0] });
  }

  return fixed;
}

// ── Public: generate full trip plan ─────────────────────────────────────────
export async function generateTripPlan(formData: TripFormData): Promise<Trip> {
  // Step 1 — Ask the LLM for the itinerary structure
  const prompt =
    `Create a ${formData.days}-day trip itinerary for: ${formData.destinations.join(", ")}

Budget: ${formData.budget}
Interests: ${(formData.interests ?? []).join(", ") || "general sightseeing"}
Travelers: ${formData.travelers ?? 1}
${formData.startDate ? `Start date: ${formData.startDate}` : ""}
${formData.notes     ? `Special requests: ${formData.notes}` : ""}

Return ONLY the JSON object — no commentary, no markdown.`;

  const raw      = await ollamaChat(SYSTEM_PROMPT, [{ role: "user", content: prompt }], { num_predict: 8192 });
  const jsonText = extractJSON(raw);

  let trip: Trip;
  try {
    trip = JSON.parse(jsonText) as Trip;
  } catch {
    console.error("JSON parse failed. Raw model output:\n", raw.slice(0, 500));
    throw new Error("Model returned invalid JSON. Try a larger/better model or retry.");
  }

  // Step 2 — Fix coordinates with Nominatim geocoding
  // LLMs frequently hallucinate GPS values; real geocoding ensures the map is correct.
  console.log(`[TripGo] Geocoding coordinates for ${trip.days?.length ?? 0} days…`);

  if (Array.isArray(trip.days)) {
    for (const day of trip.days) {
      if (Array.isArray(day.places) && day.places.length > 0) {
        day.places = await geocodePlaces(day.places, formData.destinations);
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
${trip.days?.map((d) => `Day ${d.day}: ${d.title} — ${d.places?.map((p) => p.name).join(", ")}`).join("\n")}`;

  const system = `${SYSTEM_PROMPT}

${tripSummary}

When the user requests changes respond with TWO parts separated by the exact marker "UPDATED_TRIP_JSON:":
  Part 1 — friendly plain-text explanation of what you changed (1-3 sentences)
  Part 2 — the complete updated trip JSON (same schema, no markdown)

If the user is just chatting or asking travel questions, reply conversationally without any JSON.`;

  const history = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const raw = await ollamaChat(
    system,
    [...history, { role: "user", content: userMessage }],
    { num_predict: 6144, temperature: 0.7 }
  );

  if (raw.includes("UPDATED_TRIP_JSON:")) {
    const [explanation, jsonPart] = raw.split("UPDATED_TRIP_JSON:");
    try {
      const updatedTrip = JSON.parse(extractJSON(jsonPart.trim())) as Partial<Trip>;

      // Fix coordinates on any newly added / changed places
      if (Array.isArray(updatedTrip.days) && trip.destinations) {
        for (const day of updatedTrip.days) {
          if (!Array.isArray(day.places)) continue;

          // Only geocode places whose coordinates look wrong
          const needsGeocode = day.places.filter((p) => !isValidCoord(p.coordinates));
          if (needsGeocode.length > 0) {
            const fixed = await geocodePlaces(needsGeocode, trip.destinations);
            // Merge back
            const fixedMap = Object.fromEntries(fixed.map((p) => [p.id, p]));
            day.places = day.places.map((p) => fixedMap[p.id] ?? p);
          }
        }
      }

      return { text: explanation.trim(), updatedTrip };
    } catch {
      return { text: explanation.trim() };
    }
  }

  return { text: raw.trim() };
}
