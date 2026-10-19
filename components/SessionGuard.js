"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getSessionState,
  recordUserActivity,
  invalidateSession,
  redirectToVerification
} from "@/lib/SessionManager";

export default function SessionGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Never run guard on verify pages
    if (pathname?.startsWith("/verify")) return;

    // Track user activity to prevent premature inactivity timeout
    const handleActivity = () => {
      recordUserActivity();
    };

    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });
    window.addEventListener("scroll", handleActivity, { passive: true });

    // Expose dev testing helper on window
    window.__expireSessionForTesting = () => {
      console.warn("Simulating session timeout / expiration...");
      invalidateSession();
      redirectToVerification(window.location.pathname + window.location.search);
    };

    // Periodic session check every 25 seconds
    const interval = setInterval(() => {
      const state = getSessionState();

      if (state.isExpired || state.isTimedOut) {
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          redirectToVerification(window.location.pathname + window.location.search);
        }
      }
    }, 25000);

    // Initial check on page load / route change
    const state = getSessionState();
    if (state.isExpired || state.isTimedOut) {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        redirectToVerification(window.location.pathname + window.location.search);
      }
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, [pathname, router]);

  return null;
}
