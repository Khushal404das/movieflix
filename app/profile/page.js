"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80"
];

export default function ProfilePage() {
  const { user, loading, logOut, updateUserProfile, openAuthModal } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  if (loading) {
    return (
      <div className="profile-loading-screen">
        <div className="stream-spinner" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  // Not signed in view
  if (!user) {
    return (
      <div className="profile-guest-container">
        <div className="guest-card">
          <div className="guest-avatar-ring">
            <span className="guest-icon">👤</span>
          </div>
          <h1>Sign In to View Your Profile</h1>
          <p>
            Create an account or sign in with Google to sync your watchlist, resume watched movies across devices, and manage your streaming settings.
          </p>
          <div className="guest-actions">
            <button
              type="button"
              className="guest-login-btn"
              onClick={() => openAuthModal("signin")}
            >
              Sign In
            </button>
            <button
              type="button"
              className="guest-register-btn"
              onClick={() => openAuthModal("signup")}
            >
              Create Account
            </button>
          </div>
          <Link href="/home" className="guest-back-link">
            &larr; Back to Browse Movies
          </Link>
        </div>
      </div>
    );
  }

  const startEditing = () => {
    setNewDisplayName(user.displayName || "");
    setSelectedAvatar(user.photoURL || PRESET_AVATARS[0]);
    setCustomAvatarUrl("");
    setIsEditing(true);
    setSaveMessage("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const finalAvatar = customAvatarUrl.trim() || selectedAvatar;
    const res = await updateUserProfile({
      displayName: newDisplayName.trim() || user.displayName,
      photoURL: finalAvatar
    });
    setSaving(false);
    if (res.success) {
      setSaveMessage("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSaveMessage(""), 4000);
    }
  };

  return (
    <div className="profile-page-wrapper">
      <div className="profile-container">
        {/* Profile Hero Header Card */}
        <div className="profile-hero-card">
          <div className="profile-avatar-large">
            <img
              src={user.photoURL || PRESET_AVATARS[0]}
              alt={user.displayName || "User avatar"}
              onError={(e) => {
                e.currentTarget.src = PRESET_AVATARS[0];
              }}
            />
            {user.provider === "google.com" && (
              <span className="google-badge-pill" title="Signed in with Google">
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12c0 2.03.45 3.84 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                Google Verified
              </span>
            )}
          </div>

          <div className="profile-hero-info">
            <div className="profile-title-row">
              <h1 className="profile-user-name">{user.displayName || "MovieFlix Member"}</h1>
              <span className="membership-tag">VIP STREAMER</span>
            </div>
            <p className="profile-user-email">{user.email}</p>
            <div className="profile-meta-tags">
              <span className="meta-pill">
                🔒 Protected by Cloudflare
              </span>
              <span className="meta-pill">
                🎬 Cinema Tier: Ultra HD
              </span>
              {user.createdAt && (
                <span className="meta-pill">
                  📅 Joined: {new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>

          <div className="profile-hero-actions">
            {!isEditing && (
              <button
                type="button"
                className="profile-edit-btn"
                onClick={startEditing}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit Profile</span>
              </button>
            )}
            <button
              type="button"
              className="profile-logout-btn"
              onClick={logOut}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className="profile-alert success">
            <span>✓ {saveMessage}</span>
          </div>
        )}

        {/* Edit Profile Drawer */}
        {isEditing && (
          <div className="profile-edit-card">
            <h3>Customize Your Profile</h3>
            <form onSubmit={handleSave} className="profile-edit-form">
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="auth-input"
                  placeholder="Your screen name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Choose Avatar Icon</label>
                <div className="avatar-picker-row">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`avatar-option ${selectedAvatar === av ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedAvatar(av);
                        setCustomAvatarUrl("");
                      }}
                    >
                      <img src={av} alt={`Avatar ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Or Custom Avatar Image URL</label>
                <input
                  type="url"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="auth-input"
                  placeholder="https://example.com/your-photo.jpg"
                />
              </div>

              <div className="edit-buttons-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Quick Navigation Cards */}
        <div className="profile-quick-grid">
          <Link href="/list" className="profile-feature-card">
            <div className="feature-icon">🔖</div>
            <div className="feature-info">
              <h4>My Watchlist</h4>
              <p>View saved movies and series you want to watch next</p>
            </div>
            <span className="feature-arrow">&rarr;</span>
          </Link>

          <Link href="/home" className="profile-feature-card">
            <div className="feature-icon">▶️</div>
            <div className="feature-info">
              <h4>Resume Streaming</h4>
              <p>Jump straight back into your favorite movies and shows</p>
            </div>
            <span className="feature-arrow">&rarr;</span>
          </Link>

          <div className="profile-feature-card info-card">
            <div className="feature-icon">⚡</div>
            <div className="feature-info">
              <h4>Cloudflare Security</h4>
              <p>Turnstile human verification active for secure account access</p>
            </div>
            <span className="security-active-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}
