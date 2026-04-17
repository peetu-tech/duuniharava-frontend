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

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-teal-400/30 hover:bg-white/[0.06]">
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
    <div className="rounded-[28px] border border-white/10 bg-zinc-950/70 p-6 transition duration-300 hover:-translate-y-1 hover:border-teal-400/30">
      <div className="mb-4 inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300">
        {step}
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-300">{description}</p>
    </div>
  );
}

function StatCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <div className="text-3xl font-black tracking-[-0.04em] text-white">
        {value}
      </div>
      <div className="mt-2 text-sm text-zinc-400">{label}</div>
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
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              Kirjaudu
            </Link>
            <Link
              href="/signup"
              className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Luo tili
            </Link>
          </div>
        </header>

        <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6 md:pb-24 md:pt-14">
          <div className="grid gap-12 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
            <div className="max-w-4xl">
              <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
                Suomalaisen työnhaun selkeä työkalu
              </div>

              <h1 className="mt-6 max-w-5xl text-4xl font-black tracking-[-0.05em] text-white md:text-6xl md:leading-[0.98]">
                Tee työnhausta helpompi, nopeampi ja selkeämpi.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 md:text-lg">
                Duuniharava kokoaa CV:n, työpaikkaehdotukset ja hakemukset samaan
                näkymään. Ei enää kymmentä eri tiedostoa, sekavia muistiinpanoja
                tai loputonta kopiointia.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="rounded-2xl bg-teal-400 px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-teal-300"
                >
                  Aloita ilmaiseksi
                </Link>
                <Link
                  href="/login"
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                >
                  Minulla on jo tili
                </Link>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard value="1 paikka" label="CV:lle, työpaikoille ja hakemuksille" />
                <StatCard value="3 sävyä" label="Hakemuksiin tilanteen mukaan" />
                <StatCard value="PDF + DOCX" label="Valmiit lataukset nopeasti" />
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[32px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                <div className="rounded-[28px] border border-teal-400/20 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <DuuniharavaLogo compact />
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      Valmis työnhakuun
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        CV
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        Selkeä, siisti ja muokattava
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        Luo uusi CV tai paranna vanhaa ja vie se PDF- tai DOCX-muotoon.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        Työpaikat
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        Sopivat ehdotukset yhdellä haulla
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        Suodata, vertaile, tallenna suosikit ja seuraa deadlineja helposti.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        Hakemukset
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        Personoidut hakemukset nopeasti
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        Tee työpaikkaan sopiva hakemus ja muokkaa se valmiiksi ennen lähettämistä.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-16">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
            Miksi Duuniharava?
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-white md:text-4xl">
            Yksi selkeä kokonaisuus työnhakuun.
          </h2>
          <p className="mt-4 text-base leading-8 text-zinc-400">
            Duuniharava on tehty ihmiselle, joka haluaa päästä nopeasti liikkeelle
            ilman epäselvää käyttöä. Jokainen vaihe on rakennettu helposti
            ymmärrettäväksi.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <FeatureCard
            title="Helppo aloittaa"
            description="Täytä tiedot, valitse suunta ja anna työkalun tehdä raskain työ puolestasi."
          />
          <FeatureCard
            title="Selkeä käyttää"
            description="Kaikki tärkeä näkyy yhdellä sivulla. Käyttö ei vaadi teknistä osaamista."
          />
          <FeatureCard
            title="Rakennettu työnhakuun"
            description="CV, työpaikat, hakemukset ja seuranta toimivat yhteen eikä erillisinä palasina."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-16">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
            Näin se toimii
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-white md:text-4xl">
            Kolme selkeää vaihetta.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <StepCard
            step="Vaihe 1"
            title="Rakenna tai paranna CV"
            description="Voit luoda uuden CV:n alusta tai tuoda vanhan version ja tehdä siitä paremman."
          />
          <StepCard
            step="Vaihe 2"
            title="Löydä sopivat työpaikat"
            description="Saat profiilisi perusteella ehdotuksia rooleista, jotka sopivat paremmin taustaasi."
          />
          <StepCard
            step="Vaihe 3"
            title="Tee hakemus valmiiksi"
            description="Valitse työpaikka, generoi hakemus ja viimeistele se ennen lähettämistä."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-6 md:pb-24">
        <div className="rounded-[36px] border border-white/10 bg-gradient-to-br from-teal-400/10 via-cyan-400/5 to-emerald-400/10 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-10">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-teal-300">
              Valmis aloittamaan?
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-white md:text-4xl">
              Tee työnhausta järjestelmällinen ja ammattimainen.
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              Luo tili ja rakenna ensimmäinen CV, työlista ja hakemus samassa
              työtilassa.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Luo tili
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              Kirjaudu sisään
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}