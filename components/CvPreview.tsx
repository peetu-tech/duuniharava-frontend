"use client";

type CvStyleVariant = "modern" | "classic" | "compact" | "bold";

type CvPreviewProps = {
  cvText: string;
  image?: string;
  styleVariant?: CvStyleVariant;
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

function getVariantClasses(styleVariant: CvStyleVariant) {
  switch (styleVariant) {
    case "classic":
      return {
        root: "bg-white text-slate-900",
        shell: "border border-slate-200 shadow-[0_30px_80px_rgba(15,23,42,0.12)]",
        aside: "bg-stone-100 text-slate-900 border-r border-stone-200",
        heading:
          "text-[11px] font-bold uppercase tracking-[0.24em] text-stone-500 border-t border-stone-200 pt-4 mt-6",
        name: "text-4xl font-serif font-bold tracking-tight text-slate-900",
        role: "text-sm text-stone-600 mt-2",
        body: "text-[15px] leading-7 text-slate-700",
        chip: "bg-stone-200 text-stone-700",
      };
    case "compact":
      return {
        root: "bg-white text-slate-900",
        shell: "border border-slate-200 shadow-[0_24px_70px_rgba(15,23,42,0.10)]",
        aside: "bg-slate-50 text-slate-900 border-r border-slate-200",
        heading:
          "text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 border-t border-slate-200 pt-3 mt-5",
        name: "text-3xl font-bold tracking-tight text-slate-900",
        role: "text-sm text-slate-500 mt-2",
        body: "text-[14px] leading-6 text-slate-700",
        chip: "bg-slate-200 text-slate-700",
      };
    case "bold":
      return {
        root: "bg-white text-slate-900",
        shell: "border border-indigo-200 shadow-[0_30px_90px_rgba(67,56,202,0.16)]",
        aside: "bg-indigo-950 text-white",
        heading:
          "text-[11px] font-black uppercase tracking-[0.24em] text-indigo-400 border-t border-indigo-200/15 pt-4 mt-6",
        name: "text-5xl font-black tracking-tight text-slate-950",
        role: "text-sm text-indigo-700 mt-2 font-semibold",
        body: "text-[15px] leading-7 text-slate-700",
        chip: "bg-indigo-500/15 text-indigo-200",
      };
    case "modern":
    default:
      return {
        root: "bg-white text-slate-900",
        shell: "border border-slate-200 shadow-[0_30px_80px_rgba(15,23,42,0.14)]",
        aside: "bg-slate-900 text-white",
        heading:
          "text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 border-t border-slate-200 pt-4 mt-6",
        name: "text-4xl font-bold tracking-tight text-slate-900",
        role: "text-sm text-sky-700 mt-2 font-medium",
        body: "text-[15px] leading-7 text-slate-700",
        chip: "bg-white/10 text-slate-200",
      };
  }
}

export default function CvPreview({
  cvText,
  image,
  styleVariant = "modern",
}: CvPreviewProps) {
  const lines = splitLines(cvText);
  const styles = getVariantClasses(styleVariant);

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
      className={`mx-auto w-full max-w-[860px] overflow-hidden rounded-[30px] ${styles.root} ${styles.shell}`}
    >
      <div
        className={`grid min-h-[1120px] ${
          isCompact ? "grid-cols-[220px_1fr]" : "grid-cols-[255px_1fr]"
        }`}
      >
        <aside className={`${styles.aside} flex flex-col p-7`}>
          {image ? (
            <img
              src={image}
              alt="Profiilikuva"
              className="mb-6 aspect-square w-full rounded-[24px] object-cover"
            />
          ) : (
            <div className="mb-6 flex aspect-square w-full items-center justify-center rounded-[24px] border border-white/10 bg-white/5 text-sm opacity-80">
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
                  className={`rounded-full px-3 py-1 text-xs font-medium ${styles.chip}`}
                >
                  CV Studio
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${styles.chip}`}
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
          <header className="mb-8 border-b border-slate-200 pb-6">
            <h1 className={styles.name}>{name}</h1>
            {roleLine && <p className={styles.role}>{roleLine}</p>}
          </header>

          <div className={`space-y-2 whitespace-pre-wrap ${styles.body}`}>
            {remainingContent.map((line, index) => {
              if (isHeading(line)) {
                return (
                  <h2 key={index} className={styles.heading}>
                    {line}
                  </h2>
                );
              }

              return <p key={index}>{line}</p>;
            })}
          </div>
        </main>
      </div>
    </div>
  );
}