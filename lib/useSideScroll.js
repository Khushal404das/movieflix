"use client";

import { useEffect } from "react";

// Lets a horizontal row be scrolled sideways with a touchpad (two-finger
// left/right swipe) or with Shift + mouse wheel. Up/down scrolling still
// scrolls the page as usual. `dep` re-attaches the listener when the row
// element appears later (e.g. after data loads).
export default function useSideScroll(ref, dep) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (e) => {
      if (e.ctrlKey) return; // pinch-zoom
      const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const dx = sideways ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;

      // Sideways swipes over a row never trigger the browser's back/forward swipe.
      e.preventDefault();

      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? el.clientWidth : 1;
      el.scrollBy({ left: dx * unit, behavior: "instant" });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ref, dep]);
}
