"use client";

import Link from "next/link";
import { useState } from "react";

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
            stroke="url(#duuniGradSignup)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 14v36"
            stroke="url(#duuniGradSignup)"
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
            <linearGradient
              id="duuniGradSignup"
              x1="10"
              y1="10"
              x2="52"
              y2="52"
            >
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

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert("Tilinluonti liitetään seuraavaksi oikeaan tunnistautumiseen.");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(45,212,191,0.14),transparent_26%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.10),transparent_24%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-6 md:px-6">
          <Link href="/">
            <DuuniharavaLogo />
          </Link>

          <Link
            href="/login"
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
          >
            Kirjaudu
          </Link>
        </div>

        <section className="relative mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-10 px-4 py-10 md:px-6 lg:grid-cols-[1fr_520px]">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
              Aloita helposti
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white md:text-6xl md:leading-[0.98]">
              Luo tili ja rakenna työnhaku yhdelle selkeälle alustalle.
            </h1>

            <p className="mt-6 text-base leading-8 text-zinc-300 md:text-lg">
              Duuniharava auttaa sinua tekemään uskottavan CV:n, löytämään sopivia
              töitä ja kirjoittamaan parempia hakemuksia ilman sekavaa prosessia.
            </p>

            <div className="mt-8 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-zinc-300">
                Luo CV tai paranna vanhaa versiota
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-zinc-300">
                Etsi työpaikkoja profiilisi perusteella
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-zinc-300">
                Tallenna hakemukset ja seuraa etenemistä
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-2xl md:p-8">
            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                Tilinluonti
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-white">
                Luo uusi tili
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Tästä alkaa ensimmäinen versio. Oikea rekisteröityminen liitetään
                seuraavassa vaiheessa.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-200">
                  Nimi
                </label>
                <input
                  type="text"
                  placeholder="Etu- ja sukunimi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-teal-400/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-200">
                  Sähköposti
                </label>
                <input
                  type="email"
                  placeholder="oma@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-teal-400/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-200">
                  Salasana
                </label>
                <input
                  type="password"
                  placeholder="Valitse salasana"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-teal-400/40"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-teal-400 px-5 py-3.5 font-semibold text-black transition hover:bg-teal-300"
              >
                Luo tili
              </button>
            </form>

            <p className="mt-6 text-sm text-zinc-400">
              Onko sinulla jo tili?{" "}
              <Link href="/login" className="font-medium text-teal-300 hover:text-teal-200">
                Kirjaudu tästä
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}