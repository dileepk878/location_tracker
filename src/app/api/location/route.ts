import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** Shape of the incoming location payload */
interface LocationPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

/** Stored entry shape */
export interface LocationEntry {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  receivedAt: string;
}

/** Path to the JSON storage file */
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "locations.json");

/** Read all stored locations */
export function readLocations(): LocationEntry[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** Append a new location entry and persist to disk */
function saveLocation(entry: LocationEntry): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const entries = readLocations();
  entries.push(entry);
  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

/** Simple validation for coordinate values */
function isValidCoordinate(lat: unknown, lon: unknown): boolean {
  if (typeof lat !== "number" || typeof lon !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // --- Rate-limit guard (simple per-request size check) ---
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 1024) {
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413 }
      );
    }

    // --- Parse body ---
    let body: LocationPayload;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { latitude, longitude, accuracy, timestamp } = body;

    // --- Validate coordinates ---
    if (!isValidCoordinate(latitude, longitude)) {
      return NextResponse.json(
        { error: "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180." },
        { status: 422 }
      );
    }

    // --- Validate optional fields ---
    if (accuracy !== undefined && (typeof accuracy !== "number" || accuracy < 0)) {
      return NextResponse.json(
        { error: "Invalid accuracy value" },
        { status: 422 }
      );
    }

    if (timestamp !== undefined && (typeof timestamp !== "number" || !Number.isFinite(timestamp))) {
      return NextResponse.json(
        { error: "Invalid timestamp value" },
        { status: 422 }
      );
    }

    // ----------------------------------------------------------------
    // 📍 LOCATION RECEIVED — save to data/locations.json
    // ----------------------------------------------------------------
    const entry: LocationEntry = {
      id: crypto.randomUUID(),
      latitude,
      longitude,
      accuracy,
      timestamp,
      receivedAt: new Date().toISOString(),
    };

    saveLocation(entry);

    console.log("[Location API] Saved:", entry);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Location API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** Only POST is allowed */
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
