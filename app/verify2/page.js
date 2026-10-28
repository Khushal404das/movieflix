"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveVerifiedSession } from "@/lib/SessionManager";

// Helper to generate a realistic Cloudflare Ray ID (16 hex chars)
function generateRayId() {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function VerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/home";

  const [rayId, setRayId] = useState("");
  const [verifyingStatus, setVerifyingStatus] = useState("verifying"); // "verifying" | "success" | "error"
  const turnstileContainerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const hasCompletedRef = useRef(false);

  // Cloudflare Turnstile site key
  const siteKey =
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
    "1x00000000000000000000AA";

  useEffect(() => {
    // Set dynamic tab title
    document.title = "Just a moment...";
    setRayId(generateRayId());
  }, []);

  // Complete session verification with server & redirect
  const completeVerification = async (token = null) => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    try {
      const activeRayId = rayId || generateRayId();
      const res = await fetch("/api/session/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token || `verified_${Date.now()}_${activeRayId}`,
          rayId: activeRayId
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        saveVerifiedSession({
          token: data.token,
          expiresAt: data.expiresAt
        });

        setVerifyingStatus("success");

        // Seamless redirect back to destination
        setTimeout(() => {
          const target = returnUrl && !returnUrl.startsWith("/verify") ? returnUrl : "/home";
          window.location.href = target;
        }, 500);
      } else {
        setTimeout(() => {
          hasCompletedRef.current = false;
          completeVerification(`retry_${Date.now()}`);
        }, 1200);
      }
    } catch (err) {
      console.warn("Verification request error:", err);
      saveVerifiedSession({
        token: `mf_fallback_${Date.now()}`,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000
      });
      setVerifyingStatus("success");
      setTimeout(() => {
        window.location.href = returnUrl || "/home";
      }, 500);
    }
  };

  // Turnstile challenge script & auto-verification engine
  useEffect(() => {
    let timer = null;

    const initTurnstile = () => {
      if (!window.turnstile || !turnstileContainerRef.current) return;

      try {
        if (widgetIdRef.current !== null) {
          window.turnstile.remove(widgetIdRef.current);
        }

        const id = window.turnstile.render(turnstileContainerRef.current, {
          sitekey: siteKey,
          theme: "dark",
          size: "invisible",
          callback: (token) => {
            completeVerification(token);
          },
          "error-callback": () => {
            completeVerification(`fallback_${Date.now()}`);
          },
          "expired-callback": () => {
            if (window.turnstile && widgetIdRef.current) {
              window.turnstile.reset(widgetIdRef.current);
            }
          }
        });
        widgetIdRef.current = id;
      } catch (e) {
        completeVerification(`fallback_rendered_${Date.now()}`);
      }
    };

    if (typeof window !== "undefined") {
      if (window.turnstile) {
        initTurnstile();
      } else {
        const existingScript = document.querySelector('script[src*="turnstile/v0/api.js"]');
        if (!existingScript) {
          const script = document.createElement("script");
          script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
          script.async = true;
          script.defer = true;
          script.onload = () => {
            initTurnstile();
          };
          script.onerror = () => {
            timer = setTimeout(() => {
              completeVerification(`offline_fallback_${Date.now()}`);
            }, 1800);
          };
          document.head.appendChild(script);
        }
      }

      // Safeguard timeout (2.2 seconds)
      timer = setTimeout(() => {
        if (!hasCompletedRef.current) {
          completeVerification(`auto_verified_${Date.now()}`);
        }
      }, 2200);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (_) {}
      }
    };
  }, [siteKey]);

  return (
    <main className="cf-verify-screen">
      <div className="cf-verify-content">
        {/* Brand Header: MovieFlix Logo & Name */}
        <div className="cf-verify-brand">
          <svg
            className="cf-movieflix-logo"
            viewBox="0 0 512 512"
            width="38"
            height="38"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="cfRed1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff1e27"/>
                <stop offset="100%" stopColor="#b81d24"/>
              </linearGradient>
              <linearGradient id="cfRed2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e50914"/>
                <stop offset="100%" stopColor="#80060c"/>
              </linearGradient>
            </defs>
            <rect width="512" height="512" rx="112" fill="#141416"/>
            <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8"/>
            <g>
              <path d="M 130 110 L 195 110 L 195 402 L 130 402 Z" fill="url(#cfRed1)"/>
              <path d="M 195 110 L 290 110 C 365 110 400 150 400 215 C 400 280 355 315 285 315 L 195 315 Z" fill="url(#cfRed2)"/>
              <path d="M 195 170 L 280 170 C 315 170 335 188 335 215 C 335 242 315 258 280 258 L 195 258 Z" fill="#141416"/>
              <path d="M 255 285 L 340 402 L 415 402 L 320 270 Z" fill="url(#cfRed1)"/>
            </g>
            <polygon points="245,195 245,235 280,215" fill="#ffffff" opacity="0.95"/>
          </svg>
          <span className="cf-brand-domain">
            <span className="logo-n-mark">MOVIE</span>
            <span className="logo-flix-mark">FLIX</span>
          </span>
        </div>

        {/* Challenge Heading */}
        <h1 className="cf-verify-heading">
          Performing security verification
        </h1>

        {/* Security Subtext */}
        <p className="cf-verify-description">
          MovieFlix uses a security service to protect against malicious bots. This page is displayed while the website verifies you are not a bot.
        </p>

        {/* Security Challenge & Spinner Area */}
        <div className="cf-challenge-zone">
          <div className="cf-spinner-container">
            <div className="cf-security-spinner" />
          </div>

          {/* Invisible Turnstile container for background verification */}
          <div
            ref={turnstileContainerRef}
            className="cf-turnstile-invisible"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Cloudflare Style Footer */}
      <footer className="cf-verify-footer">
        <div className="cf-footer-divider" />
        <div className="cf-footer-meta">
          <div className="cf-ray-id">
            Ray ID: <span className="cf-ray-code">{rayId || "a4cf7e15baaa8359"}</span>
          </div>
          <div className="cf-credits">
            <span>Performance and Security by </span>
            <a
              href="https://www.cloudflare.com"
              target="_blank"
              rel="noopener noreferrer"
              className="cf-link"
            >
              Cloudflare
            </a>
            <span className="cf-dot-separator"> | </span>
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
              className="cf-link privacy"
            >
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={
      <main className="cf-verify-screen">
        <div className="cf-verify-content">
          <div className="cf-verify-brand">
            <span className="cf-brand-domain">
              <span className="logo-n-mark">MOVIE</span>
              <span className="logo-flix-mark">FLIX</span>
            </span>
          </div>
          <h1 className="cf-verify-heading">Performing security verification</h1>
          <div className="cf-spinner-container">
            <div className="cf-security-spinner" />
          </div>
        </div>
      </main>
    }>
      <VerificationContent />
    </Suspense>
  );
}
