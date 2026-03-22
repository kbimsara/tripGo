import Anthropic from "@anthropic-ai/sdk";
import { TripFormData, Trip, ChatMessage } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are TripGo AI, an expert travel planner that creates detailed, personalized trip itineraries.

When generating a trip plan, you MUST return valid JSON matching this exact structure:
{
  "title": "string - catchy trip title",
  "description": "string - engaging trip overview",
  "coverImageQuery": "string - search term for cover image (e.g. 'Paris Eiffel Tower sunset')",
  "destinations": ["array of main destination names"],
  "totalDays": number,
  "totalDistance": "estimated total distance (e.g. '450 km')",
  "tags": ["relevant tags like 'cultural', 'adventure', 'beach'"],
  "days": [
    {
      "day": 1,
      "title": "string - day title",
      "description": "string - day overview",
      "places": [
        {
          "id": "unique-id-string",
          "name": "Place name",
          "description": "Detailed description of this place and what to do there",
          "coordinates": [latitude, longitude],
          "type": "destination|viewpoint|restaurant|hotel|activity",
          "duration": "2 hours",
          "tips": "insider tips for this place",
          "imageQuery": "search term for place image",
          "rating": 4.5,
          "address": "full address"
        }
      ],
      "routes": [
        {
          "from": "Place name",
          "to": "Next place name",
          "distance": "5 km",
          "duration": "15 minutes",
          "mode": "driving|walking|cycling",
          "instructions": ["Turn left at...", "Continue for 2km..."]
        }
      ]
    }
  ]
}

Rules:
- Use REAL, accurate GPS coordinates (latitude, longitude) for all places
- Include a mix of main sights, hidden gems, restaurants, and viewpoints each day
- Routes connect places within each day in logical order
- Be specific about timing and practical details
- Return ONLY valid JSON, no markdown or explanation`;

export async function generateTripPlan(formData: TripFormData): Promise<Trip> {
  const prompt = `Create a ${formData.days}-day trip itinerary for: ${formData.destinations.join(", ")}

Budget level: ${formData.budget}
Interests: ${formData.interests.join(", ")}
Number of travelers: ${formData.travelers || 1}
${formData.startDate ? `Start date: ${formData.startDate}` : ""}
${formData.notes ? `Special requests: ${formData.notes}` : ""}

Generate a complete, detailed trip plan with real GPS coordinates for all places.`;

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonText = content.text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(jsonText) as Trip;
}

export async function chatWithAI(
  trip: Partial<Trip>,
  messages: ChatMessage[],
  userMessage: string
): Promise<{ text: string; updatedTrip?: Partial<Trip> }> {
  const conversationHistory = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const tripContext = `Current trip plan:
Title: ${trip.title}
Destinations: ${trip.destinations?.join(", ")}
Days: ${trip.totalDays}
Budget: ${trip.budget}

Current itinerary:
${trip.days
  ?.map(
    (d) => `Day ${d.day}: ${d.title}
Places: ${d.places?.map((p) => `${p.name} (${p.type})`).join(", ")}`
  )
  .join("\n")}`;

  const systemWithContext = `${SYSTEM_PROMPT}

${tripContext}

When the user asks to modify the trip, respond with:
1. A friendly explanation of the changes you're making
2. Then on a new line: "UPDATED_TRIP_JSON:" followed by the complete updated trip JSON

If no changes needed, just respond conversationally with travel advice.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 6000,
    system: systemWithContext,
    messages: [
      ...conversationHistory,
      { role: "user", content: userMessage },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const text = content.text;

  if (text.includes("UPDATED_TRIP_JSON:")) {
    const parts = text.split("UPDATED_TRIP_JSON:");
    const explanation = parts[0].trim();
    const jsonText = parts[1].trim().replace(/```json\n?|\n?```/g, "").trim();
    try {
      const updatedTrip = JSON.parse(jsonText) as Partial<Trip>;
      return { text: explanation, updatedTrip };
    } catch {
      return { text: explanation };
    }
  }

  return { text };
}
