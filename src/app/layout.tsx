// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import CookieBanner from "./cookies/CookieBanner"; // o "@/components/CookieBanner"

export const metadata: Metadata = {
  title: "CVBoost.ai",
  description: "Ottimizza il tuo CV per gli ATS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
