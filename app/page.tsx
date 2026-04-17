"use client";

import Link from "next/link";

function LogoMark() {
  return (
    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-400/35 bg-zinc-950 shadow-[0_0_30px_rgba(20,184,166,0.18)]">
      <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.18),transparent_65%)]" />
      <svg
        viewBox="0 0 64 64"
        className="relative z-10 h-8 w-8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 18V46"
          stroke="#5eead4"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M18 18H34C42 18 48 24 48 32C48 40 42 46 34 46H26"
          stroke="url(#heroGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M38 38L48 48"
          stroke="#f8fafc"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="heroGrad" x1="18" y1="18" x2="48" y2="46">
            <stop stopColor="#2dd4bf" />
            <stop offset="1" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-4">
      <LogoMark />
      <div>
        <div className="text-2xl font-black tracking-[-0.04em]">
          <span className="text-teal-400">DUUNI</span>
          <span className="text-orange-500">HARAVA</span>
        </div>
        <p className="text-sm text-zinc-400">
          CV:t, työpaikat ja hakemukset yhdessä
        </p>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-300">
      {children}
    </span>
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
      className={`rounded-[30px] border border-white/10 bg-white/[0.03] shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  accent = "teal",
}: {
  icon: string;
  title: string;
  desc: string;
  accent?: "teal" | "orange";
}) {
  return (
    <GlassCard className="h-full p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20">
      <div className="mb-4 text-2xl">{icon}</div>
      <h3
        className={`text-2xl font-bold tracking-[-0.03em] ${
          accent === "orange" ? "text-orange-400" : "text-teal-300"
        }`}
      >
        {title}
      </h3>
      <p className="mt-3 text-base leading-8 text-zinc-300">{desc}</p>
    </GlassCard>
  );
}

function ValueItem({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="text-2xl font-bold tracking-[-0.03em] text-white">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-sm text-base leading-8 text-zinc-400">
        {desc}
      </p>
    </div>
  );
}

function PriceCard({
  title,
  price,
  featured = false,
  items,
}: {
  title: string;
  price: string;
  featured?: boolean;
  items: string[];
}) {
  return (
    <div
      className={`relative rounded-[32px] border p-8 ${
        featured
          ? "border-teal-400/40 bg-gradient-to-b from-teal-400/10 to-white/[0.03] shadow-[0_0_40px_rgba(20,184,166,0.15)]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-teal-300/40 bg-teal-300/15 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-teal-200">
          Suosituin
        </div>
      )}

      <h3
        className={`text-3xl font-bold tracking-[-0.03em] ${
          featured ? "text-teal-300" : "text-white"
        }`}
      >
        {title}
      </h3>

      <p className="mt-4 text-5xl font-black tracking-[-0.05em] text-white">
        {price}
        <span className="ml-2 text-base font-medium text-zinc-500">/ kk</span>
      </p>

      <ul className="mt-8 space-y-3 text-left text-zinc-300">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-teal-400 to-orange-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link
          href="/signup"
          className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold transition ${
            featured
              ? "bg-gradient-to-r from-teal-400 to-orange-500 text-black hover:opacity-95"
              : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
          }`}
        >
          Valitse
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.07),transparent_24%),radial-gradient(circle_at_bottom,rgba(45,212,191,0.06),transparent_30%)]" />

      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#050816]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-4">
          <Brand />

          <nav className="hidden items-center gap-8 text-sm text-zinc-300 lg:flex">
            <a href="#etusivu" className="transition hover:text-white">
              Etusivu
            </a>
            <a href="#palvelut" className="transition hover:text-white">
              Palvelut
            </a>
            <a href="#miksi" className="transition hover:text-white">
              Miksi me
            </a>
            <a href="#hinnasto" className="transition hover:text-white">
              Hinnasto
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 text-sm text-zinc-300 md:flex">
              <span className="text-teal-300">FI</span>
              <span className="text-zinc-600">|</span>
              <span>EN</span>
            </div>

            <Link
              href="/signup"
              className="rounded-2xl border border-teal-400/25 bg-teal-400/10 px-4 py-2 text-sm font-semibold text-teal-300 transition hover:bg-teal-400/20"
            >
              Kirjaudu
            </Link>
          </div>
        </div>
      </header>

      <section
        id="etusivu"
        className="mx-auto max-w-[1400px] px-6 pb-20 pt-10 xl:pt-14"
      >
        <div className="grid items-start gap-12 xl:grid-cols-[minmax(0,1.02fr)_minmax(560px,0.98fr)]">
          <div className="mx-auto w-full max-w-[720px] xl:mx-0 xl:max-w-[760px]">
            <Badge>Duuniharava</Badge>

            <h1 className="mt-5 text-left text-[clamp(56px,7vw,112px)] font-black leading-[0.9] tracking-[-0.07em] text-white">
              Säästä aikaa työnhaussa ja rakenna vahvempi vaikutelma.
            </h1>

            <p className="mt-6 max-w-[680px] text-left text-[22px] leading-[1.7] text-zinc-300">
              Duuniharava auttaa tekemään paremman CV:n, seuraamaan työpaikkoja
              ja kirjoittamaan kohdistettuja hakemuksia yhdestä selkeästä
              työtilasta. Palvelu on tehty niin, että myös ensikertalainen
              ymmärtää heti mitä tehdä seuraavaksi.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-2xl bg-gradient-to-r from-teal-400 to-orange-500 px-5 py-3 text-sm font-black text-black transition hover:scale-[1.02]"
              >
                Aloita nyt
              </Link>
              <Link
                href="/studio"
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Katso miten toimii
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-4 text-sm text-zinc-300">
              <span>CV-generaattori</span>
              <span>Työpaikkaseuranta</span>
              <span>Hakemukset</span>
              <span>PDF + DOCX</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[760px] xl:mx-0">
            <GlassCard className="overflow-hidden p-5 md:p-7">
              <div className="mb-6 flex items-start gap-4">
                <LogoMark />
                <div className="w-full text-center">
                  <div className="text-4xl font-black tracking-[-0.04em]">
                    <span className="text-teal-400">DUUNI</span>
                    <span className="text-orange-500">HARAVA</span>
                  </div>
                  <p className="mx-auto mt-3 max-w-[540px] text-xl leading-9 text-zinc-300">
                    Tyylikäs ja selkeä työnhaun työtila, joka kokoaa CV:t,
                    työpaikkaseurannan ja hakemukset yhteen.
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/8 bg-[#040712] p-5">
                <p className="text-lg font-semibold text-teal-300">
                  Työnhaun näkyvyys ja osuvuus
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Havainnekuva siitä, miltä selkeä työnhaun dashboard voi näyttää
                </p>

                <div className="mt-6 h-[300px] rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] xl:h-[380px]" />

                <div className="mt-5 grid grid-cols-4 gap-3 text-center text-sm text-zinc-400">
                  <span>CV</span>
                  <span>Työpaikat</span>
                  <span>Hakemukset</span>
                  <span>Seuranta</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      <section
        id="palvelut"
        className="mx-auto max-w-[1400px] px-6 py-16 md:py-24"
      >
        <div className="mx-auto max-w-4xl text-center">
          <Badge>Palvelut</Badge>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
            Kenelle ja mitä tarjoamme
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-9 text-zinc-300">
            Palvelu on rakennettu niin, että myös ensimmäistä kertaa hakeva
            ymmärtää mitä tehdä seuraavaksi.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <FeatureCard
            icon="📄"
            title="CV-analyysi ja rakentaminen"
            desc="Luo uusi CV tai paranna nykyistä. Tee sisällöstä vahvempi ja pidä ulkoasu siistinä ilman turhaa säätöä."
          />
          <FeatureCard
            icon="🎯"
            title="Työpaikkojen kohdistus"
            desc="Seuraa kiinnostavia työpaikkoja, deadlineja ja prioriteetteja yhdestä näkymästä."
            accent="orange"
          />
          <FeatureCard
            icon="✍️"
            title="Hakemukset valmiiksi nopeammin"
            desc="Tee työpaikkaan sopiva hakemus ja tarvittaessa myös erillinen CV-versio samasta työtilasta."
          />
        </div>
      </section>

      <section
        id="miksi"
        className="mx-auto max-w-[1400px] px-6 py-16 md:py-24"
      >
        <GlassCard className="p-8 md:p-14">
          <div className="mx-auto max-w-4xl text-center">
            <Badge>Miksi me</Badge>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
              Enemmän kuin vain yksi työkalu
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-9 text-zinc-300">
              Duuniharava kokoaa työnhaun tärkeimmät osat yhteen. Se ei ole
              pelkkä CV-editori tai pelkkä hakemuspohja, vaan kokonainen
              työnhaun työtila.
            </p>
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            <ValueItem
              icon="🇫🇮"
              title="Suomen työnhakuun sopiva"
              desc="Rakennettu nimenomaan siihen, miltä työnhaku Suomessa tuntuu ja mitä siinä yleensä tarvitaan."
            />
            <ValueItem
              icon="⚙️"
              title="Selkeä prosessi"
              desc="Käyttäjä ymmärtää vaihe vaiheelta mitä tehdä seuraavaksi, vaikka ei olisi käyttänyt vastaavaa palvelua aiemmin."
            />
            <ValueItem
              icon="💎"
              title="Premium-ilme"
              desc="Luottamusta herättävä, moderni ja myyvä käyttöliittymä tekee tuotteesta aidosti valmiin tuntuisen."
            />
          </div>
        </GlassCard>
      </section>

      <section
        id="hinnasto"
        className="mx-auto max-w-[1400px] px-6 py-16 md:py-24"
      >
        <div className="mx-auto max-w-4xl text-center">
          <Badge>Hinnasto</Badge>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
            Hinnasto
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-9 text-zinc-300">
            Voitte myöhemmin säätää nämä lopullisiin hintoihin, mutta rakenne on
            valmiina myyvää esittelyä varten.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <PriceCard
            title="Starter"
            price="12,49€"
            items={[
              "CV-analyysi",
              "Perusmuokkaukset",
              "Kevyt aloitus työnhakuun",
            ]}
          />
          <PriceCard
            title="Pro"
            price="29,99€"
            featured
            items={[
              "Rajattomammat työnhakutyökalut",
              "Hakemusten teko nopeammin",
              "Työpaikkaseuranta samassa näkymässä",
            ]}
          />
          <PriceCard
            title="Ura-tuki"
            price="99€"
            items={[
              "Kaikki Pro-ominaisuudet",
              "Syvempi sparraus myöhemmin",
              "Laajempi henkilökohtainen tuki",
            ]}
          />
        </div>
      </section>

      <section
        id="faq"
        className="mx-auto max-w-[1100px] px-6 py-16 md:py-24"
      >
        <div className="mx-auto max-w-4xl text-center">
          <Badge>FAQ</Badge>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
            Usein kysyttyä
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-9 text-zinc-300">
            Tähän voi myöhemmin lisätä lisää kysymyksiä, mutta tässä on hyvä
            myyvän landingin peruspohja.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-zinc-200">
            <summary className="cursor-pointer text-lg font-semibold">
              Saanko tällä paremman CV:n?
            </summary>
            <p className="mt-3 text-base leading-8 text-zinc-400">
              Kyllä. Tavoitteena on tehdä CV:n kirjoittamisesta, muokkaamisesta
              ja viimeistelystä huomattavasti helpompaa.
            </p>
          </details>

          <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-zinc-200">
            <summary className="cursor-pointer text-lg font-semibold">
              Voinko seurata työpaikkoja samassa paikassa?
            </summary>
            <p className="mt-3 text-base leading-8 text-zinc-400">
              Kyllä. Duuniharava yhdistää CV:n, työpaikat ja hakemukset yhden
              näkymän alle.
            </p>
          </details>

          <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-zinc-200">
            <summary className="cursor-pointer text-lg font-semibold">
              Voiko tätä käyttää ilman aiempaa kokemusta?
            </summary>
            <p className="mt-3 text-base leading-8 text-zinc-400">
              Kyllä. Koko rakenne on tehty niin, että käyttäjä ymmärtää helposti
              mitä pitää tehdä seuraavaksi.
            </p>
          </details>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 pb-16 md:pb-24">
        <GlassCard className="px-6 py-10 text-center md:px-12 md:py-14">
          <Badge>Aloita nyt</Badge>
          <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
            Valmis tekemään työnhausta selkeämpää?
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-9 text-zinc-300">
            Avaa Duuniharava ja rakenna CV, työpaikkaseuranta ja hakemukset
            yhteen paikkaan.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-2xl bg-gradient-to-r from-teal-400 to-orange-500 px-5 py-3 text-sm font-black text-black transition hover:scale-[1.02]"
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
        </GlassCard>
      </section>

      <footer className="border-t border-white/6 px-6 py-8 text-center text-sm text-zinc-500">
        © 2026 Duuniharava. Kaikki oikeudet pidätetään.
      </footer>
    </main>
  );
}