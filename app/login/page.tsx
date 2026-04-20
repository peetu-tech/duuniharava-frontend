"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithPassword } from "../../lib/supabaseAuth";

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
    <main className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Tausta-efektit kuten etusivulla */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_30%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.12),transparent_30%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_40%,rgba(0,0,0,0.2))] pointer-events-none" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 md:px-6">
        <div className="grid w-full gap-10 lg:grid-cols-2 lg:items-center">
          
          {/* Vasen puoli: Tervetuloa-teksti */}
          <section className="max-w-xl">
            <div className="mb-5 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-zinc-300 backdrop-blur-sm">
              Kirjaudu sisään
            </div>
            <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.05]">
              Tervetuloa takaisin Duuniharavaan.
            </h1>
            <p className="mt-6 text-base sm:text-lg leading-7 text-zinc-300">
              Jatka CV:n muokkausta, työpaikkaseurantaa ja hakemuksia samasta työtilasta. Tekoäly on valmiina auttamaan.
            </p>
          </section>

          {/* Oikea puoli: Kirjautumislomake */}
          <section className="rounded-[32px] border border-white/10 bg-white/[0.045] p-6 sm:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300 ml-1">
                  Sähköposti
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-blue-500/50 focus:bg-black/40"
                  placeholder="oma@email.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300 ml-1">
                  Salasana
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-blue-500/50 focus:bg-black/40"
                  placeholder="Salasana"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {loading ? "Kirjaudutaan..." : "Kirjaudu sisään"}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-900/50 bg-red-500/10 p-4 text-center text-sm font-medium text-red-400">
                {error}
              </div>
            )}

            <p className="mt-6 text-center text-sm text-zinc-400">
              Ei vielä tiliä?{" "}
              <Link href="/signup" className="font-semibold text-white transition hover:text-zinc-300 underline underline-offset-4 decoration-white/30">
                Luo uusi tili
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
