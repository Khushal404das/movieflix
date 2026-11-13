"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ADSENSE_CLIENT, ADSENSE_UNITS } from "@/lib/adsConfig";

/**
 * One Google AdSense ad unit. The page-wide adsbygoogle.js is loaded from
 * app/layout.js; this renders the <ins> for a unit and asks AdSense to fill it.
 *
 *   <AdSenseAd unit="display" />          responsive display unit
 *   <AdSenseAd unit="inArticle" />        fluid in-article unit
 *   <AdSenseAd unit="inFeed" />           fluid in-feed unit
 *   <AdSenseAd unit="multiplex" />        multiplex (related content grid)
 *
 * `unit` is a key of ADSENSE_UNITS (lib/adsConfig.js). Visitors who turned ads
 * off never reach this: <AdBanner> renders nothing for them.
 */
export default function AdSenseAd({ unit = "display", className = "", style = {} }) {
  // Re-create the <ins> on client-side navigation: AdSense fills an element once.
  const pathname = usePathname();
  return <AdUnit key={`${pathname}:${unit}`} unit={unit} className={className} style={style} />;
}

function AdUnit({ unit, className, style }) {
  const insRef = useRef(null);
  const pushedRef = useRef(false);
  const cfg = ADSENSE_UNITS[unit] || ADSENSE_UNITS.display;

  useEffect(() => {
    const ins = insRef.current;
    if (!ins) return;

    const push = () => {
      // Guard against a second push for the same element (React StrictMode
      // re-runs effects in development): AdSense logs an error for it.
      if (pushedRef.current || ins.getAttribute("data-adsbygoogle-status")) return;
      pushedRef.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.warn("AdSense push failed:", err);
      }
    };

    // A responsive unit needs a measurable width ("No slot size for
    // availableWidth=0" otherwise): wait until the slot has laid out.
    if (ins.offsetWidth > 0) {
      push();
      return;
    }
    const ro = new ResizeObserver(() => {
      if (ins.offsetWidth > 0) {
        ro.disconnect();
        push();
      }
    });
    ro.observe(ins);
    return () => ro.disconnect();
  }, []);

  const isInArticle = cfg.layout === "in-article";

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle ${className}`}
      style={{
        display: "block",
        width: "100%",
        ...(isInArticle ? { textAlign: "center" } : null),
        ...style,
      }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={cfg.slot}
      data-ad-format={cfg.format}
      data-ad-layout={cfg.layout}
      data-ad-layout-key={cfg.layoutKey}
      data-full-width-responsive={cfg.format === "auto" ? "true" : undefined}
    />
  );
}
