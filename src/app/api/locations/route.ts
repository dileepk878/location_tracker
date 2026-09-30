import { NextResponse } from "next/server";
import { readLocations } from "../location/route";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entries = readLocations();
    // Return newest first (immutable copy)
    const sorted = [...entries].reverse();
    return NextResponse.json({ entries: sorted, total: sorted.length });
  } catch (error) {
    console.error("[Locations API] Error:", error);
    return NextResponse.json(
      { error: "Failed to read locations" },
      { status: 500 }
    );
  }
}
