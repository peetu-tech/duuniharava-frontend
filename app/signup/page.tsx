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
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 md:px-6">
        <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <h1 className="text-3xl font-black tracking-tight">Luo tili</h1>
          <p className="mt-2 text-zinc-400">Aloita Duuniharavan käyttö muutamassa sekunnissa.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <input
              type="text"
              placeholder="Nimi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 outline-none focus:border-teal-400/40"
            />
            <input
              type="email"
              placeholder="Sähköposti"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 outline-none focus:border-teal-400/40"
            />
            <input
              type="password"
              placeholder="Salasana"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 outline-none focus:border-teal-400/40"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-teal-400 px-4 py-2.5 font-bold text-black transition hover:bg-teal-300 disabled:opacity-70"
            >
              {loading ? "Luodaan tiliä..." : "Luo tili"}
            </button>
          </form>

          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

          <p className="mt-4 text-sm text-zinc-400">
            Onko sinulla jo tili?{" "}
            <Link href="/login" className="font-semibold text-teal-300 hover:text-teal-200">
              Kirjaudu
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
