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
import CvPreview from "@/components/CvPreview";
import ProfileImageUpload from "@/components/ProfileImageUpload";

type ParsedCvResult = {
  score: string;
  report: string[];
  cvBody: string;
};

type Tab = "cv" | "job" | "letter";
type CvStyleVariant = "modern" | "classic" | "compact" | "bold";

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

const STORAGE_KEY = "duuniharava_state_v3";

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

function safeJsonParseJobs(text: string): Omit<JobItem, "id">[] {
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

function getPdfStyle(styleVariant: CvStyleVariant) {
  switch (styleVariant) {
    case "classic":
      return {
        sidebarBg: "#f5f5f4",
        sidebarText: "#111827",
        mainBg: "#ffffff",
        mainText: "#111827",
        headingColor: "#78716c",
        nameFont: "Georgia, serif",
      };
    case "compact":
      return {
        sidebarBg: "#f8fafc",
        sidebarText: "#111827",
        mainBg: "#ffffff",
        mainText: "#111827",
        headingColor: "#64748b",
        nameFont: "Arial, Helvetica, sans-serif",
      };
    case "bold":
      return {
        sidebarBg: "#1e1b4b",
        sidebarText: "#ffffff",
        mainBg: "#ffffff",
        mainText: "#111827",
        headingColor: "#4338ca",
        nameFont: "Arial Black, Arial, sans-serif",
      };
    case "modern":
    default:
      return {
        sidebarBg: "#1f2937",
        sidebarText: "#ffffff",
        mainBg: "#ffffff",
        mainText: "#111827",
        headingColor: "#475569",
        nameFont: "Arial, Helvetica, sans-serif",
      };
  }
}

function PdfSafePreview({
  cvText,
  image,
  styleVariant,
}: {
  cvText: string;
  image?: string;
  styleVariant: CvStyleVariant;
}) {
  const lines = splitPdfLines(cvText);
  const style = getPdfStyle(styleVariant);

  if (!lines.length) return null;

  const name = lines[0] || "";
  const contactLines = lines.slice(1, 4);
  const contentLines = lines.slice(4);

  const wrapperStyle: CSSProperties = {
    width: "794px",
    minHeight: "1123px",
    background: "#ffffff",
    color: style.mainText,
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    fontFamily: "Arial, Helvetica, sans-serif",
  };

  const sidebarStyle: CSSProperties = {
    background: style.sidebarBg,
    color: style.sidebarText,
    padding: "24px",
  };

  const mainStyle: CSSProperties = {
    background: style.mainBg,
    color: style.mainText,
    padding: "32px",
  };

  const imageStyle: CSSProperties = {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    borderRadius: "16px",
    marginBottom: "24px",
    display: "block",
  };

  const placeholderStyle: CSSProperties = {
    width: "100%",
    aspectRatio: "1 / 1",
    borderRadius: "16px",
    marginBottom: "24px",
    background: "rgba(255,255,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
  };

  const nameStyle: CSSProperties = {
    fontSize: "42px",
    lineHeight: 1.1,
    fontWeight: 700,
    margin: "0 0 28px 0",
    fontFamily: style.nameFont,
    color: style.mainText,
  };

  const sectionTitleStyle: CSSProperties = {
    fontSize: "12px",
    lineHeight: 1.4,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: style.headingColor,
    borderTop: "1px solid #d1d5db",
    paddingTop: "14px",
    marginTop: "18px",
    marginBottom: "10px",
  };

  const paragraphStyle: CSSProperties = {
    fontSize: "15px",
    lineHeight: 1.7,
    margin: "0 0 8px 0",
    whiteSpace: "pre-wrap",
  };

  return (
    <div id="pdf-safe-preview" style={wrapperStyle}>
      <aside style={sidebarStyle}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
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

export default function Home() {
  const [mode, setMode] = useState<"improve" | "create">("improve");
  const [tab, setTab] = useState<Tab>("cv");
  const [cvStyle, setCvStyle] = useState<CvStyleVariant>("modern");

  const [loadingCv, setLoadingCv] = useState(false);
  const [loadingLetter, setLoadingLetter] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingTailoredCv, setLoadingTailoredCv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  const [cvResult, setCvResult] = useState("");
  const [letterResult, setLetterResult] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [searchProfile, setSearchProfile] = useState(emptySearchProfile);
  const [jobForm, setJobForm] = useState(emptyJobForm);

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [activeJobId, setActiveJobId] = useState<string>("");

  const [savedLetters, setSavedLetters] = useState<SavedLetter[]>([]);
  const [savedCvVariants, setSavedCvVariants] = useState<SavedCvVariant[]>([]);

  const pdfRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setMode(parsed.mode ?? "improve");
      setTab(parsed.tab ?? "cv");
      setCvStyle(parsed.cvStyle ?? "modern");
      setCvResult(parsed.cvResult ?? "");
      setLetterResult(parsed.letterResult ?? "");
      setProfileImage(parsed.profileImage ?? "");
      setForm(parsed.form ?? emptyForm);
      setSearchProfile(parsed.searchProfile ?? emptySearchProfile);
      setJobForm(parsed.jobForm ?? emptyJobForm);
      setJobs(parsed.jobs ?? []);
      setActiveJobId(parsed.activeJobId ?? "");
      setSavedLetters(parsed.savedLetters ?? []);
      setSavedCvVariants(parsed.savedCvVariants ?? []);
    } catch {
      console.error("Tallennetun tilan lukeminen epäonnistui.");
    }
  }, []);

  useEffect(() => {
    const state = {
      mode,
      tab,
      cvStyle,
      cvResult,
      letterResult,
      profileImage,
      form,
      searchProfile,
      jobForm,
      jobs,
      activeJobId,
      savedLetters,
      savedCvVariants,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [
    mode,
    tab,
    cvStyle,
    cvResult,
    letterResult,
    profileImage,
    form,
    searchProfile,
    jobForm,
    jobs,
    activeJobId,
    savedLetters,
    savedCvVariants,
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

  function clearForm() {
    setForm(emptyForm);
    setSearchProfile(emptySearchProfile);
    setJobForm(emptyJobForm);
    setJobs([]);
    setActiveJobId("");
    setCvResult("");
    setLetterResult("");
    setSavedLetters([]);
    setSavedCvVariants([]);
    setMessage("");
    setErrorMessage("");
    setProfileImage("");
    setTab("cv");
    setMode("improve");
    setCvStyle("modern");
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

      const element = pdfRef.current;

      const canvas = await html2canvas(element, {
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

    const job: JobItem = {
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
    };

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

      const newJobs: JobItem[] = parsed.map((job) => ({
        id: makeId(),
        title: job.title || "",
        company: job.company || "",
        location: job.location || "",
        type: job.type || "",
        summary: job.summary || "",
        adText: job.adText || "",
        url: "",
        whyFit: job.whyFit || "",
      }));

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
        }),
      });

      const data = await res.json();
      const output = data.output || data.error || "Jokin meni pieleen.";
      const parsed = parseCoverLetter(output);

      setLetterResult(output);

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
    } catch (error) {
      console.error(error);
      setErrorMessage("Virhe yhteydessä palvelimeen.");
    } finally {
      setLoadingLetter(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-10">
          <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-300 mb-4">
            CV Studio · Hakuprofiili · Työpaikat · Hakemukset
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Duuniharava
          </h1>

          <p className="text-zinc-400 max-w-3xl text-base md:text-lg leading-7">
            Luo tai paranna CV, määritä millaisia töitä etsit, pyydä
            työpaikkaehdotuksia, tee työpaikkaan kohdistettu CV-versio ja
            generoi valittuun paikkaan hakemus.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            type="button"
            onClick={() => setMode("improve")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === "improve"
                ? "bg-white text-black"
                : "bg-zinc-800 text-white hover:bg-zinc-700"
            }`}
          >
            Paranna CV
          </button>

          <button
            type="button"
            onClick={() => setMode("create")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === "create"
                ? "bg-white text-black"
                : "bg-zinc-800 text-white hover:bg-zinc-700"
            }`}
          >
            Luo uusi CV
          </button>

          <button
            type="button"
            onClick={fillExample}
            className="rounded-xl px-4 py-2 text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition"
          >
            Täytä esimerkki
          </button>

          <button
            type="button"
            onClick={() => applyQuickTarget("sales")}
            className="rounded-xl px-4 py-2 text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition"
          >
            Suuntaa myyntityöhön
          </button>

          <button
            type="button"
            onClick={() => applyQuickTarget("warehouse")}
            className="rounded-xl px-4 py-2 text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition"
          >
            Suuntaa varastotyöhön
          </button>

          <button
            type="button"
            onClick={() => applyQuickTarget("shorter")}
            className="rounded-xl px-4 py-2 text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition"
          >
            Tee tiiviimpi
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.08fr_0.92fr] gap-8">
          <section className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 shadow-2xl shadow-black/20 p-5 md:p-7">
              <h2 className="text-xl font-semibold mb-5">Hakijan tiedot</h2>

              <form onSubmit={handleCvSubmit} className="space-y-4">
                {mode === "improve" && (
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Nykyinen CV
                    </label>
                    <textarea
                      placeholder="Liitä nykyinen CV tähän"
                      value={form.cvText}
                      onChange={(e) => updateField("cvText", e.target.value)}
                      className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-4 min-h-[220px] outline-none focus:border-zinc-600"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    placeholder="Nimi"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 outline-none focus:border-zinc-600"
                  />
                  <input
                    placeholder="Puhelin"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 outline-none focus:border-zinc-600"
                  />
                  <input
                    placeholder="Sähköposti"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 outline-none focus:border-zinc-600"
                  />
                  <input
                    placeholder="Paikkakunta"
                    value={form.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 outline-none focus:border-zinc-600"
                  />
                </div>

                <input
                  placeholder="Tavoiteltu työ, esim. myyjä, varastotyöntekijä, kassatyöntekijä"
                  value={form.targetJob}
                  onChange={(e) => updateField("targetJob", e.target.value)}
                  className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 outline-none focus:border-zinc-600"
                />

                <textarea
                  placeholder="Koulutus"
                  value={form.education}
                  onChange={(e) => updateField("education", e.target.value)}
                  className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 min-h-[90px] outline-none focus:border-zinc-600"
                />

                <textarea
                  placeholder="Kokemus, esim. marjojen myynti, asiakaspalvelu, varastotyö"
                  value={form.experience}
                  onChange={(e) => updateField("experience", e.target.value)}
                  className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 min-h-[120px] outline-none focus:border-zinc-600"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <textarea
                    placeholder="Kielet, esim. suomi, englanti, ruotsi"
                    value={form.languages}
                    onChange={(e) => updateField("languages", e.target.value)}
                    className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 min-h-[100px] outline-none focus:border-zinc-600"
                  />
                  <textarea
                    placeholder="Taidot, esim. viestintä, asiakaspalvelu, myynti"
                    value={form.skills}
                    onChange={(e) => updateField("skills", e.target.value)}
                    className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 min-h-[100px] outline-none focus:border-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <textarea
                    placeholder="Kortit ja pätevyydet"
                    value={form.cards}
                    onChange={(e) => updateField("cards", e.target.value)}
                    className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 min-h-[90px] outline-none focus:border-zinc-600"
                  />
                  <textarea
                    placeholder="Harrastukset"
                    value={form.hobbies}
                    onChange={(e) => updateField("hobbies", e.target.value)}
                    className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 min-h-[90px] outline-none focus:border-zinc-600"
                  />
                </div>

                <ProfileImageUpload
                  image={profileImage}
                  onChange={setProfileImage}
                />

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-sm text-zinc-300 mb-3">CV-tyyli</p>
                  <div className="flex flex-wrap gap-2">
                    {(["modern", "classic", "compact", "bold"] as CvStyleVariant[]).map(
                      (variant) => (
                        <button
                          key={variant}
                          type="button"
                          onClick={() => setCvStyle(variant)}
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                            cvStyle === variant
                              ? "bg-white text-black"
                              : "bg-zinc-800 text-white hover:bg-zinc-700"
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
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loadingCv}
                    className="rounded-2xl bg-blue-600 hover:bg-blue-500 px-5 py-3 font-medium transition disabled:opacity-50"
                  >
                    {loadingCv ? "Luodaan CV..." : "Generoi CV"}
                  </button>

                  <button
                    type="button"
                    onClick={clearForm}
                    className="rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-5 py-3 font-medium transition"
                  >
                    Tyhjennä kentät
                  </button>

                  {parsedCv.cvBody && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(parsedCv.cvBody, "CV kopioitu leikepöydälle.")
                        }
                        className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 font-medium transition"
                      >
                        Kopioi CV
                      </button>

                      <button
                        type="button"
                        onClick={downloadPdf}
                        disabled={downloadingPdf}
                        className="rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 px-5 py-3 font-medium transition disabled:opacity-50"
                      >
                        {downloadingPdf ? "Luodaan PDF..." : "Lataa PDF"}
                      </button>

                      <button
                        type="button"
                        onClick={downloadDocx}
                        disabled={downloadingDocx}
                        className="rounded-2xl bg-cyan-600 hover:bg-cyan-500 px-5 py-3 font-medium transition disabled:opacity-50"
                      >
                        {downloadingDocx ? "Luodaan DOCX..." : "Lataa DOCX"}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 shadow-2xl shadow-black/20 p-5 md:p-7">
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="text-xl font-semibold">Hakuprofiili</h2>
                <button
                  type="button"
                  onClick={suggestJobs}
                  disabled={loadingJobs}
                  className="rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 font-medium transition disabled:opacity-50"
                >
                  {loadingJobs ? "Ehdotetaan..." : "Ehdota työpaikkoja"}
                </button>
              </div>

              <div className="space-y-4">
                <textarea
                  placeholder="Millaisia työpaikkoja etsit? Esim. myyjä, asiakaspalvelu, varastotyö"
                  value={searchProfile.desiredRoles}
                  onChange={(e) =>
                    updateSearchProfile("desiredRoles", e.target.value)
                  }
                  className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 min-h-[90px] outline-none focus:border-zinc-600"
                />

                <input
                  placeholder="Millä alueella etsit töitä?"
                  value={searchProfile.desiredLocation}
                  onChange={(e) =>
                    updateSearchProfile("desiredLocation", e.target.value)
                  }
                  className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 outline-none focus:border-zinc-600"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    placeholder="Työmuoto, esim. osa-aikainen / kokoaikainen"
                    value={searchProfile.workType}
                    onChange={(e) =>
                      updateSearchProfile("workType", e.target.value)
                    }
                    className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 outline-none focus:border-zinc-600"
                  />
                  <input
                    placeholder="Vuorotoive, esim. päivä / ilta / yö"
                    value={searchProfile.shiftPreference}
                    onChange={(e) =>
                      updateSearchProfile("shiftPreference", e.target.value)
                    }
                    className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 outline-none focus:border-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    placeholder="Palkkatoive (valinnainen)"
                    value={searchProfile.salaryWish}
                    onChange={(e) =>
                      updateSearchProfile("salaryWish", e.target.value)
                    }
                    className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 outline-none focus:border-zinc-600"
                  />
                  <input
                    placeholder="Avainsanat, esim. myynti, varasto, kassa"
                    value={searchProfile.keywords}
                    onChange={(e) =>
                      updateSearchProfile("keywords", e.target.value)
                    }
                    className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 shadow-2xl shadow-black/20 p-5 md:p-7">
              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setTab("cv")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    tab === "cv"
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  CV
                </button>
                <button
                  type="button"
                  onClick={() => setTab("job")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    tab === "job"
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  Työpaikat
                </button>
                <button
                  type="button"
                  onClick={() => setTab("letter")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    tab === "letter"
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  Hakemukset
                </button>
              </div>

              {tab === "cv" && (
                <div className="space-y-5">
                  {parsedCv.cvBody && activeJob && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={createTailoredCv}
                        disabled={loadingTailoredCv}
                        className="rounded-2xl bg-violet-600 hover:bg-violet-500 px-5 py-3 font-medium transition disabled:opacity-50"
                      >
                        {loadingTailoredCv
                          ? "Luodaan kohdistettua CV:tä..."
                          : "Luo tähän työpaikkaan sopiva CV-versio"}
                      </button>
                    </div>
                  )}

                  {activeJobCvVariants.length > 0 && (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                      <h3 className="text-lg font-semibold mb-3">
                        Tallennetut CV-versiot valittuun työpaikkaan
                      </h3>

                      <div className="space-y-3">
                        {activeJobCvVariants.map((cv) => (
                          <button
                            key={cv.id}
                            type="button"
                            onClick={() => setCvResult(`CV_BODY:\n${cv.content}`)}
                            className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-4 py-3 transition"
                          >
                            <p className="font-medium">
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
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                          <h2 className="text-xl font-semibold mb-2">
                            Kuntotarkastus
                          </h2>
                          <p className="text-zinc-200">{parsedCv.score}</p>
                        </div>
                      )}

                      {parsedCv.report.length > 0 && (
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                          <h2 className="text-xl font-semibold mb-3">
                            Muutosraportti
                          </h2>
                          <ul className="list-disc pl-5 space-y-2 text-zinc-200">
                            {parsedCv.report.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 md:p-5 overflow-auto">
                        <CvPreview
                          cvText={parsedCv.cvBody}
                          image={profileImage}
                          styleVariant={cvStyle}
                        />
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
                          <PdfSafePreview
                            cvText={parsedCv.cvBody}
                            image={profileImage}
                            styleVariant={cvStyle}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
                      Generoitu CV-esikatselu näkyy täällä.
                    </div>
                  )}
                </div>
              )}

              {tab === "job" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-4">
                    <h3 className="text-lg font-semibold">Lisää työpaikka</h3>

                    <input
                      placeholder="Työpaikan otsikko"
                      value={jobForm.title}
                      onChange={(e) => updateJobForm("title", e.target.value)}
                      className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-3.5 outline-none focus:border-zinc-600"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        placeholder="Yrityksen nimi"
                        value={jobForm.company}
                        onChange={(e) =>
                          updateJobForm("company", e.target.value)
                        }
                        className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-3.5 outline-none focus:border-zinc-600"
                      />
                      <input
                        placeholder="Sijainti"
                        value={jobForm.location}
                        onChange={(e) =>
                          updateJobForm("location", e.target.value)
                        }
                        className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-3.5 outline-none focus:border-zinc-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        placeholder="Työsuhde, esim. osa-aikainen"
                        value={jobForm.type}
                        onChange={(e) => updateJobForm("type", e.target.value)}
                        className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-3.5 outline-none focus:border-zinc-600"
                      />
                      <input
                        placeholder="Työpaikan linkki (valinnainen)"
                        value={jobForm.url}
                        onChange={(e) => updateJobForm("url", e.target.value)}
                        className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-3.5 outline-none focus:border-zinc-600"
                      />
                    </div>

                    <textarea
                      placeholder="Lyhyt yhteenveto työpaikasta"
                      value={jobForm.summary}
                      onChange={(e) => updateJobForm("summary", e.target.value)}
                      className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-3.5 min-h-[90px] outline-none focus:border-zinc-600"
                    />

                    <textarea
                      placeholder="Liitä työpaikkailmoituksen teksti tähän"
                      value={jobForm.adText}
                      onChange={(e) => updateJobForm("adText", e.target.value)}
                      className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-3.5 min-h-[180px] outline-none focus:border-zinc-600"
                    />

                    <button
                      type="button"
                      onClick={addJob}
                      className="rounded-2xl bg-blue-600 hover:bg-blue-500 px-5 py-3 font-medium transition"
                    >
                      Lisää työpaikka listaan
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Työpaikat</h3>

                    {jobs.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
                        Ei lisättyjä työpaikkoja vielä.
                      </div>
                    ) : (
                      jobs.map((job) => {
                        const isActive = job.id === activeJobId;
                        const jobLetters = savedLetters.filter(
                          (letter) => letter.jobId === job.id
                        );
                        const jobCvs = savedCvVariants.filter(
                          (cv) => cv.jobId === job.id
                        );

                        return (
                          <div
                            key={job.id}
                            className={`rounded-2xl border p-4 transition ${
                              isActive
                                ? "border-blue-500 bg-blue-950/20"
                                : "border-zinc-800 bg-zinc-950"
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h4 className="text-lg font-semibold">
                                  {job.title || "Nimetön työpaikka"}
                                </h4>
                                <p className="text-zinc-400 text-sm">
                                  {[job.company, job.location, job.type]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveJobId(job.id)}
                                  className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-sm font-medium"
                                >
                                  {isActive ? "Valittu" : "Valitse"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => removeJob(job.id)}
                                  className="rounded-xl bg-red-600 hover:bg-red-500 px-3 py-2 text-sm font-medium"
                                >
                                  Poista
                                </button>
                              </div>
                            </div>

                            {job.summary && (
                              <p className="text-sm text-zinc-300 mt-3">
                                {job.summary}
                              </p>
                            )}

                            {job.whyFit && (
                              <p className="text-sm text-emerald-300 mt-3">
                                {job.whyFit}
                              </p>
                            )}

                            <div className="mt-3 text-xs text-zinc-500 space-y-1">
                              <p>Hakemuksia tallennettu: {jobLetters.length}</p>
                              <p>CV-versioita tallennettu: {jobCvs.length}</p>
                            </div>

                            {job.url && (
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300"
                              >
                                Avaa työpaikkalinkki
                              </a>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {tab === "letter" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                    <h3 className="text-lg font-semibold mb-2">
                      Valittu työpaikka
                    </h3>
                    {activeJob ? (
                      <div className="text-sm text-zinc-300 space-y-1">
                        <p>
                          <span className="text-zinc-500">Otsikko:</span>{" "}
                          {activeJob.title}
                        </p>
                        <p>
                          <span className="text-zinc-500">Yritys:</span>{" "}
                          {activeJob.company || "-"}
                        </p>
                        <p>
                          <span className="text-zinc-500">Sijainti:</span>{" "}
                          {activeJob.location || "-"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-zinc-400">Ei valittua työpaikkaa.</p>
                    )}

                    <button
                      type="button"
                      onClick={handleCoverLetterSubmit}
                      disabled={loadingLetter || !activeJob}
                      className="mt-4 rounded-2xl bg-purple-600 hover:bg-purple-500 px-5 py-3 font-medium transition disabled:opacity-50"
                    >
                      {loadingLetter
                        ? "Luodaan hakemus..."
                        : "Luo hakemus valittuun työpaikkaan"}
                    </button>
                  </div>

                  {activeJobLetters.length > 0 && (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                      <h3 className="text-lg font-semibold mb-3">
                        Tallennetut hakemukset tähän työpaikkaan
                      </h3>

                      <div className="space-y-3">
                        {activeJobLetters.map((letter) => (
                          <button
                            key={letter.id}
                            type="button"
                            onClick={() => {
                              setLetterResult(`HAKEMUS:\n${letter.content}`);
                            }}
                            className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-4 py-3 transition"
                          >
                            <p className="font-medium">
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
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                        <h2 className="text-xl font-semibold mb-3">Hakemus</h2>
                        <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-200 font-sans">
                          {parsedLetter}
                        </pre>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            parsedLetter,
                            "Hakemus kopioitu leikepöydälle."
                          )
                        }
                        className="rounded-2xl bg-amber-600 hover:bg-amber-500 px-5 py-3 font-medium transition"
                      >
                        Kopioi hakemus
                      </button>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
                      Generoitu hakemus näkyy täällä, kun valitset työpaikan ja
                      luot hakemuksen.
                    </div>
                  )}
                </div>
              )}
            </div>

            {(message || errorMessage) && (
              <div
                className={`rounded-2xl border p-4 text-sm ${
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