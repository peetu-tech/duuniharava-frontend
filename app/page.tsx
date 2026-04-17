"use client";

import Link from "next/link";

function DuuniharavaLogo({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 via-emerald-400 to-orange-400 shadow-[0_12px_35px_rgba(16,185,129,0.28)]">
        <div className="absolute inset-[2px] rounded-[14px] bg-[#07110f]" />
        <svg
          viewBox="0 0 64 64"
          className="relative z-10 h-7 w-7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 14V46"
            stroke="url(#logoGrad)"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <path
            d="M18 30H36C43.732 30 50 36.268 50 44"
            stroke="url(#logoGrad)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M36 30V50"
            stroke="#f8fafc"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="logoGrad" x1="12" y1="10" x2="54" y2="52">
              <stop stopColor="#2dd4bf" />
              <stop offset="0.55" stopColor="#34d399" />
              <stop offset="1" stopColor="#fb923c" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {!compact && (
        <div className="leading-tight">
          <div className="text-lg font-black tracking-[-0.04em] text-white">
            <span className="text-teal-400">DUUNI</span>
            <span className="text-orange-400">HARAVA</span>
          </div>
          <div className="text-xs text-zinc-400">
            CV:t, työpaikat ja hakemukset yhdessä
          </div>
        </div>
      )}
    </div>
  );
}

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300">
      {children}
    </span>
  );
}

function GlassCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[30px] border border-white/10 bg-white/[0.03] shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

function FeaturePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-200">
      {children}
    </span>
  );
}

