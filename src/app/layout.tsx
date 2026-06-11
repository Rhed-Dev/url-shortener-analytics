import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Linkpulse — short links, long on insight",
    template: "%s · Linkpulse",
  },
  description:
    "Self-hosted URL shortener with click analytics, geo stats, QR codes, link expiration, and built-in rate limiting.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 font-sans text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
