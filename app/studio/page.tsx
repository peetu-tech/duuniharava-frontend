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
import { clearSession, getSession, getValidSession } from "../../lib/supabaseAuth";
import { trackUsageEvent } from "../../lib/usageTracking";

// --- SUPABASE ASETUKSET --- 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function getSupabaseHeaders() {
  const session = await getValidSession();
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

type Tab = "cv" | "jobs" | "tips" | "hakemus";
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
  tone?: LetterTone;
  createdAt: string;
  updatedAt?: string;
};

type SavedCvVariant = {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  content: string;
  createdAt: string;
};

type SavedStylePreset = {
  id: string;
  name: string;
  styleVariant: CvStyleVariant;
  customStyle: CvCustomStyle;
  createdAt: string;
};

type SavedLetterTonePreset = {
  id: string;
  name: string;
  tone: LetterTone;
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
  projects: "",
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

type StudioDraftState = {
  updatedAt: string;
  mode: "improve" | "create";
  tab: Tab;
  letterViewMode: "edit" | "preview";
  cvStyle: CvStyleVariant;
  letterTone: LetterTone;
  theme: "light" | "dark";
  form: typeof emptyForm;
  searchProfile: typeof emptySearchProfile;
  jobForm: typeof emptyJobForm;
  jobs: JobItem[];
  savedLetters: SavedLetter[];
  savedCvVariants: SavedCvVariant[];
  cvResult: string;
  letterResult: string;
  letterDraft: string;
  profileImage: string;
  jobFilter: string;
  jobStatusFilter: "all" | JobStatus;
  jobPriorityFilter: "all" | JobPriority;
  jobSort: "match" | "deadline" | "priority" | "newest" | "company";
  showFavoritesOnly: boolean;
  activeJobId: string;
  currentJobIndex: number;
  customStyles: Record<CvStyleVariant, CvCustomStyle>;
  savedStylePresets: SavedStylePreset[];
  savedLetterTonePresets: SavedLetterTonePreset[];
};

type StudioCloudState = {
  updatedAt: string;
  searchProfile: typeof emptySearchProfile;
  jobForm: typeof emptyJobForm;
  theme: "light" | "dark";
  cvStyle: CvStyleVariant;
  letterTone: LetterTone;
  customStyles: Record<CvStyleVariant, CvCustomStyle>;
  cvResult: string;
  letterResult: string;
  letterDraft: string;
  activeJobId: string;
  currentJobIndex: number;
  tab: Tab;
  jobFilter: string;
  jobStatusFilter: "all" | JobStatus;
  jobPriorityFilter: "all" | JobPriority;
  jobSort: "match" | "deadline" | "priority" | "newest" | "company";
  showFavoritesOnly: boolean;
  savedStylePresets: SavedStylePreset[];
  savedLetterTonePresets: SavedLetterTonePreset[];
};

const STORAGE_KEY = "duuniharava_state_v8";

function getTimestampMs(value?: string) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getStudioStorageKey(userId: string) {
  return `${STORAGE_KEY}_${userId}`;
}

function clearStudioLocalState(userId?: string) {
  if (typeof window === "undefined") return;
  if (userId) {
    localStorage.removeItem(getStudioStorageKey(userId));
  }
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("duuniharava.auth.session");
}

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
    contactSpacing: 40,
    iconStyle: "outline",
    timelineStyle: "solid",
    itemSpacing: 16,
    headerFontWeight: "black",
    imageBorderWidth: 4,
    headingSize: 16,
    contactSize: 14,
    headingTransform: "uppercase",
    imageFilter: "none",
    sidebarBorder: false,
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
    contactSpacing: 40,
    iconStyle: "solid",
    timelineStyle: "none",
    itemSpacing: 20,
    headerFontWeight: "bold",
    imageBorderWidth: 0,
    headingSize: 18,
    contactSize: 14,
    headingTransform: "uppercase",
    imageFilter: "none",
    sidebarBorder: true,
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
    contactSpacing: 32,
    iconStyle: "none",
    timelineStyle: "dashed",
    itemSpacing: 12,
    headerFontWeight: "black",
    imageBorderWidth: 2,
    headingSize: 16,
    contactSize: 13,
    headingTransform: "none",
    imageFilter: "none",
    sidebarBorder: false,
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
    contactSpacing: 40,
    iconStyle: "solid",
    timelineStyle: "dotted",
    itemSpacing: 24,
    headerFontWeight: "black",
    imageBorderWidth: 6,
    headingSize: 18,
    contactSize: 15,
    headingTransform: "uppercase",
    imageFilter: "none",
    sidebarBorder: false,
  },
};

const premiumStylePresets: SavedStylePreset[] = [
  {
    id: "preset-executive-slate",
    name: "Executive Slate",
    styleVariant: "modern",
    createdAt: "system",
    customStyle: {
      ...defaultCustomStyles.modern,
      sidebarBg: "#111827",
      sidebarBg2: "#1f2937",
      accentColor: "#14b8a6",
      headingColor: "#0f766e",
      mainBg: "#ffffff",
      mainBg2: "#f8fafc",
      fontFamily: "editorial",
      pattern: "lines",
      patternOpacity: 3,
      sidebarPattern: "none",
      borderRadius: 18,
      pagePadding: 52,
      headingStyle: "simple",
      itemSpacing: 18,
    },
  },
  {
    id: "preset-creative-pulse",
    name: "Creative Pulse",
    styleVariant: "bold",
    createdAt: "system",
    customStyle: {
      ...defaultCustomStyles.bold,
      sidebarBg: "#3b0764",
      sidebarBg2: "#581c87",
      accentColor: "#f97316",
      headingColor: "#7c3aed",
      mainBg: "#fff7ed",
      mainBg2: "#ffedd5",
      fontFamily: "rounded",
      pattern: "chevrons",
      patternOpacity: 6,
      sidebarPattern: "halftone",
      sidebarPatternOpacity: 8,
      shadowStyle: "soft",
      imageShape: "rounded",
    },
  },
  {
    id: "preset-minimal-nordic",
    name: "Minimal Nordic",
    styleVariant: "compact",
    createdAt: "system",
    customStyle: {
      ...defaultCustomStyles.compact,
      sidebarBg: "#e0f2fe",
      sidebarBg2: "#f0f9ff",
      sidebarText: "#0f172a",
      accentColor: "#0ea5e9",
      headingColor: "#0369a1",
      mainBg: "#ffffff",
      mainBg2: "#f8fafc",
      fontFamily: "clean",
      pattern: "none",
      sidebarPattern: "dots",
      sidebarPatternOpacity: 6,
      headingStyle: "underline",
      borderRadius: 14,
      pagePadding: 44,
    },
  },
];

const starterLetterTonePresets: SavedLetterTonePreset[] = [
  { id: "tone-pro", name: "Asiallinen perus", tone: "professional", createdAt: "system" },
  { id: "tone-warm", name: "Lämmin ja ihmisläheinen", tone: "warm", createdAt: "system" },
  { id: "tone-sales", name: "Rohkea ja myyvä", tone: "sales", createdAt: "system" },
];

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

function safeLetterTone(value: unknown): LetterTone {
  if (value === "warm" || value === "sales" || value === "professional") {
    return value;
  }
  return "professional";
}

function getLetterToneLabel(tone?: LetterTone) {
  switch (tone) {
    case "warm":
      return "Lämmin";
    case "sales":
      return "Myyvä";
    case "professional":
    default:
      return "Asiallinen";
  }
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

function getSourceMeta(source?: string) {
  const value = (source || "").trim();

  switch (value) {
    case "Työmarkkinatori":
      return {
        label: value,
        note: "Tiedot haettu suoraan työpaikkalähteestä.",
        badgeClass:
          "border-[#00BFA6]/25 bg-[#00BFA6]/10 text-[#00BFA6]",
      };
    case "Duunitori":
    case "Oikotie":
    case "LinkedIn":
    case "Jobly":
    case "Indeed":
    case "Monster":
    case "Kuntarekry":
      return {
        label: value,
        note: "Avaa alkuperäinen ilmoitus nähdäksesi koko kuvauksen.",
        badgeClass:
          "border-blue-500/25 bg-blue-500/10 text-blue-500",
      };
    case "Lisätty käsin":
      return {
        label: value,
        note: "Oma lisäys seurantaan.",
        badgeClass:
          "border-amber-500/25 bg-amber-500/10 text-amber-500",
      };
    case "AI-ehdotus":
    case "Tekoäly-simulaatio":
      return {
        label: value || "AI-ehdotus",
        note: "Arvioitu ehdotus, tarkista yksityiskohdat ennen hakemista.",
        badgeClass:
          "border-purple-500/25 bg-purple-500/10 text-purple-500",
      };
    default:
      return {
        label: value || "Lähde",
        note: "Tarkista ilmoituksen tiedot ennen hakemista.",
        badgeClass:
          "border-white/10 bg-white/5 text-gray-300",
      };
  }
}

function formatJobsSearchFailure(data: any) {
  const diagnostics = data?.diagnostics;

  if (!diagnostics) {
    return data?.error || "Työpaikkaehdotuksia ei saatu muodostettua juuri nyt.";
  }

  const notes: string[] = [];

  if (diagnostics.tyomarkkinatoriStatus === "failed") {
    notes.push("Työmarkkinatori ei vastannut tällä hetkellä.");
  } else if ((diagnostics.tyomarkkinatoriCount ?? 0) > 0) {
    notes.push(`Työmarkkinatorilta löytyi ${diagnostics.tyomarkkinatoriCount} osumaa.`);
  }

  if (diagnostics.googleStatus === "http_403") {
    notes.push("Google-varahaku tarvitsee asetusten tarkistuksen.");
  } else if ((diagnostics.googleCount ?? 0) > 0) {
    notes.push(`Muista lähteistä löytyi ${diagnostics.googleCount} osumaa.`);
  }

  if (!diagnostics.usesProxy) {
    notes.push("Proxy ei ole käytössä.");
  }

  if ((diagnostics.tyomarkkinatoriCount ?? 0) === 0 && (diagnostics.googleCount ?? 0) === 0) {
    notes.unshift("Työpaikkoja ei löytynyt juuri nyt yhdestäkään lähteestä.");
  }

  notes.push("Tarkista hakuehdot tai kokeile hetken päästä uudelleen.");

  return notes.join(" ");
}

function formatRelativeSearchTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMinutes = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / (1000 * 60)),
  );

  if (diffMinutes < 1) return "haettu juuri nyt";
  if (diffMinutes < 60) return `haettu ${diffMinutes} min sitten`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `haettu ${diffHours} h sitten`;

  const diffDays = Math.round(diffHours / 24);
  return `haettu ${diffDays} pv sitten`;
}

// --- KOMPONENTIT ---

