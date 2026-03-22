import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateTripPlan } from "@/lib/ai/tripAI";
import { TripFormData } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData: TripFormData = await req.json();

    if (!formData.destinations?.length) {
      return NextResponse.json(
        { error: "At least one destination is required" },
        { status: 400 }
      );
    }

    const trip = await generateTripPlan(formData);
    return NextResponse.json({ trip });
  } catch (err) {
    console.error("POST /api/ai/generate error:", err);
    return NextResponse.json(
      { error: "Failed to generate trip plan" },
      { status: 500 }
    );
  }
}
