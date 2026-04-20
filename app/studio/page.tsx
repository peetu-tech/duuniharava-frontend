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
    <div className="mb-10 rounded-[32px] border border-white/10 bg-[#141414] p-8 sm:p-12 shadow-2xl backdrop-blur-xl transition-all duration-300">
      <div className="mb-10 flex flex-wrap items-start justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <p className="text-[13px] font-black uppercase tracking-[0.2em] text-[#00BFA6]">
            {step}
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-white md:text-[36px]">
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
    <div className="rounded-[28px] border border-white/10 bg-[#141414] p-8 shadow-xl w-full transition-all duration-300 hover:-translate-y-2 hover:border-[#00BFA6]/50">
      <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-gray-400">
        {title}
      </p>
      <p className="mt-4 text-4xl font-black tracking-tight text-white">
        {value}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-gray-500">{description}</p>
    </div>
  );
}

function InputClass() {
  return "w-full rounded-2xl border border-white/10 bg-black/50 px-6 py-5 text-white text-lg outline-none transition-all placeholder:text-gray-600 focus:border-[#00BFA6] focus:ring-1 focus:ring-[#00BFA6]";
}

function TextareaClass(minHeight: string) {
  return `w-full rounded-2xl border border-white/10 bg-black/50 px-6 py-5 text-white text-lg outline-none transition-all placeholder:text-gray-600 focus:border-[#00BFA6] focus:ring-1 focus:ring-[#00BFA6] ${minHeight}`;
}

