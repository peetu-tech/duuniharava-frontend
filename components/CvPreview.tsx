"use client";

import Image from "next/image";

type CvStyleVariant = "modern" | "classic" | "compact" | "bold";

export type CvCustomStyle = {
  sidebarBg: string;
  sidebarText: string;
  mainBg: string;
  mainText: string;
  headingColor: string;
  accentColor: string;
  borderRadius: number;
  sidebarWidth: number;
  nameSize: number;
  bodySize: number;
  lineHeight: number;
  sectionSpacing: number;
  imageRadius: number;
};

type CvPreviewProps = {
  cvText: string;
  image?: string;
  styleVariant?: CvStyleVariant;
  customStyle?: CvCustomStyle;
};

function splitLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const headingNames = [
  "Profiili",
  "Työkokemus",
  "Koulutus",
  "Kielitaito",
  "Taidot",
  "Kortit ja pätevyydet",
  "Harrastukset",
];

function isHeading(line: string) {
  return line === line.toUpperCase() || headingNames.includes(line);
}

function getDefaultCustomStyle(styleVariant: CvStyleVariant): CvCustomStyle {
  switch (styleVariant) {
    case "classic":
      return {
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
      };
    case "compact":
      return {
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
      };
    case "bold":
      return {
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
      };
    case "modern":
    default:
      return {
        sidebarBg: "#0f172a",
        sidebarText: "#ffffff",
        mainBg: "#ffffff",
        mainText: "#111827",
        headingColor: "#475569",
        accentColor: "#0ea5a4",
        borderRadius: 30,
        sidebarWidth: 255,
        nameSize: 40,
        bodySize: 15,
        lineHeight: 1.7,
        sectionSpacing: 24,
        imageRadius: 24,
      };
  }
}

function DuuniharavaMiniLogo({
  styleVariant,
  sidebarText,
  accentColor,
}: {
  styleVariant: CvStyleVariant;
  sidebarText: string;
  accentColor: string;
}) {
  const softBg =
    styleVariant === "classic"
      ? "rgba(161,98,7,0.10)"
      : styleVariant === "compact"
      ? "rgba(15,118,110,0.10)"
      : styleVariant === "bold"
      ? "rgba(99,102,241,0.16)"
      : "rgba(14,165,164,0.14)";

  const borderColor =
    styleVariant === "classic"
      ? "rgba(161,98,7,0.18)"
      : styleVariant === "compact"
      ? "rgba(15,118,110,0.18)"
      : styleVariant === "bold"
      ? "rgba(129,140,248,0.18)"
      : "rgba(45,212,191,0.18)";

  return (
    <div
      className="inline-flex items-center gap-3 rounded-2xl px-3 py-3"
      style={{
        background: softBg,
        border: `1px solid ${borderColor}`,
      }}
    >
      <div
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
        style={{
          background: `linear-gradient(135deg, ${accentColor}, ${
            styleVariant === "classic"
              ? "#d97706"
              : styleVariant === "compact"
              ? "#14b8a6"
              : styleVariant === "bold"
              ? "#6366f1"
              : "#22d3ee"
          })`,
        }}
      >
        <div className="absolute inset-[2px] rounded-[14px] bg-white/90" />
        <svg
          viewBox="0 0 64 64"
          className="relative z-10 h-7 w-7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 18h18c10 0 18 8 18 18s-8 18-18 18H22"
            stroke={accentColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 14v36"
            stroke={accentColor}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M39 39l11 11"
            stroke="#0f172a"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="leading-tight">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: sidebarText, opacity: 0.68 }}
        >
          Duuniharava
        </p>
        <p
          className="text-sm font-semibold"
          style={{ color: sidebarText, opacity: 0.96 }}
        >
          CV Studio
        </p>
      </div>
    </div>
  );
}

