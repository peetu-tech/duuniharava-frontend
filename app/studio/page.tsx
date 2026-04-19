"use client";

import { useMemo, useRef, useState } from "react";

type ParsedCv = {
  cvBody: string;
  fullName: string;
  title: string;
};

function PdfSafePreview({ cvText, name, title }: { cvText: string; name: string; title: string }) {
  return (
    <div
      style={{
        width: "794px",
        minHeight: "1123px",
        background: "#ffffff",
        color: "#111827",
        fontFamily: "Arial, sans-serif",
        padding: "48px",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "30px" }}>{name || "Nimi puuttuu"}</h1>
      <p style={{ marginTop: "6px", color: "#374151", fontSize: "16px" }}>{title || "Titteli puuttuu"}</p>

      <h2 style={{ marginTop: "28px", fontSize: "18px" }}>CV</h2>
      <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, marginTop: "8px", fontSize: "14px" }}>
        {cvText || "Kirjoita CV-teksti tähän oikealle puolelle."}
      </p>
    </div>
  );
}

export default function StudioPage() {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [cvBody, setCvBody] = useState("");

  const pdfRef = useRef<HTMLDivElement | null>(null);

  const parsedCv = useMemo<ParsedCv>(
    () => ({
      cvBody,
      fullName,
      title: role,
    }),
    [cvBody, fullName, role],
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <h1 className="text-3xl font-black tracking-tight">Duuniharava Studio</h1>
        <p className="mt-2 text-zinc-400">Muokkaa CV:tä ja pidä PDF-turvallinen esikatselu aina mukana.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-xl font-bold">CV-editori</h2>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-zinc-300">Nimi</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-teal-400/40"
                  placeholder="Esim. Maija Meikäläinen"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-zinc-300">Titteli</span>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-teal-400/40"
                  placeholder="Esim. Frontend Developer"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-zinc-300">CV-teksti</span>
                <textarea
                  value={cvBody}
                  onChange={(e) => setCvBody(e.target.value)}
                  className="min-h-[260px] w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-teal-400/40"
                  placeholder="Kirjoita tähän CV:n sisältö..."
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-xl font-bold">Esikatselu</h2>
            <div className="mt-4 rounded-xl bg-white p-4 text-black">
              <PdfSafePreview cvText={parsedCv.cvBody} name={parsedCv.fullName} title={parsedCv.title} />
            </div>
          </section>
        </div>

        <div
          style={{
            position: "fixed",
            left: "-99999px",
            top: 0,
            width: "794px",
            pointerEvents: "none",
            opacity: 1,
            zIndex: -1,
          }}
        >
          <div ref={pdfRef}>
            <PdfSafePreview cvText={parsedCv.cvBody} name={parsedCv.fullName} title={parsedCv.title} />
          </div>
        </div>
      </div>
    </main>
  );
}
