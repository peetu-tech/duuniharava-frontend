"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp } from "../../lib/supabaseAuth";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const session = await signUp(email, password, name);
      router.push(session ? "/studio" : "/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tilin luonti epäonnistui.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white relative overflow-hidden font-sans">
      {/* Tausta-efektit etusivulta */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,191,166,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,111,60,0.1),transparent_30%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_40%,rgba(0,0,0,0.3))] pointer-events-none" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 md:px-6">
        <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          
          {/* Vasen puoli */}
          <section className="max-w-xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#00BFA6] backdrop-blur-sm">
              Uusi käyttäjä
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05]">
              Luo tili
            </h1>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-gray-400">
              Aloita Duuniharavan käyttö muutamassa sekunnissa. Tallenna CV:si, hallinnoi hakuja ja hyödynnä tekoälyä urallasi.
            </p>
          </section>

          {/* Oikea puoli: Kirjautumislomake */}
          <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 sm:p-12 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:border-white/20">
            <form className="space-y-6" onSubmit={onSubmit}>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-400 ml-1">
                  Nimi
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0F0F0F] px-5 py-4 text-white outline-none transition-all placeholder:text-gray-600 focus:border-[#00BFA6]/50 focus:bg-white/[0.02]"
                  placeholder="Esim. Matti Meikäläinen"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-400 ml-1">
                  Sähköposti
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0F0F0F] px-5 py-4 text-white outline-none transition-all placeholder:text-gray-600 focus:border-[#00BFA6]/50 focus:bg-white/[0.02]"
                  placeholder="oma@email.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-400 ml-1">
                  Salasana
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0F0F0F] px-5 py-4 text-white outline-none transition-all placeholder:text-gray-600 focus:border-[#00BFA6]/50 focus:bg-white/[0.02]"
                  placeholder="Vähintään 6 merkkiä"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] px-5 py-4 text-base font-black text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(0,191,166,0.3)]"
                >
                  {loading ? "Luodaan tiliä..." : "LUO TILI"}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-900/50 bg-red-500/10 p-4 text-center text-sm font-bold text-red-400 backdrop-blur-md">
                {error}
              </div>
            )}

            <p className="mt-8 text-center text-sm font-medium text-gray-500">
              Onko sinulla jo tili?{" "}
              <Link href="/login" className="font-bold text-white transition hover:text-[#00BFA6] underline underline-offset-4 decoration-white/20 hover:decoration-[#00BFA6]">
                Kirjaudu sisään
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
