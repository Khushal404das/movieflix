"use client";

import { useEffect, useRef, useState } from "react";
import { useAdsEnabled, getAdsEnabled } from "@/lib/adsPreference";
import {
  BANNERS,
  bannerScriptSrc,
  NATIVE_SRC,
  NATIVE_CONTAINER_ID,
} from "@/lib/adsConfig";

/**
 * Site ad slot. Renders nothing when the visitor has turned ads off.
 *
 * variant:
 *  - "display"   responsive leaderboard: 728x90 → 468x60 → 320x50 by available width
 *  - "inArticle" 300x250 rectangle
 *  - "inFeed" / "multiplex"  native banner (only one per page; extra ones fall back to 300x250)
 *  - or any size key from BANNERS, e.g. "160x600"
 */
export default function AdBanner(props) {
  const adsEnabled = useAdsEnabled();
  if (!adsEnabled) return null;
  return <AdSlot {...props} />;
}

const LEADERBOARD_STEPS = ["728x90", "468x60", "320x50"];
let nativeMounted = false;

function pickLeaderboard(width) {
  return LEADERBOARD_STEPS.find((k) => BANNERS[k].width <= width) || "320x50";
}

function AdSlot({ variant = "display", className = "", style = {} }) {
  const wrapperRef = useRef(null);
  const [size, setSize] = useState(null);
  const [useNative, setUseNative] = useState(false);

  // Decide the format on the client (needs width / native availability).
  useEffect(() => {
    if (variant === "inFeed" || variant === "multiplex") {
      if (!nativeMounted) {
        nativeMounted = true;
        setUseNative(true);
        return () => {
          nativeMounted = false;
        };
      }
      setSize("300x250");
      return;
    }
    if (variant === "inArticle") return setSize("300x250");
    if (BANNERS[variant]) return setSize(variant);

    // Responsive leaderboard
    const el = wrapperRef.current;
    // The slot can be stretched by its own banner, so also cap by the screen width.
    const update = () =>
      setSize(pickLeaderboard(Math.min(el?.clientWidth || Infinity, window.innerWidth - 16)));
    update();
    const ro = new ResizeObserver(update);
    if (el) ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [variant]);

  return (
    <div
      ref={wrapperRef}
      className={`ad-banner-slot ${className}`}
      style={{
        width: "100%",
        maxWidth: "1140px",
        margin: "20px auto",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
        background: "transparent",
        ...style,
      }}
    >
      {useNative ? <NativeAd /> : size ? <IframeBanner key={size} size={size} /> : null}
    </div>
  );
}

// Each IFRAME SYNC tag runs inside its own sandboxed frame: the tag relies on a
// global `atOptions`, so several on one page would clash, and the sandbox
// (no allow-same-origin) keeps the ad code away from the site's page and storage.
function IframeBanner({ size }) {
  const { key, width, height } = BANNERS[size];
  const srcDoc =
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}</style></head><body>` +
    `<script>atOptions={'key':'${key}','format':'iframe','height':${height},'width':${width},'params':{}};</script>` +
    `<script src="${bannerScriptSrc(key)}"></script>` +
    `</body></html>`;

  return (
    <iframe
      title="Advertisement"
      srcDoc={srcDoc}
      width={width}
      height={height}
      scrolling="no"
      loading="lazy"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      style={{ border: 0, display: "block", maxWidth: "100%", background: "transparent" }}
    />
  );
}

// NATIVE ASYNC renders into a fixed container id on the page itself.
function NativeAd() {
  useEffect(() => {
    if (!getAdsEnabled()) return;
    const s = document.createElement("script");
    s.async = true;
    s.setAttribute("data-cfasync", "false");
    s.src = NATIVE_SRC;
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
  }, []);

  return <div id={NATIVE_CONTAINER_ID} className="native-ad-container" style={{ width: "100%" }} />;
}
