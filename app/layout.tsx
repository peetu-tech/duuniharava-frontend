import type { Metadata } from "next";
import { Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Duuniharava | CV:t, työpaikat ja hakemukset yhdessä",
  description: "Duuniharava auttaa tekemään paremman CV:n, seuraamaan työpaikkoja ja kirjoittamaan kohdistettuja hakemuksia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi" className={`${spaceGrotesk.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#08090D] text-white">{children}</body>
    </html>
  );
}
