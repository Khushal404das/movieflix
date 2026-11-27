// /app shows the landing page (app/app/page.js is a client component, so its
// metadata lives here). Search engines are pointed at the landing page itself.
export const metadata = {
  title: "Get the MovieFlix App – Android, iPhone & Android TV",
  alternates: { canonical: "/" },
};

export default function AppLayout({ children }) {
  return children;
}
