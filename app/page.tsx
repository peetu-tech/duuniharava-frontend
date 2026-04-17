"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const t = {
  fi: {
    badge: "Duuniharava",
    heroTitle: "SÃ¤Ã¤stÃ¤ aikaa tyÃ¶nhaussa ja rakenna vahvempi vaikutelma.",
    heroDesc: "Duuniharava auttaa tekemÃ¤Ã¤n paremman CV:n, seuraamaan tyÃ¶paikkoja ja kirjoittamaan kohdistettuja hakemuksia yhdestÃ¤ selkeÃ¤stÃ¤ tyÃ¶tilasta.",
    heroCta: "Aloita nyt", heroSub: "Katso miten toimii",
    tag1: "CV-generaattori", tag2: "TyÃ¶paikkaseuranta", tag3: "Hakemukset", tag4: "PDF + DOCX",
    dashTitle: "TyÃ¶nhaun tyÃ¶tila", dashSub: "Kaikki yhdessÃ¤ nÃ¤kymÃ¤ssÃ¤",
    stat1: "Hakemukset", stat2: "Haastattelut",
    bar1: "CV-laatu", bar2: "Osuvuus", bar3: "Aktiivisuus",
    navHome: "Etusivu", navServices: "Palvelut", navWhy: "Miksi me",
    navTestimonials: "Kokemuksia", navPricing: "Hinnasto", navFaq: "FAQ", navLogin: "Kirjaudu",
    s1Badge: "Palvelut", s1Title: "Kenelle ja mitÃ¤ tarjoamme",
    s1Desc: "Palvelu on rakennettu niin, ettÃ¤ myÃ¶s ensimmÃ¤istÃ¤ kertaa hakeva ymmÃ¤rtÃ¤Ã¤ mitÃ¤ tehdÃ¤ seuraavaksi.",
    svc1Title: "CV-analyysi ja rakentaminen", svc1Desc: "Luo uusi CV tai paranna nykyistÃ¤. Tee sisÃ¤llÃ¶stÃ¤ vahvempi ja pidÃ¤ ulkoasu siistinÃ¤ ilman turhaa sÃ¤Ã¤tÃ¶Ã¤.",
    svc2Title: "TyÃ¶paikkojen kohdistus", svc2Desc: "Seuraa kiinnostavia tyÃ¶paikkoja, deadlineja ja prioriteetteja yhdestÃ¤ nÃ¤kymÃ¤stÃ¤.",
    svc3Title: "Hakemukset valmiiksi nopeammin", svc3Desc: "Tee tyÃ¶paikkaan sopiva hakemus ja tarvittaessa myÃ¶s erillinen CV-versio samasta tyÃ¶tilasta.",
    s2Badge: "Miksi me", s2Title: "EnemmÃ¤n kuin vain yksi tyÃ¶kalu",
    s2Desc: "Duuniharava kokoaa tyÃ¶nhaun tÃ¤rkeimmÃ¤t osat yhteen â€” ei pelkkÃ¤ CV-editori, vaan kokonainen tyÃ¶tila.",
    why1Title: "Suomen tyÃ¶nhakuun sopiva", why1Desc: "Rakennettu nimenomaan siihen, miltÃ¤ tyÃ¶nhaku Suomessa tuntuu ja mitÃ¤ siinÃ¤ yleensÃ¤ tarvitaan.",
    why2Title: "SelkeÃ¤ prosessi", why2Desc: "KÃ¤yttÃ¤jÃ¤ ymmÃ¤rtÃ¤Ã¤ vaihe vaiheelta mitÃ¤ tehdÃ¤ seuraavaksi, vaikka ei olisi kÃ¤yttÃ¤nyt vastaavaa palvelua aiemmin.",
    why3Title: "Premium-ilme", why3Desc: "Luottamusta herÃ¤ttÃ¤vÃ¤, moderni ja myyvÃ¤ kÃ¤yttÃ¶liittymÃ¤ tekee tuotteesta aidosti valmiin tuntuisen.",
    s3Badge: "Kokemuksia", s3Title: "MitÃ¤ kÃ¤yttÃ¤jÃ¤t sanovat",
    t1: '"Sain viisi haastattelukutsua viikossa CV-optimoinnin jÃ¤lkeen. Uskomaton tyÃ¶kalu!"', t1Author: "â€” Mikko S., OhjelmistokehittÃ¤jÃ¤",
    t2: '"Automaattinen haku sÃ¤Ã¤sti minulta kymmeniÃ¤ tunteja aikaa. Suosittelen kaikille!"', t2Author: "â€” Elena V., Markkinointi",
    t3: '"LinkedIn-profiilini hionta toi heti rekrytoijia viestittelemÃ¤Ã¤n minulle suoraan."', t3Author: "â€” Joonas K., MyyntipÃ¤Ã¤llikkÃ¶",
    s4Badge: "Hinnasto", s4Title: "Hinnasto", s4Desc: "Valitse sinulle sopiva paketti ja aloita tyÃ¶nhaku heti.",
    perMonth: "/ kk", popular: "Suosituin", choose: "Valitse",
    p1Name: "Starter", p1f1: "CV-analyysi", p1f2: "Perusmuokkaukset", p1f3: "Kevyt aloitus tyÃ¶nhakuun",
    p2Name: "Pro", p2f1: "Rajattomammat tyÃ¶nhakutyÃ¶kalut", p2f2: "Hakemusten teko nopeammin", p2f3: "TyÃ¶paikkaseuranta samassa nÃ¤kymÃ¤ssÃ¤",
    p3Name: "Ura-tuki", p3f1: "Kaikki Pro-ominaisuudet", p3f2: "Syvempi sparraus", p3f3: "Laajempi henkilÃ¶kohtainen tuki",
    s5Badge: "FAQ", s5Title: "Usein kysyttyÃ¤",
    faq1q: "Saanko tÃ¤llÃ¤ paremman CV:n?", faq1a: "KyllÃ¤. Tavoitteena on tehdÃ¤ CV:n kirjoittamisesta, muokkaamisesta ja viimeistelystÃ¤ huomattavasti helpompaa.",
    faq2q: "Voinko seurata tyÃ¶paikkoja samassa paikassa?", faq2a: "KyllÃ¤. Duuniharava yhdistÃ¤Ã¤ CV:n, tyÃ¶paikat ja hakemukset yhden nÃ¤kymÃ¤n alle.",
    faq3q: "Voiko tÃ¤tÃ¤ kÃ¤yttÃ¤Ã¤ ilman aiempaa kokemusta?", faq3a: "KyllÃ¤. Koko rakenne on tehty niin, ettÃ¤ kÃ¤yttÃ¤jÃ¤ ymmÃ¤rtÃ¤Ã¤ helposti mitÃ¤ pitÃ¤Ã¤ tehdÃ¤ seuraavaksi.",
    faq4q: "MitÃ¤ tiedostomuotoja saan ladattua?", faq4a: "CV:n voi ladata sekÃ¤ PDF- ettÃ¤ DOCX-muodossa, jolloin se sopii kaikkiin hakujÃ¤rjestelmiin.",
    ctaBadge: "Aloita nyt", ctaTitle: "Valmis tekemÃ¤Ã¤n tyÃ¶nhausta selkeÃ¤mpÃ¤Ã¤?",
    ctaDesc: "Avaa Duuniharava ja rakenna CV, tyÃ¶paikkaseuranta ja hakemukset yhteen paikkaan.",
    ctaBtn1: "Luo tili", ctaBtn2: "Avaa studio",
    footer: "Â© 2026 Duuniharava. Kaikki oikeudet pidÃ¤tetÃ¤Ã¤n.",
  },
  en: {
    badge: "Duuniharava",
    heroTitle: "Save time in your job search and build a stronger impression.",
    heroDesc: "Duuniharava helps you build a better CV, track job listings, and write targeted applications from one clear workspace.",
    heroCta: "Get started", heroSub: "See how it works",
    tag1: "CV generator", tag2: "Job tracking", tag3: "Applications", tag4: "PDF + DOCX",
    dashTitle: "Job search workspace", dashSub: "Everything in one view",
    stat1: "Applications", stat2: "Interviews",
    bar1: "CV quality", bar2: "Relevance", bar3: "Activity",
    navHome: "Home", navServices: "Services", navWhy: "Why us",
    navTestimonials: "Stories", navPricing: "Pricing", navFaq: "FAQ", navLogin: "Login",
    s1Badge: "Services", s1Title: "Who we help and how",
    s1Desc: "Built so that even a first-time job seeker understands exactly what to do next.",
    svc1Title: "CV analysis & building", svc1Desc: "Create a new CV or improve your current one. Make the content stronger and keep the layout clean.",
    svc2Title: "Job targeting", svc2Desc: "Track interesting job listings, deadlines, and priorities from one view.",
    svc3Title: "Applications ready faster", svc3Desc: "Write a job-specific application and a separate CV version if needed â€” all from the same workspace.",
    s2Badge: "Why us", s2Title: "More than just one tool",
    s2Desc: "Duuniharava brings the most important parts of job searching together â€” not just a CV editor, but a complete workspace.",
    why1Title: "Built for Finland", why1Desc: "Designed specifically for what job searching in Finland looks and feels like.",
    why2Title: "Clear process", why2Desc: "Users understand step by step what to do next, even without prior experience with similar tools.",
    why3Title: "Premium feel", why3Desc: "A trustworthy, modern interface that makes the product feel genuinely ready.",
    s3Badge: "Stories", s3Title: "What users say",
    t1: '"I got five interview invitations per week after CV optimization. Incredible tool!"', t1Author: "â€” Mikko S., Software Developer",
    t2: '"The automated search saved me dozens of hours. I recommend it to everyone!"', t2Author: "â€” Elena V., Marketing",
    t3: '"LinkedIn profile polish brought recruiters messaging me directly right away."', t3Author: "â€” Joonas K., Sales Manager",
    s4Badge: "Pricing", s4Title: "Pricing", s4Desc: "Choose the plan that fits you and start your job search today.",
    perMonth: "/ mo", popular: "Most popular", choose: "Choose",
    p1Name: "Starter", p1f1: "CV analysis", p1f2: "Basic edits", p1f3: "Light job search start",
    p2Name: "Pro", p2f1: "Unlimited job search tools", p2f2: "Faster application writing", p2f3: "Job tracking in the same view",
    p3Name: "Career support", p3f1: "All Pro features", p3f2: "Deeper career coaching", p3f3: "Extended personal support",
    s5Badge: "FAQ", s5Title: "Frequently asked",
    faq1q: "Will this get me a better CV?", faq1a: "Yes. The goal is to make writing, editing, and finishing your CV significantly easier.",
    faq2q: "Can I track jobs in the same place?", faq2a: "Yes. Duuniharava brings your CV, jobs, and applications under one view.",
    faq3q: "Can I use this without prior experience?", faq3a: "Yes. The whole structure is built so that users easily understand what to do next.",
    faq4q: "What file formats can I download?", faq4a: "You can download your CV in both PDF and DOCX format, making it compatible with all application systems.",
    ctaBadge: "Get started", ctaTitle: "Ready to make job searching clearer?",
    ctaDesc: "Open Duuniharava and build your CV, job tracker, and applications in one place.",
    ctaBtn1: "Create account", ctaBtn2: "Open studio",
    footer: "Â© 2026 Duuniharava. All rights reserved.",
  },
} as const;

