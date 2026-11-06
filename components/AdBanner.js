"use client";

import { useEffect, useRef } from "react";

/**
 * Reusable Google AdSense Banner Component
 * Usage:
 *   <AdBanner dataAdSlot="1234567890" />
 *
 * For Auto-Ads, Google handles placements automatically once approved.
 * Use this component when you want explicit manual ad unit placements.
 */
export default function AdBanner({
  dataAdSlot,
  dataAdFormat = "auto",
  responsive = true,
  className = "",
  style = {},
}) {
  const adRef = useRef(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.warn("[AdSense] Ad push error:", err);
    }
  }, []);

  return (
    <div
      ref={adRef}
      className={`ad-container my-4 flex justify-center items-center overflow-hidden min-h-[90px] ${className}`}
      style={style}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", ...style }}
        data-ad-client="ca-pub-2554738343060277"
        data-ad-slot={dataAdSlot || ""}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}

