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
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OLLAMA_BASE_URL   = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL      = process.env.OLLAMA_MODEL    || "qwen2.5:7b";

const USE_CLAUDE = Boolean(ANTHROPIC_API_KEY);

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
12. All string values must be properly escaped — no unescaped quotes or newlines`;

// ── LLM caller — routes to Claude or Ollama ─────────────────────────────────
async function llmChat(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  if (USE_CLAUDE) {
    return claudeChat(system, messages, opts);
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

// ── JSON extractor + repair ─────────────────────────────────────────────────
function extractJSON(raw: string): string {
  // Strip markdown fences
  let text = raw
    .replace(/^```(?:json)?\s*/gm, "")
    .replace(/\s*```\s*$/gm, "")
    .trim();

  // Extract the outermost JSON object
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

/**
 * Fix every place's coordinates using Nominatim.
 * Strategy (tries each in order until a valid coord is found):
 *   1. name + full address  (most specific)
 *   2. name + each destination  (tries all, not just first — fixes multi-city trips)
 *   3. name alone
 *   4. Keep LLM coordinates if they look valid
 *   5. Fall back to each destination city center in turn
 */
async function geocodePlaces(
  places: Place[],
  destinations: string[]
): Promise<Place[]> {
  const fixed: Place[] = [];

  for (const place of places) {
    let coord: [number, number] | null = null;

    // Build search queries from most to least specific.
    // Try every destination as context — critical for multi-destination trips
    const queries: string[] = [];
    if (place.address && place.address.length > 4)
      queries.push(`${place.name}, ${place.address}`);
    for (const dest of destinations)
      queries.push(`${place.name}, ${dest}`);
    queries.push(place.name);

    for (const q of queries) {
      coord = await geocode(q);
      await sleep(1_100);
      if (coord) break;
    }

    // If Nominatim failed, trust the LLM coord only if it passes validation
    if (!coord && isValidCoord(place.coordinates)) {
      coord = place.coordinates;
    }

    // Last resort: geocode each destination until one succeeds
    if (!coord) {
      for (const dest of destinations) {
        coord = await geocode(dest);
        await sleep(1_100);
        if (coord) break;
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

  const prompt =
    `Create a ${formData.days}-day trip itinerary for: ${formData.destinations.join(", ")}

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

  // Fix coordinates with Nominatim geocoding
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

  const raw = await llmChat(
    system,
    [...history, { role: "user", content: userMessage }],
    { maxTokens: 8192, temperature: 0.5 }
  );

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
        for (const day of updatedTrip.days) {
          if (!Array.isArray(day.places)) continue;

          // Only geocode places whose coordinates look wrong
          const needsGeocode = day.places.filter((p) => !isValidCoord(p.coordinates));
          if (needsGeocode.length > 0) {
            const fixed = await geocodePlaces(needsGeocode, trip.destinations);
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