function JobCard({ job, isActive, applicationsCount, cvsCount, onSelect, onRemove, onUpdate }: any) {
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
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#00BFA6]/10 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.15em] text-[#00BFA6]">
              Match {score}%
            </span>
            <span className="rounded-full bg-white/5 px-4 py-2 text-[12px] font-medium uppercase tracking-[0.15em] text-gray-300">
              {getStatusLabel(job.status)}
            </span>
            {job.favorite && (
              <span className="rounded-full bg-[#FF6F3C]/10 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.15em] text-[#FF6F3C]">
                Suosikki
              </span>
            )}
          </div>

          <h4 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {job.title || "Nimetön työpaikka"}
          </h4>

          <p className="mt-4 text-lg text-gray-400">
            {[job.company, job.location, job.type].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onUpdate({ favorite: !job.favorite })}
            className={`flex-1 sm:flex-none rounded-2xl px-6 py-4 text-base font-bold transition-all ${
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
            onClick={onRemove}
            className="flex-1 sm:flex-none rounded-2xl border border-red-900/50 bg-red-500/10 px-6 py-4 text-base font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
          >
            Poista
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-gray-500">
            Yritys
          </p>
          <p className="mt-3 text-lg font-medium text-white truncate">
            {job.company || "-"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-gray-500">
            Sijainti
          </p>
          <p className="mt-3 text-lg font-medium text-white truncate">
            {job.location || "-"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-gray-500">
            Hakemukset
          </p>
          <p className="mt-3 text-lg font-medium text-white">
            {applicationsCount} kpl
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-gray-500">
            Deadline
          </p>
          <p className="mt-3 text-lg font-medium text-white">
            {daysLeft !== null ? (daysLeft < 0 ? "Mennyt" : `${daysLeft} päivää`) : "-"}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-3 block text-sm font-bold text-gray-400 ml-2">Status</label>
          <select value={job.status} onChange={(e) => onUpdate({ status: e.target.value as JobStatus })} className={InputClass()}>
            <option value="saved">Tallennettu</option>
            <option value="interested">Kiinnostava</option>
            <option value="applied">Haettu</option>
            <option value="interview">Haastattelu</option>
            <option value="offer">Tarjous</option>
            <option value="rejected">Hylätty</option>
          </select>
        </div>
        <div>
          <label className="mb-3 block text-sm font-bold text-gray-400 ml-2">Palkka</label>
          <input value={job.salary || ""} onChange={(e) => onUpdate({ salary: e.target.value })} placeholder="Esim. 2800–3200 €/kk" className={InputClass()} />
        </div>
      </div>

      {job.url && (
        <a href={job.url} target="_blank" rel="noreferrer" className="mt-8 inline-flex w-full sm:w-auto justify-center rounded-2xl border border-[#00BFA6]/30 bg-[#00BFA6]/10 px-8 py-5 text-base font-bold text-[#00BFA6] transition hover:bg-[#00BFA6]/20">
          Avaa alkuperäinen ilmoitus ➔
        </a>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Perustilat
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

  // MÄÄRITÄ customStyle-muuttuja tässä!
  const customStyle = customStyles[cvStyle];

  // SUPABASE: Datan lataus alussa
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

  // SUPABASE: Profiilin automaattinen tallennus (Debounce)
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

  const parsedCv = useMemo(() => parseCvResult(cvResult), [cvResult]);
  const parsedLetter = useMemo(() => parseCoverLetter(letterResult), [letterResult]);
  const activeJob = useMemo(() => jobs.find((job) => job.id === activeJobId) || null, [jobs, activeJobId]);

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
        if (jobStatusFilter !== "all" && job.status !== jobStatusFilter) return false;
        if (jobPriorityFilter !== "all" && job.priority !== jobPriorityFilter) return false;
        if (!q) return true;
        return [job.title, job.company, job.location, job.type, job.summary, job.whyFit, job.source, job.notes, job.contactPerson, job.contactEmail, job.companyWebsite, job.salary, job.status, job.priority]
          .filter(Boolean).join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => {
        switch (jobSort) {
          case "match": return safeMatchScore(b.matchScore) - safeMatchScore(a.matchScore);
          case "deadline": {
            const aDays = daysUntil(a.deadline);
            const bDays = daysUntil(b.deadline);
            if (aDays === null && bDays === null) return 0;
            if (aDays === null) return 1;
            if (bDays === null) return -1;
            return aDays - bDays;
          }
          case "priority": return priorityRank(b.priority) - priorityRank(a.priority);
          case "company": return a.company.localeCompare(b.company, "fi");
          case "newest": default: return b.id.localeCompare(a.id);
        }
      });
  }, [jobs, jobFilter, jobStatusFilter, jobPriorityFilter, jobSort, showFavoritesOnly]);

  const dashboardStats = useMemo(() => {
    const total = jobs.length;
    const applied = jobs.filter((job) => job.status === "applied").length;
    const interview = jobs.filter((job) => job.status === "interview").length;
    const favorites = jobs.filter((job) => job.favorite).length;
    return { total, applied, interview, favorites };
  }, [jobs]);

  function updateField(key: keyof typeof emptyForm, value: string) { setForm((prev) => ({ ...prev, [key]: value })); }
  function updateSearchProfile(key: keyof typeof emptySearchProfile, value: string) { setSearchProfile((prev) => ({ ...prev, [key]: value })); }
  function updateJobForm(key: keyof typeof emptyJobForm, value: string) { setJobForm((prev) => ({ ...prev, [key]: value })); }

  function updateJob(id: string, patch: Partial<JobItem>) {
    setJobs((prev) => prev.map((job) => job.id === id ? normalizeJob({ ...job, ...patch }) : job));
    const session = getSession();
    if (session) {
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
  }

  function updateCustomStyle<K extends keyof CvCustomStyle>(key: K, value: CvCustomStyle[K]) {
    setCustomStyles((prev) => ({ ...prev, [cvStyle]: { ...prev[cvStyle], [key]: value } }));
  }

  function resetCurrentStyle() {
    setCustomStyles((prev) => ({ ...prev, [cvStyle]: defaultCustomStyles[cvStyle] }));
    setMessage("CV-tyylin asetukset palautettu.");
    setTimeout(() => setMessage(""), 2500);
  }

  function clearForm() {
    setForm(emptyForm);
    setSearchProfile(emptySearchProfile);
    setJobForm(emptyJobForm);
    setMessage("Lomakkeet tyhjennetty.");
    setTimeout(() => setMessage(""), 2500);
  }

  function fillExample() {
    setForm({
      cvText: "", cvFile: "", cvFileName: "",
      name: "Peetu Salminen", phone: "0449776494", email: "peetu.salminen1@gmail.com",
      location: "Vantaa", targetJob: "Myyjä",
      education: "Sotungin lukio, Vantaa",
      experience: "Marjojen myynti, asiakaspalvelu, asiakkaiden kohtaaminen ja tuotteiden myynti. Lisäksi kokemusta varasto- ja logistiikkatehtävistä sekä keikkaluonteisista töistä.",
      languages: "Suomi, englanti, ruotsi",
      skills: "Viestintä, asiakaspalvelu, myynti, oma-aloitteisuus",
      cards: "B-ajokortti, hygieniapassi, EA1",
      hobbies: "Kuntosali, jääkiekko",
    });
    setSearchProfile({
      desiredRoles: "Myyjä, asiakaspalvelija, varastotyöntekijä", desiredLocation: "Uusimaa",
      workType: "Kokoaikainen tai osa-aikainen", shiftPreference: "Päivävuoro",
      salaryWish: "3000 kk", keywords: "myynti, asiakaspalvelu, varasto",
    });
    setMessage("Esimerkkidata lisätty.");
    setTimeout(() => setMessage(""), 2500);
  }

  function applyQuickTarget(type: "sales" | "warehouse" | "shorter") {
    if (type === "sales") {
      updateField("targetJob", "Myyjä");
      updateSearchProfile("desiredRoles", "Myyjä, asiakaspalvelija");
    }
    if (type === "warehouse") {
      updateField("targetJob", "Varastotyöntekijä");
      updateSearchProfile("desiredRoles", "Varastotyöntekijä, logistiikkatyö");
    }
    if (type === "shorter") {
      const shorten = (text: string) => text.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean).slice(0, 2).join(". ");
      setForm((prev) => ({ ...prev, education: shorten(prev.education), experience: shorten(prev.experience), skills: shorten(prev.skills), cards: shorten(prev.cards), hobbies: shorten(prev.hobbies) }));
    }
    setMessage("Kentät päivitetty.");
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

  async function downloadPdf() {
    if (!pdfRef.current) return;
    try {
      setDownloadingPdf(true);
      const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const imgWidth = 210;
      const pageHeight = 297;
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
      pdf.save("duuniharava-cv.pdf");
      setMessage("PDF ladattu.");
    } catch (e) { setErrorMessage("Virhe PDF-luonnissa."); } finally { setDownloadingPdf(false); }
  }

  async function downloadDocx() {
    try {
      const cvText = parsedCv.cvBody;
      if (!cvText) {
        setErrorMessage("Generoi ensin CV ennen DOCX-latausta.");
        return;
      }
      setDownloadingDocx(true);
      const lines = cvText.split("\n").map((line) => line.trim()).filter(Boolean);
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: lines.map((line, index) => {
              const isMainTitle = index === 0;
              const isSectionTitle = line === line.toUpperCase() || pdfHeadingNames.includes(line);
              if (isMainTitle) return new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: line, bold: true })] });
              if (isSectionTitle) return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: line, bold: true })] });
              return new Paragraph({ children: [new TextRun(line)] });
            }),
          },
        ],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, "duuniharava-cv.docx");
      setMessage("DOCX ladattu.");
    } catch (error) {
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
      setForm((prev) => ({ ...prev, cvFile: event.target?.result as string, cvFileName: file.name }));
      setMessage(`Tiedosto ${file.name} ladattu. Voit nyt parannella sitä.`);
      setTimeout(() => setMessage(""), 3000);
    };
    reader.readAsDataURL(file);
  }

  function validateCvForm() {
    if (!form.targetJob.trim()) { setErrorMessage("Lisää tavoiteltu työ ennen CV:n generointia."); return false; }
    if (mode === "improve" && !form.cvFile && !form.cvText.trim()) { setErrorMessage("Liitä nykyinen CV (esim. PDF) ennen parannusta."); return false; }
    if (mode === "create" && !form.name.trim()) { setErrorMessage("Lisää nimi ennen uuden CV:n luontia."); return false; }
    return true;
  }

  function validateJobForm() {
    if (!jobForm.title.trim() && !jobForm.company.trim() && !jobForm.adText.trim()) {
      setErrorMessage("Lisää vähintään työpaikan otsikko, yritys tai ilmoituksen teksti.");
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
    if (!validateJobForm()) return;
    const job = normalizeJob({
      id: makeId(), title: jobForm.title.trim(), company: jobForm.company.trim(),
      location: jobForm.location.trim(), type: jobForm.type.trim(), summary: jobForm.summary.trim(),
      adText: jobForm.adText.trim(), url: jobForm.url.trim(),
      whyFit: form.targetJob || searchProfile.desiredRoles ? `Sopii profiiliin: ${form.targetJob || searchProfile.desiredRoles}` : "",
      source: "Lisätty käsin", matchScore: safeMatchScore(82), status: "saved", priority: "medium",
      salary: jobForm.salary.trim(), appliedAt: jobForm.appliedAt.trim(), deadline: jobForm.deadline.trim(),
      notes: jobForm.notes.trim(), contactPerson: jobForm.contactPerson.trim(), contactEmail: jobForm.contactEmail.trim(),
      companyWebsite: jobForm.companyWebsite.trim(), favorite: false, archived: false,
    });

    setJobs((prev) => [job, ...prev]);
    setActiveJobId(job.id);
    setJobForm(emptyJobForm);
    setTab("job");
    setMessage("Työpaikka lisätty listaan.");
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
    if (activeJobId === id) setActiveJobId(filtered[0]?.id || "");
    setSavedLetters((prev) => prev.filter((letter) => letter.jobId !== id));
    setSavedCvVariants((prev) => prev.filter((cv) => cv.jobId !== id));

    const session = getSession();
    if (session) {
      fetch(`${supabaseUrl}/rest/v1/jobs?id=eq.${id}`, { method: "DELETE", headers: getSupabaseHeaders() });
    }
  }

  async function suggestJobs() {
    setLoadingJobs(true);
    try {
      const res = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...searchProfile, targetJob: form.targetJob, experience: form.experience, skills: form.skills, languages: form.languages, onlyActive: true }) });
      const data = await res.json();
      const parsed = safeJsonParseJobs(data.output || "[]");
      if (!parsed.length) { setErrorMessage("Työpaikkaehdotuksia ei saatu muodostettua."); return; }
      
      const newJobs: JobItem[] = parsed.map((job) => normalizeJob({ ...job, id: makeId(), source: job.source || "AI-ehdotus", status: (job.status as JobStatus) || "interested", priority: (job.priority as JobPriority) || "medium", favorite: Boolean(job.favorite), archived: false }));
      
      setJobs((prev) => [...newJobs, ...prev]);
      if (!activeJobId && newJobs[0]) setActiveJobId(newJobs[0].id);
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
      setErrorMessage("Työpaikkaehdotusten haku epäonnistui.");
    } finally {
      setLoadingJobs(false);
    }
  }

  async function createTailoredCv() {
    if (!activeJob) { setErrorMessage("Valitse työpaikka ennen kohdistetun CV:n luontia."); return; }
    if (!parsedCv.cvBody) { setErrorMessage("Generoi ensin normaali CV."); return; }
    setLoadingTailoredCv(true);

    try {
      const res = await fetch("/api/cv-tailored", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentCv: parsedCv.cvBody, jobTitle: activeJob.title, companyName: activeJob.company, jobAd: activeJob.adText }),
      });
      const data = await res.json();
      const parsed = parseTailoredCv(data.output || "");

      const item: SavedCvVariant = { id: makeId(), jobId: activeJob.id, jobTitle: activeJob.title, companyName: activeJob.company, content: parsed, createdAt: new Date().toISOString() };
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
      setErrorMessage("Työpaikkaan sopivan CV-version luonti epäonnistui.");
    } finally {
      setLoadingTailoredCv(false);
    }
  }

  async function handleCvSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateCvForm()) return;
    setLoadingCv(true);
    try {
      const res = await fetch("/api/cv", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, ...form }),
      });
      const data = await res.json();
      setCvResult(data.output || data.error || "Jokin meni pieleen.");
      setTab("cv");
    } catch (error) {
      setErrorMessage("Virhe yhteydessä palvelimeen.");
    } finally {
      setLoadingCv(false);
    }
  }

  async function handleCoverLetterSubmit() {
    if (!validateLetterForm() || !activeJob) return;
    setLoadingLetter(true);

    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, cvText: parsedCv.cvBody || form.cvText, jobTitle: activeJob.title, companyName: activeJob.company, jobAd: activeJob.adText, tone: letterTone }),
      });
      const data = await res.json();
      const parsed = parseCoverLetter(data.output || data.error || "Jokin meni pieleen.");

      setLetterResult(data.output);
      setLetterDraft(parsed);

      const savedLetter: SavedLetter = { id: makeId(), jobId: activeJob.id, jobTitle: activeJob.title, companyName: activeJob.company, content: parsed, createdAt: new Date().toISOString() };
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
      setErrorMessage("Virhe yhteydessä palvelimeen.");
    } finally {
      setLoadingLetter(false);
    }
  }

  function saveEditedLetter() {
    if (!activeJob || !letterDraft.trim()) return;
    const savedLetter: SavedLetter = { id: makeId(), jobId: activeJob.id, jobTitle: activeJob.title, companyName: activeJob.company, content: letterDraft.trim(), createdAt: new Date().toISOString() };
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

  if (isAuthChecking) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-[#00BFA6] font-black text-2xl animate-pulse">LADATAAN...</div>;

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
            <button onClick={() => { clearSession(); router.push("/login"); }} className="rounded-2xl border border-white/10 px-8 py-3 text-sm font-black text-gray-400 hover:bg-white/5 hover:text-white transition-all">KIRJAUDU ULOS</button>
          </div>
          <div className="grid gap-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-8">
                Tee työhausta <span className="text-[#00BFA6]">helppoa.</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-xl leading-relaxed mb-12">
                Luo upea CV, löydä avoimet työpaikat ja anna tekoälyn kirjoittaa hakemukset puolestasi.
              </p>
              <div className="flex flex-col sm:flex-row gap-5">
                <button onClick={() => setShowHelp(!showHelp)} className="bg-[#00BFA6]/10 border border-[#00BFA6]/40 text-[#00BFA6] px-10 py-5 rounded-[24px] text-lg font-black hover:bg-[#00BFA6]/20 transition-all shadow-xl flex items-center justify-center gap-3">
                  <span className="text-2xl">💡</span> {showHelp ? "Piilota ohjeet" : "Näytä selkeät käyttöohjeet"}
                </button>
                <button onClick={fillExample} className="bg-white text-black px-10 py-5 rounded-[24px] text-lg font-black hover:bg-gray-200 transition-all shadow-xl">
                  Täytä esimerkki
                </button>
              </div>
            </div>
            <div className="grid gap-6">
              <StatCard title="TYÖPAIKAT" value={jobs.length.toString()} description="Seurannassa olevat paikat" />
              <div className="grid grid-cols-2 gap-6">
                <StatCard title="CV-TYYLIT" value="4" description="Valmista pohjaa" />
                <StatCard title="SÄVYT" value="3" description="Hakemuksiin" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {showHelp && (
        <section className="max-w-7xl mx-auto px-8 mt-12 animate-in fade-in slide-in-from-top-6">
          <div className="rounded-[40px] border-2 border-[#00BFA6]/30 bg-zinc-900/90 p-10 sm:p-16 shadow-2xl backdrop-blur-xl">
            <h2 className="text-3xl font-black mb-10 border-b border-white/5 pb-6">Näin käytät ohjelmaa:</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 text-lg">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#00BFA6] text-black flex items-center justify-center font-black text-2xl">1</div>
                <p className="font-bold text-white text-xl">Kirjoita tiedot</p>
                <p className="text-gray-400">Täytä nimesi ja kokemuksesi vasemman puolen "Vaihe 1" -laatikkoon. Voit myös ladata vanhan PDF-CV:n.</p>
              </div>
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#00BFA6] text-black flex items-center justify-center font-black text-2xl">2</div>
                <p className="font-bold text-white text-xl">Luo uusi CV</p>
                <p className="text-gray-400">Paina vihreää "Generoi CV" -nappia. Tekoäly tekee sinulle hienon tekstin, jonka näet oikealla "Esikatselu"-välilehdellä.</p>
              </div>
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#FF6F3C] text-black flex items-center justify-center font-black text-2xl">3</div>
                <p className="font-bold text-white text-xl">Etsi töitä</p>
                <p className="text-gray-400">Kerro "Vaihe 2" -kohdassa mitä työtä etsit ja paina nappia. Saat listan aidoista avoimista paikoista.</p>
              </div>
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#FF6F3C] text-black flex items-center justify-center font-black text-2xl">4</div>
                <p className="font-bold text-white text-xl">Tee hakemus</p>
                <p className="text-gray-400">Valitse paikka listalta, mene "Hakemukset"-välilehdelle ja paina "Kirjoita hakemus". Valmista tuli!</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-8 py-16 md:py-20 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12">
          <div className="space-y-12">
            <SectionShell step="VAIHE 1" title="Hakijan tiedot" description="Täytä tietosi tai lataa olemassa oleva CV." action={<button onClick={clearForm} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-gray-300 hover:bg-white/10 hover:border-red-500/50">Tyhjennä</button>}>
               <form onSubmit={handleCvSubmit} className="space-y-8 mt-4">
                  {mode === "improve" && (
                    <div className="mb-10 p-10 bg-black/40 rounded-3xl border border-white/5">
                      <label className="mb-4 block text-sm font-bold text-gray-500 uppercase tracking-widest">Vanha CV (PDF)</label>
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <label className="cursor-pointer rounded-2xl bg-white/[0.05] border border-white/10 px-8 py-5 text-center transition-all hover:bg-white/10 hover:border-[#00BFA6]/50 flex-1">
                          <span className="font-bold text-white">VALITSE PDF-TIEDOSTO</span>
                          <input type="file" accept="application/pdf" className="hidden" onChange={handleCvFileUpload} />
                        </label>
                        {form.cvFileName && <span className="text-[#00BFA6] font-bold">✓ {form.cvFileName}</span>}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <input className={InputClass()} placeholder="Koko nimi" value={form.name} onChange={e => updateField("name", e.target.value)} />
                    <input className={InputClass()} placeholder="Puhelinnumero" value={form.phone} onChange={e => updateField("phone", e.target.value)} />
                    <input className={InputClass()} placeholder="Sähköpostiosoite" value={form.email} onChange={e => updateField("email", e.target.value)} />
                    <input className={InputClass()} placeholder="Paikkakunta" value={form.location} onChange={e => updateField("location", e.target.value)} />
                  </div>

                  <input className={InputClass()} placeholder="Mitä työtä haet? (esim. Myyjä)" value={form.targetJob} onChange={e => updateField("targetJob", e.target.value)} />
                  <textarea className={TextareaClass("min-h-[120px]")} placeholder="Koulutuksesi..." value={form.education} onChange={e => updateField("education", e.target.value)} />
                  <textarea className={TextareaClass("min-h-[180px]")} placeholder="Työkokemuksesi lyhyesti..." value={form.experience} onChange={e => updateField("experience", e.target.value)} />
                  <textarea className={TextareaClass("min-h-[120px]")} placeholder="Tärkeimmät taitosi..." value={form.skills} onChange={e => updateField("skills", e.target.value)} />

                  <div className="py-6">
                    <ProfileImageUpload image={profileImage} onChange={setProfileImage} />
                  </div>

                  <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-8 mt-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
                      <div>
                        <p className="text-lg font-black text-white">Ulkoasun säädöt</p>
                        <p className="text-sm text-gray-500">Hienosäädä dokumentin ulkoasua.</p>
                      </div>
                      <button type="button" onClick={resetCurrentStyle} className="rounded-xl bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10">Palauta</button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {(["modern", "classic", "compact", "bold"] as CvStyleVariant[]).map(v => (
                        <button key={v} type="button" onClick={() => setCvStyle(v)} className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${cvStyle === v ? "bg-[#00BFA6] text-black shadow-md" : "bg-white/5 text-white hover:bg-white/10"}`}>
                          {v.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs text-gray-400">Palkin väri</label><input type="color" value={customStyle.sidebarBg} onChange={e => updateCustomStyle("sidebarBg", e.target.value)} className="h-10 w-full rounded-xl bg-black/50 p-1" /></div>
                      <div><label className="text-xs text-gray-400">Palkin teksti</label><input type="color" value={customStyle.sidebarText} onChange={e => updateCustomStyle("sidebarText", e.target.value)} className="h-10 w-full rounded-xl bg-black/50 p-1" /></div>
                      <div><label className="text-xs text-gray-400">Tausta</label><input type="color" value={customStyle.mainBg} onChange={e => updateCustomStyle("mainBg", e.target.value)} className="h-10 w-full rounded-xl bg-black/50 p-1" /></div>
                      <div><label className="text-xs text-gray-400">Pääteksti</label><input type="color" value={customStyle.mainText} onChange={e => updateCustomStyle("mainText", e.target.value)} className="h-10 w-full rounded-xl bg-black/50 p-1" /></div>
                      <div className="col-span-2"><label className="text-xs text-gray-400">Korosteväri</label><input type="color" value={customStyle.accentColor} onChange={e => updateCustomStyle("accentColor", e.target.value)} className="h-10 w-full rounded-xl bg-black/50 p-1" /></div>
                    </div>
                  </div>

                  <button type="submit" disabled={loadingCv} className="w-full bg-[#00BFA6] text-black font-black py-6 rounded-[24px] text-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_40px_-10px_rgba(0,191,166,0.6)] mt-4">
                    {loadingCv ? "LUODAAN..." : "1. GENEROI CV TEKOÄLYLLÄ"}
                  </button>
               </form>
            </SectionShell>

            <SectionShell step="VAIHE 2" title="Hakuprofiili" description="Kerro tekoälylle mitä etsit.">
               <div className="space-y-8 mt-4">
                  <textarea className={TextareaClass("min-h-[140px]")} placeholder="Esim: Myyntityö, Helsinki, Kokopäiväinen..." value={searchProfile.desiredRoles} onChange={e => updateSearchProfile("desiredRoles", e.target.value)} />
                  <button onClick={suggestJobs} disabled={loadingJobs} className="w-full bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] text-black font-black py-6 rounded-[24px] text-xl hover:scale-[1.02] transition-all shadow-xl">
                    {loadingJobs ? "ETSITÄÄN..." : "2. EHDOTA TYÖPAIKKOJA"}
                  </button>
               </div>
            </SectionShell>
          </div>

          <div className="space-y-12 lg:sticky lg:top-32 self-start">
             <div className="rounded-[40px] border border-white/10 bg-[#141414] p-8 sm:p-12 shadow-2xl backdrop-blur-xl min-h-[850px]">
                
                <div className="flex overflow-x-auto gap-5 border-b border-white/5 pb-8 mb-12 custom-scrollbar">
                   <button onClick={() => setTab("cv")} className={`px-10 py-5 rounded-2xl font-black text-lg transition-all ${tab === "cv" ? "bg-[#00BFA6] text-black shadow-lg" : "bg-white/5 text-gray-500 hover:text-white"}`}>ESIKATSELU</button>
                   <button onClick={() => setTab("job")} className={`px-10 py-5 rounded-2xl font-black text-lg transition-all ${tab === "job" ? "bg-[#00BFA6] text-black shadow-lg" : "bg-white/5 text-gray-500 hover:text-white"}`}>TYÖPAIKAT</button>
                   <button onClick={() => setTab("letter")} className={`px-10 py-5 rounded-2xl font-black text-lg transition-all ${tab === "letter" ? "bg-[#00BFA6] text-black shadow-lg" : "bg-white/5 text-gray-500 hover:text-white"}`}>HAKEMUKSET</button>
                </div>

                {tab === "cv" && (
                  <div className="animate-in fade-in duration-500">
                    {cvResult ? (
                      <div className="space-y-10">
                        <div className="bg-white rounded-[32px] p-8 sm:p-12 shadow-inner overflow-hidden">
                           <div className="min-w-[600px] lg:min-w-0">
                              <CvPreview cvText={parsedCv.cvBody} image={profileImage} styleVariant={cvStyle} customStyle={customStyles[cvStyle]} />
                           </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-5">
                            <button onClick={downloadPdf} className="flex-1 bg-black text-white py-5 rounded-2xl font-black text-lg hover:bg-zinc-800 transition-all">LATAA PDF</button>
                            <button onClick={downloadDocx} className="flex-1 border-2 border-zinc-800 text-zinc-400 py-5 rounded-2xl font-black text-lg hover:border-white hover:text-white transition-all">LATAA DOCX</button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-40 border-2 border-dashed border-white/5 rounded-[40px] text-gray-600">
                         <p className="text-6xl mb-8">✍️</p>
                         <p className="font-black text-2xl text-white">Ei esikatselua vielä</p>
                         <p className="mt-4 text-lg">Paina "Generoi CV" vasemmalta.</p>
                      </div>
                    )}
                  </div>
                )}

                {tab === "job" && (
                   <div className="space-y-8 animate-in fade-in duration-500">
                      <div className="p-8 bg-black/40 rounded-[32px] border border-white/5 space-y-4">
                         <h3 className="font-bold text-[#00BFA6]">LISÄÄ TYÖPAIKKA MANUAALISESTI</h3>
                         <input className={InputClass()} placeholder="Tehtävänimike" value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} />
                         <input className={InputClass()} placeholder="Yritys" value={jobForm.company} onChange={e => setJobForm({...jobForm, company: e.target.value})} />
                         <button onClick={addJob} className="w-full bg-white/10 text-white border border-white/20 font-black py-4 rounded-2xl hover:bg-white/20 transition-all">+ Tallenna</button>
                      </div>
                      <div className="flex items-center gap-4">
                        <input value={jobFilter} onChange={e => setJobFilter(e.target.value)} placeholder="Hae listasta..." className="w-full rounded-2xl bg-black/50 border border-white/10 px-5 py-4 text-sm outline-none focus:border-[#00BFA6]" />
                        <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`px-4 py-4 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${showFavoritesOnly ? "bg-[#FF6F3C] text-white" : "bg-white/5 text-gray-400"}`}>★ Vain suosikit</button>
                      </div>
                      <div className="space-y-6">
                        {filteredJobs.length === 0 ? (
                          <div className="text-center py-32 text-gray-500 text-sm font-medium">Ei työpaikkoja näytettäväksi.</div>
                        ) : (
                          filteredJobs.map(job => (
                            <JobCard key={job.id} job={job} isActive={activeJobId === job.id} onSelect={() => setActiveJobId(job.id)} onRemove={() => removeJob(job.id)} onUpdate={(p:any) => updateJob(job.id, p)} />
                          ))
                        )}
                      </div>
                   </div>
                )}

                {tab === "letter" && (
                   <div className="space-y-8 animate-in fade-in duration-500">
                      {activeJob ? (
                        <div className="space-y-6">
                           <div className="p-8 bg-[#00BFA6]/5 border border-[#00BFA6]/20 rounded-3xl">
                              <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">Valittu kohde:</p>
                              <p className="text-2xl font-black mt-1 text-[#00BFA6]">{activeJob.title}</p>
                              <p className="text-white font-bold">{activeJob.company}</p>
                           </div>
                           <button onClick={handleCoverLetterSubmit} disabled={loadingLetter} className="w-full bg-[#FF6F3C] text-white font-black py-6 rounded-[24px] text-xl shadow-[0_10px_30px_-10px_rgba(255,111,60,0.5)]">
                              3. KIRJOITA HAKEMUS ➔
                           </button>
                           {letterDraft && (
                             <textarea value={letterDraft} onChange={e => setLetterDraft(e.target.value)} className={TextareaClass("min-h-[400px] border-[#00BFA6]/30")} />
                           )}
                        </div>
                      ) : (
                        <div className="text-center py-32 text-gray-500">Valitse ensin työpaikka listalta.</div>
                      )}
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* ALERT POPUP */}
      {(message || errorMessage) && (
        <div className={`fixed bottom-10 right-10 z-[100] p-6 rounded-3xl border shadow-2xl animate-in slide-in-from-bottom-10 ${errorMessage ? 'bg-red-950 border-red-500 text-white' : 'bg-[#00BFA6] border-white/20 text-black font-black'}`}>
          {errorMessage || message}
        </div>
      )}
    </main>
  );
}
