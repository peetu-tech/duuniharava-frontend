"use client";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-400">
            Studio
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
            Duuniharava Studio toimii
          </h1>
          <p className="mt-4 text-zinc-300">
            Tämä on testisivu. Jos build menee nyt läpi, alkuperäinen studio-koodi
            sisälsi rakenteellisen tai näkymättömän tiedosto-ongelman.
          </p>
        </div>
      </div>
    </main>
  );
}