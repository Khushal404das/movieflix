"use client";

import { useAuth } from "@/lib/AuthContext";

// Shown on the landing page to visitors who aren't signed in: what a free
// MovieFlix account gives them, with a sign-in button.
const FEATURES = [
  { title: "Unlimited movies", text: "Browse and play the full movie catalogue." },
  { title: "Unlimited series", text: "TV shows, web series, K-dramas and anime." },
  { title: "One-click play", text: "Titles open straight in the player." },
  { title: "HD streaming", text: "Up to 1080p Full HD, and 4K where the server has it." },
  { title: "Your watchlist", text: "Save titles to My List and pick up later." },
  { title: "Backup servers", text: "If one player fails, the next one starts by itself." },
  { title: "Multi-audio", text: "Hindi, English and other audio tracks where available." },
  { title: "Free account", text: "Sign in with Google or email. No subscription." },
];

export default function MemberFeatures() {
  const { user, loading, openAuthModal } = useAuth();
  if (loading || user) return null;

  return (
    <section className="member-features" aria-labelledby="member-features-title">
      <div className="section-label-tag">FREE ACCOUNT</div>
      <h2 id="member-features-title" className="section-title">
        What you get when you sign in
      </h2>

      <ul className="member-features-grid">
        {FEATURES.map((f) => (
          <li key={f.title} className="member-feature">
            <span className="member-feature-check" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <span className="member-feature-body">
              <strong>{f.title}</strong>
              <span>{f.text}</span>
            </span>
          </li>
        ))}
      </ul>

      <button type="button" className="member-features-cta" onClick={() => openAuthModal("signin")}>
        Sign in free
      </button>
    </section>
  );
}
