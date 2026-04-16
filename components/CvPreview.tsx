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
        aside: "bg-stone-100 text-slate-900 border-r border-stone-200",
        heading: "text-[12px] font-bold uppercase tracking-[0.18em] text-stone-500 border-t border-stone-200 pt-4",
        name: "text-4xl font-serif font-bold tracking-tight mb-8",
        body: "text-[15px] leading-7",
      };
    case "compact":
      return {
        root: "bg-white text-slate-900",
        aside: "bg-slate-50 text-slate-900 border-r border-slate-200",
        heading: "text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 border-t border-slate-200 pt-3",
        name: "text-3xl font-bold tracking-tight mb-6",
        body: "text-[14px] leading-6",
      };
    case "bold":
      return {
        root: "bg-white text-slate-900",
        aside: "bg-indigo-950 text-white",
        heading: "text-[12px] font-black uppercase tracking-[0.22em] text-indigo-300 border-t border-indigo-200/20 pt-4",
        name: "text-5xl font-black tracking-tight mb-8 text-slate-950",
        body: "text-[15px] leading-7",
      };
    case "modern":
    default:
      return {
        root: "bg-white text-slate-900",
        aside: "bg-slate-800 text-white",
        heading: "text-[12px] font-bold uppercase tracking-[0.18em] text-slate-500 border-t border-slate-200 pt-4",
        name: "text-4xl font-bold tracking-tight mb-8",
        body: "text-[15px] leading-7",
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
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-slate-500">
        CV-esikatselu näkyy täällä.
      </div>
    );
  }

  const name = lines[0] || "";
  const contactLines = lines.slice(1, 4);
  const contentLines = lines.slice(4);

  const isCompact = styleVariant === "compact";

  return (
    <div
      id="cv-preview"
      className={`mx-auto w-full max-w-[820px] rounded-2xl shadow-2xl overflow-hidden ${styles.root}`}
    >
      <div
        className={`grid ${isCompact ? "grid-cols-[200px_1fr]" : "grid-cols-[220px_1fr]"} min-h-[1000px]`}
      >
        <aside className={`${styles.aside} p-6`}>
          {image ? (
            <img
              src={image}
              alt="Profiilikuva"
              className="w-full aspect-square object-cover rounded-2xl border border-white/20 mb-6"
            />
          ) : (
            <div className="w-full aspect-square rounded-2xl border border-white/20 bg-black/10 flex items-center justify-center text-sm opacity-80 mb-6">
              Ei kuvaa
            </div>
          )}

          <div className="space-y-5 text-sm leading-6">
            {contactLines.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70 mb-2">
                  Yhteystiedot
                </h3>
                <div className="space-y-1">
                  {contactLines.map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className={isCompact ? "p-6" : "p-8"}>
          <h1 className={styles.name}>{name}</h1>

          <div className={`space-y-3 whitespace-pre-wrap ${styles.body}`}>
            {contentLines.map((line, index) => {
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