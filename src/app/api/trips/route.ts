import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongoose";
import Trip from "@/models/Trip";

// GET /api/trips - Get current user's trips
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const trips = await Trip.find({ owner: session.user.id })
      .sort({ updatedAt: -1 })
      .select("-chatHistory -days")
      .populate("owner", "name avatar")
      .lean();

    return NextResponse.json({ trips });
  } catch (err) {
    console.error("GET /api/trips error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/trips - Create a new trip
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();

    const trip = await Trip.create({
      ...body,
      owner: session.user.id,
      saves: 0,
      savedBy: [],
      chatHistory: [],
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (err) {
    console.error("POST /api/trips error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
