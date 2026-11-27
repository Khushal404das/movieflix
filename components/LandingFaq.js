// Frequently asked questions on the landing page, plus the same questions as
// schema.org FAQPage data, so search engines and AI answer engines can quote
// them directly.

const FAQS = [
  {
    q: "Is MovieFlix free to use?",
    a: "Yes. Browsing and watching on MovieFlix is free, with no subscription and no payment details.",
  },
  {
    q: "Do I need an account to watch?",
    a: "No account is needed to browse or press Play. A free account (Google or email) adds My List and keeps your Continue Watching progress.",
  },
  {
    q: "Which devices does MovieFlix work on?",
    a: "Any modern browser on a computer, phone or tablet: Chrome, Edge, Firefox, Safari or Brave. There is also an Android app for phones, tablets and Android TV, and iPhone users can add MovieFlix to the Home Screen from Safari.",
  },
  {
    q: "How do I install the Android app?",
    a: "Open movieflix.stream/app on your Android device, download MovieFlix.apk and tap Install. If Android asks, allow installs from your browser in Settings.",
  },
  {
    q: "What should I do if a video doesn't play?",
    a: "The player switches to a backup server by itself if the first one doesn't start. You can also pick a different server from the menu at the top of the player, or press the reload button.",
  },
  {
    q: "Can I watch in Hindi or other languages?",
    a: "Many titles have several audio tracks, including Hindi and English. Choose the language from the player's audio or settings menu while the title plays.",
  },
  {
    q: "How can I request a movie or report a problem?",
    a: "Join the MovieFlix Telegram channel or Discord server, linked in the site menu and footer, and post your request or report there.",
  },
];

export const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function LandingFaq() {
  return (
    <section className="landing-faq" aria-labelledby="landing-faq-title">
      <div className="section-label-tag">FAQ</div>
      <h2 id="landing-faq-title" className="section-title">
        Frequently asked questions
      </h2>
      <div className="landing-faq-list">
        {FAQS.map(({ q, a }) => (
          <details key={q} className="landing-faq-item">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
