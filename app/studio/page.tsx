"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
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

type ParsedCvResult = {
  score: string;
  report: string[];
  cvBody: string;
};

type Tab = "cv" | "job" | "letter";
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

const pdfHeadingNames = [
  "Profiili",
  "Työkokemus",
  "Koulutus",
  "Kielitaito",
  "Taidot",
  "Kortit ja pätevyydet",
  "Harrastukset",
];

const defaultCustomStyles: Record<CvStyleVariant, CvCustomStyle> = {
  modern: {
    sidebarBg: "#0f172a",
    sidebarText: "#ffffff",
    mainBg: "#ffffff",
    mainText: "#111827",
    headingColor: "#475569",
    accentColor: "#0369a1",
    borderRadius: 30,
    sidebarWidth: 255,
    nameSize: 40,
    bodySize: 15,
    lineHeight: 1.7,
    sectionSpacing: 24,
    imageRadius: 24,
  },
  classic: {
    sidebarBg: "#f5f5f4",
    sidebarText: "#111827",
    mainBg: "#ffffff",
    mainText: "#111827",
    headingColor: "#78716c",
    accentColor: "#a16207",
    borderRadius: 30,
    sidebarWidth: 255,
    nameSize: 40,
    bodySize: 15,
    lineHeight: 1.7,
    sectionSpacing: 24,
    imageRadius: 24,
  },
  compact: {
    sidebarBg: "#f8fafc",
    sidebarText: "#111827",
    mainBg: "#ffffff",
    mainText: "#111827",
    headingColor: "#64748b",
    accentColor: "#0f766e",
    borderRadius: 30,
    sidebarWidth: 220,
    nameSize: 32,
    bodySize: 14,
    lineHeight: 1.6,
    sectionSpacing: 18,
    imageRadius: 20,
  },
  bold: {
    sidebarBg: "#1e1b4b",
    sidebarText: "#ffffff",
    mainBg: "#ffffff",
    mainText: "#111827",
    headingColor: "#4338ca",
    accentColor: "#4f46e5",
    borderRadius: 30,
    sidebarWidth: 255,
    nameSize: 48,
    bodySize: 15,
    lineHeight: 1.7,
    sectionSpacing: 24,
    imageRadius: 24,
  },
};

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

function splitPdfLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function isPdfHeading(line: string) {
  return line === line.toUpperCase() || pdfHeadingNames.includes(line);
}

function getStatusLabel(status: JobStatus) {
  switch (status) {
    case "saved":
      return "Tallennettu";
    case "interested":
      return "Kiinnostava";
    case "applied":
      return "Haettu";
    case "interview":
      return "Haastattelu";
    case "offer":
      return "Tarjous";
    case "rejected":
      return "Hylätty";
    default:
      return status;
  }
}

function getPriorityLabel(priority: JobPriority) {
  switch (priority) {
    case "low":
      return "Matala";
    case "medium":
      return "Keskitaso";
    case "high":
      return "Korkea";
    default:
      return priority;
  }
}

