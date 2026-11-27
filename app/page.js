import Landing from "./app/page";
import { faqJsonLd } from "@/components/LandingFaq";
import { jsonLdString } from "@/lib/seo";

// The landing page. /app and /download show the same page and point search
// engines here (see their own metadata).
export const metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqJsonLd) }} />
      <Landing />
    </>
  );
}
