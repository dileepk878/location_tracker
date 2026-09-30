import { NextResponse } from "next/server";
import { readLocations } from "../location/route";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entries = readLocations();
    // Return newest first
    entries.reverse();
    return NextResponse.json({ entries, total: entries.length });
  } catch (error) {
    console.error("[Locations API] Error:", error);
    return NextResponse.json(
      { error: "Failed to read locations" },
      { status: 500 }
    );
  }
}
