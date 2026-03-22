/**
 * TripGo AI — powered by Ollama (local LLM, zero API cost)
 * Docs: https://ollama.com
 */
import { TripFormData, Trip, ChatMessage } from "@/types";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL    = process.env.OLLAMA_MODEL    || "qwen2.5:7b";

// ── Shared system prompt ────────────────────────────────────────────────────
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

// ── Low-level Ollama caller ─────────────────────────────────────────────────
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
        temperature:  opts.temperature  ?? 0.65,
        num_predict:  opts.num_predict  ?? 8192,
        top_p:        0.9,
        repeat_penalty: 1.1,
      },
    }),
    // Local models can be slow — allow up to 5 minutes
    signal: AbortSignal.timeout(300_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Ollama ${res.status}: ${body}`);
  }

  const data = await res.json();
  return (data.message?.content as string) ?? "";
}

// ── Robust JSON extractor ───────────────────────────────────────────────────
// Local models sometimes wrap output in ```json ... ``` even when asked not to.
function extractJSON(raw: string): string {
  // Strip markdown code fences
  let text = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();

  // Find outermost { ... }
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  return text;
}

// ── Public: generate full trip plan ────────────────────────────────────────
export async function generateTripPlan(formData: TripFormData): Promise<Trip> {
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

  try {
    return JSON.parse(jsonText) as Trip;
  } catch (e) {
    console.error("JSON parse failed. Raw model output:\n", raw.slice(0, 500));
    throw new Error("Model returned invalid JSON. Try a larger/better model or retry.");
  }
}

// ── Public: chat to customize existing trip ─────────────────────────────────
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

  const raw = await ollamaChat(system, [...history, { role: "user", content: userMessage }], {
    num_predict: 6144,
    temperature: 0.7,
  });

  if (raw.includes("UPDATED_TRIP_JSON:")) {
    const [explanation, jsonPart] = raw.split("UPDATED_TRIP_JSON:");
    try {
      const updatedTrip = JSON.parse(extractJSON(jsonPart.trim())) as Partial<Trip>;
      return { text: explanation.trim(), updatedTrip };
    } catch {
      return { text: explanation.trim() };
    }
  }

  return { text: raw.trim() };
}
