import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongoose";
import Trip from "@/models/Trip";

// GET /api/trips/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const trip = await Trip.findById(id)
      .populate("owner", "name avatar email")
      .lean();

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const session = await auth();
    const isOwner =
      session?.user?.id &&
      trip.owner._id.toString() === session.user.id;

    if (!trip.isPublic && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ trip });
  } catch (err) {
    console.error("GET /api/trips/:id error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/trips/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const trip = await Trip.findById(id);
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (trip.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await Trip.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true }
    ).populate("owner", "name avatar");

    return NextResponse.json({ trip: updated });
  } catch (err) {
    console.error("PUT /api/trips/:id error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/trips/:id
export async function DELETE(
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

    const trip = await Trip.findById(id);
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (trip.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await trip.deleteOne();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/trips/:id error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
