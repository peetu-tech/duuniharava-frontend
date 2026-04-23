"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";
import CvPreview, { type CvCustomStyle } from "@/components/CvPreview";
import ProfileImageUpload from "@/components/ProfileImageUpload";
import { clearSession, getSession } from "../../lib/supabaseAuth";

// --- SUPABASE ASETUKSET ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getSupabaseHeaders() {
  const session = getSession();
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${session?.access_token || ""}`,
    "Content-Type": "application/json",
  };
}

// --- TYYPIT JA VAKIOT ---
type ParsedCvResult = {
  score: string;
  report: string[];
  cvBody: string;
};

type Tab = "cv" | "job" | "letter" | "tips";
type CvStyleVariant = "modern" | "classic" | "compact" | "bold";
type LetterTone = "professional" | "warm" | "sales";
type JobStatus =
  | "saved"
  | "interested"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";
type JobPriority = "low" | "medium" | "high";

type JobItem = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  summary: string;
  adText: string;
  url?: string;
  whyFit?: string;
  source?: string;
  matchScore?: number;
  status: JobStatus;
  priority: JobPriority;
  salary?: string;
  appliedAt?: string;
  deadline?: string;
  notes?: string;
  contactPerson?: string;
  contactEmail?: string;
  companyWebsite?: string;
  favorite?: boolean;
  archived?: boolean;
};

type SavedLetter = {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  content: string;
  createdAt: string;
};

type SavedCvVariant = {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  content: string;
  createdAt: string;
};

const STORAGE_KEY = "duuniharava_state_v8";

const emptyForm = {
  cvText: "",
  cvFile: "",
  cvFileName: "",
  name: "",
  phone: "",
  email: "",
  location: "",
  targetJob: "",
  education: "",
  experience: "",
  languages: "",
  skills: "",
  cards: "",
  hobbies: "",
};

const emptySearchProfile = {
  desiredRoles: "",
  desiredLocation: "",
  workType: "",
  shiftPreference: "",
  salaryWish: "",
  keywords: "",
};

const emptyJobForm = {
  title: "",
  company: "",
  location: "",
  type: "",
  summary: "",
  adText: "",
  url: "",
  salary: "",
  appliedAt: "",
  deadline: "",
  notes: "",
  contactPerson: "",
  contactEmail: "",
  companyWebsite: "",
};

const defaultCustomStyles: Record<CvStyleVariant, CvCustomStyle> = {
  modern: {
    sidebarBg: "#0f172a",
    sidebarBg2: "#1e293b",
    sidebarText: "#ffffff",
    mainBg: "#ffffff",
    mainBg2: "#f8fafc",
    mainText: "#111827",
    headingColor: "#475569",
    accentColor: "#0369a1",
    borderRadius: 30,
    sidebarWidth: 280,
    nameSize: 40,
    bodySize: 14,
    lineHeight: 1.6,
    sectionSpacing: 36,
    imageRadius: 24,
    pattern: "none",
    patternOpacity: 5,
    sidebarPattern: "dots",
    sidebarPatternOpacity: 8,
    showSeparators: true,
    fontFamily: "modern",
    layout: "left-sidebar",
    headingAlign: "left",
    tagStyle: "solid",
    imageShape: "circle",
    imagePosition: "left",
    pagePadding: 48,
    headingStyle: "underline",
    mainGradientDirection: "none",
    sidebarGradientDirection: "135deg",
    shadowStyle: "soft",
  },
  classic: {
    sidebarBg: "#f5f5f4",
    sidebarBg2: "#e7e5e4",
    sidebarText: "#111827",
    mainBg: "#ffffff",
    mainBg2: "#ffffff",
    mainText: "#111827",
    headingColor: "#78716c",
    accentColor: "#a16207",
    borderRadius: 0,
    sidebarWidth: 260,
    nameSize: 42,
    bodySize: 14,
    lineHeight: 1.7,
    sectionSpacing: 32,
    imageRadius: 0,
    pattern: "lines",
    patternOpacity: 3,
    sidebarPattern: "none",
    sidebarPatternOpacity: 5,
    showSeparators: true,
    fontFamily: "classic",
    layout: "left-sidebar",
    headingAlign: "center",
    tagStyle: "outline",
    imageShape: "square",
    imagePosition: "center",
    pagePadding: 56,
    headingStyle: "simple",
    mainGradientDirection: "none",
    sidebarGradientDirection: "none",
    shadowStyle: "none",
  },
  compact: {
    sidebarBg: "#f8fafc",
    sidebarBg2: "#f1f5f9",
    sidebarText: "#111827",
    mainBg: "#ffffff",
    mainBg2: "#ffffff",
    mainText: "#111827",
    headingColor: "#64748b",
    accentColor: "#0f766e",
    borderRadius: 16,
    sidebarWidth: 220,
    nameSize: 36,
    bodySize: 13,
    lineHeight: 1.5,
    sectionSpacing: 24,
    imageRadius: 16,
    pattern: "dots",
    patternOpacity: 4,
    sidebarPattern: "none",
    sidebarPatternOpacity: 5,
    showSeparators: false,
    fontFamily: "clean",
    layout: "top-header",
    headingAlign: "left",
    tagStyle: "minimal",
    imageShape: "rounded",
    imagePosition: "left",
    pagePadding: 40,
    headingStyle: "highlight",
    mainGradientDirection: "none",
    sidebarGradientDirection: "none",
    shadowStyle: "none",
  },
  bold: {
    sidebarBg: "#1e1b4b",
    sidebarBg2: "#312e81",
    sidebarText: "#ffffff",
    mainBg: "#ffffff",
    mainBg2: "#f3f4f6",
    mainText: "#111827",
    headingColor: "#4338ca",
    accentColor: "#4f46e5",
    borderRadius: 30,
    sidebarWidth: 300,
    nameSize: 52,
    bodySize: 15,
    lineHeight: 1.6,
    sectionSpacing: 40,
    imageRadius: 24,
    pattern: "intersecting",
    patternOpacity: 5,
    sidebarPattern: "cross",
    sidebarPatternOpacity: 10,
    showSeparators: true,
    fontFamily: "tech",
    layout: "right-sidebar",
    headingAlign: "left",
    tagStyle: "pill",
    imageShape: "blob",
    imagePosition: "right",
    pagePadding: 48,
    headingStyle: "boxed",
    mainGradientDirection: "to bottom",
    sidebarGradientDirection: "135deg",
    shadowStyle: "hard",
  },
};

// --- APUFUNKTIOT ---
function parseCvResult(raw: string): ParsedCvResult {
  const scoreMatch = raw.match(/KUNTOTARKASTUS:\s*([^\n]+)/);
  const reportMatch = raw.match(/MUUTOSRAPORTTI:\s*([\s\S]*?)CV_BODY:/);
  const cvMatch = raw.match(/CV_BODY:\s*([\s\S]*)$/);

  const score = scoreMatch ? scoreMatch[1].trim() : "";
  const report = reportMatch
    ? reportMatch[1]
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/^\d+\.\s*/, ""))
    : [];
  const cvBody = cvMatch ? cvMatch[1].trim() : raw.trim();

  return { score, report, cvBody };
}

function parseCoverLetter(raw: string) {
  const match = raw.match(/HAKEMUS:\s*([\s\S]*)$/);
  return match ? match[1].trim() : raw.trim();
}

function parseTailoredCv(raw: string) {
  const match = raw.match(/CV_BODY:\s*([\s\S]*)$/);
  return match ? match[1].trim() : raw.trim();
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeMatchScore(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return 78;
  return Math.max(1, Math.min(100, Math.round(value)));
}

function normalizeJob(partial: Partial<JobItem>): JobItem {
  return {
    id: partial.id || makeId(),
    title: partial.title || "",
    company: partial.company || "",
    location: partial.location || "",
    type: partial.type || "",
    summary: partial.summary || "",
    adText: partial.adText || "",
    url: partial.url || "",
    whyFit: partial.whyFit || "",
    source: partial.source || "",
    matchScore: safeMatchScore(partial.matchScore),
    status: partial.status || "saved",
    priority: partial.priority || "medium",
    salary: partial.salary || "",
    appliedAt: partial.appliedAt || "",
    deadline: partial.deadline || "",
    notes: partial.notes || "",
    contactPerson: partial.contactPerson || "",
    contactEmail: partial.contactEmail || "",
    companyWebsite: partial.companyWebsite || "",
    favorite: partial.favorite ?? false,
    archived: partial.archived ?? false,
  };
}

function safeJsonParseJobs(text: string): Partial<JobItem>[] {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function daysUntil(dateString?: string) {
  if (!dateString) return null;
  const today = new Date();
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return null;
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatusLabel(status: JobStatus) {
  switch (status) {
    case "saved": return "Tallennettu";
    case "interested": return "Kiinnostava";
    case "applied": return "Haettu";
    case "interview": return "Haastattelu";
    case "offer": return "Tarjous";
    case "rejected": return "Hylätty";
    default: return status;
  }
}

function getPriorityLabel(priority: JobPriority) {
  switch (priority) {
    case "low": return "Matala";
    case "medium": return "Keskitaso";
    case "high": return "Korkea";
    default: return priority;
  }
}

function priorityRank(priority: JobPriority) {
  switch (priority) {
    case "high": return 3;
    case "medium": return 2;
    case "low": return 1;
    default: return 0;
  }
}

// --- KOMPONENTIT ---

function SectionShell({
  step,
  title,
  description,
  action,
  children,
}: {
  step: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10 rounded-[40px] border border-white/10 bg-[#141414] p-8 sm:p-14 shadow-2xl backdrop-blur-xl">
      <div className="mb-10 flex flex-wrap items-start justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <p className="text-[13px] font-black uppercase tracking-[0.24em] text-[#00BFA6]">
            {step}
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-white md:text-[38px]">
            {title}
          </h2>
          {description ? (
            <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-gray-400">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatCard({ title, value, description }: { title: string; value: string; description: string; }) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-[#141414] p-10 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-[#00BFA6]/50 w-full">
      <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-gray-500">
        {title}
      </p>
      <p className="mt-4 text-5xl font-black tracking-tight text-white">
        {value}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}

function InputClass() {
  return "w-full rounded-2xl border border-white/10 bg-black/50 px-6 py-5 text-white text-base outline-none transition-all placeholder:text-gray-600 focus:border-[#00BFA6] focus:ring-1 focus:ring-[#00BFA6]";
}

function TextareaClass(minHeight: string) {
  return `w-full rounded-2xl border border-white/10 bg-black/50 px-6 py-5 text-white text-base outline-none transition-all placeholder:text-gray-600 focus:border-[#00BFA6] focus:ring-1 focus:ring-[#00BFA6] ${minHeight}`;
}

