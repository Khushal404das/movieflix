"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile Verification Widget
 * Loads official Cloudflare Turnstile script and renders real challenge.
 */
export default function TurnstileWidget({ onVerify, onError, onExpire, resetTrigger = 0 }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loadError, setLoadError] = useState("");

  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    let isMounted = true;

    if (!siteKey) {
      setLoadError("NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY is missing in environment.");
      return;
    }

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current || !isMounted) return;

      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (_) {}
        widgetIdRef.current = null;
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "dark",
          size: "normal",
          callback: (token) => {
            if (isMounted && onVerify) onVerify(token);
          },
          "error-callback": (err) => {
            console.warn("Turnstile challenge error:", err);
            if (isMounted) {
              setLoadError("Turnstile verification service error.");
              if (onError) onError(err);
            }
          },
          "expired-callback": () => {
            if (isMounted && onExpire) onExpire();
          }
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.error("Failed to render Turnstile:", err);
        if (isMounted) setLoadError("Failed to initialize Turnstile widget.");
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.querySelector('script[src*="turnstile/v0/api.js"]');
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) renderWidget();
        };
        script.onerror = () => {
          if (isMounted) setLoadError("Could not load Cloudflare Turnstile script.");
        };
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval);
            if (isMounted) renderWidget();
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (_) {}
      }
    };
  }, [siteKey, resetTrigger]);

  return (
    <div className="turnstile-wrapper">
      <div className="turnstile-header">
        <span className="cf-shield-icon">🛡️</span>
        <span className="cf-title">Cloudflare Human Verification</span>
      </div>

      <div ref={containerRef} className="turnstile-box" />

      {loadError && (
        <div className="turnstile-fallback-notice">
          <span>⚠️ {loadError}</span>
        </div>
      )}
    </div>
  );
}
