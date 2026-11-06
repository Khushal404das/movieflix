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
  // In-article banner (ideal below player)
  inArticle: {
    slot: "9391079242",
    format: "fluid",
    layout: "in-article",
    style: { display: "block", textAlign: "center" },
  },
  // Fluid in-feed card
  inFeed: {
    slot: "1511543046",
    format: "fluid",
    layoutKey: "-ef+6k-30-ac+ty",
    style: { display: "block" },
  },
  // Multiplex recommended content grid (bottom of page)
  multiplex: {
    slot: "6572298038",
    format: "autorelaxed",
    style: { display: "block" },
  },
};

/**
 * Reusable Google AdSense Banner Component
 * Cleanly collapses when ads are pending approval or unfilled.
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
}) {
  const pushedRef = useRef(false);
  const wrapperRef = useRef(null);

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

  // Poll for data-ad-status and hide wrapper when unfilled
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ins = wrapperRef.current.querySelector("ins.adsbygoogle");
    if (!ins) return;

    const checkStatus = () => {
      const status = ins.getAttribute("data-ad-status");
      if (status === "unfilled") {
        wrapperRef.current.style.display = "none";
      } else if (status === "filled") {
        wrapperRef.current.style.display = "";
      }
    };

    // Check after short delay (AdSense sets status ~300–1000ms after push)
    const t1 = setTimeout(checkStatus, 500);
    const t2 = setTimeout(checkStatus, 1500);
    const t3 = setTimeout(checkStatus, 3000);

    // Also observe attribute changes
    const observer = new MutationObserver(checkStatus);
    observer.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`ad-banner-slot ${className}`}
      style={{
        width: "100%",
        maxWidth: "1140px",
        margin: "20px auto",
        textAlign: "center",
        overflow: "hidden",
        background: "transparent",
        ...style,
      }}
    >
      <ins
        className="adsbygoogle"
        style={{ width: "100%", background: "transparent", ...config.style }}
        data-ad-client="ca-pub-2554738343060277"
        data-ad-slot={slot}
        {...(format ? { "data-ad-format": format } : {})}
        {...(layout ? { "data-ad-layout": layout } : {})}
        {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
        {...(isResponsive !== undefined ? { "data-full-width-responsive": isResponsive ? "true" : "false" } : {})}
      />
    </div>
  );
}