function JobCard({ job, isActive, applicationsCount, cvsCount, onSelect, onRemove, onUpdate, onSparring }: any) {
  const score = safeMatchScore(job.matchScore);
  const daysLeft = daysUntil(job.deadline);

  return (
    <div
      className={`rounded-[30px] border p-8 sm:p-10 transition-all duration-300 ${
        isActive
          ? "border-[#00BFA6]/50 bg-[#00BFA6]/5 shadow-[0_10px_30px_-10px_rgba(0,191,166,0.2)]"
          : "border-white/10 bg-[#141414] hover:border-white/20 hover:-translate-y-1"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {job.source && (
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-300">
                {job.source}
              </span>
            )}
            <span className="rounded-full bg-[#00BFA6]/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#00BFA6]">
              Match {score}%
            </span>
            <span className="rounded-full bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-300">
              {getStatusLabel(job.status)}
            </span>
            <span className="rounded-full bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-300">
              {getPriorityLabel(job.priority)}
            </span>
            {job.favorite && (
              <span className="rounded-full bg-[#FF6F3C]/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#FF6F3C]">
                Suosikki
              </span>
            )}
          </div>

          <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {job.title || "Nimetön työpaikka"}
          </h4>

          <p className="mt-3 text-base text-gray-400">
            {[job.company, job.location, job.type].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onUpdate({ favorite: !job.favorite })}
            className={`flex-1 sm:flex-none rounded-2xl px-6 py-4 text-base font-bold transition-all ${
              job.favorite
                ? "bg-[#FF6F3C] text-white shadow-[0_0_15px_rgba(255,111,60,0.4)] hover:bg-[#FF6F3C]/80"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            {job.favorite ? "★ Suosikki" : "☆ Suosikiksi"}
          </button>

          <button
            type="button"
            onClick={onSelect}
            className={`flex-1 sm:flex-none rounded-2xl px-6 py-4 text-base font-bold transition-all ${
              isActive
                ? "bg-white text-black"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            {isActive ? "Valittu" : "Valitse paikka"}
          </button>

          <button
            type="button"
            onClick={onSparring}
            className="flex-1 sm:flex-none rounded-2xl border border-[#00BFA6]/50 bg-[#00BFA6]/10 px-6 py-4 text-base font-bold text-[#00BFA6] transition hover:bg-[#00BFA6] hover:text-black shadow-[0_0_15px_rgba(0,191,166,0.2)]"
          >
            🎤 Treenaa
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="flex-1 sm:flex-none rounded-2xl border border-red-900/50 bg-red-500/10 px-6 py-4 text-base font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
          >
            Poista
          </button>
        </div>
      </div>

      {job.summary && (
        <p className="mt-6 text-base leading-relaxed text-gray-300 bg-black/30 p-6 rounded-2xl">{job.summary}</p>
      )}

      {job.whyFit && (
        <div className="mt-6 rounded-2xl border border-[#00BFA6]/20 bg-[#00BFA6]/5 p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">
            Miksi sopii
          </p>
          <p className="mt-3 text-base leading-relaxed text-gray-200">{job.whyFit}</p>
        </div>
      )}

      {daysLeft !== null && (
        <div
          className={`mt-6 rounded-2xl border p-5 text-sm font-bold ${
            daysLeft < 0
              ? "border-red-900/50 bg-red-950/30 text-red-300"
              : daysLeft <= 7
              ? "border-[#FF6F3C]/50 bg-[#FF6F3C]/10 text-[#FF6F3C]"
              : "border-white/10 bg-white/5 text-gray-300"
          }`}
        >
          {daysLeft < 0
            ? `Deadline meni ${Math.abs(daysLeft)} päivää sitten`
            : daysLeft === 0
            ? "Deadline on tänään"
            : `Deadline ${daysLeft} päivän päästä`}
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-gray-500">
            Yritys
          </p>
          <p className="mt-3 text-lg font-bold text-white truncate">
            {job.company || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-gray-500">
            Sijainti
          </p>
          <p className="mt-3 text-lg font-bold text-white truncate">
            {job.location || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-gray-500">
            Hakemukset
          </p>
          <p className="mt-3 text-lg font-bold text-white">
            {applicationsCount}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-gray-500">
            CV-versiot
          </p>
          <p className="mt-3 text-lg font-bold text-white">{cvsCount}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-3 block text-sm font-bold text-gray-400 ml-2">Status</label>
          <select
            value={job.status}
            onChange={(e) => onUpdate({ status: e.target.value as JobStatus })}
            className={InputClass()}
          >
            <option value="saved">Tallennettu</option>
            <option value="interested">Kiinnostava</option>
            <option value="applied">Haettu</option>
            <option value="interview">Haastattelu</option>
            <option value="offer">Tarjous</option>
            <option value="rejected">Hylätty</option>
          </select>
        </div>

        <div>
          <label className="mb-3 block text-sm font-bold text-gray-400 ml-2">Prioriteetti</label>
          <select
            value={job.priority}
            onChange={(e) =>
              onUpdate({ priority: e.target.value as JobPriority })
            }
            className={InputClass()}
          >
            <option value="low">Matala</option>
            <option value="medium">Keskitaso</option>
            <option value="high">Korkea</option>
          </select>
        </div>

        <div>
          <label className="mb-3 block text-sm font-bold text-gray-400 ml-2">Hakupäivä</label>
          <input
            type="date"
            value={job.appliedAt || ""}
            onChange={(e) => onUpdate({ appliedAt: e.target.value })}
            className={InputClass()}
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-bold text-gray-400 ml-2">Deadline</label>
          <input
            type="date"
            value={job.deadline || ""}
            onChange={(e) => onUpdate({ deadline: e.target.value })}
            className={InputClass()}
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-bold text-gray-400 ml-2">Palkka</label>
          <input
            value={job.salary || ""}
            onChange={(e) => onUpdate({ salary: e.target.value })}
            placeholder="Esim. 2800–3200 €/kk"
            className={InputClass()}
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-bold text-gray-400 ml-2">
            Yhteyshenkilö
          </label>
          <input
            value={job.contactPerson || ""}
            onChange={(e) => onUpdate({ contactPerson: e.target.value })}
            placeholder="Esim. Rekrytoija"
            className={InputClass()}
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-bold text-gray-400 ml-2">
            Sähköposti
          </label>
          <input
            value={job.contactEmail || ""}
            onChange={(e) => onUpdate({ contactEmail: e.target.value })}
            placeholder="esim. rekry@firma.fi"
            className={InputClass()}
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-bold text-gray-400 ml-2">Yrityksen sivu</label>
          <input
            value={job.companyWebsite || ""}
            onChange={(e) => onUpdate({ companyWebsite: e.target.value })}
            placeholder="https://..."
            className={InputClass()}
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="mb-3 block text-sm font-bold text-gray-400 ml-2">Muistiinpanot</label>
        <textarea
          value={job.notes || ""}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Kirjaa tähän mitä pitää tehdä seuraavaksi, yhteydenotot, fiilikset jne."
          className={TextareaClass("min-h-[140px]")}
        />
      </div>

      {job.url && (
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex w-full sm:w-auto justify-center rounded-2xl border border-[#00BFA6]/30 bg-[#00BFA6]/10 px-8 py-5 text-base font-bold text-[#00BFA6] transition hover:bg-[#00BFA6]/20"
        >
          Avaa alkuperäinen ilmoitus ➔
        </a>
      )}
    </div>
  );
}

// --- PÄÄKOMPONENTTI ---
export default function Home() {
  const router = useRouter();
  
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [mode, setMode] = useState<"improve" | "create">("improve");
  const [tab, setTab] = useState<Tab>("cv");
  const [cvStyle, setCvStyle] = useState<CvStyleVariant>("modern");
  const [letterTone, setLetterTone] = useState<LetterTone>("professional");

  const [loadingCv, setLoadingCv] = useState(false);
  const [loadingLetter, setLoadingLetter] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingTailoredCv, setLoadingTailoredCv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  const [cvResult, setCvResult] = useState("");
  const [letterResult, setLetterResult] = useState("");
  const [letterDraft, setLetterDraft] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [jobFilter, setJobFilter] = useState("");

  const [jobStatusFilter, setJobStatusFilter] = useState<"all" | JobStatus>("all");
  const [jobPriorityFilter, setJobPriorityFilter] = useState<"all" | JobPriority>("all");
  const [jobSort, setJobSort] = useState<"match" | "deadline" | "priority" | "newest" | "company">("newest");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [searchProfile, setSearchProfile] = useState(emptySearchProfile);
  const [jobForm, setJobForm] = useState(emptyJobForm);

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [activeJobId, setActiveJobId] = useState<string>("");

  const [savedLetters, setSavedLetters] = useState<SavedLetter[]>([]);
  const [savedCvVariants, setSavedCvVariants] = useState<SavedCvVariant[]>([]);
  const [customStyles, setCustomStyles] = useState<Record<CvStyleVariant, CvCustomStyle>>(defaultCustomStyles);

  const pdfRef = useRef<HTMLDivElement | null>(null);

  const [sparringJob, setSparringJob] = useState<JobItem | null>(null);
  const [sparringMessage, setSparringMessage] = useState("");
  const [sparringChat, setSparringChat] = useState<{role: "ai" | "user", text: string}[]>([]);
  const [isSparringTyping, setIsSparringTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null); 

  const customStyle = customStyles[cvStyle];

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setHasSession(true);
    setIsAuthChecking(false);

    async function loadDataFromDb() {
      if (!session) return;
      const headers = getSupabaseHeaders();
      const userId = session.user.id;

      try {
        const pRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, { headers });
        if (pRes.status === 401) {
          clearSession();
          router.replace("/login");
          return;
        }
        
        const pData = await pRes.json();
        if (pData && pData.length > 0) {
          const p = pData[0];
          setForm((prev) => ({
            ...prev,
            name: p.full_name || "",
            phone: p.phone || "",
            email: p.email_address || "",
            location: p.location || "",
            targetJob: p.target_job || "",
            education: p.education || "",
            experience: p.experience || "",
            languages: p.languages || "",
            skills: p.skills || "",
            cards: p.cards || "",
            hobbies: p.hobbies || "",
          }));
          if (p.profile_image_url) setProfileImage(p.profile_image_url);
        }

        const jRes = await fetch(`${supabaseUrl}/rest/v1/jobs?user_id=eq.${userId}&order=created_at.desc`, { headers });
        const jData = await jRes.json();
        if (jData && Array.isArray(jData)) {
          setJobs(jData.map((j: any) => normalizeJob({
            id: j.id,
            title: j.title,
            company: j.company,
            location: j.location,
            type: j.type,
            summary: j.summary,
            adText: j.ad_text,
            url: j.url,
            whyFit: j.why_fit,
            source: j.source,
            matchScore: j.match_score,
            status: j.status,
            priority: j.priority,
            salary: j.salary,
            appliedAt: j.applied_at,
            deadline: j.deadline,
            notes: j.notes,
            contactPerson: j.contact_person,
            contactEmail: j.contact_email,
            companyWebsite: j.company_website,
            favorite: j.favorite,
            archived: j.archived
          })));
        }

        const lRes = await fetch(`${supabaseUrl}/rest/v1/saved_letters?user_id=eq.${userId}&order=created_at.desc`, { headers });
        const lData = await lRes.json();
        if (lData && Array.isArray(lData)) {
          setSavedLetters(lData.map((l: any) => ({
            id: l.id,
            jobId: l.job_id,
            jobTitle: l.job_title,
            companyName: l.company_name,
            content: l.content,
            createdAt: l.created_at
          })));
        }

        const cRes = await fetch(`${supabaseUrl}/rest/v1/cv_variants?user_id=eq.${userId}&order=created_at.desc`, { headers });
        const cData = await cRes.json();
        if (cData && Array.isArray(cData)) {
          setSavedCvVariants(cData.map((c: any) => ({
            id: c.id,
            jobId: c.job_id,
            jobTitle: c.job_title,
            companyName: c.company_name,
            content: c.content,
            createdAt: c.created_at
          })));
        }
      } catch (err) {
        console.error("Virhe tietojen latauksessa:", err);
      }
    }
    loadDataFromDb();
  }, [router]);

  useEffect(() => {
    if (isAuthChecking || !hasSession) return;
    const session = getSession();
    if (!session) return;

    const timeout = setTimeout(async () => {
      try {
        await fetch(`${supabaseUrl}/rest/v1/profiles`, {
          method: "POST",
          headers: { ...getSupabaseHeaders(), "Prefer": "resolution=merge-duplicates" },
          body: JSON.stringify({
            id: session.user.id,
            full_name: form.name,
            phone: form.phone,
            email_address: form.email,
            location: form.location,
            target_job: form.targetJob,
            education: form.education,
            experience: form.experience,
            languages: form.languages,
            skills: form.skills,
            cards: form.cards,
            hobbies: form.hobbies,
            profile_image_url: profileImage
          })
        });
      } catch (e) {
        console.error("Profiilin tallennus epäonnistui", e);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [form, profileImage, isAuthChecking, hasSession]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sparringChat, isSparringTyping]);

  const parsedCv = useMemo(() => parseCvResult(cvResult), [cvResult]);
  const parsedLetter = useMemo(
    () => parseCoverLetter(letterResult),
    [letterResult]
  );

  const activeJob = useMemo(
    () => jobs.find((job) => job.id === activeJobId) || null,
    [jobs, activeJobId]
  );

  const activeJobLetters = useMemo(() => {
    if (!activeJob) return [];
    return savedLetters.filter((letter) => letter.jobId === activeJob.id);
  }, [savedLetters, activeJob]);

  const activeJobCvVariants = useMemo(() => {
    if (!activeJob) return [];
    return savedCvVariants.filter((cv) => cv.jobId === activeJob.id);
  }, [savedCvVariants, activeJob]);

  const filteredJobs = useMemo(() => {
    const q = jobFilter.trim().toLowerCase();

    return jobs
      .filter((job) => !job.archived)
      .filter((job) => {
        if (showFavoritesOnly && !job.favorite) return false;
        if (jobStatusFilter !== "all" && job.status !== jobStatusFilter) {
          return false;
        }
        if (jobPriorityFilter !== "all" && job.priority !== jobPriorityFilter) {
          return false;
        }

        if (!q) return true;

        return [
          job.title,
          job.company,
          job.location,
          job.type,
          job.summary,
          job.whyFit,
          job.source,
          job.notes,
          job.contactPerson,
          job.contactEmail,
          job.companyWebsite,
          job.salary,
          job.status,
          job.priority,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        switch (jobSort) {
          case "match":
            return safeMatchScore(b.matchScore) - safeMatchScore(a.matchScore);
          case "deadline": {
            const aDays = daysUntil(a.deadline);
            const bDays = daysUntil(b.deadline);
            if (aDays === null && bDays === null) return 0;
            if (aDays === null) return 1;
            if (bDays === null) return -1;
            return aDays - bDays;
          }
          case "priority":
            return priorityRank(b.priority) - priorityRank(a.priority);
          case "company":
            return a.company.localeCompare(b.company, "fi");
          case "newest":
          default:
            return b.id.localeCompare(a.id);
        }
      });
  }, [
    jobs,
    jobFilter,
    jobStatusFilter,
    jobPriorityFilter,
    jobSort,
    showFavoritesOnly,
  ]);

  const dashboardStats = useMemo(() => {
    const total = jobs.length;
    const applied = jobs.filter((job) => job.status === "applied").length;
    const interview = jobs.filter((job) => job.status === "interview").length;
    const favorites = jobs.filter((job) => job.favorite).length;

    return { total, applied, interview, favorites };
  }, [jobs]);

  function updateField(key: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateSearchProfile(
    key: keyof typeof emptySearchProfile,
    value: string
  ) {
    setSearchProfile((prev) => ({ ...prev, [key]: value }));
  }

  function updateJobForm(key: keyof typeof emptyJobForm, value: string) {
    setJobForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateJob(id: string, patch: Partial<JobItem>) {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? normalizeJob({ ...job, ...patch }) : job
      )
    );

    const session = getSession();
    if (!session) return;

    const dbPatch: any = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.company !== undefined) dbPatch.company = patch.company;
    if (patch.location !== undefined) dbPatch.location = patch.location;
    if (patch.type !== undefined) dbPatch.type = patch.type;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.priority !== undefined) dbPatch.priority = patch.priority;
    if (patch.favorite !== undefined) dbPatch.favorite = patch.favorite;
    if (patch.salary !== undefined) dbPatch.salary = patch.salary;
    if (patch.deadline !== undefined) dbPatch.deadline = patch.deadline || null;
    if (patch.appliedAt !== undefined) dbPatch.applied_at = patch.appliedAt || null;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes;

    fetch(`${supabaseUrl}/rest/v1/jobs?id=eq.${id}`, {
      method: "PATCH",
      headers: getSupabaseHeaders(),
      body: JSON.stringify(dbPatch)
    });
  }

  function updateCustomStyle<K extends keyof CvCustomStyle>(
    key: K,
    value: CvCustomStyle[K]
  ) {
    setCustomStyles((prev) => ({
      ...prev,
      [cvStyle]: {
        ...prev[cvStyle],
        [key]: value,
      },
    }));
  }

  function applyPalette(mainBg: string, mainBg2: string, sidebarBg: string, sidebarBg2: string, accentColor: string, mainText: string, sidebarText: string, headingColor: string) {
    updateCustomStyle("mainBg", mainBg);
    updateCustomStyle("mainBg2", mainBg2);
    updateCustomStyle("sidebarBg", sidebarBg);
    updateCustomStyle("sidebarBg2", sidebarBg2);
    updateCustomStyle("accentColor", accentColor);
    updateCustomStyle("mainText", mainText);
    updateCustomStyle("sidebarText", sidebarText);
    updateCustomStyle("headingColor", headingColor);
  }

  function resetCurrentStyle() {
    setCustomStyles((prev) => ({
      ...prev,
      [cvStyle]: defaultCustomStyles[cvStyle],
    }));
    setMessage("CV-tyylin asetukset palautettu.");
    setTimeout(() => setMessage(""), 2500);
  }

  function clearForm() {
    setForm(emptyForm);
    setSearchProfile(emptySearchProfile);
    setJobForm(emptyJobForm);
    setJobs([]);
    setActiveJobId("");
    setCvResult("");
    setLetterResult("");
    setLetterDraft("");
    setSavedLetters([]);
    setSavedCvVariants([]);
    setMessage("");
    setErrorMessage("");
    setProfileImage("");
    setTab("cv");
    setMode("improve");
    setCvStyle("modern");
    setLetterTone("professional");
    setJobFilter("");
    setJobStatusFilter("all");
    setJobPriorityFilter("all");
    setJobSort("newest");
    setShowFavoritesOnly(false);
    setCustomStyles(defaultCustomStyles);
    localStorage.removeItem(STORAGE_KEY);
  }

  function fillExample() {
    setForm({
      cvText: "",
      cvFile: "",
      cvFileName: "",
      name: "Matti Meikäläinen",
      phone: "040 123 4567",
      email: "matti.meikalainen@esimerkki.fi",
      location: "Tampere",
      targetJob: "Myyntipäällikkö",
      education: "Tampereen Yliopisto | Kauppatieteiden maisteri | 2021\nKallion Lukio | Ylioppilas | 2016",
      experience: "Esimerkki Oy | Avainasiakaspäällikkö | 05/2021 - Nykyinen\n- Vastuussa B2B-myynnistä ja asiakkuuksien kehittämisestä.\n- Kasvatin myyntiä 25% ensimmäisen vuoden aikana.\n\nMyynti Oy | Myyntineuvottelija | 01/2018 - 04/2021\n- Uusasiakashankinta ja asiakaspalvelu.\n- Tiimin paras myyjä 2020.",
      languages: "Suomi (äidinkieli), Englanti (erinomainen), Ruotsi (perusteet)",
      skills: "B2B-myynti, Neuvottelutaidot, CRM-järjestelmät, Tiimityöskentely, Ongelmanratkaisu",
      cards: "B-ajokortti, Ensiapu 1",
      hobbies: "Padel, lukeminen, sijoittaminen",
    });

    setSearchProfile({
      desiredRoles: "Myyntipäällikkö, asiakkuuspäällikkö, myyntineuvottelija",
      desiredLocation: "Pirkanmaa",
      workType: "Kokoaikainen",
      shiftPreference: "Päivätyö",
      salaryWish: "4500 € / kk",
      keywords: "B2B, myynti, tavoitteellinen",
    });

    setMessage("Esimerkkidata lisätty.");
    setErrorMessage("");
    setTimeout(() => setMessage(""), 2500);
  }

  function applyQuickTarget(type: "sales" | "warehouse" | "shorter") {
    setErrorMessage("");
    setMessage("");

    if (type === "sales") {
      updateField("targetJob", "Myyjä");
      updateSearchProfile("desiredRoles", "Myyjä, asiakaspalvelija");
      setMessage("Tavoitetta suunnattu myyntityöhön.");
    }

    if (type === "warehouse") {
      updateField("targetJob", "Varastotyöntekijä");
      updateSearchProfile("desiredRoles", "Varastotyöntekijä, logistiikkatyö");
      setMessage("Tavoitetta suunnattu varastotyöhön.");
    }

    if (type === "shorter") {
      const shorten = (text: string) =>
        text
          .split(/[.!?\n]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 2)
          .join(". ");

      setForm((prev) => ({
        ...prev,
        education: shorten(prev.education),
        experience: shorten(prev.experience),
        skills: shorten(prev.skills),
        cards: shorten(prev.cards),
        hobbies: shorten(prev.hobbies),
      }));
      setMessage("Kenttiä tiivistetty.");
    }

    setTimeout(() => setMessage(""), 2500);
  }

  async function copyText(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(successMessage);
      setTimeout(() => setMessage(""), 2500);
    } catch {
      setErrorMessage("Kopiointi epäonnistui.");
      setTimeout(() => setErrorMessage(""), 2500);
    }
  }

  const downloadPdf = async () => {
    const printContent = document.getElementById("cv-preview");
    if (!printContent) return;

    try {
      setDownloadingPdf(true);
      setMessage("Imuroidaan tyylejä (Tämä voi kestää muutaman sekunnin)...");
      setErrorMessage("");

      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: customStyle.mainBg,
        onclone: (clonedDoc) => {
          let safeCss = "";
          
          for (let i = 0; i < document.styleSheets.length; i++) {
            try {
              const sheet = document.styleSheets[i];
              const rules = sheet.cssRules || sheet.rules;
              for (let j = 0; j < rules.length; j++) {
                let ruleText = rules[j].cssText;
                if (ruleText.includes('oklab') || ruleText.includes('oklch') || ruleText.includes('color-mix')) {
                  ruleText = ruleText.replace(/oklab\([^)]+\)/g, 'rgba(0,0,0,0.8)')
                                     .replace(/oklch\([^)]+\)/g, 'rgba(0,0,0,0.8)')
                                     .replace(/color-mix\([^)]+\)/g, 'rgba(0,0,0,0.8)');
                }
                safeCss += ruleText + "\n";
              }
            } catch (e) {
              // Ignore cross-origin stylesheet reading errors silently
            }
          }

          const originalStyles = clonedDoc.querySelectorAll("style, link[rel='stylesheet']");
          originalStyles.forEach(el => el.remove());

          const newStyle = clonedDoc.createElement("style");
          newStyle.innerHTML = safeCss;
          clonedDoc.head.appendChild(newStyle);
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > pageHeight) {
        // Jos sisältö on liian pitkä, pienennetään automaattisesti yhdelle A4-sivulle!
        const fitRatio = pageHeight / canvas.height;
        const fitWidth = canvas.width * fitRatio;
        const xOffset = (pageWidth - fitWidth) / 2;
        pdf.addImage(imgData, "JPEG", xOffset, 0, fitWidth, pageHeight);
      } else {
        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      }

      pdf.save(`duuniharava-cv-${cvStyle}.pdf`);
      setMessage("PDF ladattu onnistuneesti koneellesi!");
      setTimeout(() => setMessage(""), 3500);

    } catch (error) {
      console.error(error);
      setErrorMessage("Virhe PDF-luonnissa. Yritä ladata sivu uudelleen.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  async function downloadDocx() {
    try {
      const cvText = parsedCv.cvBody;
      if (!cvText) {
        setErrorMessage("Generoi ensin CV ennen DOCX-latausta.");
        return;
      }

      setDownloadingDocx(true);
      setMessage("");
      setErrorMessage("");

      const lines = cvText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: lines.map((line, index) => {
              const isMainTitle = index === 0;
              const isSectionTitle =
                line === line.toUpperCase() ||
                [
                  "Profiili",
                  "Työkokemus",
                  "Koulutus",
                  "Kielitaito",
                  "Taidot",
                  "Kortit ja pätevyydet",
                  "Harrastukset",
                ].includes(line);

              if (isMainTitle) {
                return new Paragraph({
                  heading: HeadingLevel.TITLE,
                  children: [new TextRun({ text: line, bold: true })],
                });
              }

              if (isSectionTitle) {
                return new Paragraph({
                  heading: HeadingLevel.HEADING_2,
                  children: [new TextRun({ text: line, bold: true })],
                });
              }

              return new Paragraph({
                children: [new TextRun(line)],
              });
            }),
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "duuniharava-cv.docx");
      setMessage("DOCX ladattu.");
      setTimeout(() => setMessage(""), 2500);
    } catch (error) {
      console.error(error);
      setErrorMessage("DOCX:n luonti epäonnistui.");
    } finally {
      setDownloadingDocx(false);
    }
  }

  function handleCvFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrorMessage("Vain PDF-tiedostot ovat sallittuja.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((prev) => ({
        ...prev,
        cvFile: event.target?.result as string,
        cvFileName: file.name,
      }));
      setMessage(`Tiedosto ${file.name} ladattu. Voit nyt parannella sitä.`);
      setTimeout(() => setMessage(""), 3000);
    };
    reader.readAsDataURL(file);
  }

  function validateCvForm() {
    if (!form.targetJob.trim()) {
      setErrorMessage("Lisää tavoiteltu työ ennen CV:n generointia.");
      return false;
    }

    if (mode === "improve" && !form.cvFile && !form.cvText.trim()) {
      setErrorMessage("Liitä nykyinen CV (esim. PDF) ennen parannusta.");
      return false;
    }

    if (mode === "create" && !form.name.trim()) {
      setErrorMessage("Lisää nimi ennen uuden CV:n luontia.");
      return false;
    }

    return true;
  }

  function validateJobForm() {
    if (
      !jobForm.title.trim() &&
      !jobForm.company.trim() &&
      !jobForm.adText.trim()
    ) {
      setErrorMessage(
        "Lisää vähintään työpaikan otsikko, yritys tai ilmoituksen teksti."
      );
      return false;
    }
    return true;
  }

  function validateLetterForm() {
    if (!form.targetJob.trim()) {
      setErrorMessage("Lisää tavoiteltu työ ennen hakemuksen generointia.");
      return false;
    }

    if (!activeJob) {
      setErrorMessage("Valitse työpaikka ennen hakemuksen generointia.");
      return false;
    }

    return true;
  }

  function addJob() {
    setMessage("");
    setErrorMessage("");

    if (!validateJobForm()) return;

    const job = normalizeJob({
      id: makeId(),
      title: jobForm.title.trim(),
      company: jobForm.company.trim(),
      location: jobForm.location.trim(),
      type: jobForm.type.trim(),
      summary: jobForm.summary.trim(),
      adText: jobForm.adText.trim(),
      url: jobForm.url.trim(),
      whyFit:
        form.targetJob || searchProfile.desiredRoles
          ? `Sopii profiiliin: ${form.targetJob || searchProfile.desiredRoles}`
          : "",
      source: "Lisätty käsin",
      matchScore: safeMatchScore(82),
      status: "saved",
      priority: "medium",
      salary: jobForm.salary.trim(),
      appliedAt: jobForm.appliedAt.trim(),
      deadline: jobForm.deadline.trim(),
      notes: jobForm.notes.trim(),
      contactPerson: jobForm.contactPerson.trim(),
      contactEmail: jobForm.contactEmail.trim(),
      companyWebsite: jobForm.companyWebsite.trim(),
      favorite: false,
      archived: false,
    });

    setJobs((prev) => [job, ...prev]);
    setActiveJobId(job.id);
    setJobForm(emptyJobForm);
    setMessage("Työpaikka lisätty listaan.");
    setTab("job");
    setTimeout(() => setMessage(""), 2500);

    const session = getSession();
    if (session) {
      fetch(`${supabaseUrl}/rest/v1/jobs`, {
        method: "POST",
        headers: getSupabaseHeaders(),
        body: JSON.stringify({
          id: job.id, user_id: session.user.id, title: job.title, company: job.company, location: job.location,
          type: job.type, summary: job.summary, ad_text: job.adText, url: job.url, why_fit: job.whyFit,
          source: job.source, match_score: job.matchScore, status: job.status, priority: job.priority,
          salary: job.salary, applied_at: job.appliedAt || null, deadline: job.deadline || null, notes: job.notes,
          contact_person: job.contactPerson, contact_email: job.contactEmail, company_website: job.companyWebsite,
          favorite: job.favorite, archived: job.archived
        })
      });
    }
  }

  function removeJob(id: string) {
    const filtered = jobs.filter((job) => job.id !== id);
    setJobs(filtered);

    if (activeJobId === id) {
      setActiveJobId(filtered[0]?.id || "");
    }

    setSavedLetters((prev) => prev.filter((letter) => letter.jobId !== id));
    setSavedCvVariants((prev) => prev.filter((cv) => cv.jobId !== id));

    const session = getSession();
    if (session) {
      fetch(`${supabaseUrl}/rest/v1/jobs?id=eq.${id}`, { method: "DELETE", headers: getSupabaseHeaders() });
    }
  }

  async function suggestJobs() {
    setLoadingJobs(true);
    setMessage("");
    setErrorMessage("");

    try {
      const currentDate = new Date().toLocaleDateString("fi-FI");
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...searchProfile,
          targetJob: form.targetJob,
          experience: form.experience,
          skills: form.skills,
          languages: form.languages,
          onlyActive: true,
          currentDate: currentDate,
          sources: ["Duunitori", "Oikotie", "LinkedIn", "Työmarkkinatori"],
          strictFreshness: true,
          instructions: "Hae vain oikeasti NYT avoinna olevia, aitoja työpaikkoja useista lähteistä. Älä keksi ilmoituksia äläkä palauta vanhoja (esim. vuodelta 2024 tai 2025)."
        }),
      });

      const data = await res.json();
      const parsed = safeJsonParseJobs(data.output || "[]");

      if (!parsed.length) {
        setErrorMessage("Työpaikkaehdotuksia ei saatu muodostettua.");
        return;
      }

      const newJobs: JobItem[] = parsed.map((job) =>
        normalizeJob({
          ...job,
          id: makeId(),
          source: job.source || "AI-ehdotus",
          status: (job.status as JobStatus) || "interested",
          priority: (job.priority as JobPriority) || "medium",
          favorite: Boolean(job.favorite),
          archived: false,
        })
      );

      setJobs((prev) => [...newJobs, ...prev]);
      if (!activeJobId && newJobs[0]) {
        setActiveJobId(newJobs[0].id);
      }
      setTab("job");
      setMessage("Työpaikkaehdotukset lisätty.");

      const session = getSession();
      if(session) {
        newJobs.forEach(job => {
          fetch(`${supabaseUrl}/rest/v1/jobs`, {
            method: "POST", headers: getSupabaseHeaders(),
            body: JSON.stringify({
              id: job.id, user_id: session.user.id, title: job.title, company: job.company, location: job.location, type: job.type, summary: job.summary, ad_text: job.adText, url: job.url, why_fit: job.whyFit, source: job.source, match_score: job.matchScore, status: job.status, priority: job.priority, salary: job.salary, applied_at: job.appliedAt || null, deadline: job.deadline || null, notes: job.notes, contact_person: job.contactPerson, contact_email: job.contactEmail, company_website: job.companyWebsite, favorite: job.favorite, archived: job.archived
            })
          });
        });
      }

      setTimeout(() => setMessage(""), 2500);
    } catch (error) {
      console.error(error);
      setErrorMessage("Työpaikkaehdotusten haku epäonnistui.");
    } finally {
      setLoadingJobs(false);
    }
  }

  async function createTailoredCv() {
    if (!activeJob) {
      setErrorMessage("Valitse työpaikka ennen kohdistetun CV:n luontia.");
      return;
    }

    const currentCv = parsedCv.cvBody;
    if (!currentCv) {
      setErrorMessage("Generoi ensin normaali CV.");
      return;
    }

    setLoadingTailoredCv(true);
    setMessage("");
    setErrorMessage("");

    try {
      const res = await fetch("/api/cv-tailored", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentCv,
          jobTitle: activeJob.title,
          companyName: activeJob.company,
          jobAd: activeJob.adText,
        }),
      });

      const data = await res.json();
      const parsed = parseTailoredCv(data.output || "");

      const item: SavedCvVariant = {
        id: makeId(),
        jobId: activeJob.id,
        jobTitle: activeJob.title,
        companyName: activeJob.company,
        content: parsed,
        createdAt: new Date().toISOString(),
      };

      setSavedCvVariants((prev) => [item, ...prev]);
      setCvResult(`CV_BODY:\n${parsed}`);
      setTab("cv");
      setMessage("Työpaikkaan sopiva CV-versio luotu.");
      setTimeout(() => setMessage(""), 2500);

      const session = getSession();
      if(session) {
        fetch(`${supabaseUrl}/rest/v1/cv_variants`, {
          method: "POST", headers: getSupabaseHeaders(),
          body: JSON.stringify({ id: item.id, user_id: session.user.id, job_id: item.jobId, job_title: item.jobTitle, company_name: item.companyName, content: item.content })
        });
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Työpaikkaan sopivan CV-version luonti epäonnistui.");
    } finally {
      setLoadingTailoredCv(false);
    }
  }

  async function handleCvSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!validateCvForm()) return;

    setLoadingCv(true);
    setCvResult("");

    try {
      const res = await fetch("/api/cv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          ...form,
        }),
      });

      const data = await res.json();
      const output = data.output || data.error || "Jokin meni pieleen.";
      setCvResult(output);
      setTab("cv");
    } catch (error) {
      console.error(error);
      setErrorMessage("Virhe yhteydessä palvelimeen.");
    } finally {
      setLoadingCv(false);
    }
  }

  async function handleCoverLetterSubmit() {
    setMessage("");
    setErrorMessage("");

    if (!validateLetterForm() || !activeJob) return;

    setLoadingLetter(true);
    setLetterResult("");

    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          cvText: parsedCv.cvBody || form.cvText,
          jobTitle: activeJob.title,
          companyName: activeJob.company,
          jobAd: activeJob.adText,
          tone: letterTone,
        }),
      });

      const data = await res.json();
      const output = data.output || data.error || "Jokin meni pieleen.";
      const parsed = parseCoverLetter(output);

      setLetterResult(output);
      setLetterDraft(parsed);

      const savedLetter: SavedLetter = {
        id: makeId(),
        jobId: activeJob.id,
        jobTitle: activeJob.title,
        companyName: activeJob.company,
        content: parsed,
        createdAt: new Date().toISOString(),
      };

      setSavedLetters((prev) => [savedLetter, ...prev]);
      setTab("letter");
      setMessage("Hakemus luotu valittuun työpaikkaan.");
      setTimeout(() => setMessage(""), 2500);

      const session = getSession();
      if(session) {
        fetch(`${supabaseUrl}/rest/v1/saved_letters`, {
          method: "POST", headers: getSupabaseHeaders(),
          body: JSON.stringify({ id: savedLetter.id, user_id: session.user.id, job_id: savedLetter.jobId, job_title: savedLetter.jobTitle, company_name: savedLetter.companyName, content: savedLetter.content })
        });
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Virhe yhteydessä palvelimeen.");
    } finally {
      setLoadingLetter(false);
    }
  }

  function saveEditedLetter() {
    if (!activeJob || !letterDraft.trim()) return;

    const savedLetter: SavedLetter = {
      id: makeId(),
      jobId: activeJob.id,
      jobTitle: activeJob.title,
      companyName: activeJob.company,
      content: letterDraft.trim(),
      createdAt: new Date().toISOString(),
    };

    setSavedLetters((prev) => [savedLetter, ...prev]);
    setLetterResult(`HAKEMUS:\n${letterDraft.trim()}`);
    setMessage("Muokattu hakemus tallennettu.");
    setTimeout(() => setMessage(""), 2500);

    const session = getSession();
    if(session) {
      fetch(`${supabaseUrl}/rest/v1/saved_letters`, {
        method: "POST", headers: getSupabaseHeaders(),
        body: JSON.stringify({ id: savedLetter.id, user_id: session.user.id, job_id: savedLetter.jobId, job_title: savedLetter.jobTitle, company_name: savedLetter.companyName, content: savedLetter.content })
      });
    }
  }

  function startSparring(job: JobItem) {
    setSparringJob(job);
    setSparringChat([
      { role: "ai", text: `Hei! Olen tekoälyrekrytoija yrityksestä ${job.company || "täältä"}. Huomasin, että haet meiltä tehtävää "${job.title}". Kertoisitko alkuun hieman itsestäsi ja miksi juuri tämä paikka kiinnostaa sinua?` }
    ]);
  }

  function sendSparringMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!sparringMessage.trim()) return;
    
    const newChat = [...sparringChat, { role: "user" as const, text: sparringMessage }];
    setSparringChat(newChat);
    setSparringMessage("");
    setIsSparringTyping(true);

    setTimeout(() => {
      setSparringChat([...newChat, { role: "ai", text: "Kiitos vastauksestasi! Se kuulostaa erittäin mielenkiintoiselta. Miten yleensä reagoit tilanteisiin, joissa kohtaat yllättäviä ongelmia tai aikataulupainetta? Voitko antaa jonkin konkreettisen esimerkin aiemmasta työkokemuksestasi?" }]);
      setIsSparringTyping(false);
    }, 1800);
  }

  if (isAuthChecking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0F0F0F] text-white">
        <p className="text-[#00BFA6] font-black text-2xl animate-pulse tracking-widest uppercase">Ladataan studiota...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white overflow-x-hidden font-sans pb-32">
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-zinc-900/50 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,191,166,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,111,60,0.1),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_35%,rgba(0,0,0,0.3))]" />
        
        <div className="relative mx-auto max-w-7xl px-8 py-14 md:py-20 lg:px-12">
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
            <div className="flex items-center gap-4">
              <span className="font-black text-3xl tracking-tighter"><span className="text-[#00BFA6]">DUUNI</span><span className="text-[#FF6F3C]">HARAVA</span></span>
              <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">Studio</div>
            </div>
            <button
              onClick={() => {
                clearSession();
                router.push("/login");
              }}
              className="rounded-2xl border border-white/10 px-8 py-3 text-sm font-black text-gray-400 hover:bg-white/5 hover:text-white transition-all whitespace-nowrap"
            >
              KIRJAUDU ULOS
            </button>
          </div>

          <div className="grid gap-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-8">
                Tee työhausta <span className="text-[#00BFA6]">helppoa.</span>
              </h1>

              <p className="text-xl text-gray-400 max-w-xl leading-relaxed mb-12">
                Luo upea CV, löydä avoimet työpaikat ja anna tekoälyn kirjoittaa hakemukset puolestasi. Kaikki yhdessä näkymässä.
              </p>

              <div className="flex flex-col sm:flex-row gap-5">
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="bg-[#00BFA6]/10 border border-[#00BFA6]/40 text-[#00BFA6] px-10 py-5 rounded-[24px] text-lg font-black hover:bg-[#00BFA6]/20 transition-all shadow-xl flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">💡</span> {showHelp ? "Piilota ohjeet" : "Näytä selkeät käyttöohjeet"}
                </button>

                <button
                  type="button"
                  onClick={fillExample}
                  className="bg-white text-black px-10 py-5 rounded-[24px] text-lg font-black hover:bg-gray-200 transition-all shadow-xl"
                >
                  Täytä esimerkki
                </button>
              </div>
            </div>

            <div className="grid gap-6 w-full">
              <StatCard
                title="TYÖPAIKAT"
                value={jobs.length.toString()}
                description="Seurannassa olevat paikat"
              />
              <div className="grid grid-cols-2 gap-6">
                <StatCard
                  title="CV-TYYLIT"
                  value="4"
                  description="Valmista pohjaa"
                />
                <StatCard
                  title="SÄVYT"
                  value="3"
                  description="Hakemuksiin"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- OHJE-OSIO --- */}
      {showHelp && (
        <section className="max-w-7xl mx-auto px-8 mt-12 animate-in fade-in slide-in-from-top-6">
          <div className="rounded-[40px] border-2 border-[#00BFA6]/30 bg-zinc-900/90 p-10 sm:p-16 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-6">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Näin käytät Duuniharavaa</h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white font-bold p-2 text-xl transition">✕ Sulje</button>
            </div>
            
            <div className="space-y-10 text-gray-300 text-lg leading-relaxed">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#00BFA6] text-black font-black flex items-center justify-center text-3xl">1</div>
                <div className="mt-2">
                  <strong className="text-white block text-2xl mb-3">Täytä omat tietosi</strong>
                  Aloita alempaa laatikosta nimeltä "Vaihe 1: Hakijan tiedot". Kirjoita nimesi, työkokemuksesi ja koulutuksesi. Voit myös vain valita ja ladata tietokoneeltasi vanhan CV:n PDF-muodossa, niin tekoäly lukee sen puolestasi.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#00BFA6] text-black font-black flex items-center justify-center text-3xl">2</div>
                <div className="mt-2">
                  <strong className="text-white block text-2xl mb-3">Paina "Generoi CV"</strong>
                  Rullaa Vaihe 1 -laatikon loppuun ja paina vihreää nappia. Tekoäly muotoilee sinulle uuden, hienon CV:n. Näet esikatselun sivun oikeassa laidassa (tai mobiilissa alhaalla). Voit ladata sen suoraan koneellesi PDF-napista.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#FF6F3C] text-black font-black flex items-center justify-center text-3xl">3</div>
                <div className="mt-2">
                  <strong className="text-white block text-2xl mb-3">Etsi työpaikkoja</strong>
                  Siirry "Vaihe 2: Hakuprofiili" -laatikkoon. Kerro siellä, millaista työtä etsit (esim. "Myyjä, Uusimaa"). Paina "Ehdota työpaikkoja" -nappia, jolloin ohjelma etsii sinulle sopivia, voimassa olevia avoimia tehtäviä ja tuo ne näkyviin.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#FF6F3C] text-black font-black flex items-center justify-center text-3xl">4</div>
                <div className="mt-2">
                  <strong className="text-white block text-2xl mb-3">Tee hakemus napin painalluksella</strong>
                  Sivun oikeassa reunassa (tai mobiilissa alempana) on välilehdet: "CV", "Työpaikat" ja "Hakemukset". Valitse listalta kiinnostava työpaikka ja pyydä tekoälyä kirjoittamaan siihen valmis, räätälöity työhakemus yhdellä klikkauksella.
                </div>
              </div>
            </div>

            <div className="mt-12 pt-10 border-t border-white/10 text-center sm:text-left">
              <button onClick={() => setShowHelp(false)} className="rounded-2xl bg-white px-10 py-5 text-lg font-black text-black transition-all hover:bg-gray-200 hover:scale-[1.02] shadow-[0_10px_30px_rgba(255,255,255,0.2)] w-full sm:w-auto">
                Selvä, ymmärsin! Aloitetaan!
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-8 py-16 md:py-20 lg:px-12">
        <div className="mb-10 flex flex-wrap items-center gap-5 border-b border-white/5 pb-6">
          <button
            type="button"
            onClick={() => setMode("improve")}
            className={`rounded-2xl px-8 py-4 text-base font-bold transition-all duration-300 flex-1 sm:flex-none ${
              mode === "improve"
                ? "bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] text-black shadow-[0_0_20px_rgba(0,191,166,0.3)]"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1"
            }`}
          >
            Paranna nykyinen CV
          </button>

          <button
            type="button"
            onClick={() => setMode("create")}
            className={`rounded-2xl px-8 py-4 text-base font-bold transition-all duration-300 flex-1 sm:flex-none ${
              mode === "create"
                ? "bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] text-black shadow-[0_0_20px_rgba(0,191,166,0.3)]"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1"
            }`}
          >
            Luo täysin uusi CV
          </button>

          <div className="ml-auto hidden text-base font-medium text-gray-500 lg:block">
            Pilvitallennus aktiivinen (Supabase) ☁️
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr]">
          <section className="space-y-12">
            <SectionShell
              step="Vaihe 1"
              title="Hakijan tiedot"
              description="Täytä tietosi huolellisesti tai lataa vanha CV:si. Näitä käytetään pohjana kaikessa tekoälyn tekemässä työssä."
              action={
                <button
                  type="button"
                  onClick={clearForm}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-gray-300 transition-all hover:bg-white/10 hover:border-red-500/50"
                >
                  Tyhjennä
                </button>
              }
            >
              <form onSubmit={handleCvSubmit} className="space-y-8 mt-6">
                {mode === "improve" && (
                  <div>
                    <label className="mb-4 block text-sm font-bold text-gray-400">
                      Nykyinen CV (PDF)
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                      <label className="cursor-pointer rounded-2xl bg-white/[0.03] border border-white/10 px-8 py-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#00BFA6]/50 flex-1 sm:flex-none">
                        <span className="text-base font-bold text-white">
                          Lataa laitteelta PDF-tiedosto
                        </span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={handleCvFileUpload}
                        />
                      </label>
                      {form.cvFileName && (
                        <span className="text-base font-medium text-[#00BFA6] break-words px-2">
                          ✓ {form.cvFileName} valittu
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2">
                  <div>
                     <label className="mb-3 block text-sm font-bold text-gray-500 ml-1">Koko nimi</label>
                     <input
                       placeholder="Esim. Matti Meikäläinen"
                       value={form.name}
                       onChange={(e) => updateField("name", e.target.value)}
                       className={InputClass()}
                     />
                  </div>
                  <div>
                     <label className="mb-3 block text-sm font-bold text-gray-500 ml-1">Puhelin</label>
                     <input
                       placeholder="040 123 4567"
                       value={form.phone}
                       onChange={(e) => updateField("phone", e.target.value)}
                       className={InputClass()}
                     />
                  </div>
                  <div>
                     <label className="mb-3 block text-sm font-bold text-gray-500 ml-1">Sähköposti</label>
                     <input
                       placeholder="oma@email.com"
                       value={form.email}
                       onChange={(e) => updateField("email", e.target.value)}
                       className={InputClass()}
                     />
                  </div>
                  <div>
                     <label className="mb-3 block text-sm font-bold text-gray-500 ml-1">Paikkakunta</label>
                     <input
                       placeholder="Esim. Helsinki"
                       value={form.location}
                       onChange={(e) => updateField("location", e.target.value)}
                       className={InputClass()}
                     />
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex justify-between items-end mb-3">
                    <label className="block text-sm font-bold text-gray-500 ml-1">Tavoiteltu rooli / ammatti</label>
                  </div>
                  <input
                    placeholder="Mitä työtä haluat hakea? (esim. Myyntipäällikkö, Koodari)"
                    value={form.targetJob}
                    onChange={(e) => updateField("targetJob", e.target.value)}
                    className={InputClass()}
                  />
                  <p className="text-xs text-[#00BFA6] font-bold mt-3 ml-2">💡 Tekoäly kirjoittaa tämän perusteella sinulle myyvän "Hookin" (Profiilitekstin), jolla erotut muista.</p>
                </div>

                <div className="pt-4">
                  <label className="mb-3 block text-sm font-bold text-gray-500 ml-1">Koulutus</label>
                  <textarea
                    placeholder="Oppilaitos | Tutkinto | Valmistumisvuosi&#10;Esim. Helsingin Yliopisto | Kauppatieteiden maisteri | 2024"
                    value={form.education}
                    onChange={(e) => updateField("education", e.target.value)}
                    className={TextareaClass("min-h-[140px]")}
                  />
                </div>

                <div className="pt-4">
                  <label className="mb-3 block text-sm font-bold text-gray-500 ml-1">Työkokemus</label>
                  <textarea
                    placeholder="Työnantaja | Työtehtävä | 01/2020 - 05/2022 (tai 'Nykyinen')&#10;- Lyhyt kuvaus työtehtävistäsi...&#10;- Toinen kuvaus..."
                    value={form.experience}
                    onChange={(e) => updateField("experience", e.target.value)}
                    className={TextareaClass("min-h-[180px]")}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-4">
                  <div>
                    <label className="mb-3 block text-sm font-bold text-gray-500 ml-1">Kielitaito</label>
                    <textarea
                      placeholder="Suomi (äidinkieli), Englanti (sujuva)..."
                      value={form.languages}
                      onChange={(e) => updateField("languages", e.target.value)}
                      className={TextareaClass("min-h-[140px]")}
                    />
                  </div>
                  <div>
                    <label className="mb-3 block text-sm font-bold text-gray-500 ml-1">Osaaminen & Taidot</label>
                    <textarea
                      placeholder="Mitä taitoja sinulla on? (esim. asiakaspalvelu)"
                      value={form.skills}
                      onChange={(e) => updateField("skills", e.target.value)}
                      className={TextareaClass("min-h-[140px]")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-4">
                  <div>
                    <label className="mb-3 block text-sm font-bold text-gray-500 ml-1">Kortit & Pätevyydet</label>
                    <textarea
                      placeholder="Työturvallisuuskortti, B-ajokortti..."
                      value={form.cards}
                      onChange={(e) => updateField("cards", e.target.value)}
                      className={TextareaClass("min-h-[120px]")}
                    />
                  </div>
                  <div>
                    <label className="mb-3 block text-sm font-bold text-gray-500 ml-1">Harrastukset</label>
                    <textarea
                      placeholder="Mitä teet vapaa-ajalla?"
                      value={form.hobbies}
                      onChange={(e) => updateField("hobbies", e.target.value)}
                      className={TextareaClass("min-h-[120px]")}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <ProfileImageUpload image={profileImage} onChange={setProfileImage} />
                </div>

                {/* --- CANVA TASON EDITOR --- */}
                <div className="rounded-[32px] border border-white/10 bg-[#0A0A0A] p-8 md:p-10 mt-10 shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6">
                    <div>
                      <p className="text-xl font-black text-white tracking-tight">Värit ja Teema</p>
                      <p className="mt-2 text-base text-gray-400">Pikavalinnat väreille tai säädä itse.</p>
                    </div>
                    <button type="button" onClick={resetCurrentStyle} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-[#00BFA6]/50">
                      Palauta oletukset
                    </button>
                  </div>

                  {/* UUDET PIKAVÄRIT */}
                  <div className="mb-10 flex flex-wrap gap-3 border-b border-white/5 pb-8">
                    <button type="button" onClick={() => applyPalette("#ffffff", "#f8fafc", "#0f172a", "#1e293b", "#0369a1", "#111827", "#ffffff", "#475569")} className="rounded-xl px-5 py-3 text-sm font-bold border border-white/10 hover:border-[#0369a1] hover:bg-white/5 transition-all">🌊 Merellinen</button>
                    <button type="button" onClick={() => applyPalette("#ffffff", "#f1f5f9", "#064e3b", "#022c22", "#10b981", "#0f172a", "#ffffff", "#334155")} className="rounded-xl px-5 py-3 text-sm font-bold border border-white/10 hover:border-[#10b981] hover:bg-white/5 transition-all">🌲 Metsä</button>
                    <button type="button" onClick={() => applyPalette("#fffbeb", "#fef3c7", "#78350f", "#451a03", "#d97706", "#451a03", "#fffbeb", "#92400e")} className="rounded-xl px-5 py-3 text-sm font-bold border border-white/10 hover:border-[#d97706] hover:bg-white/5 transition-all">🍂 Syksy</button>
                    <button type="button" onClick={() => applyPalette("#ffffff", "#f3f4f6", "#4c1d95", "#312e81", "#7c3aed", "#111827", "#ffffff", "#4338ca")} className="rounded-xl px-5 py-3 text-sm font-bold border border-white/10 hover:border-[#7c3aed] hover:bg-white/5 transition-all">🔮 Kyber</button>
                    <button type="button" onClick={() => applyPalette("#18181b", "#111827", "#000000", "#0a0a0a", "#14b8a6", "#f3f4f6", "#e5e7eb", "#9ca3af")} className="rounded-xl px-5 py-3 text-sm font-bold border border-white/10 hover:border-[#14b8a6] hover:bg-white/5 transition-all">🌑 Tumma Tyyli</button>
                  </div>

                  <div className="mb-10 flex flex-wrap gap-4">
                    {(["modern", "classic", "compact", "bold"] as CvStyleVariant[]).map((variant) => (
                      <button
                        key={variant}
                        type="button"
                        onClick={() => setCvStyle(variant)}
                        className={`rounded-2xl px-6 py-4 text-base font-bold transition-all duration-300 flex-1 sm:flex-none ${cvStyle === variant ? "bg-[#00BFA6] text-black shadow-[0_0_20px_rgba(0,191,166,0.4)] scale-105" : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1"}`}
                      >
                        {variant === "modern" && "Moderni"}
                        {variant === "classic" && "Klassinen"}
                        {variant === "compact" && "Tiivis"}
                        {variant === "bold" && "Näyttävä"}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-12">
                    {/* TYPOGRAFIA & ASETTELU */}
                    <div>
                      <h4 className="text-[#00BFA6] font-bold text-xs uppercase tracking-widest mb-5 border-b border-white/10 pb-3">Asettelu & Typografia</h4>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Asettelu (Layout)</label>
                          <select value={customStyle.layout || "left-sidebar"} onChange={(e) => updateCustomStyle("layout", e.target.value as any)} className="w-full rounded-2xl border border-white/10 bg-[#141414] px-5 py-4 text-sm font-bold text-white outline-none cursor-pointer">
                            <option value="left-sidebar">Vasen sivupalkki</option>
                            <option value="right-sidebar">Oikea sivupalkki</option>
                            <option value="top-header">Yläpalkki (Koko leveys)</option>
                            <option value="minimalist">Minimalistinen (Keskitetty)</option>
                            <option value="two-column">Jaettu kahteen sarakkeeseen</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Fonttiperhe</label>
                          <select value={customStyle.fontFamily || "modern"} onChange={(e) => updateCustomStyle("fontFamily", e.target.value as any)} className="w-full rounded-2xl border border-white/10 bg-[#141414] px-5 py-4 text-sm font-bold text-white outline-none cursor-pointer">
                            <option value="modern">Moderni (Sans-serif)</option>
                            <option value="classic">Klassinen (Serif)</option>
                            <option value="mono">Koodari (Monospace)</option>
                            <option value="elegant">Elegantti (Georgia)</option>
                            <option value="clean">Puhdas (Arial)</option>
                            <option value="tech">Tekninen (Trebuchet)</option>
                            <option value="brutalist">Brutalistinen (Impact)</option>
                            <option value="playful">Leikkisä (Comic)</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Otsikoiden tyyli</label>
                          <select value={customStyle.headingStyle || "simple"} onChange={(e) => updateCustomStyle("headingStyle", e.target.value as any)} className="w-full rounded-2xl border border-white/10 bg-[#141414] px-5 py-4 text-sm font-bold text-white outline-none cursor-pointer">
                            <option value="simple">Yksinkertainen</option>
                            <option value="underline">Alleviivaus</option>
                            <option value="highlight">Korostusväri taustalla</option>
                            <option value="boxed">Laatikko</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* VÄRIT */}
                    <div>
                      <h4 className="text-[#00BFA6] font-bold text-xs uppercase tracking-widest mb-5 border-b border-white/10 pb-3">Värimaailma</h4>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                        <div>
                          <label className="mb-3 block text-xs font-bold text-gray-400">Sivupalkki Bg</label>
                          <input type="color" value={customStyle.sidebarBg} onChange={(e) => updateCustomStyle("sidebarBg", e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-[#141414] p-1 cursor-pointer" />
                        </div>
                        <div>
                          <label className="mb-3 block text-xs font-bold text-gray-400">Sivupalkki Bg 2</label>
                          <input type="color" value={customStyle.sidebarBg2 || customStyle.sidebarBg} onChange={(e) => updateCustomStyle("sidebarBg2", e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-[#141414] p-1 cursor-pointer" />
                        </div>
                        <div>
                          <label className="mb-3 block text-xs font-bold text-gray-400">Sivupalkki Txt</label>
                          <input type="color" value={customStyle.sidebarText} onChange={(e) => updateCustomStyle("sidebarText", e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-[#141414] p-1 cursor-pointer" />
                        </div>
                        <div>
                          <label className="mb-3 block text-xs font-bold text-gray-400">Pääalue Bg</label>
                          <input type="color" value={customStyle.mainBg} onChange={(e) => updateCustomStyle("mainBg", e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-[#141414] p-1 cursor-pointer" />
                        </div>
                        <div>
                          <label className="mb-3 block text-xs font-bold text-gray-400">Pääalue Bg 2</label>
                          <input type="color" value={customStyle.mainBg2 || customStyle.mainBg} onChange={(e) => updateCustomStyle("mainBg2", e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-[#141414] p-1 cursor-pointer" />
                        </div>
                        <div>
                          <label className="mb-3 block text-xs font-bold text-gray-400">Pääalue Txt</label>
                          <input type="color" value={customStyle.mainText} onChange={(e) => updateCustomStyle("mainText", e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-[#141414] p-1 cursor-pointer" />
                        </div>
                        <div>
                          <label className="mb-3 block text-xs font-bold text-gray-400">Otsikot</label>
                          <input type="color" value={customStyle.headingColor} onChange={(e) => updateCustomStyle("headingColor", e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-[#141414] p-1 cursor-pointer" />
                        </div>
                        <div>
                          <label className="mb-3 block text-xs font-bold text-gray-400">Korosteväri</label>
                          <input type="color" value={customStyle.accentColor} onChange={(e) => updateCustomStyle("accentColor", e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-[#141414] p-1 cursor-pointer" />
                        </div>
                      </div>
                    </div>

                    {/* KUVIOINTI & YKSITYISKOHDAT */}
                    <div>
                      <h4 className="text-[#00BFA6] font-bold text-xs uppercase tracking-widest mb-5 border-b border-white/10 pb-3">Kuviointi & Yksityiskohdat</h4>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Pääalueen kuviointi</label>
                          <select value={customStyle.pattern || "none"} onChange={(e) => updateCustomStyle("pattern", e.target.value as any)} className="w-full rounded-2xl border border-white/10 bg-[#141414] px-5 py-4 text-sm font-bold text-white outline-none cursor-pointer">
                            <option value="none">Ei kuviointia</option>
                            <option value="dots">Pisteet (Dots)</option>
                            <option value="lines">Vaakaviivat (Lines)</option>
                            <option value="diagonal">Vinoviivat (Diagonal)</option>
                            <option value="grid">Ruudukko (Grid)</option>
                            <option value="cross">Ristit (Cross)</option>
                            <option value="intersecting">Risteävät viivat</option>
                            <option value="waves">Aallot (Waves)</option>
                            <option value="zigzag">Sahalaita (Zigzag)</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Sivupalkin kuviointi</label>
                          <select value={customStyle.sidebarPattern || "none"} onChange={(e) => updateCustomStyle("sidebarPattern", e.target.value as any)} className="w-full rounded-2xl border border-white/10 bg-[#141414] px-5 py-4 text-sm font-bold text-white outline-none cursor-pointer">
                            <option value="none">Ei kuviointia</option>
                            <option value="dots">Pisteet (Dots)</option>
                            <option value="lines">Vaakaviivat (Lines)</option>
                            <option value="diagonal">Vinoviivat (Diagonal)</option>
                            <option value="grid">Ruudukko (Grid)</option>
                            <option value="cross">Ristit (Cross)</option>
                            <option value="intersecting">Risteävät viivat</option>
                            <option value="waves">Aallot (Waves)</option>
                            <option value="zigzag">Sahalaita (Zigzag)</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Pääalueen liukuväri (Suunta)</label>
                          <select value={customStyle.mainGradientDirection || "none"} onChange={(e) => updateCustomStyle("mainGradientDirection", e.target.value as any)} className="w-full rounded-2xl border border-white/10 bg-[#141414] px-5 py-4 text-sm font-bold text-white outline-none cursor-pointer">
                            <option value="none">Ei liukuväriä</option>
                            <option value="to bottom">Ylhäältä alas</option>
                            <option value="to right">Vasemmalta oikealle</option>
                            <option value="135deg">Viistosti (135deg)</option>
                            <option value="circle">Ympyrä (Radial)</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Sivupalkin liukuväri (Suunta)</label>
                          <select value={customStyle.sidebarGradientDirection || "none"} onChange={(e) => updateCustomStyle("sidebarGradientDirection", e.target.value as any)} className="w-full rounded-2xl border border-white/10 bg-[#141414] px-5 py-4 text-sm font-bold text-white outline-none cursor-pointer">
                            <option value="none">Ei liukuväriä</option>
                            <option value="to bottom">Ylhäältä alas</option>
                            <option value="to right">Vasemmalta oikealle</option>
                            <option value="135deg">Viistosti (135deg)</option>
                            <option value="circle">Ympyrä (Radial)</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Tagien (Taidot) tyyli</label>
                          <select value={customStyle.tagStyle || "solid"} onChange={(e) => updateCustomStyle("tagStyle", e.target.value as any)} className="w-full rounded-2xl border border-white/10 bg-[#141414] px-5 py-4 text-sm font-bold text-white outline-none cursor-pointer">
                            <option value="solid">Täytetty</option>
                            <option value="outline">Reunukset (Outline)</option>
                            <option value="pill">Pillerit (Pyöreät)</option>
                            <option value="sharp">Terävät kulmat</option>
                            <option value="minimal">Minimaalinen viiva</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Yläpalkin tyyli</label>
                          <select value={customStyle.headerStyle || "solid"} onChange={(e) => updateCustomStyle("headerStyle", e.target.value as any)} className="w-full rounded-2xl border border-white/10 bg-[#141414] px-5 py-4 text-sm font-bold text-white outline-none cursor-pointer">
                            <option value="solid">Yksivärinen</option>
                            <option value="gradient">Liukuväri (Gradient)</option>
                            <option value="transparent">Läpinäkyvä</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Kuvan muoto</label>
                          <select value={customStyle.imageShape || "rounded"} onChange={(e) => updateCustomStyle("imageShape", e.target.value as any)} className="w-full rounded-2xl border border-white/10 bg-[#141414] px-5 py-4 text-sm font-bold text-white outline-none cursor-pointer">
                            <option value="square">Neliö</option>
                            <option value="rounded">Pyöristetty</option>
                            <option value="circle">Ympyrä</option>
                            <option value="blob">Epäsymmetrinen (Blob)</option>
                            <option value="leaf">Lehti (Leaf)</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Kuvan sijainti</label>
                          <select value={customStyle.imagePosition || "left"} onChange={(e) => updateCustomStyle("imagePosition", e.target.value as any)} className="w-full rounded-2xl border border-white/10 bg-[#141414] px-5 py-4 text-sm font-bold text-white outline-none cursor-pointer">
                            <option value="left">Vasemmalla</option>
                            <option value="center">Keskellä</option>
                            <option value="right">Oikealla</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Varjostukset & 3D</label>
                          <select value={customStyle.shadowStyle || "none"} onChange={(e) => updateCustomStyle("shadowStyle", e.target.value as any)} className="w-full rounded-2xl border border-white/10 bg-[#141414] px-5 py-4 text-sm font-bold text-white outline-none cursor-pointer">
                            <option value="none">Ei varjoja</option>
                            <option value="soft">Pehmeä varjo</option>
                            <option value="hard">Kova (Brutalistinen)</option>
                            <option value="3d">3D-syvyys</option>
                            <option value="neon">Neon-hohto</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Erotinviivat osioiden välissä</label>
                          <select value={customStyle.showSeparators ? "yes" : "no"} onChange={(e) => updateCustomStyle("showSeparators", e.target.value === "yes")} className="w-full rounded-2xl border border-white/10 bg-[#141414] px-5 py-4 text-sm font-bold text-white outline-none cursor-pointer">
                            <option value="yes">Kyllä, näytä viivat</option>
                            <option value="no">Ei, piilota viivat</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* MITAT & VÄLIT */}
                    <div>
                      <h4 className="text-[#00BFA6] font-bold text-xs uppercase tracking-widest mb-5 border-b border-white/10 pb-3">Mitat & Välit</h4>
                      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Kuvioinnin vahvuus ({customStyle.patternOpacity || 5}%)</label>
                          <input type="range" min={1} max={30} value={customStyle.patternOpacity || 5} onChange={(e) => updateCustomStyle("patternOpacity", Number(e.target.value))} className="w-full accent-[#00BFA6]" />
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Sivupalkin kuvioinnin vahvuus ({customStyle.sidebarPatternOpacity || 5}%)</label>
                          <input type="range" min={1} max={30} value={customStyle.sidebarPatternOpacity || 5} onChange={(e) => updateCustomStyle("sidebarPatternOpacity", Number(e.target.value))} className="w-full accent-[#00BFA6]" />
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Sivun sisämarginaalit ({customStyle.pagePadding || 48}px)</label>
                          <input type="range" min={20} max={80} value={customStyle.pagePadding || 48} onChange={(e) => updateCustomStyle("pagePadding", Number(e.target.value))} className="w-full accent-[#00BFA6]" />
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Sivupalkin leveys ({customStyle.sidebarWidth}px)</label>
                          <input type="range" min={180} max={340} value={customStyle.sidebarWidth} onChange={(e) => updateCustomStyle("sidebarWidth", Number(e.target.value))} className="w-full accent-[#00BFA6]" />
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Nimen koko ({customStyle.nameSize}px)</label>
                          <input type="range" min={28} max={64} value={customStyle.nameSize} onChange={(e) => updateCustomStyle("nameSize", Number(e.target.value))} className="w-full accent-[#00BFA6]" />
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Tekstin koko ({customStyle.bodySize}px)</label>
                          <input type="range" min={12} max={20} value={customStyle.bodySize} onChange={(e) => updateCustomStyle("bodySize", Number(e.target.value))} className="w-full accent-[#00BFA6]" />
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Kulmien pyöreys ({customStyle.borderRadius}px)</label>
                          <input type="range" min={0} max={40} value={customStyle.borderRadius} onChange={(e) => updateCustomStyle("borderRadius", Number(e.target.value))} className="w-full accent-[#00BFA6]" />
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Riviväli ({customStyle.lineHeight})</label>
                          <input type="range" min={1.2} max={2} step={0.05} value={customStyle.lineHeight} onChange={(e) => updateCustomStyle("lineHeight", Number(e.target.value))} className="w-full accent-[#00BFA6]" />
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-bold text-gray-400">Osioiden väli ({customStyle.sectionSpacing}px)</label>
                          <input type="range" min={8} max={60} value={customStyle.sectionSpacing} onChange={(e) => updateCustomStyle("sectionSpacing", Number(e.target.value))} className="w-full accent-[#00BFA6]" />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="mb-3 block text-sm font-bold text-gray-400">Kuvan pyöristys ({customStyle.imageRadius}px)</label>
                          <input type="range" min={0} max={40} value={customStyle.imageRadius} onChange={(e) => updateCustomStyle("imageRadius", Number(e.target.value))} className="w-full accent-[#00BFA6]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingCv}
                  className="w-full bg-[#00BFA6] text-black font-black py-6 rounded-[24px] text-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-[0_15px_40px_-10px_rgba(0,191,166,0.6)] mt-8"
                >
                  {loadingCv ? "Tekoäly rakentaa CV:tä..." : "1. GENEROI CV"}
                </button>
              </form>
            </SectionShell>

            <SectionShell
              step="Vaihe 2"
              title="Hakuprofiili & Työnhaku"
              description="Kerro tekoälylle, millaista työtä haluat. Se hakee voimassa olevat paikat puolestasi."
              action={
                <button
                  type="button"
                  onClick={suggestJobs}
                  disabled={loadingJobs}
                  className="rounded-2xl bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] px-8 py-4 text-base font-black text-black transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-50 shadow-[0_0_25px_rgba(0,191,166,0.3)] mt-2 sm:mt-0"
                >
                  {loadingJobs ? "Etsitään..." : "2. EHDOTA TYÖPAIKKOJA"}
                </button>
              }
            >
              <div className="space-y-8 mt-8">
                <div>
                  <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Minkä alan töitä etsit?</label>
                  <textarea
                    placeholder="Esim. Myyntineuvottelija, Koodari, Siivooja..."
                    value={searchProfile.desiredRoles}
                    onChange={(e) =>
                      updateSearchProfile("desiredRoles", e.target.value)
                    }
                    className={TextareaClass("min-h-[140px]")}
                  />
                </div>
                
                <div>
                   <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Miltä alueelta?</label>
                   <input
                     placeholder="Esim. Uusimaa, Etätyö"
                     value={searchProfile.desiredLocation}
                     onChange={(e) =>
                       updateSearchProfile("desiredLocation", e.target.value)
                     }
                     className={InputClass()}
                   />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Kokoaikainen vai Osa-aikainen?</label>
                    <input
                      placeholder="Esim. Kokoaikainen"
                      value={searchProfile.workType}
                      onChange={(e) =>
                        updateSearchProfile("workType", e.target.value)
                      }
                      className={InputClass()}
                    />
                  </div>
                  <div>
                    <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Vuorotoive</label>
                    <input
                      placeholder="Esim. Päivätyö"
                      value={searchProfile.shiftPreference}
                      onChange={(e) =>
                        updateSearchProfile("shiftPreference", e.target.value)
                      }
                      className={InputClass()}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Palkkatoive</label>
                    <input
                      placeholder="Esim. 3000€ / kk"
                      value={searchProfile.salaryWish}
                      onChange={(e) =>
                        updateSearchProfile("salaryWish", e.target.value)
                      }
                      className={InputClass()}
                    />
                  </div>
                  <div>
                    <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Muita avainsanoja (erota pilkulla)</label>
                    <input
                      placeholder="Esim. englanti, joustava"
                      value={searchProfile.keywords}
                      onChange={(e) =>
                        updateSearchProfile("keywords", e.target.value)
                      }
                      className={InputClass()}
                    />
                  </div>
                </div>
              </div>
            </SectionShell>
          </section>

          {/* OIKEA SARAKE: VÄLILEHDET */}
          <section className="space-y-10 lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-[32px] border border-white/10 bg-[#141414] p-8 sm:p-10 shadow-2xl backdrop-blur-xl transition-all">
              
              {/* VÄLILEHTINAPIT */}
              <div className="mb-10 flex overflow-x-auto whitespace-nowrap pb-4 gap-5 snap-x border-b border-white/5 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setTab("cv")}
                  className={`rounded-2xl px-8 py-4 text-base font-black transition-all duration-300 snap-start ${
                    tab === "cv"
                      ? "bg-[#00BFA6] text-black shadow-[0_0_20px_rgba(0,191,166,0.4)]"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1"
                  }`}
                >
                  Oma CV (Esikatselu)
                </button>
                <button
                  type="button"
                  onClick={() => setTab("job")}
                  className={`rounded-2xl px-8 py-4 text-base font-black transition-all duration-300 snap-start ${
                    tab === "job"
                      ? "bg-[#00BFA6] text-black shadow-[0_0_20px_rgba(0,191,166,0.4)]"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1"
                  }`}
                >
                  Työpaikat
                </button>
                <button
                  type="button"
                  onClick={() => setTab("letter")}
                  className={`rounded-2xl px-8 py-4 text-base font-black transition-all duration-300 snap-start ${
                    tab === "letter"
                      ? "bg-[#00BFA6] text-black shadow-[0_0_20px_rgba(0,191,166,0.4)]"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1"
                  }`}
                >
                  Hakemukset
                </button>
                <button
                  type="button"
                  onClick={() => setTab("tips")}
                  className={`rounded-2xl px-8 py-4 text-base font-black transition-all duration-300 snap-start ${
                    tab === "tips"
                      ? "bg-[#FF6F3C] text-black shadow-[0_0_20px_rgba(255,111,60,0.4)]"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1"
                  }`}
                >
                  Vinkit
                </button>
              </div>

              {tab === "cv" && (
                <div className="space-y-10 overflow-hidden animate-in fade-in duration-500">
                  {parsedCv.cvBody && activeJob && (
                    <div className="flex flex-col sm:flex-row gap-5 bg-black/40 p-6 rounded-3xl border border-white/10">
                      <div className="flex-1">
                        <p className="text-base text-gray-400 mb-3">Valittu työpaikka: <strong className="text-white text-lg">{activeJob.title}</strong></p>
                        <button
                          type="button"
                          onClick={createTailoredCv}
                          disabled={loadingTailoredCv}
                          className="w-full rounded-2xl border border-[#FF6F3C]/50 bg-[#FF6F3C]/10 px-8 py-5 font-black text-xl text-[#FF6F3C] transition-all hover:bg-[#FF6F3C]/20 disabled:opacity-50"
                        >
                          {loadingTailoredCv
                            ? "Muokataan tekoälyllä..."
                            : "Räätälöi CV tähän työpaikkaan"}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeJobCvVariants.length > 0 && (
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                      <h3 className="mb-5 text-xl font-bold text-white">
                        Tallennetut CV-versiot
                      </h3>
                      <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {activeJobCvVariants.map((cv) => (
                          <button
                            key={cv.id}
                            type="button"
                            onClick={() => setCvResult(`CV_BODY:\n${cv.content}`)}
                            className="w-full rounded-2xl border border-white/10 bg-black/50 px-6 py-5 text-left transition-all hover:border-[#00BFA6]/50 hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(0,191,166,0.2)]"
                          >
                            <p className="font-bold text-lg text-[#00BFA6] truncate">
                              {cv.jobTitle}
                            </p>
                            <p className="text-base font-medium text-white truncate mt-1">
                              {cv.companyName}
                            </p>
                            <p className="mt-2 text-xs text-gray-500">
                              {new Date(cv.createdAt).toLocaleString("fi-FI")}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {cvResult ? (
                    <>
                      {parsedCv.score && (
                        <div className="rounded-[32px] border border-[#00BFA6]/30 bg-[#00BFA6]/5 p-8 text-center shadow-[0_10px_30px_rgba(0,191,166,0.1)]">
                          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#00BFA6]">
                            Kuntotarkastus arvosana
                          </h2>
                          <p className="mt-3 text-6xl font-black text-white">
                            {parsedCv.score}
                          </p>
                        </div>
                      )}

                      {parsedCv.report.length > 0 && (
                        <div className="rounded-[32px] border border-[#FF6F3C]/30 bg-[#FF6F3C]/5 p-8 sm:p-10 shadow-[0_10px_30px_rgba(255,111,60,0.1)]">
                          <h2 className="mb-6 text-sm font-black uppercase tracking-widest text-[#FF6F3C]">
                            Muutosraportti / Parannukset
                          </h2>
                          <ul className="space-y-4 pl-6 text-lg text-gray-200">
                            {parsedCv.report.map((item, index) => (
                              <li key={index} className="list-disc break-words leading-relaxed">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* VAPAA CV-TEKSTIN MUOKKAUS */}
                      <div className="rounded-[40px] border border-[#00BFA6]/20 bg-[#00BFA6]/5 p-8 sm:p-12 shadow-xl">
                        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h3 className="text-2xl font-black text-white">Muokkaa CV-tekstiä</h3>
                            <p className="text-sm text-gray-400 mt-1">Tekoälyn tuottama luonnos. Voit muokata tekstiä täysin vapaasti tässä ennen latausta.</p>
                          </div>
                        </div>
                        <textarea
                          value={parsedCv.cvBody}
                          onChange={(e) => {
                            const prefix = cvResult.split("CV_BODY:")[0] || "";
                            setCvResult(prefix + "CV_BODY:\n" + e.target.value);
                          }}
                          className="min-h-[400px] w-full rounded-3xl border border-white/10 bg-black/50 p-6 font-mono text-sm leading-relaxed text-gray-200 outline-none transition focus:border-[#00BFA6]"
                        />
                      </div>

                      <div className="rounded-[40px] border border-white/10 bg-white p-4 sm:p-8 overflow-x-auto shadow-2xl">
                        <div className="min-w-[600px] lg:min-w-0">
                          <CvPreview
                            cvText={parsedCv.cvBody}
                            image={profileImage}
                            styleVariant={cvStyle}
                            customStyle={customStyle}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-5">
                        <button
                          type="button"
                          onClick={downloadPdf}
                          disabled={downloadingPdf}
                          className="flex-1 rounded-2xl bg-[#00BFA6] text-black px-8 py-5 font-black text-lg transition-transform hover:scale-[1.02] shadow-[0_0_20px_rgba(0,191,166,0.3)] disabled:opacity-50"
                        >
                          {downloadingPdf ? "Luodaan PDF..." : "LATAA PDF"}
                        </button>

                        <button
                          type="button"
                          onClick={downloadDocx}
                          disabled={downloadingDocx}
                          className="flex-1 rounded-2xl border-2 border-zinc-800 bg-transparent px-8 py-5 font-black text-zinc-400 transition-all hover:border-white hover:text-white disabled:opacity-50"
                        >
                          {downloadingDocx ? "Luodaan DOCX..." : "LATAA DOCX"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-[40px] border-2 border-dashed border-white/10 bg-black/40 p-12 sm:p-20 text-center font-medium text-gray-500">
                      <div className="text-5xl mb-6">📄</div>
                      <p className="text-xl font-bold text-white mb-2">Ei esikatselua vielä</p>
                      <p className="text-base text-gray-400">Täytä tiedot vasemmalla ja paina "Generoi CV", niin näet miltä työsi näyttää.</p>
                    </div>
                  )}
                </div>
              )}

              {tab === "job" && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                    <div className="rounded-[24px] border border-white/10 bg-black/50 p-6 text-center hover:-translate-y-1 transition-transform">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 truncate">
                        Työpaikat
                      </p>
                      <p className="mt-3 text-3xl sm:text-4xl font-black text-white">
                        {dashboardStats.total}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-black/50 p-6 text-center hover:-translate-y-1 transition-transform">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 truncate">
                        Haettu
                      </p>
                      <p className="mt-3 text-3xl sm:text-4xl font-black text-white">
                        {dashboardStats.applied}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-[#00BFA6]/40 bg-[#00BFA6]/10 p-6 text-center hover:-translate-y-1 transition-transform shadow-[0_0_20px_rgba(0,191,166,0.1)]">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00BFA6] truncate">
                        Haastattelu
                      </p>
                      <p className="mt-3 text-3xl sm:text-4xl font-black text-[#00BFA6]">
                        {dashboardStats.interview}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-[#FF6F3C]/40 bg-[#FF6F3C]/10 p-6 text-center hover:-translate-y-1 transition-transform shadow-[0_0_20px_rgba(255,111,60,0.1)]">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FF6F3C] truncate">
                        Suosikit
                      </p>
                      <p className="mt-3 text-3xl sm:text-4xl font-black text-[#FF6F3C]">
                        {dashboardStats.favorites}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-8 sm:p-10 space-y-8">
                    <h3 className="text-2xl font-black text-white border-b border-white/10 pb-5">
                      Lisää oma työpaikka seurantaan
                    </h3>

                    <div>
                       <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Otsikko</label>
                       <input
                         placeholder="Esim. Myyntipäällikkö"
                         value={jobForm.title}
                         onChange={(e) => updateJobForm("title", e.target.value)}
                         className={InputClass()}
                       />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                         <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Yritys</label>
                         <input
                           placeholder="Esim. Nokia"
                           value={jobForm.company}
                           onChange={(e) =>
                             updateJobForm("company", e.target.value)
                           }
                           className={InputClass()}
                         />
                      </div>
                      <div>
                         <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Sijainti</label>
                         <input
                           placeholder="Esim. Helsinki"
                           value={jobForm.location}
                           onChange={(e) =>
                             updateJobForm("location", e.target.value)
                           }
                           className={InputClass()}
                         />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                         <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Työsuhde</label>
                         <input
                           placeholder="Vakituinen"
                           value={jobForm.type}
                           onChange={(e) => updateJobForm("type", e.target.value)}
                           className={InputClass()}
                         />
                      </div>
                      <div>
                         <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Linkki</label>
                         <input
                           placeholder="https://..."
                           value={jobForm.url}
                           onChange={(e) => updateJobForm("url", e.target.value)}
                           className={InputClass()}
                         />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                         <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Palkka</label>
                         <input
                           placeholder="3000 €/kk"
                           value={jobForm.salary}
                           onChange={(e) => updateJobForm("salary", e.target.value)}
                           className={InputClass()}
                         />
                      </div>
                      <div>
                         <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Deadline</label>
                         <input
                           type="date"
                           value={jobForm.deadline}
                           onChange={(e) =>
                             updateJobForm("deadline", e.target.value)
                           }
                           className={InputClass()}
                         />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                         <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Yhteyshenkilö</label>
                         <input
                           placeholder="Matti Rekrytoija"
                           value={jobForm.contactPerson}
                           onChange={(e) =>
                             updateJobForm("contactPerson", e.target.value)
                           }
                           className={InputClass()}
                         />
                      </div>
                      <div>
                         <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Sähköposti</label>
                         <input
                           placeholder="matti@yritys.fi"
                           value={jobForm.contactEmail}
                           onChange={(e) =>
                             updateJobForm("contactEmail", e.target.value)
                           }
                           className={InputClass()}
                         />
                      </div>
                    </div>

                    <div>
                       <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Lyhyt kuvaus / muistiinpanot</label>
                       <textarea
                         placeholder="Mikä tässä kiinnostaa?"
                         value={jobForm.summary}
                         onChange={(e) => updateJobForm("summary", e.target.value)}
                         className={TextareaClass("min-h-[120px]")}
                       />
                    </div>

                    <div>
                       <label className="mb-3 block text-sm font-bold text-gray-400 ml-1">Kopioi ilmoitusteksti (Tärkeä tekoälylle)</label>
                       <textarea
                         placeholder="Liitä koko ilmoituksen teksti tähän. Tekoäly käyttää tätä räätälöidessään hakemustasi..."
                         value={jobForm.adText}
                         onChange={(e) => updateJobForm("adText", e.target.value)}
                         className={TextareaClass("min-h-[250px]")}
                       />
                    </div>

                    <button
                      type="button"
                      onClick={addJob}
                      className="w-full rounded-2xl bg-white px-8 py-5 text-lg font-black text-black transition-transform hover:scale-[1.02] active:scale-95 shadow-xl"
                    >
                      + Tallenna seurantaan
                    </button>
                  </div>

                  <div className="space-y-8 pt-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                      <h3 className="text-3xl font-black text-white">
                        Omat työpaikat
                      </h3>
                      <input
                        value={jobFilter}
                        onChange={(e) => setJobFilter(e.target.value)}
                        placeholder="Suodata listaa..."
                        className="w-full sm:max-w-md rounded-2xl border border-white/10 bg-black/50 px-6 py-4 text-base text-white outline-none transition-all focus:border-[#00BFA6]/50 focus:ring-1 focus:ring-[#00BFA6]"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                      <select
                        value={jobStatusFilter}
                        onChange={(e) =>
                          setJobStatusFilter(e.target.value as "all" | JobStatus)
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#00BFA6] cursor-pointer transition-all"
                      >
                        <option value="all">Kaikki tilat</option>
                        <option value="saved">Tallennettu</option>
                        <option value="interested">Kiinnostava</option>
                        <option value="applied">Haettu</option>
                        <option value="interview">Haastattelu</option>
                        <option value="offer">Tarjous</option>
                        <option value="rejected">Hylätty</option>
                      </select>

                      <select
                        value={jobPriorityFilter}
                        onChange={(e) =>
                          setJobPriorityFilter(
                            e.target.value as "all" | JobPriority
                          )
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#00BFA6] cursor-pointer transition-all"
                      >
                        <option value="all">Kaikki prio</option>
                        <option value="low">Matala</option>
                        <option value="medium">Keskitaso</option>
                        <option value="high">Korkea</option>
                      </select>

                      <select
                        value={jobSort}
                        onChange={(e) =>
                          setJobSort(
                            e.target.value as
                              | "match"
                              | "deadline"
                              | "priority"
                              | "newest"
                              | "company"
                          )
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#00BFA6] cursor-pointer transition-all"
                      >
                        <option value="newest">Uusimmat</option>
                        <option value="match">Match</option>
                        <option value="deadline">Deadline</option>
                        <option value="priority">Prio</option>
                        <option value="company">Yritys</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => setShowFavoritesOnly((prev) => !prev)}
                        className={`w-full rounded-2xl px-5 py-4 text-sm font-black transition-all ${
                          showFavoritesOnly
                            ? "bg-[#FF6F3C] text-white shadow-[0_0_20px_rgba(255,111,60,0.5)] scale-[1.02]"
                            : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1"
                        }`}
                      >
                        {showFavoritesOnly ? "★ Vain suosikit" : "Näytä suosikit"}
                      </button>
                    </div>

                    {filteredJobs.length === 0 ? (
                      <div className="rounded-[40px] border-2 border-dashed border-white/10 bg-black/40 p-12 sm:p-20 text-center font-medium text-gray-500">
                        <p className="text-xl font-bold text-white mb-2">Ei tuloksia</p>
                        <p className="text-base">Sinulla ei ole vielä yhtään työpaikkaa tai suodattimet piilottavat ne.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {filteredJobs.map((job) => {
                          const isActive = job.id === activeJobId;
                          const jobLetters = savedLetters.filter(
                            (letter) => letter.jobId === job.id
                          );
                          const jobCvs = savedCvVariants.filter(
                            (cv) => cv.jobId === job.id
                          );

                          return (
                            <JobCard
                              key={job.id}
                              job={job}
                              isActive={isActive}
                              applicationsCount={jobLetters.length}
                              cvsCount={jobCvs.length}
                              onSelect={() => setActiveJobId(job.id)}
                              onRemove={() => removeJob(job.id)}
                              onUpdate={(patch: Partial<JobItem>) => updateJob(job.id, patch)}
                              onSparring={() => startSparring(job)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === "letter" && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="rounded-[40px] border border-[#00BFA6]/30 bg-[#00BFA6]/5 p-8 sm:p-12 relative overflow-hidden shadow-[0_10px_30px_rgba(0,191,166,0.1)]">
                    <div className="absolute top-0 right-0 p-8 text-[#00BFA6] opacity-10 text-9xl font-black pointer-events-none leading-none">”</div>
                    <h3 className="text-3xl font-black text-white mb-8">
                      Rakenna Hakemus
                    </h3>

                    {activeJob ? (
                      <div className="mb-10 space-y-3 text-lg text-gray-300 bg-black/50 p-8 rounded-3xl border border-white/10 relative z-10">
                        <p className="flex flex-col sm:flex-row sm:gap-4">
                          <span className="font-black text-[#00BFA6] w-28 uppercase tracking-widest text-sm pt-1">Kohde:</span>
                          <span className="text-white font-bold text-2xl">{activeJob.title}</span>
                        </p>
                        <p className="flex flex-col sm:flex-row sm:gap-4">
                          <span className="font-black text-[#00BFA6] w-28 uppercase tracking-widest text-sm pt-1">Yritys:</span>
                          <span className="text-white font-medium">{activeJob.company || "-"}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="mb-10 p-8 bg-red-950/40 border-2 border-red-900/50 rounded-3xl text-red-300 text-lg">
                        <span className="text-3xl block mb-2">⚠️</span>
                        Palaa <strong>Työpaikat</strong> -välilehdelle ja valitse (klikkaa) ensin jokin työpaikka listalta.
                      </div>
                    )}

                    <div className="relative z-10">
                      <p className="mb-4 text-base font-bold text-gray-400">
                        Valitse sävy, jolla hakemus kirjoitetaan:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          type="button"
                          onClick={() => setLetterTone("professional")}
                          className={`flex-1 rounded-2xl px-6 py-5 text-lg font-black transition-all ${
                            letterTone === "professional"
                              ? "border-2 border-[#00BFA6] bg-[#00BFA6] text-black shadow-[0_0_20px_rgba(0,191,166,0.4)] scale-105"
                              : "border border-white/10 bg-black/60 text-white hover:bg-white/10"
                          }`}
                        >
                          💼 Asiallinen
                        </button>
                        <button
                          type="button"
                          onClick={() => setLetterTone("warm")}
                          className={`flex-1 rounded-2xl px-6 py-5 text-lg font-black transition-all ${
                            letterTone === "warm"
                              ? "border-2 border-[#00BFA6] bg-[#00BFA6] text-black shadow-[0_0_20px_rgba(0,191,166,0.4)] scale-105"
                              : "border border-white/10 bg-black/60 text-white hover:bg-white/10"
                          }`}
                        >
                          🤝 Lämmin
                        </button>
                        <button
                          type="button"
                          onClick={() => setLetterTone("sales")}
                          className={`flex-1 rounded-2xl px-6 py-5 text-lg font-black transition-all ${
                            letterTone === "sales"
                              ? "border-2 border-[#FF6F3C] bg-[#FF6F3C] text-black shadow-[0_0_20px_rgba(255,111,60,0.4)] scale-105"
                              : "border border-white/10 bg-black/60 text-white hover:bg-white/10"
                          }`}
                        >
                          🚀 Myyvä
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCoverLetterSubmit}
                      disabled={loadingLetter || !activeJob}
                      className="mt-10 w-full rounded-2xl bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] px-8 py-6 text-xl font-black text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-[0_15px_40px_-10px_rgba(0,191,166,0.5)] relative z-10"
                    >
                      {loadingLetter
                        ? "Tekoäly kirjoittaa..."
                        : "3. KIRJOITA HAKEMUS TÄHÄN PAIKKAAN"}
                    </button>
                  </div>

                  {activeJobLetters.length > 0 && (
                    <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                      <h3 className="mb-5 text-xl font-bold text-white">
                        Aiemmat hakemukset tähän paikkaan
                      </h3>
                      <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                        {activeJobLetters.map((letter) => (
                          <button
                            key={letter.id}
                            type="button"
                            onClick={() => {
                              setLetterResult(`HAKEMUS:\n${letter.content}`);
                              setLetterDraft(letter.content);
                            }}
                            className="w-full rounded-2xl border border-white/10 bg-black/50 px-6 py-5 text-left transition-all hover:border-[#00BFA6]/50 hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(0,191,166,0.3)]"
                          >
                            <p className="font-bold text-lg text-[#00BFA6] truncate">
                              {letter.jobTitle}
                            </p>
                            <p className="text-base font-medium text-white truncate mt-1">
                              {letter.companyName}
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                              Luotu: {new Date(letter.createdAt).toLocaleString("fi-FI")}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {letterResult ? (
                    <>
                      <div className="rounded-[40px] border border-[#00BFA6]/40 bg-[#0F0F0F] p-8 sm:p-12 shadow-[0_15px_50px_rgba(0,191,166,0.15)]">
                        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-white/10 pb-6">
                          <h2 className="text-3xl font-black text-white">
                            Valmis hakemus
                          </h2>
                          <button
                            type="button"
                            onClick={saveEditedLetter}
                            className="w-full sm:w-auto rounded-2xl border border-[#00BFA6]/50 bg-[#00BFA6]/10 px-6 py-3.5 text-base font-bold text-[#00BFA6] transition-all hover:bg-[#00BFA6] hover:text-black"
                          >
                            Tallenna omat muokkaukset
                          </button>
                        </div>

                        <textarea
                          value={letterDraft}
                          onChange={(e) => setLetterDraft(e.target.value)}
                          className="min-h-[500px] w-full rounded-3xl border-none bg-transparent p-2 font-sans text-lg leading-relaxed text-gray-200 outline-none resize-y"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            letterDraft || parsedLetter,
                            "Hakemus kopioitu leikepöydälle!"
                          )
                        }
                        className="w-full rounded-2xl border border-white/20 bg-white px-8 py-6 text-xl font-black text-black transition-transform hover:scale-[1.02] active:scale-95 shadow-2xl"
                      >
                        Kopioi hakemus leikepöydälle 📋
                      </button>
                    </>
                  ) : (
                    <div className="rounded-[40px] border-2 border-dashed border-white/10 bg-black/40 p-12 sm:p-20 text-center font-medium text-gray-500">
                      <div className="text-5xl mb-6">✍️</div>
                      <p className="text-xl font-bold text-white mb-2">Hakemus puuttuu</p>
                      <p className="text-base text-gray-400">Paina ylempää nappia, niin hakemuksen teksti ilmestyy tähän.</p>
                    </div>
                  )}
                </div>
              )}

              {/* VINKIT TAB */}
              {tab === "tips" && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="rounded-[40px] border border-[#FF6F3C]/30 bg-[#FF6F3C]/5 p-8 sm:p-12 shadow-[0_15px_50px_rgba(255,111,60,0.1)]">
                    <h2 className="text-3xl font-black text-white mb-4">Työnhaun Tehovinkit 🚀</h2>
                    <p className="text-lg text-gray-400 mb-10">Lue nämä ohjeet ennen kuin lähetät seuraavan hakemuksesi, niin parannat mahdollisuuksiasi jopa 80%.</p>

                    <div className="space-y-8">
                      <div className="bg-black/50 p-8 rounded-3xl border border-white/10">
                        <h3 className="text-xl font-bold text-[#FF6F3C] mb-3">1. Rakenna vahva "Hook" (Koukku)</h3>
                        <p className="text-gray-300 leading-relaxed">
                          Rekrytoija lukee satoja CV:itä. Älä aloita tylsästi "Olen 24-vuotias asiakaspalvelija". 
                          Aloita mieluummin tuloksilla: <em>"Olen myyntiin erikoistunut tiimipelaaja, joka kasvatti edellisessä roolissaan asiakastyytyväisyyttä 20%."</em> 
                          Käytä Studion "Tavoiteltu rooli" -kenttää apunasi. Tekoäly kirjoittaa Profiiliisi tämän koukun, jos kerrot tarkasti mitä haluat.
                        </p>
                      </div>

                      <div className="bg-black/50 p-8 rounded-3xl border border-white/10">
                        <h3 className="text-xl font-bold text-[#FF6F3C] mb-3">2. Kvantifioi tuloksesi (Numeroita!)</h3>
                        <p className="text-gray-300 leading-relaxed">
                          Pelkkä työtehtävien listaaminen ei riitä. Kerro <strong>mitä sait aikaan</strong>. 
                          Sijaan että kirjoitat "Olin kassalla", kirjoita "Palvelin päivittäin yli 200 asiakasta tehokkaasti kiireisessä ympäristössä." 
                          Lisää numeroita, prosentteja ja säästettyjä euroja aina kun mahdollista.
                        </p>
                      </div>

                      <div className="bg-black/50 p-8 rounded-3xl border border-white/10">
                        <h3 className="text-xl font-bold text-[#FF6F3C] mb-3">3. Räätälöi AINA</h3>
                        <p className="text-gray-300 leading-relaxed">
                          Yksi yleinen CV ei toimi joka paikkaan. Duuniharavassa voit luoda jokaiselle työpaikalle 
                          oman, juuri siihen ilmoitukseen räätälöidyn CV-version (käytä "Räätälöi CV tähän työpaikkaan" -nappia). 
                          Varmista, että työpaikkailmoituksen avainsanat löytyvät CV:si taidoista.
                        </p>
                      </div>

                      <div className="bg-black/50 p-8 rounded-3xl border border-white/10">
                        <h3 className="text-xl font-bold text-[#FF6F3C] mb-3">4. ATS-järjestelmien ymmärtäminen</h3>
                        <p className="text-gray-300 leading-relaxed">
                          Suuryritykset käyttävät botteja (ATS) lukemaan CV:si ennen ihmistä. Jos käytät liian monimutkaisia fontteja 
                          tai kummallisia asetteluja, botti ei osaa lukea sitä. Duuniharavan PDF-export on rakennettu siten, 
                          että teksti on aina luettavissa myös koneellisesti.
                        </p>
                      </div>

                      <div className="bg-black/50 p-8 rounded-3xl border border-white/10">
                        <h3 className="text-xl font-bold text-[#FF6F3C] mb-3">5. Harjoittele haastattelua etukäteen</h3>
                        <p className="text-gray-300 leading-relaxed">
                          Työpaikat-listauksessa on <strong>"Treenaa"</strong>-nappi. Käytä sitä! Tekoäly simulaattori kysyy sinulta 
                          juuri niitä kysymyksiä, joita oikea rekrytoija kysyisi tuon kyseisen työpaikkailmoituksen perusteella.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ponnahdusilmoitukset (Alerts) - Isompi ja selkeämpi fontti */}
            {(message || errorMessage) && (
              <div
                className={`fixed bottom-8 right-4 left-4 sm:left-auto sm:right-8 sm:max-w-md z-50 rounded-[28px] border-2 p-8 text-lg font-black shadow-[0_20px_60px_rgba(0,0,0,0.8)] transition-all animate-in slide-in-from-bottom-5 ${
                  errorMessage
                    ? "border-red-900 bg-red-950/95 text-red-300 backdrop-blur-xl"
                    : "border-[#00BFA6] bg-[#00BFA6]/95 text-black backdrop-blur-xl"
                }`}
              >
                {errorMessage || message}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* HAASTATTELUSIMULAATTORI MODAALI */}
      {sparringJob && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#141414] border border-white/10 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[80vh] animate-in zoom-in-95 duration-300">
            <div className="p-6 sm:p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h3 className="font-black text-2xl text-white tracking-tight">🎤 Haastattelusimulaattori</h3>
                <p className="text-sm text-[#00BFA6] mt-1 font-bold">{sparringJob.title} @ {sparringJob.company || "Yritys"}</p>
              </div>
              <button onClick={() => setSparringJob(null)} className="text-gray-500 hover:text-white font-black text-2xl bg-white/5 w-12 h-12 rounded-full flex items-center justify-center transition-colors">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
              {sparringChat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-3xl p-6 ${msg.role === 'ai' ? 'bg-[#00BFA6]/10 border border-[#00BFA6]/20 text-gray-200 rounded-tl-sm' : 'bg-white/10 text-white rounded-tr-sm'}`}>
                    <p className={`text-xs font-black mb-3 tracking-widest uppercase ${msg.role === 'ai' ? 'text-[#00BFA6]' : 'text-gray-400'}`}>
                      {msg.role === 'ai' ? '🤖 Rekrytoija' : '👤 Sinä'}
                    </p>
                    <p className="leading-relaxed text-[15px]">{msg.text}</p>
                  </div>
                </div>
              ))}
              
              {/* UUSI KIRJOITTAA-ANIMAATIO */}
              {isSparringTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#00BFA6]/10 border border-[#00BFA6]/20 rounded-3xl p-4 text-[#00BFA6] text-xl font-black flex gap-1 rounded-tl-sm">
                    <span className="animate-bounce" style={{animationDelay: "0s"}}>.</span>
                    <span className="animate-bounce" style={{animationDelay: "0.2s"}}>.</span>
                    <span className="animate-bounce" style={{animationDelay: "0.4s"}}>.</span>
                  </div>
                </div>
              )}
              
              {/* Näkymätön div automaattista vieritystä varten */}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 sm:p-8 border-t border-white/5 bg-black/50">
              <form onSubmit={sendSparringMessage} className="flex gap-4">
                <input 
                  value={sparringMessage} 
                  onChange={e => setSparringMessage(e.target.value)} 
                  placeholder="Kirjoita vastauksesi tähän..." 
                  className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-white outline-none focus:border-[#00BFA6] transition-colors" 
                  disabled={isSparringTyping}
                />
                <button 
                  type="submit" 
                  disabled={!sparringMessage.trim() || isSparringTyping} 
                  className="bg-[#00BFA6] text-black font-black px-8 rounded-2xl disabled:opacity-50 hover:scale-[1.05] active:scale-95 transition-transform"
                >
                  LÄHETÄ
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
