"use client";

import { useEffect, useRef } from "react";

const AD_CONFIGS = {
  // Standard responsive horizontal display banner
  display: {
    slot: "9310142017",
    format: "auto",
    responsive: true,
    style: { display: "block" },
  },
  // In-article banner (ideal below player / between text content)
  inArticle: {
    slot: "9391079242",
    format: "fluid",
    layout: "in-article",
    style: { display: "block", textAlign: "center" },
  },
  // Fluid in-feed card (matches media card dimensions)
  inFeed: {
    slot: "1511543046",
    format: "fluid",
    layoutKey: "-ef+6k-30-ac+ty",
    style: { display: "block" },
  },
  // Multiplex recommended content grid (bottom of page / recommendations)
  multiplex: {
    slot: "6572298038",
    format: "autorelaxed",
    style: { display: "block" },
  },
};

/**
 * Reusable Google AdSense Banner Component
 * Formatted cleanly to blend with the dark MovieFlix UI.
 */
export default function AdBanner({
  variant = "display",
  dataAdSlot,
  dataAdFormat,
  dataAdLayout,
  dataAdLayoutKey,
  responsive,
  className = "",
  style = {},
  showLabel = true,
}) {
  const adRef = useRef(null);
  const pushedRef = useRef(false);

  const config = AD_CONFIGS[variant] || AD_CONFIGS.display;
  const slot = dataAdSlot || config.slot;
  const format = dataAdFormat || config.format;
  const layout = dataAdLayout || config.layout;
  const layoutKey = dataAdLayoutKey || config.layoutKey;
  const isResponsive = responsive !== undefined ? responsive : config.responsive;

  useEffect(() => {
    if (pushedRef.current) return;
    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      }
    } catch (err) {
      console.warn("[AdSense] Push error:", err);
    }
  }, []);

  return (
    <div
      className={`ad-banner-wrapper mx-auto w-full max-w-6xl px-3 my-4 md:my-6 ${className}`}
      style={style}
    >
      <div className="relative rounded-xl border border-white/[0.06] bg-black/40 p-2 sm:p-3 backdrop-blur-sm transition-all overflow-hidden flex flex-col items-center">
        {showLabel && (
          <div className="w-full flex items-center justify-between pb-1.5 px-1 border-b border-white/[0.04] mb-2 select-none">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Sponsored
            </span>
            <span className="text-[9px] text-neutral-500 uppercase tracking-wider">
              Ad
            </span>
          </div>
        )}
        <div ref={adRef} className="w-full flex justify-center items-center overflow-hidden min-h-[90px]">
          <ins
            className="adsbygoogle"
            style={{ width: "100%", ...config.style }}
            data-ad-client="ca-pub-2554738343060277"
            data-ad-slot={slot}
            {...(format ? { "data-ad-format": format } : {})}
            {...(layout ? { "data-ad-layout": layout } : {})}
            {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
            {...(isResponsive !== undefined ? { "data-full-width-responsive": isResponsive ? "true" : "false" } : {})}
          />
        </div>
      </div>
    </div>
  );
}
