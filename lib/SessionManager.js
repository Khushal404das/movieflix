"use client";

// Session verification configuration
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours duration (like NetMirror)
export const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour inactivity timeout
export const COOKIE_NAME = "mf_session_verified";
export const STORAGE_KEY = "mf_session_data";

/**
 * Read cookie helper
 */
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Set cookie helper
 */
function setCookie(name, value, maxAgeSeconds) {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

/**
 * Remove cookie helper
 */
function removeCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Get current session state
 */
export function getSessionState() {
  if (typeof window === "undefined") {
    return {
      isValid: false,
      isExpired: false,
      isTimedOut: false,
      isUnverified: true,
      remainingMs: 0
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const cookieVal = getCookie(COOKIE_NAME);

    if (!raw && !cookieVal) {
      return {
        isValid: false,
        isExpired: false,
        isTimedOut: false,
        isUnverified: true,
        remainingMs: 0
      };
    }

    const data = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const expiresAt = Number(data.expiresAt) || 0;
    const lastActive = Number(data.lastActive) || now;

    // Check expiration
    const isExpired = expiresAt > 0 && now >= expiresAt;
    // Check inactivity timeout
    const isTimedOut = lastActive > 0 && now - lastActive >= INACTIVITY_TIMEOUT_MS;

    const remainingMs = Math.max(0, expiresAt - now);
    const isValid = Boolean(data.token) && !isExpired && !isTimedOut;

    return {
      isValid,
      isExpired,
      isTimedOut,
      isUnverified: !data.token,
      expiresAt,
      lastActive,
      remainingMs,
      token: data.token || null
    };
  } catch (e) {
    return {
      isValid: false,
      isExpired: true,
      isTimedOut: false,
      isUnverified: false,
      remainingMs: 0
    };
  }
}

/**
 * Check if the active session is valid
 */
export function isSessionValid() {
  return getSessionState().isValid;
}

/**
 * Update user activity timestamp (throttled)
 */
let lastActivityUpdate = 0;
export function recordUserActivity() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastActivityUpdate < 10000) return; // throttle to once every 10s
  lastActivityUpdate = now;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    data.lastActive = now;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
}

/**
 * Store verified session
 */
export function saveVerifiedSession({ token, expiresAt }) {
  if (typeof window === "undefined") return;

  const now = Date.now();
  const calculatedExpiry = expiresAt || now + SESSION_TTL_MS;
  const maxAge = Math.max(60, Math.floor((calculatedExpiry - now) / 1000));

  const sessionObj = {
    token: token || `mf_ses_${Math.random().toString(36).slice(2)}`,
    verifiedAt: now,
    expiresAt: calculatedExpiry,
    lastActive: now
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionObj));
  } catch (_) {}

  setCookie(COOKIE_NAME, sessionObj.token, maxAge);
}

/**
 * Invalidate session (force expire or test expiry)
 */
export function invalidateSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
  removeCookie(COOKIE_NAME);
}

/**
 * Redirect smoothly to verification page
 */
export function redirectToVerification(currentPath) {
  if (typeof window === "undefined") return;

  const returnUrl = currentPath || window.location.pathname + window.location.search;
  // Prevent redirect loops if already on verify page
  if (returnUrl.startsWith("/verify")) return;

  const target = `/verify2?returnUrl=${encodeURIComponent(returnUrl)}`;
  window.location.href = target;
}
