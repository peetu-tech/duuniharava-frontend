"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function DuuniharavaLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00BFA6] to-[#FF6F3C] opacity-25 blur-xl" />
        <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 11V20M12 11V20M19 11V20M5 11H19M12 4V11"
              stroke="#00BFA6"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="leading-tight">
        <div className="text-base font-black tracking-[-0.04em] text-white sm:text-lg">
          <span className="text-[#00BFA6]">DUUNI</span>
          <span className="text-[#FF6F3C]">HARAVA</span>
        </div>
        <div className="text-[11px] text-zinc-400 sm:text-xs">
          CV:t, työpaikat ja hakemukset yhdessä
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex rounded-full border border-[#00BFA6]/20 bg-[#00BFA6]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#00BFA6]">
      {children}
    </div>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Badge>{eyebrow}</Badge>
      <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.05em] text-white md:text-5xl">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base md:leading-8">
        {description}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  accent = "teal",
}: {
  icon: string;
  title: string;
  description: string;
  accent?: "teal" | "orange";
}) {
  return (
    <GlassCard className="h-full p-6 transition duration-300 hover:-translate-y-1.5 hover:border-white/20">
      <div className="text-3xl">{icon}</div>
      <h3
        className={`mt-4 text-xl font-bold ${
          accent === "teal" ? "text-[#00BFA6]" : "text-[#FF6F3C]"
        }`}
      >
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-zinc-300">{description}</p>
    </GlassCard>
  );
}

function InfoStat({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <GlassCard className="p-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        {title}
      </p>
      <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>
    </GlassCard>
  );
}

