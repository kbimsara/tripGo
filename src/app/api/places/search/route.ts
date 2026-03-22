import { NextRequest, NextResponse } from "next/server";

// Nominatim geocoding - free OpenStreetMap service
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=5&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "TripGo/1.0 (travel planning app)",
        "Accept-Language": "en",
      },
    });

    const data = await response.json();

    const places = data.map(
      (item: {
        place_id: string;
        display_name: string;
        lat: string;
        lon: string;
        type: string;
        address?: { country?: string; state?: string; city?: string };
      }) => ({
        id: item.place_id,
        name: item.display_name.split(",")[0],
        displayName: item.display_name,
        coordinates: [parseFloat(item.lat), parseFloat(item.lon)],
        type: item.type,
        country: item.address?.country,
      })
    );

    return NextResponse.json({ places });
  } catch (err) {
    console.error("Places search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
