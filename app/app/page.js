"use client";

import { useState } from "react";
import Link from "next/link";

export default function AppPage() {
  const [selectedDevice, setSelectedDevice] = useState("computer");

  const devices = [
    {
      id: "android",
      title: "ANDROID",
      subtitle: "Phone & Tablet",
      badge: "FREE APK / PWA",
      tag: null,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.156-.2704.0635-.6153-.2069-.7713-.2699-.1565-.615-.0636-.7713.2069l-2.0223 3.5026c-1.4646-.6692-3.1118-1.0475-4.877-1.0475s-3.4124.3783-4.877 1.0475L5.1007 5.3004c-.1563-.2705-.5014-.3634-.7713-.2069-.2704.156-.3629.5009-.2069.7713l1.996 3.4572C2.658 11.2334.3333 14.8876.3333 19.1667h23.3334c0-4.2791-2.3247-7.9333-5.7862-9.8453"/>
        </svg>
      )
    },
    {
      id: "ios",
      title: "iOS",
      subtitle: "iPhone & iPad",
      badge: "APP / SAFARI",
      tag: null,
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.57.65-1.06 1.7-0.93 2.73.99.08 2.02-.48 2.65-1.23z"/>
        </svg>
      )
    },
    {
      id: "computer",
      title: "COMPUTER",
      subtitle: "Windows, Mac & Linux",
      badge: "WEB — NO INSTALL",
      tag: "MOST POPULAR",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="20" height="14" x="2" y="3" rx="2"/>
          <line x1="8" x2="16" y1="21" y2="21"/>
          <line x1="12" x2="12" y1="17" y2="21"/>
        </svg>
      )
    },
    {
      id: "tv",
      title: "ANDROID TV",
      subtitle: "Android TV & Google TV",
      badge: "TV / CAST",
      tag: "NEW",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="20" height="15" x="2" y="7" rx="2"/>
          <polyline points="17 2 12 7 7 2"/>
        </svg>
      )
    }
  ];

  const genresList = [
    "DOCUMENTARY", "BIOGRAPHY", "MUSICAL", "ADVENTURE", "ANIME",
    "DRAMA", "THRILLER", "ROMANCE", "HORROR", "SCI-FI",
    "ACTION", "REALITY-TV", "FILM-NOIR", "COMEDY", "CRIME",
    "GAME-SHOW", "WAR", "WESTERN", "FANTASY", "CLASSICS"
  ];

  return (
    <main className="app-landing-page">
      {/* Ambient background glow */}
      <div className="landing-ambient-radial" />

      <div className="app-page-container">
        {/* Top Feature Pill */}
        <div className="landing-top-badge-wrap">
          <span className="landing-top-badge">
            <span className="badge-sparkle">⚡</span> FREE ENTERTAINMENT APP · 0 ADS
          </span>
        </div>

        {/* Hero Title Header */}
        <section className="landing-hero-section">
          <h1 className="landing-main-title">
            Everything You <span className="highlight-love">Love</span> to Watch
          </h1>
          <p className="landing-subtitle">
            Unlimited entertainment is just a click away. Use our app or website anytime, anywhere — completely free for everyone.
          </p>

          {/* Feature Badges */}
          <div className="landing-feature-pills">
            <span className="f-pill">4K Ultra HD</span>
            <span className="f-pill active">HD Content</span>
            <span className="f-pill">Original Audio</span>
            <span className="f-pill">Multi-Server</span>
            <span className="f-pill">Zero Subscription</span>
          </div>

          {/* Main CTA Button */}
          <div className="landing-cta-box">
            <Link href="/home" className="btn-landing-home">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span>GO TO HOME</span>
            </Link>
            <span className="cta-sub-notice">Instant High-Speed Streaming Online</span>
            <a href="#pick-device" className="landing-scroll-link">
              See install steps for every device <span className="down-arrow">↓</span>
            </a>
          </div>
        </section>

        {/* Pick Your Device Section */}
        <section id="pick-device" className="pick-device-section">
          <div className="section-label-tag">GET REELSTREAM</div>
          <h2 className="section-title">Pick your device</h2>
          <p className="section-desc">
            Android, iPhone, computer or TV — choose yours and follow the steps below.
          </p>

          {/* 4 Device Selection Cards */}
          <div className="devices-grid">
            {devices.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`device-card ${selectedDevice === d.id ? "active" : ""}`}
                onClick={() => setSelectedDevice(d.id)}
              >
                {d.tag && <span className={`card-top-tag ${d.tag === "NEW" ? "new" : ""}`}>{d.tag}</span>}
                <div className="device-card-header">
                  <div className="device-icon-box">{d.icon}</div>
                  <div className="device-title-box">
                    <span className="device-name">{d.title}</span>
                    <span className="device-sub">{d.subtitle}</span>
                  </div>
                </div>
                <div className="device-badge-btn">{d.badge}</div>
              </button>
            ))}
          </div>

          {/* Dynamic Device Setup Details Card */}
          <div className="device-detail-card">
            <div className="device-detail-left">
              {selectedDevice === "computer" && (
                <>
                  <h3 className="detail-instruction-title">
                    PC users just click on Go to Home button for movies and series.
                  </h3>
                  <p className="detail-instruction-sub">
                    Use Google Chrome, Brave, Edge or Mozilla Firefox for highest 4K streaming performance with hardware acceleration.
                  </p>
                  <Link href="/home" className="btn-device-action">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6 3 20 12 6 21 6 3"/>
                    </svg>
                    <span>GO TO HOME</span>
                  </Link>
                  <div className="detail-notice-box info">
                    <span className="notice-icon">ℹ️</span>
                    <span>No installation or software download required for Desktop & Laptop users.</span>
                  </div>
                </>
              )}

              {selectedDevice === "android" && (
                <>
                  <h3 className="detail-instruction-title">
                    Install ReelStream App on Android Phones & Tablets.
                  </h3>
                  <p className="detail-instruction-sub">
                    Fast Progressive Web App (PWA) with offline cache and zero ads.
                  </p>
                  <div className="step-list">
                    <div className="step-item">
                      <span className="step-num">1</span>
                      <span>Open <strong>Chrome</strong> or your browser on your Android device.</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">2</span>
                      <span>Tap the <strong>⋮ (Menu)</strong> icon in the top right corner.</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">3</span>
                      <span>Select <strong>&ldquo;Add to Home screen&rdquo;</strong> or <strong>&ldquo;Install App&rdquo;</strong>.</span>
                    </div>
                  </div>
                  <Link href="/home" className="btn-device-action">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6 3 20 12 6 21 6 3"/>
                    </svg>
                    <span>LAUNCH REELSTREAM WEB</span>
                  </Link>
                </>
              )}

              {selectedDevice === "ios" && (
                <>
                  <h3 className="detail-instruction-title">
                    Add ReelStream to your iPhone & iPad Home Screen.
                  </h3>
                  <p className="detail-instruction-sub">
                    Enjoy fullscreen cinema streaming with native iOS player controls.
                  </p>
                  <div className="step-list">
                    <div className="step-item">
                      <span className="step-num">1</span>
                      <span>Open <strong>Safari</strong> on your iPhone or iPad.</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">2</span>
                      <span>Tap the <strong>Share</strong> button (box with upward arrow) at the bottom.</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">3</span>
                      <span>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.</span>
                    </div>
                  </div>
                  <Link href="/home" className="btn-device-action">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6 3 20 12 6 21 6 3"/>
                    </svg>
                    <span>OPEN REELSTREAM NOW</span>
                  </Link>
                </>
              )}

              {selectedDevice === "tv" && (
                <>
                  <h3 className="detail-instruction-title">
                    Watch on Android TV, Google TV & Smart TV Screens.
                  </h3>
                  <p className="detail-instruction-sub">
                    Stream on the big screen in Full HD & 4K with cinema theater audio.
                  </p>
                  <div className="step-list">
                    <div className="step-item">
                      <span className="step-num">1</span>
                      <span>Open your Smart TV browser (Chrome, Silk, or TV Bro).</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">2</span>
                      <span>Navigate to ReelStream and bookmark the homepage.</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">3</span>
                      <span>Alternatively, use <strong>Chromecast / AirPlay</strong> to cast directly from your phone.</span>
                    </div>
                  </div>
                  <Link href="/home" className="btn-device-action">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6 3 20 12 6 21 6 3"/>
                    </svg>
                    <span>START TV STREAMING</span>
                  </Link>
                </>
              )}
            </div>

            {/* Right Side Visual Devices Graphic */}
            <div className="device-detail-right">
              <div className="devices-mockup-wrap">
                <div className="laptop-mockup">
                  <div className="laptop-screen">
                    <div className="mockup-play-btn">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="6 3 20 12 6 21 6 3"/>
                      </svg>
                    </div>
                  </div>
                  <div className="laptop-base" />
                </div>
                <div className="phone-mockup">
                  <div className="phone-screen">
                    <div className="mockup-play-small">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="6 3 20 12 6 21 6 3"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="tablet-mockup">
                  <div className="tablet-screen" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Watch Any Genre Cloud Card */}
        <section className="genre-cloud-section">
          <div className="genre-cloud-card">
            <div className="genre-card-tag">
              <span className="tag-dot">📍</span> WATCH ANY GENRE
            </div>
            <div className="genre-cloud-tags">
              {genresList.map((g, idx) => (
                <Link
                  key={idx}
                  href={`/browse/movie?genre=${g.toLowerCase()}`}
                  className={`genre-cloud-item ${idx % 3 === 0 ? "accent-green" : (idx % 4 === 0 ? "accent-red" : "")}`}
                >
                  {g}
                  {idx < genresList.length - 1 && <span className="genre-bullet">•</span>}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Banner */}
        <div className="landing-bottom-note">
          <span className="heart-icon">❤️</span> Made for people who love movies and web series.
        </div>
      </div>
    </main>
  );
}
