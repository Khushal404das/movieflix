"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SUPPORTED_LANGUAGES, OTT_PLATFORMS } from "@/lib/tmdb";

export default function LanguageFilterBar({ activeLang = "all", activeOtt = "all", type = "movie" }) {
  return (
    <div className="netmirror-filter-dock">
      {/* Language / Dubbed Hub */}
      <div className="dock-section">
        <div className="dock-label-group">
          <span className="dock-icon">🎧</span>
          <span className="dock-title">Audio & Dubbed Languages:</span>
        </div>
        <div className="dock-pills-row">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = activeLang === lang.code;
            const targetUrl = lang.code === "all" 
              ? `/browse/${type}` 
              : `/browse/${type}?lang=${lang.code}`;

            return (
              <Link
                key={lang.code}
                href={targetUrl}
                className={`lang-pill ${isSelected ? "active" : ""}`}
                title={lang.desc || lang.label}
              >
                <span className="pill-flag">{lang.flag}</span>
                <span className="pill-text">{lang.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 50+ OTT Networks Aggregator (NetMirror Style) */}
      <div className="dock-section ott-dock">
        <div className="dock-label-group">
          <span className="dock-icon">📺</span>
          <span className="dock-title">OTT Platforms:</span>
        </div>
        <div className="dock-pills-row">
          {OTT_PLATFORMS.map((ott) => {
            const isSelected = activeOtt === ott.id;
            const targetUrl = ott.id === "all"
              ? `/browse/${type}`
              : `/browse/${type}?ott=${ott.id}`;

            return (
              <Link
                key={ott.id}
                href={targetUrl}
                className={`ott-pill ${isSelected ? "active" : ""}`}
              >
                <span className="ott-icon">{ott.icon}</span>
                <span className="ott-name">{ott.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