type Lang = "fi" | "en";

function LogoIcon() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-400/30 bg-teal-400/10 flex-shrink-0">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C4A7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 11V20M12 11V20M19 11V20M5 11H19M12 4V11" />
      </svg>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/25 bg-teal-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-300">
      <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
      {children}
    </span>
  );
}

function GlassCard({ children, className = "", hover = false }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] ${hover ? "transition duration-300 hover:-translate-y-1 hover:border-teal-400/30" : ""} ${className}`}>
      {children}
    </div>
  );
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add("opacity-100", "translate-y-0"); el.classList.remove("opacity-0", "translate-y-6"); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-teal-400/25 transition-colors">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="text-sm md:text-base font-semibold text-teal-300">{q}</span>
        <span className={`text-zinc-500 text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>â–¼</span>
      </button>
      {open && <p className="px-5 pb-4 text-sm leading-relaxed text-zinc-400">{a}</p>}
    </div>
  );
}

function PriceCard({ name, price, features, featured, popularLabel, chooseLabel }: {
  name: string; price: string; features: string[]; featured?: boolean; popularLabel: string; chooseLabel: string;
}) {
  return (
    <div className={`relative rounded-2xl border p-7 ${featured ? "border-teal-400/40 bg-gradient-to-b from-teal-400/10 to-white/[0.03] shadow-[0_0_40px_rgba(0,196,167,0.12)]" : "border-white/10 bg-white/[0.03]"}`}>
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-400 px-4 py-0.5 text-[10px] font-bold uppercase tracking-widest text-black">{popularLabel}</div>
      )}
      <h3 className={`text-2xl font-black tracking-tight ${featured ? "text-teal-300" : "text-white"}`}>{name}</h3>
      <p className="mt-3 text-4xl font-black tracking-tight text-white">{price}<span className="ml-1.5 text-sm font-medium text-zinc-500">/ kk</span></p>
      <ul className="mt-6 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
            <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-teal-400 to-orange-400 flex-shrink-0" />{f}
          </li>
        ))}
      </ul>
      <div className="mt-7">
        <Link href="/signup" className={`flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition ${featured ? "bg-gradient-to-r from-teal-400 to-orange-500 text-black hover:opacity-90" : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"}`}>
          {chooseLabel}
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("fi");
  const tx = t[lang];
  const r1 = useReveal(), r2 = useReveal(), r3 = useReveal(), r4 = useReveal(), r5 = useReveal(), r6 = useReveal();

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#08090D] text-white">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10" style={{ background: "radial-gradient(ellipse 60% 50% at 0% 0%, rgba(0,196,167,0.08), transparent), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(255,106,53,0.06), transparent)" }} />

      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#08090D]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-4 px-6 md:px-10 py-3">
          <a href="#hero" className="flex items-center gap-2.5 flex-shrink-0">
            <LogoIcon />
            <span className="text-lg font-black tracking-tight hidden sm:block">
              <span className="text-teal-400">DUUNI</span><span className="text-orange-500">HARAVA</span>
            </span>
          </a>
          <nav className="hidden lg:flex items-center gap-7 text-sm text-zinc-400">
            <a href="#hero" className="hover:text-white transition">{tx.navHome}</a>
            <a href="#palvelut" className="hover:text-white transition">{tx.navServices}</a>
            <a href="#miksi" className="hover:text-white transition">{tx.navWhy}</a>
            <a href="#kokemuksia" className="hover:text-white transition">{tx.navTestimonials}</a>
            <a href="#hinnasto" className="hover:text-white transition">{tx.navPricing}</a>
            <a href="#faq" className="hover:text-white transition">{tx.navFaq}</a>
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border-r border-white/10 pr-3">
              {(["fi", "en"] as Lang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${lang === l ? "border-teal-400/40 bg-teal-400/10 text-teal-300" : "border-white/10 text-zinc-400 hover:text-white"}`}>
                  {l === "fi" ? "ðŸ‡«ðŸ‡® FI" : "ðŸ‡¬ðŸ‡§ EN"}
                </button>
              ))}
            </div>
            <Link href="/signup" className="rounded-xl border border-teal-400/25 bg-teal-400/10 px-3.5 py-2 text-xs font-bold text-teal-300 transition hover:bg-teal-400/20">{tx.navLogin}</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="hero" className="mx-auto max-w-[1760px] px-6 md:px-10 pt-14 pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="w-full max-w-[640px] mx-auto lg:mx-0">
            <Badge>{tx.badge}</Badge>
            <h1 className="mt-5 text-[clamp(36px,5.5vw,72px)] font-black leading-[1.0] tracking-[-0.04em] text-white">{tx.heroTitle}</h1>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-zinc-400 max-w-[560px]">{tx.heroDesc}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-xl bg-gradient-to-r from-teal-400 to-orange-500 px-5 py-3 text-sm font-black text-black transition hover:scale-[1.02]">{tx.heroCta} â†’</Link>
              <a href="#palvelut" className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">{tx.heroSub}</a>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {[tx.tag1, tx.tag2, tx.tag3, tx.tag4].map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">{tag}</span>
              ))}
            </div>
          </div>
          {/* Dashboard mockup */}
          <div className="w-full max-w-[760px] mx-auto lg:mx-0">
            <GlassCard className="p-5 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-3 mb-5">
                <LogoIcon />
                <span className="text-lg font-black tracking-tight"><span className="text-teal-400">DUUNI</span><span className="text-orange-500">HARAVA</span></span>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/30 p-4">
                <p className="text-sm font-semibold text-teal-300">{tx.dashTitle}</p>
                <p className="text-xs text-zinc-500 mt-0.5 mb-4">{tx.dashSub}</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[{ label: tx.stat1, val: "12", color: "text-teal-400" }, { label: tx.stat2, val: "3", color: "text-orange-400" }].map((s) => (
                    <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.04] p-3">
                      <p className="text-[11px] text-zinc-500">{s.label}</p>
                      <p className={`text-2xl font-black leading-tight mt-0.5 ${s.color}`}>{s.val}</p>
                    </div>
                  ))}
                </div>
                {[{ label: tx.bar1, pct: 82 }, { label: tx.bar2, pct: 67 }, { label: tx.bar3, pct: 91 }].map((b) => (
                  <div key={b.label} className="flex items-center gap-2 mb-2 last:mb-0">
                    <span className="w-20 text-[11px] text-zinc-500 flex-shrink-0">{b.label}</span>
                    <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-orange-400" style={{ width: `${b.pct}%` }} />
                    </div>
                    <span className="text-[11px] text-zinc-500 w-7 text-right">{b.pct}%</span>
                  </div>
                ))}
                <div className="grid grid-cols-4 gap-2 mt-4 text-center text-[11px] text-zinc-500">
                  <span>CV</span><span>{tx.tag2}</span><span>{tx.tag3}</span><span>Seuranta</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* PALVELUT */}
      <section id="palvelut" className="mx-auto max-w-[1760px] px-6 md:px-10 py-16 md:py-24">
        <div ref={r1} className="opacity-0 translate-y-6 transition-all duration-700">
          <div className="text-center mb-12"><Badge>{tx.s1Badge}</Badge><h2 className="mt-4 text-3xl md:text-5xl font-black tracking-tight text-white mt-4">{tx.s1Title}</h2><p className="mx-auto mt-4 max-w-2xl text-base md:text-lg leading-relaxed text-zinc-400">{tx.s1Desc}</p></div>
          <div className="grid gap-5 md:grid-cols-3">
            {[{ icon: "ðŸ“„", title: tx.svc1Title, desc: tx.svc1Desc, c: "text-teal-300" }, { icon: "ðŸŽ¯", title: tx.svc2Title, desc: tx.svc2Desc, c: "text-orange-400" }, { icon: "âœï¸", title: tx.svc3Title, desc: tx.svc3Desc, c: "text-teal-300" }].map((s) => (
              <GlassCard key={s.title} className="p-6" hover><div className="mb-3 text-2xl">{s.icon}</div><h3 className={`text-xl font-bold tracking-tight ${s.c}`}>{s.title}</h3><p className="mt-3 text-sm leading-relaxed text-zinc-400">{s.desc}</p></GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* MIKSI ME */}
      <section id="miksi" className="mx-auto max-w-[1760px] px-6 md:px-10 py-16 md:py-24">
        <div ref={r2} className="opacity-0 translate-y-6 transition-all duration-700">
          <GlassCard className="p-8 md:p-14 border-t-2 border-teal-400">
            <div className="text-center mb-12"><Badge>{tx.s2Badge}</Badge><h2 className="mt-4 text-3xl md:text-5xl font-black tracking-tight text-white">{tx.s2Title}</h2><p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">{tx.s2Desc}</p></div>
            <div className="grid gap-10 md:grid-cols-3">
              {[{ icon: "ðŸ‡«ðŸ‡®", t: tx.why1Title, d: tx.why1Desc }, { icon: "âš™ï¸", t: tx.why2Title, d: tx.why2Desc }, { icon: "ðŸ’Ž", t: tx.why3Title, d: tx.why3Desc }].map((w) => (
                <div key={w.t} className="text-center"><div className="mb-3 text-4xl">{w.icon}</div><h3 className="text-xl font-bold text-white">{w.t}</h3><p className="mt-2 text-sm leading-relaxed text-zinc-400">{w.d}</p></div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* KOKEMUKSIA */}
      <section id="kokemuksia" className="mx-auto max-w-[1760px] px-6 md:px-10 py-16 md:py-24">
        <div ref={r3} className="opacity-0 translate-y-6 transition-all duration-700">
          <div className="text-center mb-12"><Badge>{tx.s3Badge}</Badge><h2 className="mt-4 text-3xl md:text-5xl font-black tracking-tight text-white">{tx.s3Title}</h2></div>
          <div className="grid gap-5 md:grid-cols-3">
            {[{ q: tx.t1, a: tx.t1Author, f: false }, { q: tx.t2, a: tx.t2Author, f: true }, { q: tx.t3, a: tx.t3Author, f: false }].map((item) => (
              <GlassCard key={item.a} className={`p-6 ${item.f ? "border-t-2 border-orange-400" : ""}`} hover>
                <p className="text-sm leading-relaxed italic text-zinc-300">{item.q}</p>
                <p className={`mt-4 text-xs font-bold ${item.f ? "text-orange-400" : "text-teal-400"}`}>{item.a}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* HINNASTO */}
      <section id="hinnasto" className="mx-auto max-w-[1760px] px-6 md:px-10 py-16 md:py-24">
        <div ref={r4} className="opacity-0 translate-y-6 transition-all duration-700">
          <div className="text-center mb-12"><Badge>{tx.s4Badge}</Badge><h2 className="mt-4 text-3xl md:text-5xl font-black tracking-tight text-white">{tx.s4Title}</h2><p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">{tx.s4Desc}</p></div>
          <div className="grid gap-5 md:grid-cols-3 max-w-[1400px] mx-auto">
            <PriceCard name={tx.p1Name} price="12,49â‚¬" features={[tx.p1f1, tx.p1f2, tx.p1f3]} popularLabel={tx.popular} chooseLabel={tx.choose} />
            <PriceCard name={tx.p2Name} price="29,99â‚¬" features={[tx.p2f1, tx.p2f2, tx.p2f3]} featured popularLabel={tx.popular} chooseLabel={tx.choose} />
            <PriceCard name={tx.p3Name} price="99â‚¬" features={[tx.p3f1, tx.p3f2, tx.p3f3]} popularLabel={tx.popular} chooseLabel={tx.choose} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-[1400px] px-6 md:px-10 py-16 md:py-24">
        <div ref={r5} className="opacity-0 translate-y-6 transition-all duration-700">
          <div className="text-center mb-12"><Badge>{tx.s5Badge}</Badge><h2 className="mt-4 text-3xl md:text-5xl font-black tracking-tight text-white">{tx.s5Title}</h2></div>
          <div className="space-y-3">
            <FaqItem q={tx.faq1q} a={tx.faq1a} />
            <FaqItem q={tx.faq2q} a={tx.faq2a} />
            <FaqItem q={tx.faq3q} a={tx.faq3a} />
            <FaqItem q={tx.faq4q} a={tx.faq4a} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1760px] px-6 md:px-10 pb-20">
        <div ref={r6} className="opacity-0 translate-y-6 transition-all duration-700">
          <GlassCard className="px-6 py-12 md:px-14 md:py-16 text-center">
            <Badge>{tx.ctaBadge}</Badge>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">{tx.ctaTitle}</h2>
            <p className="mx-auto mt-4 max-w-xl text-base md:text-lg leading-relaxed text-zinc-400">{tx.ctaDesc}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/signup" className="rounded-xl bg-gradient-to-r from-teal-400 to-orange-500 px-6 py-3 text-sm font-black text-black transition hover:scale-[1.02]">{tx.ctaBtn1}</Link>
              <Link href="/studio" className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">{tx.ctaBtn2}</Link>
            </div>
          </GlassCard>
        </div>
      </section>

      <footer className="border-t border-white/8 py-8 text-center text-sm text-zinc-600">{tx.footer}</footer>
    </main>
  );
}
