"use client";

import { useState } from "react";
import Link from "next/link";

export default function AppPage() {
  const [selectedDevice, setSelectedDevice] = useState("web");

  const devices = [
    {
      id: "web",
      title: "WEB APP",
      subtitle: "Chrome, Safari, Edge, Firefox",
      badge: "STREAM INSTANTLY",
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
      id: "android",
      title: "ANDROID APP",
      subtitle: "Phone, Tablet & Android TV",
      badge: "DOWNLOAD NATIVE APK",
      tag: "RECOMMENDED",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.156-.2704.0635-.6153-.2069-.7713-.2699-.1565-.615-.0636-.7713.2069l-2.0223 3.5026c-1.4646-.6692-3.1118-1.0475-4.877-1.0475s-3.4124.3783-4.877 1.0475L5.1007 5.3004c-.1563-.2705-.5014-.3634-.7713-.2069-.2704.156-.3629.5009-.2069.7713l1.996 3.4572C2.658 11.2334.3333 14.8876.3333 19.1667h23.3334c0-4.2791-2.3247-7.9333-5.7862-9.8453"/>
        </svg>
      )
    },
    {
      id: "ios",
      title: "APPLE IOS",
      subtitle: "iPhone, iPad & Mac",
      badge: "INSTALL ON IOS",
      tag: "NEW RELEASE",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.93.04-2.02.63-2.66 1.39-.56.65-.96 1.71-.83 2.74 1.05.08 2.05-.53 2.57-1.26z"/>
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
            <span className="badge-sparkle">⚡</span> FREE ENTERTAINMENT PLATFORM · 0 ADS
          </span>
        </div>

        {/* Hero Title Header */}
        <section className="landing-hero-section">
          <h1 className="landing-main-title">
            Everything You <span className="highlight-love">Love</span> to Watch
          </h1>
          <p className="landing-subtitle">
            Unlimited Movies & TV Series on your Web browser, Android phone, or iOS device. Completely free forever.
          </p>

          {/* Feature Badges */}
          <div className="landing-feature-pills">
            <span className="f-pill">4K Ultra HD</span>
            <span className="f-pill active">HD Content</span>
            <span className="f-pill">Vidbolt Pro Engine</span>
            <span className="f-pill">Multi-Audio & Dubs</span>
            <span className="f-pill">Zero Subscription</span>
          </div>

          {/* Main CTA Button */}
          <div className="landing-cta-box">
            <Link href="/home" className="btn-landing-home">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span>LAUNCH WEB APP</span>
            </Link>
            <span className="cta-sub-notice">Instant High-Speed Streaming Online</span>
            <a href="#pick-device" className="landing-scroll-link">
              See details for Web, Android & iOS <span className="down-arrow">↓</span>
            </a>
          </div>
        </section>

        {/* Pick Your Platform Section */}
        <section id="pick-device" className="pick-device-section">
          <div className="section-label-tag">CHOOSE PLATFORM</div>
          <h2 className="section-title">Stream on Web, Android, or iOS</h2>
          <p className="section-desc">
            Enjoy instant browser streaming or download the standalone native app for Android and Apple iOS.
          </p>

          {/* 3 Platform Selection Cards */}
          <div className="devices-grid three-cards">
            {devices.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`device-card ${selectedDevice === d.id ? "active" : ""}`}
                onClick={() => setSelectedDevice(d.id)}
              >
                {d.tag && <span className="card-top-tag">{d.tag}</span>}
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

          {/* Dynamic Platform Setup Details Card */}
          <div className="device-detail-card">
            <div className="device-detail-left">
              {selectedDevice === "web" && (
                <>
                  <h3 className="detail-instruction-title">
                    Instant Web Streaming (No Installation Required)
                  </h3>
                  <p className="detail-instruction-sub">
                    Open MovieFlix instantly on any desktop, laptop, tablet, or phone browser with 4K HDR playback and zero ads.
                  </p>
                  
                  <div className="download-action-group">
                    <Link href="/home" className="btn-device-action primary-download">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="6 3 20 12 6 21 6 3"/>
                      </svg>
                      <div className="btn-text-col">
                        <span>OPEN MOVIEFLIX WEB</span>
                        <small>Direct Instant Access · All Browsers Supported</small>
                      </div>
                    </Link>
                  </div>

                  <div className="detail-notice-box info">
                    <span className="notice-icon">ℹ️</span>
                    <span>Supports Google Chrome, Firefox, Safari, Edge, and Brave with GPU hardware acceleration.</span>
                  </div>
                </>
              )}

              {selectedDevice === "android" && (
                <>
                  <h3 className="detail-instruction-title">
                    Download MovieFlix Native Android App (.APK)
                  </h3>
                  <p className="detail-instruction-sub">
                    100% Standalone Native Android APK with auto landscape cinema mode, hardware acceleration, zero URL bars, and offline caching.
                  </p>

                  <div className="download-action-group">
                    <a
                      href="/downloads/MovieFlix.apk"
                      download="MovieFlix.apk"
                      className="btn-device-action primary-download"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      <div className="btn-text-col">
                        <span>DOWNLOAD ANDROID APP (.APK)</span>
                        <small>MovieFlix.apk · v1.0.0 · 51 MB · Direct Install</small>
                      </div>
                    </a>
                  </div>

                  <div className="step-list">
                    <div className="step-item">
                      <span className="step-num">1</span>
                      <span>Download <strong>MovieFlix.apk</strong> and tap <strong>Install</strong> on your Android phone or TV.</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">2</span>
                      <span>If prompted, tap <strong>Settings &rarr; Allow from this source</strong>.</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">3</span>
                      <span>Launch MovieFlix from your home screen and enjoy 4K streaming!</span>
                    </div>
                  </div>
                </>
              )}

              {selectedDevice === "ios" && (
                <>
                  <h3 className="detail-instruction-title">
                    Install MovieFlix on iPhone & iPad (iOS 15+)
                  </h3>
                  <p className="detail-instruction-sub">
                    Install MovieFlix directly on your iPhone or iPad as a standalone full-screen app with zero browser bars, offline caching, and native Vidbolt player support.
                  </p>

                  <div className="download-action-group">
                    <Link href="/home" className="btn-device-action primary-download">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.93.04-2.02.63-2.66 1.39-.56.65-.96 1.71-.83 2.74 1.05.08 2.05-.53 2.57-1.26z"/>
                      </svg>
                      <div className="btn-text-col">
                        <span>OPEN ON IPHONE & IPAD</span>
                        <small>Instant Install via Safari · iOS 15, 16, 17 & 18 Compatible</small>
                      </div>
                    </Link>
                  </div>

                  <div className="step-list">
                    <div className="step-item">
                      <span className="step-num">1</span>
                      <span>Open <strong>MovieFlix</strong> in <strong>Safari</strong> on your iPhone or iPad.</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">2</span>
                      <span>Tap the <strong>Share</strong> button (the square with an arrow pointing up <span style={{ fontSize: "15px" }}>⎋</span>) at the bottom toolbar.</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">3</span>
                      <span>Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> in the top-right corner.</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">4</span>
                      <span>Launch MovieFlix from your home screen — enjoy pure full-screen cinema with no browser bars!</span>
                    </div>
                  </div>

                  <div className="detail-notice-box info" style={{ marginTop: "16px" }}>
                    <span className="notice-icon">📱</span>
                    <span>For developers: Xcode native project is ready in the repository under <code>MovieFlix ios/</code> (Bundle ID: <code>com.movieflix.app</code>).</span>
                  </div>
                </>
              )}
            </div>

            {/* Right Side Visual Graphic */}
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
