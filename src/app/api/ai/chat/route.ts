import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { chatWithAI } from "@/lib/ai/tripAI";

export const maxDuration = 300;
import connectDB from "@/lib/db/mongoose";
import Trip from "@/models/Trip";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId, message } = await req.json();

    if (!tripId || !message) {
      return NextResponse.json(
        { error: "tripId and message are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (trip.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Add user message to history
    trip.chatHistory.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    } as never);

    const { text, updatedTrip } = await chatWithAI(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trip.toObject() as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trip.chatHistory.map((m: any) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
      message
    );

    // Add assistant response to history
    trip.chatHistory.push({
      role: "assistant",
      content: text,
      timestamp: new Date(),
    } as never);

    // Apply trip updates if any
    if (updatedTrip) {
      Object.assign(trip, {
        ...updatedTrip,
        owner: trip.owner,
        _id: trip._id,
      });
    }

    await trip.save();

    return NextResponse.json({
      message: text,
      updatedTrip: updatedTrip ? trip.toObject() : null,
    });
  } catch (err) {
    console.error("POST /api/ai/chat error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