function HeroChart() {
  const bars = [42, 58, 54, 68, 74, 61, 82, 76, 88, 79, 91, 96];

  return (
    <div className="mt-6 rounded-[24px] border border-white/8 bg-black/20 p-5">
      <div className="mb-4 text-left">
        <p className="text-sm font-semibold text-teal-300">
          Työnhaun näkyvyys ja osuvuus
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Havainnekuva siitä, miltä selkeä työnhaun dashboard voi näyttää
        </p>
      </div>

      <div className="flex h-56 items-end gap-2 sm:gap-3 md:h-72">
        {bars.map((value, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-2xl bg-gradient-to-t from-teal-400 via-emerald-400 to-orange-400 shadow-[0_12px_24px_rgba(16,185,129,0.18)]"
              style={{ height: `${value}%` }}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500">
        <span>CV</span>
        <span>Työpaikat</span>
        <span>Hakemukset</span>
        <span>Seuranta</span>
      </div>
    </div>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
  accent = "teal",
}: {
  emoji: string;
  title: string;
  description: string;
  accent?: "teal" | "orange";
}) {
  const titleColor =
    accent === "orange" ? "text-orange-400" : "text-teal-300";

  return (
    <GlassCard className="h-full p-6 transition duration-300 hover:-translate-y-1 hover:border-white/15">
      <div className="mb-4 text-2xl">{emoji}</div>
      <h3 className={`text-2xl font-bold tracking-[-0.03em] ${titleColor}`}>
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-zinc-300">{description}</p>
    </GlassCard>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-sm text-center">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="text-2xl font-bold tracking-[-0.03em] text-white">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-zinc-400">{description}</p>
    </div>
  );
}

function PriceCard({
  title,
  price,
  featured = false,
  points,
}: {
  title: string;
  price: string;
  featured?: boolean;
  points: string[];
}) {
  return (
    <div
      className={`relative rounded-[30px] border p-7 ${
        featured
          ? "border-teal-400/40 bg-gradient-to-b from-teal-400/10 via-white/[0.03] to-orange-400/10 shadow-[0_20px_80px_rgba(16,185,129,0.18)]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      {featured && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-teal-400 to-orange-400 px-4 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-black">
          Suosituin
        </div>
      )}

      <h3
        className={`text-3xl font-black tracking-[-0.04em] ${
          featured ? "text-teal-300" : "text-white"
        }`}
      >
        {title}
      </h3>

      <div className="mt-5">
        <span className="text-5xl font-black tracking-[-0.05em] text-white">
          {price}
        </span>
        <span className="ml-2 text-zinc-500">/ kk</span>
      </div>

      <ul className="mt-6 space-y-3 text-sm text-zinc-300">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-teal-400 to-orange-400" />
            <span>{point}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link
          href="/signup"
          className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-bold transition ${
            featured
              ? "bg-gradient-to-r from-teal-400 to-orange-400 text-black hover:opacity-95"
              : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
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
    <details className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">
        <span>{question}</span>
        <span className="text-zinc-500 transition group-open:rotate-180">⌄</span>
      </summary>
      <p className="mt-4 text-sm leading-7 text-zinc-400">{answer}</p>
    </details>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(251,146,60,0.10),transparent_20%),radial-gradient(circle_at_bottom,rgba(52,211,153,0.10),transparent_22%)]" />

      <header className="sticky top-0 z-50 border-b border-white/6 bg-[#050816]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 md:px-6">
          <Link href="/" className="shrink-0">
            <DuuniharavaLogo />
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-zinc-400 lg:flex">
            <a href="#hero" className="transition hover:text-white">
              Etusivu
            </a>
            <a href="#features" className="transition hover:text-white">
              Palvelut
            </a>
            <a href="#why" className="transition hover:text-white">
              Miksi me
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Hinnasto
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-300 sm:flex">
              <span className="text-teal-300">FI</span>
              <span className="text-zinc-600">|</span>
              <span>EN</span>
            </div>

            <Link
              href="/signup"
              className="rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-sm font-semibold text-teal-300 transition hover:bg-teal-400/15"
            >
              Kirjaudu
            </Link>
          </div>
        </div>
      </header>

      <section
        id="hero"
        className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20"
      >
        <div className="grid items-center gap-10 xl:grid-cols-2">
          <div className="mx-auto flex w-full max-w-3xl flex-col text-left xl:mx-0">
            <SectionBadge>Duuniharava</SectionBadge>

            <h1 className="mt-5 text-4xl font-black leading-[0.92] tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              Säästä aikaa työnhaussa ja rakenna vahvempi vaikutelma.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 md:text-lg">
              Duuniharava auttaa tekemään paremman CV:n, seuraamaan työpaikkoja
              ja kirjoittamaan kohdistettuja hakemuksia yhdestä selkeästä
              työtilasta. Palvelu on tehty niin, että myös ensikertalainen
              ymmärtää heti mitä tehdä seuraavaksi.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-2xl bg-gradient-to-r from-teal-400 to-orange-400 px-5 py-3 text-sm font-black text-black transition hover:opacity-95"
              >
                Aloita nyt
              </Link>

              <a
                href="#features"
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Katso miten toimii
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <FeaturePill>CV-generaattori</FeaturePill>
              <FeaturePill>Työpaikkaseuranta</FeaturePill>
              <FeaturePill>Hakemukset</FeaturePill>
              <FeaturePill>PDF + DOCX</FeaturePill>
            </div>
          </div>

          <div className="mx-auto w-full max-w-3xl">
            <GlassCard className="min-h-[560px] p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border border-white/10 bg-black/20 shadow-[0_10px_30px_rgba(16,185,129,0.12)]">
                  <div className="relative flex h-10 w-10 items-center justify-center">
                    <div className="absolute inset-0 rounded-2xl bg-teal-400/10 blur-xl" />
                    <svg
                      viewBox="0 0 64 64"
                      className="relative z-10 h-9 w-9"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 14V46"
                        stroke="url(#heroGrad)"
                        strokeWidth="5.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M18 30H36C43.732 30 50 36.268 50 44"
                        stroke="url(#heroGrad)"
                        strokeWidth="5.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M36 30V50"
                        stroke="#f8fafc"
                        strokeWidth="4.5"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient
                          id="heroGrad"
                          x1="12"
                          y1="10"
                          x2="54"
                          y2="52"
                        >
                          <stop stopColor="#2dd4bf" />
                          <stop offset="0.55" stopColor="#34d399" />
                          <stop offset="1" stopColor="#fb923c" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <h2 className="text-4xl font-black tracking-[-0.05em]">
                  <span className="text-teal-400">DUUNI</span>
                  <span className="text-orange-400">HARAVA</span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-zinc-300">
                  Tyylikäs ja selkeä työnhaun työtila, joka kokoaa CV:t,
                  työpaikkaseurannan ja hakemukset yhteen.
                </p>
              </div>

              <HeroChart />
            </GlassCard>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24"
      >
        <div className="mx-auto max-w-3xl text-center">
          <SectionBadge>Palvelut</SectionBadge>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
            Kenelle ja mitä tarjoamme
          </h2>
          <p className="mt-5 text-base leading-8 text-zinc-300 md:text-lg">
            Palvelu on rakennettu niin, että myös ensimmäistä kertaa hakeva
            ymmärtää mitä tehdä seuraavaksi.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <FeatureCard
            emoji="📄"
            title="CV-analyysi ja rakentaminen"
            description="Luo uusi CV tai paranna nykyistä. Tee sisällöstä vahvempi ja pidä ulkoasu siistinä ilman turhaa säätöä."
            accent="teal"
          />
          <FeatureCard
            emoji="🎯"
            title="Työpaikkojen kohdistus"
            description="Seuraa kiinnostavia työpaikkoja, deadlineja ja prioriteetteja yhdestä näkymästä."
            accent="orange"
          />
          <FeatureCard
            emoji="✍️"
            title="Hakemukset valmiiksi nopeammin"
            description="Tee työpaikkaan sopiva hakemus ja tarvittaessa myös erillinen CV-versio samasta työtilasta."
            accent="teal"
          />
        </div>
      </section>

      <section
        id="why"
        className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24"
      >
        <GlassCard className="p-8 md:p-14">
          <div className="mx-auto max-w-3xl text-center">
            <SectionBadge>Miksi me</SectionBadge>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
              Enemmän kuin vain yksi työkalu
            </h2>
            <p className="mt-5 text-base leading-8 text-zinc-300 md:text-lg">
              Duuniharava kokoaa työnhaun tärkeimmät osat yhteen. Se ei ole
              pelkkä CV-editori tai pelkkä hakemuspohja, vaan kokonainen
              työnhaun työtila.
            </p>
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            <BenefitCard
              icon="🇫🇮"
              title="Suomen työnhakuun sopiva"
              description="Rakennettu nimenomaan siihen, miltä työnhaku Suomessa tuntuu ja mitä siinä yleensä tarvitaan."
            />
            <BenefitCard
              icon="⚙️"
              title="Selkeä prosessi"
              description="Käyttäjä ymmärtää vaihe vaiheelta mitä tehdä seuraavaksi, vaikka ei olisi käyttänyt vastaavaa palvelua aiemmin."
            />
            <BenefitCard
              icon="💎"
              title="Premium-ilme"
              description="Luottamusta herättävä, moderni ja myyvä käyttöliittymä tekee tuotteesta aidosti valmiin tuntuisen."
            />
          </div>
        </GlassCard>
      </section>

      <section
        id="pricing"
        className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24"
      >
        <div className="mx-auto max-w-3xl text-center">
          <SectionBadge>Hinnasto</SectionBadge>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
            Hinnasto
          </h2>
          <p className="mt-5 text-base leading-8 text-zinc-300 md:text-lg">
            Voitte myöhemmin säätää nämä lopullisiin hintoihin, mutta rakenne on
            valmiina myyvää esittelyä varten.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <PriceCard
            title="Starter"
            price="12,49€"
            points={[
              "CV-analyysi",
              "Perusmuokkaukset",
              "Kevyt aloitus työnhakuun",
            ]}
          />
          <PriceCard
            title="Pro"
            price="29,99€"
            featured
            points={[
              "Rajattomammat työnhakutyökalut",
              "Hakemusten teko nopeammin",
              "Työpaikkaseuranta samassa näkymässä",
            ]}
          />
          <PriceCard
            title="Ura-tuki"
            price="99€"
            points={[
              "Kaikki Pro-ominaisuudet",
              "Syvempi sparraus myöhemmin",
              "Laajempi henkilökohtainen tuki",
            ]}
          />
        </div>
      </section>

      <section
        id="faq"
        className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24"
      >
        <div className="text-center">
          <SectionBadge>FAQ</SectionBadge>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
            Usein kysyttyä
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-zinc-300 md:text-lg">
            Tähän voi myöhemmin lisätä lisää kysymyksiä, mutta tässä on hyvä
            myyvän landingin peruspohja.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          <FaqItem
            question="Saanko tällä paremman CV:n?"
            answer="Kyllä. Palvelun idea on auttaa sekä sisällössä että rakenteessa, jotta CV näyttää siistiltä ja tuntuu uskottavalta."
          />
          <FaqItem
            question="Voinko seurata työpaikkoja samassa paikassa?"
            answer="Kyllä. Duuniharava yhdistää CV:n, työpaikkalistat, deadlinejen seurannan ja hakemukset samaan työtilaan."
          />
          <FaqItem
            question="Voiko tätä käyttää ilman aiempaa kokemusta?"
            answer="Voi. Käyttöliittymä on rakennettu erityisesti niin, että työnhaun vaiheet ovat selkeitä myös aloittelijalle."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
        <GlassCard className="overflow-hidden p-8 md:p-14">
          <div className="mx-auto max-w-3xl text-center">
            <SectionBadge>Aloita nyt</SectionBadge>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
              Valmis tekemään työnhausta selkeämpää?
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-zinc-300 md:text-lg">
              Avaa Duuniharava ja rakenna CV, työpaikkaseuranta ja hakemukset
              yhteen paikkaan.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="rounded-2xl bg-gradient-to-r from-teal-400 to-orange-400 px-5 py-3 text-sm font-black text-black transition hover:opacity-95"
              >
                Luo tili
              </Link>
              <Link
                href="/studio"
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Avaa studio
              </Link>
            </div>
          </div>
        </GlassCard>
      </section>

      <footer className="border-t border-white/6 px-4 py-8 text-center text-sm text-zinc-500 md:px-6">
        © 2026 Duuniharava. Kaikki oikeudet pidätetään.
      </footer>
    </main>
  );
}