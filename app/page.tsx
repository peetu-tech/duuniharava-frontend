"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function PdfSafePreview({
  cvText,
  image,
  customStyle,
}: {
  cvText: string;
  image?: string;
  customStyle: CvCustomStyle;
}) {
  const lines = splitPdfLines(cvText);
  if (!lines.length) return null;

  const name = lines[0] || "";
  const contactLines = lines.slice(1, 4);
  const contentLines = lines.slice(4);

  const wrapperStyle: CSSProperties = {
    width: "794px",
    minHeight: "1123px",
    background: customStyle.mainBg,
    color: customStyle.mainText,
    display: "grid",
    gridTemplateColumns: `${customStyle.sidebarWidth}px 1fr`,
    fontFamily: "Arial, Helvetica, sans-serif",
    borderRadius: `${customStyle.borderRadius}px`,
    overflow: "hidden",
  };

  const sidebarStyle: CSSProperties = {
    background: customStyle.sidebarBg,
    color: customStyle.sidebarText,
    padding: "28px",
  };

  const mainStyle: CSSProperties = {
    background: customStyle.mainBg,
    color: customStyle.mainText,
    padding: "36px",
  };

  const imageStyle: CSSProperties = {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    borderRadius: `${customStyle.imageRadius}px`,
    marginBottom: "24px",
    display: "block",
  };

  const placeholderStyle: CSSProperties = {
    width: "100%",
    aspectRatio: "1 / 1",
    borderRadius: `${customStyle.imageRadius}px`,
    marginBottom: "24px",
    background: "rgba(255,255,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
  };

  const nameStyle: CSSProperties = {
    fontSize: `${customStyle.nameSize}px`,
    lineHeight: 1.1,
    fontWeight: 700,
    margin: "0 0 28px 0",
    color: customStyle.mainText,
  };

  const sectionTitleStyle: CSSProperties = {
    fontSize: "12px",
    lineHeight: 1.4,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: customStyle.headingColor,
    borderTop: "1px solid #d1d5db",
    paddingTop: "14px",
    marginTop: `${customStyle.sectionSpacing}px`,
    marginBottom: "10px",
  };

  const paragraphStyle: CSSProperties = {
    fontSize: `${customStyle.bodySize}px`,
    lineHeight: customStyle.lineHeight,
    margin: "0 0 8px 0",
    whiteSpace: "pre-wrap",
  };

  return (
    <div id="pdf-safe-preview" style={wrapperStyle}>
      <aside style={sidebarStyle}>
        {image ? (
          <img src={image} alt="Profiilikuva" style={imageStyle} />
        ) : (
          <div style={placeholderStyle}>Ei kuvaa</div>
        )}

        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              opacity: 0.8,
              marginBottom: "10px",
            }}
          >
            Yhteystiedot
          </div>

          {contactLines.map((line, index) => (
            <p
              key={index}
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                margin: "0 0 6px 0",
                wordBreak: "break-word",
              }}
            >
              {line}
            </p>
          ))}
        </div>
      </aside>

      <main style={mainStyle}>
        <h1 style={nameStyle}>{name}</h1>

        {contentLines.map((line, index) =>
          isPdfHeading(line) ? (
            <h2 key={index} style={sectionTitleStyle}>
              {line}
            </h2>
          ) : (
            <p key={index} style={paragraphStyle}>
              {line}
            </p>
          )
        )}
      </main>
    </div>
  );
}

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
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
    </div>
  );
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

  return (
    <div
      className={`rounded-[28px] border p-5 transition ${
        isActive
          ? "border-blue-500 bg-gradient-to-br from-blue-950/30 to-zinc-950"
          : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {job.source && (
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-300">
                {job.source}
              </span>
            )}
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Match {score}%
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-300">
              {getStatusLabel(job.status)}
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-300">
              {getPriorityLabel(job.priority)}
            </span>
          </div>

          <h4 className="text-xl font-semibold text-white">
            {job.title || "Nimetön työpaikka"}
          </h4>

          <p className="mt-2 text-sm text-zinc-400">
            {[job.company, job.location, job.type].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSelect}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-white text-black"
                : "bg-zinc-800 text-white hover:bg-zinc-700"
            }`}
          >
            {isActive ? "Valittu" : "Valitse"}
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
          >
            Poista
          </button>
        </div>
      </div>

      {job.summary && (
        <p className="mt-4 text-sm leading-6 text-zinc-300">{job.summary}</p>
      )}

      {job.whyFit && (
        <div className="mt-4 rounded-2xl border border-emerald-900/60 bg-emerald-950/30 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">
            Miksi sopii
          </p>
          <p className="mt-2 text-sm leading-6 text-emerald-200">{job.whyFit}</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            Yritys
          </p>
          <p className="mt-2 text-sm font-medium text-white">
            {job.company || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            Sijainti
          </p>
          <p className="mt-2 text-sm font-medium text-white">
            {job.location || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            Hakemukset
          </p>
          <p className="mt-2 text-sm font-medium text-white">
            {applicationsCount}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            CV-versiot
          </p>
          <p className="mt-2 text-sm font-medium text-white">{cvsCount}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Status</label>
          <select
            value={job.status}
            onChange={(e) => onUpdate({ status: e.target.value as JobStatus })}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-600"
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
          <label className="mb-2 block text-sm text-zinc-400">Prioriteetti</label>
          <select
            value={job.priority}
            onChange={(e) =>
              onUpdate({ priority: e.target.value as JobPriority })
            }
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-600"
          >
            <option value="low">Matala</option>
            <option value="medium">Keskitaso</option>
            <option value="high">Korkea</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">Hakupäivä</label>
          <input
            type="date"
            value={job.appliedAt || ""}
            onChange={(e) => onUpdate({ appliedAt: e.target.value })}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-600"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">Deadline</label>
          <input
            type="date"
            value={job.deadline || ""}
            onChange={(e) => onUpdate({ deadline: e.target.value })}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-600"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">Palkka</label>
          <input
            value={job.salary || ""}
            onChange={(e) => onUpdate({ salary: e.target.value })}
            placeholder="Esim. 2800–3200 €/kk"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            Yhteyshenkilö
          </label>
          <input
            value={job.contactPerson || ""}
            onChange={(e) => onUpdate({ contactPerson: e.target.value })}
            placeholder="Esim. Rekrytoija"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            Yhteyshenkilön sähköposti
          </label>
          <input
            value={job.contactEmail || ""}
            onChange={(e) => onUpdate({ contactEmail: e.target.value })}
            placeholder="esim. rekry@firma.fi"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">Yrityksen sivu</label>
          <input
            value={job.companyWebsite || ""}
            onChange={(e) => onUpdate({ companyWebsite: e.target.value })}
            placeholder="https://..."
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm text-zinc-400">Muistiinpanot</label>
        <textarea
          value={job.notes || ""}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Kirjaa tähän mitä pitää tehdä seuraavaksi, yhteydenotot, fiilikset jne."
          className="min-h-[120px] w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600"
        />
      </div>

      {job.url && (
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-2xl border border-blue-900/60 bg-blue-950/30 px-4 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-950/50"
        >
          Avaa työpaikkalinkki
        </a>
      )}
    </div>
  );
}

export default function Home() {
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
    } catch {
      console.error("Tallennetun tilan lukeminen epäonnistui.");
    }
  }, []);

  useEffect(() => {
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
    if (!jobFilter.trim()) return jobs;

    const q = jobFilter.toLowerCase();
    return jobs.filter((job) =>
      [
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
        .includes(q)
    );
  }, [jobs, jobFilter]);

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
      prev.map((job) => (job.id === id ? normalizeJob({ ...job, ...patch }) : job))
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
    setCustomStyles(defaultCustomStyles);
    localStorage.removeItem(STORAGE_KEY);
  }

  function fillExample() {
    setForm({
      cvText: "",
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

  function validateCvForm() {
    if (!form.targetJob.trim()) {
      setErrorMessage("Lisää tavoiteltu työ ennen CV:n generointia.");
      return false;
    }

    if (mode === "improve" && !form.cvText.trim()) {
      setErrorMessage("Liitä nykyinen CV ennen parannusta.");
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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_26%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.12),transparent_24%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-zinc-300 backdrop-blur-sm">
                CV Studio · Hakuprofiili · Työpaikat · Hakemukset
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl md:leading-[1.05]">
                Rakenna parempi CV, löydä sopivat työt ja tee personoidut hakemukset samassa näkymässä.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
                Duuniharava auttaa luomaan tai parantamaan CV:n, suuntaamaan sen oikeaan rooliin,
                ehdottamaan sopivia työpaikkoja ja kirjoittamaan hakemuksia, jotka tukevat CV:täsi.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={fillExample}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  Täytä esimerkki
                </button>

                <button
                  type="button"
                  onClick={() => applyQuickTarget("sales")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Suuntaa myyntityöhön
                </button>

                <button
                  type="button"
                  onClick={() => applyQuickTarget("warehouse")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Suuntaa varastotyöhön
                </button>

                <button
                  type="button"
                  onClick={() => applyQuickTarget("shorter")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Tee tiiviimpi
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
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

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setMode("improve")}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              mode === "improve"
                ? "bg-white text-black"
                : "border border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800"
            }`}
          >
            Paranna CV
          </button>

          <button
            type="button"
            onClick={() => setMode("create")}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              mode === "create"
                ? "bg-white text-black"
                : "border border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800"
            }`}
          >
            Luo uusi CV
          </button>

          <div className="ml-auto hidden text-sm text-zinc-500 lg:block">
            Muutokset tallentuvat selaimeen automaattisesti.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.02fr_0.98fr]">
          <section className="space-y-6">
            <div className="rounded-[32px] border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm md:p-7">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Vaihe 1
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Hakijan tiedot
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={clearForm}
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900"
                >
                  Tyhjennä
                </button>
              </div>

              <form onSubmit={handleCvSubmit} className="space-y-5">
                {mode === "improve" && (
                  <div>
                    <label className="mb-2 block text-sm text-zinc-400">
                      Nykyinen CV
                    </label>
                    <textarea
                      placeholder="Liitä nykyinen CV tähän"
                      value={form.cvText}
                      onChange={(e) => updateField("cvText", e.target.value)}
                      className="min-h-[220px] w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input placeholder="Nimi" value={form.name} onChange={(e) => updateField("name", e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600" />
                  <input placeholder="Puhelin" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600" />
                  <input placeholder="Sähköposti" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600" />
                  <input placeholder="Paikkakunta" value={form.location} onChange={(e) => updateField("location", e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600" />
                </div>

                <input
                  placeholder="Tavoiteltu työ"
                  value={form.targetJob}
                  onChange={(e) => updateField("targetJob", e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
                />

                <textarea placeholder="Koulutus" value={form.education} onChange={(e) => updateField("education", e.target.value)} className="min-h-[96px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600" />
                <textarea placeholder="Kokemus" value={form.experience} onChange={(e) => updateField("experience", e.target.value)} className="min-h-[124px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <textarea placeholder="Kielet" value={form.languages} onChange={(e) => updateField("languages", e.target.value)} className="min-h-[110px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600" />
                  <textarea placeholder="Taidot" value={form.skills} onChange={(e) => updateField("skills", e.target.value)} className="min-h-[110px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <textarea placeholder="Kortit ja pätevyydet" value={form.cards} onChange={(e) => updateField("cards", e.target.value)} className="min-h-[96px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600" />
                  <textarea placeholder="Harrastukset" value={form.hobbies} onChange={(e) => updateField("hobbies", e.target.value)} className="min-h-[96px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600" />
                </div>

                <ProfileImageUpload image={profileImage} onChange={setProfileImage} />

                <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-zinc-300">CV-tyyli</p>
                    <button
                      type="button"
                      onClick={resetCurrentStyle}
                      className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
                    >
                      Palauta oletukset
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["modern", "classic", "compact", "bold"] as CvStyleVariant[]).map(
                      (variant) => (
                        <button
                          key={variant}
                          type="button"
                          onClick={() => setCvStyle(variant)}
                          className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                            cvStyle === variant
                              ? "bg-white text-black"
                              : "border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
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

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-zinc-400">Sivupalkin väri</label>
                      <input type="color" value={customStyle.sidebarBg} onChange={(e) => updateCustomStyle("sidebarBg", e.target.value)} className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2" />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-zinc-400">Sivupalkin tekstiväri</label>
                      <input type="color" value={customStyle.sidebarText} onChange={(e) => updateCustomStyle("sidebarText", e.target.value)} className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2" />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-zinc-400">Pääalueen tausta</label>
                      <input type="color" value={customStyle.mainBg} onChange={(e) => updateCustomStyle("mainBg", e.target.value)} className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2" />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-zinc-400">Tekstin väri</label>
                      <input type="color" value={customStyle.mainText} onChange={(e) => updateCustomStyle("mainText", e.target.value)} className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2" />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-zinc-400">Otsikon väri</label>
                      <input type="color" value={customStyle.headingColor} onChange={(e) => updateCustomStyle("headingColor", e.target.value)} className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2" />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-zinc-400">Korosteväri</label>
                      <input type="color" value={customStyle.accentColor} onChange={(e) => updateCustomStyle("accentColor", e.target.value)} className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2" />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-zinc-400">Sivupalkin leveys ({customStyle.sidebarWidth}px)</label>
                      <input type="range" min={180} max={340} value={customStyle.sidebarWidth} onChange={(e) => updateCustomStyle("sidebarWidth", Number(e.target.value))} className="w-full" />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-zinc-400">Nimen koko ({customStyle.nameSize}px)</label>
                      <input type="range" min={28} max={64} value={customStyle.nameSize} onChange={(e) => updateCustomStyle("nameSize", Number(e.target.value))} className="w-full" />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-zinc-400">Tekstin koko ({customStyle.bodySize}px)</label>
                      <input type="range" min={12} max={20} value={customStyle.bodySize} onChange={(e) => updateCustomStyle("bodySize", Number(e.target.value))} className="w-full" />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-zinc-400">Kulmien pyöreys ({customStyle.borderRadius}px)</label>
                      <input type="range" min={0} max={40} value={customStyle.borderRadius} onChange={(e) => updateCustomStyle("borderRadius", Number(e.target.value))} className="w-full" />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-zinc-400">Riviväli ({customStyle.lineHeight})</label>
                      <input type="range" min={1.2} max={2} step={0.05} value={customStyle.lineHeight} onChange={(e) => updateCustomStyle("lineHeight", Number(e.target.value))} className="w-full" />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-zinc-400">Osioiden väli ({customStyle.sectionSpacing}px)</label>
                      <input type="range" min={8} max={36} value={customStyle.sectionSpacing} onChange={(e) => updateCustomStyle("sectionSpacing", Number(e.target.value))} className="w-full" />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-zinc-400">Kuvan kulmat ({customStyle.imageRadius}px)</label>
                      <input type="range" min={0} max={40} value={customStyle.imageRadius} onChange={(e) => updateCustomStyle("imageRadius", Number(e.target.value))} className="w-full" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <button type="submit" disabled={loadingCv} className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">
                    {loadingCv ? "Luodaan CV..." : "Generoi CV"}
                  </button>

                  {parsedCv.cvBody && (
                    <>
                      <button type="button" onClick={() => copyText(parsedCv.cvBody, "CV kopioitu leikepöydälle.")} className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500">
                        Kopioi CV
                      </button>

                      <button type="button" onClick={downloadPdf} disabled={downloadingPdf} className="rounded-2xl bg-fuchsia-600 px-5 py-3 font-semibold text-white transition hover:bg-fuchsia-500 disabled:opacity-50">
                        {downloadingPdf ? "Luodaan PDF..." : "Lataa PDF"}
                      </button>

                      <button type="button" onClick={downloadDocx} disabled={downloadingDocx} className="rounded-2xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50">
                        {downloadingDocx ? "Luodaan DOCX..." : "Lataa DOCX"}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>

            <div className="rounded-[32px] border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm md:p-7">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Vaihe 2
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Hakuprofiili
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={suggestJobs}
                  disabled={loadingJobs}
                  className="rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loadingJobs ? "Ehdotetaan..." : "Ehdota työpaikkoja"}
                </button>
              </div>

              <div className="space-y-4">
                <textarea
                  placeholder="Millaisia työpaikkoja etsit?"
                  value={searchProfile.desiredRoles}
                  onChange={(e) =>
                    updateSearchProfile("desiredRoles", e.target.value)
                  }
                  className="min-h-[96px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
                />
                <input
                  placeholder="Millä alueella etsit töitä?"
                  value={searchProfile.desiredLocation}
                  onChange={(e) =>
                    updateSearchProfile("desiredLocation", e.target.value)
                  }
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    placeholder="Työmuoto"
                    value={searchProfile.workType}
                    onChange={(e) =>
                      updateSearchProfile("workType", e.target.value)
                    }
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
                  />
                  <input
                    placeholder="Vuorotoive"
                    value={searchProfile.shiftPreference}
                    onChange={(e) =>
                      updateSearchProfile("shiftPreference", e.target.value)
                    }
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    placeholder="Palkkatoive"
                    value={searchProfile.salaryWish}
                    onChange={(e) =>
                      updateSearchProfile("salaryWish", e.target.value)
                    }
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
                  />
                  <input
                    placeholder="Avainsanat"
                    value={searchProfile.keywords}
                    onChange={(e) =>
                      updateSearchProfile("keywords", e.target.value)
                    }
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-[32px] border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm md:p-7">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => setTab("cv")} className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${tab === "cv" ? "bg-white text-black" : "border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"}`}>CV</button>
                <button type="button" onClick={() => setTab("job")} className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${tab === "job" ? "bg-white text-black" : "border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"}`}>Työpaikat</button>
                <button type="button" onClick={() => setTab("letter")} className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${tab === "letter" ? "bg-white text-black" : "border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"}`}>Hakemukset</button>
              </div>

              {tab === "cv" && (
                <div className="space-y-5">
                  {parsedCv.cvBody && activeJob && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={createTailoredCv}
                        disabled={loadingTailoredCv}
                        className="rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
                      >
                        {loadingTailoredCv ? "Luodaan kohdistettua CV:tä..." : "Luo tähän työpaikkaan sopiva CV-versio"}
                      </button>
                    </div>
                  )}

                  {activeJobCvVariants.length > 0 && (
                    <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-4">
                      <h3 className="mb-3 text-lg font-semibold text-white">Tallennetut CV-versiot</h3>
                      <div className="space-y-3">
                        {activeJobCvVariants.map((cv) => (
                          <button
                            key={cv.id}
                            type="button"
                            onClick={() => setCvResult(`CV_BODY:\n${cv.content}`)}
                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left transition hover:bg-zinc-800"
                          >
                            <p className="font-medium text-white">
                              {cv.jobTitle} · {cv.companyName}
                            </p>
                            <p className="text-xs text-zinc-400">
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
                        <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-5">
                          <h2 className="text-lg font-semibold text-white">Kuntotarkastus</h2>
                          <p className="mt-2 text-3xl font-semibold text-emerald-400">
                            {parsedCv.score}
                          </p>
                        </div>
                      )}

                      {parsedCv.report.length > 0 && (
                        <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-5">
                          <h2 className="mb-3 text-lg font-semibold text-white">Muutosraportti</h2>
                          <ul className="space-y-2 pl-5 text-sm text-zinc-300">
                            {parsedCv.report.map((item, index) => (
                              <li key={index} className="list-disc">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-3 md:p-5">
                        <CvPreview
                          cvText={parsedCv.cvBody}
                          image={profileImage}
                          styleVariant={cvStyle}
                          customStyle={customStyle}
                        />
                      </div>

                      <div style={{ position: "fixed", left: "-99999px", top: 0, width: "794px", pointerEvents: "none", opacity: 1, zIndex: -1 }}>
                        <div ref={pdfRef}>
                          <PdfSafePreview
                            cvText={parsedCv.cvBody}
                            image={profileImage}
                            customStyle={customStyle}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-[28px] border border-dashed border-zinc-800 bg-zinc-950 p-8 text-zinc-400">
                      Generoitu CV-esikatselu näkyy täällä.
                    </div>
                  )}
                </div>
              )}

              {tab === "job" && (
                <div className="space-y-6">
                  <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-white">Lisää työpaikka</h3>

                    <input placeholder="Työpaikan otsikko" value={jobForm.title} onChange={(e) => updateJobForm("title", e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600" />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input placeholder="Yrityksen nimi" value={jobForm.company} onChange={(e) => updateJobForm("company", e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600" />
                      <input placeholder="Sijainti" value={jobForm.location} onChange={(e) => updateJobForm("location", e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input placeholder="Työsuhde" value={jobForm.type} onChange={(e) => updateJobForm("type", e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600" />
                      <input placeholder="Työpaikan linkki" value={jobForm.url} onChange={(e) => updateJobForm("url", e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input placeholder="Palkka" value={jobForm.salary} onChange={(e) => updateJobForm("salary", e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600" />
                      <input type="date" value={jobForm.deadline} onChange={(e) => updateJobForm("deadline", e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none focus:border-zinc-600" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input placeholder="Yhteyshenkilö" value={jobForm.contactPerson} onChange={(e) => updateJobForm("contactPerson", e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600" />
                      <input placeholder="Yhteyshenkilön sähköposti" value={jobForm.contactEmail} onChange={(e) => updateJobForm("contactEmail", e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600" />
                    </div>

                    <input placeholder="Yrityksen kotisivu" value={jobForm.companyWebsite} onChange={(e) => updateJobForm("companyWebsite", e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600" />

                    <textarea placeholder="Lyhyt yhteenveto työpaikasta" value={jobForm.summary} onChange={(e) => updateJobForm("summary", e.target.value)} className="min-h-[90px] w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600" />

                    <textarea placeholder="Liitä työpaikkailmoituksen teksti tähän" value={jobForm.adText} onChange={(e) => updateJobForm("adText", e.target.value)} className="min-h-[180px] w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600" />

                    <textarea placeholder="Muistiinpanot" value={jobForm.notes} onChange={(e) => updateJobForm("notes", e.target.value)} className="min-h-[110px] w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600" />

                    <button type="button" onClick={addJob} className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500">
                      Lisää työpaikka listaan
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white">Työpaikat</h3>
                      <input
                        value={jobFilter}
                        onChange={(e) => setJobFilter(e.target.value)}
                        placeholder="Suodata työpaikkoja"
                        className="w-full max-w-xs rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600"
                      />
                    </div>

                    {filteredJobs.length === 0 ? (
                      <div className="rounded-[28px] border border-dashed border-zinc-800 bg-zinc-950 p-8 text-zinc-400">
                        {jobs.length === 0
                          ? "Ei lisättyjä työpaikkoja vielä."
                          : "Suodatuksella ei löytynyt työpaikkoja."}
                      </div>
                    ) : (
                      filteredJobs.map((job) => {
                        const isActive = job.id === activeJobId;
                        const jobLetters = savedLetters.filter((letter) => letter.jobId === job.id);
                        const jobCvs = savedCvVariants.filter((cv) => cv.jobId === job.id);

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
                      })
                    )}
                  </div>
                </div>
              )}

              {tab === "letter" && (
                <div className="space-y-4">
                  <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-5">
                    <h3 className="text-lg font-semibold text-white">
                      Valittu työpaikka
                    </h3>

                    {activeJob ? (
                      <div className="mt-3 space-y-1 text-sm text-zinc-300">
                        <p><span className="text-zinc-500">Otsikko:</span> {activeJob.title}</p>
                        <p><span className="text-zinc-500">Yritys:</span> {activeJob.company || "-"}</p>
                        <p><span className="text-zinc-500">Sijainti:</span> {activeJob.location || "-"}</p>
                      </div>
                    ) : (
                      <p className="mt-3 text-zinc-400">Ei valittua työpaikkaa.</p>
                    )}

                    <div className="mt-5">
                      <p className="mb-2 text-sm font-medium text-zinc-300">Hakemuksen sävy</p>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setLetterTone("professional")} className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${letterTone === "professional" ? "bg-white text-black" : "border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"}`}>Asiallinen</button>
                        <button type="button" onClick={() => setLetterTone("warm")} className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${letterTone === "warm" ? "bg-white text-black" : "border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"}`}>Lämmin</button>
                        <button type="button" onClick={() => setLetterTone("sales")} className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${letterTone === "sales" ? "bg-white text-black" : "border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"}`}>Myyvä</button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCoverLetterSubmit}
                      disabled={loadingLetter || !activeJob}
                      className="mt-5 rounded-2xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
                    >
                      {loadingLetter ? "Luodaan hakemus..." : "Luo hakemus valittuun työpaikkaan"}
                    </button>
                  </div>

                  {activeJobLetters.length > 0 && (
                    <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-4">
                      <h3 className="mb-3 text-lg font-semibold text-white">Tallennetut hakemukset</h3>
                      <div className="space-y-3">
                        {activeJobLetters.map((letter) => (
                          <button
                            key={letter.id}
                            type="button"
                            onClick={() => {
                              setLetterResult(`HAKEMUS:\n${letter.content}`);
                              setLetterDraft(letter.content);
                            }}
                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left transition hover:bg-zinc-800"
                          >
                            <p className="font-medium text-white">
                              {letter.jobTitle} · {letter.companyName}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {new Date(letter.createdAt).toLocaleString("fi-FI")}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {letterResult ? (
                    <>
                      <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-5">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <h2 className="text-xl font-semibold text-white">Hakemus</h2>
                          <button
                            type="button"
                            onClick={saveEditedLetter}
                            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                          >
                            Tallenna muokattu versio
                          </button>
                        </div>

                        <textarea
                          value={letterDraft}
                          onChange={(e) => setLetterDraft(e.target.value)}
                          className="min-h-[360px] w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 font-sans text-sm leading-7 text-zinc-200 outline-none transition focus:border-zinc-600"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          copyText(letterDraft || parsedLetter, "Hakemus kopioitu leikepöydälle.")
                        }
                        className="rounded-2xl bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-500"
                      >
                        Kopioi hakemus
                      </button>
                    </>
                  ) : (
                    <div className="rounded-[28px] border border-dashed border-zinc-800 bg-zinc-950 p-8 text-zinc-400">
                      Generoitu hakemus näkyy täällä, kun valitset työpaikan ja luot hakemuksen.
                    </div>
                  )}
                </div>
              )}
            </div>

            {(message || errorMessage) && (
              <div
                className={`rounded-[28px] border p-4 text-sm ${
                  errorMessage
                    ? "border-red-900 bg-red-950 text-red-300"
                    : "border-emerald-900 bg-emerald-950 text-emerald-300"
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