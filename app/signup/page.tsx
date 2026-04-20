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
    <main className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Tausta-efektit kuten etusivulla */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.15),transparent_25%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_25%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.10),transparent_25%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_40%,rgba(0,0,0,0.2))] pointer-events-none" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg items-center px-4 py-10 md:px-6">
        <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.045] p-6 sm:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-zinc-300">
              Uusi käyttäjä
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Luo tili</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400">Aloita Duuniharavan käyttö muutamassa sekunnissa.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300 ml-1">Nimi</label>
              <input
                type="text"
                placeholder="Esim. Matti Meikäläinen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-blue-500/50 focus:bg-black/40"
              />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300 ml-1">Sähköposti</label>
              <input
                type="email"
                placeholder="oma@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-blue-500/50 focus:bg-black/40"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300 ml-1">Salasana</label>
              <input
                type="password"
                placeholder="Vähintään 6 merkkiä"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-blue-500/50 focus:bg-black/40"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {loading ? "Luodaan tiliä..." : "Luo tili"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-900/50 bg-red-500/10 p-4 text-center text-sm font-medium text-red-400">
              {error}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-zinc-400">
            Onko sinulla jo tili?{" "}
            <Link href="/login" className="font-semibold text-white transition hover:text-zinc-300 underline underline-offset-4 decoration-white/30">
              Kirjaudu sisään
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
