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
                    ReelStream for Windows, Mac & Linux
                  </h3>
                  <p className="detail-instruction-sub">
                    Choose the native Windows Desktop package or stream instantly via your favorite browser with zero installation.
                  </p>
                  
                  <div className="download-action-group">
                    <a href="/downloads/ReelStream.msixbundle" download="ReelStream.msixbundle" className="btn-device-action primary-download">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      <div className="btn-text-col">
                        <span>DOWNLOAD FOR WINDOWS (MSIX)</span>
                        <small>v1.0.0 · 1.5 MB · Windows 10/11 64-bit</small>
                      </div>
                    </a>

                    <div className="secondary-download-row">
                      <a href="/downloads/ReelStream-Windows.zip" download="ReelStream-Windows.zip" className="btn-secondary-dl">
                        <span>📦 Windows Full ZIP Installer (4.5 MB)</span>
                      </a>
                      <a href="/downloads/ReelStream.sideload.msix" download="ReelStream.sideload.msix" className="btn-secondary-dl">
                        <span>⚡ MSIX Sideload (1.5 MB)</span>
                      </a>
                      <Link href="/home" className="btn-secondary-dl highlight">
                        <span>🚀 Launch Web (No Install)</span>
                      </Link>
                    </div>
                  </div>

                  <div className="detail-notice-box info">
                    <span className="notice-icon">ℹ️</span>
                    <span>Supports 4K HDR playback with GPU hardware acceleration.</span>
                  </div>
                </>
              )}

              {selectedDevice === "android" && (
                <>
                  <h3 className="detail-instruction-title">
                    Download ReelStream for Android Phone & Tablet
                  </h3>
                  <p className="detail-instruction-sub">
                    Direct APK download for instant install or add as Progressive Web App (PWA) with zero ads and offline caching.
                  </p>

                  <div className="download-action-group">
                    <a href="/downloads/ReelStream.apk" download="ReelStream.apk" className="btn-device-action primary-download">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      <div className="btn-text-col">
                        <span>DOWNLOAD DIRECT APK</span>
                        <small>ReelStream.apk · v1.0.0 · 1.4 MB · Android 6.0+</small>
                      </div>
                    </a>

                    <div className="secondary-download-row">
                      <a href="/downloads/ReelStream.aab" download="ReelStream.aab" className="btn-secondary-dl">
                        <span>📦 Google Play AAB Bundle (1.5 MB)</span>
                      </a>
                      <Link href="/home" className="btn-secondary-dl highlight">
                        <span>🌐 Launch Web App</span>
                      </Link>
                    </div>
                  </div>

                  <div className="step-list">
                    <div className="step-item">
                      <span className="step-num">1</span>
                      <span>Download <strong>ReelStream.apk</strong> and tap <strong>Install</strong> on your phone.</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">2</span>
                      <span>If prompted, tap <strong>Settings &rarr; Allow from this source</strong>.</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">3</span>
                      <span>Launch ReelStream from your home screen and enjoy 4K streaming!</span>
                    </div>
                  </div>
                </>
              )}

              {selectedDevice === "ios" && (
                <>
                  <h3 className="detail-instruction-title">
                    ReelStream for iPhone, iPad & Apple Devices
                  </h3>
                  <p className="detail-instruction-sub">
                    Install instantly via Safari PWA or download the complete native Xcode project package.
                  </p>

                  <div className="download-action-group">
                    <a href="/downloads/ReelStream-iOS.zip" download="ReelStream-iOS.zip" className="btn-device-action primary-download">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      <div className="btn-text-col">
                        <span>DOWNLOAD iOS XCODE PROJECT (.ZIP)</span>
                        <small>Swift + WKWebView · 1.0 MB · Xcode / AltStore</small>
                      </div>
                    </a>

                    <div className="secondary-download-row">
                      <Link href="/home" className="btn-secondary-dl highlight">
                        <span>⚡ Launch Safari Web App</span>
                      </Link>
                    </div>
                  </div>

                  <div className="step-list">
                    <div className="step-item">
                      <span className="step-num">1</span>
                      <span>Open <strong>Safari</strong> on your iPhone or iPad.</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">2</span>
                      <span>Tap the <strong>Share</strong> button (box with arrow) at the bottom toolbar.</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">3</span>
                      <span>Tap <strong>&ldquo;Add to Home Screen&rdquo;</strong> for a fullscreen native app experience.</span>
                    </div>
                  </div>
                </>
              )}

              {selectedDevice === "tv" && (
                <>
                  <h3 className="detail-instruction-title">
                    ReelStream for Android TV & Smart TVs
                  </h3>
                  <p className="detail-instruction-sub">
                    Sideload our Android TV APK or stream directly via TV browser in 4K Ultra HD.
                  </p>

                  <div className="download-action-group">
                    <a href="/downloads/ReelStream.apk" download="ReelStream.apk" className="btn-device-action primary-download">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      <div className="btn-text-col">
                        <span>DOWNLOAD ANDROID TV APK</span>
                        <small>ReelStream.apk · 1.4 MB · Android TV / Fire TV</small>
                      </div>
                    </a>

                    <div className="secondary-download-row">
                      <Link href="/home" className="btn-secondary-dl highlight">
                        <span>📺 Open Web Player</span>
                      </Link>
                    </div>
                  </div>

                  <div className="step-list">
                    <div className="step-item">
                      <span className="step-num">1</span>
                      <span>Download <strong>ReelStream.apk</strong> on a USB drive or via the <strong>Downloader</strong> app.</span>
                    </div>
                    <div className="step-item">
                      <span className="step-num">2</span>
                      <span>Install the APK on your TV and launch ReelStream with your remote control.</span>
                    </div>
                  </div>
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

        {/* Direct Download Packages Hub */}
        <section className="download-hub-section">
          <div className="section-label-tag">DIRECT DOWNLOADS</div>
          <h2 className="section-title">All Software Builds & Installers</h2>
          <p className="section-desc">
            Download the official standalone application packages for your operating system.
          </p>

          <div className="download-hub-grid">
            {/* Android Card */}
            <div className="hub-package-card">
              <div className="hub-card-header">
                <div className="hub-icon android">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.156-.2704.0635-.6153-.2069-.7713-.2699-.1565-.615-.0636-.7713.2069l-2.0223 3.5026c-1.4646-.6692-3.1118-1.0475-4.877-1.0475s-3.4124.3783-4.877 1.0475L5.1007 5.3004c-.1563-.2705-.5014-.3634-.7713-.2069-.2704.156-.3629.5009-.2069.7713l1.996 3.4572C2.658 11.2334.3333 14.8876.3333 19.1667h23.3334c0-4.2791-2.3247-7.9333-5.7862-9.8453"/>
                  </svg>
                </div>
                <div>
                  <h3 className="hub-title">Android (APK / AAB)</h3>
                  <span className="hub-sub">Android 6.0 & newer · TV & Mobile</span>
                </div>
              </div>
              <div className="hub-files-list">
                <a href="/downloads/ReelStream.apk" download="ReelStream.apk" className="hub-file-btn primary">
                  <span className="file-name">⚡ ReelStream.apk</span>
                  <span className="file-meta">1.4 MB · Direct Install</span>
                </a>
                <a href="/downloads/ReelStream.aab" download="ReelStream.aab" className="hub-file-btn">
                  <span className="file-name">📦 ReelStream.aab</span>
                  <span className="file-meta">1.5 MB · Play Store Bundle</span>
                </a>
              </div>
            </div>

            {/* Windows Card */}
            <div className="hub-package-card">
              <div className="hub-card-header">
                <div className="hub-icon windows">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.901-1.8"/>
                  </svg>
                </div>
                <div>
                  <h3 className="hub-title">Windows Desktop</h3>
                  <span className="hub-sub">Windows 10 / 11 64-bit</span>
                </div>
              </div>
              <div className="hub-files-list">
                <a href="/downloads/ReelStream.msixbundle" download="ReelStream.msixbundle" className="hub-file-btn primary">
                  <span className="file-name">⚡ ReelStream.msixbundle</span>
                  <span className="file-meta">1.5 MB · Native MSIX</span>
                </a>
                <a href="/downloads/ReelStream-Windows.zip" download="ReelStream-Windows.zip" className="hub-file-btn">
                  <span className="file-name">📦 ReelStream-Windows.zip</span>
                  <span className="file-meta">4.5 MB · Full Installer Pack</span>
                </a>
                <a href="/downloads/ReelStream.classic.appxbundle" download="ReelStream.classic.appxbundle" className="hub-file-btn">
                  <span className="file-name">⚙️ ReelStream.classic.appxbundle</span>
                  <span className="file-meta">1.6 MB · Classic AppX</span>
                </a>
              </div>
            </div>

            {/* iOS Card */}
            <div className="hub-package-card">
              <div className="hub-card-header">
                <div className="hub-icon ios">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.57.65-1.06 1.7-0.93 2.73.99.08 2.02-.48 2.65-1.23z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="hub-title">Apple iOS & Xcode</h3>
                  <span className="hub-sub">iPhone, iPad & Mac</span>
                </div>
              </div>
              <div className="hub-files-list">
                <a href="/downloads/ReelStream-iOS.zip" download="ReelStream-iOS.zip" className="hub-file-btn primary">
                  <span className="file-name">📦 ReelStream-iOS.zip</span>
                  <span className="file-meta">1.0 MB · Xcode Project / Swift</span>
                </a>
                <Link href="/home" className="hub-file-btn">
                  <span className="file-name">🌐 Progressive Web App (Safari)</span>
                  <span className="file-meta">Instant · Add to Home Screen</span>
                </Link>
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