function PricingCard({
  title,
  price,
  subtitle,
  features,
  highlighted = false,
}: {
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-[30px] border p-7 backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 ${
        highlighted
          ? "border-[#00BFA6] bg-white/[0.05] shadow-[0_0_40px_rgba(0,191,166,0.12)]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#00BFA6] px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
          Suosituin
        </div>
      )}

      <h3
        className={`text-2xl font-bold ${
          highlighted ? "text-[#00BFA6]" : "text-white"
        }`}
      >
        {title}
      </h3>

      <div className="mt-4 text-4xl font-black tracking-[-0.04em] text-white">
        {price}
      </div>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>

      <div className="mt-7 space-y-3">
        {features.map((feature) => (
          <div key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C]" />
            <p>{feature}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-8">
        <Link
          href="/signup"
          className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold transition ${
            highlighted
              ? "bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] text-white hover:scale-[1.02]"
              : "border border-white/10 bg-white/[0.05] text-white hover:bg-white/[0.08]"
          }`}
        >
          Valitse
        </Link>
      </div>
    </div>
  );
}

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition hover:border-[#00BFA6]/30">
      <summary className="cursor-pointer list-none pr-8 text-base font-bold text-white">
        {question}
      </summary>
      <p className="mt-4 text-sm leading-7 text-zinc-300">{answer}</p>
    </details>
  );
}

function MiniChart() {
  const bars = [68, 72, 79, 85, 74, 62, 55];

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
      <div>
        <p className="text-sm font-bold text-[#00BFA6]">
          Työttömyyden trendi ja ennuste
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Visuaalinen esimerkki palvelun analytiikasta
        </p>
      </div>

      <div className="mt-6 flex h-44 items-end gap-2 sm:gap-3 md:h-56">
        {bars.map((bar, index) => {
          const isForecast = index >= 3;
          return (
            <div key={index} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-full w-full items-end">
                <div
                  className={`w-full rounded-t-xl ${
                    isForecast
                      ? "bg-gradient-to-t from-[#FF6F3C] to-[#ff9a73]"
                      : "bg-gradient-to-t from-[#00BFA6] to-[#6df0df]"
                  }`}
                  style={{ height: `${bar}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 sm:text-[11px]">
                {2020 + index * 2}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-4 text-[11px] text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#00BFA6]" />
          Historia
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF6F3C]" />
          Ennuste
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<"fi" | "en">("fi");

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = {
    fi: {
      navHome: "Etusivu",
      navServices: "Palvelut",
      navWhy: "Miksi me",
      navPricing: "Hinnasto",
      navFaq: "FAQ",
      login: "Kirjaudu",
      heroTitle: "Säästä aikaa työnhaussa ja rakenna vahvempi vaikutelma",
      heroDesc:
        "Duuniharava auttaa tekemään paremman CV:n, seuraamaan työpaikkoja ja kirjoittamaan kohdistettuja hakemuksia yhdestä selkeästä työtilasta.",
      heroCta: "Aloita nyt",
      heroMore: "Katso miten toimii",
      section1Title: "Kenelle ja mitä tarjoamme",
      section1Desc:
        "Palvelu on rakennettu niin, että myös ensimmäistä kertaa hakeva ymmärtää mitä tehdä seuraavaksi.",
      whyTitle: "Enemmän kuin vain yksi työkalu",
      whyDesc:
        "Duuniharava kokoaa työnhaun tärkeimmät osat yhteen. Se ei ole pelkkä CV-editori tai pelkkä hakemuspohja, vaan kokonainen työnhaun työtila.",
      pricingTitle: "Hinnasto",
      pricingDesc:
        "Voitte myöhemmin säätää nämä lopullisiin hintoihin, mutta rakenne on valmiina myyvää esittelyä varten.",
      faqTitle: "Usein kysyttyä",
      faqDesc:
        "Tässä on hyvä ja selkeä FAQ-pohja, jota voi laajentaa myöhemmin.",
      ctaTitle: "Valmis tekemään työnhausta selkeämpää?",
      ctaDesc:
        "Avaa Duuniharava ja rakenna CV, työpaikkaseuranta ja hakemukset yhteen paikkaan.",
      ctaPrimary: "Luo tili",
      ctaSecondary: "Avaa studio",
    },
    en: {
      navHome: "Home",
      navServices: "Services",
      navWhy: "Why us",
      navPricing: "Pricing",
      navFaq: "FAQ",
      login: "Login",
      heroTitle: "Save time in job search and build a stronger first impression",
      heroDesc:
        "Duuniharava helps you create a better CV, track jobs, and write tailored applications from one clear workspace.",
      heroCta: "Get started",
      heroMore: "See how it works",
      section1Title: "Who it is for and what we offer",
      section1Desc:
        "Built so that even first-time job seekers understand what to do next.",
      whyTitle: "More than just one tool",
      whyDesc:
        "Duuniharava combines the key parts of job hunting into one place. It is not just a CV editor or just an application template, but a full job search workspace.",
      pricingTitle: "Pricing",
      pricingDesc:
        "You can fine-tune these prices later, but the section is already ready for a polished sales page.",
      faqTitle: "Frequently asked questions",
      faqDesc: "A clean FAQ base that you can expand later.",
      ctaTitle: "Ready to make job search clearer?",
      ctaDesc:
        "Open Duuniharava and bring your CV, job tracking and applications into one place.",
      ctaPrimary: "Create account",
      ctaSecondary: "Open studio",
    },
  }[lang];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0F0F0F] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(0,191,166,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(255,111,60,0.12),transparent_20%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_28%)]" />

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 md:px-6">
          <DuuniharavaLogo className="shrink-0" />

          <div className="hidden items-center gap-7 text-sm text-zinc-400 lg:flex">
            <a href="#hero" className="transition hover:text-white">
              {t.navHome}
            </a>
            <a href="#features" className="transition hover:text-white">
              {t.navServices}
            </a>
            <a href="#why" className="transition hover:text-white">
              {t.navWhy}
            </a>
            <a href="#pricing" className="transition hover:text-white">
              {t.navPricing}
            </a>
            <a href="#faq" className="transition hover:text-white">
              {t.navFaq}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <button
                onClick={() => setLang("fi")}
                className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                  lang === "fi"
                    ? "border-[#00BFA6] bg-[#00BFA6]/10 text-[#00BFA6]"
                    : "border-white/10 text-white"
                }`}
              >
                🇫🇮 FI
              </button>
              <button
                onClick={() => setLang("en")}
                className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                  lang === "en"
                    ? "border-[#00BFA6] bg-[#00BFA6]/10 text-[#00BFA6]"
                    : "border-white/10 text-white"
                }`}
              >
                🇬🇧 EN
              </button>
            </div>

            <Link
              href="/signup"
              className="rounded-xl border border-[#00BFA6] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#00BFA6] transition hover:bg-[#00BFA6] hover:text-black"
            >
              {t.login}
            </Link>
          </div>
        </div>
      </nav>

      <section id="hero" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="max-w-3xl">
            <Badge>Duuniharava</Badge>

            <h1 className="mt-5 text-4xl font-black leading-[0.94] tracking-[-0.06em] text-white sm:text-5xl lg:text-7xl">
              {t.heroTitle}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 md:text-lg">
              {t.heroDesc}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] px-8 py-4 text-sm font-black text-white transition hover:scale-[1.02]"
              >
                {t.heroCta}
              </Link>

              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                {t.heroMore}
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {["CV-generaattori", "Työpaikkaseuranta", "Hakemukset", "PDF + DOCX"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-200"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          <GlassCard className="p-6 md:p-8">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[26px] border border-white/10 bg-white/[0.04] shadow-[0_0_30px_rgba(0,191,166,0.12)]">
                <svg
                  width="42"
                  height="42"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 11V20M12 11V20M19 11V20M5 11H19M12 4V11"
                    stroke="#00BFA6"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="text-2xl font-black tracking-[-0.04em] text-white">
                <span className="text-[#00BFA6]">DUUNI</span>
                <span className="text-[#FF6F3C]">HARAVA</span>
              </div>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-zinc-400">
                Tyylikäs ja selkeä työnhaun työtila, joka kokoaa CV:t,
                työpaikkaseurannan ja hakemukset yhteen.
              </p>
            </div>

            <MiniChart />
          </GlassCard>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <SectionHeader
          eyebrow="Palvelut"
          title={t.section1Title}
          description={t.section1Desc}
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <FeatureCard
            icon="📄"
            title="CV-analyysi ja rakentaminen"
            description="Luo uusi CV tai paranna nykyistä. Tee sisällöstä vahvempi ja pidä ulkoasu siistinä ilman turhaa säätöä."
            accent="teal"
          />
          <FeatureCard
            icon="🎯"
            title="Työpaikkojen kohdistus"
            description="Seuraa kiinnostavia työpaikkoja, deadlineja ja prioriteetteja yhdestä näkymästä."
            accent="orange"
          />
          <FeatureCard
            icon="✍️"
            title="Hakemukset valmiiksi nopeammin"
            description="Tee työpaikkaan sopiva hakemus ja tarvittaessa myös erillinen CV-versio samasta työtilasta."
            accent="teal"
          />
        </div>
      </section>

      <section id="why" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <GlassCard className="p-8 md:p-12">
          <SectionHeader
            eyebrow="Miksi me"
            title={t.whyTitle}
            description={t.whyDesc}
          />

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl">🇫🇮</div>
              <h3 className="mt-4 text-2xl font-bold text-white">
                Suomen työnhakuun sopiva
              </h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Rakennettu nimenomaan siihen, miltä työnhaku Suomessa tuntuu ja
                mitä siinä yleensä tarvitaan.
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl">⚙️</div>
              <h3 className="mt-4 text-2xl font-bold text-white">
                Selkeä prosessi
              </h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Käyttäjä ymmärtää vaihe vaiheelta mitä tehdä seuraavaksi, vaikka
                ei olisi käyttänyt vastaavaa palvelua aiemmin.
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl">💎</div>
              <h3 className="mt-4 text-2xl font-bold text-white">
                Premium-ilme
              </h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Luottamusta herättävä, moderni ja myyvä käyttöliittymä tekee
                tuotteesta aidosti valmiin tuntuisen.
              </p>
            </div>
          </div>
        </GlassCard>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <SectionHeader
          eyebrow="Hinnasto"
          title={t.pricingTitle}
          description={t.pricingDesc}
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <PricingCard
            title="Starter"
            price="12,49€"
            subtitle="/ kk"
            features={[
              "CV-analyysi",
              "Perusmuokkaukset",
              "Kevyt aloitus työnhakuun",
            ]}
          />
          <PricingCard
            title="Pro"
            price="29,99€"
            subtitle="/ kk"
            highlighted
            features={[
              "Rajattomammat työnhakutyökalut",
              "Hakemusten teko nopeammin",
              "Työpaikkaseuranta samassa näkymässä",
            ]}
          />
          <PricingCard
            title="Ura-tuki"
            price="99€"
            subtitle="/ kk"
            features={[
              "Kaikki Pro-ominaisuudet",
              "Syvempi sparraus myöhemmin",
              "Laajempi henkilökohtainen tuki",
            ]}
          />
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24">
        <SectionHeader
          eyebrow="FAQ"
          title={t.faqTitle}
          description={t.faqDesc}
        />

        <div className="mt-12 space-y-4">
          <FaqItem
            question="Saanko tällä paremman CV:n?"
            answer="Kyllä. Duuniharava auttaa tekemään CV:stä selkeämmän, vahvemman ja paremmin työnhakuun sopivan."
          />
          <FaqItem
            question="Voinko seurata työpaikkoja samassa paikassa?"
            answer="Kyllä. Voit tallentaa työpaikkoja, seurata statuksia, deadlineja, suosikkeja ja muistiinpanoja yhdestä näkymästä."
          />
          <FaqItem
            question="Voiko tätä käyttää ilman aiempaa kokemusta?"
            answer="Kyllä. Palvelu on suunniteltu niin, että eteneminen on loogista ja helppoa myös ensikertalaiselle."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="rounded-[36px] border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-[#00BFA6]/[0.06] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.3)] backdrop-blur-2xl md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex rounded-full border border-[#FF6F3C]/20 bg-[#FF6F3C]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#FF6F3C]">
              Aloita nyt
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">
              {t.ctaTitle}
            </h2>

            <p className="mt-5 text-base leading-8 text-zinc-300 md:text-lg">
              {t.ctaDesc}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] px-8 py-4 text-sm font-black text-white transition hover:scale-[1.02]"
              >
                {t.ctaPrimary}
              </Link>
              <Link
                href="/studio"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                {t.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10 text-center text-sm text-zinc-600">
        © 2026 Duuniharava. Kaikki oikeudet pidätetään.
      </footer>
    </main>
  );
}