function priorityRank(priority: JobPriority) {
  switch (priority) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
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

// MUUTOS: SectionShell sai reilusti ilmaa (p-8 md:p-10) ja selkeän tumman laatikon (bg-zinc-900/80)
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
    <div className="mb-8 rounded-[32px] border border-white/10 bg-zinc-900/80 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-xl transition-all duration-300">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-[#00BFA6]">
            {step}
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white md:text-[32px]">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-gray-400">
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

// MUUTOS: StatCardit saivat selkeän pohjan (bg-zinc-900/80)
function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-zinc-900/80 p-6 shadow-xl w-full transition-all duration-300 hover:-translate-y-2 hover:border-[#00BFA6]/50">
      <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-gray-400">
        {title}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">
        {value}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
    </div>
  );
}

// MUUTOS: Inputteihin lisätty pehmeä tumma pohja ja selkeä padding
function InputClass() {
  return "w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-white outline-none transition-all placeholder:text-gray-600 focus:border-[#00BFA6] focus:ring-1 focus:ring-[#00BFA6]";
}

function TextareaClass(minHeight: string) {
  return `w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-white outline-none transition-all placeholder:text-gray-600 focus:border-[#00BFA6] focus:ring-1 focus:ring-[#00BFA6] ${minHeight}`;
}

function JobCard({
  job,
  isActive,
  applicationsCount,
  cvsCount,
  onSelect,
  onRemove,
  onUpdate,
}: {
  job: JobItem;
  isActive: boolean;
  applicationsCount: number;
  cvsCount: number;
  onSelect: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<JobItem>) => void;
}) {
  const score = safeMatchScore(job.matchScore);
  const daysLeft = daysUntil(job.deadline);

  return (
    <div
      className={`rounded-[30px] border p-6 sm:p-8 transition-all duration-300 ${
        isActive
          ? "border-[#00BFA6]/50 bg-[#00BFA6]/5 shadow-[0_10px_30px_-10px_rgba(0,191,166,0.2)]"
          : "border-white/10 bg-zinc-900/50 hover:border-white/20 hover:-translate-y-1"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {job.source && (
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-300">
                {job.source}
              </span>
            )}
            <span className="rounded-full bg-[#00BFA6]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#00BFA6]">
              Match {score}%
            </span>
            <span className="rounded-full bg-white/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-300">
              {getStatusLabel(job.status)}
            </span>
            <span className="rounded-full bg-white/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-300">
              {getPriorityLabel(job.priority)}
            </span>
            {job.favorite && (
              <span className="rounded-full bg-[#FF6F3C]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#FF6F3C]">
                Suosikki
              </span>
            )}
          </div>

          <h4 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {job.title || "Nimetön työpaikka"}
          </h4>

          <p className="mt-3 text-base text-gray-400">
            {[job.company, job.location, job.type].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onUpdate({ favorite: !job.favorite })}
            className={`flex-1 sm:flex-none rounded-2xl px-5 py-3 text-sm font-bold transition-all ${
              job.favorite
                ? "bg-[#FF6F3C] text-white hover:bg-[#FF6F3C]/80 shadow-[0_0_15px_rgba(255,111,60,0.4)]"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            {job.favorite ? "★ Suosikki" : "☆ Suosikiksi"}
          </button>

          <button
            type="button"
            onClick={onSelect}
            className={`flex-1 sm:flex-none rounded-2xl px-5 py-3 text-sm font-bold transition-all ${
              isActive
                ? "bg-white text-black"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            {isActive ? "Valittu" : "Valitse"}
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="flex-1 sm:flex-none rounded-2xl border border-red-900/50 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
          >
            Poista
          </button>
        </div>
      </div>

      {job.summary && (
        <p className="mt-6 text-sm sm:text-base leading-relaxed text-gray-300 bg-black/20 p-4 rounded-2xl">{job.summary}</p>
      )}

      {job.whyFit && (
        <div className="mt-6 rounded-2xl border border-[#00BFA6]/20 bg-[#00BFA6]/5 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#00BFA6]">
            Miksi sopii
          </p>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-gray-200">{job.whyFit}</p>
        </div>
      )}

      {daysLeft !== null && (
        <div
          className={`mt-6 rounded-2xl border p-4 text-sm font-medium ${
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

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
            Yritys
          </p>
          <p className="mt-2 text-sm sm:text-base font-medium text-white truncate">
            {job.company || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
            Sijainti
          </p>
          <p className="mt-2 text-sm sm:text-base font-medium text-white truncate">
            {job.location || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
            Hakemukset
          </p>
          <p className="mt-2 text-sm sm:text-base font-medium text-white">
            {applicationsCount}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
            CV-versiot
          </p>
          <p className="mt-2 text-sm sm:text-base font-medium text-white">{cvsCount}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-400 ml-1">Status</label>
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
          <label className="mb-2 block text-sm font-medium text-gray-400 ml-1">Prioriteetti</label>
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
          <label className="mb-2 block text-sm font-medium text-gray-400 ml-1">Hakupäivä</label>
          <input
            type="date"
            value={job.appliedAt || ""}
            onChange={(e) => onUpdate({ appliedAt: e.target.value })}
            className={InputClass()}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-400 ml-1">Deadline</label>
          <input
            type="date"
            value={job.deadline || ""}
            onChange={(e) => onUpdate({ deadline: e.target.value })}
            className={InputClass()}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-400 ml-1">Palkka</label>
          <input
            value={job.salary || ""}
            onChange={(e) => onUpdate({ salary: e.target.value })}
            placeholder="Esim. 2800–3200 €/kk"
            className={InputClass()}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-400 ml-1">
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
          <label className="mb-2 block text-sm font-medium text-gray-400 ml-1">
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
          <label className="mb-2 block text-sm font-medium text-gray-400 ml-1">Yrityksen sivu</label>
          <input
            value={job.companyWebsite || ""}
            onChange={(e) => onUpdate({ companyWebsite: e.target.value })}
            placeholder="https://..."
            className={InputClass()}
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-gray-400 ml-1">Muistiinpanot</label>
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
          className="mt-6 inline-flex w-full sm:w-auto justify-center rounded-2xl border border-[#00BFA6]/30 bg-[#00BFA6]/10 px-6 py-4 text-sm font-bold text-[#00BFA6] transition hover:bg-[#00BFA6]/20"
        >
          Avaa työpaikkalinkki ➔
        </a>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  
  // MUUTOS: Ohjemodaalin tila
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
    } else {
      setHasSession(true);
      setIsAuthChecking(false);
    }
  }, [router]);

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

  const [jobStatusFilter, setJobStatusFilter] =
    useState<"all" | JobStatus>("all");
  const [jobPriorityFilter, setJobPriorityFilter] =
    useState<"all" | JobPriority>("all");
  const [jobSort, setJobSort] = useState<
    "match" | "deadline" | "priority" | "newest" | "company"
  >("newest");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [searchProfile, setSearchProfile] = useState(emptySearchProfile);
  const [jobForm, setJobForm] = useState(emptyJobForm);

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [activeJobId, setActiveJobId] = useState<string>("");

  const [savedLetters, setSavedLetters] = useState<SavedLetter[]>([]);
  const [savedCvVariants, setSavedCvVariants] = useState<SavedCvVariant[]>([]);
  const [customStyles, setCustomStyles] =
    useState<Record<CvStyleVariant, CvCustomStyle>>(defaultCustomStyles);

  const pdfRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setMode(parsed.mode ?? "improve");
      setTab(parsed.tab ?? "cv");
      setCvStyle(parsed.cvStyle ?? "modern");
      setLetterTone(parsed.letterTone ?? "professional");
      setCvResult(parsed.cvResult ?? "");
      setLetterResult(parsed.letterResult ?? "");
      setLetterDraft(parsed.letterDraft ?? "");
      setProfileImage(parsed.profileImage ?? "");
      setForm(parsed.form ?? emptyForm);
      setSearchProfile(parsed.searchProfile ?? emptySearchProfile);
      setJobForm({ ...emptyJobForm, ...(parsed.jobForm ?? {}) });
      setJobs(Array.isArray(parsed.jobs) ? parsed.jobs.map(normalizeJob) : []);
      setActiveJobId(parsed.activeJobId ?? "");
      setSavedLetters(parsed.savedLetters ?? []);
      setSavedCvVariants(parsed.savedCvVariants ?? []);
      setCustomStyles(parsed.customStyles ?? defaultCustomStyles);
      setJobStatusFilter(parsed.jobStatusFilter ?? "all");
      setJobPriorityFilter(parsed.jobPriorityFilter ?? "all");
      setJobSort(parsed.jobSort ?? "newest");
      setShowFavoritesOnly(parsed.showFavoritesOnly ?? false);
    } catch {
      console.error("Tallennetun tilan lukeminen epäonnistui.");
    }
  }, []);

  useEffect(() => {
    if (isAuthChecking) return;
    const state = {
      mode,
      tab,
      cvStyle,
      letterTone,
      cvResult,
      letterResult,
      letterDraft,
      profileImage,
      form,
      searchProfile,
      jobForm,
      jobs,
      activeJobId,
      savedLetters,
      savedCvVariants,
      customStyles,
      jobStatusFilter,
      jobPriorityFilter,
      jobSort,
      showFavoritesOnly,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [
    mode,
    tab,
    cvStyle,
    letterTone,
    cvResult,
    letterResult,
    letterDraft,
    profileImage,
    form,
    searchProfile,
    jobForm,
    jobs,
    activeJobId,
    savedLetters,
    savedCvVariants,
    customStyles,
    jobStatusFilter,
    jobPriorityFilter,
    jobSort,
    showFavoritesOnly,
    isAuthChecking
  ]);

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
      name: "Peetu Salminen",
      phone: "0449776494",
      email: "peetu.salminen1@gmail.com",
      location: "Vantaa",
      targetJob: "Myyjä",
      education: "Sotungin lukio, Vantaa",
      experience:
        "Marjojen myynti, asiakaspalvelu, asiakkaiden kohtaaminen ja tuotteiden myynti. Lisäksi kokemusta varasto- ja logistiikkatehtävistä sekä keikkaluonteisista töistä.",
      languages: "Suomi, englanti, ruotsi",
      skills: "Viestintä, asiakaspalvelu, myynti, oma-aloitteisuus",
      cards: "B-ajokortti, hygieniapassi, EA1",
      hobbies: "Kuntosali, jääkiekko",
    });

    setSearchProfile({
      desiredRoles: "Myyjä, asiakaspalvelija, varastotyöntekijä",
      desiredLocation: "Uusimaa",
      workType: "Kokoaikainen tai osa-aikainen",
      shiftPreference: "Päivävuoro",
      salaryWish: "3000 kk",
      keywords: "myynti, asiakaspalvelu, varasto",
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
      setMessage("Kopiointi epäonnistui.");
      setTimeout(() => setMessage(""), 2500);
    }
  }

  async function downloadPdf() {
    if (!pdfRef.current) return;

    try {
      setDownloadingPdf(true);
      setMessage("");
      setErrorMessage("");

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`duuniharava-cv-${cvStyle}.pdf`);
      setMessage("PDF ladattu.");
      setTimeout(() => setMessage(""), 2500);
    } catch (error) {
      console.error(error);
      setErrorMessage("PDF:n luonti epäonnistui.");
    } finally {
      setDownloadingPdf(false);
    }
  }

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
  }

  function removeJob(id: string) {
    const filtered = jobs.filter((job) => job.id !== id);
    setJobs(filtered);

    if (activeJobId === id) {
      setActiveJobId(filtered[0]?.id || "");
    }

    setSavedLetters((prev) => prev.filter((letter) => letter.jobId !== id));
    setSavedCvVariants((prev) => prev.filter((cv) => cv.jobId !== id));
  }

  async function suggestJobs() {
    setLoadingJobs(true);
    setMessage("");
    setErrorMessage("");

    try {
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
          onlyActive: true, // Pyydetään vain voimassa olevia työpaikkoja
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
  }

  const customStyle = customStyles[cvStyle];

  if (isAuthChecking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0F0F0F] text-white">
        <p className="text-gray-400 font-bold">Ladataan studiota...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white overflow-x-hidden font-sans pb-20">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,191,166,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,111,60,0.1),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_35%,rgba(0,0,0,0.3))]" />
        
        <div className="relative mx-auto max-w-7xl px-6 sm:px-8 py-10 md:py-14 lg:py-16 xl:px-12">
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
            <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#00BFA6] backdrop-blur-sm">
              Studio · Hakuprofiili · Työpaikat · Hakemukset
            </div>
            <button
              onClick={() => {
                clearSession();
                router.push("/login");
              }}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold text-gray-400 transition-all hover:bg-white/5 hover:text-white whitespace-nowrap"
            >
              Kirjaudu ulos
            </button>
          </div>

          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl sm:text-5xl font-black tracking-tight text-white lg:text-6xl lg:leading-[1.1]">
                Kaikki työnhakuun <span className="text-[#00BFA6]">yhdestä paikasta.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-gray-400 md:text-lg">
                Tekoäly tekee työt: Se luo sinulle loistavan CV:n, etsii avoimet työpaikat ja laatii hakemukset valmiiksi.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={fillExample}
                  className="rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-black transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex-1 sm:flex-none text-center whitespace-nowrap"
                >
                  Täytä esimerkki
                </button>

                <button
                  type="button"
                  onClick={() => applyQuickTarget("sales")}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:border-[#00BFA6]/50 flex-1 sm:flex-none text-center whitespace-nowrap"
                >
                  Myyntityö
                </button>

                <button
                  type="button"
                  onClick={() => applyQuickTarget("warehouse")}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:border-[#00BFA6]/50 flex-1 sm:flex-none text-center whitespace-nowrap"
                >
                  Varastotyö
                </button>

                <button
                  type="button"
                  onClick={() => applyQuickTarget("shorter")}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:border-[#00BFA6]/50 flex-1 sm:flex-none text-center whitespace-nowrap"
                >
                  Tee tiiviimpi
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-5 w-full">
              <StatCard
                title="CV"
                value="Muokattava"
                description="Säädä värejä, fonttikokoja, kulmia ja rakennetta."
              />
              <StatCard
                title="Hakemukset"
                value="3 sävyä"
                description="Asiallinen, lämmin tai myyvä työpaikan mukaan."
              />
              <StatCard
                title="Työpaikat"
                value="Seuranta"
                description="Status, deadline, muistiinpanot ja prioriteetti."
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 sm:px-8 py-10 md:py-14 xl:px-12">
        
        {/* MUUTOS: Ohjeet-nappi & Modal (Käyttäjäystävällinen senior-apu) */}
        <div className="mb-8 flex justify-center sm:justify-start">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-3 rounded-2xl bg-[#00BFA6]/10 border border-[#00BFA6]/40 px-6 py-3.5 text-sm sm:text-base font-bold text-[#00BFA6] transition-all hover:bg-[#00BFA6]/20 hover:scale-[1.02]"
          >
            <span className="text-xl">💡</span> {showHelp ? "Piilota ohjeet" : "Näytä selkeät käyttöohjeet"}
          </button>
        </div>

        {showHelp && (
          <div className="mb-12 rounded-[32px] border border-[#00BFA6]/30 bg-zinc-900/90 p-6 sm:p-10 shadow-[0_10px_40px_rgba(0,191,166,0.15)] backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-5">
              <h2 className="text-2xl sm:text-3xl font-black text-white">Näin käytät Duuniharavaa</h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white font-bold p-2 text-xl transition">✕ Sulje</button>
            </div>
            
            <div className="space-y-8 text-gray-300 text-base sm:text-lg leading-relaxed">
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#00BFA6] text-black font-black flex items-center justify-center text-xl mt-1">1</div>
                <div>
                  <strong className="text-white block text-xl mb-2">Täytä omat tietosi</strong>
                  Aloita alla olevasta laatikosta (Vaihe 1). Kirjoita nimesi, työkokemuksesi ja koulutuksesi. Voit myös vain valita ja ladata tietokoneeltasi vanhan CV:n PDF-muodossa, niin tekoäly lukee sen puolestasi.
                </div>
              </div>

              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#00BFA6] text-black font-black flex items-center justify-center text-xl mt-1">2</div>
                <div>
                  <strong className="text-white block text-xl mb-2">Paina "Generoi CV"</strong>
                  Rullaa Vaihe 1 -laatikon loppuun ja paina vihreää nappia. Tekoäly muotoilee sinulle uuden, hienon CV:n. Voit ladata sen koneellesi PDF-napista.
                </div>
              </div>

              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FF6F3C] text-black font-black flex items-center justify-center text-xl mt-1">3</div>
                <div>
                  <strong className="text-white block text-xl mb-2">Etsi työpaikkoja</strong>
                  Kerro alempana (Vaihe 2), millaista työtä etsit (esim. "Myyjä, Uusimaa"). Paina "Ehdota työpaikkoja" -nappia, jolloin ohjelma etsii sinulle sopivia avoimia tehtäviä.
                </div>
              </div>

              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FF6F3C] text-black font-black flex items-center justify-center text-xl mt-1">4</div>
                <div>
                  <strong className="text-white block text-xl mb-2">Tee hakemus napin painalluksella</strong>
                  Sivun oikeassa reunassa on välilehdet "CV", "Työpaikat" ja "Hakemukset". Valitse kiinnostava työpaikka ja pyydä tekoälyä kirjoittamaan siihen valmis, räätälöity työhakemus.
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/10 text-center sm:text-left">
              <button onClick={() => setShowHelp(false)} className="rounded-2xl bg-white px-8 py-4 text-base sm:text-lg font-black text-black transition-all hover:bg-gray-200 hover:scale-[1.02] shadow-lg w-full sm:w-auto">
                Selvä, ymmärsin! Piilota tämä ohje
              </button>
            </div>
          </div>
        )}

        <div className="mb-10 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setMode("improve")}
            className={`rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-300 flex-1 sm:flex-none ${
              mode === "improve"
                ? "bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] text-black shadow-[0_0_20px_rgba(0,191,166,0.3)]"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1"
            }`}
          >
            Paranna CV
          </button>

          <button
            type="button"
            onClick={() => setMode("create")}
            className={`rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-300 flex-1 sm:flex-none ${
              mode === "create"
                ? "bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] text-black shadow-[0_0_20px_rgba(0,191,166,0.3)]"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1"
            }`}
          >
            Luo uusi CV
          </button>

          <div className="ml-auto hidden text-sm font-medium text-gray-500 lg:block">
            Muutokset tallentuvat selaimen muistiin automaattisesti.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1fr]">
          
          <section className="space-y-10">
            <SectionShell
              step="Vaihe 1"
              title="Hakijan tiedot"
              description="Täytä tietosi huolellisesti tai lataa vanha CV:si. Näitä käytetään pohjana kaikessa tekoälyn tekemässä työssä."
              action={
                <button
                  type="button"
                  onClick={clearForm}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-gray-300 transition-all hover:bg-white/10 hover:border-red-500/50"
                >
                  Tyhjennä
                </button>
              }
            >
              <form onSubmit={handleCvSubmit} className="space-y-6 mt-6">
                {mode === "improve" && (
                  <div>
                    <label className="mb-3 block text-sm font-bold text-gray-400">
                      Nykyinen CV (PDF)
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <label className="cursor-pointer rounded-2xl bg-white/[0.03] border border-white/10 px-6 py-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#00BFA6]/50 flex-1 sm:flex-none">
                        <span className="text-sm font-bold text-white">
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
                        <span className="text-sm font-medium text-[#00BFA6] break-words px-2">
                          ✓ {form.cvFileName} valittu
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-2">
                  <div>
                     <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Koko nimi</label>
                     <input
                       placeholder="Esim. Matti Meikäläinen"
                       value={form.name}
                       onChange={(e) => updateField("name", e.target.value)}
                       className={InputClass()}
                     />
                  </div>
                  <div>
                     <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Puhelin</label>
                     <input
                       placeholder="040 123 4567"
                       value={form.phone}
                       onChange={(e) => updateField("phone", e.target.value)}
                       className={InputClass()}
                     />
                  </div>
                  <div>
                     <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Sähköposti</label>
                     <input
                       placeholder="oma@email.com"
                       value={form.email}
                       onChange={(e) => updateField("email", e.target.value)}
                       className={InputClass()}
                     />
                  </div>
                  <div>
                     <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Paikkakunta</label>
                     <input
                       placeholder="Esim. Helsinki"
                       value={form.location}
                       onChange={(e) => updateField("location", e.target.value)}
                       className={InputClass()}
                     />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Tavoiteltu rooli / ammatti</label>
                  <input
                    placeholder="Mitä työtä haluat hakea? (esim. Myyjä, Koodari)"
                    value={form.targetJob}
                    onChange={(e) => updateField("targetJob", e.target.value)}
                    className={InputClass()}
                  />
                </div>

                <div className="pt-2">
                  <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Koulutus</label>
                  <textarea
                    placeholder="Kirjaa tänne oppilaitokset ja tutkinnot..."
                    value={form.education}
                    onChange={(e) => updateField("education", e.target.value)}
                    className={TextareaClass("min-h-[120px]")}
                  />
                </div>

                <div className="pt-2">
                  <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Työkokemus</label>
                  <textarea
                    placeholder="Missä olet ollut töissä ja mitä teit?"
                    value={form.experience}
                    onChange={(e) => updateField("experience", e.target.value)}
                    className={TextareaClass("min-h-[160px]")}
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Kielitaito</label>
                    <textarea
                      placeholder="Suomi (äidinkieli), Englanti (sujuva)..."
                      value={form.languages}
                      onChange={(e) => updateField("languages", e.target.value)}
                      className={TextareaClass("min-h-[120px]")}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Osaaminen & Taidot</label>
                    <textarea
                      placeholder="Mitä taitoja sinulla on? (esim. asiakaspalvelu)"
                      value={form.skills}
                      onChange={(e) => updateField("skills", e.target.value)}
                      className={TextareaClass("min-h-[120px]")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Kortit & Pätevyydet</label>
                    <textarea
                      placeholder="Työturvallisuuskortti, B-ajokortti..."
                      value={form.cards}
                      onChange={(e) => updateField("cards", e.target.value)}
                      className={TextareaClass("min-h-[100px]")}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Harrastukset</label>
                    <textarea
                      placeholder="Mitä teet vapaa-ajalla?"
                      value={form.hobbies}
                      onChange={(e) => updateField("hobbies", e.target.value)}
                      className={TextareaClass("min-h-[100px]")}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <ProfileImageUpload image={profileImage} onChange={setProfileImage} />
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-6 sm:p-8 mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-bold text-white">Ulkoasun säädöt (CV)</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Hienosäädä dokumenttia ennen latausta.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetCurrentStyle}
                      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-[#00BFA6]/50"
                    >
                      Palauta oletukset
                    </button>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {(["modern", "classic", "compact", "bold"] as CvStyleVariant[]).map(
                      (variant) => (
                        <button
                          key={variant}
                          type="button"
                          onClick={() => setCvStyle(variant)}
                          className={`rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-300 flex-1 sm:flex-none ${
                            cvStyle === variant
                              ? "bg-[#00BFA6] text-black shadow-[0_0_15px_rgba(0,191,166,0.4)] scale-105"
                              : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1"
                          }`}
                        >
                          {variant === "modern" && "Moderni"}
                          {variant === "classic" && "Klassinen"}
                          {variant === "compact" && "Tiivis"}
                          {variant === "bold" && "Näyttävä"}
                        </button>
                      )
                    )}
                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">
                        Sivupalkin väri
                      </label>
                      <input
                        type="color"
                        value={customStyle.sidebarBg}
                        onChange={(e) =>
                          updateCustomStyle("sidebarBg", e.target.value)
                        }
                        className="h-14 w-full rounded-2xl border border-white/10 bg-[#0F0F0F] p-2 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">
                        Sivupalkin tekstiväri
                      </label>
                      <input
                        type="color"
                        value={customStyle.sidebarText}
                        onChange={(e) =>
                          updateCustomStyle("sidebarText", e.target.value)
                        }
                        className="h-14 w-full rounded-2xl border border-white/10 bg-[#0F0F0F] p-2 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">
                        Pääalueen tausta
                      </label>
                      <input
                        type="color"
                        value={customStyle.mainBg}
                        onChange={(e) =>
                          updateCustomStyle("mainBg", e.target.value)
                        }
                        className="h-14 w-full rounded-2xl border border-white/10 bg-[#0F0F0F] p-2 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">
                        Tekstin väri
                      </label>
                      <input
                        type="color"
                        value={customStyle.mainText}
                        onChange={(e) =>
                          updateCustomStyle("mainText", e.target.value)
                        }
                        className="h-14 w-full rounded-2xl border border-white/10 bg-[#0F0F0F] p-2 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">
                        Otsikon väri
                      </label>
                      <input
                        type="color"
                        value={customStyle.headingColor}
                        onChange={(e) =>
                          updateCustomStyle("headingColor", e.target.value)
                        }
                        className="h-14 w-full rounded-2xl border border-white/10 bg-[#0F0F0F] p-2 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">
                        Korosteväri
                      </label>
                      <input
                        type="color"
                        value={customStyle.accentColor}
                        onChange={(e) =>
                          updateCustomStyle("accentColor", e.target.value)
                        }
                        className="h-14 w-full rounded-2xl border border-white/10 bg-[#0F0F0F] p-2 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">
                        Sivupalkin leveys ({customStyle.sidebarWidth}px)
                      </label>
                      <input
                        type="range"
                        min={180}
                        max={340}
                        value={customStyle.sidebarWidth}
                        onChange={(e) =>
                          updateCustomStyle("sidebarWidth", Number(e.target.value))
                        }
                        className="w-full accent-[#00BFA6] mt-2"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">
                        Nimen koko ({customStyle.nameSize}px)
                      </label>
                      <input
                        type="range"
                        min={28}
                        max={64}
                        value={customStyle.nameSize}
                        onChange={(e) =>
                          updateCustomStyle("nameSize", Number(e.target.value))
                        }
                        className="w-full accent-[#00BFA6] mt-2"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">
                        Tekstin koko ({customStyle.bodySize}px)
                      </label>
                      <input
                        type="range"
                        min={12}
                        max={20}
                        value={customStyle.bodySize}
                        onChange={(e) =>
                          updateCustomStyle("bodySize", Number(e.target.value))
                        }
                        className="w-full accent-[#00BFA6] mt-2"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">
                        Kulmien pyöreys ({customStyle.borderRadius}px)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={40}
                        value={customStyle.borderRadius}
                        onChange={(e) =>
                          updateCustomStyle("borderRadius", Number(e.target.value))
                        }
                        className="w-full accent-[#00BFA6] mt-2"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">
                        Riviväli ({customStyle.lineHeight})
                      </label>
                      <input
                        type="range"
                        min={1.2}
                        max={2}
                        step={0.05}
                        value={customStyle.lineHeight}
                        onChange={(e) =>
                          updateCustomStyle("lineHeight", Number(e.target.value))
                        }
                        className="w-full accent-[#00BFA6] mt-2"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">
                        Osioiden väli ({customStyle.sectionSpacing}px)
                      </label>
                      <input
                        type="range"
                        min={8}
                        max={36}
                        value={customStyle.sectionSpacing}
                        onChange={(e) =>
                          updateCustomStyle(
                            "sectionSpacing",
                            Number(e.target.value)
                          )
                        }
                        className="w-full accent-[#00BFA6] mt-2"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-400">
                        Kuvan kulmat ({customStyle.imageRadius}px)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={40}
                        value={customStyle.imageRadius}
                        onChange={(e) =>
                          updateCustomStyle("imageRadius", Number(e.target.value))
                        }
                        className="w-full accent-[#00BFA6] mt-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-8 pb-2">
                  <button
                    type="submit"
                    disabled={loadingCv}
                    className="w-full sm:w-auto rounded-2xl bg-[#00BFA6] px-8 py-5 text-lg font-black text-black transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-50 shadow-[0_10px_30px_-10px_rgba(0,191,166,0.5)]"
                  >
                    {loadingCv ? "Luodaan CV:tä..." : "1. GENEROI CV"}
                  </button>

                  {parsedCv.cvBody && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(parsedCv.cvBody, "CV kopioitu leikepöydälle.")
                        }
                        className="w-full sm:w-auto rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-white transition-all hover:bg-white/10"
                      >
                        Kopioi leikepöydälle
                      </button>

                      <button
                        type="button"
                        onClick={downloadPdf}
                        disabled={downloadingPdf}
                        className="w-full sm:w-auto rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-white transition-all hover:bg-white/10 disabled:opacity-50"
                      >
                        {downloadingPdf ? "Luodaan PDF..." : "Lataa PDF"}
                      </button>

                      <button
                        type="button"
                        onClick={downloadDocx}
                        disabled={downloadingDocx}
                        className="w-full sm:w-auto rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-white transition-all hover:bg-white/10 disabled:opacity-50"
                      >
                        {downloadingDocx ? "Luodaan DOCX..." : "Lataa DOCX"}
                      </button>
                    </>
                  )}
                </div>
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
                  className="rounded-2xl bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] px-8 py-3.5 text-base font-black text-black transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(0,191,166,0.3)] mt-2 sm:mt-0"
                >
                  {loadingJobs ? "Etsitään..." : "2. EHDOTA TYÖPAIKKOJA"}
                </button>
              }
            >
              <div className="space-y-6 mt-6">
                <div>
                  <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Minkä alan töitä etsit?</label>
                  <textarea
                    placeholder="Esim. Myyntineuvottelija, Koodari, Siivooja..."
                    value={searchProfile.desiredRoles}
                    onChange={(e) =>
                      updateSearchProfile("desiredRoles", e.target.value)
                    }
                    className={TextareaClass("min-h-[120px]")}
                  />
                </div>
                
                <div>
                   <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Miltä alueelta?</label>
                   <input
                     placeholder="Esim. Uusimaa, Etätyö"
                     value={searchProfile.desiredLocation}
                     onChange={(e) =>
                       updateSearchProfile("desiredLocation", e.target.value)
                     }
                     className={InputClass()}
                   />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Kokoaikainen vai Osa-aikainen?</label>
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
                    <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Vuorotoive</label>
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

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Palkkatoive</label>
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
                    <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Muita avainsanoja (erota pilkulla)</label>
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
          <section className="space-y-8 lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-[32px] border border-white/10 bg-zinc-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              
              {/* VÄLILEHTINAPIT */}
              <div className="mb-8 flex overflow-x-auto whitespace-nowrap pb-3 gap-4 snap-x border-b border-white/5">
                <button
                  type="button"
                  onClick={() => setTab("cv")}
                  className={`rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-300 snap-start ${
                    tab === "cv"
                      ? "bg-[#00BFA6] text-black shadow-[0_0_15px_rgba(0,191,166,0.4)]"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1"
                  }`}
                >
                  Oma CV (Esikatselu)
                </button>
                <button
                  type="button"
                  onClick={() => setTab("job")}
                  className={`rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-300 snap-start ${
                    tab === "job"
                      ? "bg-[#00BFA6] text-black shadow-[0_0_15px_rgba(0,191,166,0.4)]"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1"
                  }`}
                >
                  Työpaikat
                </button>
                <button
                  type="button"
                  onClick={() => setTab("letter")}
                  className={`rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-300 snap-start ${
                    tab === "letter"
                      ? "bg-[#00BFA6] text-black shadow-[0_0_15px_rgba(0,191,166,0.4)]"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1"
                  }`}
                >
                  Hakemukset
                </button>
              </div>

              {tab === "cv" && (
                <div className="space-y-8 overflow-hidden">
                  {parsedCv.cvBody && activeJob && (
                    <div className="flex flex-col sm:flex-row gap-4 bg-[#0F0F0F] p-5 rounded-3xl border border-white/10">
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-2">Valittu työpaikka: <strong>{activeJob.title}</strong></p>
                        <button
                          type="button"
                          onClick={createTailoredCv}
                          disabled={loadingTailoredCv}
                          className="w-full rounded-2xl border border-[#FF6F3C]/50 bg-[#FF6F3C]/10 px-6 py-4 font-black text-[#FF6F3C] transition-all hover:bg-[#FF6F3C]/20 disabled:opacity-50"
                        >
                          {loadingTailoredCv
                            ? "Muokataan tekoälyllä..."
                            : "Räätälöi CV tähän työpaikkaan"}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeJobCvVariants.length > 0 && (
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                      <h3 className="mb-4 text-lg font-bold text-white">
                        Tallennetut CV-versiot
                      </h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {activeJobCvVariants.map((cv) => (
                          <button
                            key={cv.id}
                            type="button"
                            onClick={() => setCvResult(`CV_BODY:\n${cv.content}`)}
                            className="w-full rounded-2xl border border-white/10 bg-[#0F0F0F] px-5 py-4 text-left transition-all hover:border-[#00BFA6]/50 hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(0,191,166,0.2)]"
                          >
                            <p className="font-bold text-[#00BFA6] truncate">
                              {cv.jobTitle}
                            </p>
                            <p className="text-sm font-medium text-white truncate">
                              {cv.companyName}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
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
                        <div className="rounded-[28px] border border-[#00BFA6]/20 bg-[#00BFA6]/5 p-6 text-center">
                          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#00BFA6]">
                            Kuntotarkastus arvosana
                          </h2>
                          <p className="mt-2 text-5xl font-black text-white">
                            {parsedCv.score}
                          </p>
                        </div>
                      )}

                      {parsedCv.report.length > 0 && (
                        <div className="rounded-[28px] border border-[#FF6F3C]/20 bg-[#FF6F3C]/5 p-6 sm:p-8">
                          <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-[#FF6F3C]">
                            Muutosraportti / Parannukset
                          </h2>
                          <ul className="space-y-4 pl-5 text-base text-gray-200">
                            {parsedCv.report.map((item, index) => (
                              <li key={index} className="list-disc break-words leading-relaxed">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="rounded-[32px] border border-white/10 bg-white p-3 sm:p-6 overflow-x-auto shadow-xl">
                        <div className="min-w-[600px] lg:min-w-0">
                          <CvPreview
                            cvText={parsedCv.cvBody}
                            image={profileImage}
                            styleVariant={cvStyle}
                            customStyle={customStyle}
                          />
                        </div>
                      </div>

                      {/* Piilotettu div PDF renderöintiin */}
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
                          <CvPreview
                            cvText={parsedCv.cvBody}
                            image={profileImage}
                            styleVariant={cvStyle}
                            customStyle={customStyle}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-[32px] border-2 border-dashed border-white/10 bg-[#0F0F0F] p-10 sm:p-16 text-center text-gray-500">
                      <div className="text-4xl mb-4">📄</div>
                      <p className="text-base font-medium">Ei esikatselua vielä.</p>
                      <p className="text-sm mt-2">Täytä tiedot vasemmalla ja paina "Generoi CV".</p>
                    </div>
                  )}
                </div>
              )}

              {tab === "job" && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-[#0F0F0F] p-4 text-center hover:-translate-y-1 transition-transform">
                      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 truncate">
                        Työpaikat
                      </p>
                      <p className="mt-2 text-2xl sm:text-3xl font-black text-white">
                        {dashboardStats.total}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#0F0F0F] p-4 text-center hover:-translate-y-1 transition-transform">
                      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 truncate">
                        Haettu
                      </p>
                      <p className="mt-2 text-2xl sm:text-3xl font-black text-white">
                        {dashboardStats.applied}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#00BFA6]/30 bg-[#00BFA6]/10 p-4 text-center hover:-translate-y-1 transition-transform">
                      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-[#00BFA6] truncate">
                        Haastattelu
                      </p>
                      <p className="mt-2 text-2xl sm:text-3xl font-black text-[#00BFA6]">
                        {dashboardStats.interview}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#FF6F3C]/30 bg-[#FF6F3C]/10 p-4 text-center hover:-translate-y-1 transition-transform">
                      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-[#FF6F3C] truncate">
                        Suosikit
                      </p>
                      <p className="mt-2 text-2xl sm:text-3xl font-black text-[#FF6F3C]">
                        {dashboardStats.favorites}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-8 space-y-6">
                    <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">
                      Lisää oma työpaikka seurantaan
                    </h3>

                    <div>
                       <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Otsikko</label>
                       <input
                         placeholder="Esim. Myyntipäällikkö"
                         value={jobForm.title}
                         onChange={(e) => updateJobForm("title", e.target.value)}
                         className={InputClass()}
                       />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                         <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Yritys</label>
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
                         <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Sijainti</label>
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

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                         <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Työsuhde</label>
                         <input
                           placeholder="Vakituinen"
                           value={jobForm.type}
                           onChange={(e) => updateJobForm("type", e.target.value)}
                           className={InputClass()}
                         />
                      </div>
                      <div>
                         <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Linkki</label>
                         <input
                           placeholder="https://..."
                           value={jobForm.url}
                           onChange={(e) => updateJobForm("url", e.target.value)}
                           className={InputClass()}
                         />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                         <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Palkka</label>
                         <input
                           placeholder="3000 €/kk"
                           value={jobForm.salary}
                           onChange={(e) => updateJobForm("salary", e.target.value)}
                           className={InputClass()}
                         />
                      </div>
                      <div>
                         <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Deadline</label>
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

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                         <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Yhteyshenkilö</label>
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
                         <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Sähköposti</label>
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
                       <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Lyhyt kuvaus / muistiinpanot</label>
                       <textarea
                         placeholder="Mikä tässä kiinnostaa?"
                         value={jobForm.summary}
                         onChange={(e) => updateJobForm("summary", e.target.value)}
                         className={TextareaClass("min-h-[100px]")}
                       />
                    </div>

                    <div>
                       <label className="mb-2 block text-xs font-bold text-gray-500 ml-1">Kopioi ilmoitusteksti (Tärkeä tekoälylle)</label>
                       <textarea
                         placeholder="Liitä koko ilmoituksen teksti tähän. Tekoäly käyttää tätä räätälöidessään hakemustasi..."
                         value={jobForm.adText}
                         onChange={(e) => updateJobForm("adText", e.target.value)}
                         className={TextareaClass("min-h-[220px]")}
                       />
                    </div>

                    <button
                      type="button"
                      onClick={addJob}
                      className="w-full rounded-2xl bg-white px-6 py-4 text-base font-black text-black transition-transform hover:scale-[1.02] active:scale-95 shadow-lg"
                    >
                      + Tallenna seurantaan
                    </button>
                  </div>

                  <div className="space-y-6 pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h3 className="text-2xl font-black text-white">
                        Omat työpaikat
                      </h3>
                      <input
                        value={jobFilter}
                        onChange={(e) => setJobFilter(e.target.value)}
                        placeholder="Suodata listaa..."
                        className="w-full sm:max-w-xs rounded-2xl border border-white/10 bg-[#0F0F0F] px-5 py-3.5 text-sm text-white outline-none transition-all focus:border-[#00BFA6]/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <select
                        value={jobStatusFilter}
                        onChange={(e) =>
                          setJobStatusFilter(e.target.value as "all" | JobStatus)
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#0F0F0F] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#00BFA6]/50 cursor-pointer"
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
                        className="w-full rounded-xl border border-white/10 bg-[#0F0F0F] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#00BFA6]/50 cursor-pointer"
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
                        className="w-full rounded-xl border border-white/10 bg-[#0F0F0F] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#00BFA6]/50 cursor-pointer"
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
                        className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                          showFavoritesOnly
                            ? "bg-[#FF6F3C] text-white shadow-[0_0_15px_rgba(255,111,60,0.4)]"
                            : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                        }`}
                      >
                        {showFavoritesOnly ? "★ Vain suosikit" : "Näytä suosikit"}
                      </button>
                    </div>

                    {filteredJobs.length === 0 ? (
                      <div className="rounded-[32px] border-2 border-dashed border-white/10 bg-[#0F0F0F] p-10 text-center text-gray-500">
                        {jobs.length === 0
                          ? "Sinulla ei ole vielä yhtään työpaikkaa seurannassa."
                          : "Suodattimilla ei löytynyt tuloksia."}
                      </div>
                    ) : (
                      <div className="space-y-5">
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
                              onUpdate={(patch) => updateJob(job.id, patch)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === "letter" && (
                <div className="space-y-8">
                  <div className="rounded-[32px] border border-[#00BFA6]/20 bg-[#00BFA6]/5 p-6 sm:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-[#00BFA6] opacity-10 text-9xl font-black pointer-events-none">”</div>
                    <h3 className="text-2xl font-black text-white mb-6">
                      Rakenna Hakemus
                    </h3>

                    {activeJob ? (
                      <div className="mb-8 space-y-2 text-base text-gray-300 bg-black/40 p-6 rounded-2xl border border-white/5 relative z-10">
                        <p className="flex flex-col sm:flex-row sm:gap-4">
                          <span className="font-bold text-[#00BFA6] w-24">Kohde:</span>
                          <span className="text-white font-medium text-lg">{activeJob.title}</span>
                        </p>
                        <p className="flex flex-col sm:flex-row sm:gap-4">
                          <span className="font-bold text-[#00BFA6] w-24">Yritys:</span>
                          <span className="text-white">{activeJob.company || "-"}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="mb-8 p-6 bg-red-950/30 border border-red-900/50 rounded-2xl text-red-300">
                        Palaa <strong>Työpaikat</strong> -välilehdelle ja valitse (klikkaa) ensin jokin työpaikka.
                      </div>
                    )}

                    <div className="relative z-10">
                      <p className="mb-3 text-sm font-bold text-gray-400">
                        Valitse sävy, jolla hakemus kirjoitetaan:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={() => setLetterTone("professional")}
                          className={`flex-1 rounded-2xl px-6 py-4 text-base font-bold transition-all ${
                            letterTone === "professional"
                              ? "border border-[#00BFA6] bg-[#00BFA6] text-black shadow-[0_0_15px_rgba(0,191,166,0.3)]"
                              : "border border-white/10 bg-black/50 text-white hover:bg-white/5"
                          }`}
                        >
                          💼 Asiallinen
                        </button>
                        <button
                          type="button"
                          onClick={() => setLetterTone("warm")}
                          className={`flex-1 rounded-2xl px-6 py-4 text-base font-bold transition-all ${
                            letterTone === "warm"
                              ? "border border-[#00BFA6] bg-[#00BFA6] text-black shadow-[0_0_15px_rgba(0,191,166,0.3)]"
                              : "border border-white/10 bg-black/50 text-white hover:bg-white/5"
                          }`}
                        >
                          🤝 Lämmin
                        </button>
                        <button
                          type="button"
                          onClick={() => setLetterTone("sales")}
                          className={`flex-1 rounded-2xl px-6 py-4 text-base font-bold transition-all ${
                            letterTone === "sales"
                              ? "border border-[#FF6F3C] bg-[#FF6F3C] text-black shadow-[0_0_15px_rgba(255,111,60,0.3)]"
                              : "border border-white/10 bg-black/50 text-white hover:bg-white/5"
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
                      className="mt-8 w-full rounded-2xl bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] px-8 py-5 text-lg font-black text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-[0_10px_30px_-10px_rgba(0,191,166,0.4)] relative z-10"
                    >
                      {loadingLetter
                        ? "Tekoäly kirjoittaa..."
                        : "3. KIRJOITA HAKEMUS TÄHÄN PAIKKAAN"}
                    </button>
                  </div>

                  {activeJobLetters.length > 0 && (
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                      <h3 className="mb-4 text-lg font-bold text-white">
                        Aiemmat hakemukset tähän paikkaan
                      </h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {activeJobLetters.map((letter) => (
                          <button
                            key={letter.id}
                            type="button"
                            onClick={() => {
                              setLetterResult(`HAKEMUS:\n${letter.content}`);
                              setLetterDraft(letter.content);
                            }}
                            className="w-full rounded-2xl border border-white/10 bg-[#0F0F0F] px-5 py-4 text-left transition-all hover:border-[#00BFA6]/50 hover:-translate-y-1 hover:shadow-[0_5px_15px_-5px_rgba(0,191,166,0.2)]"
                          >
                            <p className="font-bold text-[#00BFA6] truncate">
                              {letter.jobTitle}
                            </p>
                            <p className="text-sm font-medium text-white truncate">
                              {letter.companyName}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Luotu: {new Date(letter.createdAt).toLocaleString("fi-FI")}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {letterResult ? (
                    <>
                      <div className="rounded-[32px] border border-[#00BFA6]/30 bg-[#0F0F0F] p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,191,166,0.1)]">
                        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                          <h2 className="text-2xl font-black text-white">
                            Valmis hakemus
                          </h2>
                          <button
                            type="button"
                            onClick={saveEditedLetter}
                            className="w-full sm:w-auto rounded-xl border border-[#00BFA6]/50 bg-[#00BFA6]/10 px-5 py-2.5 text-sm font-bold text-[#00BFA6] transition-all hover:bg-[#00BFA6] hover:text-black"
                          >
                            Tallenna omat muokkaukset
                          </button>
                        </div>

                        <textarea
                          value={letterDraft}
                          onChange={(e) => setLetterDraft(e.target.value)}
                          className="min-h-[450px] w-full rounded-2xl border-none bg-transparent p-2 font-sans text-base leading-relaxed text-gray-200 outline-none resize-y"
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
                        className="w-full rounded-2xl border border-white/20 bg-white px-8 py-5 text-lg font-black text-black transition-transform hover:scale-[1.02] active:scale-95 shadow-xl"
                      >
                        Kopioi hakemus leikepöydälle 📋
                      </button>
                    </>
                  ) : (
                    <div className="rounded-[32px] border-2 border-dashed border-white/10 bg-[#0F0F0F] p-10 sm:p-16 text-center font-medium text-gray-500">
                      <div className="text-4xl mb-4">✍️</div>
                      <p>Hakemuksen teksti ilmestyy tähän.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ponnahdusilmoitukset (Alerts) */}
            {(message || errorMessage) && (
              <div
                className={`fixed bottom-8 right-4 left-4 sm:left-auto sm:right-8 sm:max-w-md z-50 rounded-[24px] border p-6 text-base font-bold shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all animate-in slide-in-from-bottom-5 ${
                  errorMessage
                    ? "border-red-900/50 bg-red-950/90 text-red-300 backdrop-blur-xl"
                    : "border-[#00BFA6]/50 bg-[#00BFA6]/90 text-black backdrop-blur-xl"
                }`}
              >
                {errorMessage || message}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
