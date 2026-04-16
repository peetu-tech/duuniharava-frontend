"use client";

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
        accentColor: "#0369a1",
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
      <div className="rounded-[28px] border border-dashed border-zinc-700 bg-zinc-950/70 p-10 text-zinc-400">
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

  return (
    <div
      id="cv-preview"
      className="mx-auto w-full max-w-[860px] overflow-hidden border shadow-[0_30px_80px_rgba(15,23,42,0.14)]"
      style={{
        backgroundColor: style.mainBg,
        color: style.mainText,
        borderRadius: `${style.borderRadius}px`,
        borderColor: "#e2e8f0",
      }}
    >
      <div
        className="grid min-h-[1120px]"
        style={{
          gridTemplateColumns: `${style.sidebarWidth}px 1fr`,
        }}
      >
        <aside
          className="flex flex-col p-7"
          style={{
            backgroundColor: style.sidebarBg,
            color: style.sidebarText,
            borderRight:
              styleVariant === "bold"
                ? "none"
                : "1px solid rgba(148,163,184,0.2)",
          }}
        >
          {image ? (
            <img
              src={image}
              alt="Profiilikuva"
              className="mb-6 aspect-square w-full object-cover"
              style={{
                borderRadius: `${style.imageRadius}px`,
              }}
            />
          ) : (
            <div
              className="mb-6 flex aspect-square w-full items-center justify-center text-sm opacity-80"
              style={{
                borderRadius: `${style.imageRadius}px`,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              Ei kuvaa
            </div>
          )}

          <div className="space-y-6">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] opacity-70">
                Yhteystiedot
              </p>
              <div className="space-y-2 text-sm leading-6">
                {contactLines.map((line, index) => (
                  <p key={index} className="break-words">
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] opacity-70">
                Profiili
              </p>
              <div className="flex flex-wrap gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor:
                      styleVariant === "bold"
                        ? "rgba(99,102,241,0.18)"
                        : styleVariant === "classic"
                        ? "#e7e5e4"
                        : styleVariant === "compact"
                        ? "#e2e8f0"
                        : "rgba(255,255,255,0.10)",
                    color:
                      styleVariant === "bold"
                        ? "#c7d2fe"
                        : styleVariant === "classic"
                        ? "#57534e"
                        : styleVariant === "compact"
                        ? "#475569"
                        : "#e2e8f0",
                  }}
                >
                  CV Studio
                </span>

                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor:
                      styleVariant === "bold"
                        ? "rgba(99,102,241,0.18)"
                        : styleVariant === "classic"
                        ? "#e7e5e4"
                        : styleVariant === "compact"
                        ? "#e2e8f0"
                        : "rgba(255,255,255,0.10)",
                    color:
                      styleVariant === "bold"
                        ? "#c7d2fe"
                        : styleVariant === "classic"
                        ? "#57534e"
                        : styleVariant === "compact"
                        ? "#475569"
                        : "#e2e8f0",
                  }}
                >
                  Duuniharava
                </span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-8 text-[11px] uppercase tracking-[0.22em] opacity-45">
            {styleVariant === "modern" && "Moderni pohja"}
            {styleVariant === "classic" && "Klassinen pohja"}
            {styleVariant === "compact" && "Tiivis pohja"}
            {styleVariant === "bold" && "Näyttävä pohja"}
          </div>
        </aside>

        <main className={isCompact ? "p-7" : "p-9 md:p-10"}>
          <header
            className="mb-8 pb-6"
            style={{
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <h1
              style={{
                fontSize: `${style.nameSize}px`,
                lineHeight: 1.05,
                fontWeight: styleVariant === "bold" ? 900 : 700,
                letterSpacing: "-0.03em",
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
                className="mt-2 text-sm"
                style={{
                  color: style.accentColor,
                  fontWeight:
                    styleVariant === "bold" || styleVariant === "modern"
                      ? 600
                      : 500,
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
                      fontWeight: styleVariant === "bold" ? 900 : 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.24em",
                      color: style.headingColor,
                      borderTop:
                        styleVariant === "bold"
                          ? "1px solid rgba(67,56,202,0.15)"
                          : "1px solid #e2e8f0",
                      paddingTop: styleVariant === "compact" ? "12px" : "16px",
                      marginTop: `${style.sectionSpacing}px`,
                      marginBottom: "10px",
                    }}
                  >
                    {line}
                  </h2>
                );
              }

              return (
                <p key={index} style={{ marginBottom: "8px" }}>
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