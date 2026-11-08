"use client";

import { useAdsEnabled, setAdsEnabled } from "@/lib/adsPreference";

export default function AdsToggle({ className = "" }) {
  const enabled = useAdsEnabled();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "Ads on" : "Ads off"}
      title={enabled ? "Ads are on — click to turn off" : "Ads are off — click to turn on"}
      className={`ads-toggle ${enabled ? "is-on" : ""} ${className}`}
      onClick={() => setAdsEnabled(!enabled)}
    >
      <span className="ads-toggle-label">Ads</span>
      <span className="ads-toggle-track" aria-hidden="true">
        <span className="ads-toggle-knob" />
      </span>
    </button>
  );
}
