"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithPassword } from "../../lib/supabaseAuth";

const loginHighlights = [
  {
    title: "Jatka siitä mihin jäit",
    description: "CV:t, hakemukset ja tallenteet odottavat samassa työtilassa ilman että sinun täytyy etsiä niitä uudelleen.",
  },
  {
    title: "Työnhaku pysyy kasassa",
    description: "Seuraa kiinnostavia paikkoja, tehtyjä hakemuksia ja seuraavia askeleita yhdestä näkymästä.",
  },
  {
    title: "Tekoäly auttaa käytännössä",
    description: "Muokkaa CV:tä, kirjoita hakemuksia ja viimeistele sisältöä ilman että kaiken tarvitsee alkaa tyhjästä.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithPassword(email, password);
      router.push("/studio");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kirjautuminen epäonnistui.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0F0F0F] font-sans text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,191,166,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,111,60,0.1),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_40%,rgba(0,0,0,0.3))]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 xl:gap-20">
          <section className="max-w-2xl space-y-8 sm:space-y-10">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#00BFA6] backdrop-blur-sm">
              Kirjaudu sisään
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl font-black leading-[0.98] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                Tervetuloa takaisin <span className="text-[#00BFA6]">Duuniharavaan.</span>
              </h1>
              <p className="max-w-xl text-base leading-8 text-gray-300 sm:text-lg sm:leading-9">
                Avaa oma työtila, jatka viimeisintä CV:täsi ja pidä työnhaku rauhallisesti yhdessä paikassa. Mobiilissa tai koneella kaikki jatkuu siitä mihin jäit.
              </p>
            </div>

            <div className="grid gap-4 sm:gap-5">
              {loginHighlights.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md transition-all duration-300 hover:border-[#00BFA6]/35 hover:bg-white/[0.06] sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#00BFA6]/12 text-sm font-black text-[#00BFA6]">
                      0{index + 1}
                    </span>
                    <div className="space-y-2">
                      <p className="text-lg font-black text-white">{item.title}</p>
                      <p className="text-sm leading-7 text-gray-400 sm:text-[15px]">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:border-white/20 sm:p-8 lg:p-10">
            <div className="mb-8 space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#00BFA6]">Avaa työtila</p>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Kirjaudu sisään</h2>
              <p className="text-sm leading-7 text-gray-400 sm:text-base">
                Syötä sähköpostisi ja salasanasi. Sinut viedään suoraan studioon jatkamaan siitä mihin jäit.
              </p>
            </div>

            <form className="space-y-7" onSubmit={onSubmit}>
              <div>
                <label className="mb-3 ml-1 block text-sm font-bold text-gray-300">Sähköposti</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[24px] border border-white/10 bg-[#0F0F0F] px-5 py-4 text-white outline-none transition-all placeholder:text-gray-600 focus:border-[#00BFA6]/50 focus:bg-white/[0.02] sm:px-6 sm:py-5"
                  placeholder="oma@email.com"
                />
              </div>

              <div>
                <label className="mb-3 ml-1 block text-sm font-bold text-gray-300">Salasana</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[24px] border border-white/10 bg-[#0F0F0F] px-5 py-4 text-white outline-none transition-all placeholder:text-gray-600 focus:border-[#00BFA6]/50 focus:bg-white/[0.02] sm:px-6 sm:py-5"
                  placeholder="Salasana"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-[24px] bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] px-5 py-4 text-base font-black text-black shadow-[0_0_20px_rgba(0,191,166,0.3)] transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 sm:px-6 sm:py-5"
                >
                  {loading ? "Kirjaudutaan..." : "KIRJAUDU SISÄÄN"}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-6 rounded-[24px] border border-red-900/50 bg-red-500/10 p-4 text-center text-sm font-bold text-red-300 backdrop-blur-md">
                {error}
              </div>
            )}

            <div className="mt-8 rounded-[24px] border border-white/8 bg-black/20 p-4 text-center sm:p-5">
              <p className="text-sm font-medium text-gray-400">
                Ei vielä tiliä?{" "}
                <Link
                  href="/signup"
                  className="font-bold text-white underline decoration-white/20 underline-offset-4 transition hover:text-[#00BFA6] hover:decoration-[#00BFA6]"
                >
                  Luo uusi tili
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center text-xs font-medium uppercase tracking-[0.18em] text-gray-600">
              Tiedot säilyvät pilvessä ja työ jatkuu samalla tilillä eri laitteilla
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
