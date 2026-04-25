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
  id,
  step,
  title,
  description,
  action,
  children,
  theme
}: {
  id?: string;
  step: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  theme: "light" | "dark";
}) {
  return (
    <details 
      id={id} 
      className={`group mb-8 sm:mb-16 rounded-[32px] sm:rounded-[40px] border p-6 sm:p-14 shadow-2xl backdrop-blur-xl transition-colors scroll-mt-24 ${theme === 'dark' ? 'border-white/10 bg-[#141414]' : 'border-gray-200 bg-white'}`} 
      open
    >
      <summary className={`list-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b pb-6 sm:pb-8 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] rounded-xl [&::-webkit-details-marker]:hidden ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
        <div className="w-full sm:w-auto flex justify-between items-center">
          <div>
            <p className="text-[11px] sm:text-[13px] font-black uppercase tracking-[0.24em] text-[#00BFA6]" aria-hidden="true">
              {step}
            </p>
            <h2 id={`section-heading-${step}`} className={`mt-2 sm:mt-3 text-2xl sm:text-4xl font-black tracking-tight md:text-[38px] transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h2>
          </div>
          {/* Mobiilin haitarinuoli, jotta käyttäjä tajuaa että laatikon voi sulkea */}
          <div className={`sm:hidden flex items-center justify-center w-10 h-10 rounded-full border transition-transform group-open:rotate-180 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
            ▼
          </div>
        </div>
        
        {/* Action nappi (esim Tyhjennä) */}
        <div className="w-full sm:w-auto hidden group-open:block" onClick={(e) => e.stopPropagation()}>
          {action}
        </div>
      </summary>

      <div className="mt-8 animate-in fade-in duration-300">
        {description ? (
          <p className={`mb-8 max-w-2xl text-base sm:text-lg leading-relaxed transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
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
  return `w-full rounded-2xl border px-6 py-5 text-base outline-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] min-h-[60px] ${
    theme === "dark"
      ? "border-white/10 bg-black/50 text-white placeholder:text-gray-600 focus:border-[#00BFA6]"
      : "border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#00BFA6]"
  }`;
}

function TextareaClass(minHeight: string, theme: "light" | "dark") {
  return `w-full rounded-2xl border px-6 py-5 text-base outline-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] shadow-inner ${minHeight} ${
    theme === "dark"
      ? "border-white/10 bg-black/50 text-white placeholder:text-gray-600 focus:border-[#00BFA6]"
      : "border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#00BFA6]"
  }`;
}

function LabelClass(theme: "light" | "dark") {
  return `mb-3 block text-sm font-bold ml-1 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-700'}`;
}

function JobCard({ job, isActive, applicationsCount, cvsCount, onSelect, onRemove, onUpdate, onSparring, onSalary, theme }: any) {
  const score = safeMatchScore(job.matchScore);
  const daysLeft = daysUntil(job.deadline);

  return (
    <article
      className={`rounded-[32px] border p-6 sm:p-10 transition-all duration-300 ${
        isActive
          ? (theme === 'dark' ? "border-[#00BFA6]/50 bg-[#00BFA6]/5 shadow-[0_10px_30px_-10px_rgba(0,191,166,0.2)]" : "border-[#00BFA6]/50 bg-[#00BFA6]/5 shadow-[0_10px_30px_-10px_rgba(0,191,166,0.2)]")
          : (theme === 'dark' ? "border-white/10 bg-[#141414] hover:border-white/20 hover:-translate-y-1" : "border-gray-200 bg-white hover:border-gray-300 hover:-translate-y-1")
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            {job.source && (
              <span className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-gray-100 text-gray-600'}`}>
                {job.source}
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
          </div>

          <h4 className={`text-3xl sm:text-4xl font-black tracking-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {job.title || "Nimetön työpaikka"}
          </h4>

          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {[job.company, job.location, job.type].filter(Boolean).join(" · ")}
          </p>
        </div>

        {/* MOBIILIOPTIMOITU NAPPIRIVISTÖ */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full lg:w-auto pt-6 lg:pt-0 border-t border-transparent lg:border-none mt-4 lg:mt-0">
          <button
            type="button"
            onClick={() => onUpdate({ favorite: !job.favorite })}
            aria-pressed={job.favorite}
            className={`w-full sm:w-auto rounded-2xl px-6 py-5 sm:py-4 text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
              job.favorite
                ? "bg-[#FF6F3C] text-white shadow-[0_0_15px_rgba(255,111,60,0.4)] hover:bg-[#FF6F3C]/80"
                : (theme === 'dark' ? "border border-white/10 bg-white/5 text-white hover:bg-white/10" : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100")
            }`}
          >
            {job.favorite ? "★ Suosikki" : "☆ Suosikiksi"}
          </button>

          <button
            type="button"
            onClick={onSelect}
            aria-pressed={isActive}
            className={`w-full sm:w-auto rounded-2xl px-6 py-5 sm:py-4 text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
              isActive
                ? (theme === 'dark' ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "bg-gray-900 text-white shadow-[0_0_20px_rgba(0,0,0,0.2)]")
                : (theme === 'dark' ? "border border-white/10 bg-white/5 text-white hover:bg-white/10" : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100")
            }`}
          >
            {isActive ? "✓ Valittu" : "Valitse paikka"}
          </button>

          <button
            type="button"
            onClick={onSalary}
            aria-label={`Tarkista palkkataso työpaikkaan ${job.title}`}
            className="w-full sm:w-auto rounded-2xl border border-blue-500/50 bg-blue-500/10 px-6 py-5 sm:py-4 text-base font-bold text-blue-400 transition hover:bg-blue-500 hover:text-white shadow-[0_0_15px_rgba(59,130,246,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
          >
            💰 Palkka-arvio
          </button>

          <button
            type="button"
            onClick={onSparring}
            aria-label={`Treenaa haastattelua työpaikkaan ${job.title}`}
            className="w-full sm:w-auto rounded-2xl border border-[#00BFA6]/50 bg-[#00BFA6]/10 px-6 py-5 sm:py-4 text-base font-bold text-[#00BFA6] transition hover:bg-[#00BFA6] hover:text-black shadow-[0_0_15px_rgba(0,191,166,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
          >
            🎤 Treenaa
          </button>

          <button
            type="button"
            onClick={onRemove}
            aria-label={`Poista työpaikka ${job.title}`}
            className={`w-full sm:w-auto rounded-2xl border px-6 py-5 sm:py-4 text-base font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 ${theme === 'dark' ? 'border-red-900/50 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
          >
            Poista
          </button>
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

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={`rounded-3xl border p-6 ${theme === 'dark' ? 'border-white/10 bg-black/40' : 'border-gray-100 bg-gray-50'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-[0.15em] mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            Yritys
          </p>
          <p className={`text-lg font-black truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {job.company || "-"}
          </p>
        </div>

        <div className={`rounded-3xl border p-6 ${theme === 'dark' ? 'border-white/10 bg-black/40' : 'border-gray-100 bg-gray-50'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-[0.15em] mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            Sijainti
          </p>
          <p className={`text-lg font-black truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {job.location || "-"}
          </p>
        </div>

        <div className={`rounded-3xl border p-6 ${theme === 'dark' ? 'border-white/10 bg-black/40' : 'border-gray-100 bg-gray-50'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-[0.15em] mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            Hakemukset
          </p>
          <p className="text-xl font-black text-[#00BFA6]">
            {applicationsCount}
          </p>
        </div>

        <div className={`rounded-3xl border p-6 ${theme === 'dark' ? 'border-white/10 bg-black/40' : 'border-gray-100 bg-gray-50'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-[0.15em] mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            CV-versiot
          </p>
          <p className="text-xl font-black text-[#FF6F3C]">{cvsCount}</p>
        </div>
      </div>

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

      {job.url && (
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className="mt-10 flex w-full justify-center rounded-2xl border border-[#00BFA6]/30 bg-[#00BFA6]/10 px-8 py-6 text-lg font-black text-[#00BFA6] transition hover:bg-[#00BFA6] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
        >
          AVAA ALKUPERÄINEN ILMOITUS ➔
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

  const [mode, setMode] = useState<"improve" | "create">("improve");
  const [tab, setTab] = useState<Tab>("cv");
  const [letterViewMode, setLetterViewMode] = useState<"edit" | "preview">("edit"); // UUSI
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

  // UUDET MODAALIT TILAT
  const [sparringJob, setSparringJob] = useState<JobItem | null>(null);
  const [sparringMessage, setSparringMessage] = useState("");
  const [sparringChat, setSparringChat] = useState<{role: "ai" | "user", text: string}[]>([]);
  const [isSparringTyping, setIsSparringTyping] = useState(false);
  
  const [salaryJob, setSalaryJob] = useState<JobItem | null>(null);
  const [teleprompterJob, setTeleprompterJob] = useState<JobItem | null>(null);
  const [showSkillTranslator, setShowSkillTranslator] = useState(false);
  const [showCareerPath, setShowCareerPath] = useState(false);
  const [showPublicLink, setShowPublicLink] = useState(false);
  const [emailTemplateModal, setEmailTemplateModal] = useState<{type: string, content: string} | null>(null);
  
  // Nämä ovat mock-arvoja ja -tiloja uusia ominaisuuksia varten
  const [skillInput, setSkillInput] = useState("");
  const [skillOutput, setSkillOutput] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [careerGoal, setCareerGoal] = useState("");
  const [careerPlan, setCareerPlan] = useState<string[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null); 

  const customStyle = customStyles[cvStyle];

  // Profiilin valmiusasteen laskenta (Pelillistäminen)
  const profileCompletion = useMemo(() => {
    const fields = [form.name, form.phone, form.email, form.location, form.targetJob, form.education, form.experience, form.languages, form.skills, form.projects];
    const filled = fields.filter(f => f && f.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

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
        if (pRes.status === 401 || pRes.status === 403) {
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
            projects: form.projects,
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

  const downloadPdf = async (elementId: string = "cv-preview", isLetter: boolean = false) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;

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

      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.setFillColor(customStyle.mainBg);
        pdf.rect(0, 0, pdfWidth, pageHeight, "F");
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`duuniharava-${isLetter ? 'hakemus' : 'cv'}-${cvStyle}.pdf`);
      
      setMessage("PDF ladattu onnistuneesti koneellesi!");
      setTimeout(() => setMessage(""), 3500);

    } catch (error) {
      console.error(error);
      setErrorMessage("Virhe PDF-luonnissa. Yritä ladata sivu uudelleen.");
    } finally {
      setDownloadingPdf(false);
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
        setErrorMessage("Ilmaisversion kokeilukerrat (3 kpl) on käytetty. Päivitä Pro-tasolle jatkaaksesi!");
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
        setErrorMessage("Ilmaisversion kokeilukerrat (3 kpl) on käytetty. Päivitä Pro-tasolle jatkaaksesi!");
        setLoadingCv(false);
        return;
      }

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
        setErrorMessage("Ilmaisversion kokeilukerrat (3 kpl) on käytetty. Päivitä Pro-tasolle jatkaaksesi!");
        setLoadingLetter(false);
        return;
      }

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

  async function handleUpgradeToPro() {
    const session = getSession();
    if (!session) {
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
      if (data.url) {
        window.location.href = data.url; 
      } else {
        setErrorMessage("Maksuikkunan avaus epäonnistui.");
      }
    } catch (error) {
      setErrorMessage("Virhe yhteydessä maksupalveluun.");
    }
  }

  // Näytetään sähköpostimallin sisältö modaalissa
  function handleEmailTemplate(type: "thanks" | "questions" | "linkedin") {
    if (!activeJob) return;
    
    let content = "";
    if (type === "thanks") {
      content = `Hei [Rekrytoijan nimi],\n\nKiitos vielä mielenkiintoisesta haastattelusta ja mahdollisuudesta tutustua paremmin yritykseen ${activeJob.company || "yrityksessänne"}!\n\nKeskustelumme vahvisti entisestään kiinnostustani ${activeJob.title} -tehtävää kohtaan. Odotan innolla, että kuulen teistä hakuprosessin edetessä.\n\nYstävällisin terveisin,\n${form.name}`;
    } else if (type === "questions") {
      content = `Hei [Rekrytoijan nimi],\n\nHuomasin avoimen ${activeJob.title} -tehtävänne ja minulla heräsi pari lyhyttä kysymystä ennen hakemukseni lähettämistä.\n\n[Kirjoita tähän 1-2 täsmällistä kysymystä]\n\nKiitos jo etukäteen ajastanne!\n\nYstävällisin terveisin,\n${form.name}`;
    } else if (type === "linkedin") {
      content = `Hei [Rekrytoijan nimi], huomasin avoimen ${activeJob.title} -tehtävänne ${activeJob.company ? `${activeJob.company}lla` : "yrityksessänne"}. Olen erittäin kiinnostunut roolista ja laitoinkin jo hakemukseni tulemaan. Olisi hienoa verkostoitua täällä LinkedInissä! Ystävällisin terveisin, ${form.name}`;
    }
    
    setEmailTemplateModal({ type, content });
  }

  if (isAuthChecking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0F0F0F] text-white">
        <p className="text-[#00BFA6] font-black text-2xl animate-pulse tracking-widest uppercase" aria-live="polite">Ladataan studiota...</p>
      </main>
    );
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
      <main className="min-h-screen bg-[#0F0F0F] text-white overflow-x-hidden font-sans pb-32 sm:pb-10 transition-colors duration-300">
        
        {/* MOBIILIN PIKANAVIGOINTI (Näkyy vain puhelimella) */}
        <nav className={`fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center p-3 pb-safe border-t sm:hidden backdrop-blur-xl transition-colors ${theme === 'dark' ? 'bg-[#0A0A0A]/90 border-white/10' : 'bg-white/90 border-gray-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]'}`} aria-label="Mobiilin pikavalikko">
          <a href="#hakijan-tiedot" className={`flex flex-col items-center gap-1 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] rounded-lg p-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <span className="text-xl" aria-hidden="true">👤</span> Tiedot
          </a>
          <a href="#tyonhaku" className={`flex flex-col items-center gap-1 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] rounded-lg p-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <span className="text-xl" aria-hidden="true">🔍</span> Hae
          </a>
          <a href="#studio-tulokset" className={`flex flex-col items-center gap-1 text-xs font-bold text-[#00BFA6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] rounded-lg p-1`}>
            <span className="text-xl" aria-hidden="true">✨</span> Tulokset
          </a>
        </nav>

        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-zinc-900/50 to-transparent" aria-labelledby="hero-heading">
          <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,191,166,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,111,60,0.1),transparent_30%)] ${theme === 'light' ? 'opacity-50' : ''}`} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_35%,rgba(0,0,0,0.3))]" />
          
          <div className="relative mx-auto max-w-7xl px-8 py-14 md:py-20 lg:px-12">
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
              <div className="flex items-center gap-4">
                <span className="font-black text-3xl tracking-tighter"><span className="text-[#00BFA6]">DUUNI</span><span className="text-[#FF6F3C]">HARAVA</span></span>
                <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">Studio</div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:w-auto">
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-black text-gray-400 hover:bg-white/5 hover:text-white transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
                  aria-label={theme === 'light' ? 'Vaihda tummaan teemaan' : 'Vaihda vaaleaan teemaan'}
                >
                  {theme === 'light' ? '🌙 TUMMA TEEMA' : '☀️ VAALEA TEEMA'}
                </button>
                <button
                  onClick={() => {
                    clearSession();
                    router.push("/login");
                  }}
                  className="rounded-2xl border border-white/10 px-8 py-3 text-sm font-black text-gray-400 hover:bg-white/5 hover:text-white transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
                >
                  KIRJAUDU ULOS
                </button>
              </div>
            </div>

            <div className="grid gap-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <h1 id="hero-heading" className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-8">
                  Tee työhausta <span className="text-[#00BFA6]">helppoa.</span>
                </h1>

                <p className="text-xl text-gray-400 max-w-xl leading-relaxed mb-12">
                  Luo upea CV, löydä avoimet työpaikat ja anna tekoälyn kirjoittaa hakemukset puolestasi. Kaikki yhdessä näkymässä.
                </p>

                <div className="flex flex-col sm:flex-row gap-5">
                  <button
                    type="button"
                    onClick={() => setShowHelp(!showHelp)}
                    className="bg-[#00BFA6]/10 border border-[#00BFA6]/40 text-[#00BFA6] px-10 py-5 rounded-[24px] text-lg font-black hover:bg-[#00BFA6]/20 transition-all shadow-xl flex items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
                    aria-expanded={showHelp}
                    aria-controls="help-section"
                  >
                    <span className="text-2xl" aria-hidden="true">💡</span> {showHelp ? "Piilota ohjeet" : "Näytä selkeät käyttöohjeet"}
                  </button>

                  <button
                    type="button"
                    onClick={fillExample}
                    className="bg-white text-black px-10 py-5 rounded-[24px] text-lg font-black hover:bg-gray-200 transition-all shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
                  >
                    Täytä esimerkki
                  </button>
                </div>
              </div>

              {/* MOBIILIN PIKATILASTOT (Korvaa isot pallot puhelimella) */}
              <div className={`flex lg:hidden justify-between items-center rounded-3xl p-5 border shadow-sm ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`} aria-label="Työnhaun tilastot">
                <div className="text-center">
                  <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{jobs.length}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Työpaikat</p>
                </div>
                <div className={`w-px h-8 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} aria-hidden="true"></div>
                <div className="text-center">
                  <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>4</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Tyylit</p>
                </div>
                <div className={`w-px h-8 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} aria-hidden="true"></div>
                <div className="text-center">
                  <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>3</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Sävyt</p>
                </div>
              </div>

              {/* DESKTOP TILASTOT (Alkuperäiset) */}
              <div className="hidden lg:grid gap-6 w-full" aria-hidden="true">
                <StatCard
                  title="TYÖPAIKAT"
                  value={jobs.length.toString()}
                  description="Seurannassa olevat paikat"
                  theme={theme}
                />
                <div className="grid grid-cols-2 gap-6">
                  <StatCard
                    title="CV-TYYLIT"
                    value="4"
                    description="Valmista pohjaa"
                    theme={theme}
                  />
                  <StatCard
                    title="SÄVYT"
                    value="3"
                    description="Hakemuksiin"
                    theme={theme}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- OHJE-OSIO --- */}
        {showHelp && (
          <section id="help-section" className="max-w-7xl mx-auto px-8 mt-12 animate-in fade-in slide-in-from-top-6" aria-labelledby="help-heading">
            <div className="rounded-[40px] border-2 border-[#00BFA6]/30 bg-zinc-900/90 p-10 sm:p-16 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-6">
                <h2 id="help-heading" className="text-3xl sm:text-4xl font-black text-white tracking-tight">Näin käytät Duuniharavaa</h2>
                <button onClick={() => setShowHelp(false)} aria-label="Sulje ohjeet" className="text-gray-400 hover:text-white font-bold p-2 text-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]">✕ Sulje</button>
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

        <div className="mx-auto max-w-7xl px-8 py-16 md:py-20 lg:px-12">
          <div className="mb-10 flex flex-wrap items-center gap-5 border-b border-white/5 pb-6" role="group" aria-label="Valitse toiminto">
            <button
              type="button"
              onClick={() => setMode("improve")}
              aria-pressed={mode === "improve"}
              className={`rounded-2xl px-8 py-4 text-base font-bold transition-all duration-300 flex-1 sm:flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
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
              aria-pressed={mode === "create"}
              className={`rounded-2xl px-8 py-4 text-base font-bold transition-all duration-300 flex-1 sm:flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
                mode === "create"
                  ? "bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] text-black shadow-[0_0_20px_rgba(0,191,166,0.3)]"
                  : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1"
              }`}
            >
              Luo täysin uusi CV
            </button>

            <div className="ml-auto hidden text-base font-medium text-gray-500 lg:block" aria-live="polite">
              Pilvitallennus aktiivinen (Supabase) ☁️
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr]">
            <section className="space-y-4 sm:space-y-12">
              
              {/* PELILLISTÄMINEN: Profiilin valmiusaste */}
              <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                  <span className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Profiilin valmiusaste</span>
                  <span className="text-[#00BFA6] font-black text-xl">{profileCompletion}%</span>
                </div>
                <div className={`w-full h-3 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] transition-all duration-1000 ease-out"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                {profileCompletion < 100 && (
                  <p className={`text-xs mt-2 font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    Täyttämällä profiilin 100% valmiiksi, tekoäly tuottaa jopa 3x tarkempia hakemuksia.
                  </p>
                )}
              </div>

              <SectionShell
                id="hakijan-tiedot"
                step="Vaihe 1"
                title="Hakijan tiedot"
                description="Täytä tietosi huolellisesti tai lataa vanha CV:si. Näitä käytetään pohjana kaikessa tekoälyn tekemässä työssä."
                theme={theme}
                action={
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCareerPath(true)}
                      className="rounded-2xl border border-[#00BFA6]/40 bg-[#00BFA6]/10 px-6 py-3 text-sm font-bold text-[#00BFA6] transition-all hover:bg-[#00BFA6] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
                    >
                      🗺️ Urapolku-navigaattori
                    </button>
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
                <form onSubmit={handleCvSubmit} className="space-y-8 mt-6">
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
                            ✓ {form.cvFileName} valittu
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2">
                    <div>
                       <label htmlFor="input-name" className={LabelClass(theme)}>Koko nimi</label>
                       <input
                         id="input-name"
                         placeholder="Esim. Matti Meikäläinen"
                         value={form.name}
                         onChange={(e) => updateField("name", e.target.value)}
                         className={InputClass(theme)}
                       />
                    </div>
                    <div>
                       <label htmlFor="input-phone" className={LabelClass(theme)}>Puhelin</label>
                       <input
                         id="input-phone"
                         placeholder="040 123 4567"
                         value={form.phone}
                         onChange={(e) => updateField("phone", e.target.value)}
                         className={InputClass(theme)}
                       />
                    </div>
                    <div>
                       <label htmlFor="input-email" className={LabelClass(theme)}>Sähköposti</label>
                       <input
                         id="input-email"
                         placeholder="oma@email.com"
                         value={form.email}
                         onChange={(e) => updateField("email", e.target.value)}
                         className={InputClass(theme)}
                       />
                    </div>
                    <div>
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

                  <div className="pt-4">
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
                    <p id="targetJob-hint" className="text-xs text-[#00BFA6] font-bold mt-3 ml-2">💡 Tekoäly kirjoittaa tämän perusteella sinulle myyvän "Hookin" (Profiilitekstin), jolla erotut muista.</p>
                  </div>

                  <div className="pt-4">
                    <label htmlFor="input-education" className={LabelClass(theme)}>Koulutus</label>
                    <textarea
                      id="input-education"
                      placeholder="Oppilaitos | Tutkinto | Valmistumisvuosi&#10;Esim. Helsingin Yliopisto | Kauppatieteiden maisteri | 2024"
                      value={form.education}
                      onChange={(e) => updateField("education", e.target.value)}
                      className={TextareaClass("min-h-[140px]", theme)}
                    />
                  </div>

                  <div className="pt-4">
                    <label htmlFor="input-experience" className={LabelClass(theme)}>Työkokemus</label>
                    <textarea
                      id="input-experience"
                      placeholder="Työnantaja | Työtehtävä | 01/2020 - 05/2022 (tai 'Nykyinen')&#10;- Lyhyt kuvaus työtehtävistäsi...&#10;- Toinen kuvaus..."
                      value={form.experience}
                      onChange={(e) => updateField("experience", e.target.value)}
                      className={TextareaClass("min-h-[180px]", theme)}
                    />
                  </div>

                  {/* UUSI OSIO: PROJEKTIT */}
                  <div className="pt-4">
                    <label htmlFor="input-projects" className={LabelClass(theme)}>Projektit & Portfoliolinkit <span className="text-[#00BFA6] font-normal lowercase">(Vapaaehtoinen)</span></label>
                    <textarea
                      id="input-projects"
                      placeholder="Projektin nimi | Vuosi&#10;- Mitä teit ja mitä sait aikaan?&#10;- Linkki: https://..."
                      value={form.projects}
                      onChange={(e) => updateField("projects", e.target.value)}
                      className={TextareaClass("min-h-[140px]", theme)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-4">
                    <div>
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
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <label htmlFor="input-skills" className={LabelClass(theme)}>Osaaminen & Taidot</label>
                        <button 
                          type="button" 
                          onClick={() => setShowSkillTranslator(true)}
                          className="text-[#00BFA6] text-xs font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] rounded"
                        >
                          ✨ Käännä ammattikielelle
                        </button>
                      </div>
                      <textarea
                        id="input-skills"
                        placeholder="Mitä taitoja sinulla on? (esim. asiakaspalvelu)"
                        value={form.skills}
                        onChange={(e) => updateField("skills", e.target.value)}
                        className={TextareaClass("min-h-[140px]", theme)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-4">
                    <div>
                      <label htmlFor="input-cards" className={LabelClass(theme)}>Kortit & Pätevyydet</label>
                      <textarea
                        id="input-cards"
                        placeholder="Työturvallisuuskortti, B-ajokortti..."
                        value={form.cards}
                        onChange={(e) => updateField("cards", e.target.value)}
                        className={TextareaClass("min-h-[120px]", theme)}
                      />
                    </div>
                    <div>
                      <label htmlFor="input-hobbies" className={LabelClass(theme)}>Harrastukset</label>
                      <textarea
                        id="input-hobbies"
                        placeholder="Mitä teet vapaa-ajalla?"
                        value={form.hobbies}
                        onChange={(e) => updateField("hobbies", e.target.value)}
                        className={TextareaClass("min-h-[120px]", theme)}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <ProfileImageUpload image={profileImage} onChange={setProfileImage} />
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
                action={
                  <button
                    type="button"
                    onClick={suggestJobs}
                    disabled={loadingJobs}
                    className="rounded-2xl bg-gradient-to-r from-[#00BFA6] to-[#FF6F3C] px-8 py-4 text-base font-black text-black transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-50 shadow-[0_0_25px_rgba(0,191,166,0.3)] mt-2 sm:mt-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6F3C]"
                    aria-live="polite"
                  >
                    {loadingJobs ? "Etsitään..." : "2. EHDOTA TYÖPAIKKOJA"}
                  </button>
                }
              >
                <div className="space-y-8 mt-8">
                  <div>
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
                  </div>
                  
                  <div>
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
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
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
                    </div>
                    <div>
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
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
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
                    </div>
                    <div>
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
                    </div>
                  </div>
                </div>
              </SectionShell>
            </section>

            {/* OIKEA SARAKE: VÄLILEHDET */}
            <section id="studio-tulokset" className="space-y-10 lg:sticky lg:top-8 lg:self-start scroll-mt-24">
              <div className={`rounded-[32px] sm:rounded-[40px] border p-8 sm:p-10 shadow-2xl backdrop-blur-xl transition-all ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
                
                {/* VÄLILEHTINAPIT (ARIA TABLIST) */}
                <div 
                  className={`sticky top-0 z-40 pt-2 sm:pt-0 mb-10 flex overflow-x-auto whitespace-nowrap pb-4 gap-5 snap-x border-b custom-scrollbar ${theme === 'dark' ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-100'}`}
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
                    className={`rounded-2xl px-8 py-4 text-base font-black transition-all duration-300 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
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
                    aria-selected={tab === "job"}
                    aria-controls="panel-job"
                    onClick={() => setTab("job")}
                    className={`rounded-2xl px-8 py-4 text-base font-black transition-all duration-300 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
                      tab === "job"
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
                    aria-selected={tab === "letter"}
                    aria-controls="panel-letter"
                    onClick={() => setTab("letter")}
                    className={`rounded-2xl px-8 py-4 text-base font-black transition-all duration-300 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${
                      tab === "letter"
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
                    className={`rounded-2xl px-8 py-4 text-base font-black transition-all duration-300 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6F3C] ${
                      tab === "tips"
                        ? "bg-[#FF6F3C] text-black shadow-[0_0_20px_rgba(255,111,60,0.4)]"
                        : theme === 'dark' ? "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1" : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:-translate-y-1"
                    }`}
                  >
                    Vinkit
                  </button>
                </div>

                {tab === "cv" && (
                  <div id="panel-cv" role="tabpanel" aria-labelledby="tab-cv" className="space-y-10 overflow-hidden animate-in fade-in duration-500">
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
                        {parsedCv.score && (
                          <div className="rounded-[32px] border border-[#00BFA6]/30 bg-[#00BFA6]/5 p-8 text-center shadow-[0_10px_30px_rgba(0,191,166,0.1)]">
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#00BFA6]">
                              Kuntotarkastus arvosana
                            </h2>
                            <p className={`mt-3 text-6xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {parsedCv.score}
                            </p>
                          </div>
                        )}

                        {parsedCv.report.length > 0 && (
                          <div className="rounded-[32px] border border-[#FF6F3C]/30 bg-[#FF6F3C]/5 p-8 sm:p-10 shadow-[0_10px_30px_rgba(255,111,60,0.1)]">
                            <h2 className="mb-6 text-sm font-black uppercase tracking-widest text-[#FF6F3C]">
                              Muutosraportti / Parannukset
                            </h2>
                            <ul className={`space-y-4 pl-6 text-lg ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
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
                              <label htmlFor="cv-text-editor" className={`text-2xl font-black block ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Muokkaa CV-tekstiä</label>
                              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tekoälyn tuottama luonnos. Voit muokata tekstiä täysin vapaasti tässä ennen latausta.</p>
                            </div>
                          </div>
                          <textarea
                            id="cv-text-editor"
                            value={parsedCv.cvBody}
                            onChange={(e) => {
                              const prefix = cvResult.split("CV_BODY:")[0] || "";
                              setCvResult(prefix + "CV_BODY:\n" + e.target.value);
                            }}
                            className={`min-h-[400px] w-full rounded-3xl border p-6 font-mono text-sm leading-relaxed outline-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-black/50 text-gray-200' : 'border-gray-200 bg-white text-gray-800'}`}
                          />
                        </div>

                        {/* CV PREVIEW */}
                        <div className={`rounded-[40px] border p-4 sm:p-8 overflow-x-auto shadow-2xl custom-scrollbar mt-10 ${theme === 'dark' ? 'border-white/10 bg-[#0F0F0F]' : 'border-gray-200 bg-gray-100'}`} role="region" aria-label="CV Esikatselu">
                          <div className="min-w-[900px]">
                            <CvPreview
                              cvText={parsedCv.cvBody}
                              image={profileImage}
                              styleVariant={cvStyle}
                              customStyle={customStyle}
                              mode="cv"
                            />
                          </div>
                        </div>

                        {/* LATAUSNAPIT */}
                        <div className="flex flex-col sm:flex-row gap-5 mt-24 pt-8 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => setShowPublicLink(true)}
                            className="flex-1 rounded-2xl border border-blue-500/50 bg-blue-500/10 px-8 py-5 font-black text-lg text-blue-400 transition-all hover:bg-blue-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                          >
                            🌐 JULKAISE VERKKOON
                          </button>

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
                        <div className={`rounded-[32px] border p-8 md:p-10 mt-16 shadow-2xl ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-gray-200'}`}>
                          <div className={`flex flex-wrap items-center justify-between gap-6 mb-8 border-b pb-6 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                            <div>
                              <p className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Värit ja Teema</p>
                              <p className={`mt-2 text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Pikavalinnat väreille tai säädä itse.</p>
                            </div>
                            <button type="button" onClick={resetCurrentStyle} className={`rounded-2xl border px-6 py-3 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-[#00BFA6]/50' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-[#00BFA6]/50'}`}>
                              Palauta oletukset
                            </button>
                          </div>

                          {/* PIKAVÄRIT */}
                          <div className={`mb-10 flex flex-wrap gap-3 border-b pb-8 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`} role="group" aria-label="Pikaväriteemat">
                            <button type="button" onClick={() => applyPalette("#ffffff", "#f8fafc", "#0f172a", "#1e293b", "#0369a1", "#111827", "#ffffff", "#475569")} className={`rounded-xl px-5 py-3 text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0369a1] ${theme === 'dark' ? 'border-white/10 hover:border-[#0369a1] hover:bg-white/5' : 'border-gray-200 hover:border-[#0369a1] hover:bg-gray-50'}`}>🌊 Merellinen</button>
                            <button type="button" onClick={() => applyPalette("#ffffff", "#f1f5f9", "#064e3b", "#022c22", "#10b981", "#0f172a", "#ffffff", "#334155")} className={`rounded-xl px-5 py-3 text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] ${theme === 'dark' ? 'border-white/10 hover:border-[#10b981] hover:bg-white/5' : 'border-gray-200 hover:border-[#10b981] hover:bg-gray-50'}`}>🌲 Metsä</button>
                            <button type="button" onClick={() => applyPalette("#fffbeb", "#fef3c7", "#78350f", "#451a03", "#d97706", "#451a03", "#fffbeb", "#92400e")} className={`rounded-xl px-5 py-3 text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97706] ${theme === 'dark' ? 'border-white/10 hover:border-[#d97706] hover:bg-white/5' : 'border-gray-200 hover:border-[#d97706] hover:bg-gray-50'}`}>🍂 Syksy</button>
                            <button type="button" onClick={() => applyPalette("#ffffff", "#f3f4f6", "#4c1d95", "#312e81", "#7c3aed", "#111827", "#ffffff", "#4338ca")} className={`rounded-xl px-5 py-3 text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] ${theme === 'dark' ? 'border-white/10 hover:border-[#7c3aed] hover:bg-white/5' : 'border-gray-200 hover:border-[#7c3aed] hover:bg-gray-50'}`}>🔮 Kyber</button>
                            <button type="button" onClick={() => applyPalette("#18181b", "#111827", "#000000", "#0a0a0a", "#14b8a6", "#f3f4f6", "#e5e7eb", "#9ca3af")} className={`rounded-xl px-5 py-3 text-sm font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14b8a6] ${theme === 'dark' ? 'border-white/10 hover:border-[#14b8a6] hover:bg-white/5' : 'border-gray-200 hover:border-[#14b8a6] hover:bg-gray-50'}`}>🌑 Tumma Tyyli</button>
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
                        </div>

                      </>
                    ) : (
                      <div className={`rounded-[32px] sm:rounded-[40px] border-2 border-dashed p-12 sm:p-20 text-center font-medium ${theme === 'dark' ? 'border-white/10 bg-black/40 text-gray-500' : 'border-gray-300 bg-gray-50 text-gray-500'}`} role="status" aria-live="polite">
                        <div className="text-5xl mb-6" aria-hidden="true">📄</div>
                        <p className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ei esikatselua vielä</p>
                        <p className="text-base">Täytä tiedot vasemmalla ja paina "Generoi CV", niin näet miltä työsi näyttää.</p>
                      </div>
                    )}
                  </div>
                )}

                {tab === "job" && (
                  <div id="panel-job" role="tabpanel" aria-labelledby="tab-job" className="space-y-10 animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 gap-4 sm:gap-5 sm:grid-cols-4">
                      <div className={`rounded-[24px] border p-6 text-center hover:-translate-y-1 transition-transform ${theme === 'dark' ? 'border-white/10 bg-black/50' : 'border-gray-200 bg-white shadow-sm'}`}>
                        <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] truncate ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          Työpaikat
                        </p>
                        <p className={`mt-3 text-3xl sm:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {dashboardStats.total}
                        </p>
                      </div>
                      <div className={`rounded-[24px] border p-6 text-center hover:-translate-y-1 transition-transform ${theme === 'dark' ? 'border-white/10 bg-black/50' : 'border-gray-200 bg-white shadow-sm'}`}>
                        <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] truncate ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          Haettu
                        </p>
                        <p className={`mt-3 text-3xl sm:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {dashboardStats.applied}
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-[#00BFA6]/40 bg-[#00BFA6]/10 p-6 text-center hover:-translate-y-1 transition-transform shadow-[0_0_20px_rgba(0,191,166,0.1)]">
                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-[#00BFA6] truncate">
                          Haastattelu
                        </p>
                        <p className="mt-3 text-3xl sm:text-4xl font-black text-[#00BFA6]">
                          {dashboardStats.interview}
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-[#FF6F3C]/40 bg-[#FF6F3C]/10 p-6 text-center hover:-translate-y-1 transition-transform shadow-[0_0_20px_rgba(255,111,60,0.1)]">
                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-[#FF6F3C] truncate">
                          Suosikit
                        </p>
                        <p className="mt-3 text-3xl sm:text-4xl font-black text-[#FF6F3C]">
                          {dashboardStats.favorites}
                        </p>
                      </div>
                    </div>

                    <div className={`rounded-[32px] border p-6 sm:p-10 space-y-8 ${theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white'}`}>
                      <h3 className={`text-2xl font-black border-b pb-5 ${theme === 'dark' ? 'text-white border-white/10' : 'text-gray-900 border-gray-100'}`}>
                        Lisää oma työpaikka seurantaan
                      </h3>

                      <div>
                         <label htmlFor="job-title" className={LabelClass(theme)}>Otsikko</label>
                         <input
                           id="job-title"
                           placeholder="Esim. Myyntipäällikkö"
                           value={jobForm.title}
                           onChange={(e) => updateJobForm("title", e.target.value)}
                           className={InputClass(theme)}
                         />
                      </div>

                      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                        <div>
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
                        <div>
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

                      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                        <div>
                           <label htmlFor="job-type" className={LabelClass(theme)}>Työsuhde</label>
                           <input
                             id="job-type"
                             placeholder="Vakituinen"
                             value={jobForm.type}
                             onChange={(e) => updateJobForm("type", e.target.value)}
                             className={InputClass(theme)}
                           />
                        </div>
                        <div>
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

                      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                        <div>
                           <label htmlFor="job-salary" className={LabelClass(theme)}>Palkka</label>
                           <input
                             id="job-salary"
                             placeholder="3000 €/kk"
                             value={jobForm.salary}
                             onChange={(e) => updateJobForm("salary", e.target.value)}
                             className={InputClass(theme)}
                           />
                        </div>
                        <div>
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

                      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                        <div>
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
                        <div>
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

                      <div>
                         <label htmlFor="job-summary" className={LabelClass(theme)}>Lyhyt kuvaus / muistiinpanot</label>
                         <textarea
                           id="job-summary"
                           placeholder="Mikä tässä kiinnostaa?"
                           value={jobForm.summary}
                           onChange={(e) => updateJobForm("summary", e.target.value)}
                           className={TextareaClass("min-h-[140px]", theme)}
                         />
                      </div>

                      <div>
                         <label htmlFor="job-adText" className={LabelClass(theme)}>Kopioi ilmoitusteksti (Tärkeä tekoälylle)</label>
                         <textarea
                           id="job-adText"
                           placeholder="Liitä koko ilmoituksen teksti tähän. Tekoäly käyttää tätä räätälöidessään hakemustasi..."
                           value={jobForm.adText}
                           onChange={(e) => updateJobForm("adText", e.target.value)}
                           className={TextareaClass("min-h-[250px]", theme)}
                         />
                      </div>

                      <button
                        type="button"
                        onClick={addJob}
                        className="w-full rounded-2xl bg-[#00BFA6] px-8 py-6 text-lg sm:text-xl font-black text-black transition-transform hover:scale-[1.02] active:scale-95 shadow-xl mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6]"
                      >
                        + TALLENNA SEURANTAAN
                      </button>
                    </div>

                    <div className={`space-y-8 pt-8 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-4">
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

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <select
                          aria-label="Suodata statuksen mukaan"
                          value={jobStatusFilter}
                          onChange={(e) =>
                            setJobStatusFilter(e.target.value as "all" | JobStatus)
                          }
                          className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none focus:border-[#00BFA6] cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-[#141414] text-white' : 'border-gray-200 bg-white text-gray-900'}`}
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
                          className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none focus:border-[#00BFA6] cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-[#141414] text-white' : 'border-gray-200 bg-white text-gray-900'}`}
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
                          className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none focus:border-[#00BFA6] cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-[#141414] text-white' : 'border-gray-200 bg-white text-gray-900'}`}
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
                          className={`w-full rounded-2xl px-5 py-4 text-xs sm:text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6F3C] ${
                            showFavoritesOnly
                              ? "bg-[#FF6F3C] text-white shadow-[0_0_20px_rgba(255,111,60,0.5)] scale-[1.02]"
                              : theme === 'dark' ? "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:-translate-y-1" : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:-translate-y-1"
                          }`}
                        >
                          {showFavoritesOnly ? "★ Vain suosikit" : "Näytä suosikit"}
                        </button>
                      </div>

                      {filteredJobs.length === 0 ? (
                        <div className={`rounded-[40px] border-2 border-dashed p-12 sm:p-20 text-center font-medium ${theme === 'dark' ? 'border-white/10 bg-black/40 text-gray-500' : 'border-gray-300 bg-gray-50 text-gray-500'}`}>
                          <p className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ei tuloksia</p>
                          <p className="text-base">Sinulla ei ole vielä yhtään työpaikkaa tai suodattimet piilottavat ne.</p>
                        </div>
                      ) : (
                        <div className="space-y-6 sm:space-y-8 mt-8">
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
                                onSalary={() => setSalaryJob(job)}
                                theme={theme}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {tab === "letter" && (
                  <div id="panel-letter" role="tabpanel" aria-labelledby="tab-letter" className="space-y-10 animate-in fade-in duration-500">
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
                          <span className="text-3xl block mb-3" aria-hidden="true">⚠️</span>
                          Palaa ensin <strong>Työpaikat</strong> -välilehdelle ja valitse (klikkaa) sieltä haluamasi työpaikka.
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
                            💼 Asiallinen
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
                            🤝 Lämmin
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
                            🚀 Myyvä
                          </button>
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

                    {activeJobLetters.length > 0 && (
                      <div className={`rounded-[32px] border p-6 sm:p-8 mt-10 ${theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white'}`}>
                        <h3 className={`mb-6 text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
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
                              className={`w-full rounded-2xl border px-6 py-5 text-left transition-all hover:border-[#00BFA6]/50 hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(0,191,166,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-black/50' : 'border-gray-200 bg-gray-50'}`}
                            >
                              <p className="font-bold text-lg text-[#00BFA6] truncate">
                                {letter.jobTitle}
                              </p>
                              <p className={`text-base font-medium truncate mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {letter.companyName}
                              </p>
                              <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                Luotu: {new Date(letter.createdAt).toLocaleString("fi-FI")}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {letterResult ? (
                      <>
                        <div className={`rounded-[32px] sm:rounded-[40px] border p-6 sm:p-12 shadow-[0_15px_50px_rgba(0,191,166,0.15)] mt-10 ${theme === 'dark' ? 'border-[#00BFA6]/40 bg-[#0A0A0A]' : 'border-[#00BFA6]/40 bg-white'}`}>
                          
                          <div className={`mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-b pb-6 ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'}`}>
                            <div className={`flex rounded-2xl p-1 w-full sm:w-auto border ${theme === 'dark' ? 'bg-[#141414] border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                              <button
                                onClick={() => setLetterViewMode("edit")}
                                className={`flex-1 sm:flex-none px-6 py-3 text-sm font-bold rounded-xl transition-all ${letterViewMode === "edit" ? "bg-[#00BFA6] text-black shadow-md" : "text-gray-400 hover:text-gray-600"}`}
                              >
                                ✍️ Muokkaa tekstiä
                              </button>
                              <button
                                onClick={() => setLetterViewMode("preview")}
                                className={`flex-1 sm:flex-none px-6 py-3 text-sm font-bold rounded-xl transition-all ${letterViewMode === "preview" ? "bg-[#00BFA6] text-black shadow-md" : "text-gray-400 hover:text-gray-600"}`}
                              >
                                📄 Visuaalinen esikatselu
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

                          {letterViewMode === "edit" ? (
                            <textarea
                              id="letter-editor"
                              value={letterDraft}
                              onChange={(e) => setLetterDraft(e.target.value)}
                              className={`min-h-[500px] w-full rounded-3xl border p-6 sm:p-8 font-sans text-base sm:text-lg leading-relaxed outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00BFA6] transition-all resize-y shadow-inner ${theme === 'dark' ? 'border-white/5 bg-black/50 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-800'}`}
                            />
                          ) : (
                            <div className={`rounded-3xl border p-4 sm:p-8 overflow-x-auto shadow-2xl custom-scrollbar ${theme === 'dark' ? 'border-white/10 bg-[#0F0F0F]' : 'border-gray-200 bg-gray-100'}`} role="region" aria-label="Hakemuksen Esikatselu">
                              <div className="min-w-[900px]">
                                <CvPreview
                                  cvText={letterDraft}
                                  image={profileImage}
                                  styleVariant={cvStyle}
                                  customStyle={customStyle}
                                  mode="letter"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* UUDET: SÄHKÖPOSTIAUTOMAATIO & VIDEOTYÖKALU */}
                        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
                            <p className={`text-sm font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Pikaviestit</p>
                            <div className="flex flex-col gap-3">
                              <button onClick={() => handleEmailTemplate("questions")} className={`text-left px-5 py-3 rounded-xl border text-sm font-bold transition hover:border-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                                ✉️ Kysy lisätietoja tehtävästä
                              </button>
                              <button onClick={() => handleEmailTemplate("thanks")} className={`text-left px-5 py-3 rounded-xl border text-sm font-bold transition hover:border-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                                ✉️ Kiitosviesti haastattelun jälkeen
                              </button>
                              <button onClick={() => handleEmailTemplate("linkedin")} className={`text-left px-5 py-3 rounded-xl border text-sm font-bold transition hover:border-[#00BFA6] ${theme === 'dark' ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                                🔗 LinkedIn-verkostoitumisviesti
                              </button>
                            </div>
                          </div>

                          <div className={`p-6 rounded-3xl border flex flex-col justify-center items-center text-center ${theme === 'dark' ? 'bg-[#141414] border-[#FF6F3C]/30' : 'bg-orange-50 border-orange-200'}`}>
                            <span className="text-4xl mb-3">🎥</span>
                            <h4 className={`text-lg font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Videohakemus-studio</h4>
                            <p className={`text-sm mb-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tekoäly luo minuutin käsikirjoituksen ja avaa teleprompterin lukemista varten.</p>
                            <button onClick={() => setTeleprompterJob(activeJob)} className="w-full rounded-xl bg-[#FF6F3C] text-black font-black py-3 hover:scale-105 transition-transform">
                              AVAA TELEPROMPTER
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-5 mt-6">
                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                letterDraft || parsedLetter,
                                "Hakemus kopioitu leikepöydälle!"
                              )
                            }
                            className={`flex-1 rounded-3xl border px-8 py-6 sm:py-7 text-lg sm:text-xl font-black transition-transform hover:scale-[1.02] active:scale-95 shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-gray-400 ${theme === 'dark' ? 'border-white/20 bg-white text-black' : 'border-gray-300 bg-gray-900 text-white'}`}
                          >
                            KOPIOI TEKSTI 📋
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
                      </>
                    ) : (
                      <div className={`rounded-[32px] sm:rounded-[40px] border-2 border-dashed p-10 sm:p-20 text-center font-medium mt-10 ${theme === 'dark' ? 'border-white/10 bg-black/40 text-gray-500' : 'border-gray-300 bg-gray-50 text-gray-500'}`}>
                        <div className="text-5xl mb-6" aria-hidden="true">✍️</div>
                        <p className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Hakemus puuttuu</p>
                        <p className="text-base text-gray-400">Paina ylempää nappia, niin hakemuksen teksti ilmestyy tähän.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* VINKIT TAB */}
                {tab === "tips" && (
                  <div id="panel-tips" role="tabpanel" aria-labelledby="tab-tips" className="space-y-10 animate-in fade-in duration-500">
                    <div className={`rounded-[32px] sm:rounded-[40px] border p-8 sm:p-12 shadow-[0_15px_50px_rgba(255,111,60,0.1)] ${theme === 'dark' ? 'border-[#FF6F3C]/30 bg-[#FF6F3C]/5' : 'border-[#FF6F3C]/30 bg-white'}`}>
                      <h2 className={`text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Työnhaun Tehovinkit 🚀</h2>
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
            <div 
              role="dialog" 
              aria-modal="true" 
              aria-labelledby="modal-title"
              className={`border rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[80vh] animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}
            >
              <div className={`p-6 sm:p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <div>
                  <h3 id="modal-title" className={`font-black text-2xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>🎤 Haastattelusimulaattori</h3>
                  <p className="text-sm text-[#00BFA6] mt-1 font-bold">{sparringJob.title} @ {sparringJob.company || "Yritys"}</p>
                </div>
                <button onClick={() => setSparringJob(null)} aria-label="Sulje simulaattori" className="text-gray-500 hover:text-[#00BFA6] font-black text-2xl bg-black/5 hover:bg-black/10 w-12 h-12 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6]">✕</button>
              </div>
              
              <div className={`flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar ${theme === 'dark' ? '' : 'bg-gray-50'}`} aria-live="polite">
                {sparringChat.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] rounded-3xl p-6 ${msg.role === 'ai' ? (theme === 'dark' ? 'bg-[#00BFA6]/10 border border-[#00BFA6]/20 text-gray-200' : 'bg-[#00BFA6]/10 border border-[#00BFA6]/30 text-gray-800') : (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-900 text-white')} ${msg.role === 'ai' ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}>
                      <p className={`text-xs font-black mb-3 tracking-widest uppercase ${msg.role === 'ai' ? 'text-[#00BFA6]' : 'text-gray-400'}`}>
                        {msg.role === 'ai' ? '🤖 Rekrytoija' : '👤 Sinä'}
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

        {/* UUDET MODAALIT */}

        {/* 1. Osaamisen kääntäjä */}
        {showSkillTranslator && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div role="dialog" aria-modal="true" className={`border rounded-[32px] w-full max-w-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
              <div className={`p-6 sm:p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                <h3 className={`font-black text-2xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>✨ Käännä ammattikielelle</h3>
                <button onClick={() => setShowSkillTranslator(false)} className="text-gray-500 hover:text-[#00BFA6] font-black text-2xl w-10 h-10 rounded-full flex items-center justify-center transition-colors">✕</button>
              </div>
              <div className="p-6 sm:p-8 space-y-6">
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Kerro omin sanoin, mitä teet vapaa-ajallasi (esim. harrastukset, perhearki, yhdistystoiminta). Tekoäly kääntää sen CV-kelpoisiksi taidoiksi.</p>
                <textarea
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Esim. Hoidan 3 lapsen arjen aikataulut, treenit ja budjetin..."
                  className={`w-full min-h-[120px] rounded-2xl border px-5 py-4 outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-black/50 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
                {skillOutput && (
                  <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-[#00BFA6]/10 border-[#00BFA6]/30 text-gray-200' : 'bg-[#00BFA6]/10 border-[#00BFA6]/30 text-gray-800'}`}>
                    <p className="text-xs font-bold text-[#00BFA6] uppercase mb-2">Johdetut taidot:</p>
                    <p>{skillOutput}</p>
                    <button 
                      onClick={() => {
                        updateField("skills", form.skills ? form.skills + ", " + skillOutput : skillOutput);
                        setShowSkillTranslator(false);
                      }}
                      className="mt-4 w-full bg-[#00BFA6] text-black font-black py-3 rounded-xl hover:scale-[1.02] transition-transform"
                    >
                      LISÄÄ CV:SEEN
                    </button>
                  </div>
                )}
                {!skillOutput && (
                  <button 
                    onClick={() => {
                      setIsTranslating(true);
                      setTimeout(() => {
                        setSkillOutput("Ajanhallinta, Budjetointi, Organisointikyky, Paineensietokyky");
                        setIsTranslating(false);
                      }, 1500);
                    }}
                    disabled={!skillInput || isTranslating}
                    className="w-full bg-white text-black font-black py-4 rounded-xl disabled:opacity-50 hover:bg-gray-200 transition-colors"
                  >
                    {isTranslating ? "Käännetään..." : "ANALYSOI"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. Urapolku-navigaattori */}
        {showCareerPath && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div role="dialog" aria-modal="true" className={`border rounded-[32px] w-full max-w-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
              <div className={`p-6 sm:p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                <h3 className={`font-black text-2xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>🗺️ Urapolku-navigaattori</h3>
                <button onClick={() => setShowCareerPath(false)} className="text-gray-500 hover:text-[#00BFA6] font-black text-2xl w-10 h-10 rounded-full flex items-center justify-center transition-colors">✕</button>
              </div>
              <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Mikä on unelmatyösi 3-5 vuoden päästä? Tekoäly tekee sinulle askel askeleelta -suunnitelman, miten pääset nykyisestä tilanteesta sinne.</p>
                <input
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="Esim. IT-projektipäällikkö"
                  className={`w-full rounded-2xl border px-5 py-4 outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-black/50 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
                
                {careerPlan.length > 0 && (
                  <div className="space-y-4">
                    {careerPlan.map((step, idx) => (
                      <div key={idx} className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-[#00BFA6]/20 text-[#00BFA6] font-black flex items-center justify-center shrink-0">{idx + 1}</div>
                          <p className={`pt-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!careerPlan.length && (
                  <button 
                    onClick={() => {
                      setIsPlanning(true);
                      setTimeout(() => {
                        setCareerPlan([
                          "Käy 2 kuukauden ilmainen ketterän kehityksen (Scrum) verkkokurssi.",
                          "Päivitä CV:si tavoittelemaan ensin 'Junior IT-asiantuntija' -rooleja. Korosta nykyistä asiakaspalvelutaustaasi kommunikaatiotaitona.",
                          "Pyri ottamaan nykyisessä tai seuraavassa työssäsi pieniä vastuita projektien vetämisestä (esim. tiimin sisäiset kehityshankkeet)."
                        ]);
                        setIsPlanning(false);
                      }, 2000);
                    }}
                    disabled={!careerGoal || isPlanning}
                    className="w-full bg-[#00BFA6] text-black font-black py-4 rounded-xl disabled:opacity-50 hover:scale-[1.02] transition-transform"
                  >
                    {isPlanning ? "Piirretään karttaa..." : "LUO SUUNNITELMA"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. Julkinen linkki -modaali */}
        {showPublicLink && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div role="dialog" aria-modal="true" className={`border rounded-[32px] w-full max-w-lg shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
              <div className={`p-6 sm:p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                <h3 className={`font-black text-2xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>🌐 Julkinen profiili</h3>
                <button onClick={() => setShowPublicLink(false)} className="text-gray-500 hover:text-[#00BFA6] font-black text-2xl w-10 h-10 rounded-full flex items-center justify-center transition-colors">✕</button>
              </div>
              <div className="p-6 sm:p-8 space-y-6">
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Voit jakaa tämän linkin suoraan rekrytoijille. Se näyttää luomasi CV:n kauniina, mobiilioptimoituna verkkosivuna.</p>
                
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Julkisuus päällä</span>
                  <div className="w-12 h-6 bg-[#00BFA6] rounded-full p-1 flex justify-end">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>

                <div>
                  <label className={`text-xs font-bold uppercase mb-2 block ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Oma linkkisi</label>
                  <input
                    readOnly
                    value={`https://duuniharava.fi/p/${form.name ? form.name.toLowerCase().replace(/ /g, '-') : 'profiili'}`}
                    className={`w-full rounded-xl border px-5 py-4 outline-none ${theme === 'dark' ? 'bg-black/50 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'}`}
                  />
                </div>
                
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`https://duuniharava.fi/p/${form.name ? form.name.toLowerCase().replace(/ /g, '-') : 'profiili'}`);
                    setShowPublicLink(false);
                    setMessage("Linkki kopioitu leikepöydälle!");
                    setTimeout(() => setMessage(""), 2500);
                  }}
                  className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  KOPIOI LINKKI
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Sähköpostimallin modaali */}
        {emailTemplateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div role="dialog" aria-modal="true" className={`border rounded-[32px] w-full max-w-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
              <div className={`p-6 sm:p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                <h3 className={`font-black text-2xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {emailTemplateModal.type === 'thanks' && "✉️ Kiitosviesti"}
                  {emailTemplateModal.type === 'questions' && "✉️ Kysy lisätietoja"}
                  {emailTemplateModal.type === 'linkedin' && "🔗 Verkostoitumisviesti"}
                </h3>
                <button onClick={() => setEmailTemplateModal(null)} className="text-gray-500 hover:text-[#00BFA6] font-black text-2xl w-10 h-10 rounded-full flex items-center justify-center transition-colors">✕</button>
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

        {/* 5. Palkkaneuvottelija modaali */}
        {salaryJob && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div role="dialog" aria-modal="true" className={`border rounded-[32px] w-full max-w-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-[#141414] border-blue-500/30' : 'bg-white border-blue-200'}`}>
              <div className={`p-6 sm:p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                <h3 className={`font-black text-2xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>💰 Palkka-arvio</h3>
                <button onClick={() => setSalaryJob(null)} className="text-gray-500 hover:text-blue-500 font-black text-2xl w-10 h-10 rounded-full flex items-center justify-center transition-colors">✕</button>
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

        {/* 6. Teleprompter (Videohakemus) */}
        {teleprompterJob && (
          <div className="fixed inset-0 z-[300]{/* 5. Palkkaneuvottelija modaali */}
        {salaryJob && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div role="dialog" aria-modal="true" className={`border rounded-[32px] w-full max-w-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-[#141414] border-blue-500/30' : 'bg-white border-blue-200'}`}>
              <div className={`p-6 sm:p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                <h3 className={`font-black text-2xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>💰 Palkka-arvio</h3>
                <button onClick={() => setSalaryJob(null)} className="text-gray-500 hover:text-blue-500 font-black text-2xl w-10 h-10 rounded-full flex items-center justify-center transition-colors">✕</button>
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

        {/* 6. Teleprompter (Videohakemus) */}
        {teleprompterJob && (
          <div className="fixed inset-0 z-[300] flex flex-col bg-black text-white p-4 sm:p-8 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-black text-2xl sm:text-3xl text-[#FF6F3C]">🎥 Videohakemus-studio</h3>
                <p className="text-gray-400 mt-2">Lue teksti suoraan kameralle. Puhu hitaasti ja selkeästi.</p>
              </div>
              <button 
                onClick={() => setTeleprompterJob(null)} 
                className="text-gray-400 hover:text-white font-black text-2xl bg-white/10 hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F3C]"
                aria-label="Sulje teleprompter"
              >
                ✕
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
              <button 
                onClick={() => alert("Teleprompterin automaattinen rullaus tulee saataville seuraavassa päivityksessä!")}
                className="bg-[#FF6F3C] text-black font-black px-10 py-5 rounded-2xl text-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,111,60,0.4)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-black"
              >
                ▶️ ALOITA RULLAUS
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
