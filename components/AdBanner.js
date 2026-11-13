"use client";

import { useAdsEnabled } from "@/lib/adsPreference";
import { ADSENSE_UNITS } from "@/lib/adsConfig";
import AdSenseAd from "./AdSenseAd";

/**
 * Site ad slot, filled by Google AdSense. Renders nothing when the visitor
 * has turned ads off.
 *
 * variant (a key of ADSENSE_UNITS in lib/adsConfig.js):
 *  - "display"   responsive display unit
 *  - "inArticle" fluid in-article unit
 *  - "inFeed"    fluid in-feed unit
 *  - "multiplex" multiplex grid (related content), good at the bottom of a page
 *  Any other value falls back to the responsive "displayAlt" unit.
 */
export default function AdBanner({ variant = "display", className = "", style = {} }) {
  const adsEnabled = useAdsEnabled();
  if (!adsEnabled) return null;

  const unit = ADSENSE_UNITS[variant] ? variant : "displayAlt";
  return (
    <div
      className={`ad-banner-slot ${className}`}
      style={{
        width: "100%",
        maxWidth: "1140px",
        margin: "20px auto",
        overflow: "hidden",
        background: "transparent",
        ...style,
      }}
    >
      <AdSenseAd unit={unit} />
    </div>
  );
}
