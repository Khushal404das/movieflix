"use client";

import { useSyncExternalStore } from "react";
import { ADS_PREF_KEY, ADS_OFF_CLASS } from "./adsConfig";

// Per-visitor "Ads on/off" preference. Stored in localStorage;
// ads are ON unless the visitor turns them off.

const CHANGE_EVENT = "movieflix:ads-change";
const AD_SCRIPT_ATTR = "data-mf-ad";

export function getAdsEnabled() {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ADS_PREF_KEY) !== "0";
  } catch {
    return true;
  }
}

// Injects a page-level ad script once (popunder, social bar).
export function ensureAdScript(id, src) {
  if (typeof document === "undefined") return;
  if (document.querySelector(`script[${AD_SCRIPT_ATTR}="${id}"]`)) return;
  const s = document.createElement("script");
  s.src = src;
  s.setAttribute("data-cfasync", "false");
  s.setAttribute(AD_SCRIPT_ATTR, id);
  document.body.appendChild(s);
}

export function pageAdScriptsLoaded() {
  return !!document.querySelector(`script[${AD_SCRIPT_ATTR}]`);
}

export function setAdsEnabled(enabled) {
  try {
    localStorage.setItem(ADS_PREF_KEY, enabled ? "1" : "0");
  } catch {
    // Storage blocked (private mode etc.) — still apply for this page view.
  }
  // Popunder / social bar can't be unloaded once running: reload to drop them.
  if (!enabled && pageAdScriptsLoaded()) {
    window.location.reload();
    return;
  }
  document.documentElement.classList.toggle(ADS_OFF_CLASS, !enabled);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: enabled }));
}

function subscribe(callback) {
  const onStorage = (e) => {
    if (e.key !== ADS_PREF_KEY) return;
    if (!getAdsEnabled() && pageAdScriptsLoaded()) {
      window.location.reload();
      return;
    }
    document.documentElement.classList.toggle(ADS_OFF_CLASS, !getAdsEnabled());
    callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage); // keep other tabs in sync
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAdsEnabled() {
  return useSyncExternalStore(subscribe, getAdsEnabled, () => true);
}
