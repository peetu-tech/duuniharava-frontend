"use client";

import React from "react";

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

// Yleiset ikonit SVG-muodossa
const Icons = {
  Phone: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
  ),
  Mail: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
  ),
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
  )
};

function splitLines(text: string) {
  return text.split("\n").map((line) => line.trim()).filter(Boolean);
}

const headingNames = [
  "PROFIILI",
  "TYÖKOKEMUS",
  "KOULUTUS",
  "KIELITAITO",
  "TAIDOT",
  "KORTIT JA PÄTEVYYDET",
  "HARRASTUKSET",
];

function isHeading(line: string) {
  return line === line.toUpperCase() || headingNames.includes(line.toUpperCase());
}

function getDefaultCustomStyle(styleVariant: CvStyleVariant): CvCustomStyle {
  switch (styleVariant) {
    case "classic":
      return {
        sidebarBg: "#f4f4f5", sidebarText: "#292524", mainBg: "#ffffff", mainText: "#292524",
        headingColor: "#57534e", accentColor: "#9a3412", borderRadius: 0, sidebarWidth: 260,
        nameSize: 42, bodySize: 14, lineHeight: 1.6, sectionSpacing: 28, imageRadius: 0,
      };
    case "compact":
      return {
        sidebarBg: "#f8fafc", sidebarText: "#1e293b", mainBg: "#ffffff", mainText: "#334155",
        headingColor: "#475569", accentColor: "#0d9488", borderRadius: 16, sidebarWidth: 230,
        nameSize: 34, bodySize: 13, lineHeight: 1.5, sectionSpacing: 20, imageRadius: 16,
      };
    case "bold":
      return {
        sidebarBg: "#ffffff", sidebarText: "#111827", mainBg: "#ffffff", mainText: "#1f2937",
        headingColor: "#111827", accentColor: "#4f46e5", borderRadius: 24, sidebarWidth: 0, // Bold käyttää 1-sarakkeista leiskaa
        nameSize: 52, bodySize: 15, lineHeight: 1.7, sectionSpacing: 32, imageRadius: 24,
      };
    case "modern":
    default:
      return {
        sidebarBg: "#0f172a", sidebarText: "#f8fafc", mainBg: "#ffffff", mainText: "#334155",
        headingColor: "#1e293b", accentColor: "#0ea5a4", borderRadius: 30, sidebarWidth: 280,
        nameSize: 44, bodySize: 14, lineHeight: 1.7, sectionSpacing: 26, imageRadius: 30,
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
      <div className="rounded-[32px] border border-dashed border-white/10 bg-zinc-950/70 p-12 text-zinc-400 text-center font-medium">
        CV-esikatselu muodostuu tähän.
      </div>
    );
  }

  // --- ÄLYKÄS PARSERI ---
  // Puretaan tekoälyn teksti palikoiksi, jotta voimme tehdä hienoja UI-elementtejä
  const name = lines[0] || "";
  const phone = lines[1] || "";
  const email = lines[2] || "";
  const location = lines[3] || "";
  const contentLines = lines.slice(4);
  
  let roleLine = "";
  if (contentLines[0] && !isHeading(contentLines[0])) {
    roleLine = contentLines[0];
    contentLines.shift();
  }

  const sections: { title: string; items: string[] }[] = [];
  let currentSection = { title: "", items: [] as string[] };

  contentLines.forEach((line) => {
    if (isHeading(line)) {
      if (currentSection.title || currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: line, items: [] };
    } else {
      currentSection.items.push(line);
    }
  });
  if (currentSection.title || currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  // Erotellaan osiot tyypin mukaan
  const isTagSection = (title: string) => ["TAIDOT", "KIELITAITO", "KORTIT JA PÄTEVYYDET", "HARRASTUKSET"].includes(title.toUpperCase());
  const isTimelineSection = (title: string) => ["TYÖKOKEMUS", "KOULUTUS"].includes(title.toUpperCase());

  // Komponentti tageille (Canva-style pillerit)
  const renderTags = (items: string[]) => {
    // Jos tekoäly laittoi taidot yhdelle riville pilkulla erotettuna, rikotaan ne tag-arrayksi
    const tags = items.flatMap(i => i.split(',')).map(t => t.trim().replace(/^- /g, '')).filter(Boolean);
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {tags.map((tag, idx) => (
          <span key={idx} className="px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide" style={{ backgroundColor: `${style.accentColor}15`, color: style.accentColor, border: `1px solid ${style.accentColor}30` }}>
            {tag}
          </span>
        ))}
      </div>
    );
  };

  // Komponentti aikajanalle (Työ/Koulu)
  const renderTimeline = (items: string[]) => {
    return (
      <div className="mt-4 space-y-4 pl-3 border-l-2" style={{ borderColor: `${style.accentColor}30` }}>
        {items.map((item, idx) => {
          const isMainPoint = !item.startsWith("-") && item.length > 10;
          return (
            <div key={idx} className={`relative ${isMainPoint ? 'mt-6 first:mt-2' : 'mt-1 pl-4'}`}>
              {isMainPoint && (
                <div className="absolute -left-[17px] top-1.5 w-3 h-3 rounded-full border-2 bg-white" style={{ borderColor: style.accentColor }} />
              )}
              <p style={{ fontWeight: isMainPoint ? 700 : 400, fontSize: isMainPoint ? style.bodySize : style.bodySize - 1, color: isMainPoint ? style.headingColor : style.mainText, opacity: isMainPoint ? 1 : 0.85 }}>
                {item}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  // --- BOLD-TYYLI (1-sarakkeinen, iso visuaalinen yläosa, Canva-tyylinen grid) ---
  if (styleVariant === "bold") {
    return (
      <div id="cv-preview" className="mx-auto w-full max-w-[900px] overflow-hidden transition-all duration-300 relative shadow-2xl" style={{ backgroundColor: style.mainBg, color: style.mainText, borderRadius: `${style.borderRadius}px` }}>
        <header className="relative px-12 py-16 overflow-hidden" style={{ backgroundColor: style.accentColor, color: "#fff" }}>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_50%)]"></div>
          <div className="relative z-10 flex gap-8 items-center">
            {image && (
              <img src={image} alt="Profiilikuva" className="w-40 h-40 object-cover shadow-2xl border-4 border-white/20" style={{ borderRadius: `${style.imageRadius}px` }} />
            )}
            <div>
              <h1 style={{ fontSize: `${style.nameSize}px`, lineHeight: 1, fontWeight: 900, letterSpacing: "-0.03em" }}>{name}</h1>
              {roleLine && <p className="mt-3 text-xl font-bold text-white/90 tracking-wide">{roleLine}</p>}
              <div className="flex flex-wrap gap-5 mt-6 text-sm font-medium text-white/80">
                {phone && <span className="flex items-center gap-2"><Icons.Phone /> {phone}</span>}
                {email && <span className="flex items-center gap-2"><Icons.Mail /> {email}</span>}
                {location && <span className="flex items-center gap-2"><Icons.MapPin /> {location}</span>}
              </div>
            </div>
          </div>
        </header>

        <main className="p-12 grid grid-cols-[1fr_300px] gap-12 items-start">
          <div className="space-y-10">
            {sections.filter(s => !isTagSection(s.title)).map((section, i) => (
              <section key={i}>
                <h2 className="uppercase tracking-[0.2em] font-black mb-4 border-b-2 pb-2" style={{ fontSize: "14px", color: style.headingColor, borderColor: `${style.accentColor}20` }}>{section.title}</h2>
                {isTimelineSection(section.title) ? renderTimeline(section.items) : (
                  <div className="space-y-2" style={{ fontSize: `${style.bodySize}px`, lineHeight: style.lineHeight }}>
                    {section.items.map((line, j) => <p key={j}>{line}</p>)}
                  </div>
                )}
              </section>
            ))}
          </div>

          <div className="space-y-10 p-8 rounded-3xl" style={{ backgroundColor: `${style.accentColor}08` }}>
            {sections.filter(s => isTagSection(s.title)).map((section, i) => (
              <section key={i}>
                <h2 className="uppercase tracking-[0.2em] font-black mb-4" style={{ fontSize: "12px", color: style.headingColor }}>{section.title}</h2>
                {renderTags(section.items)}
              </section>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // --- MODERN, CLASSIC, COMPACT -TYYLIT (2-sarakkeiset leiskat) ---
  return (
    <div id="cv-preview" className="mx-auto w-full max-w-[900px] overflow-hidden border shadow-xl transition-all duration-300" style={{ backgroundColor: style.mainBg, color: style.mainText, borderRadius: `${style.borderRadius}px`, borderColor: styleVariant === "classic" ? "#e7e5e4" : "#e2e8f0" }}>
      <div className="grid min-h-[1050px]" style={{ gridTemplateColumns: `${style.sidebarWidth}px 1fr` }}>
        
        {/* SIVUPALKKI */}
        <aside className="flex flex-col p-8 md:p-10" style={{ background: style.sidebarBg, color: style.sidebarText, borderRight: styleVariant === "classic" ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
          {image && (
            <img src={image} alt="Profiili" className="mb-8 aspect-square w-full object-cover shadow-lg" style={{ borderRadius: `${style.imageRadius}px` }} />
          )}

          <div className="mb-10">
            <h2 className="uppercase tracking-[0.2em] font-black mb-4 opacity-50 text-[11px]">Yhteystiedot</h2>
            <div className="space-y-4 text-sm font-medium opacity-90">
              {phone && <div className="flex items-center gap-3"><span style={{ color: style.accentColor }}><Icons.Phone /></span> {phone}</div>}
              {email && <div className="flex items-center gap-3"><span style={{ color: style.accentColor }}><Icons.Mail /></span> <span className="break-all">{email}</span></div>}
              {location && <div className="flex items-center gap-3"><span style={{ color: style.accentColor }}><Icons.MapPin /></span> {location}</div>}
            </div>
          </div>

          {/* Sijoitetaan tägit/pienet asiat sivupalkkiin jos 2-sarakkeinen */}
          <div className="space-y-8 mt-auto">
            {sections.filter(s => isTagSection(s.title)).map((section, i) => (
              <div key={i}>
                <h2 className="uppercase tracking-[0.2em] font-black mb-3 opacity-50 text-[11px]">{section.title}</h2>
                <div className="flex flex-wrap gap-2">
                  {section.items.flatMap(i => i.split(',')).map(t => t.trim().replace(/^- /g, '')).filter(Boolean).map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded bg-black/10 text-xs font-semibold backdrop-blur-sm border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* PÄÄALUE */}
        <main className={styleVariant === "compact" ? "p-8" : "p-10 md:p-14"}>
          <header className="mb-10 pb-8" style={{ borderBottom: `2px solid ${style.accentColor}20` }}>
            <h1 style={{ fontSize: `${style.nameSize}px`, lineHeight: 1.1, fontWeight: styleVariant === "classic" ? 700 : 900, letterSpacing: "-0.03em", color: style.headingColor, fontFamily: styleVariant === "classic" ? "Georgia, serif" : "inherit" }}>
              {name}
            </h1>
            {roleLine && (
              <p className="mt-3 text-lg font-bold tracking-wide uppercase" style={{ color: style.accentColor }}>
                {roleLine}
              </p>
            )}
          </header>

          <div className="space-y-10" style={{ fontSize: `${style.bodySize}px`, lineHeight: style.lineHeight }}>
            {sections.filter(s => !isTagSection(s.title)).map((section, index) => (
              <section key={index}>
                <h2 className="uppercase tracking-[0.2em] font-black mb-5 flex items-center gap-3" style={{ fontSize: "14px", color: style.headingColor }}>
                  <span className="w-6 h-6 rounded flex items-center justify-center text-white" style={{ backgroundColor: style.accentColor }}>✦</span>
                  {section.title}
                </h2>
                
                {isTimelineSection(section.title) ? (
                  renderTimeline(section.items)
                ) : (
                  <div className="space-y-3 opacity-80">
                    {section.items.map((line, j) => <p key={j}>{line}</p>)}
                  </div>
                )}
              </section>
            ))}
          </div>
        </main>

      </div>
    </div>
  );
}
