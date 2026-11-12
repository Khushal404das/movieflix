// "Join Discord" link used in the header, the phone menu and the footer.

export const DISCORD_INVITE_URL = "https://discord.gg/yMpRwYkknz";

export function DiscordIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="currentColor" aria-hidden="true">
      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.06 72.06 0 0 0 45.64 0 105.89 105.89 0 0 0 18.39 8.09C2.62 32.65-1.54 56.6.48 80.21a105.73 105.73 0 0 0 32.23 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.24c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.26 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.22-16.12C129.24 52.84 122.09 29.11 107.7 8.07ZM42.45 65.69C36.18 65.69 31 59.9 31 52.9s5-12.85 11.43-12.85S54 45.8 54 52.9s-5.16 12.79-11.55 12.79Zm42.24 0C78.41 65.69 73.25 59.9 73.25 52.9s5-12.85 11.44-12.85S96.23 45.8 96.23 52.9s-5.15 12.79-11.54 12.79Z" />
    </svg>
  );
}

export default function DiscordLink({ className = "", label = "Join Discord", iconSize = 16, onClick }) {
  return (
    <a
      href={DISCORD_INVITE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`discord-link ${className}`}
      onClick={onClick}
    >
      <DiscordIcon size={iconSize} />
      <span>{label}</span>
    </a>
  );
}
