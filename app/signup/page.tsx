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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Luo tili</h1>
      <form onSubmit={onSubmit} className="max-w-md space-y-3">
        <input className="w-full rounded p-2 text-black" placeholder="Nimi" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="w-full rounded p-2 text-black" type="email" placeholder="Sähköposti" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full rounded p-2 text-black" type="password" placeholder="Salasana" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button disabled={loading} className="rounded bg-teal-400 px-4 py-2 text-black font-bold">
          {loading ? "Luodaan..." : "Luo tili"}
        </button>
      </form>
      {error && <p className="mt-3 text-red-300">{error}</p>}
      <p className="mt-4">Onko tili? <Link className="text-teal-300" href="/login">Kirjaudu</Link></p>
    </main>
  );
}