function SectionShell({
  id,
  step,
  title,
  description,
  action,
  children,
  theme,
  defaultOpen = true,
}: {
  id?: string;
  step: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  theme: "light" | "dark";
  defaultOpen?: boolean;
}) {
  return (
    <details 
      id={id} 
      className={`group mb-8 sm:mb-16 rounded-[28px] sm:rounded-[40px] border p-5 sm:p-14 shadow-2xl backdrop-blur-xl transition-colors scroll-mt-24 ${theme === 'dark' ? 'border-white/10 bg-[#141414]' : 'border-gray-200 bg-white'}`}
      open={defaultOpen}
    >
      <summary className={`list-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-7 border-b pb-5 sm:pb-8 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] rounded-xl [&::-webkit-details-marker]:hidden ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
        <div className="w-full sm:w-auto flex justify-between items-center">
          <div>
            <p className="text-[11px] sm:text-[13px] font-black uppercase tracking-[0.24em] text-[#00BFA6]" aria-hidden="true">
              {step}
            </p>
            <h2 id={`section-heading-${step}`} className={`mt-2 sm:mt-3 text-2xl sm:text-4xl font-black tracking-tight md:text-[38px] transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h2>
          </div>
          <div className={`sm:hidden flex items-center justify-center w-10 h-10 rounded-full border transition-transform group-open:rotate-180 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
            ?
          </div>
        </div>
        
        <div className="w-full sm:w-auto hidden group-open:block" onClick={(e) => e.stopPropagation()}>
          {action}
        </div>
      </summary>

      <div className="mt-10 animate-in fade-in duration-300">
        {description ? (
          <p className={`mb-10 max-w-2xl text-base sm:text-lg leading-8 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </details>
  );
}

function StatCard({ title, value, description, theme }: { title: string; value: string; description: string; theme: "light" | "dark"; }) {
  return (
    <div className={`rounded-[30px] border p-8 sm:p-10 shadow-xl transition-all duration-300 hover:-translate-y-2 w-full flex flex-col justify-center ${theme === 'dark' ? 'border-white/10 bg-[#141414] hover:border-[#00BFA6]/50' : 'border-gray-200 bg-white hover:border-[#00BFA6]/50'}`}>
      <p className={`text-[12px] font-bold uppercase tracking-[0.24em] transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
        {title}
      </p>
      <p className={`mt-4 text-5xl font-black tracking-tight transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
      <p className={`mt-3 text-sm leading-relaxed transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
    </div>
  );
}

function InputClass(theme: "light" | "dark") {
  return `w-full rounded-2xl border px-6 py-5 text-base outline-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] min-h-[64px] ${
    theme === "dark"
      ? "border-white/10 bg-black/50 text-white placeholder:text-gray-600 focus:border-[#00BFA6]"
      : "border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#00BFA6]"
  }`;
}

function TextareaClass(minHeight: string, theme: "light" | "dark") {
  return `w-full rounded-2xl border px-6 py-5 text-base leading-8 outline-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] shadow-inner ${minHeight} ${
    theme === "dark"
      ? "border-white/10 bg-black/50 text-white placeholder:text-gray-600 focus:border-[#00BFA6]"
      : "border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#00BFA6]"
  }`;
}

function LabelClass(theme: "light" | "dark") {
  return `mb-4 block text-sm font-bold ml-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-700'}`;
}

function FieldHint({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: "light" | "dark";
}) {
  return (
    <div
      className={`mt-4 flex items-start gap-3 rounded-xl border-l-2 px-3 py-2 text-xs sm:text-sm leading-6 ${
        theme === "dark"
          ? "border-[#00BFA6]/50 bg-transparent text-gray-500"
          : "border-[#00BFA6]/40 bg-transparent text-gray-500"
      }`}
    >
      <span className="mt-0.5 text-[11px] text-[#00BFA6]" aria-hidden="true">
        Vinkki
      </span>
      <p>{children}</p>
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
  onSparring,
  onSalary,
  onAtsScan,
  onInterviewPrep,
  theme,
  searchTimeLabel,
}: any) {
  const score = safeMatchScore(job.matchScore);
  const daysLeft = daysUntil(job.deadline);
  const [showJobTools, setShowJobTools] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const sourceMeta = getSourceMeta(job.source);
  const isExternalPreview = ["Duunitori", "Oikotie", "LinkedIn", "Jobly", "Indeed", "Monster", "Kuntarekry"].includes(sourceMeta.label);
  const originalLabel = ["Duunitori", "Oikotie", "LinkedIn", "Jobly", "Indeed", "Monster", "Kuntarekry"].includes(sourceMeta.label)
    ? "Avaa alkuperäinen ilmoitus"
    : "Avaa ilmoitus";

  return (
    <article
      className={`rounded-[32px] border p-6 sm:p-10 transition-all duration-300 w-full animate-in fade-in slide-in-from-bottom-4 ${
        isActive
          ? (theme === 'dark' ? "border-[#00BFA6]/50 bg-[#00BFA6]/5 shadow-[0_10px_30px_-10px_rgba(0,191,166,0.2)]" : "border-[#00BFA6]/50 bg-[#00BFA6]/5 shadow-[0_10px_30px_-10px_rgba(0,191,166,0.2)]")
          : (theme === 'dark' ? "border-white/10 bg-[#141414] hover:border-white/20 hover:-translate-y-1" : "border-gray-200 bg-white hover:border-gray-300 hover:-translate-y-1")
      }`}
    >
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
          <div className="min-w-0 flex-1">
            <div className="mb-5 flex flex-wrap items-center gap-3">
            {job.source && (
              <span className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${sourceMeta.badgeClass}`}>
                {sourceMeta.label}
              </span>
            )}
            <span className="rounded-full bg-[#00BFA6]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#00BFA6]">
              Match {score}%
            </span>
            <span className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${theme === 'dark' ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              {getStatusLabel(job.status)}
            </span>
            <span className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${theme === 'dark' ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              {getPriorityLabel(job.priority)}
            </span>
            {job.favorite && (
              <span className="rounded-full bg-[#FF6F3C]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#FF6F3C]">
                Suosikki
              </span>
            )}
            {searchTimeLabel && (
              <span className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${theme === 'dark' ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                {searchTimeLabel}
              </span>
            )}
          </div>

          <h4 className={`text-3xl sm:text-4xl font-black tracking-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {job.title || "Nimetön työpaikka"}
          </h4>

          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {[job.company, job.location, job.type].filter(Boolean).join(" · ")}
          </p>

          {job.source && (
            <p className={`mt-3 text-sm leading-6 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
              {sourceMeta.note}
            </p>
          )}

          {isExternalPreview && (
            <div className={`mt-4 inline-flex max-w-full rounded-2xl border px-4 py-3 text-sm leading-6 ${theme === 'dark' ? 'border-blue-500/20 bg-blue-500/10 text-blue-200' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
              Tässä kortissa näkyy vain esikatselu. Avaa alkuperäinen ilmoitus nähdäksesi koko tekstin ja ajantasaiset tiedot.
            </div>
          )}
        </div>

          <div className="w-full lg:w-auto pt-6 lg:pt-0 border-t border-transparent lg:border-none mt-4 lg:mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => onUpdate({ favorite: !job.favorite })}
                aria-pressed={job.favorite}
                className={`w-full rounded-2xl px-5 py-4 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
                  job.favorite
                    ? "bg-[#FF6F3C] text-white shadow-[0_0_15px_rgba(255,111,60,0.4)] hover:bg-[#FF6F3C]/80"
                    : (theme === 'dark' ? "border border-white/10 bg-white/5 text-white hover:bg-white/10" : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100")
                }`}
              >
                {job.favorite ? "? Suosikki" : "? Tallenna"}
              </button>

              <button
                type="button"
                onClick={() => setShowJobTools((prev: boolean) => !prev)}
                aria-expanded={showJobTools}
                className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
                  theme === 'dark' ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {showJobTools ? "Piilota lisätyökalut" : "Lisätyökalut"}
              </button>

              <button
                type="button"
                onClick={onRemove}
                aria-label={`Poista työpaikka ${job.title}`}
                className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 ${theme === 'dark' ? 'border-red-900/50 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
              >
                Poista
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowJobDetails((prev: boolean) => !prev)}
              aria-expanded={showJobDetails}
              className={`mt-3 w-full rounded-2xl border px-5 py-4 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
                theme === 'dark' ? "border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/10" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {showJobDetails ? "Piilota seurannan tiedot" : "Näytä seurannan tiedot"}
            </button>

            {showJobTools && (
              <div className={`mt-4 rounded-[28px] border p-4 sm:p-5 ${theme === 'dark' ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-gray-50/90'}`}>
                <p className={`mb-4 text-xs font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Lisätyökalut
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onAtsScan}
                    aria-label={`Skannaa ATS-osuvuus työpaikkaan ${job.title}`}
                    className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${theme === 'dark' ? 'border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500 hover:text-white focus-visible:ring-purple-500' : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white focus-visible:ring-purple-600'}`}
                  >
                    ATS-skanneri
                  </button>

                  <button
                    type="button"
                    onClick={onInterviewPrep}
                    aria-label={`Ennakoi haastattelukysymykset työpaikkaan ${job.title}`}
                    className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${theme === 'dark' ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500 hover:text-white focus-visible:ring-indigo-500' : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white focus-visible:ring-indigo-600'}`}
                  >
                    Haastattelutärpit
                  </button>

                  <button
                    type="button"
                    onClick={onSalary}
                    aria-label={`Tarkista palkkataso työpaikkaan ${job.title}`}
                    className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${theme === 'dark' ? 'border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500 hover:text-white focus-visible:ring-blue-500' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white focus-visible:ring-blue-600'}`}
                  >
                    Palkka-arvio
                  </button>

                  <button
                    type="button"
                    onClick={onSparring}
                    aria-label={`Treenaa haastattelua työpaikkaan ${job.title}`}
                    className="w-full rounded-2xl border border-[#00BFA6]/40 bg-[#00BFA6]/10 px-5 py-4 text-sm font-bold text-[#00BFA6] transition hover:bg-[#00BFA6] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
                  >
                    Haastattelutreeni
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      {job.summary && (
        <p className={`mt-8 text-base leading-relaxed p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/40 border-white/5 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>{job.summary}</p>
      )}

      {job.whyFit && (
        <div className="mt-6 rounded-3xl border border-[#00BFA6]/20 bg-[#00BFA6]/5 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6] mb-3">
            Miksi sopii
          </p>
          <p className={`text-base leading-relaxed ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{job.whyFit}</p>
        </div>
      )}

      {daysLeft !== null && (
        <div
          className={`mt-6 rounded-3xl border p-6 text-base font-bold ${
            daysLeft < 0
              ? (theme === 'dark' ? "border-red-900/50 bg-red-950/30 text-red-300" : "border-red-200 bg-red-50 text-red-700")
              : daysLeft <= 7
              ? "border-[#FF6F3C]/50 bg-[#FF6F3C]/10 text-[#FF6F3C]"
              : (theme === 'dark' ? "border-white/10 bg-white/5 text-gray-300" : "border-gray-200 bg-gray-50 text-gray-700")
          }`}
        >
          {daysLeft < 0
            ? `Deadline meni ${Math.abs(daysLeft)} päivää sitten`
            : daysLeft === 0
            ? "Deadline on tänään!"
            : `Deadline ${daysLeft} päivän päästä`}
        </div>
      )}

      {showJobDetails && (
      <>
      <div className={`mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 pt-8 border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
        <div>
          <label htmlFor={`status-${job.id}`} className={LabelClass(theme)}>Status</label>
          <select
            id={`status-${job.id}`}
            value={job.status}
            onChange={(e) => onUpdate({ status: e.target.value as JobStatus })}
            className={InputClass(theme)}
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
          <label htmlFor={`priority-${job.id}`} className={LabelClass(theme)}>Prioriteetti</label>
          <select
            id={`priority-${job.id}`}
            value={job.priority}
            onChange={(e) =>
              onUpdate({ priority: e.target.value as JobPriority })
            }
            className={InputClass(theme)}
          >
            <option value="low">Matala</option>
            <option value="medium">Keskitaso</option>
            <option value="high">Korkea</option>
          </select>
        </div>

        <div>
          <label htmlFor={`appliedAt-${job.id}`} className={LabelClass(theme)}>Hakupäivä</label>
          <input
            id={`appliedAt-${job.id}`}
            type="date"
            value={job.appliedAt || ""}
            onChange={(e) => onUpdate({ appliedAt: e.target.value })}
            className={InputClass(theme)}
          />
        </div>

        <div>
          <label htmlFor={`deadline-${job.id}`} className={LabelClass(theme)}>Deadline</label>
          <input
            id={`deadline-${job.id}`}
            type="date"
            value={job.deadline || ""}
            onChange={(e) => onUpdate({ deadline: e.target.value })}
            className={InputClass(theme)}
          />
        </div>

        <div>
          <label htmlFor={`salary-${job.id}`} className={LabelClass(theme)}>Palkka</label>
          <input
            id={`salary-${job.id}`}
            value={job.salary || ""}
            onChange={(e) => onUpdate({ salary: e.target.value })}
            placeholder="Esim. 2800–3200 €/kk"
            className={InputClass(theme)}
          />
        </div>

        <div>
          <label htmlFor={`contactPerson-${job.id}`} className={LabelClass(theme)}>Yhteyshenkilö</label>
          <input
            id={`contactPerson-${job.id}`}
            value={job.contactPerson || ""}
            onChange={(e) => onUpdate({ contactPerson: e.target.value })}
            placeholder="Esim. Rekrytoija"
            className={InputClass(theme)}
          />
        </div>

        <div>
          <label htmlFor={`contactEmail-${job.id}`} className={LabelClass(theme)}>Sähköposti</label>
          <input
            id={`contactEmail-${job.id}`}
            value={job.contactEmail || ""}
            onChange={(e) => onUpdate({ contactEmail: e.target.value })}
            placeholder="esim. rekry@firma.fi"
            className={InputClass(theme)}
          />
        </div>

        <div>
          <label htmlFor={`companyWebsite-${job.id}`} className={LabelClass(theme)}>Yrityksen sivu</label>
          <input
            id={`companyWebsite-${job.id}`}
            value={job.companyWebsite || ""}
            onChange={(e) => onUpdate({ companyWebsite: e.target.value })}
            placeholder="https://..."
            className={InputClass(theme)}
          />
        </div>
      </div>

      <div className="mt-8">
        <label htmlFor={`notes-${job.id}`} className={LabelClass(theme)}>Muistiinpanot</label>
        <textarea
          id={`notes-${job.id}`}
          value={job.notes || ""}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Kirjaa tähän mitä pitää tehdä seuraavaksi, yhteydenotot, fiilikset jne."
          className={TextareaClass("min-h-[160px]", theme)}
        />
      </div>
      </>
      )}

      {job.url && (
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className="mt-10 flex w-full justify-center rounded-2xl border border-[#00BFA6]/30 bg-[#00BFA6]/10 px-8 py-6 text-base sm:text-lg font-black text-[#00BFA6] transition hover:bg-[#00BFA6] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
        >
          {originalLabel.toUpperCase()} ?
        </a>
      )}
    </article>
  );
}

// --- PÄÄKOMPONENTTI ---
export default function Home() {
  const router = useRouter();
  
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [showMoreCvFields, setShowMoreCvFields] = useState(false);
  const [showMoreSearchFields, setShowMoreSearchFields] = useState(false);
  const [showManualJobForm, setShowManualJobForm] = useState(false);
  const [showJobFilters, setShowJobFilters] = useState(false);
  const [showCvAnalysis, setShowCvAnalysis] = useState(false);
  const [showStyleStudio, setShowStyleStudio] = useState(false);
  const [showLetterHistory, setShowLetterHistory] = useState(false);
  const [showLetterExtras, setShowLetterExtras] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  
  const [isPro, setIsPro] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const [mode, setMode] = useState<"improve" | "create">("improve");
  const [tab, setTab] = useState<Tab>("cv");
  const [letterViewMode, setLetterViewMode] = useState<"edit" | "preview">("edit");
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
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
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
  
  // TINDER LOGIIKKA - LISÄTTY TILA TÄHÄN
  const [currentJobIndex, setCurrentJobIndex] = useState(0);

  const [savedLetters, setSavedLetters] = useState<SavedLetter[]>([]);
  const [savedCvVariants, setSavedCvVariants] = useState<SavedCvVariant[]>([]);
  const [customStyles, setCustomStyles] = useState<Record<CvStyleVariant, CvCustomStyle>>(defaultCustomStyles);
  const [savedStylePresets, setSavedStylePresets] = useState<SavedStylePreset[]>([]);
  const [savedLetterTonePresets, setSavedLetterTonePresets] = useState<SavedLetterTonePreset[]>(starterLetterTonePresets);

  const pdfRef = useRef<HTMLDivElement | null>(null);

  const [sparringJob, setSparringJob] = useState<JobItem | null>(null);
  const [sparringMessage, setSparringMessage] = useState("");
  const [sparringChat, setSparringChat] = useState<{role: "ai" | "user", text: string}[]>([]);
  const [isSparringTyping, setIsSparringTyping] = useState(false);
  
  const [salaryJob, setSalaryJob] = useState<JobItem | null>(null);
  const [teleprompterJob, setTeleprompterJob] = useState<JobItem | null>(null);
  const [showSkillTranslator, setShowSkillTranslator] = useState(false);
  const [emailTemplateModal, setEmailTemplateModal] = useState<{type: string, content: string} | null>(null);
  
  const [atsJob, setAtsJob] = useState<JobItem | null>(null);
  const [atsResult, setAtsResult] = useState<{match: number, missing: string[], found: string[]} | null>(null);
  const [isAtsScanning, setIsAtsScanning] = useState(false);

  const [prepJob, setPrepJob] = useState<JobItem | null>(null);
  const [prepQuestions, setPrepQuestions] = useState<{q: string, tip: string}[]>([]);
  const [isPrepping, setIsPrepping] = useState(false);

  const [skillInput, setSkillInput] = useState("");
  const [skillOutput, setSkillOutput] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null); 
  const jobsSearchCacheRef = useRef<{
    key: string;
    timestamp: number;
    jobs: JobItem[];
  } | null>(null);
  const [lastJobsSearchMeta, setLastJobsSearchMeta] = useState<{
    searchedAt: string;
    sourceSummary: string;
    resultCount: number;
    sources?: string[];
    wasCached?: boolean;
  } | null>(null);

  const customStyle = customStyles[cvStyle];

  useEffect(() => {
    async function bootstrapStudio() {
      const session = await getValidSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      setHasSession(true);
      setIsAuthChecking(false);

      let localDraftUpdatedAt = 0;

      try {
        const stored = localStorage.getItem(getStudioStorageKey(session.user.id));
        if (stored) {
          const draft = JSON.parse(stored) as Partial<StudioDraftState>;
          localDraftUpdatedAt = getTimestampMs(draft.updatedAt);
          if (draft.mode) setMode(draft.mode);
          if (draft.tab) setTab(draft.tab);
          if (draft.letterViewMode) setLetterViewMode(draft.letterViewMode);
          if (draft.cvStyle) setCvStyle(draft.cvStyle);
          if (draft.letterTone) setLetterTone(draft.letterTone);
          if (draft.theme) setTheme(draft.theme);
          if (draft.form) setForm((prev) => ({ ...prev, ...draft.form }));
          if (draft.searchProfile) {
            setSearchProfile((prev) => ({ ...prev, ...draft.searchProfile }));
          }
          if (draft.jobForm) setJobForm((prev) => ({ ...prev, ...draft.jobForm }));
          if (draft.jobs?.length) {
            setJobs(draft.jobs.map((job) => normalizeJob(job)));
          }
          if (draft.savedLetters?.length) setSavedLetters(draft.savedLetters);
          if (draft.savedCvVariants?.length) setSavedCvVariants(draft.savedCvVariants);
          if (draft.cvResult) setCvResult(draft.cvResult);
          if (draft.letterResult) setLetterResult(draft.letterResult);
          if (draft.letterDraft) setLetterDraft(draft.letterDraft);
          if (draft.profileImage) setProfileImage(draft.profileImage);
          if (draft.jobFilter) setJobFilter(draft.jobFilter);
          if (draft.jobStatusFilter) setJobStatusFilter(draft.jobStatusFilter);
          if (draft.jobPriorityFilter) setJobPriorityFilter(draft.jobPriorityFilter);
          if (draft.jobSort) setJobSort(draft.jobSort);
          if (typeof draft.showFavoritesOnly === "boolean") {
            setShowFavoritesOnly(draft.showFavoritesOnly);
          }
          if (draft.activeJobId) setActiveJobId(draft.activeJobId);
          if (typeof draft.currentJobIndex === "number") {
            setCurrentJobIndex(draft.currentJobIndex);
          }
          if (draft.customStyles) setCustomStyles(draft.customStyles);
          if (draft.savedStylePresets?.length) {
            setSavedStylePresets(draft.savedStylePresets);
          }
          if (draft.savedLetterTonePresets?.length) {
            setSavedLetterTonePresets(draft.savedLetterTonePresets);
          }
        }
      } catch (error) {
        console.error("Paikallisen studiotilan palautus epäonnistui", error);
      }

      async function loadDataFromDb() {
        const headers = await getSupabaseHeaders();
        const userId = session!.user.id;

        try {
          const pRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, { headers });
          if (pRes.status === 401 || pRes.status === 403) {
            clearSession();
            router.replace("/login");
            return;
          }

          const pData = await pRes.json();
          if (pData && pData.length > 0) {
            const p = pData[0];
            setIsPro(p.is_pro || false);
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
              projects: p.projects || "",
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
              tone: safeLetterTone(l.tone),
              createdAt: l.created_at,
              updatedAt: l.updated_at || l.created_at,
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

          const sRes = await fetch(
            `${supabaseUrl}/rest/v1/studio_state?user_id=eq.${userId}&select=state,updated_at&limit=1`,
            { headers },
          );
          const sData = await sRes.json();
          if (Array.isArray(sData) && sData[0]?.state) {
            const state = sData[0].state as Partial<StudioCloudState>;
            const cloudUpdatedAt = Math.max(
              getTimestampMs(state.updatedAt),
              getTimestampMs(sData[0].updated_at),
            );

            if (cloudUpdatedAt > localDraftUpdatedAt) {
              if (state.searchProfile) {
                setSearchProfile((prev) => ({ ...prev, ...state.searchProfile }));
              }
              if (state.jobForm) {
                setJobForm((prev) => ({ ...prev, ...state.jobForm }));
              }
              if (state.theme) setTheme(state.theme);
              if (state.cvStyle) setCvStyle(state.cvStyle);
              if (state.letterTone) setLetterTone(state.letterTone);
              if (state.customStyles) setCustomStyles(state.customStyles);
              if (state.savedStylePresets?.length) {
                setSavedStylePresets(state.savedStylePresets);
              }
              if (state.savedLetterTonePresets?.length) {
                setSavedLetterTonePresets(state.savedLetterTonePresets);
              }
              if (typeof state.cvResult === "string") setCvResult(state.cvResult);
              if (typeof state.letterResult === "string") setLetterResult(state.letterResult);
              if (typeof state.letterDraft === "string") setLetterDraft(state.letterDraft);
              if (typeof state.activeJobId === "string") setActiveJobId(state.activeJobId);
              if (typeof state.currentJobIndex === "number") {
                setCurrentJobIndex(state.currentJobIndex);
              }
              if (state.tab) setTab(state.tab);
              if (typeof state.jobFilter === "string") setJobFilter(state.jobFilter);
              if (state.jobStatusFilter) setJobStatusFilter(state.jobStatusFilter);
              if (state.jobPriorityFilter) setJobPriorityFilter(state.jobPriorityFilter);
              if (state.jobSort) setJobSort(state.jobSort);
              if (typeof state.showFavoritesOnly === "boolean") {
                setShowFavoritesOnly(state.showFavoritesOnly);
              }
            }
          }
        } catch (err) {
          console.error("Virhe tietojen latauksessa:", err);
        }
      }

      loadDataFromDb();
    }

    bootstrapStudio();
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobileViewport(w < 768);
      setPreviewScale(w < 640 ? Math.min(1, (w - 40) / 794) : 1);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isAuthChecking || !hasSession) return;
    setSaveState("saving");
    const timeout = setTimeout(async () => {
      try {
        const session = await getValidSession();
        if (!session) return;
        await fetch(`${supabaseUrl}/rest/v1/profiles`, {
          method: "POST",
          headers: { ...(await getSupabaseHeaders()), "Prefer": "resolution=merge-duplicates" },
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
            projects: form.projects,
            profile_image_url: profileImage
          })
        });
        setSaveState("saved");
      } catch (e) {
        console.error("Profiilin tallennus epäonnistui", e);
        setSaveState("error");
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [form, profileImage, isAuthChecking, hasSession]);

  useEffect(() => {
    if (isAuthChecking || !hasSession) return;
    const session = getSession();
    if (!session) return;
    setSaveState("saving");
    const draft: StudioDraftState = {
      updatedAt: new Date().toISOString(),
      mode,
      tab,
      letterViewMode,
      cvStyle,
      letterTone,
      theme,
      form,
      searchProfile,
      jobForm,
      jobs,
      savedLetters,
      savedCvVariants,
      cvResult,
      letterResult,
      letterDraft,
      profileImage,
      jobFilter,
      jobStatusFilter,
      jobPriorityFilter,
      jobSort,
      showFavoritesOnly,
      activeJobId,
      currentJobIndex,
      customStyles,
      savedStylePresets,
      savedLetterTonePresets,
    };

    try {
      localStorage.setItem(
        getStudioStorageKey(session.user.id),
        JSON.stringify(draft),
      );
    } catch (error) {
      console.error("Paikallisen studiotilan tallennus epäonnistui", error);
      setSaveState("error");
    }
  }, [
    activeJobId,
    currentJobIndex,
    customStyles,
    cvResult,
    cvStyle,
    form,
    hasSession,
    isAuthChecking,
    jobFilter,
    jobForm,
    jobPriorityFilter,
    jobSort,
    jobStatusFilter,
    jobs,
    letterDraft,
    letterResult,
    letterTone,
    letterViewMode,
    mode,
    profileImage,
    savedCvVariants,
    savedLetters,
    savedStylePresets,
    savedLetterTonePresets,
    searchProfile,
    showFavoritesOnly,
    tab,
    theme,
  ]);

  useEffect(() => {
    if (isAuthChecking || !hasSession) return;
    const session = getSession();
    if (!session) return;
    setSaveState("saving");

    const cloudState: StudioCloudState = {
      updatedAt: new Date().toISOString(),
      searchProfile,
      jobForm,
      theme,
      cvStyle,
      letterTone,
      customStyles,
      savedStylePresets,
      savedLetterTonePresets,
      cvResult,
      letterResult,
      letterDraft,
      activeJobId,
      currentJobIndex,
      tab,
      jobFilter,
      jobStatusFilter,
      jobPriorityFilter,
      jobSort,
      showFavoritesOnly,
    };

    const timeout = setTimeout(async () => {
      try {
        const session = await getValidSession();
        if (!session) return;
        await fetch(`${supabaseUrl}/rest/v1/studio_state`, {
          method: "POST",
          headers: {
            ...(await getSupabaseHeaders()),
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            user_id: session.user.id,
            state: {
              ...cloudState,
              updatedAt: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          }),
        });
        setSaveState("saved");
      } catch (error) {
        console.error("Studion pilvitilan tallennus epäonnistui", error);
        setSaveState("error");
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [
    activeJobId,
    customStyles,
    currentJobIndex,
    cvResult,
    cvStyle,
    hasSession,
    isAuthChecking,
    jobFilter,
    jobForm,
    jobPriorityFilter,
    jobSort,
    jobStatusFilter,
    letterDraft,
    letterResult,
    letterTone,
    savedStylePresets,
    savedLetterTonePresets,
    searchProfile,
    showFavoritesOnly,
    tab,
    theme,
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sparringChat, isSparringTyping]);

  const parsedCv = useMemo(() => parseCvResult(cvResult), [cvResult]);
  const parsedLetter = useMemo(
    () => parseCoverLetter(letterResult),
    [letterResult]
  );

  const activeJobLetters = useMemo(() => {
    if (!activeJobId) return [];
    return savedLetters
      .filter((letter) => letter.jobId === activeJobId)
      .sort((a, b) =>
        (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt),
      );
  }, [savedLetters, activeJobId]);

  const activeJobCvVariants = useMemo(() => {
    if (!activeJobId) return [];
    return savedCvVariants.filter((cv) => cv.jobId === activeJobId);
  }, [savedCvVariants, activeJobId]);

  const sortedSavedLetters = useMemo(
    () =>
      [...savedLetters].sort((a, b) =>
        (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt),
      ),
    [savedLetters],
  );

  const sortedSavedCvVariants = useMemo(
    () => [...savedCvVariants].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [savedCvVariants],
  );

  const archiveJobs = useMemo(
    () =>
      [...jobs].sort((a, b) => {
        if ((b.favorite ? 1 : 0) !== (a.favorite ? 1 : 0)) {
          return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
        }
        return b.id.localeCompare(a.id);
      }),
    [jobs],
  );

  const latestSavedLetter = useMemo(
    () =>
      sortedSavedLetters[0] || null,
    [sortedSavedLetters],
  );

  const latestSavedCvVariant = useMemo(
    () =>
      sortedSavedCvVariants[0] || null,
    [sortedSavedCvVariants],
  );

  const latestTouchedJob = useMemo(() => {
    if (!archiveJobs.length) return null;
    return archiveJobs[0];
  }, [archiveJobs]);

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

  // Varmistetaan, että aktiivinen työpaikka päivittyy, kun swipe tapahtuu
  const activeJob = useMemo(() => {
    return filteredJobs[currentJobIndex] || null;
  }, [filteredJobs, currentJobIndex]);

  const cvEditorText = parsedCv.cvBody || "";
  const cvEditorLineCount = cvEditorText
    ? cvEditorText.split("\n").filter((line) => line.trim().length > 0).length
    : 0;
  const cvEditorCharCount = cvEditorText.length;
  const profileCompletion =
    Math.round(
      ([form.name, form.email, form.phone, form.location, form.targetJob, form.education || form.experience]
        .filter((value) => value.trim().length > 0).length / 6) *
        100,
    ) || 0;
  const searchCompletion =
    Math.round(
      ([searchProfile.desiredRoles, searchProfile.desiredLocation, searchProfile.workType]
        .filter((value) => value.trim().length > 0).length / 3) *
        100,
    ) || 0;
  const workspaceTabLabel =
    tab === "cv"
      ? "CV-työtila"
      : tab === "jobs"
        ? "Työpaikkaseuranta"
        : tab === "hakemus"
          ? "Hakemusstudio"
          : "Vinkkipankki";
  const workspaceSummary =
    tab === "cv"
      ? cvResult
        ? "CV on muokattavissa ja esikatselu pysyy rinnalla mukana."
        : "Kun generoit CV:n, muokkaus ja esikatselu aukeavat tähän rauhallisesti."
      : tab === "jobs"
        ? filteredJobs.length > 0
          ? "Suodata, vertaile ja tallenna parhaat paikat ilman että kaikki näkyy kerralla."
          : "Työpaikkakortit ilmestyvät tähän heti, kun hakuprofiili on valmis."
        : tab === "hakemus"
          ? letterResult
            ? "Muokkaa hakemusta tekstinä tai vaihda visuaaliseen esikatseluun."
            : "Hakemusnäkymä pysyy siistinä, kunnes olet valinnut työpaikan."
          : "Tärkeimmät työnhaun opit löytyvät yhdestä paikasta ilman ylimääräistä sälää.";
  const nextStepId = !cvResult
    ? "hakijan-tiedot"
    : filteredJobs.length === 0
      ? "tyonhaku"
      : "studio-tulokset";
  const nextStepTitle = !cvResult
    ? "Täytä ydinprofiili ja generoi CV"
    : filteredJobs.length === 0
      ? "Tarkenna työnhaku ja hae paikkoja"
      : activeJob
        ? `Jatka työpaikan "${activeJob.title || "valittu paikka"}" kanssa`
        : "Avaa työtila ja jatka valituista korteista";
  const nextStepDescription = !cvResult
    ? "Aloita vain nimellä, sähköpostilla, tavoitteella ja kokemuksella. Muut kentät voi täydentää myöhemmin."
    : filteredJobs.length === 0
      ? "Kun kerrot roolit, alueen ja työajan, studio hakee sinulle sopivimmat paikat valmiiksi."
      : activeJob
        ? "CV, työpaikka ja hakemus löytyvät nyt samasta työtilasta ilman ylimääräistä pomppimista."
        : "Oikea puoli on nyt tärkein alue. Siellä muokkaat, vertailet ja viimeistelet.";

  useEffect(() => {
    if (filteredJobs.length === 0 && currentJobIndex !== 0) {
      setCurrentJobIndex(0);
      return;
    }

    if (currentJobIndex > filteredJobs.length - 1) {
      setCurrentJobIndex(Math.max(filteredJobs.length - 1, 0));
    }
  }, [currentJobIndex, filteredJobs.length]);

  // Päivitetään aktiivisen työpaikan ID aina, kun kortti vaihtuu
  useEffect(() => {
    if (activeJob) {
      setActiveJobId(activeJob.id);
    }
  }, [activeJob]);


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

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function focusJobInStudio(job: JobItem) {
    if (job.archived) {
      updateJob(job.id, { archived: false });
    }
    setTab("jobs");
    setJobFilter(job.title || job.company || "");
    setJobStatusFilter("all");
    setJobPriorityFilter("all");
    setShowFavoritesOnly(false);
    setCurrentJobIndex(0);
    setActiveJobId(job.id);
    setShowArchive(false);
  }

  function openSavedCvVariant(cv: SavedCvVariant) {
    const relatedJob = jobs.find((job) => job.id === cv.jobId);
    if (relatedJob) {
      if (relatedJob.archived) {
        updateJob(relatedJob.id, { archived: false });
      }
      setJobFilter(relatedJob.title || cv.jobTitle);
      setJobStatusFilter("all");
      setJobPriorityFilter("all");
      setShowFavoritesOnly(false);
      setCurrentJobIndex(0);
      setActiveJobId(relatedJob.id);
    }
    setCvResult(`CV_BODY:\n${cv.content}`);
    setTab("cv");
    setShowArchive(false);
  }

  function openSavedLetter(letter: SavedLetter) {
    const relatedJob = jobs.find((job) => job.id === letter.jobId);
    if (relatedJob) {
      if (relatedJob.archived) {
        updateJob(relatedJob.id, { archived: false });
      }
      setJobFilter(relatedJob.title || letter.jobTitle);
      setJobStatusFilter("all");
      setJobPriorityFilter("all");
      setShowFavoritesOnly(false);
      setCurrentJobIndex(0);
      setActiveJobId(relatedJob.id);
    }
    setLetterResult(`HAKEMUS:\n${letter.content}`);
    setLetterDraft(letter.content);
    setLetterTone(safeLetterTone(letter.tone));
    setTab("hakemus");
    setShowArchive(false);
  }

  function updateCvBody(value: string) {
    const prefix = cvResult.split("CV_BODY:")[0] || "";
    setCvResult(prefix + "CV_BODY:\n" + value);
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
    if (patch.summary !== undefined) dbPatch.summary = patch.summary;
    if (patch.adText !== undefined) dbPatch.ad_text = patch.adText;
    if (patch.url !== undefined) dbPatch.url = patch.url;
    if (patch.whyFit !== undefined) dbPatch.why_fit = patch.whyFit;
    if (patch.source !== undefined) dbPatch.source = patch.source;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.priority !== undefined) dbPatch.priority = patch.priority;
    if (patch.favorite !== undefined) dbPatch.favorite = patch.favorite;
    if (patch.salary !== undefined) dbPatch.salary = patch.salary;
    if (patch.deadline !== undefined) dbPatch.deadline = patch.deadline || null;
    if (patch.appliedAt !== undefined) dbPatch.applied_at = patch.appliedAt || null;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes;
    if (patch.contactPerson !== undefined) dbPatch.contact_person = patch.contactPerson;
    if (patch.contactEmail !== undefined) dbPatch.contact_email = patch.contactEmail;
    if (patch.companyWebsite !== undefined) dbPatch.company_website = patch.companyWebsite;
    if (patch.archived !== undefined) dbPatch.archived = patch.archived;

    void getValidSession().then((validSession) => {
      if (!validSession) return;
      void getSupabaseHeaders().then((headers) => {
        fetch(`${supabaseUrl}/rest/v1/jobs?id=eq.${id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(dbPatch)
        });
      });
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

  function applyStylePreset(preset: SavedStylePreset) {
    setCvStyle(preset.styleVariant);
    setCustomStyles((prev) => ({
      ...prev,
      [preset.styleVariant]: {
        ...preset.customStyle,
      },
    }));
    setMessage(`Tyyli "${preset.name}" otettu käyttöön.`);
    setTimeout(() => setMessage(""), 2500);
  }

  function saveCurrentStylePreset() {
    const name = typeof window !== "undefined"
      ? window.prompt("Anna tyylille nimi", `${form.targetJob || "Oma"} tyyli`)
      : null;

    if (!name) return;

    const trimmedName = name.trim();
    if (!trimmedName) return;

    const preset: SavedStylePreset = {
      id: makeId(),
      name: trimmedName,
      styleVariant: cvStyle,
      customStyle: { ...customStyle },
      createdAt: new Date().toISOString(),
    };

    setSavedStylePresets((prev) => [preset, ...prev.filter((item) => item.name !== trimmedName)].slice(0, 8));
    setMessage(`Tyyli "${trimmedName}" tallennettu omaan kokoelmaan.`);
    setTimeout(() => setMessage(""), 2500);
  }

  function saveCurrentLetterTonePreset() {
    const name = typeof window !== "undefined"
      ? window.prompt("Anna sävylle nimi", `${getLetterToneLabel(letterTone)} suosikki`)
      : null;

    if (!name) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const preset: SavedLetterTonePreset = {
      id: makeId(),
      name: trimmedName,
      tone: letterTone,
      createdAt: new Date().toISOString(),
    };

    setSavedLetterTonePresets((prev) => [preset, ...prev.filter((item) => item.name !== trimmedName)].slice(0, 8));
    setMessage(`Hakemuksen sävy "${trimmedName}" tallennettu.`);
    setTimeout(() => setMessage(""), 2500);
  }

  function applyLetterTonePreset(preset: SavedLetterTonePreset) {
    setLetterTone(preset.tone);
    setMessage(`Hakemuksen sävy "${preset.name}" otettu käyttöön.`);
    setTimeout(() => setMessage(""), 2500);
  }

  function removeLetterTonePreset(id: string) {
    setSavedLetterTonePresets((prev) => prev.filter((preset) => preset.id !== id));
    setMessage("Tallennettu sävy poistettu.");
    setTimeout(() => setMessage(""), 2500);
  }

  function removeSavedStylePreset(id: string) {
    setSavedStylePresets((prev) => prev.filter((preset) => preset.id !== id));
    setMessage("Tallennettu tyyli poistettu.");
    setTimeout(() => setMessage(""), 2500);
  }

  function applyLetterDraftPreset(mode: "tighten" | "polish" | "bolder" | "warmer") {
    const source = (letterDraft || parsedLetter).trim();
    if (!source) {
      setErrorMessage("Luo tai kirjoita hakemus ensin, jotta voin muokata sitä.");
      setTimeout(() => setErrorMessage(""), 2500);
      return;
    }

    let nextDraft = source
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    if (mode === "tighten") {
      nextDraft = nextDraft
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/\b(erityisesti|todella|hyvin|varsin)\b/gi, "").replace(/\s{2,}/g, " ").trim())
        .join("\n\n");
      setMessage("Hakemusta tiivistettiin.");
    } else if (mode === "polish") {
      nextDraft = nextDraft
        .replace(/\bmä\b/gi, "minä")
        .replace(/\boon\b/gi, "olen")
        .replace(/\bhaluun\b/gi, "haluan")
        .replace(/\btekisin mielelläni\b/gi, "toivon mahdollisuutta")
        .replace(/\s{2,}/g, " ")
        .trim();
      setMessage("Hakemuksesta tehtiin asiallisempi.");
    } else if (mode === "bolder") {
      nextDraft = nextDraft.replace(
        /^/i,
        "Tuon tehtävään käytännön näyttöä, oma-aloitteisuutta ja halun saada tuloksia aikaan.\n\n",
      );
      setLetterTone("sales");
      setMessage("Hakemuksesta tehtiin rohkeampi.");
    } else {
      nextDraft = nextDraft.replace(
        /^/i,
        "Minulle on tärkeää tehdä työ huolellisesti, yhteistyössä ja aidosti hyvää asiakaskokemusta rakentaen.\n\n",
      );
      setLetterTone("warm");
      setMessage("Hakemuksesta tehtiin lämpimämpi.");
    }

    setLetterDraft(nextDraft);
    setLetterResult(`HAKEMUS:\n${nextDraft}`);
    setTimeout(() => setMessage(""), 2500);
  }

  function applyQuickStyleMood(mode: "professional" | "modern" | "compact") {
    if (mode === "professional") {
      updateCustomStyle("fontFamily", "editorial");
      updateCustomStyle("headingStyle", "simple");
      updateCustomStyle("headingTransform", "uppercase");
      updateCustomStyle("borderRadius", 10);
      updateCustomStyle("shadowStyle", "none");
      updateCustomStyle("itemSpacing", 14);
      updateCustomStyle("pattern", "none");
      updateCustomStyle("sidebarPattern", "none");
      setMessage("CV-tyyli rauhoitettiin ammattimaisemmaksi.");
    } else if (mode === "modern") {
      updateCustomStyle("fontFamily", "modern");
      updateCustomStyle("headingStyle", "underline");
      updateCustomStyle("shadowStyle", "soft");
      updateCustomStyle("pattern", "halftone");
      updateCustomStyle("patternOpacity", 4);
      updateCustomStyle("sidebarPattern", "chevrons");
      updateCustomStyle("sidebarPatternOpacity", 6);
      updateCustomStyle("imageShape", "rounded");
      setMessage("CV-tyyli päivitettiin modernimmaksi.");
    } else {
      updateCustomStyle("bodySize", Math.max(12, (customStyle.bodySize || 14) - 1));
      updateCustomStyle("lineHeight", Math.max(1.35, Number(((customStyle.lineHeight || 1.6) - 0.1).toFixed(2))));
      updateCustomStyle("sectionSpacing", Math.max(18, (customStyle.sectionSpacing || 28) - 6));
      updateCustomStyle("itemSpacing", Math.max(8, (customStyle.itemSpacing || 14) - 3));
      updateCustomStyle("pagePadding", Math.max(28, (customStyle.pagePadding || 48) - 6));
      setMessage("CV-tyyli tiivistettiin yhdelle sivulle sopivammaksi.");
    }

    setTimeout(() => setMessage(""), 2500);
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
    setCurrentJobIndex(0); 
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
    setShowMoreCvFields(false);
    setShowMoreSearchFields(false);
    setShowManualJobForm(false);
    setShowJobFilters(false);
    setShowCvAnalysis(false);
    setShowStyleStudio(false);
    setShowLetterHistory(false);
    setShowLetterExtras(false);
    const session = getSession();
    if (session) {
      localStorage.removeItem(getStudioStorageKey(session.user.id));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
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
      projects: "Yrityksen X Verkkosivutupäivitys | 2020\n- Johdin tiimiä, joka uudisti koko verkkopalvelun ja kasvatti liidimäärää 40%.\n\nOma verkkokauppa (Sivuprojekti) | 2019-2021\n- Perustin ja pyöritin menestyksekästä verkkokauppaa, jossa vastasin koko prosessista hankinnasta asiakaspalveluun.",
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

  const downloadPdf = async (elementId: string = "cv-preview", isLetter: boolean = false) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;

    const originalScrollY = window.scrollY;
    const originalScrollX = window.scrollX;
    window.scrollTo(0, 0);

    try {
      setDownloadingPdf(true);
      setMessage("Luodaan PDF-tiedostoa... (Tämä voi kestää sekunnin)");
      setErrorMessage("");

      const originalRadius = printContent.style.borderRadius;
      const originalShadow = printContent.style.boxShadow;
      printContent.style.borderRadius = "0px";
      printContent.style.boxShadow = "none";

      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: customStyle.mainBg,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
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
            } catch (e) {}
          }
          const originalStyles = clonedDoc.querySelectorAll("style, link[rel='stylesheet']");
          originalStyles.forEach(el => el.remove());
          const newStyle = clonedDoc.createElement("style");
          newStyle.innerHTML = safeCss;
          clonedDoc.head.appendChild(newStyle);

          const previewEl = clonedDoc.getElementById(elementId);
          if (previewEl) {
            previewEl.style.borderRadius = "0px";
            previewEl.style.boxShadow = "none";
            previewEl.style.width = "800px";
            previewEl.style.margin = "0";
            previewEl.style.position = "fixed";
            previewEl.style.top = "0";
            previewEl.style.left = "0";

            previewEl.style.height = "auto";
            previewEl.style.minHeight = "0px";
            
            const a4HeightPx = 800 * (297 / 210); 
            const contentHeight = previewEl.scrollHeight; 
            
            let totalPages = Math.ceil((contentHeight - 20) / a4HeightPx);
            if (totalPages < 1) totalPages = 1;

            previewEl.style.minHeight = `${totalPages * a4HeightPx}px`;
          }
        },
      });

      printContent.style.borderRadius = originalRadius;
      printContent.style.boxShadow = originalShadow;

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.setFillColor(customStyle.mainBg);
      pdf.rect(0, 0, pdfWidth, pageHeight, "F");
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 1) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.setFillColor(customStyle.mainBg);
        pdf.rect(0, 0, pdfWidth, pageHeight, "F");
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`duuniharava-${isLetter ? 'hakemus' : 'cv'}-${cvStyle}.pdf`);
      void trackUsageEvent("pdf_downloaded", {
        kind: isLetter ? "letter" : "cv",
        style: cvStyle,
      });
      
      setMessage("PDF ladattu onnistuneesti koneellesi!");
      setTimeout(() => setMessage(""), 3500);

    } catch (error) {
      console.error(error);
      setErrorMessage("Virhe PDF-luonnissa. Yritä ladata sivu uudelleen.");
    } finally {
      setDownloadingPdf(false);
      window.scrollTo(originalScrollX, originalScrollY);
    }
  };
  async function downloadDocx(textToDownload: string, isLetter: boolean = false) {
    try {
      if (!textToDownload) {
        setErrorMessage("Ei ladattavaa tekstiä.");
        return;
      }

      setDownloadingDocx(true);
      setMessage("");
      setErrorMessage("");

      const lines = textToDownload
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: lines.map((line, index) => {
              const isMainTitle = index === 0 && !isLetter;
              const isSectionTitle = !isLetter && (
                line === line.toUpperCase() ||
                [
                  "Profiili",
                  "Työkokemus",
                  "Koulutus",
                  "Kielitaito",
                  "Taidot",
                  "Kortit ja pätevyydet",
                  "Harrastukset",
                  "Projektit",
                  "Portfolio"
                ].includes(line)
              );

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
      saveAs(blob, `duuniharava-${isLetter ? 'hakemus' : 'cv'}.docx`);
      void trackUsageEvent("docx_downloaded", {
        kind: isLetter ? "letter" : "cv",
        style: cvStyle,
      });
      setMessage("DOCX ladattu.");
      setTimeout(() => setMessage(""), 2500);
    } catch (error) {
      console.error(error);
      setErrorMessage("DOCX:n luonti epäonnistui.");
    } finally {
      setDownloadingDocx(false);
    }
  }

  async function handleLogout() {
    const session = getSession();
    if (typeof window !== "undefined") {
      clearStudioLocalState(session?.user.id);
      sessionStorage.clear(); 
    }
    
    window.location.href = "/";
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
    setCurrentJobIndex(0); 
    setJobForm(emptyJobForm);
    setMessage("Työpaikka lisätty listaan.");
    setTab("jobs");
    setTimeout(() => setMessage(""), 2500);
    void trackUsageEvent("job_saved_manual", {
      hasCompany: Boolean(job.company),
      hasUrl: Boolean(job.url),
    });

    void getValidSession().then((session) => {
      if (!session) return;
      void getSupabaseHeaders().then((headers) => {
        fetch(`${supabaseUrl}/rest/v1/jobs`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            id: job.id, user_id: session.user.id, title: job.title, company: job.company, location: job.location,
            type: job.type, summary: job.summary, ad_text: job.adText, url: job.url, why_fit: job.whyFit,
            source: job.source, match_score: job.matchScore, status: job.status, priority: job.priority,
            salary: job.salary, applied_at: job.appliedAt || null, deadline: job.deadline || null, notes: job.notes,
            contact_person: job.contactPerson, contact_email: job.contactEmail, company_website: job.companyWebsite,
            favorite: job.favorite, archived: job.archived
          })
        });
      });
    });
  }

  function removeJob(id: string) {
    const filtered = jobs.filter((job) => job.id !== id);
    setJobs(filtered);

    if (filtered.length === 0) {
      setCurrentJobIndex(0);
      setActiveJobId("");
    } else if (currentJobIndex >= filtered.length) {
      setCurrentJobIndex(filtered.length - 1);
      setActiveJobId(filtered[filtered.length - 1].id);
    } else {
      setActiveJobId(filtered[currentJobIndex].id);
    }

    setSavedLetters((prev) => prev.filter((letter) => letter.jobId !== id));
    setSavedCvVariants((prev) => prev.filter((cv) => cv.jobId !== id));

    void getValidSession().then((session) => {
      if (!session) return;
      void getSupabaseHeaders().then((headers) => {
        fetch(`${supabaseUrl}/rest/v1/jobs?id=eq.${id}`, { method: "DELETE", headers });
      });
    });
  }

  async function suggestJobs() {
    setLoadingJobs(true);
    setMessage("");
    setErrorMessage("");

    try {
      const searchPayload = {
        ...searchProfile,
        targetJob: form.targetJob,
        experience: form.experience,
        skills: form.skills,
        languages: form.languages,
        onlyActive: true,
        currentDate: new Date().toLocaleDateString("fi-FI"),
        sources: ["Duunitori", "Oikotie", "LinkedIn", "Työmarkkinatori"],
        strictFreshness: true,
        instructions:
          "Hae vain oikeasti NYT avoinna olevia, aitoja työpaikkoja useista lähteistä. Älä keksi ilmoituksia äläkä palauta vanhoja (esim. vuodelta 2024 tai 2025).",
      };
      const searchKey = JSON.stringify({
        targetJob: searchPayload.targetJob,
        desiredRoles: searchPayload.desiredRoles,
        desiredLocation: searchPayload.desiredLocation,
        keywords: searchPayload.keywords,
        workType: searchPayload.workType,
      });
      const cachedSearch = jobsSearchCacheRef.current;

      if (
        cachedSearch &&
        cachedSearch.key === searchKey &&
        Date.now() - cachedSearch.timestamp < 1000 * 60 * 15
      ) {
        setLastJobsSearchMeta({
          searchedAt: new Date(cachedSearch.timestamp).toISOString(),
          sourceSummary: "Äskeinen haku muistista",
          resultCount: cachedSearch.jobs.length,
          sources: Array.from(
            new Set(
              cachedSearch.jobs
                .map((job) => job.source)
                .filter(Boolean),
            ),
          ) as string[],
          wasCached: true,
        });
        setTab("jobs");
        setMessage("Sama haku tehtiin juuri. Ohitetaan uusi verkkohaku ja säästetään käyttöä.");
        setTimeout(() => setMessage(""), 2500);
        void trackUsageEvent("jobs_search_reused", {
          resultCount: cachedSearch.jobs.length,
          sources: Array.from(
            new Set(cachedSearch.jobs.map((job) => job.source).filter(Boolean)),
          ),
        });
        return;
      }

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchPayload),
      });

      const data = await res.json();
      const parsed = safeJsonParseJobs(data.output || "[]");

      if (!res.ok || !parsed.length) {
        console.warn("Jobs search diagnostics", data?.diagnostics);
        setErrorMessage(formatJobsSearchFailure(data));
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

      jobsSearchCacheRef.current = {
        key: searchKey,
        timestamp: Date.now(),
        jobs: newJobs,
      };
      setLastJobsSearchMeta({
        searchedAt: new Date().toISOString(),
        sourceSummary: `Työmarkkinatori ${data.diagnostics?.tyomarkkinatoriCount ?? 0} · Google ${data.diagnostics?.googleCount ?? 0}`,
        resultCount: newJobs.length,
        sources: Array.from(
          new Set(newJobs.map((job) => job.source).filter(Boolean)),
        ) as string[],
        wasCached: false,
      });

      setJobs((prev) => [...newJobs, ...prev]);
      setCurrentJobIndex(0); 
      if (newJobs[0]) {
        setActiveJobId(newJobs[0].id);
      }
    setTab("jobs");
    setMessage("Työpaikkaehdotukset lisätty.");
      void trackUsageEvent("jobs_search_completed", {
        resultCount: newJobs.length,
        sources: Array.from(new Set(newJobs.map((job) => job.source).filter(Boolean))),
        cached: false,
      });

      const session = await getValidSession();
      if(session) {
        const headers = await getSupabaseHeaders();
        newJobs.forEach(job => {
          fetch(`${supabaseUrl}/rest/v1/jobs`, {
            method: "POST", headers,
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

  // --- TINDER-NAPPIEN LOGIIKKA ---
  const handleSkipJob = () => {
    if (currentJobIndex < filteredJobs.length - 1) {
      setCurrentJobIndex(prev => prev + 1);
    } else {
      setMessage("Kävit kaikki suodatetut työpaikat läpi!");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleSaveJob = (jobId: string) => {
    updateJob(jobId, { favorite: true });
    setMessage("Paikka tallennettu suosikkeihin! ??");
    setTimeout(() => setMessage(""), 2000);
    const savedJob = jobs.find((job) => job.id === jobId);
    void trackUsageEvent("job_favorited", {
      source: savedJob?.source || null,
      title: savedJob?.title || null,
    });
    
    if (currentJobIndex < filteredJobs.length - 1) {
      setCurrentJobIndex(prev => prev + 1);
    }
  };


  async function createTailoredCv() {
    if (!isPro) {
      setShowPaywall(true);
      return;
    }

    if (!activeJob) {
      setErrorMessage("Valitse työpaikka ennen kohdistetun CV:n luontia.");
      return;
    }

    const currentCv = parsedCv.cvBody;
    if (!currentCv) {
      setErrorMessage("Generoi ensin normaali CV.");
      return;
    }

    const session = getSession();
    if (!session) {
      setErrorMessage("Kirjaudu sisään jatkaaksesi.");
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
          userId: session.user.id,
          currentCv,
          jobTitle: activeJob.title,
          companyName: activeJob.company,
          jobAd: activeJob.adText,
        }),
      });

      const data = await res.json();

      if (res.status === 403 && data.error === "LIMIT_REACHED") {
        setShowPaywall(true);
        setLoadingTailoredCv(false);
        return;
      }

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
      void trackUsageEvent("tailored_cv_generated", {
        source: activeJob.source || null,
        company: activeJob.company || null,
      });

      if(session) {
        fetch(`${supabaseUrl}/rest/v1/cv_variants`, {
          method: "POST", headers: await getSupabaseHeaders(),
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

    const session = getSession();
    if (!session) {
      setErrorMessage("Kirjaudu sisään jatkaaksesi.");
      return;
    }

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
          userId: session.user.id,
          ...form,
        }),
      });

      const data = await res.json();

      if (res.status === 403 && data.error === "LIMIT_REACHED") {
        setShowPaywall(true);
        setLoadingCv(false);
        return;
      }

      const output = data.output || data.error || "Jokin meni pieleen.";
      setCvResult(output);
      setTab("cv");
      void trackUsageEvent("cv_generated", {
        mode,
        hasUploadedCv: Boolean(form.cvFileName),
        style: cvStyle,
      });
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

    const session = getSession();
    if (!session) {
      setErrorMessage("Sinun täytyy kirjautua sisään jatkaaksesi.");
      return;
    }

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
          userId: session.user.id,
        }),
      });

      const data = await res.json();

      if (res.status === 403 && data.error === "LIMIT_REACHED") {
        setShowPaywall(true);
        setLoadingLetter(false);
        return;
      }

      const output = data.output || data.error || "Jokin meni pieleen.";
      const parsed = parseCoverLetter(output);
      const savedAt = new Date().toISOString();

      setLetterResult(output);
      setLetterDraft(parsed);

      const savedLetter: SavedLetter = {
        id: makeId(),
        jobId: activeJob.id,
        jobTitle: activeJob.title,
        companyName: activeJob.company,
        content: parsed,
        tone: letterTone,
        createdAt: savedAt,
        updatedAt: savedAt,
      };

      setSavedLetters((prev) => [savedLetter, ...prev]);
      setTab("hakemus");
      setLetterViewMode("edit");
      setMessage("Hakemus luotu — muokkaa ja lataa se alta.");
      setTimeout(() => setMessage(""), 2500);
      void trackUsageEvent("cover_letter_generated", {
        tone: letterTone,
        source: activeJob.source || null,
        company: activeJob.company || null,
      });

      if(session) {
        fetch(`${supabaseUrl}/rest/v1/saved_letters`, {
          method: "POST", headers: await getSupabaseHeaders(),
          body: JSON.stringify({
            id: savedLetter.id,
            user_id: session.user.id,
            job_id: savedLetter.jobId,
            job_title: savedLetter.jobTitle,
            company_name: savedLetter.companyName,
            content: savedLetter.content,
            tone: savedLetter.tone,
            updated_at: savedLetter.updatedAt,
          })
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
    const savedAt = new Date().toISOString();

    const savedLetter: SavedLetter = {
      id: makeId(),
      jobId: activeJob.id,
      jobTitle: activeJob.title,
      companyName: activeJob.company,
      content: letterDraft.trim(),
      tone: letterTone,
      createdAt: savedAt,
      updatedAt: savedAt,
    };

    setSavedLetters((prev) => [savedLetter, ...prev]);
    setLetterResult(`HAKEMUS:\n${letterDraft.trim()}`);
    setMessage("Muokattu hakemus tallennettu.");
    setTimeout(() => setMessage(""), 2500);
    void trackUsageEvent("cover_letter_saved_edit", {
      tone: letterTone,
      source: activeJob.source || null,
    });

    void getValidSession().then((session) => {
      if (!session) return;
      void getSupabaseHeaders().then((headers) => {
        fetch(`${supabaseUrl}/rest/v1/saved_letters`, {
          method: "POST", headers,
          body: JSON.stringify({
            id: savedLetter.id,
            user_id: session.user.id,
            job_id: savedLetter.jobId,
            job_title: savedLetter.jobTitle,
            company_name: savedLetter.companyName,
            content: savedLetter.content,
            tone: savedLetter.tone,
            updated_at: savedLetter.updatedAt,
          })
        });
      });
    });
  }

  function startSparring(job: JobItem) {
    if (!isPro) {
      setShowPaywall(true);
      return;
    }
    setSparringJob(job);
    setSparringChat([
      { role: "ai", text: `Hei! Olen tekoälyrekrytoija yrityksestä ${job.company || "täältä"}. Huomasin, että haet meiltä tehtävää "${job.title}". Kertoisitko alkuun hieman itsestäsi ja miksi juuri tämä paikka kiinnostaa sinua?` }
    ]);
  }

  async function sendSparringMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!sparringMessage.trim()) return;

    const newChat = [...sparringChat, { role: "user" as const, text: sparringMessage }];
    setSparringChat(newChat);
    setSparringMessage("");
    setIsSparringTyping(true);

    try {
      const session = getSession();
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "sparring",
          userId: session?.user?.id,
          data: {
            jobTitle: sparringJob?.title ?? "",
            company: sparringJob?.company ?? "",
            chatHistory: sparringChat,
            userMessage: sparringMessage,
          },
        }),
      });
      const data = await res.json();
      setSparringChat([...newChat, { role: "ai", text: data.output || "Jokin meni pieleen, yritä uudelleen." }]);
    } catch {
      setSparringChat([...newChat, { role: "ai", text: "Yhteysvirhe — tarkista internetyhteys ja yritä uudelleen." }]);
    } finally {
      setIsSparringTyping(false);
    }
  }

  async function translateSkills() {
    if (!skillInput.trim()) return;
    setIsTranslating(true);
    setErrorMessage("");

    try {
      const session = getSession();
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "skill-translator",
          userId: session?.user?.id,
          data: { skillInput },
        }),
      });
      const data = await res.json();
      setSkillOutput(data.output || "Tekoäly ei palauttanut tulosta.");
    } catch {
      setErrorMessage("Yhteysvirhe — yritä uudelleen.");
    } finally {
      setIsTranslating(false);
    }
  }

  async function runAtsScan(job: JobItem) {
    if (!parsedCv.cvBody) {
      setErrorMessage("Generoi ensin CV, jotta voimme vertailla sitä ilmoitukseen.");
      return;
    }

    setAtsJob(job);
    setIsAtsScanning(true);
    setAtsResult(null);

    try {
      const session = getSession();
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "ats-scan",
          userId: session?.user?.id,
          data: { cvText: parsedCv.cvBody, jobAd: job.adText },
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse(data.output || "{}");
      setAtsResult({
        match: typeof parsed.match === "number" ? parsed.match : 0,
        found: Array.isArray(parsed.found) ? parsed.found : [],
        missing: Array.isArray(parsed.missing) ? parsed.missing : [],
      });
    } catch {
      setErrorMessage("ATS-skannaus epäonnistui — yritä uudelleen.");
    } finally {
      setIsAtsScanning(false);
    }
  }

  async function generateInterviewPrep(job: JobItem) {
    if (!isPro) {
      setShowPaywall(true);
      return;
    }

    setPrepJob(job);
    setIsPrepping(true);
    setPrepQuestions([]);

    try {
      const session = getSession();
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "interview-prep",
          userId: session?.user?.id,
          data: { jobTitle: job.title, company: job.company, jobAd: job.adText },
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse(data.output || "[]");
      setPrepQuestions(Array.isArray(parsed) ? parsed : []);
    } catch {
      setErrorMessage("Haastattelukysymysten generointi epäonnistui — yritä uudelleen.");
    } finally {
      setIsPrepping(false);
    }
  }


  async function handleUpgradeToPro() {
    const session = getSession();
    if (!session || !session.user.email) {
        setErrorMessage("Kirjaudu sisään päivittääksesi Pro-tasolle.");
        return;
    }
    
    try {
      setMessage("Ohjataan suojattuun maksuun...");
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: session.user.id,
          userEmail: session.user.email
        }),
      });
      
      const data = await res.json();
      console.log("Stripe Checkout vastaus:", data); 
      
      if (data.url) {
        window.location.href = data.url; 
      } else {
        setErrorMessage("Stripe virhe: " + (data.error || "Maksuikkunan avaus epäonnistui."));
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage("Virhe yhteydessä maksupalveluun: " + error.message);
    }
  }

    async function handlePortal() {
      const session = getSession();
      if (!session?.user?.email) return;
      try {
        setMessage("Avataan tilausasetuksia...");
        const res = await fetch("/api/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userEmail: session.user.email }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setErrorMessage(data.error || "Hallintaportaalia ei voitu avata.");
        }
      } catch (err) {
        setErrorMessage("Yhteysvirhe tilausasetuksiin.");
      }
    }

    async function handleDeleteAccount() {
      const session = getSession();
      if (!session?.user?.id || !session?.user?.email) return;

      const confirm1 = confirm("VAROITUS: Kaikki tietosi ja Pro-tilauksesi poistetaan välittömästi. Tätä ei voi peruuttaa.");
      if (!confirm1) return;

      const confirm2 = prompt("Kirjoita 'POISTA' vahvistaaksesi poiston.");
      if (confirm2 !== "POISTA") return;

      try {
        setMessage("Poistetaan tiliä ja peruutetaan tilausta...");
        const res = await fetch("/api/delete-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: session.user.id,
            userEmail: session.user.email 
          }),
        });

        if (res.ok) {
          if (typeof window !== "undefined") {
            clearStudioLocalState(getSession()?.user.id);
          }
          alert("Tili poistettu onnistuneesti. Toivottavasti nähdään pian uudestaan!");
          window.location.href = "/"; 
        } else {
          const errorData = await res.json();
          alert(errorData.error || "Poisto epäonnistui. Ota yhteys tukeen.");
        }
    } catch (err) {
      alert("Yhteysvirhe poiston aikana.");
    }
  }

  function openArchiveModal() {
    setShowArchive(true);
    void trackUsageEvent("archive_opened", { currentTab: tab });
  }

  return (
    <div className={theme === 'light' ? 'light-theme' : ''}>
      <style dangerouslySetInnerHTML={{__html: `
        .light-theme .bg-\\[\\#0F0F0F\\] { background-color: #F9FAFB !important; }
        .light-theme .bg-\\[\\#141414\\] { background-color: #FFFFFF !important; }
        .light-theme .bg-\\[\\#0A0A0A\\] { background-color: #F3F4F6 !important; }
        .light-theme .bg-black\\/50 { background-color: #FFFFFF !important; border: 1px solid #E5E7EB !important; }
        .light-theme .bg-black\\/40 { background-color: #FFFFFF !important; border: 1px solid #E5E7EB !important; }
        .light-theme .bg-white\\/5 { background-color: #F3F4F6 !important; border: 1px solid #E5E7EB !important; color: #111827 !important; }
        .light-theme .bg-white\\/\\[0\\.02\\] { background-color: #F9FAFB !important; border: 1px solid #E5E7EB !important; }
        .light-theme .bg-white\\/\\[0\\.03\\] { background-color: #F3F4F6 !important; border: 1px solid #E5E7EB !important; }
        .light-theme .bg-zinc-900\\/90 { background-color: rgba(255, 255, 255, 0.95) !important; border-color: #E5E7EB !important; }
        
        .light-theme .text-white { color: #111827 !important; }
        .light-theme .text-gray-200 { color: #374151 !important; }
        .light-theme .text-gray-300 { color: #4B5563 !important; }
        .light-theme .text-gray-400 { color: #6B7280 !important; }
        .light-theme .text-gray-500 { color: #9CA3AF !important; }
        
        .light-theme .border-white\\/10 { border-color: #E5E7EB !important; }
        .light-theme .border-white\\/5 { border-color: #F3F4F6 !important; }
        
        .light-theme .from-zinc-900\\/50 { --tw-gradient-from: #F3F4F6 !important; }
        .light-theme .bg-black\\/80 { background-color: rgba(255, 255, 255, 0.8) !important; }
        
        /* Poikkeukset nappeihin, joissa pitää säilyttää värit */
        .light-theme .bg-\\[\\#FF6F3C\\] { color: #ffffff !important; }
      `}} />
      <main className="min-h-screen bg-[#0F0F0F] text-white overflow-x-hidden font-sans pb-56 sm:pb-20 transition-colors duration-300">
        
    {/* MOBIILIN PIKANAVIGOINTI (5 NAPPIA) */}
<nav className={`fixed bottom-3 left-3 right-3 z-50 flex justify-around items-stretch gap-2 rounded-[28px] border p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_18px_50px_rgba(0,0,0,0.35)] sm:hidden backdrop-blur-2xl transition-colors ${theme === 'dark' ? 'bg-[#0A0A0A]/92 border-white/10' : 'bg-white/92 border-gray-200 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'}`} aria-label="Mobiilin pikavalikko">
  
  {/* 1. TIEDOT */}
  <a href="#hakijan-tiedot" className={`flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-bold transition-all ${theme === 'dark' ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}>
    <span className="text-xl" aria-hidden="true">??</span> Tiedot
  </a>

  {/* 2. HAKU */}
  <a href="#tyonhaku" className={`flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-bold transition-all ${theme === 'dark' ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}>
    <span className="text-xl" aria-hidden="true">??</span> Haku
  </a>

  {/* 3. TULOKSET */}
  <a href="#studio-tulokset" className={`flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-[#00BFA6]/12 px-2 text-[10px] font-bold text-[#00BFA6]`}>
    <span className="text-xl" aria-hidden="true">?</span> Tulokset
  </a>

  {/* 4. TYÖKALUT (Mobiilissa) */}
  <button 
    onClick={() => router.push('/tyokalut')} 
    className={`flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-bold transition-all ${theme === 'dark' ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'} focus-visible:outline-none`}
  >
    <span className="text-xl" aria-hidden="true">???</span> Työkalut
  </button>

  {/* 5. TALLENTEET */}
  <button 
    onClick={openArchiveModal} 
    className={`flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-black transition-all ${theme === 'dark' ? 'text-[#00BFA6] hover:bg-white/5' : 'text-[#00BFA6] hover:bg-gray-100'} focus-visible:outline-none`}
  >
    <span className="text-xl" aria-hidden="true">???</span> Tallenteet
  </button>

  {/* 6. PRO (Pysyy aina tässä) */}
  <button 
    onClick={() => setShowPaywall(true)} 
    className="flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-[#FF6F3C]/12 text-[10px] font-black text-[#FF6F3C] transition-all hover:bg-[#FF6F3C]/18 focus-visible:outline-none"
  >
    <span className="text-xl" aria-hidden="true">?</span> PRO
  </button>
</nav>

        {/* HEADER (Tietokone) */}
        <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors ${theme === 'dark' ? 'bg-[#0F0F0F]/80 border-white/10' : 'bg-white/80 border-gray-200'}`}>
          <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 xl:px-10 2xl:px-14 py-4 sm:py-5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="font-black text-2xl tracking-tighter"><span className="text-[#00BFA6]">DUUNI</span><span className="text-[#FF6F3C]">HARAVA</span></span>
              
              {/* UUSI: Näyttää Pro-tagin, jos käyttäjä on maksanut */}
              {isPro ? (
                <span className="hidden sm:inline-block px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-[10px] font-black tracking-widest uppercase rounded-full shadow-[0_0_15px_rgba(250,204,21,0.4)]">
                  Pro Jäsen
                </span>
              ) : (
                <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden sm:block">Studio</div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:w-auto">
              
              {/* UUSI: PRO-nappi työpöydälle */}
              {!isPro && (
                <button 
                  onClick={() => setShowPaywall(true)} 
                  className="hidden md:flex bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] text-black px-6 py-2 rounded-xl text-sm font-black hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,191,166,0.3)]"
                >
                  ? PÄIVITÄ PRO
                </button>
              )}

              <button
                onClick={openArchiveModal}
                className="rounded-2xl border border-white/10 px-4 py-2 text-xs sm:text-sm font-black text-[#00BFA6] hover:bg-[#00BFA6]/10 hover:text-[#7af4e2] transition-all whitespace-nowrap focus-visible:outline-none"
              >
                ??? TALLENTEET
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="rounded-2xl border border-white/10 px-4 py-2 text-xs sm:text-sm font-black text-gray-400 hover:bg-white/5 hover:text-white transition-all whitespace-nowrap focus-visible:outline-none"
              >
                ?? ASETUKSET
              </button>

              <button
                onClick={() => router.push('/tyokalut')}
                className="hidden sm:inline-block rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs sm:text-sm font-black text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 transition-all whitespace-nowrap focus-visible:outline-none"
              >
                ??? TYÖKALUPAKKI
              </button>

              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="rounded-2xl border border-white/10 px-4 py-2 text-xs sm:text-sm font-black text-gray-400 hover:bg-white/5 hover:text-white transition-all whitespace-nowrap focus-visible:outline-none"
                aria-label={theme === 'light' ? 'Vaihda tummaan teemaan' : 'Vaihda vaaleaan teemaan'}
              >
                {theme === 'light' ? '?? TUMMA' : '?? VAALEA'}
              </button>
            </div>
          </div>
        </nav>

        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-zinc-900/50 to-transparent" aria-labelledby="hero-heading">
          <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,191,166,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,111,60,0.1),transparent_30%)] ${theme === 'light' ? 'opacity-50' : ''}`} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_35%,rgba(0,0,0,0.3))]" />
          
          <div className="relative mx-auto w-full max-w-[1920px] px-4 sm:px-8 xl:px-10 2xl:px-14 py-16 sm:py-20 lg:py-24">
            
            <div className="grid gap-10 sm:gap-14 lg:items-center">
              <div>
                <h1 id="hero-heading" className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.98] mb-6 sm:mb-8">
                  Tee työhausta <span className="text-[#00BFA6]">helppoa.</span>
                </h1>

                <p className={`mb-6 max-w-3xl text-base sm:text-lg leading-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Rakenna CV, etsi sopivat työpaikat ja tee hakemukset samassa paikassa ilman turhaa sähläystä.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                  <button
                    type="button"
                    onClick={() => setShowHelp(!showHelp)}
                    className="bg-[#00BFA6]/10 border border-[#00BFA6]/40 text-[#00BFA6] px-7 sm:px-10 py-4 sm:py-5 rounded-[24px] text-base sm:text-lg font-black hover:bg-[#00BFA6]/20 transition-all shadow-xl flex items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
                    aria-expanded={showHelp}
                    aria-controls="help-section"
                  >
                    <span className="text-2xl" aria-hidden="true">??</span> {showHelp ? "Piilota ohjeet" : "Näytä selkeät käyttöohjeet"}
                  </button>

                  <button
                    type="button"
                    onClick={fillExample}
                    className="bg-white text-black px-7 sm:px-10 py-4 sm:py-5 rounded-[24px] text-base sm:text-lg font-black hover:bg-gray-200 transition-all shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
                  >
                    Täytä esimerkki
                  </button>

                  <button
                    type="button"
                    onClick={openArchiveModal}
                    className={`px-7 sm:px-10 py-4 sm:py-5 rounded-[24px] text-base sm:text-lg font-black transition-all shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50'}`}
                  >
                    Avaa tallenteet
                  </button>
                </div>

                <div className={`mt-8 sm:mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3 lg:gap-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className={`rounded-[24px] border px-5 py-5 text-sm leading-7 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/70'}`}>
                    1. Täytä tärkeimmät tiedot
                  </div>
                  <div className={`rounded-[24px] border px-5 py-5 text-sm leading-7 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/70'}`}>
                    2. Muokkaa CV:tä omassa työtilassa
                  </div>
                  <div className={`rounded-[24px] border px-5 py-5 text-sm leading-7 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/70'}`}>
                    3. Avaa työkalut vasta kun tarvitset niitä
                  </div>
                </div>

                {(latestSavedCvVariant || latestSavedLetter || latestTouchedJob) && (
                  <div className={`mt-8 rounded-[28px] border p-4 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200 bg-white/80'}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00BFA6]">
                          Jatka nopeasti
                        </p>
                        <h3 className={`mt-2 text-xl sm:text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Viimeisimmät tallenteet löytyvät heti tästä
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={openArchiveModal}
                        className={`rounded-2xl px-5 py-3 text-sm font-black transition-all ${theme === 'dark' ? 'border border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border border-gray-200 bg-gray-50 text-gray-800 hover:bg-white'}`}
                      >
                        Avaa koko tallennekeskus
                      </button>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
                      {latestSavedCvVariant && (
                        <button
                          type="button"
                          onClick={() => openSavedCvVariant(latestSavedCvVariant)}
                          className={`rounded-2xl border px-4 sm:px-5 py-4 sm:py-5 text-left transition-all hover:-translate-y-1 hover:border-[#00BFA6]/50 ${theme === 'dark' ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-gray-50'}`}
                        >
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">Viimeisin CV</p>
                          <p className={`mt-3 text-base sm:text-lg font-black truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{latestSavedCvVariant.jobTitle}</p>
                          <p className={`mt-1 text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{latestSavedCvVariant.companyName}</p>
                          <p className={`mt-3 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{new Date(latestSavedCvVariant.createdAt).toLocaleString("fi-FI")}</p>
                        </button>
                      )}

                      {latestSavedLetter && (
                        <button
                          type="button"
                          onClick={() => openSavedLetter(latestSavedLetter)}
                          className={`rounded-2xl border px-4 sm:px-5 py-4 sm:py-5 text-left transition-all hover:-translate-y-1 hover:border-[#00BFA6]/50 ${theme === 'dark' ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-gray-50'}`}
                        >
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">Viimeisin hakemus</p>
                          <p className={`mt-3 text-base sm:text-lg font-black truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{latestSavedLetter.jobTitle}</p>
                          <p className={`mt-1 text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{latestSavedLetter.companyName}</p>
                          <p className={`mt-3 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{new Date(latestSavedLetter.updatedAt || latestSavedLetter.createdAt).toLocaleString("fi-FI")}</p>
                        </button>
                      )}

                      {latestTouchedJob && (
                        <button
                          type="button"
                          onClick={() => focusJobInStudio(latestTouchedJob)}
                          className={`rounded-2xl border px-4 sm:px-5 py-4 sm:py-5 text-left transition-all hover:-translate-y-1 hover:border-[#00BFA6]/50 ${theme === 'dark' ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-gray-50'}`}
                        >
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">Viimeisin työpaikka</p>
                          <p className={`mt-3 text-base sm:text-lg font-black truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{latestTouchedJob.title || "Nimetön työpaikka"}</p>
                          <p className={`mt-1 text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{[latestTouchedJob.company, latestTouchedJob.location].filter(Boolean).join(" · ")}</p>
                          <p className={`mt-3 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{getStatusLabel(latestTouchedJob.status)} · {getPriorityLabel(latestTouchedJob.priority)}</p>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* --- OHJE-OSIO --- */}
        {showHelp && (
          <section id="help-section" className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 xl:px-10 2xl:px-14 mt-12 animate-in fade-in slide-in-from-top-6" aria-labelledby="help-heading">
            <div className="rounded-[40px] border-2 border-[#00BFA6]/30 bg-zinc-900/90 p-10 sm:p-16 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-6">
                <h2 id="help-heading" className="text-3xl sm:text-4xl font-black text-white tracking-tight">Näin käytät Duuniharavaa</h2>
                <button onClick={() => setShowHelp(false)} aria-label="Sulje ohjeet" className="text-gray-400 hover:text-white font-bold p-2 text-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]">? Sulje</button>
              </div>
              
              <div className="space-y-10 text-gray-300 text-lg leading-relaxed">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#00BFA6] text-black font-black flex items-center justify-center text-3xl" aria-hidden="true">1</div>
                  <div className="mt-2">
                    <strong className="text-white block text-2xl mb-3">Täytä omat tietosi</strong>
                    Aloita alempaa laatikosta nimeltä "Vaihe 1: Hakijan tiedot". Kirjoita nimesi, työkokemuksesi ja koulutuksesi. Voit myös vain valita ja ladata tietokoneeltasi vanhan CV:n PDF-muodossa, niin tekoäly lukee sen puolestasi.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#00BFA6] text-black font-black flex items-center justify-center text-3xl" aria-hidden="true">2</div>
                  <div className="mt-2">
                    <strong className="text-white block text-2xl mb-3">Paina "Generoi CV"</strong>
                    Rullaa Vaihe 1 -laatikon loppuun ja paina vihreää nappia. Tekoäly muotoilee sinulle uuden, hienon CV:n. Näet esikatselun sivun oikeassa laidassa (tai mobiilissa alhaalla). Voit ladata sen suoraan koneellesi PDF-napista.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#FF6F3C] text-black font-black flex items-center justify-center text-3xl" aria-hidden="true">3</div>
                  <div className="mt-2">
                    <strong className="text-white block text-2xl mb-3">Etsi työpaikkoja</strong>
                    Siirry "Vaihe 2: Hakuprofiili" -laatikkoon. Kerro siellä, millaista työtä etsit (esim. "Myyjä, Uusimaa"). Paina "Ehdota työpaikkoja" -nappia, jolloin ohjelma etsii sinulle sopivia, voimassa olevia avoimia tehtäviä ja tuo ne näkyviin.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#FF6F3C] text-black font-black flex items-center justify-center text-3xl" aria-hidden="true">4</div>
                  <div className="mt-2">
                    <strong className="text-white block text-2xl mb-3">Tee hakemus napin painalluksella</strong>
                    Sivun oikeassa reunassa (tai mobiilissa alempana) on välilehdet: "CV", "Työpaikat" ja "Hakemukset". Valitse listalta kiinnostava työpaikka ja pyydä tekoälyä kirjoittamaan siihen valmis, räätälöity työhakemus yhdellä klikkauksella.
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-10 border-t border-white/10 text-center sm:text-left">
                <button onClick={() => setShowHelp(false)} className="rounded-2xl bg-white px-10 py-5 text-lg font-black text-black transition-all hover:bg-gray-200 hover:scale-[1.02] shadow-[0_10px_30px_rgba(255,255,255,0.2)] w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]">
                  Selvä, ymmärsin! Aloitetaan!
                </button>
              </div>
            </div>
          </section>
        )}

        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-8 xl:px-10 2xl:px-14 py-16 sm:py-20 lg:py-24">
          <section className="mb-10 sm:mb-12 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.08fr)_repeat(3,minmax(0,0.78fr))] 2xl:gap-7">
            <div className={`relative overflow-hidden rounded-[36px] border p-7 sm:p-9 shadow-[0_28px_70px_rgba(0,0,0,0.18)] ${theme === 'dark' ? 'border-[#00BFA6]/20 bg-[linear-gradient(135deg,rgba(0,191,166,0.12),rgba(20,20,20,0.96))]' : 'border-[#00BFA6]/20 bg-[linear-gradient(135deg,rgba(0,191,166,0.08),rgba(255,255,255,0.98))]'}`}>
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#00BFA6]/10 blur-3xl" aria-hidden="true" />
              <p className="relative text-xs font-black uppercase tracking-[0.22em] text-[#00BFA6]">Aloita tästä</p>
              <h2 className={`relative mt-3 text-2xl sm:text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {nextStepTitle}
              </h2>
              <p className={`relative mt-3 max-w-2xl text-sm sm:text-base leading-7 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {nextStepDescription}
              </p>
              <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => scrollToSection(nextStepId)}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-black transition-all hover:scale-[1.02] sm:text-base"
                >
                  Siirry seuraavaan vaiheeseen
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("studio-tulokset")}
                  className={`rounded-2xl border px-5 py-4 text-sm font-black transition-all sm:text-base ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-white/80 text-gray-800 hover:bg-white'}`}
                >
                  Avaa työtila
                </button>
              </div>
            </div>

            <div className={`rounded-[34px] border p-7 shadow-xl ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-white/90'}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">Profiili</p>
              <p className={`mt-3 text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{profileCompletion}%</p>
              <p className={`mt-2 text-sm leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Ydintiedot mukana. Täydennä loput vasta kun CV-runko on kunnossa.
              </p>
            </div>

            <div className={`rounded-[34px] border p-7 shadow-xl ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-white/90'}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">Työnhaku</p>
              <p className={`mt-3 text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{filteredJobs.length}</p>
              <p className={`mt-2 text-sm leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Ehdotusta näkyvissä. Hakuprofiili on {searchCompletion}% valmis.
              </p>
            </div>

            <div className={`rounded-[34px] border p-7 shadow-xl ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-white/90'}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">Työtila nyt</p>
              <p className={`mt-3 text-2xl font-black leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{workspaceTabLabel}</p>
              <p className={`mt-2 text-sm leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {workspaceSummary}
              </p>
            </div>
          </section>

          <div className={`mb-12 rounded-[32px] border p-4 sm:p-6 shadow-xl ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-white/90'}`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between" role="group" aria-label="Valitse toiminto">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00BFA6]">Studio-asetus</p>
                <h2 className={`mt-2 text-xl sm:text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Valitse ensin tapa työskennellä, sitten etene omaan tahtiin
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[560px]">
                <button
                  type="button"
                  onClick={() => setMode("improve")}
                  aria-pressed={mode === "improve"}
                  className={`w-full rounded-2xl px-6 py-4 text-base font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
                    mode === "improve"
                      ? "bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] text-black shadow-[0_0_20px_rgba(0,191,166,0.3)]"
                      : theme === 'dark' ? "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1" : "border border-gray-200 bg-gray-50 text-gray-800 hover:bg-white hover:-translate-y-1"
                  }`}
                >
                  Paranna nykyinen CV
                </button>

                <button
                  type="button"
                  onClick={() => setMode("create")}
                  aria-pressed={mode === "create"}
                  className={`w-full rounded-2xl px-6 py-4 text-base font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
                    mode === "create"
                      ? "bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] text-black shadow-[0_0_20px_rgba(0,191,166,0.3)]"
                      : theme === 'dark' ? "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1" : "border border-gray-200 bg-gray-50 text-gray-800 hover:bg-white hover:-translate-y-1"
                  }`}
                >
                  Luo täysin uusi CV
                </button>
              </div>
            </div>

            <div className={`mt-6 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => scrollToSection("hakijan-tiedot")}
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${theme === 'dark' ? 'border border-white/10 bg-black/30 text-gray-300 hover:border-[#00BFA6]/40 hover:text-white' : 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-white'}`}
                >
                  Hakijan tiedot
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("tyonhaku")}
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${theme === 'dark' ? 'border border-white/10 bg-black/30 text-gray-300 hover:border-[#00BFA6]/40 hover:text-white' : 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-white'}`}
                >
                  Työnhaku
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("studio-tulokset")}
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${theme === 'dark' ? 'border border-white/10 bg-black/30 text-gray-300 hover:border-[#00BFA6]/40 hover:text-white' : 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-white'}`}
                >
                  Työtila
                </button>
              </div>

              <div className="text-sm font-medium text-gray-500" aria-live="polite">
                {saveState === "saving" && "Tallennetaan muutoksia automaattisesti..."}
                {saveState === "saved" && "Automaattisesti tallennettu · pilvitallennus aktiivinen ??"}
                {saveState === "error" && "Tallennuksessa oli häiriö. Yritetään uudelleen."}
                {saveState === "idle" && "Pilvitallennus aktiivinen (Supabase) ??"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-12 xl:grid-cols-[minmax(380px,0.82fr)_minmax(0,1.18fr)] 2xl:grid-cols-[minmax(420px,0.8fr)_minmax(0,1.2fr)]">
            <section className="space-y-10 sm:space-y-14">
              <SectionShell
                id="hakijan-tiedot"
                step="Vaihe 1"
                title="Hakijan tiedot"
                description="Täytä tietosi huolellisesti tai lataa vanha CV:si. Näitä käytetään pohjana kaikessa tekoälyn tekemässä työssä."
                theme={theme}
                defaultOpen
                action={
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={clearForm}
                      className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-gray-300 transition-all hover:bg-white/10 hover:border-red-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                    >
                      Tyhjennä
                    </button>
                  </div>
                }
              >
                <form onSubmit={handleCvSubmit} className="space-y-14 mt-10">
                  {mode === "improve" && (
                    <div>
                      <label htmlFor="cvFileUpload" className="mb-4 block text-sm font-bold text-gray-400">
                        Nykyinen CV (PDF)
                      </label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                        <label htmlFor="cvFileUpload" className="cursor-pointer rounded-2xl bg-white/[0.03] border border-white/10 px-8 py-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#00BFA6]/50 flex-1 sm:flex-none">
                          <span className="text-base font-bold text-white">
                            Lataa laitteelta PDF-tiedosto
                          </span>
                          <input
                            id="cvFileUpload"
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={handleCvFileUpload}
                          />
                        </label>
                        {form.cvFileName && (
                          <span className="text-base font-medium text-[#00BFA6] break-words px-2" aria-live="polite">
                            ? {form.cvFileName} valittu
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-y-8 sm:gap-y-10 lg:gap-x-10 lg:gap-y-12 lg:grid-cols-2 pt-6">
                    <div className="space-y-4">
                       <label htmlFor="input-name" className={LabelClass(theme)}>Koko nimi</label>
                       <input
                         id="input-name"
                         placeholder="Esim. Matti Meikäläinen"
                         value={form.name}
                         onChange={(e) => updateField("name", e.target.value)}
                         className={InputClass(theme)}
                       />
                    </div>
                    <div className="space-y-4">
                       <label htmlFor="input-phone" className={LabelClass(theme)}>Puhelin</label>
                       <input
                         id="input-phone"
                         placeholder="040 123 4567"
                         value={form.phone}
                         onChange={(e) => updateField("phone", e.target.value)}
                         className={InputClass(theme)}
                       />
                    </div>
                    <div className="space-y-4">
                       <label htmlFor="input-email" className={LabelClass(theme)}>Sähköposti</label>
                       <input
                         id="input-email"
                         placeholder="oma@email.com"
                         value={form.email}
                         onChange={(e) => updateField("email", e.target.value)}
                         className={InputClass(theme)}
                       />
                    </div>
                    <div className="space-y-4">
                       <label htmlFor="input-location" className={LabelClass(theme)}>Paikkakunta</label>
                       <input
                         id="input-location"
                         placeholder="Esim. Helsinki"
                         value={form.location}
                         onChange={(e) => updateField("location", e.target.value)}
                         className={InputClass(theme)}
                       />
                    </div>
                  </div>

                  <div className="pt-4 sm:pt-6">
                    <div className="flex justify-between items-end mb-3">
                      <label htmlFor="input-targetJob" className={LabelClass(theme)}>Tavoiteltu rooli / ammatti</label>
                    </div>
                    <input
                      id="input-targetJob"
                      placeholder="Mitä työtä haluat hakea? (esim. Myyntipäällikkö, Koodari)"
                      value={form.targetJob}
                      onChange={(e) => updateField("targetJob", e.target.value)}
                      className={InputClass(theme)}
                      aria-describedby="targetJob-hint"
                    />
                    <p id="targetJob-hint" className="mt-3 ml-1 inline-flex rounded-full border border-[#00BFA6]/30 bg-[#00BFA6]/8 px-3 py-1.5 text-[11px] font-bold text-[#00BFA6]">
                      Profiiliteksti rakentuu tämän perusteella
                    </p>
                    <FieldHint theme={theme}>
                      Kirjoita tähän se työ jota oikeasti tavoittelet juuri nyt. Tämä ohjaa sekä CV:n profiilitekstiä, työnhakua että hakemusten sävyä.
                    </FieldHint>
                  </div>

                  <div className="pt-4 sm:pt-6">
                    <label htmlFor="input-education" className={LabelClass(theme)}>Koulutus</label>
                    <textarea
                      id="input-education"
                      placeholder="Oppilaitos | Tutkinto | Valmistumisvuosi&#10;Esim. Helsingin Yliopisto | Kauppatieteiden maisteri | 2024"
                      value={form.education}
                      onChange={(e) => updateField("education", e.target.value)}
                      className={TextareaClass("min-h-[140px]", theme)}
                    />
                    <FieldHint theme={theme}>
                      Lisää uusin koulutus ensin. Jos koulutusta on vähän, myös kurssit, sertifikaatit ja lyhyemmät valmennukset kannattaa kirjoittaa tähän.
                    </FieldHint>
                  </div>

                  <div className="pt-4 sm:pt-6">
                    <label htmlFor="input-experience" className={LabelClass(theme)}>Työkokemus</label>
                    <textarea
                      id="input-experience"
                      placeholder="Työnantaja | Työtehtävä | 01/2020 - 05/2022 (tai 'Nykyinen')&#10;- Lyhyt kuvaus työtehtävistäsi...&#10;- Toinen kuvaus..."
                      value={form.experience}
                      onChange={(e) => updateField("experience", e.target.value)}
                      className={TextareaClass("min-h-[180px]", theme)}
                    />
                    <FieldHint theme={theme}>
                      Kirjoita tähän mitä teit, mitä vastasit ja mitä sait aikaan. Jos sinulla on numeroita, tuloksia tai vastuuta, ne kannattaa lisätä tänne näkyviin.
                    </FieldHint>
                  </div>

                  <div className={`rounded-[28px] border p-4 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'}`}>
                    <button
                      type="button"
                      onClick={() => setShowMoreCvFields((prev) => !prev)}
                      className={`flex w-full items-center justify-between rounded-2xl px-1 py-1 text-left text-sm sm:text-base font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                      aria-expanded={showMoreCvFields}
                    >
                      <span>Lisää tietoja CV:hen</span>
                      <span className="text-[#00BFA6]">{showMoreCvFields ? "Piilota" : "Avaa"}</span>
                    </button>
                    <p className={`mt-2 text-sm leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Projektit, kielet, taidot, kortit ja profiilikuva.
                    </p>

                    {showMoreCvFields && (
                      <div className="mt-6 space-y-8">
                        <div className="pt-1">
                          <label htmlFor="input-projects" className={LabelClass(theme)}>Projektit & Portfoliolinkit <span className="text-[#00BFA6] font-normal lowercase">(Vapaaehtoinen)</span></label>
                          <textarea
                            id="input-projects"
                            placeholder="Projektin nimi | Vuosi&#10;- Mitä teit ja mitä sait aikaan?&#10;- Linkki: https://..."
                            value={form.projects}
                            onChange={(e) => updateField("projects", e.target.value)}
                            className={TextareaClass("min-h-[140px]", theme)}
                          />
                          <FieldHint theme={theme}>
                            Tämä kohta auttaa erityisesti silloin, jos työkokemusta on vähemmän. Tänne sopivat myös omat projektit, portfoliojutut ja sivutyöt.
                          </FieldHint>
                        </div>

                        <div className="grid grid-cols-1 gap-y-8 sm:gap-y-10 lg:gap-x-10 lg:gap-y-12 lg:grid-cols-2">
                          <div className="space-y-4">
                            <div className="flex justify-between items-end mb-3">
                              <label htmlFor="input-languages" className={LabelClass(theme)}>Kielitaito</label>
                            </div>
                            <textarea
                              id="input-languages"
                              placeholder="Suomi (äidinkieli), Englanti (sujuva)..."
                              value={form.languages}
                              onChange={(e) => updateField("languages", e.target.value)}
                              className={TextareaClass("min-h-[140px]", theme)}
                            />
                            <FieldHint theme={theme}>
                              Kirjoita kieli ja taso mahdollisimman selkeästi, esimerkiksi sujuva, hyvä tai perusteet.
                            </FieldHint>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-end mb-3">
                              <label htmlFor="input-skills" className={LabelClass(theme)}>Osaaminen & Taidot</label>
                              <button 
                                type="button" 
                                onClick={() => setShowSkillTranslator(true)}
                                className="text-[#00BFA6] text-xs font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] rounded"
                              >
                                ? Käännä ammattikielelle
                              </button>
                            </div>
                            <textarea
                              id="input-skills"
                              placeholder="Mitä taitoja sinulla on? (esim. asiakaspalvelu)"
                              value={form.skills}
                              onChange={(e) => updateField("skills", e.target.value)}
                              className={TextareaClass("min-h-[140px]", theme)}
                            />
                            <FieldHint theme={theme}>
                              Kirjoita tähän sekä pehmeät että tekniset taidot. Jos et ole varma sanamuodoista, käytä vieressä olevaa ammattikielen kääntäjää.
                            </FieldHint>
                          </div>
                        </div>

                        <div className="pt-1">
                          <label htmlFor="input-cards" className={LabelClass(theme)}>Kortit & Pätevyydet</label>
                          <textarea
                            id="input-cards"
                            placeholder="Työturvallisuuskortti, B-ajokortti..."
                            value={form.cards}
                            onChange={(e) => updateField("cards", e.target.value)}
                            className={TextareaClass("min-h-[120px]", theme)}
                          />
                          <FieldHint theme={theme}>
                            Lisää tähän kaikki kortit, luvat ja pätevyydet jotka voivat auttaa työnhaussa. Esimerkiksi hygieniapassi, työturvallisuuskortti tai ajokortti.
                          </FieldHint>
                        </div>

                        <div className="pt-1">
                          <ProfileImageUpload image={profileImage} onChange={setProfileImage} />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loadingCv}
                    className="w-full bg-[#00BFA6] text-black font-black py-6 rounded-[24px] text-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-[0_15px_40px_-10px_rgba(0,191,166,0.6)] mt-8 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
                    aria-live="polite"
                  >
                    {loadingCv ? "Tekoäly rakentaa CV:tä..." : "1. GENEROI CV"}
                  </button>
                </form>
              </SectionShell>

              <SectionShell
                id="tyonhaku"
                step="Vaihe 2"
                title="Hakuprofiili & Työnhaku"
                description="Kerro tekoälylle, millaista työtä haluat. Se hakee voimassa olevat paikat puolestasi."
                theme={theme}
                defaultOpen={!isMobileViewport}
              >
                <div className="space-y-12 mt-12">
                  <div className={`rounded-[28px] border p-5 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'}`}>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">
                      Helppo tapa aloittaa
                    </p>
                    <p className={`mt-3 text-sm sm:text-base leading-7 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Täytä ensin vain kolme kohtaa: millaista työtä haet, miltä alueelta ja haluatko kokoaikaisen vai osa-aikaisen työn. Muut kentät ovat vain tarkennuksia.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <label htmlFor="search-roles" className={LabelClass(theme)}>Minkä alan töitä etsit?</label>
                    <textarea
                      id="search-roles"
                      placeholder="Esim. Myyntineuvottelija, Koodari, Siivooja..."
                      value={searchProfile.desiredRoles}
                      onChange={(e) =>
                        updateSearchProfile("desiredRoles", e.target.value)
                      }
                      className={TextareaClass("min-h-[140px]", theme)}
                    />
                    <FieldHint theme={theme}>
                      Kirjoita tähän ihan suoraan millaisia rooleja oikeasti haet. Voit kirjoittaa useita vaihtoehtoja, esimerkiksi myyjä, asiakaspalvelu, varasto tai frontend.
                    </FieldHint>
                  </div>
                  
                  <div className="space-y-4">
                     <label htmlFor="search-location" className={LabelClass(theme)}>Miltä alueelta?</label>
                     <input
                       id="search-location"
                       placeholder="Esim. Uusimaa, Etätyö"
                       value={searchProfile.desiredLocation}
                       onChange={(e) =>
                         updateSearchProfile("desiredLocation", e.target.value)
                       }
                       className={InputClass(theme)}
                     />
                     <FieldHint theme={theme}>
                       Voit kirjoittaa kaupungin, maakunnan tai vaikka etätyön. Tämä helpottaa sitä, että ehdotukset tuntuvat oikeilta eivätkä liian kaukaisilta.
                     </FieldHint>
                  </div>

                  <div className="grid grid-cols-1 gap-y-8 sm:gap-y-10 lg:gap-x-10 lg:gap-y-12 lg:grid-cols-2">
                    <div className="space-y-4">
                      <label htmlFor="search-workType" className={LabelClass(theme)}>Kokoaikainen vai Osa-aikainen?</label>
                      <input
                        id="search-workType"
                        placeholder="Esim. Kokoaikainen"
                        value={searchProfile.workType}
                        onChange={(e) =>
                          updateSearchProfile("workType", e.target.value)
                        }
                        className={InputClass(theme)}
                      />
                      <FieldHint theme={theme}>
                        Esimerkiksi kokoaikainen, osa-aikainen, keikkatyö tai harjoittelu.
                      </FieldHint>
                    </div>
                    <div className="space-y-4">
                      <label htmlFor="search-shiftPreference" className={LabelClass(theme)}>Vuorotoive</label>
                      <input
                        id="search-shiftPreference"
                        placeholder="Esim. Päivätyö"
                        value={searchProfile.shiftPreference}
                        onChange={(e) =>
                          updateSearchProfile("shiftPreference", e.target.value)
                        }
                        className={InputClass(theme)}
                      />
                      <FieldHint theme={theme}>
                        Esimerkiksi päivätyö, ilta, yö tai joustava. Tämä suodattaa ehdotuksia järkevämmin.
                      </FieldHint>
                    </div>
                  </div>

                  <div className={`rounded-[28px] border p-4 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'}`}>
                    <button
                      type="button"
                      onClick={() => setShowMoreSearchFields((prev) => !prev)}
                      className={`flex w-full items-center justify-between rounded-2xl px-1 py-1 text-left text-sm sm:text-base font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                      aria-expanded={showMoreSearchFields}
                    >
                      <span>Tarkenna hakua</span>
                      <span className="text-[#00BFA6]">{showMoreSearchFields ? "Piilota" : "Avaa"}</span>
                    </button>
                    <p className={`mt-2 text-sm leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Palkkatoive ja avainsanat ovat vapaaehtoisia.
                    </p>

                    {showMoreSearchFields && (
                      <div className="mt-6 grid grid-cols-1 gap-y-8 sm:gap-y-10 lg:gap-x-10 lg:gap-y-12 lg:grid-cols-2">
                        <div className="space-y-4">
                          <label htmlFor="search-salaryWish" className={LabelClass(theme)}>Palkkatoive</label>
                          <input
                            id="search-salaryWish"
                            placeholder="Esim. 3000€ / kk"
                            value={searchProfile.salaryWish}
                            onChange={(e) =>
                              updateSearchProfile("salaryWish", e.target.value)
                            }
                            className={InputClass(theme)}
                          />
                          <FieldHint theme={theme}>
                            Jos et tiedä tarkkaa summaa, arvio riittää. Tällä voi rajata liian kauas meneviä ehdotuksia pois.
                          </FieldHint>
                        </div>
                        <div className="space-y-4">
                          <label htmlFor="search-keywords" className={LabelClass(theme)}>Muita avainsanoja (erota pilkulla)</label>
                          <input
                            id="search-keywords"
                            placeholder="Esim. englanti, joustava"
                            value={searchProfile.keywords}
                            onChange={(e) =>
                              updateSearchProfile("keywords", e.target.value)
                            }
                            className={InputClass(theme)}
                          />
                          <FieldHint theme={theme}>
                            Lisää tähän esimerkiksi kielet, ajokortti, asiakaspalvelu, etä, B2B tai muu tärkeä sana jonka haluat osuvan hakuun.
                          </FieldHint>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 sm:pt-6">
                    <button
                      type="button"
                      onClick={suggestJobs}
                      disabled={loadingJobs}
                      className="w-full rounded-2xl bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] px-8 py-6 text-lg sm:text-xl font-black text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-[0_0_25px_rgba(0,191,166,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6F3C]"
                      aria-live="polite"
                    >
                      {loadingJobs ? "Etsitään..." : "2. EHDOTA TYÖPAIKKOJA"}
                    </button>
                    <FieldHint theme={theme}>
                      Kun painat tätä, studio hakee sinulle ehdotuksia tämän profiilin perusteella ja siirtää ne heti Työpaikat-välilehden kortteihin.
                    </FieldHint>
                  </div>
                </div>
              </SectionShell>
            </section>

            {/* OIKEA SARAKE: VÄLILEHDET */}
            <section id="studio-tulokset" className="space-y-10 lg:sticky lg:top-6 lg:self-start scroll-mt-24">
              <div className={`rounded-[32px] border p-5 sm:p-6 shadow-xl ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-white/90'}`}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00BFA6]">Rauhallinen työtila</p>
                    <h3 className={`mt-2 text-2xl sm:text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {workspaceTabLabel}
                    </h3>
                    <p className={`mt-3 text-sm sm:text-base leading-7 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {workspaceSummary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:w-[420px]">
                    <div className={`rounded-[22px] border px-5 py-5 ${theme === 'dark' ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-gray-50'}`}>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#00BFA6]">CV</p>
                      <p className={`mt-2 text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{cvResult ? "Valmis" : "Kesken"}</p>
                    </div>
                    <div className={`rounded-[22px] border px-5 py-5 ${theme === 'dark' ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-gray-50'}`}>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#00BFA6]">Paikat</p>
                      <p className={`mt-2 text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{filteredJobs.length}</p>
                    </div>
                    <div className={`col-span-2 sm:col-span-1 rounded-[22px] border px-5 py-5 ${theme === 'dark' ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-gray-50'}`}>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#00BFA6]">Hakemus</p>
                      <p className={`mt-2 text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{letterResult ? "Auki" : "Odottaa"}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* OSTATKO PRO-TASON? Nappi näkyy oikean sarakkeen huipulla, jos ei ole vielä pro */}
              {!isPro && (
                <div className="flex justify-end w-full mb-4">
                  <button 
                    onClick={() => setShowPaywall(true)} 
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2 border border-white/20"
                  >
                    <span className="text-lg">?</span> PÄIVITÄ PRO -TASOLLE
                  </button>
                </div>
              )}

              <div className={`rounded-[32px] sm:rounded-[40px] border p-7 sm:p-12 shadow-2xl backdrop-blur-xl transition-all ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
                
                {/* VÄLILEHTINAPIT (ARIA TABLIST) */}
                <div 
                  className={`sticky top-0 z-40 pt-2 sm:pt-0 mb-14 flex overflow-x-auto whitespace-nowrap pb-6 gap-3 sm:gap-5 snap-x border-b custom-scrollbar ${theme === 'dark' ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-100'}`}
                  role="tablist"
                  aria-label="Päätoiminnot"
                >
                  <button
                    type="button"
                    role="tab"
                    id="tab-cv"
                    aria-selected={tab === "cv"}
                    aria-controls="panel-cv"
                    onClick={() => setTab("cv")}
                    className={`rounded-2xl px-5 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-black transition-all duration-300 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
                      tab === "cv"
                        ? "bg-[#00BFA6] text-black shadow-[0_0_20px_rgba(0,191,166,0.4)]"
                        : theme === 'dark' ? "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1" : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:-translate-y-1"
                    }`}
                  >
                    Oma CV
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="tab-job"
                    aria-selected={tab === "jobs"}
                    aria-controls="panel-job"
                    onClick={() => setTab("jobs")}
                    className={`rounded-2xl px-5 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-black transition-all duration-300 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
                      tab === "jobs"
                        ? "bg-[#00BFA6] text-black shadow-[0_0_20px_rgba(0,191,166,0.4)]"
                        : theme === 'dark' ? "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1" : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:-translate-y-1"
                    }`}
                  >
                    Työpaikat
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="tab-letter"
                    aria-selected={tab === "hakemus"} 
                    onClick={() => setTab("hakemus")}
                    className={`rounded-2xl px-5 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-black transition-all duration-300 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
                      tab === "hakemus"
                        ? "bg-[#00BFA6] text-black shadow-[0_0_20px_rgba(0,191,166,0.4)]"
                        : theme === 'dark' ? "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1" : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:-translate-y-1"
                    }`}
                  >
                    Hakemukset
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="tab-tips"
                    aria-selected={tab === "tips"}
                    aria-controls="panel-tips"
                    onClick={() => setTab("tips")}
                    className={`rounded-2xl px-5 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-black transition-all duration-300 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6F3C] ${
                      tab === "tips"
                        ? "bg-[#FF6F3C] text-black shadow-[0_0_20px_rgba(255,111,60,0.4)]"
                        : theme === 'dark' ? "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1" : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:-translate-y-1"
                    }`}
                  >
                    Vinkit
                  </button>
                </div>

                {tab === "cv" && (
                  <div id="panel-cv" role="tabpanel" aria-labelledby="tab-cv" className="space-y-12 overflow-hidden animate-in fade-in duration-500">
                    <div className={`rounded-[32px] sm:rounded-[40px] border p-6 sm:p-8 lg:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-all ${theme === 'dark' ? 'border-[#00BFA6]/20 bg-[linear-gradient(180deg,rgba(0,191,166,0.08),rgba(15,15,15,0.96))]' : 'border-[#00BFA6]/20 bg-[linear-gradient(180deg,rgba(0,191,166,0.08),rgba(255,255,255,0.98))]'}`}>
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00BFA6]">CV-työtila</p>
                          <h3 className={`mt-3 text-3xl sm:text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Muokkaa CV:tä omassa rauhallisessa näkymässä
                          </h3>
                          <p className={`mt-3 text-sm sm:text-base leading-7 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Täytä tiedot vasemmalla, muokkaa valmis CV tässä näkymässä ja avaa lisätyökalut vasta kun niitä oikeasti tarvitset.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[520px]">
                          <div className={`rounded-[24px] border px-5 py-5 text-sm leading-7 ${theme === 'dark' ? 'border-white/10 bg-black/25 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-700'}`}>
                            1. Generoi CV
                          </div>
                          <div className={`rounded-[24px] border px-5 py-5 text-sm leading-7 ${theme === 'dark' ? 'border-white/10 bg-black/25 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-700'}`}>
                            2. Muokkaa tekstiä
                          </div>
                          <div className={`rounded-[24px] border px-5 py-5 text-sm leading-7 ${theme === 'dark' ? 'border-white/10 bg-black/25 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-700'}`}>
                            3. Lataa valmis tiedosto
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 gap-3 sm:hidden">
                        <button
                          type="button"
                          onClick={() => document.getElementById("cv-text-editor")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                          className={`rounded-2xl px-5 py-4 text-sm font-black transition-all ${theme === 'dark' ? 'bg-[#00BFA6] text-black' : 'bg-[#00BFA6] text-black'}`}
                        >
                          Mene muokkaukseen
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => document.getElementById("cv-preview-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                            className={`rounded-[22px] border px-5 py-5 text-sm font-black transition-all ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                          >
                            Esikatselu
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowStyleStudio((prev) => !prev)}
                            className={`rounded-[22px] border px-5 py-5 text-sm font-black transition-all ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                          >
                            {showStyleStudio ? "Piilota tyylit" : "Tyylit"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {parsedCv.cvBody && activeJob && (
                      <div className={`flex flex-col sm:flex-row gap-5 p-6 rounded-3xl border ${theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex-1">
                          <p className={`text-base mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Valittu työpaikka: <strong className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{activeJob.title}</strong></p>
                          <button
                            type="button"
                            onClick={createTailoredCv}
                            disabled={loadingTailoredCv}
                            className="w-full rounded-2xl border border-[#FF6F3C]/50 bg-[#FF6F3C]/10 px-8 py-5 font-black text-xl text-[#FF6F3C] transition-all hover:bg-[#FF6F3C]/20 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6F3C]"
                            aria-live="polite"
                          >
                            {loadingTailoredCv
                              ? "Muokataan tekoälyllä..."
                              : "Räätälöi CV tähän työpaikkaan"}
                          </button>
                        </div>
                      </div>
                    )}

                    {activeJobCvVariants.length > 0 && (
                      <div className={`rounded-[28px] border p-6 sm:p-8 ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className={`mb-5 text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Tallennetut CV-versiot
                        </h3>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          {activeJobCvVariants.map((cv) => (
                            <button
                              key={cv.id}
                              type="button"
                              onClick={() => setCvResult(`CV_BODY:\n${cv.content}`)}
                              className={`w-full rounded-2xl border px-6 py-5 text-left transition-all hover:border-[#00BFA6]/50 hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(0,191,166,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-black/50' : 'border-gray-200 bg-white'}`}
                            >
                              <p className="font-bold text-lg text-[#00BFA6] truncate">
                                {cv.jobTitle}
                              </p>
                              <p className={`text-base font-medium truncate mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {cv.companyName}
                              </p>
                              <p className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                {new Date(cv.createdAt).toLocaleString("fi-FI")}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {cvResult ? (
                      <>
                        {(parsedCv.score || parsedCv.report.length > 0) && (
                          <div className={`rounded-[28px] border p-4 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'}`}>
                            <button
                              type="button"
                              onClick={() => setShowCvAnalysis((prev) => !prev)}
                              className={`flex w-full items-center justify-between rounded-2xl px-1 py-1 text-left text-sm sm:text-base font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                              aria-expanded={showCvAnalysis}
                            >
                              <span>CV-analyysi ja muutosraportti</span>
                              <span className="text-[#00BFA6]">{showCvAnalysis ? "Piilota" : "Avaa"}</span>
                            </button>
                            <p className={`mt-2 text-sm leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Tämä on lisätieto. Tärkein työ tehdään alempana suoraan CV-tekstissä.
                            </p>

                            {showCvAnalysis && (
                              <div className="mt-6 space-y-6">
                                {parsedCv.score && (
                                  <div className="rounded-[32px] border border-[#00BFA6]/30 bg-[#00BFA6]/5 p-6 sm:p-8 text-center shadow-[0_10px_30px_rgba(0,191,166,0.1)]">
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#00BFA6]">
                                      Kuntotarkastus arvosana
                                    </h2>
                                    <p className={`mt-3 text-5xl sm:text-6xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                      {parsedCv.score}
                                    </p>
                                  </div>
                                )}

                                {parsedCv.report.length > 0 && (
                                  <div className="rounded-[32px] border border-[#FF6F3C]/30 bg-[#FF6F3C]/5 p-6 sm:p-10 shadow-[0_10px_30px_rgba(255,111,60,0.1)]">
                                    <h2 className="mb-5 text-sm font-black uppercase tracking-widest text-[#FF6F3C]">
                                      Muutosraportti / Parannukset
                                    </h2>
                                    <ul className={`space-y-4 pl-6 text-base sm:text-lg ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                                      {parsedCv.report.map((item, index) => (
                                        <li key={index} className="list-disc break-words leading-relaxed">
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* VAPAA CV-TEKSTIN MUOKKAUS */}
                        <div className="rounded-[40px] border border-[#00BFA6]/20 bg-[#00BFA6]/5 p-6 sm:p-10 xl:p-12 shadow-[0_18px_60px_rgba(0,191,166,0.12)]">
                          <div className={`mb-6 rounded-[28px] border p-4 sm:p-5 ${theme === 'dark' ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-white/70'}`}>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">
                              Helpoin tapa muokata
                            </p>
                            <p className={`mt-2 text-sm leading-7 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              Muokkaa tässä vain tekstiä. Esikatselu päivittyy automaattisesti alle, joten sinun ei tarvitse tallentaa erikseen joka muutoksen jälkeen.
                            </p>
                          </div>
                          <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="max-w-2xl">
                              <label htmlFor="cv-text-editor" className={`text-2xl font-black block ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Muokkaa CV:tä rauhassa</label>
                              <p className={`mt-2 text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tämä on päämuokkausalue. Tee muutokset tähän, ja lopputulos näkyy heti esikatselussa.</p>
                            </div>

                            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-1">
                              <button
                                type="button"
                                onClick={() => copyText(cvEditorText, "CV-teksti kopioitu leikepöydälle!")}
                                className={`rounded-2xl border px-5 py-3 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                              >
                                Kopioi teksti
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateCvBody(
                                    cvEditorText
                                      .replace(/\n{3,}/g, "\n\n")
                                      .split("\n")
                                      .map((line) => line.trimEnd())
                                      .join("\n"),
                                  )
                                }
                                className={`rounded-2xl border px-5 py-3 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                              >
                                Siivoa rivit
                              </button>
                            </div>
                          </div>

                          <div className={`mb-6 grid grid-cols-1 gap-3 rounded-3xl border p-4 sm:grid-cols-2 xl:grid-cols-4 ${theme === 'dark' ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-white/80'}`}>
                            <div>
                              <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Rivejä</p>
                              <p className={`mt-2 text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{cvEditorLineCount}</p>
                            </div>
                            <div>
                              <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Merkkejä</p>
                              <p className={`mt-2 text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{cvEditorCharCount}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-2">
                              <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Muokkaa ainakin</p>
                              <p className={`mt-2 text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Profiili, kokemus, taidot, koulutus, projektit ja yhteystiedot.</p>
                            </div>
                          </div>

                          <textarea
                            id="cv-text-editor"
                            value={cvEditorText}
                            onChange={(e) => updateCvBody(e.target.value)}
                            className={`min-h-[380px] w-full rounded-3xl border px-5 py-5 font-mono text-[15px] leading-8 outline-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] sm:min-h-[560px] lg:min-h-[680px] ${theme === 'dark' ? 'border-white/10 bg-black/50 text-gray-100' : 'border-gray-200 bg-white text-gray-800'}`}
                          />
                        </div>

                        {/* CV PREVIEW */}
                        <div id="cv-preview-panel" className={`rounded-[40px] border p-4 sm:p-8 overflow-x-auto shadow-2xl custom-scrollbar mt-12 ${theme === 'dark' ? 'border-white/10 bg-[#0F0F0F]' : 'border-gray-200 bg-gray-100'}`} role="region" aria-label="CV Esikatselu">
                          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">Esikatselu</p>
                              <h3 className={`mt-2 text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Näin CV näyttää</h3>
                            </div>
                            <p className={`max-w-xl text-sm leading-7 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Esikatselu skaalautuu puhelimen leveyteen. Muokkaa tekstiä yllä olevassa editorissa — muutokset näkyvät heti tässä.
                            </p>
                          </div>
                          {isMobileViewport ? (
                            <div
                              className="w-full overflow-hidden rounded-2xl"
                              style={{ height: `${Math.round(1123 * previewScale)}px` }}
                            >
                              <div style={{ width: "794px", transform: `scale(${previewScale})`, transformOrigin: "top left" }}>
                                <CvPreview
                                  cvText={parsedCv.cvBody}
                                  image={profileImage}
                                  styleVariant={cvStyle}
                                  customStyle={customStyle}
                                  mode="cv"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="min-w-[680px] xl:min-w-[900px]">
                              <CvPreview
                                cvText={parsedCv.cvBody}
                                image={profileImage}
                                styleVariant={cvStyle}
                                customStyle={customStyle}
                                mode="cv"
                              />
                            </div>
                          )}
                        </div>

                        {/* LATAUSNAPIT */}
                        <div className={`flex flex-col sm:flex-row gap-5 mt-12 sm:mt-20 pt-8 sm:pt-10 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                          <button
                            type="button"
                            onClick={() => downloadPdf("cv-preview", false)}
                            disabled={downloadingPdf}
                            className="flex-1 rounded-2xl bg-[#00BFA6] text-black px-8 py-5 font-black text-lg transition-transform hover:scale-[1.02] shadow-[0_0_20px_rgba(0,191,166,0.3)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
                            aria-live="polite"
                          >
                            {downloadingPdf ? "Luodaan PDF..." : "LATAA PDF"}
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadDocx(parsedCv.cvBody, false)}
                            disabled={downloadingDocx}
                            className={`flex-1 rounded-2xl border-2 px-8 py-5 font-black transition-all hover:border-[#00BFA6] hover:text-[#00BFA6] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-zinc-800 bg-transparent text-zinc-400' : 'border-gray-300 bg-white text-gray-600'}`}
                            aria-live="polite"
                          >
                            {downloadingDocx ? "Luodaan DOCX..." : "LATAA DOCX"}
                          </button>
                        </div>

                        {/* --- CANVA TASON EDITOR --- */}
                        <div className={`rounded-[32px] border p-6 md:p-10 mt-16 shadow-2xl ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-gray-200'}`}>
                          <div className={`flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                            <div className="max-w-2xl">
                              <p className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Värit ja teema</p>
                              <p className={`mt-2 text-sm sm:text-base leading-7 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Tämä on lisätyökalu. Avaa se, kun haluat hioa ulkoasua valmiin CV-sisällön jälkeen.
                              </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                              <button
                                type="button"
                                onClick={() => setShowStyleStudio((prev) => !prev)}
                                className={`rounded-2xl border px-6 py-3 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-[#00BFA6]/50' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-[#00BFA6]/50'}`}
                                aria-expanded={showStyleStudio}
                              >
                                {showStyleStudio ? "Piilota tyylieditori" : "Avaa tyylieditori"}
                              </button>
                              <button type="button" onClick={resetCurrentStyle} className={`rounded-2xl border px-6 py-3 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-[#00BFA6]/50' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-[#00BFA6]/50'}`}>
                                Palauta oletukset
                              </button>
                              <button type="button" onClick={saveCurrentStylePreset} className={`rounded-2xl border px-6 py-3 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-[#00BFA6]/30 bg-[#00BFA6]/10 text-[#7EF5E3] hover:bg-[#00BFA6]/15' : 'border-[#00BFA6]/30 bg-[#00BFA6]/10 text-[#0f766e] hover:bg-[#00BFA6]/15'}`}>
                                Tallenna oma tyyli
                              </button>
                            </div>
                          </div>

                          {(!isMobileViewport || showStyleStudio) && (
                            <>
                          <div className={`mb-10 mt-8 grid grid-cols-1 gap-4 rounded-[28px] border p-5 sm:grid-cols-3 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-gray-50/80'}`}>
                            <button type="button" onClick={() => applyQuickStyleMood("professional")} className={`rounded-2xl border px-5 py-4 text-sm font-bold text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'}`}>
                              <span className="block text-xs uppercase tracking-[0.18em] text-[#00BFA6]">Pikamuokkaus</span>
                              <span className="mt-2 block text-base font-black">Virallisempi</span>
                              <span className={`mt-1 block text-xs leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Rauhallisempi typografia ja siistimpi ilme.</span>
                            </button>
                            <button type="button" onClick={() => applyQuickStyleMood("modern")} className={`rounded-2xl border px-5 py-4 text-sm font-bold text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'}`}>
                              <span className="block text-xs uppercase tracking-[0.18em] text-[#00BFA6]">Pikamuokkaus</span>
                              <span className="mt-2 block text-base font-black">Modernimpi</span>
                              <span className={`mt-1 block text-xs leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Hieman rohkeampi, nykyaikainen pinta ja kuviot.</span>
                            </button>
                            <button type="button" onClick={() => applyQuickStyleMood("compact")} className={`rounded-2xl border px-5 py-4 text-sm font-bold text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'}`}>
                              <span className="block text-xs uppercase tracking-[0.18em] text-[#00BFA6]">Pikamuokkaus</span>
                              <span className="mt-2 block text-base font-black">Tiiviimpi</span>
                              <span className={`mt-1 block text-xs leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Puristaa sisältöä yhdelle sivulle helpommin.</span>
                            </button>
                          </div>

                          <div className={`mb-10 rounded-[28px] border p-5 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-gray-50/80'}`}>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Pro-pohjat</p>
                                <p className={`mt-2 text-sm leading-7 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Valitse valmis suunta, kun haluat nopean näyttävän alun ilman säätämistä.
                                </p>
                              </div>
                            </div>
                            <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
                              {premiumStylePresets.map((preset) => (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => applyStylePreset(preset)}
                                  className={`rounded-2xl border px-5 py-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:border-[#00BFA6]/50 hover:bg-white/10' : 'border-gray-200 bg-white text-gray-900 hover:border-[#00BFA6]/40 hover:bg-gray-50'}`}
                                >
                                  <span className="block text-xs uppercase tracking-[0.18em] text-[#00BFA6]">{preset.styleVariant}</span>
                                  <span className="mt-2 block text-lg font-black">{preset.name}</span>
                                  <span className={`mt-2 block text-sm leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {preset.id === "preset-executive-slate" && "Johtaja- ja asiantuntijarooliin rauhallinen premium-ilme."}
                                    {preset.id === "preset-creative-pulse" && "Luovempi, energinen ja erottuva kokonaisuus."}
                                    {preset.id === "preset-minimal-nordic" && "Pelkistetty, skandinaavinen ja helposti luettava tyyli."}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className={`mb-10 rounded-[28px] border p-5 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-gray-50/80'}`}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Omat tallennetut tyylit</p>
                                <p className={`mt-2 text-sm leading-7 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Tallenna parhaat ulkoasut omaan kirjastoon ja ota ne käyttöön yhdellä painalluksella.
                                </p>
                              </div>
                            </div>
                            {savedStylePresets.length ? (
                              <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
                                {savedStylePresets.map((preset) => (
                                  <div key={preset.id} className={`rounded-2xl border p-4 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{preset.name}</p>
                                        <p className={`mt-1 text-xs uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                          {preset.styleVariant} · tallennettu {new Date(preset.createdAt).toLocaleDateString("fi-FI")}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeSavedStylePreset(preset.id)}
                                        className={`rounded-xl px-3 py-2 text-xs font-black transition-all ${theme === 'dark' ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                      >
                                        Poista
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => applyStylePreset(preset)}
                                      className="mt-4 w-full rounded-2xl bg-[#00BFA6] px-4 py-3 text-sm font-black text-black transition-transform hover:scale-[1.01]"
                                    >
                                      Käytä tätä tyyliä
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={`mt-5 rounded-2xl border border-dashed p-5 text-sm leading-7 ${theme === 'dark' ? 'border-white/10 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                                Tallenna ensimmäinen oma tyyli, niin saat tähän oman pienen tyylikirjaston.
                              </div>
                            )}
                          </div>

                          {/* PIKAVÄRIT */}
                          <div className={`mb-10 mt-8 flex flex-wrap gap-4 border-b pb-8 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`} role="group" aria-label="Pikaväriteemat">
                            <button type="button" onClick={() => applyPalette("#ffffff", "#f8fafc", "#0f172a", "#1e293b", "#0369a1", "#111827", "#ffffff", "#475569")} className={`rounded-xl px-5 py-3 text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0369a1] ${theme === 'dark' ? 'border-white/10 hover:border-[#0369a1] hover:bg-white/5' : 'border-gray-200 hover:border-[#0369a1] hover:bg-gray-50'}`}>?? Merellinen</button>
                            <button type="button" onClick={() => applyPalette("#ffffff", "#f1f5f9", "#064e3b", "#022c22", "#10b981", "#0f172a", "#ffffff", "#334155")} className={`rounded-xl px-5 py-3 text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] ${theme === 'dark' ? 'border-white/10 hover:border-[#10b981] hover:bg-white/5' : 'border-gray-200 hover:border-[#10b981] hover:bg-gray-50'}`}>?? Metsä</button>
                            <button type="button" onClick={() => applyPalette("#fffbeb", "#fef3c7", "#78350f", "#451a03", "#d97706", "#451a03", "#fffbeb", "#92400e")} className={`rounded-xl px-5 py-3 text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97706] ${theme === 'dark' ? 'border-white/10 hover:border-[#d97706] hover:bg-white/5' : 'border-gray-200 hover:border-[#d97706] hover:bg-gray-50'}`}>?? Syksy</button>
                            <button type="button" onClick={() => applyPalette("#ffffff", "#f3f4f6", "#4c1d95", "#312e81", "#7c3aed", "#111827", "#ffffff", "#4338ca")} className={`rounded-xl px-5 py-3 text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] ${theme === 'dark' ? 'border-white/10 hover:border-[#7c3aed] hover:bg-white/5' : 'border-gray-200 hover:border-[#7c3aed] hover:bg-gray-50'}`}>?? Kyber</button>
                            <button type="button" onClick={() => applyPalette("#18181b", "#111827", "#000000", "#0a0a0a", "#14b8a6", "#f3f4f6", "#e5e7eb", "#9ca3af")} className={`rounded-xl px-5 py-3 text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14b8a6] ${theme === 'dark' ? 'border-white/10 hover:border-[#14b8a6] hover:bg-white/5' : 'border-gray-200 hover:border-[#14b8a6] hover:bg-gray-50'}`}>?? Tumma Tyyli</button>
                            <button type="button" onClick={() => applyPalette("#fff7ed", "#ffedd5", "#7c2d12", "#9a3412", "#f97316", "#431407", "#fff7ed", "#c2410c")} className={`rounded-xl px-5 py-3 text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] ${theme === 'dark' ? 'border-white/10 hover:border-[#f97316] hover:bg-white/5' : 'border-gray-200 hover:border-[#f97316] hover:bg-gray-50'}`}>?? Auringonlasku</button>
                            <button type="button" onClick={() => applyPalette("#fdf2f8", "#fce7f3", "#831843", "#9d174d", "#ec4899", "#500724", "#fff1f2", "#be185d")} className={`rounded-xl px-5 py-3 text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899] ${theme === 'dark' ? 'border-white/10 hover:border-[#ec4899] hover:bg-white/5' : 'border-gray-200 hover:border-[#ec4899] hover:bg-gray-50'}`}>?? Rosé</button>
                            <button type="button" onClick={() => applyPalette("#f5f3ff", "#ede9fe", "#312e81", "#1e1b4b", "#8b5cf6", "#111827", "#ffffff", "#5b21b6")} className={`rounded-xl px-5 py-3 text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6] ${theme === 'dark' ? 'border-white/10 hover:border-[#8b5cf6] hover:bg-white/5' : 'border-gray-200 hover:border-[#8b5cf6] hover:bg-gray-50'}`}>? Studio</button>
                            <button type="button" onClick={() => applyPalette("#f8fafc", "#e2e8f0", "#082f49", "#0f172a", "#38bdf8", "#0f172a", "#f8fafc", "#0f766e")} className={`rounded-xl px-5 py-3 text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] ${theme === 'dark' ? 'border-white/10 hover:border-[#38bdf8] hover:bg-white/5' : 'border-gray-200 hover:border-[#38bdf8] hover:bg-gray-50'}`}>?? Nordinen</button>
                          </div>

                          <div className="mb-10 flex flex-wrap gap-4" role="group" aria-label="CV:n asettelutyylit">
                            {(["modern", "classic", "compact", "bold"] as CvStyleVariant[]).map((variant) => (
                              <button
                                key={variant}
                                type="button"
                                aria-pressed={cvStyle === variant}
                                onClick={() => setCvStyle(variant)}
                                className={`rounded-2xl px-6 py-4 text-base font-bold transition-all duration-300 flex-1 sm:flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${cvStyle === variant ? "bg-[#00BFA6] text-black shadow-[0_0_20px_rgba(0,191,166,0.4)] scale-105" : (theme === 'dark' ? "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1" : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:-translate-y-1")}`}
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
                              <h4 className={`font-bold text-xs uppercase tracking-widest mb-5 border-b pb-3 ${theme === 'dark' ? 'text-[#00BFA6] border-white/10' : 'text-[#00BFA6] border-gray-200'}`}>Asettelu & Typografia</h4>
                              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                  <label htmlFor="style-layout" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Asettelu (Layout)</label>
                                  <select id="style-layout" value={customStyle.layout || "left-sidebar"} onChange={(e) => updateCustomStyle("layout", e.target.value as any)} className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                    <option value="left-sidebar">Vasen sivupalkki</option>
                                    <option value="right-sidebar">Oikea sivupalkki</option>
                                    <option value="top-header">Yläpalkki (Koko leveys)</option>
                                    <option value="minimalist">Minimalistinen (Keskitetty)</option>
                                    <option value="two-column">Jaettu kahteen sarakkeeseen</option>
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor="style-fontFamily" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Fonttiperhe</label>
                                  <select id="style-fontFamily" value={customStyle.fontFamily || "modern"} onChange={(e) => updateCustomStyle("fontFamily", e.target.value as any)} className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                    <option value="modern">Moderni (Sans-serif)</option>
                                    <option value="classic">Klassinen (Serif)</option>
                                    <option value="mono">Koodari (Monospace)</option>
                                    <option value="elegant">Elegantti (Georgia)</option>
                                    <option value="clean">Puhdas (Arial)</option>
                                    <option value="tech">Tekninen (Trebuchet)</option>
                                    <option value="brutalist">Brutalistinen (Impact)</option>
                                    <option value="playful">Leikkisä (Comic)</option>
                                    <option value="editorial">Editorial (Palatino)</option>
                                    <option value="rounded">Pyöreä (Rounded)</option>
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor="style-headingStyle" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Otsikoiden tyyli</label>
                                  <select id="style-headingStyle" value={customStyle.headingStyle || "simple"} onChange={(e) => updateCustomStyle("headingStyle", e.target.value as any)} className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                    <option value="simple">Yksinkertainen</option>
                                    <option value="underline">Alleviivaus</option>
                                    <option value="highlight">Korostusväri taustalla</option>
                                    <option value="boxed">Laatikko</option>
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor="style-headingTransform" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Otsikoiden tekstaus</label>
                                  <select id="style-headingTransform" value={customStyle.headingTransform || "uppercase"} onChange={(e) => updateCustomStyle("headingTransform", e.target.value as any)} className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                    <option value="uppercase">KAIKKI ISOLLA (Uppercase)</option>
                                    <option value="none">Normaali koko (None)</option>
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor="style-headerFontWeight" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Otsikoiden paksuus</label>
                                  <select id="style-headerFontWeight" value={customStyle.headerFontWeight || "black"} onChange={(e) => updateCustomStyle("headerFontWeight", e.target.value as any)} className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                    <option value="normal">Normaali (Normal)</option>
                                    <option value="medium">Puolilihava (Medium)</option>
                                    <option value="bold">Lihava (Bold)</option>
                                    <option value="black">Erittäin paksu (Black)</option>
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor="style-timelineStyle" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Aikajanan viiva (Työkokemus)</label>
                                  <select id="style-timelineStyle" value={customStyle.timelineStyle || "solid"} onChange={(e) => updateCustomStyle("timelineStyle", e.target.value as any)} className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                    <option value="solid">Yhtenäinen</option>
                                    <option value="dashed">Katkoviiva</option>
                                    <option value="dotted">Pisteviiva</option>
                                    <option value="none">Piilotettu</option>
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor="style-iconStyle" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Yhteystietojen ikonit</label>
                                  <select id="style-iconStyle" value={customStyle.iconStyle || "outline"} onChange={(e) => updateCustomStyle("iconStyle", e.target.value as any)} className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                    <option value="outline">Ääriviivat (Outline)</option>
                                    <option value="solid">Täytetyt (Solid)</option>
                                    <option value="none">Piilotettu</option>
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor="style-imageFilter" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Kuvan filtteri</label>
                                  <select id="style-imageFilter" value={customStyle.imageFilter || "none"} onChange={(e) => updateCustomStyle("imageFilter", e.target.value as any)} className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                    <option value="none">Normaali (Värillinen)</option>
                                    <option value="grayscale">Mustavalkoinen (Grayscale)</option>
                                    <option value="sepia">Seepia (Vintage)</option>
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor="style-sidebarBorder" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Sivupalkin erotinviiva</label>
                                  <select id="style-sidebarBorder" value={customStyle.sidebarBorder ? "yes" : "no"} onChange={(e) => updateCustomStyle("sidebarBorder", e.target.value === "yes")} className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                    <option value="no">Ei viivaa</option>
                                    <option value="yes">Näytä viiva</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* VÄRIT */}
                            <div>
                              <h4 className={`font-bold text-xs uppercase tracking-widest mb-5 border-b pb-3 ${theme === 'dark' ? 'text-[#00BFA6] border-white/10' : 'text-[#00BFA6] border-gray-200'}`}>Värimaailma</h4>
                              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                                <div>
                                  <label htmlFor="color-sidebarBg" className={`mb-3 block text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Sivupalkki Bg</label>
                                  <input id="color-sidebarBg" type="color" value={customStyle.sidebarBg} onChange={(e) => updateCustomStyle("sidebarBg", e.target.value)} className={`h-12 w-full rounded-xl border p-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-gray-50 border-gray-200'}`} />
                                </div>
                                <div>
                                  <label htmlFor="color-sidebarBg2" className={`mb-3 block text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Sivupalkki Bg 2</label>
                                  <input id="color-sidebarBg2" type="color" value={customStyle.sidebarBg2 || customStyle.sidebarBg} onChange={(e) => updateCustomStyle("sidebarBg2", e.target.value)} className={`h-12 w-full rounded-xl border p-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-gray-50 border-gray-200'}`} />
                                </div>
                                <div>
                                  <label htmlFor="color-sidebarText" className={`mb-3 block text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Sivupalkki Txt</label>
                                  <input id="color-sidebarText" type="color" value={customStyle.sidebarText} onChange={(e) => updateCustomStyle("sidebarText", e.target.value)} className={`h-12 w-full rounded-xl border p-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-gray-50 border-gray-200'}`} />
                                </div>
                                <div>
                                  <label htmlFor="color-mainBg" className={`mb-3 block text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Pääalue Bg</label>
                                  <input id="color-mainBg" type="color" value={customStyle.mainBg} onChange={(e) => updateCustomStyle("mainBg", e.target.value)} className={`h-12 w-full rounded-xl border p-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-gray-50 border-gray-200'}`} />
                                </div>
                                <div>
                                  <label htmlFor="color-mainBg2" className={`mb-3 block text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Pääalue Bg 2</label>
                                  <input id="color-mainBg2" type="color" value={customStyle.mainBg2 || customStyle.mainBg} onChange={(e) => updateCustomStyle("mainBg2", e.target.value)} className={`h-12 w-full rounded-xl border p-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-gray-50 border-gray-200'}`} />
                                </div>
                                <div>
                                  <label htmlFor="color-mainText" className={`mb-3 block text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Pääalue Txt</label>
                                  <input id="color-mainText" type="color" value={customStyle.mainText} onChange={(e) => updateCustomStyle("mainText", e.target.value)} className={`h-12 w-full rounded-xl border p-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-gray-50 border-gray-200'}`} />
                                </div>
                                <div>
                                  <label htmlFor="color-headingColor" className={`mb-3 block text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Otsikot</label>
                                  <input id="color-headingColor" type="color" value={customStyle.headingColor} onChange={(e) => updateCustomStyle("headingColor", e.target.value)} className={`h-12 w-full rounded-xl border p-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-gray-50 border-gray-200'}`} />
                                </div>
                                <div>
                                  <label htmlFor="color-accentColor" className={`mb-3 block text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Korosteväri</label>
                                  <input id="color-accentColor" type="color" value={customStyle.accentColor} onChange={(e) => updateCustomStyle("accentColor", e.target.value)} className={`h-12 w-full rounded-xl border p-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-gray-50 border-gray-200'}`} />
                                </div>
                              </div>
                            </div>

                            {/* KUVIOINTI & YKSITYISKOHDAT */}
                            <div>
                              <h4 className={`font-bold text-xs uppercase tracking-widest mb-5 border-b pb-3 ${theme === 'dark' ? 'text-[#00BFA6] border-white/10' : 'text-[#00BFA6] border-gray-200'}`}>Kuviointi & Taustat</h4>
                              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                  <label htmlFor="style-pattern" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Pääalueen kuviointi</label>
                                  <select id="style-pattern" value={customStyle.pattern || "none"} onChange={(e) => updateCustomStyle("pattern", e.target.value as any)} className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                    <option value="none">Ei kuviointia</option>
                                    <option value="dots">Pisteet (Dots)</option>
                                    <option value="lines">Vaakaviivat (Lines)</option>
                                    <option value="diagonal">Vinoviivat (Diagonal)</option>
                                    <option value="grid">Ruudukko (Grid)</option>
                                    <option value="cross">Ristit (Cross)</option>
                                    <option value="intersecting">Risteävät viivat</option>
                                    <option value="waves">Aallot (Waves)</option>
                                    <option value="zigzag">Sahalaita (Zigzag)</option>
                                    <option value="chevrons">Kulmaraidat (Chevrons)</option>
                                    <option value="halftone">Rasteripisteet (Halftone)</option>
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor="style-sidebarPattern" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Sivupalkin kuviointi</label>
                                  <select id="style-sidebarPattern" value={customStyle.sidebarPattern || "none"} onChange={(e) => updateCustomStyle("sidebarPattern", e.target.value as any)} className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                    <option value="none">Ei kuviointia</option>
                                    <option value="dots">Pisteet (Dots)</option>
                                    <option value="lines">Vaakaviivat (Lines)</option>
                                    <option value="diagonal">Vinoviivat (Diagonal)</option>
                                    <option value="grid">Ruudukko (Grid)</option>
                                    <option value="cross">Ristit (Cross)</option>
                                    <option value="intersecting">Risteävät viivat</option>
                                    <option value="waves">Aallot (Waves)</option>
                                    <option value="zigzag">Sahalaita (Zigzag)</option>
                                    <option value="chevrons">Kulmaraidat (Chevrons)</option>
                                    <option value="halftone">Rasteripisteet (Halftone)</option>
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor="style-mainGradient" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Pääalueen liukuväri (Suunta)</label>
                                  <select id="style-mainGradient" value={customStyle.mainGradientDirection || "none"} onChange={(e) => updateCustomStyle("mainGradientDirection", e.target.value as any)} className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                    <option value="none">Ei liukuväriä</option>
                                    <option value="to bottom">Ylhäältä alas</option>
                                    <option value="to right">Vasemmalta oikealle</option>
                                    <option value="135deg">Viistosti (135deg)</option>
                                    <option value="circle">Ympyrä (Radial)</option>
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor="style-sidebarGradient" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Sivupalkin liukuväri (Suunta)</label>
                                  <select id="style-sidebarGradient" value={customStyle.sidebarGradientDirection || "none"} onChange={(e) => updateCustomStyle("sidebarGradientDirection", e.target.value as any)} className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                    <option value="none">Ei liukuväriä</option>
                                    <option value="to bottom">Ylhäältä alas</option>
                                    <option value="to right">Vasemmalta oikealle</option>
                                    <option value="135deg">Viistosti (135deg)</option>
                                    <option value="circle">Ympyrä (Radial)</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* MITAT & VÄLIT */}
                            <div>
                              <h4 className={`font-bold text-xs uppercase tracking-widest mb-5 border-b pb-3 ${theme === 'dark' ? 'text-[#00BFA6] border-white/10' : 'text-[#00BFA6] border-gray-200'}`}>Mitat & Välit</h4>
                              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                  <label htmlFor="range-headingSize" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Otsikoiden koko ({customStyle.headingSize || 16}px)</label>
                                  <input id="range-headingSize" type="range" min={12} max={32} value={customStyle.headingSize || 16} onChange={(e) => updateCustomStyle("headingSize", Number(e.target.value))} className="w-full accent-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]" />
                                </div>
                                <div>
                                  <label htmlFor="range-contactSize" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Yhteystietojen koko ({customStyle.contactSize || 14}px)</label>
                                  <input id="range-contactSize" type="range" min={10} max={18} value={customStyle.contactSize || 14} onChange={(e) => updateCustomStyle("contactSize", Number(e.target.value))} className="w-full accent-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]" />
                                </div>
                                <div>
                                  <label htmlFor="range-itemSpacing" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Luetteloiden välistys ({customStyle.itemSpacing || 12}px)</label>
                                  <input id="range-itemSpacing" type="range" min={4} max={32} value={customStyle.itemSpacing || 12} onChange={(e) => updateCustomStyle("itemSpacing", Number(e.target.value))} className="w-full accent-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]" />
                                </div>
                                <div>
                                  <label htmlFor="range-imageBorderWidth" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Kuvan kehyksen paksuus ({customStyle.imageBorderWidth || 0}px)</label>
                                  <input id="range-imageBorderWidth" type="range" min={0} max={10} value={customStyle.imageBorderWidth || 0} onChange={(e) => updateCustomStyle("imageBorderWidth", Number(e.target.value))} className="w-full accent-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]" />
                                </div>
                                <div>
                                  <label htmlFor="range-contactSpacing" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Yhteystietojen yläväli ({customStyle.contactSpacing || 40}px)</label>
                                  <input id="range-contactSpacing" type="range" min={0} max={120} value={customStyle.contactSpacing || 40} onChange={(e) => updateCustomStyle("contactSpacing", Number(e.target.value))} className="w-full accent-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]" />
                                </div>
                                <div>
                                  <label htmlFor="range-patternOpacity" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Kuvioinnin vahvuus ({customStyle.patternOpacity || 5}%)</label>
                                  <input id="range-patternOpacity" type="range" min={1} max={30} value={customStyle.patternOpacity || 5} onChange={(e) => updateCustomStyle("patternOpacity", Number(e.target.value))} className="w-full accent-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]" />
                                </div>
                                <div>
                                  <label htmlFor="range-sidebarPatternOpacity" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Sivupalkin kuvioinnin vahvuus ({customStyle.sidebarPatternOpacity || 5}%)</label>
                                  <input id="range-sidebarPatternOpacity" type="range" min={1} max={30} value={customStyle.sidebarPatternOpacity || 5} onChange={(e) => updateCustomStyle("sidebarPatternOpacity", Number(e.target.value))} className="w-full accent-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]" />
                                </div>
                                <div>
                                  <label htmlFor="range-pagePadding" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Sivun sisämarginaalit ({customStyle.pagePadding || 48}px)</label>
                                  <input id="range-pagePadding" type="range" min={20} max={80} value={customStyle.pagePadding || 48} onChange={(e) => updateCustomStyle("pagePadding", Number(e.target.value))} className="w-full accent-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]" />
                                </div>
                                <div>
                                  <label htmlFor="range-sidebarWidth" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Sivupalkin leveys ({customStyle.sidebarWidth}px)</label>
                                  <input id="range-sidebarWidth" type="range" min={180} max={340} value={customStyle.sidebarWidth} onChange={(e) => updateCustomStyle("sidebarWidth", Number(e.target.value))} className="w-full accent-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]" />
                                </div>
                                <div>
                                  <label htmlFor="range-nameSize" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Nimen koko ({customStyle.nameSize}px)</label>
                                  <input id="range-nameSize" type="range" min={28} max={64} value={customStyle.nameSize} onChange={(e) => updateCustomStyle("nameSize", Number(e.target.value))} className="w-full accent-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]" />
                                </div>
                                <div>
                                  <label htmlFor="range-bodySize" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Tekstin koko ({customStyle.bodySize}px)</label>
                                  <input id="range-bodySize" type="range" min={12} max={20} value={customStyle.bodySize} onChange={(e) => updateCustomStyle("bodySize", Number(e.target.value))} className="w-full accent-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]" />
                                </div>
                                <div>
                                  <label htmlFor="range-borderRadius" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Sisälaatikoiden pyöreys ({customStyle.borderRadius}px)</label>
                                  <input id="range-borderRadius" type="range" min={0} max={40} value={customStyle.borderRadius} onChange={(e) => updateCustomStyle("borderRadius", Number(e.target.value))} className="w-full accent-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]" />
                                </div>
                                <div>
                                  <label htmlFor="range-lineHeight" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Riviväli ({customStyle.lineHeight})</label>
                                  <input id="range-lineHeight" type="range" min={1.2} max={2} step={0.05} value={customStyle.lineHeight} onChange={(e) => updateCustomStyle("lineHeight", Number(e.target.value))} className="w-full accent-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]" />
                                </div>
                                <div>
                                  <label htmlFor="range-sectionSpacing" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Osioiden väli ({customStyle.sectionSpacing}px)</label>
                                  <input id="range-sectionSpacing" type="range" min={8} max={60} value={customStyle.sectionSpacing} onChange={(e) => updateCustomStyle("sectionSpacing", Number(e.target.value))} className="w-full accent-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]" />
                                </div>
                                <div className="sm:col-span-3">
                                  <label htmlFor="range-imageRadius" className={`mb-3 block text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Kuvan pyöristys ({customStyle.imageRadius}px)</label>
                                  <input id="range-imageRadius" type="range" min={0} max={40} value={customStyle.imageRadius} onChange={(e) => updateCustomStyle("imageRadius", Number(e.target.value))} className="w-full accent-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]" />
                                </div>
                              </div>
                            </div>
                          </div>
                            </>
                          )}
                        </div>

                      </>
                    ) : (
                      <div className={`rounded-[32px] sm:rounded-[40px] border-2 border-dashed p-12 sm:p-20 text-center font-medium ${theme === 'dark' ? 'border-white/10 bg-black/40 text-gray-500' : 'border-gray-300 bg-gray-50 text-gray-500'}`} role="status" aria-live="polite">
                        <div className="text-5xl mb-6" aria-hidden="true">??</div>
                        <p className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ei esikatselua vielä</p>
                        <p className="text-base">Täytä tiedot vasemmalla ja paina "Generoi CV", niin näet miltä työsi näyttää.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* --- TYÖPAIKAT TAB (TINDER-MALLI) --- */}
                {tab === "jobs" && (
                  <div id="panel-job" role="tabpanel" aria-labelledby="tab-job" className="space-y-12 animate-in fade-in duration-500 pb-28 sm:pb-0">
                    <div className={`rounded-[32px] sm:rounded-[40px] border p-6 sm:p-8 lg:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-all ${theme === 'dark' ? 'border-[#00BFA6]/20 bg-[linear-gradient(180deg,rgba(0,191,166,0.08),rgba(15,15,15,0.96))]' : 'border-[#00BFA6]/20 bg-[linear-gradient(180deg,rgba(0,191,166,0.08),rgba(255,255,255,0.98))]'}`}>
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00BFA6]">Työpaikka-työtila</p>
                          <h3 className={`mt-3 text-3xl sm:text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Etsi, suodata ja tallenna paikat ilman turhaa skrollausta
                          </h3>
                          <p className={`mt-3 text-sm sm:text-base leading-7 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Käytä ensin tekoälyn ehdotuksia. Lisää oma ilmoitus käsin vain silloin, kun haluat tallentaa jonkin yksittäisen paikan.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[520px]">
                          <div className={`rounded-[24px] border px-5 py-5 text-sm leading-7 ${theme === 'dark' ? 'border-white/10 bg-black/25 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-700'}`}>1. Ehdota työpaikkoja</div>
                          <div className={`rounded-[24px] border px-5 py-5 text-sm leading-7 ${theme === 'dark' ? 'border-white/10 bg-black/25 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-700'}`}>2. Suodata lista</div>
                          <div className={`rounded-[24px] border px-5 py-5 text-sm leading-7 ${theme === 'dark' ? 'border-white/10 bg-black/25 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-700'}`}>3. Tallenna parhaat</div>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 gap-3 sm:hidden">
                        <button
                          type="button"
                          onClick={() => document.getElementById("jobs-list-start")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                          className="rounded-2xl bg-[#00BFA6] px-5 py-4 text-sm font-black text-black"
                        >
                          Mene työpaikkalistaan
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setShowJobFilters((prev) => !prev)}
                            className={`rounded-[22px] border px-5 py-5 text-sm font-black transition-all ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                          >
                            {showJobFilters ? "Piilota suodatus" : "Suodatus"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowManualJobForm((prev) => !prev)}
                            className={`rounded-[22px] border px-5 py-5 text-sm font-black transition-all ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                          >
                            {showManualJobForm ? "Piilota lisäys" : "Lisää oma"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className={`rounded-[32px] border p-7 sm:p-10 space-y-12 ${theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white'}`}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 border-b pb-5">
                          <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Lisää oma työpaikka seurantaan
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowManualJobForm((prev) => !prev)}
                            className={`sm:hidden rounded-full border px-4 py-2 text-xs font-black ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
                            aria-expanded={showManualJobForm}
                          >
                            {showManualJobForm ? "Piilota" : "Avaa"}
                          </button>
                        </div>
                        <p className={`text-sm leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Lisää käsin vain jos haluat tallentaa yksittäisen oman ilmoituksen.
                        </p>
                      </div>

                      {(!isMobileViewport || showManualJobForm) && (
                      <>
                      <div className="space-y-4">
                         <label htmlFor="job-title" className={LabelClass(theme)}>Otsikko</label>
                         <input
                           id="job-title"
                           placeholder="Esim. Myyntipäällikkö"
                           value={jobForm.title}
                           onChange={(e) => updateJobForm("title", e.target.value)}
                           className={InputClass(theme)}
                         />
                      </div>

                      <div className="grid grid-cols-1 gap-y-8 sm:gap-y-9 lg:gap-x-8 lg:gap-y-10 lg:grid-cols-2">
                        <div className="space-y-4">
                           <label htmlFor="job-company" className={LabelClass(theme)}>Yritys</label>
                           <input
                             id="job-company"
                             placeholder="Esim. Nokia"
                             value={jobForm.company}
                             onChange={(e) =>
                               updateJobForm("company", e.target.value)
                             }
                             className={InputClass(theme)}
                           />
                        </div>
                        <div className="space-y-4">
                           <label htmlFor="job-location" className={LabelClass(theme)}>Sijainti</label>
                           <input
                             id="job-location"
                             placeholder="Esim. Helsinki"
                             value={jobForm.location}
                             onChange={(e) =>
                               updateJobForm("location", e.target.value)
                             }
                             className={InputClass(theme)}
                           />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-y-8 sm:gap-y-9 lg:gap-x-8 lg:gap-y-10 lg:grid-cols-2">
                        <div className="space-y-4">
                           <label htmlFor="job-type" className={LabelClass(theme)}>Työsuhde</label>
                           <input
                             id="job-type"
                             placeholder="Vakituinen"
                             value={jobForm.type}
                             onChange={(e) => updateJobForm("type", e.target.value)}
                             className={InputClass(theme)}
                           />
                        </div>
                        <div className="space-y-4">
                           <label htmlFor="job-url" className={LabelClass(theme)}>Linkki</label>
                           <input
                             id="job-url"
                             placeholder="https://..."
                             value={jobForm.url}
                             onChange={(e) => updateJobForm("url", e.target.value)}
                             className={InputClass(theme)}
                           />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-y-8 sm:gap-y-9 lg:gap-x-8 lg:gap-y-10 lg:grid-cols-2">
                        <div className="space-y-4">
                           <label htmlFor="job-salary" className={LabelClass(theme)}>Palkka</label>
                           <input
                             id="job-salary"
                             placeholder="3000 €/kk"
                             value={jobForm.salary}
                             onChange={(e) => updateJobForm("salary", e.target.value)}
                             className={InputClass(theme)}
                           />
                        </div>
                        <div className="space-y-4">
                           <label htmlFor="job-deadline" className={LabelClass(theme)}>Deadline</label>
                           <input
                             id="job-deadline"
                             type="date"
                             value={jobForm.deadline}
                             onChange={(e) =>
                               updateJobForm("deadline", e.target.value)
                             }
                             className={InputClass(theme)}
                           />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-y-8 sm:gap-y-9 lg:gap-x-8 lg:gap-y-10 lg:grid-cols-2">
                        <div className="space-y-4">
                           <label htmlFor="job-contactPerson" className={LabelClass(theme)}>Yhteyshenkilö</label>
                           <input
                             id="job-contactPerson"
                             placeholder="Matti Rekrytoija"
                             value={jobForm.contactPerson}
                             onChange={(e) =>
                               updateJobForm("contactPerson", e.target.value)
                             }
                             className={InputClass(theme)}
                           />
                        </div>
                        <div className="space-y-4">
                           <label htmlFor="job-contactEmail" className={LabelClass(theme)}>Sähköposti</label>
                           <input
                             id="job-contactEmail"
                             placeholder="matti@yritys.fi"
                             value={jobForm.contactEmail}
                             onChange={(e) =>
                               updateJobForm("contactEmail", e.target.value)
                             }
                             className={InputClass(theme)}
                           />
                        </div>
                      </div>

                      <div className="space-y-4">
                         <label htmlFor="job-summary" className={LabelClass(theme)}>Lyhyt kuvaus / muistiinpanot</label>
                         <textarea
                           id="job-summary"
                           placeholder="Mikä tässä kiinnostaa?"
                           value={jobForm.summary}
                           onChange={(e) => updateJobForm("summary", e.target.value)}
                           className={TextareaClass("min-h-[140px]", theme)}
                         />
                         <FieldHint theme={theme}>
                           Kirjoita tähän omin sanoin, miksi paikka kiinnostaa tai mitä haluat muistaa siitä myöhemmin.
                         </FieldHint>
                      </div>

                      <div className="space-y-4">
                         <label htmlFor="job-adText" className={LabelClass(theme)}>Kopioi ilmoitusteksti (Tärkeä tekoälylle)</label>
                         <textarea
                           id="job-adText"
                           placeholder="Liitä koko ilmoituksen teksti tähän. Tekoäly käyttää tätä räätälöidessään hakemustasi..."
                           value={jobForm.adText}
                           onChange={(e) => updateJobForm("adText", e.target.value)}
                           className={TextareaClass("min-h-[250px]", theme)}
                         />
                         <FieldHint theme={theme}>
                           Tämä on tärkein kenttä räätälöintiä varten. Mitä enemmän koko ilmoituksesta on täällä mukana, sitä parempi CV ja hakemus tästä syntyy.
                         </FieldHint>
                      </div>

                      <button
                        type="button"
                        onClick={addJob}
                        className="mt-6 w-full rounded-2xl bg-[#00BFA6] px-8 py-6 text-lg sm:text-xl font-black text-black transition-transform hover:scale-[1.02] active:scale-95 shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
                      >
                        + TALLENNA SEURANTAAN
                      </button>
                      </>
                      )}
                    </div>

                    <div id="jobs-list-start" className={`space-y-10 pt-10 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2">
                        <h3 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Omat työpaikat
                        </h3>
                        <input
                          aria-label="Suodata työpaikkoja"
                          value={jobFilter}
                          onChange={(e) => setJobFilter(e.target.value)}
                          placeholder="Suodata listaa..."
                          className="w-full sm:max-w-md rounded-2xl border border-white/10 bg-[#0A0A0A] px-6 py-5 text-base text-white outline-none transition-all focus:border-[#00BFA6] focus:ring-1 focus:ring-[#00BFA6] shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
                        />
                      </div>

                      {lastJobsSearchMeta && (
                        <div className={`rounded-[28px] border p-5 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00BFA6]">
                                Hakustatus
                              </p>
                              <p className={`mt-2 text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {lastJobsSearchMeta.wasCached
                                  ? "Näytetään äskeinen haku muistista"
                                  : "Työpaikat päivitetty onnistuneesti"}
                              </p>
                              <p className={`mt-2 text-sm leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {lastJobsSearchMeta.sourceSummary} · {lastJobsSearchMeta.resultCount} paikkaa · {formatRelativeSearchTime(lastJobsSearchMeta.searchedAt)} · {new Date(lastJobsSearchMeta.searchedAt).toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              {lastJobsSearchMeta.sources?.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {lastJobsSearchMeta.sources.slice(0, 4).map((source) => {
                                    const meta = getSourceMeta(source);
                                    return (
                                      <span
                                        key={source}
                                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${meta.badgeClass}`}
                                      >
                                        {meta.label}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : null}
                              <p className={`mt-3 text-xs leading-6 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                Ulkoisista lähteistä tulevissa paikoissa näet joskus ensin tiivistelmän. Avaa alkuperäinen ilmoitus, kun haluat tarkistaa koko kuvauksen ennen hakemuksen räätälöintiä.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={suggestJobs}
                              disabled={loadingJobs}
                              className="rounded-2xl border border-[#00BFA6]/30 bg-[#00BFA6]/10 px-5 py-4 text-sm font-black text-[#00BFA6] transition hover:bg-[#00BFA6] hover:text-black disabled:opacity-50"
                            >
                              {loadingJobs ? "Päivitetään..." : "Hae uudet paikat"}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mb-4 sm:hidden">
                        <button
                          type="button"
                          onClick={() => setShowJobFilters((prev) => !prev)}
                          className={`w-full rounded-2xl border px-5 py-4 text-sm font-black ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
                          aria-expanded={showJobFilters}
                        >
                          {showJobFilters ? "Piilota suodattimet" : "Näytä suodattimet"}
                        </button>
                      </div>

                      {(!isMobileViewport || showJobFilters) && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
                        <select
                          aria-label="Suodata statuksen mukaan"
                          value={jobStatusFilter}
                          onChange={(e) =>
                            setJobStatusFilter(e.target.value as "all" | JobStatus)
                          }
                          className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none focus:border-[#00BFA6] cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#00BFA6] min-h-[58px] ${theme === 'dark' ? 'border-white/10 bg-[#141414] text-white' : 'border-gray-200 bg-white text-gray-900'}`}
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
                          aria-label="Suodata prioriteetin mukaan"
                          value={jobPriorityFilter}
                          onChange={(e) =>
                            setJobPriorityFilter(
                              e.target.value as "all" | JobPriority
                            )
                          }
                          className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none focus:border-[#00BFA6] cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#00BFA6] min-h-[58px] ${theme === 'dark' ? 'border-white/10 bg-[#141414] text-white' : 'border-gray-200 bg-white text-gray-900'}`}
                        >
                          <option value="all">Kaikki prio</option>
                          <option value="low">Matala</option>
                          <option value="medium">Keskitaso</option>
                          <option value="high">Korkea</option>
                        </select>

                        <select
                          aria-label="Lajittele työpaikat"
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
                          className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none focus:border-[#00BFA6] cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#00BFA6] min-h-[58px] ${theme === 'dark' ? 'border-white/10 bg-[#141414] text-white' : 'border-gray-200 bg-white text-gray-900'}`}
                        >
                          <option value="newest">Uusimmat</option>
                          <option value="match">Match</option>
                          <option value="deadline">Deadline</option>
                          <option value="priority">Prio</option>
                          <option value="company">Yritys</option>
                        </select>

                        <button
                          type="button"
                          aria-pressed={showFavoritesOnly}
                          onClick={() => setShowFavoritesOnly((prev) => !prev)}
                          className={`w-full rounded-2xl px-5 py-4 text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6F3C] min-h-[58px] ${
                            showFavoritesOnly
                              ? "bg-[#FF6F3C] text-white shadow-[0_0_20px_rgba(255,111,60,0.5)] scale-[1.02]"
                              : theme === 'dark' ? "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1" : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:-translate-y-1"
                          }`}
                        >
                          {showFavoritesOnly ? "? Vain suosikit" : "Näytä suosikit"}
                        </button>
                      </div>
                      )}

                      {/* --- TINDER NÄKYMÄ --- */}
                      {filteredJobs.length === 0 ? (
                        <div className={`rounded-[40px] border-2 border-dashed p-12 sm:p-20 text-center font-medium ${theme === 'dark' ? 'border-white/10 bg-black/40 text-gray-500' : 'border-gray-300 bg-gray-50 text-gray-500'}`}>
                          <p className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ei tuloksia</p>
                          <p className="text-base">Sinulla ei ole vielä yhtään työpaikkaa tai suodattimet piilottavat ne.</p>
                        </div>
                      ) : activeJob ? (
                        <div className="relative pb-24 sm:pb-0">
                          {/* Edistymispalkki */}
                          <div className="mb-4 flex justify-between items-center text-sm font-bold text-gray-500">
                            <span>Työpaikka {currentJobIndex + 1} / {filteredJobs.length}</span>
                            <span className="text-[#00BFA6]">{Math.round(((currentJobIndex + 1) / filteredJobs.length) * 100)}% käyty läpi</span>
                          </div>
                          
                          {/* Tässä tulostetaan Vain YKSI kortti kerrallaan */}
                          <JobCard
                            key={activeJob.id}
                            job={activeJob}
                            isActive={true}
                            applicationsCount={activeJobLetters.length}
                            cvsCount={activeJobCvVariants.length}
                            searchTimeLabel={lastJobsSearchMeta ? formatRelativeSearchTime(lastJobsSearchMeta.searchedAt) : ""}
                            onSelect={() => {}} // Ei tarvita tinderissä
                            onRemove={() => removeJob(activeJob.id)}
                            onUpdate={(patch: Partial<JobItem>) => updateJob(activeJob.id, patch)}
                            onSparring={() => startSparring(activeJob)}
                            onSalary={() => setSalaryJob(activeJob)}
                            onAtsScan={() => runAtsScan(activeJob)}
                            onInterviewPrep={() => generateInterviewPrep(activeJob)}
                            theme={theme}
                          />

                          {/* Tinder-napit */}
                          <div className={`sticky bottom-20 sm:static flex gap-4 mt-6 rounded-[28px] border p-3 backdrop-blur-xl sm:border-0 sm:bg-transparent sm:p-0 ${theme === 'dark' ? 'border-white/10 bg-[#0F0F0F]/95' : 'border-gray-200 bg-white/95 shadow-[0_10px_30px_rgba(0,0,0,0.08)]'}`}>
                            <button
                              onClick={handleSkipJob}
                              className="flex-1 py-6 rounded-[24px] border-2 border-red-500/50 bg-red-500/10 text-red-500 font-black text-xl hover:bg-red-500 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shadow-xl"
                            >
                              ? OHITA
                            </button>
                            <button
                              onClick={() => handleSaveJob(activeJob.id)}
                              className="flex-1 py-6 rounded-[24px] bg-[#00BFA6] text-black font-black text-xl hover:scale-[1.02] active:scale-95 transition-transform shadow-[0_15px_40px_-10px_rgba(0,191,166,0.6)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
                            >
                              ?? TALLENNA
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {tab === "hakemus" && (
                  <div id="panel-letter" role="tabpanel" aria-labelledby="tab-letter" className="space-y-10 animate-in fade-in duration-500">
                    <div className={`rounded-[32px] sm:rounded-[40px] border p-6 sm:p-8 lg:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-all ${theme === 'dark' ? 'border-[#00BFA6]/20 bg-[linear-gradient(180deg,rgba(0,191,166,0.08),rgba(15,15,15,0.96))]' : 'border-[#00BFA6]/20 bg-[linear-gradient(180deg,rgba(0,191,166,0.08),rgba(255,255,255,0.98))]'}`}>
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00BFA6]">Hakemus-työtila</p>
                          <h3 className={`mt-3 text-3xl sm:text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Kirjoita hakemus ensin, avaa lisäjutut vasta myöhemmin
                          </h3>
                          <p className={`mt-3 text-sm sm:text-base leading-7 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Valitse sävy, luo hakemus ja muokkaa tekstiä. Aiemmat versiot, videohakemus ja pikaviestit pysyvät alempana, etteivät ne sotke päätyötä.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[520px]">
                          <div className={`rounded-[24px] border px-5 py-5 text-sm leading-7 ${theme === 'dark' ? 'border-white/10 bg-black/25 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-700'}`}>1. Valitse sävy</div>
                          <div className={`rounded-[24px] border px-5 py-5 text-sm leading-7 ${theme === 'dark' ? 'border-white/10 bg-black/25 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-700'}`}>2. Luo hakemus</div>
                          <div className={`rounded-[24px] border px-5 py-5 text-sm leading-7 ${theme === 'dark' ? 'border-white/10 bg-black/25 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-700'}`}>3. Muokkaa ja lataa</div>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 gap-3 sm:hidden">
                        <button
                          type="button"
                          onClick={() => document.getElementById("letter-actions")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                          className="rounded-2xl bg-[#00BFA6] px-5 py-4 text-sm font-black text-black"
                        >
                          Mene hakemukseen
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setShowLetterHistory((prev) => !prev)}
                            className={`rounded-[22px] border px-5 py-5 text-sm font-black transition-all ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                          >
                            {showLetterHistory ? "Piilota versiot" : "Versiot"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowLetterExtras((prev) => !prev)}
                            className={`rounded-[22px] border px-5 py-5 text-sm font-black transition-all ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                          >
                            {showLetterExtras ? "Piilota lisät" : "Lisätyökalut"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[32px] sm:rounded-[40px] border border-[#00BFA6]/30 bg-[#00BFA6]/5 p-6 sm:p-12 relative overflow-hidden shadow-[0_10px_30px_rgba(0,191,166,0.1)]">
                      <div className="absolute top-0 right-0 p-8 text-[#00BFA6] opacity-10 text-9xl font-black pointer-events-none leading-none" aria-hidden="true">”</div>
                      <h3 className={`text-3xl font-black mb-8 relative z-10 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Rakenna Hakemus
                      </h3>

                      {activeJob ? (
                        <div className={`mb-12 space-y-3 text-base sm:text-lg p-6 sm:p-8 rounded-3xl border relative z-10 ${theme === 'dark' ? 'bg-black/50 border-white/10 text-gray-300' : 'bg-white border-gray-200 text-gray-700 shadow-sm'}`}>
                          <p className={`flex flex-col sm:flex-row sm:gap-4 border-b pb-4 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                            <span className="font-black text-[#00BFA6] w-28 uppercase tracking-widest text-sm pt-1">Kohde:</span>
                            <span className={`font-bold text-xl sm:text-2xl mt-1 sm:mt-0 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{activeJob.title}</span>
                          </p>
                          <p className="flex flex-col sm:flex-row sm:gap-4 pt-2">
                            <span className="font-black text-[#00BFA6] w-28 uppercase tracking-widest text-sm pt-1">Yritys:</span>
                            <span className={`font-medium mt-1 sm:mt-0 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{activeJob.company || "-"}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="mb-10 p-6 sm:p-8 bg-red-950/40 border-2 border-red-900/50 rounded-3xl text-red-300 text-lg" role="alert">
                          <span className="text-3xl block mb-3" aria-hidden="true">??</span>
                          Palaa ensin <strong>Työpaikat</strong> -välilehdelle ja valitse sieltä haluamasi työpaikka jota haluat hakea.
                        </div>
                      )}

                      <div className="relative z-10">
                        <p className={LabelClass(theme)} id="letter-tone-label">
                          Sävy, jolla hakemus kirjoitetaan
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mt-4" role="group" aria-labelledby="letter-tone-label">
                          <button
                            type="button"
                            onClick={() => setLetterTone("professional")}
                            aria-pressed={letterTone === "professional"}
                            className={`w-full sm:flex-1 rounded-2xl px-6 py-5 text-base sm:text-lg font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
                              letterTone === "professional"
                                ? "border-2 border-[#00BFA6] bg-[#00BFA6] text-black shadow-[0_0_20px_rgba(0,191,166,0.4)] scale-[1.02]"
                                : theme === 'dark' ? "border border-white/10 bg-[#0A0A0A] text-white hover:bg-white/10" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            ?? Asiallinen
                          </button>
                          <button
                            type="button"
                            onClick={() => setLetterTone("warm")}
                            aria-pressed={letterTone === "warm"}
                            className={`w-full sm:flex-1 rounded-2xl px-6 py-5 text-base sm:text-lg font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
                              letterTone === "warm"
                                ? "border-2 border-[#00BFA6] bg-[#00BFA6] text-black shadow-[0_0_20px_rgba(0,191,166,0.4)] scale-[1.02]"
                                : theme === 'dark' ? "border border-white/10 bg-[#0A0A0A] text-white hover:bg-white/10" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            ?? Lämmin
                          </button>
                          <button
                            type="button"
                            onClick={() => setLetterTone("sales")}
                            aria-pressed={letterTone === "sales"}
                            className={`w-full sm:flex-1 rounded-2xl px-6 py-5 text-base sm:text-lg font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6F3C] ${
                              letterTone === "sales"
                                ? "border-2 border-[#FF6F3C] bg-[#FF6F3C] text-black shadow-[0_0_20px_rgba(255,111,60,0.4)] scale-[1.02]"
                                : theme === 'dark' ? "border border-white/10 bg-[#0A0A0A] text-white hover:bg-white/10" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            ?? Myyvä
                          </button>
                        </div>

                        <div className={`mt-6 rounded-[28px] border p-5 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-white/80'}`}>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Sävy-suosikit</p>
                              <p className={`mt-2 text-sm leading-7 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Tallenna suosikkisävy myöhempää käyttöä varten tai vaihda sitä yhdellä painalluksella.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={saveCurrentLetterTonePreset}
                              className={`rounded-2xl border px-5 py-3 text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-[#00BFA6]/30 bg-[#00BFA6]/10 text-[#7EF5E3] hover:bg-[#00BFA6]/15' : 'border-[#00BFA6]/30 bg-[#00BFA6]/10 text-[#0f766e] hover:bg-[#00BFA6]/15'}`}
                            >
                              Tallenna suosikkisävy
                            </button>
                          </div>

                          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
                            {savedLetterTonePresets.map((preset) => (
                              <div key={preset.id} className={`rounded-2xl border p-4 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{preset.name}</p>
                                    <p className={`mt-1 text-xs uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                      {getLetterToneLabel(preset.tone)}
                                    </p>
                                  </div>
                                  {preset.createdAt !== "system" && (
                                    <button
                                      type="button"
                                      onClick={() => removeLetterTonePreset(preset.id)}
                                      className={`rounded-xl px-3 py-2 text-[11px] font-black transition-all ${theme === 'dark' ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                    >
                                      Poista
                                    </button>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => applyLetterTonePreset(preset)}
                                  className="mt-4 w-full rounded-2xl bg-[#00BFA6] px-4 py-3 text-sm font-black text-black transition-transform hover:scale-[1.01]"
                                >
                                  Käytä tätä sävyä
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCoverLetterSubmit}
                        disabled={loadingLetter || !activeJob}
                        className="mt-12 w-full rounded-3xl bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] px-8 py-6 sm:py-7 text-xl sm:text-2xl font-black text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-[0_15px_40px_-10px_rgba(0,191,166,0.5)] relative z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#FF6F3C]"
                        aria-live="polite"
                      >
                        {loadingLetter
                          ? "Tekoäly kirjoittaa..."
                          : "3. KIRJOITA HAKEMUS TÄHÄN PAIKKAAN"}
                      </button>
                    </div>

                    {activeJobLetters.length > 0 && (!isMobileViewport || showLetterHistory) && (
                      <div className={`rounded-[32px] border p-6 sm:p-8 mt-10 ${theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white'}`}>
                        <h3 className={`mb-6 text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Hakemusversiot tähän paikkaan
                        </h3>
                        <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                          {activeJobLetters.map((letter, index) => (
                            <button
                              key={letter.id}
                              type="button"
                              onClick={() => {
                                setLetterResult(`HAKEMUS:\n${letter.content}`);
                                setLetterDraft(letter.content);
                                setLetterTone(safeLetterTone(letter.tone));
                              }}
                              className={`w-full rounded-2xl border px-6 py-5 text-left transition-all hover:border-[#00BFA6]/50 hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(0,191,166,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-black/50' : 'border-gray-200 bg-gray-50'}`}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <p className="font-bold text-lg text-[#00BFA6] truncate">
                                    Versio {activeJobLetters.length - index}
                                  </p>
                                  <p className={`text-base font-medium truncate mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {letter.jobTitle}
                                  </p>
                                </div>
                                <span className="inline-flex w-fit rounded-full bg-[#00BFA6]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">
                                  {getLetterToneLabel(letter.tone)}
                                </span>
                              </div>
                              <p className={`text-base font-medium truncate mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {letter.companyName}
                              </p>
                              <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                Luotu: {new Date(letter.createdAt).toLocaleString("fi-FI")}
                              </p>
                              {letter.updatedAt && letter.updatedAt !== letter.createdAt && (
                                <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                  Päivitetty: {new Date(letter.updatedAt).toLocaleString("fi-FI")}
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {letterResult ? (
                  <>
                    <div id="letter-actions" className={`rounded-[32px] sm:rounded-[40px] border p-6 sm:p-12 shadow-[0_15px_50px_rgba(0,191,166,0.15)] mt-10 ${theme === 'dark' ? 'border-[#00BFA6]/40 bg-[#0A0A0A]' : 'border-[#00BFA6]/40 bg-white'}`}>
                      
                      <div className={`mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-b pb-6 ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'}`}>
                        <div className={`flex rounded-2xl p-1 w-full sm:w-auto border ${theme === 'dark' ? 'bg-[#141414] border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                          <button
                            onClick={() => setLetterViewMode("edit")}
                            className={`flex-1 sm:flex-none px-6 py-3 text-sm font-bold rounded-xl transition-all ${letterViewMode === "edit" ? "bg-[#00BFA6] text-black shadow-md" : "text-gray-400 hover:text-gray-600"}`}
                          >
                            ?? Muokkaa tekstiä
                          </button>
                          <button
                            onClick={() => setLetterViewMode("preview")}
                            className={`flex-1 sm:flex-none px-6 py-3 text-sm font-bold rounded-xl transition-all ${letterViewMode === "preview" ? "bg-[#00BFA6] text-black shadow-md" : "text-gray-400 hover:text-gray-600"}`}
                          >
                            ?? Visuaalinen esikatselu
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={saveEditedLetter}
                          className="w-full sm:w-auto rounded-2xl border border-[#00BFA6]/50 bg-[#00BFA6]/10 px-6 py-4 sm:py-3.5 text-base font-bold text-[#00BFA6] transition-all hover:bg-[#00BFA6] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
                        >
                          Tallenna muokkaukset
                        </button>
                      </div>

                      <div className={`mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 ${theme === 'dark' ? '' : ''}`}>
                        <button
                          type="button"
                          onClick={() => applyLetterDraftPreset("tighten")}
                          className={`rounded-2xl border px-5 py-4 text-left text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-white'}`}
                        >
                          <span className="block text-xs uppercase tracking-[0.18em] text-[#00BFA6]">Pikaparannus</span>
                          <span className="mt-2 block text-base">Tiivistä</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyLetterDraftPreset("polish")}
                          className={`rounded-2xl border px-5 py-4 text-left text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-white'}`}
                        >
                          <span className="block text-xs uppercase tracking-[0.18em] text-[#00BFA6]">Pikaparannus</span>
                          <span className="mt-2 block text-base">Virallisempi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyLetterDraftPreset("warmer")}
                          className={`rounded-2xl border px-5 py-4 text-left text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-white'}`}
                        >
                          <span className="block text-xs uppercase tracking-[0.18em] text-[#00BFA6]">Pikaparannus</span>
                          <span className="mt-2 block text-base">Lämpimämpi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyLetterDraftPreset("bolder")}
                          className={`rounded-2xl border px-5 py-4 text-left text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-white'}`}
                        >
                          <span className="block text-xs uppercase tracking-[0.18em] text-[#00BFA6]">Pikaparannus</span>
                          <span className="mt-2 block text-base">Rohkeampi</span>
                        </button>
                      </div>

                      {letterViewMode === "edit" ? (
                        <textarea
                          id="letter-editor"
                          value={letterDraft}
                          onChange={(e) => setLetterDraft(e.target.value)}
                          className={`min-h-[500px] w-full rounded-3xl border p-6 sm:p-8 font-sans text-base sm:text-lg leading-relaxed outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] transition-all resize-y shadow-inner ${theme === 'dark' ? 'border-white/5 bg-black/50 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-800'}`}
                        />
                      ) : (
                        <div className={`rounded-3xl border p-4 sm:p-8 overflow-x-auto shadow-2xl custom-scrollbar ${theme === 'dark' ? 'border-white/10 bg-[#0F0F0F]' : 'border-gray-200 bg-gray-100'}`} role="region" aria-label="Hakemuksen Esikatselu">
                          {isMobileViewport ? (
                            <div
                              className="w-full overflow-hidden rounded-2xl"
                              style={{ height: `${Math.round(1123 * previewScale)}px` }}
                            >
                              <div style={{ width: "794px", transform: `scale(${previewScale})`, transformOrigin: "top left" }}>
                                <CvPreview
                                  cvText={letterDraft}
                                  image={profileImage}
                                  styleVariant={cvStyle}
                                  customStyle={customStyle}
                                  mode="letter"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="min-w-[900px]">
                              <CvPreview
                                cvText={letterDraft}
                                image={profileImage}
                                styleVariant={cvStyle}
                                customStyle={customStyle}
                                mode="letter"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* UUDET: SÄHKÖPOSTIAUTOMAATIO & VIDEOTYÖKALU */}
                      {(!isMobileViewport || showLetterExtras) && (
                      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
                          <p className={`text-sm font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Pikaviestit</p>
                          <div className="flex flex-col gap-3">
                            {[
                              { icon: "??", label: "Kysy lisätietoja tehtävästä" },
                              { icon: "??", label: "Kiitosviesti haastattelun jälkeen" },
                              { icon: "??", label: "LinkedIn-verkostoitumisviesti" },
                            ].map(({ icon, label }) => (
                              <div
                                key={label}
                                className={`flex items-center justify-between px-5 py-3 rounded-xl border text-sm font-bold ${theme === 'dark' ? 'border-white/10 bg-white/5 text-gray-500 cursor-not-allowed' : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'}`}
                              >
                                <span>{icon} {label}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#00BFA6] border border-[#00BFA6]/30 rounded-full px-2 py-0.5">Pian</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={`p-6 rounded-3xl border flex flex-col justify-center items-center text-center ${theme === 'dark' ? 'bg-[#141414] border-[#FF6F3C]/30' : 'bg-orange-50 border-orange-200'}`}>
                          <span className="text-4xl mb-3">??</span>
                          <h4 className={`text-lg font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Videohakemus-studio</h4>
                          <p className={`text-sm mb-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tekoäly luo minuutin käsikirjoituksen ja avaa teleprompterin lukemista varten.</p>
                          <button onClick={() => setTeleprompterJob(activeJob)} className="w-full rounded-xl bg-[#FF6F3C] text-black font-black py-3 hover:scale-105 transition-transform">
                            AVAA TELEPROMPTER
                          </button>
                        </div>
                      </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-5 mt-6">
                        <button
                          type="button"
                          onClick={() => copyText(letterDraft || parsedLetter, "Hakemus kopioitu leikepöydälle!")}
                          className={`flex-1 rounded-3xl border px-8 py-6 sm:py-7 text-lg sm:text-xl font-black transition-transform hover:scale-[1.02] active:scale-95 shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-gray-400 ${theme === 'dark' ? 'border-white/20 bg-white text-black' : 'border-gray-300 bg-gray-900 text-white'}`}
                        >
                          KOPIOI TEKSTI ??
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadPdf("letter-preview", true)}
                          disabled={downloadingPdf || letterViewMode === "edit"}
                          className={`flex-1 rounded-3xl px-8 py-6 sm:py-7 text-lg sm:text-xl font-black transition-transform hover:scale-[1.02] active:scale-95 shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${letterViewMode === "edit" ? 'bg-gray-600 text-gray-400 opacity-50 cursor-not-allowed' : 'bg-[#00BFA6] text-black'}`}
                        >
                          {downloadingPdf ? "Luodaan PDF..." : "LATAA PDF-HAKEMUS"}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={`rounded-[32px] sm:rounded-[40px] border-2 border-dashed p-10 sm:p-20 text-center font-medium mt-10 ${theme === 'dark' ? 'border-white/10 bg-black/40 text-gray-500' : 'border-gray-300 bg-gray-50 text-gray-500'}`}>
                    <div className="text-5xl mb-6" aria-hidden="true">??</div>
                    <p className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Hakemus puuttuu</p>
                    <p className="text-base text-gray-400">Paina ylempää nappia, niin hakemuksen teksti ilmestyy tähän.</p>
                  </div>
                )}
              </div>
            )}

            {/* VINKIT TAB */}
            {tab === "tips" && (
              <div id="panel-tips" role="tabpanel" aria-labelledby="tab-tips" className="space-y-10 animate-in fade-in duration-500 mt-10">
                <div className={`rounded-[32px] sm:rounded-[40px] border p-8 sm:p-12 shadow-[0_15px_50px_rgba(255,111,60,0.1)] ${theme === 'dark' ? 'border-[#FF6F3C]/30 bg-[#FF6F3C]/5' : 'border-[#FF6F3C]/30 bg-white'}`}>
                  <h2 className={`text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Työnhaun Tehovinkit ??</h2>
                  <p className="text-lg text-gray-400 mb-10">Lue nämä ohjeet ennen kuin lähetät seuraavan hakemuksesi, niin parannat mahdollisuuksiasi jopa 80%.</p>

                  <div className="space-y-6 sm:space-y-8">
                    <article className={`p-8 sm:p-10 rounded-3xl border shadow-inner ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                      <h3 className="text-xl font-bold text-[#FF6F3C] mb-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#FF6F3C]/20 flex items-center justify-center text-sm" aria-hidden="true">1</span> 
                        Rakenna vahva "Hook" (Koukku)
                      </h3>
                      <p className={`leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Rekrytoija lukee satoja CV:itä. Älä aloita tylsästi "Olen 24-vuotias asiakaspalvelija". 
                        Aloita mieluummin tuloksilla: <em>"Olen myyntiin erikoistunut tiimipelaaja, joka kasvatti edellisessä roolissaan asiakastyytyväisyyttä 20%."</em> 
                        Käytä Studion "Tavoiteltu rooli" -kenttää apunasi. Tekoäly kirjoittaa Profiiliisi tämän koukun, jos kerrot tarkasti mitä haluat.
                      </p>
                    </article>

                    <article className={`p-8 sm:p-10 rounded-3xl border shadow-inner ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                      <h3 className="text-xl font-bold text-[#FF6F3C] mb-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#FF6F3C]/20 flex items-center justify-center text-sm" aria-hidden="true">2</span> 
                        Kvantifioi tuloksesi (Numeroita!)
                      </h3>
                      <p className={`leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Pelkkä työtehtävien listaaminen ei riitä. Kerro <strong>mitä sait aikaan</strong>. 
                        Sijaan että kirjoitat "Olin kassalla", kirjoita "Palvelin päivittäin yli 200 asiakasta tehokkaasti kiireisessä ympäristössä." 
                        Lisää numeroita, prosentteja ja säästettyjä euroja aina kun mahdollista.
                      </p>
                    </article>

                    <article className={`p-8 sm:p-10 rounded-3xl border shadow-inner ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                      <h3 className="text-xl font-bold text-[#FF6F3C] mb-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#FF6F3C]/20 flex items-center justify-center text-sm" aria-hidden="true">3</span> 
                        Räätälöi AINA
                      </h3>
                      <p className={`leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Yksi yleinen CV ei toimi joka paikkaan. Duuniharavassa voit luoda jokaiselle työpaikalle 
                        oman, juuri siihen ilmoitukseen räätälöidyn CV-version (käytä "Räätälöi CV tähän työpaikkaan" -nappia). 
                        Varmista, että työpaikkailmoituksen avainsanat löytyvät CV:si taidoista.
                      </p>
                    </article>

                    <article className={`p-8 sm:p-10 rounded-3xl border shadow-inner ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                      <h3 className="text-xl font-bold text-[#FF6F3C] mb-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#FF6F3C]/20 flex items-center justify-center text-sm" aria-hidden="true">4</span> 
                        ATS-järjestelmien ymmärtäminen
                      </h3>
                      <p className={`leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Suuryritykset käyttävät botteja (ATS) lukemaan CV:si ennen ihmistä. Jos käytät liian monimutkaisia fontteja 
                        tai kummallisia asetteluja, botti ei osaa lukea sitä. Duuniharavan PDF-export on rakennettu siten, 
                        että teksti on aina luettavissa myös koneellisesti.
                      </p>
                    </article>

                    <article className={`p-8 sm:p-10 rounded-3xl border shadow-inner ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                      <h3 className="text-xl font-bold text-[#FF6F3C] mb-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#FF6F3C]/20 flex items-center justify-center text-sm" aria-hidden="true">5</span> 
                        Harjoittele haastattelua etukäteen
                      </h3>
                      <p className={`leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Työpaikat-listauksessa on <strong>"Treenaa"</strong>-nappi. Käytä sitä! Tekoäly simulaattori kysyy sinulta 
                        juuri niitä kysymyksiä, joita oikea rekrytoija kysyisi tuon kyseisen työpaikkailmoituksen perusteella.
                      </p>
                    </article>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ponnahdusilmoitukset (Alerts) */}
          {(message || errorMessage) && (
            <div
              role="alert"
              aria-live={errorMessage ? "assertive" : "polite"}
              className={`fixed bottom-[100px] sm:bottom-8 right-4 left-4 sm:left-auto sm:right-8 sm:max-w-md z-50 rounded-[24px] border p-5 sm:p-6 text-sm sm:text-base font-bold shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all animate-in slide-in-from-bottom-5 ${
                errorMessage
                  ? "border-red-500/30 bg-[#1f1012]/95 text-red-200 backdrop-blur-xl"
                  : "border-[#00BFA6]/30 bg-[#0f172a]/92 text-white backdrop-blur-xl"
              }`}
            >
              {errorMessage || message}
            </div>
          )}
        </section>
      </div>
    </div>{/* MODAALIT */}

    {/* ATS SCANNER */}
    {atsJob && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div role="dialog" aria-modal="true" className={`border rounded-[32px] w-full max-w-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-[#141414] border-purple-500/30' : 'bg-white border-purple-200'}`}>
          <div className={`p-6 sm:p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
            <h3 className={`font-black text-2xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>?? ATS-Skanneri</h3>
            <button onClick={() => setAtsJob(null)} className="text-gray-500 hover:text-purple-500 font-black text-2xl w-10 h-10 rounded-full flex items-center justify-center transition-colors">?</button>
          </div>
          <div className="p-6 sm:p-8 space-y-6">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Vertaa CV:täsi työpaikkailmoitukseen: <strong className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{atsJob.title}</strong></p>
            
            {isAtsScanning ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <p className="text-purple-500 font-bold animate-pulse">Tekoäly lukee CV:täsi ja ilmoitusta...</p>
              </div>
            ) : atsResult ? (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className={`${theme === 'dark' ? 'text-white/10' : 'text-gray-200'}`}
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={`${atsResult.match > 75 ? 'text-green-500' : atsResult.match > 50 ? 'text-yellow-500' : 'text-red-500'}`}
                        strokeWidth="3"
                        strokeDasharray={`${atsResult.match}, 100`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className={`absolute text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{atsResult.match}%</div>
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Osumaprosentti</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {atsResult.match > 75 ? "Loistava! CV:si on hyvin kohdistettu." : "CV:täsi kannattaa vielä hioa. Lisää puuttuvia sanoja taitoihin."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                    <h4 className="text-red-500 font-bold mb-3 flex items-center gap-2"><span>?</span> Puuttuvat avainsanat</h4>
                    <div className="flex flex-wrap gap-2">
                      {atsResult.missing.map((word, i) => (
                        <span key={i} className={`px-3 py-1 text-xs font-bold rounded-lg border ${theme === 'dark' ? 'border-red-500/30 text-red-300' : 'border-red-300 text-red-700 bg-white'}`}>{word}</span>
                      ))}
                    </div>
                  </div>
                  <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'}`}>
                    <h4 className="text-green-500 font-bold mb-3 flex items-center gap-2"><span>?</span> Löytyvät avainsanat</h4>
                    <div className="flex flex-wrap gap-2">
                      {atsResult.found.map((word, i) => (
                        <span key={i} className={`px-3 py-1 text-xs font-bold rounded-lg border ${theme === 'dark' ? 'border-green-500/30 text-green-300' : 'border-green-300 text-green-700 bg-white'}`}>{word}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )}

    {/* HAASTATTELUTÄRPIT */}
    {prepJob && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div role="dialog" aria-modal="true" className={`border rounded-[32px] w-full max-w-2xl shadow-2xl flex flex-col animate-in zoom-in-95 h-[70vh] duration-300 ${theme === 'dark' ? 'bg-[#141414] border-indigo-500/30' : 'bg-white border-indigo-200'}`}>
          <div className={`p-6 sm:p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
            <h3 className={`font-black text-2xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>? Haastattelun Tärpit</h3>
            <button onClick={() => setPrepJob(null)} className="text-gray-500 hover:text-indigo-500 font-black text-2xl w-10 h-10 rounded-full flex items-center justify-center transition-colors">?</button>
          </div>
          
          <div className="p-6 sm:p-8">
            {isPrepping ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-indigo-500 font-bold animate-pulse">Analysoidaan roolin vaatimuksia...</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Nämä ovat todennäköisimmät kysymykset, jotka tekoäly poimi <strong>{prepJob.title}</strong> -ilmoituksen perusteella.</p>
                {prepQuestions.map((item, idx) => (
                  <div key={idx} className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`font-bold text-lg mb-3 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>Q: {item.q}</p>
                    <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/20 text-gray-300' : 'bg-indigo-50 border-indigo-100 text-gray-700'}`}>
                      <span className="font-bold text-indigo-500 block mb-1">?? Vinkki vastaukseen:</span>
                      <p className="text-sm">{item.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* KÄÄNTÄJÄ */}
    {showSkillTranslator && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div role="dialog" aria-modal="true" className={`border rounded-[32px] w-full max-w-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className={`p-6 sm:p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
            <h3 className={`font-black text-2xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>? Käännä ammattikielelle</h3>
            <button onClick={() => setShowSkillTranslator(false)} className="text-gray-500 hover:text-[#00BFA6] font-black text-2xl w-10 h-10 rounded-full flex items-center justify-center transition-colors">?</button>
          </div>
          <div className="p-6 sm:p-8 space-y-6">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Kerro omin sanoin, mitä teet vapaa-ajallasi (esim. harrastukset, perhearki, yhdistystoiminta). Tekoäly kääntää sen CV-kelpoisiksi taidoiksi.</p>
            <textarea
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Esim. Hoidan 3 lapsen arjen aikataulut, treenit ja budjetin..."
              className={`w-full min-h-[120px] rounded-2xl border px-5 py-4 outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-black/50 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
            />
            {skillOutput ? (
              <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-[#00BFA6]/10 border-[#00BFA6]/30 text-gray-200' : 'bg-[#00BFA6]/10 border-[#00BFA6]/30 text-gray-800'}`}>
                <p className="text-xs font-bold text-[#00BFA6] uppercase mb-2">Johdetut taidot:</p>
                <p>{skillOutput}</p>
                <button 
                  onClick={() => {
                    updateField("skills", form.skills ? form.skills + ", " + skillOutput : skillOutput);
                    setShowSkillTranslator(false);
                    setSkillInput("");
                    setSkillOutput("");
                  }}
                  className="mt-4 w-full bg-[#00BFA6] text-black font-black py-3 rounded-xl hover:scale-[1.02] transition-transform"
                >
                  LISÄÄ CV:SEEN
                </button>
              </div>
            ) : (
              <button 
                onClick={translateSkills}
                disabled={!skillInput || isTranslating}
                className={`w-full font-black py-4 rounded-xl transition-colors ${!skillInput || isTranslating ? 'bg-gray-500 cursor-not-allowed opacity-50 text-white' : (theme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800')}`}
              >
                {isTranslating ? "Käännetään..." : "ANALYSOI"}
              </button>
            )}
          </div>
        </div>
      </div>
    )}

    {/* SÄHKÖPOSTIMALLIT */}
    {emailTemplateModal && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div role="dialog" aria-modal="true" className={`border rounded-[32px] w-full max-w-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className={`p-6 sm:p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
            <h3 className={`font-black text-2xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {emailTemplateModal.type === 'thanks' && "?? Kiitosviesti"}
              {emailTemplateModal.type === 'questions' && "?? Kysy lisätietoja"}
              {emailTemplateModal.type === 'linkedin' && "?? Verkostoitumisviesti"}
            </h3>
            <button onClick={() => setEmailTemplateModal(null)} className="text-gray-500 hover:text-[#00BFA6] font-black text-2xl w-10 h-10 rounded-full flex items-center justify-center transition-colors">?</button>
          </div>
          <div className="p-6 sm:p-8 space-y-6">
            <textarea
              readOnly
              value={emailTemplateModal.content}
              className={`w-full min-h-[250px] rounded-2xl border px-6 py-5 outline-none resize-none leading-relaxed ${theme === 'dark' ? 'bg-black/50 border-white/10 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(emailTemplateModal.content);
                setEmailTemplateModal(null);
                setMessage("Viesti kopioitu leikepöydälle!");
                setTimeout(() => setMessage(""), 2500);
              }}
              className="w-full bg-[#00BFA6] text-black font-black py-4 rounded-xl hover:scale-[1.02] transition-transform"
            >
              KOPIOI LEIKEPÖYDÄLLE
            </button>
          </div>
        </div>
      </div>
    )}

    {/* PALKKA */}
    {salaryJob && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div role="dialog" aria-modal="true" className={`border rounded-[32px] w-full max-w-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-[#141414] border-blue-500/30' : 'bg-white border-blue-200'}`}>
          <div className={`p-6 sm:p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
            <h3 className={`font-black text-2xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>?? Palkka-arvio</h3>
            <button onClick={() => setSalaryJob(null)} className="text-gray-500 hover:text-blue-500 font-black text-2xl w-10 h-10 rounded-full flex items-center justify-center transition-colors">?</button>
          </div>
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <p className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{salaryJob.title}</p>
            <div className="py-8">
              <p className="text-sm uppercase tracking-widest text-blue-500 font-bold mb-2">Markkinapalkka (Arvio)</p>
              <p className={`text-6xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>3200<span className="text-3xl text-gray-500 font-medium"> - </span>3800<span className="text-2xl text-blue-500">€</span></p>
            </div>
            <div className={`p-5 rounded-2xl border text-left ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20 text-gray-300' : 'bg-blue-50 border-blue-100 text-gray-700'}`}>
              <p className="font-bold mb-2 text-blue-500">Miten perustelet pyyntösi?</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Korosta aikaisempaa tulosvastuutasi.</li>
                <li>Sijainti ({salaryJob.location || "Pääkaupunkiseutu"}) nostaa palkkatasoa hieman.</li>
              </ul>
            </div>
            <button onClick={() => setSalaryJob(null)} className="w-full bg-blue-500 text-white font-black py-4 rounded-xl hover:bg-blue-600 transition-colors">
              SULJE
            </button>
          </div>
        </div>
      </div>
    )}

    {/* TELEPROMPTER */}
    {teleprompterJob && (
      <div className="fixed inset-0 z-[300] flex flex-col bg-black text-white p-4 sm:p-8 animate-in slide-in-from-bottom-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-black text-2xl sm:text-3xl text-[#FF6F3C]">?? Videohakemus-studio</h3>
            <p className="text-gray-400 mt-2">Lue teksti suoraan kameralle. Puhu hitaasti ja selkeästi.</p>
          </div>
          <button 
            onClick={() => setTeleprompterJob(null)} 
            className="text-gray-400 hover:text-white font-black text-2xl bg-white/10 hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F3C]"
            aria-label="Sulje teleprompter"
          >
            ?
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-[#141414] rounded-[32px] sm:rounded-[40px] border border-white/10 p-8 sm:p-16 flex flex-col items-center custom-scrollbar">
          <div className="max-w-4xl space-y-12 text-3xl sm:text-5xl font-black leading-[1.6] text-gray-300 text-center py-20">
            <p className="text-white">Hei! Olen {form.name || "[Nimesi]"}, ja haen teille <span className="text-[#FF6F3C]">{teleprompterJob.title}</span> -tehtävään.</p>
            <p>Olen seurannut yrityksenne {teleprompterJob.company || "[Yrityksen nimi]"} toimintaa jo pitkään, ja arvostan erityisesti tapaanne toimia alalla.</p>
            <p>Taustani ansiosta minulla on vahva kokemus juuri niistä asioista, joita ilmoituksessanne peräänkuulutitte.</p>
            <p>Uskon, että asenteeni ja osaamiseni tekisivät minusta loistavan lisäyksen tiimiinne.</p>
            <p className="text-[#00BFA6]">Kiitos ajastanne, ja toivottavasti pääsemme jatkamaan keskustelua haastattelussa!</p>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <button
              disabled
              className="bg-[#FF6F3C]/40 text-black/50 font-black px-10 py-5 rounded-2xl text-xl cursor-not-allowed"
              aria-disabled="true"
            >
              ?? ALOITA RULLAUS
            </button>
            <p className="text-xs text-gray-500 tracking-widest uppercase">Automaattinen rullaus — tulossa pian</p>
          </div>
        </div>
      </div>
    )}

    {/* SPARRING */}
    {sparringJob && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-title"
          className={`border rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[80vh] animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}
        >
          <div className={`p-6 sm:p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
            <div>
              <h3 id="modal-title" className={`font-black text-2xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>?? Haastattelusimulaattori</h3>
              <p className="text-sm text-[#00BFA6] mt-1 font-bold">{sparringJob.title} @ {sparringJob.company || "Yritys"}</p>
            </div>
            <button onClick={() => setSparringJob(null)} aria-label="Sulje simulaattori" className="text-gray-500 hover:text-[#00BFA6] font-black text-2xl bg-black/5 hover:bg-black/10 w-12 h-12 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]">?</button>
          </div>
          
          <div className={`flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar ${theme === 'dark' ? '' : 'bg-gray-50'}`} aria-live="polite">
            {sparringChat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-3xl p-6 ${msg.role === 'ai' ? (theme === 'dark' ? 'bg-[#00BFA6]/10 border border-[#00BFA6]/20 text-gray-200' : 'bg-[#00BFA6]/10 border border-[#00BFA6]/30 text-gray-800') : (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-900 text-white')} ${msg.role === 'ai' ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}>
                  <p className={`text-xs font-black mb-3 tracking-widest uppercase ${msg.role === 'ai' ? 'text-[#00BFA6]' : 'text-gray-400'}`}>
                    {msg.role === 'ai' ? '?? Rekrytoija' : '?? Sinä'}
                  </p>
                  <p className="leading-relaxed text-[15px]">{msg.text}</p>
                </div>
              </div>
            ))}
            
            {isSparringTyping && (
              <div className="flex justify-start" aria-label="Tekoäly kirjoittaa...">
                <div className="bg-[#00BFA6]/10 border border-[#00BFA6]/20 rounded-3xl p-4 text-[#00BFA6] text-xl font-black flex gap-1 rounded-tl-sm" aria-hidden="true">
                  <span className="animate-bounce" style={{animationDelay: "0s"}}>.</span>
                  <span className="animate-bounce" style={{animationDelay: "0.2s"}}>.</span>
                  <span className="animate-bounce" style={{animationDelay: "0.4s"}}>.</span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          <div className={`p-6 sm:p-8 border-t ${theme === 'dark' ? 'border-white/5 bg-black/50' : 'border-gray-200 bg-white'}`}>
            <form onSubmit={sendSparringMessage} className="flex gap-4">
              <label htmlFor="chat-input" className="sr-only">Viestisi</label>
              <input 
                id="chat-input"
                value={sparringMessage} 
                onChange={e => setSparringMessage(e.target.value)} 
                placeholder="Kirjoita vastauksesi tähän..." 
                className={`flex-1 rounded-2xl border px-6 py-4 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'}`} 
                disabled={isSparringTyping}
              />
              <button 
                type="submit" 
                disabled={!sparringMessage.trim() || isSparringTyping} 
                className="bg-[#00BFA6] text-black font-black px-8 rounded-2xl disabled:opacity-50 hover:scale-[1.05] active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
              >
                LÄHETÄ
              </button>
            </form>
          </div>
        </div>
      </div>
    )}

    {/* MODAALIEN KUTSUT (Home-funktion sisällä) */}
    <SettingsModal 
      isOpen={showSettings} 
      onClose={() => setShowSettings(false)} 
      theme={theme} 
      isPro={isPro} 
      onPortal={handlePortal} 
      onDeleteAccount={handleDeleteAccount}
      onLogout={handleLogout} 
    />

    <PaywallModal 
      isOpen={showPaywall} 
      onClose={() => setShowPaywall(false)} 
      theme={theme} 
      onUpgrade={handleUpgradeToPro} 
    />

    <ArchiveModal
      isOpen={showArchive}
      onClose={() => setShowArchive(false)}
      theme={theme}
      jobs={archiveJobs}
      savedLetters={sortedSavedLetters}
      savedCvVariants={sortedSavedCvVariants}
      onOpenJob={focusJobInStudio}
      onOpenLetter={openSavedLetter}
      onOpenCv={openSavedCvVariant}
    />

        <div
          aria-hidden="true"
          className="h-28 sm:hidden"
        />
      </main> 
    </div>   
  );        
}          

// ---------------------------------------------------------
// APUFUNKTIOT (Home-funktion ULKOPUOLELLA)
// ---------------------------------------------------------

function ArchiveModal({
  isOpen,
  onClose,
  theme,
  jobs,
  savedLetters,
  savedCvVariants,
  onOpenJob,
  onOpenLetter,
  onOpenCv,
}: {
  isOpen: boolean;
  onClose: () => void;
  theme: "light" | "dark";
  jobs: JobItem[];
  savedLetters: SavedLetter[];
  savedCvVariants: SavedCvVariant[];
  onOpenJob: (job: JobItem) => void;
  onOpenLetter: (letter: SavedLetter) => void;
  onOpenCv: (cv: SavedCvVariant) => void;
}) {
  if (!isOpen) return null;

  const activeJobsCount = jobs.filter((job) => !job.archived).length;
  const archivedJobsCount = jobs.filter((job) => job.archived).length;
  const [archiveQuery, setArchiveQuery] = useState("");
  const [archiveType, setArchiveType] = useState<"all" | "cv" | "letter" | "job">("all");

  const normalizedQuery = archiveQuery.trim().toLowerCase();

  const filteredSavedCvVariants = savedCvVariants.filter((cv) => {
    if (archiveType !== "all" && archiveType !== "cv") return false;
    if (!normalizedQuery) return true;
    return [cv.jobTitle, cv.companyName, cv.content]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const filteredSavedLetters = savedLetters.filter((letter) => {
    if (archiveType !== "all" && archiveType !== "letter") return false;
    if (!normalizedQuery) return true;
    return [letter.jobTitle, letter.companyName, letter.content, letter.tone]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const filteredArchiveJobs = jobs.filter((job) => {
    if (archiveType !== "all" && archiveType !== "job") return false;
    if (!normalizedQuery) return true;
    return [
      job.title,
      job.company,
      job.location,
      job.summary,
      job.source,
      job.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const latestItems = [
    savedCvVariants[0]
      ? {
          id: `cv-${savedCvVariants[0].id}`,
          kind: "CV",
          title: savedCvVariants[0].jobTitle,
          subtitle: savedCvVariants[0].companyName,
          date: savedCvVariants[0].createdAt,
          action: () => onOpenCv(savedCvVariants[0]),
        }
      : null,
    savedLetters[0]
      ? {
          id: `letter-${savedLetters[0].id}`,
          kind: "Hakemus",
          title: savedLetters[0].jobTitle,
          subtitle: savedLetters[0].companyName,
          date: savedLetters[0].updatedAt || savedLetters[0].createdAt,
          action: () => onOpenLetter(savedLetters[0]),
        }
      : null,
    jobs[0]
      ? {
          id: `job-${jobs[0].id}`,
          kind: jobs[0].archived ? "Työpaikka · arkisto" : "Työpaikka",
          title: jobs[0].title || "Nimetön työpaikka",
          subtitle: jobs[0].company || "Tallennettu paikka",
          date: jobs[0].appliedAt || jobs[0].deadline || new Date().toISOString(),
          action: () => onOpenJob(jobs[0]),
        }
      : null,
  ]
    .filter(Boolean)
    .sort((a, b) => `${b!.date}`.localeCompare(`${a!.date}`))
    .slice(0, 3) as Array<{
      id: string;
      kind: string;
      title: string;
      subtitle: string;
      date: string;
      action: () => void;
    }>;

  return (
    <div className="fixed inset-0 z-[520] flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className={`w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-6xl overflow-hidden rounded-none sm:rounded-[32px] border-0 sm:border shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-[#141414] sm:border-white/10 text-white' : 'bg-white sm:border-gray-200 text-gray-900'}`}>
        <div className={`sticky top-0 z-10 flex items-start justify-between gap-4 p-5 sm:p-8 border-b ${theme === 'dark' ? 'border-white/10 bg-[#141414]/95' : 'border-gray-200 bg-white/95'} backdrop-blur-xl`}>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00BFA6]">Tallennekeskus</p>
            <h2 className="mt-2 text-xl sm:text-3xl font-black tracking-tight">Täältä löydät vanhat CV:t, hakemukset ja työpaikat</h2>
            <p className={`mt-2 text-sm sm:text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Avaa mikä tahansa tallenne takaisin studioon yhdellä painalluksella.
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 w-11 h-11 rounded-full border border-white/10 text-2xl font-black text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            ?
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 sm:space-y-8 custom-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className={`rounded-3xl border p-5 ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-gray-50'}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">CV-versiot</p>
              <p className="mt-3 text-3xl sm:text-4xl font-black">{savedCvVariants.length}</p>
            </div>
            <div className={`rounded-3xl border p-5 ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-gray-50'}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">Hakemukset</p>
              <p className="mt-3 text-3xl sm:text-4xl font-black">{savedLetters.length}</p>
            </div>
            <div className={`rounded-3xl border p-5 ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-gray-50'}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">Aktiiviset työpaikat</p>
              <p className="mt-3 text-3xl sm:text-4xl font-black">{activeJobsCount}</p>
            </div>
            <div className={`rounded-3xl border p-5 ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-gray-50'}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">Arkistoidut työpaikat</p>
              <p className="mt-3 text-3xl sm:text-4xl font-black">{archivedJobsCount}</p>
            </div>
          </div>

          <div className={`rounded-[28px] border p-5 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-white'}`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">Jatka tästä</p>
                <h3 className="mt-2 text-xl sm:text-2xl font-black">Viimeksi muokatut tallenteet ja nopea haku</h3>
                <p className={`mt-2 text-sm leading-7 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Löydä nopeasti vanha CV, hakemus tai työpaikka ilman pitkää selaamista.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-[520px]">
                <input
                  value={archiveQuery}
                  onChange={(e) => setArchiveQuery(e.target.value)}
                  placeholder="Hae nimellä, yrityksellä tai sisällöllä..."
                  className={`w-full rounded-2xl border px-5 py-4 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white placeholder:text-gray-500' : 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400'}`}
                />
                <select
                  value={archiveType}
                  onChange={(e) => setArchiveType(e.target.value as "all" | "cv" | "letter" | "job")}
                  className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'}`}
                >
                  <option value="all">Kaikki tallenteet</option>
                  <option value="cv">Vain CV:t</option>
                  <option value="letter">Vain hakemukset</option>
                  <option value="job">Vain työpaikat</option>
                </select>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
              {latestItems.length > 0 ? latestItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className={`rounded-2xl border px-5 py-5 text-left transition-all hover:-translate-y-1 hover:border-[#00BFA6]/50 ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-gray-50'}`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">{item.kind}</p>
                  <p className={`mt-2 text-lg font-black truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                  <p className={`mt-1 text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{item.subtitle}</p>
                  <p className={`mt-3 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                    Viimeisin tallenne {new Date(item.date).toLocaleString("fi-FI")}
                  </p>
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">Jatka tästä</p>
                </button>
              )) : (
                <div className={`lg:col-span-3 rounded-2xl border border-dashed px-4 py-5 text-sm leading-6 ${theme === 'dark' ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
                  Tallennekeskus täyttyy sitä mukaa kun luot CV-versioita, hakemuksia ja tallennettuja työpaikkoja.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            <section className={`rounded-[28px] border p-5 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-white'}`}>
              <div className="mb-4">
                <h3 className="text-xl font-black">CV-versiot</h3>
                <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Avaa aiemmin räätälöity CV takaisin muokkaukseen.</p>
              </div>
              <div className="space-y-3 max-h-[320px] sm:max-h-[420px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                {filteredSavedCvVariants.length > 0 ? filteredSavedCvVariants.map((cv) => (
                  <button
                    key={cv.id}
                    type="button"
                    onClick={() => onOpenCv(cv)}
                    className={`w-full rounded-2xl border px-5 py-4 text-left transition-all hover:-translate-y-1 hover:border-[#00BFA6]/50 ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-gray-50'}`}
                  >
                    <p className="font-black text-[#00BFA6] truncate">{cv.jobTitle}</p>
                    <p className={`mt-1 text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{cv.companyName}</p>
                    <p className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Tallennettu {new Date(cv.createdAt).toLocaleString("fi-FI")}</p>
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">Avaa CV takaisin studioon</p>
                  </button>
                )) : (
                  <p className={`rounded-2xl border border-dashed px-4 py-5 text-sm leading-6 ${theme === 'dark' ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
                    Tällä haulla ei löytynyt CV-versioita.
                  </p>
                )}
              </div>
            </section>

            <section className={`rounded-[28px] border p-5 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-white'}`}>
              <div className="mb-4">
                <h3 className="text-xl font-black">Hakemukset</h3>
                <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Palaa aiempiin hakemusversioihin ja jatka siitä mihin jäit.</p>
              </div>
              <div className="space-y-3 max-h-[320px] sm:max-h-[420px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                {filteredSavedLetters.length > 0 ? filteredSavedLetters.map((letter) => (
                  <button
                    key={letter.id}
                    type="button"
                    onClick={() => onOpenLetter(letter)}
                    className={`w-full rounded-2xl border px-5 py-4 text-left transition-all hover:-translate-y-1 hover:border-[#00BFA6]/50 ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-gray-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-[#00BFA6] truncate">{letter.jobTitle}</p>
                        <p className={`mt-1 text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{letter.companyName}</p>
                      </div>
                      {letter.tone && (
                        <span className="shrink-0 rounded-full bg-[#00BFA6]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#00BFA6]">
                          {getLetterToneLabel(letter.tone)}
                        </span>
                      )}
                    </div>
                    <p className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                      Viimeksi muokattu {new Date(letter.updatedAt || letter.createdAt).toLocaleString("fi-FI")}
                    </p>
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">Avaa hakemus takaisin studioon</p>
                  </button>
                )) : (
                  <p className={`rounded-2xl border border-dashed px-4 py-5 text-sm leading-6 ${theme === 'dark' ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
                    Tällä haulla ei löytynyt hakemuksia.
                  </p>
                )}
              </div>
            </section>

            <section className={`rounded-[28px] border p-5 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-white'}`}>
              <div className="mb-4">
                <h3 className="text-xl font-black">Työpaikat</h3>
                <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Avaa tallennettu paikka takaisin seurantaan tai jatka hakemista.</p>
              </div>
              <div className="space-y-3 max-h-[320px] sm:max-h-[420px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                {filteredArchiveJobs.length > 0 ? filteredArchiveJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => onOpenJob(job)}
                    className={`w-full rounded-2xl border px-5 py-4 text-left transition-all hover:-translate-y-1 hover:border-[#00BFA6]/50 ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-gray-50'}`}
                  >
                    {(() => {
                      const sourceMeta = getSourceMeta(job.source);
                      return (
                        <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-[#00BFA6] truncate">{job.title || "Nimetön työpaikka"}</p>
                        <p className={`mt-1 text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{[job.company, job.location].filter(Boolean).join(" · ")}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${job.archived ? 'bg-gray-500/15 text-gray-400' : 'bg-[#00BFA6]/10 text-[#00BFA6]'}`}>
                        {job.archived ? 'Arkistoitu' : 'Aktiivinen'}
                      </span>
                    </div>
                    <p className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                      {getStatusLabel(job.status)} · {getPriorityLabel(job.priority)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${sourceMeta.badgeClass}`}>
                        {sourceMeta.label}
                      </span>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        {sourceMeta.note}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-[#00BFA6]">Avaa työpaikka takaisin seurantaan</p>
                        </>
                      );
                    })()}
                  </button>
                )) : (
                  <p className={`rounded-2xl border border-dashed px-4 py-5 text-sm leading-6 ${theme === 'dark' ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
                    Tällä haulla ei löytynyt työpaikkoja.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ 
  isOpen, onClose, theme, isPro, onPortal, onDeleteAccount, onLogout 
}: { 
  isOpen: boolean; onClose: () => void; theme: "light" | "dark"; isPro: boolean; 
  onPortal: () => void; onDeleteAccount: () => void; onLogout: () => void; 
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-lg rounded-[32px] border p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 ${theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
        <div className="flex items-start justify-between gap-4 mb-8 border-b pb-4 border-gray-500/20">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00BFA6]">Tilin hallinta</p>
            <h2 className="mt-2 text-2xl font-black">Tilin asetukset</h2>
            <p className={`mt-2 text-sm leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Täältä hoidat jäsenyyden, uloskirjautumisen ja tilin poistamisen rauhassa yhdestä paikasta.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-2xl font-black">?</button>
        </div>
        <div className="space-y-6 sm:space-y-8">
          <div className={`p-5 sm:p-6 rounded-[26px] border ${isPro ? 'border-[#00BFA6]/30 bg-[#00BFA6]/5' : (theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100')}`}>
            <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 font-sans">Nykyinen jäsenyys</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className={`text-xl font-black ${isPro ? 'text-[#00BFA6]' : 'text-gray-400'}`}>{isPro ? "? PRO-JÄSENYYS" : "Ilmaisversio"}</span>
                <p className={`mt-2 text-sm leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isPro
                    ? "Kaikki tärkeimmät työkalut, tallenteet ja räätälöinnit ovat käytössäsi."
                    : "Voit käyttää perustyökaluja ja päivittää PROhon, kun haluat enemmän versioita ja lisätyökaluja."}
                </p>
              </div>
              {isPro && <button onClick={onPortal} className="text-xs font-bold text-[#00BFA6] underline">Hallitse</button>}
            </div>
          </div>
          <div className={`rounded-[26px] border p-5 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'}`}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00BFA6]">Turvallinen jatkaminen</p>
            <p className={`mt-3 text-sm leading-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Kun kirjaudut ulos, tallenteet, CV:t ja hakemukset säilyvät tililläsi. Voit palata myöhemmin takaisin samaan työtilaan.
            </p>
          </div>
          <button onClick={onLogout} className={`w-full py-4 rounded-2xl font-black text-sm border ${theme === 'dark' ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'}`}>?? Kirjaudu ulos</button>
          <div className="pt-5 border-t border-red-500/20 text-center">
            <button onClick={onDeleteAccount} className="text-red-500 text-xs font-bold hover:underline opacity-70 transition-opacity">Poista tili ja tilaus välittömästi</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaywallModal({ 
  isOpen, 
  onClose, 
  theme, 
  onUpgrade 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  theme: "light" | "dark"; 
  onUpgrade: () => void; 
}) {
  if (!isOpen) return null;

  // Lista ominaisuuksista, jotka esitellään
  const features = [
    { icon: "?", title: "Taikasauva-editori", desc: "Muokkaa tekstiä lennosta tekoälyllä suoraan esikatselussa." },
    { icon: "??", title: "Rajattomat asiakirjat", desc: "Luo ja räätälöi niin monta CV:tä ja hakemusta kuin tarvitset." },
    { icon: "??", title: "Täydellinen räätälöinti", desc: "Räätälöi CV:si automaattisesti vastaamaan työpaikkailmoituksen vaatimuksia." },
    { icon: "??", title: "Haastattelusimulaattori", desc: "Harjoittele työhaastattelua varten räätälöidyillä kysymyksillä." },
  ];

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className={`w-full max-w-2xl rounded-[40px] border p-2 shadow-2xl animate-in zoom-in-95 duration-400 overflow-hidden ${theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
        
        {/* Yläosa - Gradientti tausta ja otsikko */}
        <div className="bg-gradient-to-br from-[#00BFA6] to-[#009581] rounded-[32px] p-8 sm:p-10 text-center relative overflow-hidden">
          {/* Koristeympyrä taustalla */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          
          <button onClick={onClose} className="absolute top-6 right-6 text-black/60 hover:text-white transition-colors z-10 p-2 focus-visible:outline-none">
            <span className="font-black text-2xl">?</span>
          </button>
          
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white mb-6 backdrop-blur-sm">
            <span className="text-4xl" aria-hidden="true">??</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-3">Vapauta täysi potentiaalisi</h2>
          <p className="text-white/90 text-base sm:text-lg font-medium max-w-md mx-auto leading-relaxed">
            Olet käyttänyt ilmaisen kokeilusi (1/1). Päivitä PRO-tasolle ja tee työhaustasi helpompaa ja tehokkaampaa.
          </p>
        </div>

        {/* Alaosa - Ominaisuuslista ja tilausnappi */}
        <div className="p-8 sm:p-10">
          <div className={`mb-8 rounded-[28px] border p-5 sm:p-6 text-left ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00BFA6]">Mitä saat käytännössä</p>
            <p className={`mt-3 text-sm sm:text-base leading-7 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              PRO sopii parhaiten silloin, kun teet useita hakemuksia, haluat tallentaa eri versioita ja käyttää työnhaun lisätyökaluja ilman rajoituksia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mb-10">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00BFA6]/10 text-2xl" aria-hidden="true">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-0.5">{feature.title}</h4>
                  <p className="text-sm opacity-70 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`p-6 rounded-3xl border text-center ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
            <p className="text-5xl font-black tracking-tight mb-2">
              9,90 € <span className="text-lg opacity-60 font-bold">/ kk</span>
            </p>
            <p className="text-sm opacity-60 mb-6 font-medium">Laskutetaan kuukausittain. Peruuta milloin tahansa.</p>
            
            <button 
              onClick={onUpgrade}
              className="w-full rounded-2xl bg-gradient-to-r from-[#00BFA6] to-[#00DF9F] py-5 text-xl font-black text-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#00BFA6]/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00BFA6]/50"
            >
              ALOITA PRO-TILAUS ?
            </button>
            
            <button 
              onClick={onClose}
              className="mt-4 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity p-2"
            >
              Ehkä myöhemmin
            </button>

            <p className="mt-4 text-xs leading-6 opacity-60">
              Tallenteet ja nykyinen työtilasi säilyvät tililläsi. Päivitys vaikuttaa vain käytössä oleviin ominaisuuksiin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