export default function CvPreview({
  cvText,
  image,
  styleVariant = "modern",
  customStyle,
}: CvPreviewProps) {
  const lines = splitLines(cvText);
  const style = customStyle ?? getDefaultCustomStyle(styleVariant);

  if (!lines.length) {
    return (
      <div className="rounded-[32px] border border-dashed border-white/10 bg-zinc-950/70 p-12 text-zinc-400">
        CV-esikatselu näkyy täällä.
      </div>
    );
  }

  const name = lines[0] || "";
  const contactLines = lines.slice(1, 4);
  const contentLines = lines.slice(4);
  const roleLine = contentLines[0]?.toLowerCase().startsWith("tavoiteltu työ:")
    ? contentLines[0]
    : "";

  const remainingContent = roleLine ? contentLines.slice(1) : contentLines;
  const isCompact = styleVariant === "compact";

  const softChipBg =
    styleVariant === "bold"
      ? "rgba(99,102,241,0.18)"
      : styleVariant === "classic"
      ? "#e7e5e4"
      : styleVariant === "compact"
      ? "#dbeafe"
      : "rgba(255,255,255,0.10)";

  const softChipText =
    styleVariant === "bold"
      ? "#c7d2fe"
      : styleVariant === "classic"
      ? "#57534e"
      : styleVariant === "compact"
      ? "#334155"
      : "#e2e8f0";

  const cardShadow =
    styleVariant === "bold"
      ? "0 36px 90px rgba(79,70,229,0.16)"
      : styleVariant === "classic"
      ? "0 30px 80px rgba(120,113,108,0.12)"
      : styleVariant === "compact"
      ? "0 30px 80px rgba(15,23,42,0.10)"
      : "0 36px 90px rgba(15,23,42,0.16)";

  return (
    <div
      id="cv-preview"
      className="mx-auto w-full max-w-[900px] overflow-hidden border transition-all duration-300"
      style={{
        backgroundColor: style.mainBg,
        color: style.mainText,
        borderRadius: `${style.borderRadius}px`,
        borderColor:
          styleVariant === "classic"
            ? "#e7e5e4"
            : styleVariant === "bold"
            ? "rgba(99,102,241,0.18)"
            : "#e2e8f0",
        boxShadow: cardShadow,
      }}
    >
      <div
        className="grid min-h-[1120px]"
        style={{
          gridTemplateColumns: `${style.sidebarWidth}px 1fr`,
        }}
      >
        <aside
          className="flex flex-col p-8"
          style={{
            background:
              styleVariant === "modern"
                ? `linear-gradient(180deg, ${style.sidebarBg} 0%, #111827 100%)`
                : styleVariant === "bold"
                ? `linear-gradient(180deg, ${style.sidebarBg} 0%, #312e81 100%)`
                : style.sidebarBg,
            color: style.sidebarText,
            borderRight:
              styleVariant === "bold"
                ? "none"
                : "1px solid rgba(148,163,184,0.18)",
          }}
        >
          <div className="mb-7">
            <DuuniharavaMiniLogo
              styleVariant={styleVariant}
              sidebarText={style.sidebarText}
              accentColor={style.accentColor}
            />
          </div>

          {image ? (
            <div
              className="relative mb-7 aspect-square w-full overflow-hidden transition-all duration-300"
              style={{
                borderRadius: `${style.imageRadius}px`,
                boxShadow:
                  styleVariant === "classic"
                    ? "0 12px 28px rgba(120,113,108,0.12)"
                    : "0 18px 36px rgba(15,23,42,0.20)",
                border:
                  styleVariant === "classic"
                    ? "1px solid rgba(120,113,108,0.12)"
                    : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Image
                src={image}
                alt="Profiilikuva"
                fill
                unoptimized
                sizes="(max-width: 900px) 100vw, 255px"
                className="object-cover"
              />
            </div>
          ) : (
            <div
              className="mb-7 flex aspect-square w-full items-center justify-center text-sm font-medium transition-all duration-300"
              style={{
                borderRadius: `${style.imageRadius}px`,
                border:
                  styleVariant === "classic"
                    ? "1px solid rgba(120,113,108,0.12)"
                    : "1px solid rgba(255,255,255,0.12)",
                background:
                  styleVariant === "classic"
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(255,255,255,0.05)",
                opacity: 0.86,
              }}
            >
              Ei kuvaa
            </div>
          )}

          <div className="space-y-7">
            <div
              className="rounded-[24px] px-4 py-4"
              style={{
                background:
                  styleVariant === "classic"
                    ? "rgba(255,255,255,0.65)"
                    : "rgba(255,255,255,0.05)",
                border:
                  styleVariant === "classic"
                    ? "1px solid rgba(120,113,108,0.08)"
                    : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] opacity-70">
                Yhteystiedot
              </p>
              <div className="space-y-2.5 text-sm leading-6">
                {contactLines.map((line, index) => (
                  <p key={index} className="break-words">
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div
              className="rounded-[24px] px-4 py-4"
              style={{
                background:
                  styleVariant === "classic"
                    ? "rgba(255,255,255,0.65)"
                    : "rgba(255,255,255,0.05)",
                border:
                  styleVariant === "classic"
                    ? "1px solid rgba(120,113,108,0.08)"
                    : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] opacity-70">
                Profiili
              </p>

              <div className="flex flex-wrap gap-2">
                <span
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    backgroundColor: softChipBg,
                    color: softChipText,
                  }}
                >
                  Työnhaku
                </span>

                <span
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    backgroundColor: softChipBg,
                    color: softChipText,
                  }}
                >
                  Duuniharava
                </span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-10 text-[11px] uppercase tracking-[0.22em] opacity-45">
            {styleVariant === "modern" && "Moderni pohja"}
            {styleVariant === "classic" && "Klassinen pohja"}
            {styleVariant === "compact" && "Tiivis pohja"}
            {styleVariant === "bold" && "Näyttävä pohja"}
          </div>
        </aside>

        <main className={isCompact ? "p-8" : "p-10 md:p-12"}>
          <header
            className="mb-9 pb-7"
            style={{
              borderBottom:
                styleVariant === "bold"
                  ? "1px solid rgba(67,56,202,0.15)"
                  : styleVariant === "classic"
                  ? "1px solid #e7e5e4"
                  : "1px solid #e2e8f0",
            }}
          >
            <h1
              style={{
                fontSize: `${style.nameSize}px`,
                lineHeight: 1.02,
                fontWeight: styleVariant === "bold" ? 900 : 800,
                letterSpacing: "-0.04em",
                color: style.mainText,
                fontFamily:
                  styleVariant === "classic"
                    ? "Georgia, serif"
                    : "inherit",
              }}
            >
              {name}
            </h1>

            {roleLine && (
              <p
                className="mt-3 text-sm"
                style={{
                  color: style.accentColor,
                  fontWeight:
                    styleVariant === "bold" || styleVariant === "modern"
                      ? 700
                      : 600,
                  letterSpacing: "-0.01em",
                }}
              >
                {roleLine}
              </p>
            )}
          </header>

          <div
            className="whitespace-pre-wrap"
            style={{
              fontSize: `${style.bodySize}px`,
              lineHeight: style.lineHeight,
              color: style.mainText,
            }}
          >
            {remainingContent.map((line, index) => {
              if (isHeading(line)) {
                return (
                  <h2
                    key={index}
                    style={{
                      fontSize: styleVariant === "compact" ? "10px" : "11px",
                      fontWeight: styleVariant === "bold" ? 900 : 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.24em",
                      color: style.headingColor,
                      borderTop:
                        styleVariant === "bold"
                          ? "1px solid rgba(67,56,202,0.15)"
                          : styleVariant === "classic"
                          ? "1px solid #ece7e3"
                          : "1px solid #e2e8f0",
                      paddingTop: styleVariant === "compact" ? "12px" : "16px",
                      marginTop: `${style.sectionSpacing}px`,
                      marginBottom: "12px",
                    }}
                  >
                    {line}
                  </h2>
                );
              }

              return (
                <p
                  key={index}
                  style={{
                    marginBottom: "10px",
                  }}
                >
                  {line}
                </p>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
