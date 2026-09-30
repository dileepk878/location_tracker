import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

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

// In-memory global store to survive across warm serverless requests on Vercel
declare global {
  // eslint-disable-next-line no-var
  var __locationEntriesCache: LocationEntry[] | undefined;
}

if (!globalThis.__locationEntriesCache) {
  globalThis.__locationEntriesCache = [];
}

/** Get the primary writable file path depending on environment */
function getStoragePath(): string {
  // On Vercel / AWS Lambda, process.cwd() is read-only (/var/task).
  // os.tmpdir() (/tmp) is writable.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), "locations.json");
  }
  return path.join(process.cwd(), "data", "locations.json");
}

/** Read all stored locations from memory and available disk files */
export function readLocations(): LocationEntry[] {
  const map = new Map<string, LocationEntry>();

  // 1. Read from in-memory cache
  for (const item of globalThis.__locationEntriesCache ?? []) {
    if (item?.id) {
      map.set(item.id, item);
    }
  }

  // 2. Candidate storage files on disk
  const candidateFiles = [
    getStoragePath(),
    path.join(os.tmpdir(), "locations.json"),
    path.join(process.cwd(), "data", "locations.json"),
  ];

  for (const filePath of candidateFiles) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ filePath, "utf-8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item && item.id) {
              map.set(item.id, item);
            }
          }
        }
      }
    } catch {
      // Inaccessible paths are safely ignored
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
  );
}

/** Append a new location entry and persist safely without throwing */
function saveLocation(entry: LocationEntry): void {
  // 1. Always keep in memory
  if (!globalThis.__locationEntriesCache) {
    globalThis.__locationEntriesCache = [];
  }
  globalThis.__locationEntriesCache.push(entry);

  // 2. Try primary storage file
  const targetPath = getStoragePath();
  const targetDir = path.dirname(targetPath);

  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ targetDir)) {
      fs.mkdirSync(/*turbopackIgnore: true*/ targetDir, { recursive: true });
    }
    const all = readLocations();
    fs.writeFileSync(/*turbopackIgnore: true*/ targetPath, JSON.stringify(all, null, 2), "utf-8");
  } catch (fsErr) {
    console.warn(`[Location API] Notice: Could not write to ${targetPath}, attempting /tmp fallback:`, fsErr);
    try {
      const fallbackPath = path.join(os.tmpdir(), "locations.json");
      const all = readLocations();
      fs.writeFileSync(/*turbopackIgnore: true*/ fallbackPath, JSON.stringify(all, null, 2), "utf-8");
    } catch (fallbackErr) {
      console.warn("[Location API] Disk write failed; location is preserved in memory and runtime logs:", fallbackErr);
    }
  }
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
    // 📍 LOCATION RECEIVED
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

    // Formatted log visible in Vercel Runtime Logs and local terminal
    console.log("\n========================================");
    console.log("📍 [Location API] New Location Received:");
    console.log(`   ID:        ${entry.id}`);
    console.log(`   Latitude:  ${entry.latitude}`);
    console.log(`   Longitude: ${entry.longitude}`);
    if (entry.accuracy) console.log(`   Accuracy:  ${entry.accuracy}m`);
    console.log(`   Maps Link: https://www.google.com/maps?q=${entry.latitude},${entry.longitude}`);
    console.log(`   Timestamp: ${entry.receivedAt}`);
    console.log("========================================\n");

    // Optional webhook forwarding (e.g. Discord, Telegram, or custom webhook)
    if (process.env.WEBHOOK_URL) {
      fetch(process.env.WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `📍 New Location: https://www.google.com/maps?q=${entry.latitude},${entry.longitude} (Lat: ${entry.latitude}, Lon: ${entry.longitude}, Accuracy: ${entry.accuracy ?? "N/A"}m)`,
          entry,
        }),
      }).catch((err) => console.error("[Location API] Webhook dispatch error:", err));
    }

    return NextResponse.json({ success: true, id: entry.id });
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
