"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, getSession } from "../../lib/supabaseAuth";

type Tab = "cv" | "job" | "letter";

type JobItem = {
  id: string;
  title: string;
  company: string;
  status: "saved" | "applied" | "interview";
  notes: string;
};

type SavedLetter = {
  id: string;
  jobId: string;
  content: string;
  createdAt: string;
};

const STORAGE_KEY = "duuniharava_studio_v1";

type StudioState = {
  tab: Tab;
  name: string;
  title: string;
  profile: string;
  experience: string;
  skills: string;
  jobs: JobItem[];
  activeJobId: string;
  letterDraft: string;
  savedLetters: SavedLetter[];
};

const initialStudioState: StudioState = {
  tab: "cv",
  name: "",
  title: "",
  profile: "",
  experience: "",
  skills: "",
  jobs: [],
  activeJobId: "",
  letterDraft: "",
  savedLetters: [],
};

function loadInitialState(): StudioState {
  if (typeof window === "undefined") return initialStudioState;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return initialStudioState;

  try {
    const parsed = JSON.parse(raw);
    return {
      tab: parsed.tab ?? "cv",
      name: parsed.name ?? "",
      title: parsed.title ?? "",
      profile: parsed.profile ?? "",
      experience: parsed.experience ?? "",
      skills: parsed.skills ?? "",
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      activeJobId: parsed.activeJobId ?? "",
      letterDraft: parsed.letterDraft ?? "",
      savedLetters: Array.isArray(parsed.savedLetters) ? parsed.savedLetters : [],
    };
  } catch {
    return initialStudioState;
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function PdfSafePreview({
  name,
  title,
  profile,
  experience,
  skills,
}: {
  name: string;
  title: string;
  profile: string;
  experience: string;
  skills: string;
}) {
  return (
    <div
      style={{
        width: "794px",
        minHeight: "1123px",
        background: "#fff",
        color: "#111827",
        fontFamily: "Arial, sans-serif",
        padding: "46px",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "34px" }}>{name || "Nimi puuttuu"}</h1>
      <p style={{ marginTop: 4, fontSize: "16px", color: "#4b5563" }}>{title || "Titteli puuttuu"}</p>

      <h2 style={{ marginTop: 28, fontSize: "17px" }}>Profiili</h2>
      <p style={{ marginTop: 8, lineHeight: 1.5 }}>{profile || "Kirjoita lyhyt profiili."}</p>

      <h2 style={{ marginTop: 24, fontSize: "17px" }}>Työkokemus</h2>
      <p style={{ marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{experience || "Lisää työkokemus."}</p>

      <h2 style={{ marginTop: 24, fontSize: "17px" }}>Taidot</h2>
      <p style={{ marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{skills || "Lisää taidot."}</p>
    </div>
  );
}

export default function StudioPage() {
  const router = useRouter();
  const initial = loadInitialState();

  const [tab, setTab] = useState<Tab>(initial.tab);
  const [name, setName] = useState(initial.name);
  const [title, setTitle] = useState(initial.title);
  const [profile, setProfile] = useState(initial.profile);
  const [experience, setExperience] = useState(initial.experience);
  const [skills, setSkills] = useState(initial.skills);

  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [jobNotes, setJobNotes] = useState("");
  const [jobs, setJobs] = useState<JobItem[]>(initial.jobs);
  const [activeJobId, setActiveJobId] = useState(initial.activeJobId);

  const [letterDraft, setLetterDraft] = useState(initial.letterDraft);
  const [savedLetters, setSavedLetters] = useState<SavedLetter[]>(initial.savedLetters);

  const pdfRef = useRef<HTMLDivElement | null>(null);
  const hasSession = typeof window !== "undefined" && !!getSession()?.access_token;

  useEffect(() => {
    if (!hasSession) router.replace("/login");
  }, [hasSession, router]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tab,
        name,
        title,
        profile,
        experience,
        skills,
        jobs,
        activeJobId,
        letterDraft,
        savedLetters,
      }),
    );
  }, [tab, name, title, profile, experience, skills, jobs, activeJobId, letterDraft, savedLetters]);

  const activeJob = useMemo(() => jobs.find((j) => j.id === activeJobId) || null, [jobs, activeJobId]);

  if (!hasSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-950 text-white">
        <p className="text-zinc-300">Tarkistetaan kirjautumista...</p>
      </main>
    );
  }

  function addJob() {
    if (!jobTitle.trim() && !jobCompany.trim()) return;
    const item: JobItem = {
      id: makeId(),
      title: jobTitle.trim(),
      company: jobCompany.trim(),
      status: "saved",
      notes: jobNotes.trim(),
    };
    setJobs((prev) => [item, ...prev]);
    setActiveJobId(item.id);
    setJobTitle("");
    setJobCompany("");
    setJobNotes("");
  }

  function saveLetter() {
    if (!activeJob || !letterDraft.trim()) return;
    setSavedLetters((prev) => [
      {
        id: makeId(),
        jobId: activeJob.id,
        content: letterDraft.trim(),
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Duuniharava Studio</h1>
            <p className="mt-1 text-sm text-zinc-400">CV, työpaikat ja hakemukset samassa näkymässä.</p>
          </div>
          <button
            onClick={() => {
              clearSession();
              router.push("/login");
            }}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
          >
            Kirjaudu ulos
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {(["cv", "job", "letter"] as Tab[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                tab === key ? "bg-white text-black" : "border border-white/10 bg-white/5 text-white"
              }`}
            >
              {key === "cv" ? "CV" : key === "job" ? "Työpaikat" : "Hakemukset"}
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {tab === "cv" && (
            <>
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-xl font-bold">CV-editori</h2>
                <div className="mt-4 space-y-3">
                  <input className="w-full rounded-xl bg-zinc-900 px-3 py-2" placeholder="Nimi" value={name} onChange={(e) => setName(e.target.value)} />
                  <input className="w-full rounded-xl bg-zinc-900 px-3 py-2" placeholder="Titteli" value={title} onChange={(e) => setTitle(e.target.value)} />
                  <textarea className="min-h-[100px] w-full rounded-xl bg-zinc-900 px-3 py-2" placeholder="Profiili" value={profile} onChange={(e) => setProfile(e.target.value)} />
                  <textarea className="min-h-[140px] w-full rounded-xl bg-zinc-900 px-3 py-2" placeholder="Työkokemus" value={experience} onChange={(e) => setExperience(e.target.value)} />
                  <textarea className="min-h-[100px] w-full rounded-xl bg-zinc-900 px-3 py-2" placeholder="Taidot" value={skills} onChange={(e) => setSkills(e.target.value)} />
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-xl font-bold">Esikatselu</h2>
                <div className="mt-4 overflow-auto rounded-xl bg-white p-3 text-black">
                  <PdfSafePreview name={name} title={title} profile={profile} experience={experience} skills={skills} />
                </div>
              </section>
            </>
          )}

          {tab === "job" && (
            <>
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-xl font-bold">Lisää työpaikka</h2>
                <div className="mt-4 space-y-3">
                  <input className="w-full rounded-xl bg-zinc-900 px-3 py-2" placeholder="Työpaikan otsikko" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                  <input className="w-full rounded-xl bg-zinc-900 px-3 py-2" placeholder="Yritys" value={jobCompany} onChange={(e) => setJobCompany(e.target.value)} />
                  <textarea className="min-h-[120px] w-full rounded-xl bg-zinc-900 px-3 py-2" placeholder="Muistiinpanot" value={jobNotes} onChange={(e) => setJobNotes(e.target.value)} />
                  <button onClick={addJob} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold">Lisää työpaikka</button>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-xl font-bold">Työpaikkalista</h2>
                <div className="mt-4 space-y-3">
                  {jobs.length === 0 && <p className="text-zinc-400">Ei työpaikkoja vielä.</p>}
                  {jobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => setActiveJobId(job.id)}
                      className={`block w-full rounded-xl border p-3 text-left ${
                        activeJobId === job.id ? "border-blue-500 bg-blue-950/30" : "border-white/10 bg-black/20"
                      }`}
                    >
                      <p className="font-semibold">{job.title || "Nimetön"}</p>
                      <p className="text-sm text-zinc-400">{job.company || "Yritys puuttuu"}</p>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {tab === "letter" && (
            <>
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-xl font-bold">Hakemus</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Valittu työpaikka: {activeJob ? `${activeJob.title} · ${activeJob.company}` : "Ei valittua työpaikkaa"}
                </p>
                <textarea
                  className="mt-4 min-h-[260px] w-full rounded-xl bg-zinc-900 px-3 py-2"
                  placeholder="Kirjoita hakemus tähän..."
                  value={letterDraft}
                  onChange={(e) => setLetterDraft(e.target.value)}
                />
                <button onClick={saveLetter} className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 font-semibold">
                  Tallenna hakemus
                </button>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-xl font-bold">Tallennetut hakemukset</h2>
                <div className="mt-4 space-y-3">
                  {savedLetters.filter((l) => !activeJob || l.jobId === activeJob.id).length === 0 && (
                    <p className="text-zinc-400">Ei tallennettuja hakemuksia.</p>
                  )}
                  {savedLetters
                    .filter((l) => !activeJob || l.jobId === activeJob.id)
                    .map((letter) => (
                      <div key={letter.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <p className="text-xs text-zinc-500">{new Date(letter.createdAt).toLocaleString("fi-FI")}</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm">{letter.content}</p>
                      </div>
                    ))}
                </div>
              </section>
            </>
          )}
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
            <PdfSafePreview name={name} title={title} profile={profile} experience={experience} skills={skills} />
          </div>
        </div>
      </div>
    </main>
  );
}
