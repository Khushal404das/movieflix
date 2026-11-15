"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAdsEnabled, getAdsEnabled, ensureAdScript, pageAdScriptsLoaded } from "@/lib/adsPreference";
import { POPUNDER_SRC, SOCIALBAR_SRC } from "@/lib/adsConfig";

// Loads the page-level ad tags (popunder + social bar) only when the visitor
// has ads turned on. With ads off, no ad script is requested at all.
export default function AdsBootstrap() {
  const enabled = useAdsEnabled();
  const pathname = usePathname() || "";

  useEffect(() => {
    // The full-screen player stays free of our page-level ads: the popunder
    // fires on clicks into the player iframe (play/pause), and the social bar
    // floats over the video. Both keep running after a client-side navigation,
    // so if they were loaded on a previous page, reload to start /play clean.
    if (pathname === "/play") {
      if (pageAdScriptsLoaded()) window.location.reload();
      return;
    }

    // Read storage directly: during hydration `enabled` is briefly the
    // server default (true), which would otherwise load ads for opted-out visitors.
    if (!enabled || !getAdsEnabled()) return;
    if (pathname.startsWith("/verify")) return; // keep human-verification clean

    ensureAdScript("popunder", POPUNDER_SRC);
    ensureAdScript("socialbar", SOCIALBAR_SRC);
  }, [enabled, pathname]);

  return null;
}
