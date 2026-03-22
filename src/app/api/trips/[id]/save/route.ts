import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongoose";
import Trip from "@/models/Trip";
import User from "@/models/User";
import mongoose from "mongoose";

// POST /api/trips/:id/save - Save/clone a public trip
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const original = await Trip.findById(id);
    if (!original || !original.isPublic) {
      return NextResponse.json(
        { error: "Trip not found or private" },
        { status: 404 }
      );
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Check if already saved
    const alreadySaved = original.savedBy.some(
      (sid) => sid.toString() === session.user.id
    );

    if (alreadySaved) {
      // Unsave
      await Trip.findByIdAndUpdate(id, {
        $pull: { savedBy: userId },
        $inc: { saves: -1 },
      });
      await User.findByIdAndUpdate(session.user.id, {
        $pull: { savedTrips: original._id },
      });
      return NextResponse.json({ saved: false });
    }

    // Save
    await Trip.findByIdAndUpdate(id, {
      $addToSet: { savedBy: userId },
      $inc: { saves: 1 },
    });
    await User.findByIdAndUpdate(session.user.id, {
      $addToSet: { savedTrips: original._id },
    });

    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error("POST /api/trips/:id/save error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/trips/:id/clone - Clone and customize
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const original = await Trip.findById(id).lean();
    if (!original || !original.isPublic) {
      return NextResponse.json(
        { error: "Trip not found or private" },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, owner, saves, savedBy, createdAt, updatedAt, ...rest } =
      original as typeof original & { _id: unknown; owner: unknown; saves: unknown; savedBy: unknown; createdAt: unknown; updatedAt: unknown };

    const cloned = await Trip.create({
      ...rest,
      title: `${original.title} (My Version)`,
      owner: session.user.id,
      originalTrip: original._id,
      isPublic: false,
      saves: 0,
      savedBy: [],
      chatHistory: [],
    });

    return NextResponse.json({ trip: cloned }, { status: 201 });
  } catch (err) {
    console.error("PUT /api/trips/:id/save error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
