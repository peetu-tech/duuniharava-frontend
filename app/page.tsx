"use client";

import Link from "next/link";
import { useState } from "react";

type Lang = "fi" | "en";

const t = {
  fi: {
    title: "Työnhaku ilman säätöä.",
    desc: "Luo CV, räätälöi hakemukset ja seuraa työpaikkoja yhdessä näkymässä.",
    cta1: "Aloita ilmaiseksi",
    cta2: "Avaa studio",
    featuresTitle: "Kaikki mitä tarvitset työnhakuun",
    features: [
      "CV-rakentaja valmiilla osioilla",
      "Hakemusten kirjoitus roolikohtaisesti",
      "Työpaikkaseuranta yhdessä näkymässä",
    ],
  },
  en: {
    title: "Job search, simplified.",
    desc: "Build your CV, tailor applications, and track opportunities from one workspace.",
    cta1: "Start free",
    cta2: "Open studio",
    featuresTitle: "Everything you need for job hunting",
    features: [
      "CV builder with ready sections",
      "Role-specific application writing",
      "Job tracking in one view",
    ],
  },
} as const;

export default function Home() {
  const [lang, setLang] = useState<Lang>("fi");
  const tx = t[lang];

  return (
    <main className="min-h-screen bg-[#07090f] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-black">
            <span className="text-emerald-400">DUUNI</span>
            <span className="text-orange-500">HARAVA</span>
          </Link>
          <div className="flex gap-2">
            <button onClick={() => setLang("fi")} className={`rounded px-2 py-1 text-xs ${lang === "fi" ? "bg-white/20" : "bg-white/10"}`}>FI</button>
            <button onClick={() => setLang("en")} className={`rounded px-2 py-1 text-xs ${lang === "en" ? "bg-white/20" : "bg-white/10"}`}>EN</button>
            <Link href="/login" className="rounded border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-300">Kirjaudu</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-black leading-tight md:text-6xl">{tx.title}</h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-300">{tx.desc}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-xl bg-gradient-to-r from-emerald-400 to-orange-500 px-5 py-3 text-sm font-black text-black">{tx.cta1}</Link>
            <Link href="/studio" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold">{tx.cta2}</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-black">{tx.featuresTitle}</h2>
          <ul className="mt-4 space-y-2 text-zinc-300">
            {tx.features.map((f) => <li key={f}>• {f}</li>)}
          </ul>
        </div>
      </section>
    </main>
  );
}
