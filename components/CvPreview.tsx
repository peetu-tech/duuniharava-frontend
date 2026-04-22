"use client";

import React from "react";

export type CvStyleVariant = "modern" | "classic" | "compact" | "bold";

// Päivitetty tyyppi, joka ottaa vastaan kaikki uudet "Canva-ominaisuudet" Studiolta
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
  pattern?: "none" | "dots" | "lines" | "grid";
  patternOpacity?: number;
  showSeparators?: boolean;
  fontFamily?: "sans" | "serif" | "mono";
  layout?: "left-sidebar" | "right-sidebar" | "top-header" | "two-column";
  headingAlign?: "left" | "center";
  tagStyle?: "solid" | "outline" | "minimal";
  imageShape?: "square" | "circle" | "rounded";
};

type CvPreviewProps = {
  cvText: string;
  image?: string;
  styleVariant?: CvStyleVariant;
  customStyle?: CvCustomStyle;
};

// Ikonit yhteystiedoille
const Icons = {
  Phone: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
  ),
  Mail: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
  ),
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
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

export default function CvPreview({
  cvText,
  image,
  customStyle,
}: CvPreviewProps) {
  const lines = splitLines(cvText);

  // Varmistetaan että tyyli on olemassa, jottei kaadu
  if (!customStyle) return null;

  if (!lines.length) {
    return (
      <div className="rounded-[32px] border border-dashed border-white/10 bg-zinc-950/70 p-12 text-zinc-400 text-center font-medium">
        CV-esikatselu muodostuu tähän.
      </div>
    );
  }

  // Puretaan teksti osiin
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

  // Dynaamiset luokat
  const fontClass = customStyle.fontFamily === 'serif' ? 'font-serif' : customStyle.fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const textAlign = customStyle.headingAlign === 'center' ? 'text-center' : 'text-left';
  const imgBorderRadius = customStyle.imageShape === 'circle' ? '50%' : customStyle.imageShape === 'square' ? '0px' : `${customStyle.imageRadius}px`;

  // Taustakuviointi logiikka
  const getPatternStyle = (): React.CSSProperties => {
    if (!customStyle.pattern || customStyle.pattern === "none") return {};
    const opacity = (customStyle.patternOpacity || 5) / 100;
    const color = `rgba(0, 0, 0, ${opacity})`;
    
    if (customStyle.pattern === "dots") {
      return { backgroundImage: `radial-gradient(${color} 2px, transparent 2px)`, backgroundSize: "20px 20px" };
    }
    if (customStyle.pattern === "lines") {
      return { backgroundImage: `repeating-linear-gradient(45deg, ${color} 0, ${color} 2px, transparent 0, transparent 50%)`, backgroundSize: "14px 14px" };
    }
    if (customStyle.pattern === "grid") {
      return { backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`, backgroundSize: "20px 20px" };
    }
    return {};
  };

  // Renderöidään Taidot / Kielet / Harrastukset tyylikkäinä pillereinä
  const renderTags = (items: string[]) => {
    const tags = items.flatMap(i => i.split(/,|•|-/)).map(t => t.trim()).filter(Boolean);
    
    return (
      <div className={`flex flex-wrap gap-2 mt-3 ${customStyle.headingAlign === 'center' ? 'justify-center' : ''}`}>
        {tags.map((tag, idx) => {
          let tagCss: React.CSSProperties = {};
          if (customStyle.tagStyle === 'solid') {
            tagCss = { backgroundColor: customStyle.accentColor, color: '#fff', border: 'none' };
          } else if (customStyle.tagStyle === 'outline') {
            tagCss = { backgroundColor: 'transparent', color: customStyle.accentColor, border: `2px solid ${customStyle.accentColor}` };
          } else {
            tagCss = { backgroundColor: `${customStyle.accentColor}15`, color: customStyle.accentColor, border: 'none' };
          }

          return (
            <span key={idx} className="px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide" style={tagCss}>
              {tag}
            </span>
          );
        })}
      </div>
    );
  };

  // Renderöidään Työkokemus / Koulutus aikajanana
  const renderTimeline = (items: string[]) => {
    return (
      <div className={`mt-4 space-y-5 ${customStyle.headingAlign === 'center' ? '' : 'pl-4 border-l-2'}`} style={{ borderColor: `${customStyle.accentColor}40` }}>
        {items.map((item, idx) => {
          // Tunnistetaan pääkohdat (esim: "Nokia | Insinööri | 2020-2022")
          const isMainPoint = !item.startsWith("-") && item.includes("|");
          const parts = item.split("|").map(s => s.trim());

          if (isMainPoint && parts.length >= 2) {
            return (
              <div key={idx} className={`relative mt-6 first:mt-2 ${customStyle.headingAlign === 'center' ? 'text-center' : ''}`}>
                {customStyle.headingAlign !== 'center' && (
                  <div className="absolute -left-[23px] top-1.5 w-4 h-4 rounded-full border-4 bg-white" style={{ borderColor: customStyle.accentColor }} />
                )}
                <div className="font-bold text-lg" style={{ color: customStyle.headingColor }}>
                  {parts[0]} <span className="opacity-50 font-normal">|</span> {parts[1]}
                </div>
                {parts[2] && (
                  <div className="text-sm font-bold mt-1 uppercase tracking-widest" style={{ color: customStyle.accentColor }}>
                    {parts[2]}
                  </div>
                )}
              </div>
            );
          }

          // Normaalit selitystekstit ja bulletit
          return (
            <p key={idx} className={`relative leading-relaxed opacity-90 ${item.startsWith("-") ? 'pl-4' : 'mt-2'}`} style={{ fontSize: `${customStyle.bodySize}px`, color: customStyle.mainText }}>
              {item.startsWith("-") && <span className="absolute left-0 top-0 opacity-50" style={{ color: customStyle.accentColor }}>•</span>}
              {item.replace(/^- /, '')}
            </p>
          );
        })}
      </div>
    );
  };

  // Layoutin määritys
  const isTopHeader = customStyle.layout === "top-header";
  const isRightSidebar = customStyle.layout === "right-sidebar";
  const isTwoColumn = customStyle.layout === "two-column"; // Tasavertaiset sarakkeet

  return (
    <div 
      id="cv-preview" 
      className={`mx-auto w-full max-w-[900px] overflow-hidden shadow-xl transition-all duration-300 ${fontClass}`} 
      style={{ backgroundColor: customStyle.mainBg, color: customStyle.mainText, borderRadius: `${customStyle.borderRadius}px`, ...getPatternStyle() }}
    >
      
      {/* 1. YLÄPALKKI LAYOUT */}
      {isTopHeader && (
        <header className="px-12 py-16 flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left" style={{ backgroundColor: customStyle.sidebarBg, color: customStyle.sidebarText }}>
          {image && (
            <img src={image} alt="Profiili" className="w-40 h-40 object-cover shadow-2xl border-4 border-white/10" style={{ borderRadius: imgBorderRadius }} />
          )}
          <div className={`flex-1 ${!image ? 'text-center' : ''}`}>
            <h1 style={{ fontSize: `${customStyle.nameSize}px`, lineHeight: 1.1, fontWeight: 900, letterSpacing: "-0.03em" }}>{name}</h1>
            {roleLine && <p className="mt-3 text-xl font-bold tracking-widest uppercase opacity-90" style={{ color: customStyle.accentColor }}>{roleLine}</p>}
            <div className={`flex flex-wrap gap-5 mt-6 text-sm font-medium opacity-80 justify-center sm:justify-start ${!image ? 'justify-center w-full' : ''}`}>
              {phone && <span className="flex items-center gap-2"><Icons.Phone /> {phone}</span>}
              {email && <span className="flex items-center gap-2"><Icons.Mail /> {email}</span>}
              {location && <span className="flex items-center gap-2"><Icons.MapPin /> {location}</span>}
            </div>
          </div>
        </header>
      )}

      <div className={`flex flex-col ${isTopHeader ? '' : (isRightSidebar ? 'md:flex-row-reverse' : 'md:flex-row')} min-h-[1050px]`}>
        
        {/* SIVUPALKKI (Jos ei yläpalkkia) */}
        {!isTopHeader && (
          <aside className="flex flex-col p-8 md:p-10 shrink-0" style={{ background: customStyle.sidebarBg, color: customStyle.sidebarText, width: isTwoColumn ? '50%' : `${customStyle.sidebarWidth}px` }}>
            {image && (
              <img src={image} alt="Profiili" className="mb-10 aspect-square w-full object-cover shadow-xl" style={{ borderRadius: imgBorderRadius }} />
            )}

            <div className="mb-12">
              <h1 style={{ fontSize: `${customStyle.nameSize * 0.8}px`, lineHeight: 1.1, fontWeight: 900, letterSpacing: "-0.03em" }}>{name}</h1>
              {roleLine && <p className="mt-3 text-base font-bold tracking-widest uppercase opacity-90" style={{ color: customStyle.accentColor }}>{roleLine}</p>}
            </div>

            <div className="mb-12">
              <h2 className="uppercase tracking-[0.2em] font-black mb-6 opacity-50 text-[11px]">Yhteystiedot</h2>
              <div className="space-y-5 text-sm font-medium opacity-90">
                {phone && <div className="flex items-center gap-4"><span style={{ color: customStyle.accentColor }}><Icons.Phone /></span> {phone}</div>}
                {email && <div className="flex items-center gap-4"><span style={{ color: customStyle.accentColor }}><Icons.Mail /></span> <span className="break-all">{email}</span></div>}
                {location && <div className="flex items-center gap-4"><span style={{ color: customStyle.accentColor }}><Icons.MapPin /></span> {location}</div>}
              </div>
            </div>

            {/* Tägit sivupalkkiin jos ei olla Top-header moodissa */}
            <div className="space-y-10 mt-auto">
              {sections.filter(s => isTagSection(s.title)).map((section, i) => (
                <div key={i}>
                  <h2 className="uppercase tracking-[0.2em] font-black mb-4 opacity-50 text-[11px]">{section.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    {section.items.flatMap(i => i.split(/,|•|-/)).map(t => t.trim()).filter(Boolean).map((tag, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-md bg-white/10 text-xs font-bold border border-white/5 shadow-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* PÄÄALUE */}
        <main className={`p-10 md:p-14 flex-1 ${isTwoColumn && isTopHeader ? 'grid grid-cols-2 gap-12' : ''}`}>
          <div className="space-y-12" style={{ fontSize: `${customStyle.bodySize}px`, lineHeight: customStyle.lineHeight }}>
            {/* Piirretään joko kaikki (TopHeader moodi) tai vain tekstit (Sidebar moodi) */}
            {sections.filter(s => isTopHeader ? true : !isTagSection(s.title)).map((section, index) => (
              <section key={index}>
                <h2 className={`uppercase tracking-[0.2em] font-black mb-6 ${textAlign}`} style={{ fontSize: "16px", color: customStyle.headingColor }}>
                  {section.title}
                </h2>
                
                {/* Valinnainen erotinviiva otsikon alle */}
                {customStyle.showSeparators && (
                  <div className={`h-1 mb-6 rounded-full ${customStyle.headingAlign === 'center' ? 'mx-auto' : ''}`} style={{ backgroundColor: customStyle.accentColor, width: '40px', opacity: 0.5 }} />
                )}
                
                {isTimelineSection(section.title) ? (
                  renderTimeline(section.items)
                ) : isTagSection(section.title) ? (
                  renderTags(section.items)
                ) : (
                  <div className={`space-y-3 opacity-80 ${textAlign}`}>
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
