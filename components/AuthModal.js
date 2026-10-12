"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import TurnstileWidget from "./TurnstileWidget";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80"
];

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetUserPassword,
    isFirebaseConfigured
  } = useAuth();

  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [showPassword, setShowPassword] = useState(false);

  // Real Cloudflare Turnstile token
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [turnstileReset, setTurnstileReset] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
      setError("");
      setSuccessMsg("");
      setTurnstileToken(null);
      setTurnstileReset((prev) => prev + 1);
    }
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleTabChange = (newMode) => {
    setMode(newMode);
    setError("");
    setSuccessMsg("");
    setTurnstileToken(null);
    setTurnstileReset((prev) => prev + 1);
  };

  // Real server-side validation of Cloudflare Turnstile token
  const verifyTurnstileOnServer = async (token) => {
    try {
      const res = await fetch("/api/verify-turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Turnstile verification rejected." };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: "Network error contacting verification server." };
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    if (!turnstileToken) {
      setLoading(false);
      setError("Please complete the Cloudflare human verification below before signing in.");
      return;
    }

    // Verify token with Cloudflare backend API
    const cfVerify = await verifyTurnstileOnServer(turnstileToken);
    if (!cfVerify.success) {
      setLoading(false);
      setError(cfVerify.error);
      setTurnstileReset((prev) => prev + 1);
      setTurnstileToken(null);
      return;
    }

    const res = await signInWithGoogle();
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Google sign in failed.");
      setTurnstileReset((prev) => prev + 1);
      setTurnstileToken(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!turnstileToken) {
      setError("Please complete the Cloudflare human verification below.");
      return;
    }

    setLoading(true);

    // Verify token with Cloudflare backend API
    const cfVerify = await verifyTurnstileOnServer(turnstileToken);
    if (!cfVerify.success) {
      setLoading(false);
      setError(cfVerify.error);
      setTurnstileReset((prev) => prev + 1);
      setTurnstileToken(null);
      return;
    }

    if (mode === "signin") {
      const res = await signInWithEmail(email, password);
      setLoading(false);
      if (!res.success) {
        setError(res.error || "Incorrect email or password.");
        setTurnstileReset((prev) => prev + 1);
        setTurnstileToken(null);
      }
    } else if (mode === "signup") {
      if (password.length < 6) {
        setLoading(false);
        setError("Password must be at least 6 characters.");
        return;
      }
      const res = await signUpWithEmail(email, password, displayName, selectedAvatar);
      setLoading(false);
      if (!res.success) {
        setError(res.error || "Registration failed. Please try again.");
        setTurnstileReset((prev) => prev + 1);
        setTurnstileToken(null);
      }
    } else if (mode === "forgot") {
      const res = await resetUserPassword(email);
      setLoading(false);
      if (res.success) {
        setSuccessMsg("Password reset link sent to your email!");
      } else {
        setError(res.error || "Could not send reset email.");
      }
    }
  };

  return (
    <div className="auth-backdrop" onClick={closeAuthModal}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="auth-close-btn"
          onClick={closeAuthModal}
          aria-label="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-brand-logo">
            <span className="logo-n-mark">MOVIE</span>
            <span className="logo-flix-mark">FLIX</span>
          </div>
          <h2 className="auth-title">
            {mode === "signin"
              ? "Sign In"
              : mode === "signup"
              ? "Create Account"
              : "Reset Password"}
          </h2>
          <p className="auth-subtitle">
            {mode === "signin"
              ? "Sign in to access your Watchlist & resume playback across devices"
              : mode === "signup"
              ? "Create a real MovieFlix profile with Google or email"
              : "Enter your registered email to receive a recovery link"}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        {mode !== "forgot" && (
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${mode === "signin" ? "active" : ""}`}
              onClick={() => handleTabChange("signin")}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === "signup" ? "active" : ""}`}
              onClick={() => handleTabChange("signup")}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Google Real Sign-In */}
        {mode !== "forgot" && (
          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading || !turnstileToken}
            title={!turnstileToken ? "Complete Cloudflare verification first" : "Sign in with Google"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12c0 2.03.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        )}

        {mode !== "forgot" && (
          <div className="auth-divider">
            <span>or continue with email</span>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <div className="auth-alert error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="auth-alert success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <>
              <div className="form-group">
                <label htmlFor="auth-name">Display Name</label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  placeholder="e.g. CinemaLover"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="auth-input"
                />
              </div>

              <div className="form-group">
                <label>Choose Profile Avatar</label>
                <div className="avatar-picker-row">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`avatar-option ${selectedAvatar === av ? "selected" : ""}`}
                      onClick={() => setSelectedAvatar(av)}
                    >
                      <img src={av} alt={`Avatar ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
          </div>

          {mode !== "forgot" && (
            <div className="form-group">
              <div className="label-with-action">
                <label htmlFor="auth-password">Password</label>
                {mode === "signin" && (
                  <button
                    type="button"
                    className="forgot-password-link"
                    onClick={() => handleTabChange("forgot")}
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="password-input-wrap">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          )}

          {/* Real Cloudflare Turnstile Human Verification Box */}
          <div className="auth-turnstile-container">
            <TurnstileWidget
              resetTrigger={turnstileReset}
              onVerify={(token) => {
                setTurnstileToken(token);
                setError("");
              }}
              onExpire={() => setTurnstileToken(null)}
              onError={() => {
                setTurnstileToken(null);
                setError("Cloudflare Turnstile verification challenge error.");
              }}
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || !turnstileToken}
          >
            {loading ? (
              <span className="submit-spinner">Verifying...</span>
            ) : mode === "signin" ? (
              "Sign In to MovieFlix"
            ) : mode === "signup" ? (
              "Complete Registration"
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        {mode === "forgot" && (
          <div className="auth-back-row">
            <button
              type="button"
              className="back-to-signin-btn"
              onClick={() => handleTabChange("signin")}
            >
              &larr; Back to Sign In
            </button>
          </div>
        )}

        <div className="auth-footer-terms">
          <span>
            Protected by Cloudflare Turnstile. Real human verification required.
          </span>
        </div>
      </div>
    </div>
  );
}
