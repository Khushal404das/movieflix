"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAdsEnabled, getAdsEnabled, ensureAdScript } from "@/lib/adsPreference";
import { POPUNDER_SRC, SOCIALBAR_SRC } from "@/lib/adsConfig";

// Loads the page-level ad tags (popunder + social bar) only when the visitor
// has ads turned on. With ads off, no ad script is requested at all.
export default function AdsBootstrap() {
  const enabled = useAdsEnabled();
  const pathname = usePathname() || "";

  useEffect(() => {
    // Read storage directly: during hydration `enabled` is briefly the
    // server default (true), which would otherwise load ads for opted-out visitors.
    if (!enabled || !getAdsEnabled()) return;
    if (pathname.startsWith("/verify")) return; // keep human-verification clean

    ensureAdScript("popunder", POPUNDER_SRC);
    // Social bar floats over the page: keep it off the fullscreen player.
    if (pathname !== "/play") ensureAdScript("socialbar", SOCIALBAR_SRC);
  }, [enabled, pathname]);

  return null;
}
