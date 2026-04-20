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
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 md:px-6">
        <div className="grid w-full gap-8 lg:grid-cols-2">
          <section>
            <p className="inline-flex rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-300">
              Kirjaudu sisään
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight">
              Tervetuloa takaisin Duuniharavaan
            </h1>
            <p className="mt-4 text-zinc-300">
              Jatka CV:n muokkausta, työpaikkaseurantaa ja hakemuksia samasta työtilasta.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <form className="space-y-4" onSubmit={onSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm text-zinc-300">Sähköposti</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 outline-none focus:border-teal-400/40"
                  placeholder="oma@email.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-zinc-300">Salasana</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 outline-none focus:border-teal-400/40"
                  placeholder="Salasana"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-teal-400 px-4 py-2.5 font-bold text-black transition hover:bg-teal-300 disabled:opacity-70"
              >
                {loading ? "Kirjaudutaan..." : "Kirjaudu"}
              </button>
            </form>

            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

            <p className="mt-4 text-sm text-zinc-400">
              Ei vielä tiliä?{" "}
              <Link href="/signup" className="font-semibold text-teal-300 hover:text-teal-200">
                Luo tili
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
