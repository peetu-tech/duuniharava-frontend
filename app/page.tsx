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
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-400 shadow-[0_10px_30px_rgba(20,184,166,0.35)]">
        <div className="absolute inset-[2px] rounded-[14px] bg-zinc-950/90" />
        <svg
          viewBox="0 0 64 64"
          className="relative z-10 h-8 w-8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 18h19c9.5 0 17 7.5 17 17s-7.5 17-17 17H22"
            stroke="url(#duuniGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 14v36"
            stroke="url(#duuniGrad)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M38 38l12 12"
            stroke="#f8fafc"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="duuniGrad" x1="10" y1="10" x2="52" y2="52">
              <stop stopColor="#22d3ee" />
              <stop offset="0.5" stopColor="#2dd4bf" />
              <stop offset="1" stopColor="#34d399" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {!compact && (
        <div className="leading-tight">
          <div className="text-lg font-black tracking-[-0.03em] text-white">
            Duuniharava
          </div>
          <div className="text-xs text-zinc-400">
            CV:t, työpaikat ja hakemukset yhdessä
          </div>
        </div>
      )}
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-zinc-300 transition hover:text-white"
    >
      {children}
    </Link>
  );
}

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-zinc-200"
    >
      {children}
    </Link>
  );
}

function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white transition hover:scale-[1.02] hover:bg-white/[0.08]"
    >
      {children}
    </Link>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
        {eyebrow}
      </div>
      <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-white md:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-zinc-300 md:text-lg">
        {description}
      </p>
    </div>
  );
}

function StatCard({
  value,
  label,
  description,
}: {
  value: string;
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-teal-400/30 hover:bg-white/[0.06]">
      <div className="text-3xl font-black tracking-[-0.04em] text-white">
        {value}
      </div>
      <div className="mt-2 text-sm font-semibold text-zinc-200">{label}</div>
      <p className="mt-3 text-sm leading-7 text-zinc-400">{description}</p>
    </div>
  );
}

function ProblemCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-zinc-900/70 p-6 transition duration-300 hover:border-white/20 hover:bg-zinc-900">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-300">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-teal-400/30 hover:bg-white/[0.06]">
      <div className="mb-4 inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300">
        {step}
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-300">{description}</p>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  bullets,
}: {
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-teal-400/30 hover:bg-white/[0.06]">
      <h3 className="text-2xl font-semibold tracking-[-0.02em] text-white">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-zinc-300">{description}</p>

      <div className="mt-5 space-y-3">
        {bullets.map((item) => (
          <div key={item} className="flex items-start gap-3">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
            <p className="text-sm leading-7 text-zinc-200">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AudienceCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-zinc-900/70 p-6 transition duration-300 hover:border-teal-400/20 hover:bg-zinc-900">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-300">{description}</p>
    </div>
  );
}

function PricingPlaceholder() {
  return (
    <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.04] to-teal-400/[0.05] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
        Tulossa myöhemmin
      </div>

      <h3 className="mt-5 text-3xl font-black tracking-[-0.04em] text-white">
        Maksullinen versio ja ostopolku
      </h3>

      <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-300">
        Tähän voidaan lisätä myöhemmin selkeä pakettiesittely, hinnat,
        kuukausitilaus, kertamaksu tai kokeiluversio. Nyt keskitytään siihen,
        että perusta näyttää vahvalta ja tuote tuntuu valmiilta käyttää.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200">
          Ilmainen aloitus
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200">
          Pro-versio
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200">
          Yritysratkaisut myöhemmin
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(45,212,191,0.14),transparent_26%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.10),transparent_24%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <header className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-6 md:px-6">
          <DuuniharavaLogo />

          <nav className="hidden items-center gap-6 md:flex">
            <NavLink href="#miten-toimii">Miten toimii</NavLink>
            <NavLink href="#hyodyt">Hyödyt</NavLink>
            <NavLink href="#kenelle">Kenelle</NavLink>
            <NavLink href="#hinnoittelu">Hinnoittelu</NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <SecondaryButton href="/studio">Avaa studio</SecondaryButton>
            <PrimaryButton href="/signup">Luo tili</PrimaryButton>
          </div>
        </header>

        <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 md:px-6 md:pb-24 md:pt-16">
          <div className="grid gap-12 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
            <div className="max-w-4xl">
              <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
                Suunniteltu työnhakuun Suomessa
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-[-0.06em] text-white md:text-6xl md:leading-[0.96]">
                Työnhaku ilman kaaosta.
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                  CV, työpaikat ja hakemukset yhdessä paikassa.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 md:text-lg">
                Duuniharava auttaa rakentamaan paremman CV:n, löytämään sopivia
                työpaikkoja ja kirjoittamaan niihin kohdistetut hakemukset
                yhdestä selkeästä näkymästä. Vähemmän säätöä, enemmän osuvia
                hakemuksia.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryButton href="/signup">Aloita ilmaiseksi</PrimaryButton>
                <SecondaryButton href="/studio">Tutustu studioon</SecondaryButton>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-300">
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                  CV-generaattori
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                  Työpaikkaehdotukset
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                  Personoidut hakemukset
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                  PDF + DOCX
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <StatCard
                value="1 paikka"
                label="Kaikki yhdessä näkymässä"
                description="CV, työpaikat, hakemukset ja seuranta samassa työtilassa."
              />
              <StatCard
                value="3 vaihetta"
                label="Helppo aloittaa"
                description="Täytä tiedot, valitse työpaikka, luo valmis hakemus."
              />
              <StatCard
                value="Selkeä"
                label="Myös aloittelijalle"
                description="Rakennettu niin, että käyttäjä ymmärtää mitä tehdä seuraavaksi."
              />
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <SectionTitle
          eyebrow="Ongelma"
          title="Työnhaku on monelle sekava, hidas ja turhauttava"
          description="CV on yhdessä tiedostossa, hakemuspohjat toisessa, työpaikkalinkit hukassa ja jokainen hakemus pitää räätälöidä käsin. Duuniharava kokoaa tämän prosessin yhteen selkeään järjestelmään."
          center
        />

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <ProblemCard
            title="Liikaa käsityötä"
            description="Saman tiedon kopiointi eri dokumentteihin vie aikaa ja syö motivaatiota."
          />
          <ProblemCard
            title="Vaikea pysyä kärryillä"
            description="On helppo unohtaa mihin on jo hakenut, mikä deadline lähestyy ja mikä paikka oli oikeasti kiinnostava."
          />
          <ProblemCard
            title="Hakemukset jäävät geneerisiksi"
            description="Ilman hyvää rakennetta CV ja hakemus eivät tunnu kohdistetuilta juuri siihen työpaikkaan."
          />
        </div>
      </section>

      <section
        id="miten-toimii"
        className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24"
      >
        <SectionTitle
          eyebrow="Miten toimii"
          title="Kolme vaihetta ja olet paljon pidemmällä"
          description="Duuniharava on suunniteltu niin, että eteneminen on loogista ja helppoa myös ensimmäistä kertaa käyttävälle."
          center
        />

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <StepCard
            step="Vaihe 1"
            title="Täytä oma tausta"
            description="Lisää nimi, kokemus, taidot, koulutus, kielet ja tavoiteltu työ. Voit myös tuoda nykyisen CV:n parannettavaksi."
          />
          <StepCard
            step="Vaihe 2"
            title="Etsi sopivat paikat"
            description="Kerro millaisia töitä etsit, millä alueella ja millaisella työajalla. Näin ehdotukset osuvat paremmin."
          />
          <StepCard
            step="Vaihe 3"
            title="Luo osuvat hakemukset"
            description="Valitse työpaikka ja tee siihen sopiva CV-versio sekä hakemus yhdestä näkymästä."
          />
        </div>
      </section>

      <section
        id="hyodyt"
        className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24"
      >
        <SectionTitle
          eyebrow="Hyödyt"
          title="Rakennettu oikeaan käyttöön, ei vain näyttämään hyvältä"
          description="Duuniharava ei ole pelkkä CV-editori. Se on kokonainen työnhaun työtila, jossa sisältö, seuranta ja selkeys tukevat toisiaan."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          <FeatureCard
            title="Parempi CV"
            description="Muokkaa sisältöä ja ulkoasua helposti ilman, että koko dokumentti pitää rakentaa joka kerta alusta."
            bullets={[
              "Luo uusi CV tai paranna nykyistä",
              "Säädä tyyliä, värejä ja rakennetta",
              "Vie valmiiksi PDF- ja DOCX-muotoon",
            ]}
          />

          <FeatureCard
            title="Fiksumpi työnhaku"
            description="Pidä työpaikat, prioriteetit ja deadlinet hallinnassa yhdessä näkymässä."
            bullets={[
              "Tallenna kiinnostavat paikat",
              "Seuraa statuksia ja deadlineja",
              "Merkitse suosikit ja muistiinpanot",
            ]}
          />

          <FeatureCard
            title="Osuvammat hakemukset"
            description="Kun CV ja työpaikkailmoitus ovat samassa työtilassa, hakemuksesta tulee helpommin kohdistettu."
            bullets={[
              "Valitse sävy työpaikan mukaan",
              "Luo työpaikkakohtainen hakemus",
              "Tee halutessasi erillinen CV-versio samaan paikkaan",
            ]}
          />
        </div>
      </section>

      <section
        id="kenelle"
        className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24"
      >
        <SectionTitle
          eyebrow="Kenelle tämä on"
          title="Duuniharava sopii erityisesti näille käyttäjille"
          description="Palvelu toimii laajasti eri työnhakijoille, mutta etenkin niille, jotka haluavat nopeuttaa hakemista ja saada prosessiin rakennetta."
          center
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AudienceCard
            title="Ensimmäistä työpaikkaa hakeva"
            description="Selkeä eteneminen auttaa hahmottamaan koko työnhaun ilman, että pitää jo valmiiksi osata kaikkea."
          />
          <AudienceCard
            title="Aktiivinen työnhakija"
            description="Kun hakuja on paljon samaan aikaan, seuranta ja järjestys muuttuvat todella tärkeiksi."
          />
          <AudienceCard
            title="Alanvaihtaja"
            description="CV:n ja hakemusten kohdistaminen uuteen suuntaan on helpompaa, kun kokonaisuus on yhdessä paikassa."
          />
          <AudienceCard
            title="Keikka- ja asiakaspalvelutyötä hakeva"
            description="Nopea tapa tehdä siisti CV ja useita hakemuksia eri paikkoihin ilman jatkuvaa alusta aloittamista."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="rounded-[36px] border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-teal-950/40 p-8 shadow-[0_25px_100px_rgba(0,0,0,0.35)] md:p-12">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
              Valmis aloittamaan?
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-white md:text-5xl">
              Tee työnhausta selkeämpi jo tänään.
            </h2>

            <p className="mt-5 text-base leading-8 text-zinc-300 md:text-lg">
              Luo tili, avaa studio ja rakenna työnhaku yhdelle selkeälle
              pohjalle. Tämä on vasta alku — myöhemmin mukaan voidaan lisätä
              maksulliset ominaisuudet, profiilit ja laajempi automaatio.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryButton href="/signup">Luo tili</PrimaryButton>
              <SecondaryButton href="/studio">Avaa studio</SecondaryButton>
            </div>
          </div>
        </div>
      </section>

      <section
        id="hinnoittelu"
        className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24"
      >
        <PricingPlaceholder />
      </section>

      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 md:px-6">
        <div className="flex flex-col gap-6 rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-6 md:flex-row md:items-center md:justify-between">
          <DuuniharavaLogo compact />

          <div className="flex flex-wrap gap-5 text-sm text-zinc-400">
            <Link href="/" className="transition hover:text-white">
              Etusivu
            </Link>
            <Link href="/signup" className="transition hover:text-white">
              Luo tili
            </Link>
            <Link href="/studio" className="transition hover:text-white">
              Studio
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}