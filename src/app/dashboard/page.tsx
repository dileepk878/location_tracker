"use client";

import { useState, useEffect, useCallback } from "react";

interface LocationEntry {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  receivedAt: string;
}

export default function DashboardPage() {
  const [entries, setEntries] = useState<LocationEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/locations");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setEntries(data.entries);
      setTotal(data.total);
      setError("");
    } catch (err) {
      setError("Failed to load locations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const openInMaps = (lat: number, lon: number) => {
    window.open(
      `https://www.google.com/maps?q=${lat},${lon}`,
      "_blank",
      "noopener"
    );
  };

  return (
    <>
      <div className="bg-mesh" aria-hidden="true" />
      <div className="bg-grid" aria-hidden="true" />

      <main className="page-wrapper" role="main" style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ width: "100%", marginBottom: "var(--space-8)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-4)" }}>
            <div>
              <div className="badge badge--info" style={{ marginBottom: "var(--space-3)" }}>
                <span className="badge__dot" />
                Dashboard
              </div>
              <h1 className="heading" style={{ fontSize: "var(--fs-3xl)" }}>
                📍 Collected Locations
              </h1>
              <p className="subheading" style={{ marginTop: "var(--space-2)" }}>
                {total} location{total !== 1 ? "s" : ""} recorded
              </p>
            </div>
            <button
              className="btn btn--secondary"
              onClick={fetchLocations}
              disabled={loading}
              style={{ width: "auto", padding: "var(--space-3) var(--space-6)" }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  Refreshing…
                </>
              ) : (
                "↻ Refresh"
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="status-msg status-msg--error" style={{ width: "100%", marginBottom: "var(--space-4)" }}>
            <span className="status-msg__icon">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && entries.length === 0 && !error && (
          <div className="card" style={{ textAlign: "center", padding: "var(--space-16) var(--space-8)" }}>
            <p style={{ fontSize: "var(--fs-4xl)", marginBottom: "var(--space-4)" }}>📭</p>
            <h2 className="heading" style={{ fontSize: "var(--fs-xl)" }}>No Locations Yet</h2>
            <p className="subheading">
              When visitors allow location access on the landing page, their coordinates will appear here.
            </p>
          </div>
        )}

        {/* Location Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "var(--space-4)",
          width: "100%",
        }}>
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="card"
              style={{
                padding: "var(--space-6)",
                animationDelay: `${index * 60}ms`,
                cursor: "pointer",
                transition: "border-color var(--transition-fast), transform var(--transition-fast)",
              }}
              onClick={() => openInMaps(entry.latitude, entry.longitude)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-hover)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
              title="Click to view on Google Maps"
            >
              {/* Time */}
              <p style={{
                fontSize: "var(--fs-xs)",
                color: "var(--color-text-muted)",
                marginBottom: "var(--space-3)",
                letterSpacing: "var(--ls-wide)",
              }}>
                {formatDate(entry.receivedAt)}
              </p>

              {/* Coordinates */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-3)",
                marginBottom: "var(--space-4)",
              }}>
                <div style={{
                  background: "var(--color-surface)",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--space-3)",
                }}>
                  <p style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--color-text-muted)",
                    marginBottom: "var(--space-1)",
                    textTransform: "uppercase",
                    letterSpacing: "var(--ls-wide)",
                  }}>Latitude</p>
                  <p style={{
                    fontSize: "var(--fs-lg)",
                    fontWeight: "var(--fw-semibold)" as unknown as number,
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-text-primary)",
                  }}>{entry.latitude.toFixed(6)}</p>
                </div>
                <div style={{
                  background: "var(--color-surface)",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--space-3)",
                }}>
                  <p style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--color-text-muted)",
                    marginBottom: "var(--space-1)",
                    textTransform: "uppercase",
                    letterSpacing: "var(--ls-wide)",
                  }}>Longitude</p>
                  <p style={{
                    fontSize: "var(--fs-lg)",
                    fontWeight: "var(--fw-semibold)" as unknown as number,
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-text-primary)",
                  }}>{entry.longitude.toFixed(6)}</p>
                </div>
              </div>

              {/* Accuracy */}
              {entry.accuracy !== undefined && (
                <p style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--color-text-secondary)",
                }}>
                  Accuracy: ±{Math.round(entry.accuracy)}m
                </p>
              )}

              {/* Open in Maps hint */}
              <p style={{
                fontSize: "var(--fs-xs)",
                color: "var(--color-accent)",
                marginTop: "var(--space-3)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-1)",
              }}>
                🗺️ Click to view on Google Maps →
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="footer" style={{ width: "100%", marginTop: "var(--space-12)" }}>
          <p>
            <a href="/" style={{ color: "var(--color-text-secondary)" }}>← Back to landing page</a>
          </p>
        </footer>
      </main>
    </>
  );
}
