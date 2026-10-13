"use client";

import Link from "next/link";
import { OTT_PLATFORMS } from "@/lib/tmdb";

export default function LanguageFilterBar({ activeOtt = "all", type = "movie" }) {
  return (
    <div className="netmirror-filter-dock">
      {/* 50+ OTT Networks Aggregator (Netflix, Prime, Disney+, Apple TV, HBO) */}
      <div className="dock-section ott-dock">
        <div className="dock-label-group">
          <span className="dock-icon">📺</span>
          <span className="dock-title">Streaming Networks & OTT Platforms:</span>
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
