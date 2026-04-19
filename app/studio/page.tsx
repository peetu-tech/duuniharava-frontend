"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearSession, getSession } from "../../lib/supabaseAuth";

export default function StudioPage() {
  const router = useRouter();
  const hasSession = typeof window !== "undefined" && !!getSession()?.access_token;

  useEffect(() => {
    if (!hasSession) router.replace("/login");
  }, [hasSession, router]);

  if (!hasSession) return <main className="min-h-screen bg-zinc-950 text-white p-6">Tarkistetaan kirjautumista...</main>;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Studio</h1>
        <button
          className="rounded border px-3 py-2"
          onClick={() => {
            clearSession();
            router.push("/login");
          }}
        >
          Kirjaudu ulos
        </button>
      </div>
      <p className="mt-4 text-zinc-300">Kirjautuminen toimii. Studio aukeaa vain sessiolla.</p>
    </main>
  );
}
