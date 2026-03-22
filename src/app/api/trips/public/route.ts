import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongoose";
import Trip from "@/models/Trip";

// GET /api/trips/public - Explore public trips
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";
    const sort = searchParams.get("sort") || "recent";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 12;

    await connectDB();

    const query: Record<string, unknown> = { isPublic: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (tag) {
      query.tags = tag;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortObj: any =
      sort === "popular"
        ? { saves: -1 }
        : sort === "oldest"
        ? { createdAt: 1 }
        : { createdAt: -1 };

    const trips = await Trip.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-chatHistory -days.routes")
      .populate("owner", "name avatar")
      .lean();

    const total = await Trip.countDocuments(query);

    return NextResponse.json({
      trips,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/trips/public error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
