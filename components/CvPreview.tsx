"use client";

import React from "react";

export type CvStyleVariant = "modern" | "classic" | "compact" | "bold";

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
  pattern?: "none" | "dots" | "lines" | "grid" | "diagonal";
  patternOpacity?: number;
  showSeparators?: boolean;
  fontFamily?: "modern" | "classic" | "mono" | "elegant" | "clean" | "tech";
  layout?: "left-sidebar" | "right-sidebar" | "top-header" | "two-column" | "minimalist";
  headerStyle?: "solid" | "transparent" | "gradient";
  headingAlign?: "left" | "center" | "right";
  tagStyle?: "solid" | "outline" | "minimal" | "pill" | "sharp";
  imageShape?: "square" | "circle" | "rounded" | "blob";
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

  const isTagSection = (title: string) => ["TAIDOT", "KIELITAITO", "KORTIT JA PÄTEVYYDET", "HARRASTUKSET"].includes(title.toUpperCase());
  const isTimelineSection = (title: string) => ["TYÖKOKEMUS", "KOULUTUS"].includes(title.toUpperCase());

  // --- DYNAAMISET TYYLIT (CANVA-OMINAISUUDET) ---
  
  // 1. Fonttiperhe
  const getFontFamily = () => {
    switch(customStyle.fontFamily) {
      case 'classic': return '"Times New Roman", Times, serif';
      case 'elegant': return 'Georgia, serif';
      case 'mono': return '"Courier New", Courier, monospace';
      case 'clean': return 'Arial, Helvetica, sans-serif';
      case 'tech': return '"Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", sans-serif';
      case 'modern':
      default: return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
  };

  // 2. Kuvan muoto
  const getImageBorderRadius = () => {
    switch(customStyle.imageShape) {
      case 'circle': return '50%';
      case 'square': return '0px';
      case 'blob': return '40% 60% 70% 30% / 40% 50% 60% 50%'; // Orgaaninen muoto
      case 'rounded':
      default: return `${customStyle.imageRadius}px`;
    }
  };

  // 3. Tekstin tasaus
  const getTextAlign = () => {
    if (customStyle.headingAlign === 'center') return 'center';
    if (customStyle.headingAlign === 'right') return 'right';
    return 'left';
  };

  // 4. Taustakuviointi
  const getPatternStyle = (): React.CSSProperties => {
    if (!customStyle.pattern || customStyle.pattern === "none") return {};
    const opacity = (customStyle.patternOpacity || 5) / 100;
    const color = `rgba(0, 0, 0, ${opacity})`;
    
    if (customStyle.pattern === "dots") {
      return { backgroundImage: `radial-gradient(${color} 2px, transparent 2px)`, backgroundSize: "20px 20px" };
    }
    if (customStyle.pattern === "lines") {
      return { backgroundImage: `repeating-linear-gradient(180deg, ${color} 0, ${color} 1px, transparent 1px, transparent 20px)` };
    }
    if (customStyle.pattern === "diagonal") {
      return { backgroundImage: `repeating-linear-gradient(45deg, ${color} 0, ${color} 2px, transparent 2px, transparent 15px)` };
    }
    if (customStyle.pattern === "grid") {
      return { backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`, backgroundSize: "20px 20px" };
    }
    return {};
  };

  // 5. Yläpalkin tyyli
  const getHeaderStyle = (): React.CSSProperties => {
    if (customStyle.headerStyle === "gradient") {
      return { background: `linear-gradient(135deg, ${customStyle.sidebarBg}, ${customStyle.accentColor})`, color: customStyle.sidebarText };
    }
    if (customStyle.headerStyle === "transparent") {
      return { background: "transparent", color: customStyle.mainText, borderBottom: `2px solid ${customStyle.accentColor}40` };
    }
    return { background: customStyle.sidebarBg, color: customStyle.sidebarText };
  };

  // Renderöidään Taidot / Kielet / Harrastukset tyylikkäinä pillereinä
  const renderTags = (items: string[]) => {
    const tags = items.flatMap(i => i.split(/,|•|-/)).map(t => t.trim()).filter(Boolean);
    
    return (
      <div className="flex flex-wrap gap-2 mt-3" style={{ justifyContent: customStyle.headingAlign === 'center' ? 'center' : (customStyle.headingAlign === 'right' ? 'flex-end' : 'flex-start') }}>
        {tags.map((tag, idx) => {
          let tagCss: React.CSSProperties = {};
          
          if (customStyle.tagStyle === 'outline') {
            tagCss = { backgroundColor: 'transparent', color: customStyle.accentColor, border: `1.5px solid ${customStyle.accentColor}`, borderRadius: '6px' };
          } else if (customStyle.tagStyle === 'pill') {
            tagCss = { backgroundColor: `${customStyle.accentColor}15`, color: customStyle.accentColor, border: 'none', borderRadius: '9999px' };
          } else if (customStyle.tagStyle === 'sharp') {
            tagCss = { backgroundColor: customStyle.accentColor, color: '#fff', border: 'none', borderRadius: '0px' };
          } else if (customStyle.tagStyle === 'minimal') {
            tagCss = { backgroundColor: 'transparent', color: customStyle.mainText, borderBottom: `2px solid ${customStyle.accentColor}`, borderRadius: '0px', paddingLeft: '4px', paddingRight: '4px' };
          } else {
            // Solid
            tagCss = { backgroundColor: customStyle.accentColor, color: '#fff', border: 'none', borderRadius: '6px' };
          }

          return (
            <span key={idx} className="px-3 py-1.5 text-[11.5px] font-bold tracking-wide" style={tagCss}>
              {tag}
            </span>
          );
        })}
      </div>
    );
  };

  // Renderöidään Työkokemus / Koulutus aikajanana
  const renderTimeline = (items: string[]) => {
    const isMinimalist = customStyle.layout === "minimalist";
    
    return (
      <div className={`mt-4 space-y-6 ${customStyle.headingAlign === 'center' ? '' : (isMinimalist ? '' : 'pl-4 border-l-2')}`} style={{ borderColor: `${customStyle.accentColor}40` }}>
        {items.map((item, idx) => {
          const isMainPoint = !item.startsWith("-") && item.includes("|");
          const parts = item.split("|").map(s => s.trim());

          if (isMainPoint && parts.length >= 2) {
            return (
              <div key={idx} className={`relative mt-6 first:mt-2`} style={{ textAlign: getTextAlign() }}>
                {customStyle.headingAlign !== 'center' && !isMinimalist && (
                  <div className="absolute -left-[23px] top-1.5 w-4 h-4 rounded-full border-4 bg-white" style={{ borderColor: customStyle.accentColor }} />
                )}
                
                {/* Asettelutyylin mukainen tittelin esitys */}
                <div className="font-bold" style={{ fontSize: `${customStyle.bodySize + 2}px`, color: customStyle.headingColor }}>
                  {parts[0]} <span className="opacity-40 font-normal mx-1">|</span> <span style={{ color: customStyle.accentColor }}>{parts[1]}</span>
                </div>
                {parts[2] && (
                  <div className="text-[11px] font-bold mt-1.5 uppercase tracking-widest opacity-60" style={{ color: customStyle.mainText }}>
                    {parts[2]}
                  </div>
                )}
              </div>
            );
          }

          // Normaalit selitystekstit
          return (
            <p key={idx} className={`relative leading-relaxed opacity-80 ${item.startsWith("-") ? 'pl-5' : 'mt-2'}`} style={{ fontSize: `${customStyle.bodySize}px`, color: customStyle.mainText, textAlign: getTextAlign() }}>
              {item.startsWith("-") && <span className="absolute left-0 top-0 font-bold" style={{ color: customStyle.accentColor }}>•</span>}
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
  const isTwoColumn = customStyle.layout === "two-column"; 
  const isMinimalist = customStyle.layout === "minimalist";

  // Yhteystiedot lohko
  const ContactInfo = ({ isDarkBg }: { isDarkBg: boolean }) => (
    <div className={`space-y-4 text-sm font-medium ${isDarkBg ? 'opacity-90' : 'opacity-80'}`}>
      {phone && <div className="flex items-center gap-3" style={{ justifyContent: getTextAlign() }}><span style={{ color: customStyle.accentColor }}><Icons.Phone /></span> {phone}</div>}
      {email && <div className="flex items-center gap-3" style={{ justifyContent: getTextAlign() }}><span style={{ color: customStyle.accentColor }}><Icons.Mail /></span> <span className="break-all">{email}</span></div>}
      {location && <div className="flex items-center gap-3" style={{ justifyContent: getTextAlign() }}><span style={{ color: customStyle.accentColor }}><Icons.MapPin /></span> {location}</div>}
    </div>
  );

  return (
    <div 
      id="cv-preview" 
      className="mx-auto w-full max-w-[900px] overflow-hidden shadow-xl transition-all duration-300" 
      style={{ backgroundColor: customStyle.mainBg, color: customStyle.mainText, borderRadius: `${customStyle.borderRadius}px`, fontFamily: getFontFamily(), ...getPatternStyle() }}
    >
      
      {/* 1. YLÄPALKKI / MINIMALISTINEN LAYOUT */}
      {(isTopHeader || isMinimalist) && (
        <header className="px-14 py-16 flex flex-col sm:flex-row items-center gap-10" style={isMinimalist ? { borderBottom: `4px solid ${customStyle.accentColor}` } : getHeaderStyle()}>
          {image && (
            <img src={image} alt="Profiili" className="w-44 h-44 object-cover shadow-2xl border-4 border-white/20" style={{ borderRadius: getImageBorderRadius() }} />
          )}
          <div className={`flex-1 ${(!image || customStyle.headingAlign === 'center') ? 'text-center w-full' : ''}`} style={{ textAlign: getTextAlign() }}>
            <h1 style={{ fontSize: `${customStyle.nameSize}px`, lineHeight: 1.05, fontWeight: 900, letterSpacing: "-0.03em" }}>{name}</h1>
            {roleLine && <p className="mt-4 text-xl font-bold tracking-widest uppercase" style={{ color: customStyle.accentColor, opacity: 0.9 }}>{roleLine}</p>}
            <div className="mt-8 flex flex-wrap gap-6 justify-center sm:justify-start" style={{ justifyContent: getTextAlign() }}>
               <ContactInfo isDarkBg={!isMinimalist && customStyle.headerStyle !== "transparent"} />
            </div>
          </div>
        </header>
      )}

      <div className={`flex flex-col ${isTopHeader || isMinimalist ? '' : (isRightSidebar ? 'md:flex-row-reverse' : 'md:flex-row')} min-h-[1050px]`}>
        
        {/* SIVUPALKKI (Jos ei yläpalkki-leiskaa) */}
        {(!isTopHeader && !isMinimalist) && (
          <aside className="flex flex-col p-10 shrink-0" style={{ background: customStyle.sidebarBg, color: customStyle.sidebarText, width: isTwoColumn ? '50%' : `${customStyle.sidebarWidth}px` }}>
            {image && (
              <img src={image} alt="Profiili" className="mb-12 aspect-square w-full object-cover shadow-2xl border-2 border-white/10" style={{ borderRadius: getImageBorderRadius() }} />
            )}

            <div className="mb-14" style={{ textAlign: getTextAlign() }}>
              <h1 style={{ fontSize: `${customStyle.nameSize * 0.75}px`, lineHeight: 1.1, fontWeight: 900, letterSpacing: "-0.02em" }}>{name}</h1>
              {roleLine && <p className="mt-4 text-sm font-bold tracking-widest uppercase opacity-90" style={{ color: customStyle.accentColor }}>{roleLine}</p>}
            </div>

            <div className="mb-14">
              <h2 className="uppercase tracking-[0.2em] font-black mb-6 opacity-40 text-[10px]" style={{ textAlign: getTextAlign() }}>Yhteystiedot</h2>
              <ContactInfo isDarkBg={true} />
            </div>

            {/* Tägit sivupalkkiin jos ei olla Top-header moodissa */}
            <div className="space-y-12 mt-auto">
              {sections.filter(s => isTagSection(s.title)).map((section, i) => (
                <div key={i}>
                  <h2 className="uppercase tracking-[0.2em] font-black mb-5 opacity-40 text-[10px]" style={{ textAlign: getTextAlign() }}>{section.title}</h2>
                  {renderTags(section.items)}
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* PÄÄALUE */}
        <main className={`flex-1 ${isMinimalist ? 'p-16 max-w-4xl mx-auto' : 'p-12 md:p-16'}`}>
          <div className={`space-y-12 ${isTwoColumn && (isTopHeader || isMinimalist) ? 'columns-1 md:columns-2 gap-12 space-y-0' : ''}`} style={{ fontSize: `${customStyle.bodySize}px`, lineHeight: customStyle.lineHeight }}>
            
            {/* Piirretään joko kaikki (TopHeader/Minimalist) tai vain tekstit (Sidebar moodi) */}
            {sections.filter(s => (isTopHeader || isMinimalist) ? true : !isTagSection(s.title)).map((section, index) => (
              <section key={index} className={isTwoColumn && (isTopHeader || isMinimalist) ? 'break-inside-avoid mb-12' : ''}>
                <h2 className="uppercase tracking-[0.2em] font-black mb-6" style={{ fontSize: "16px", color: customStyle.headingColor, textAlign: getTextAlign() }}>
                  {section.title}
                </h2>
                
                {/* Valinnainen erotinviiva otsikon alle */}
                {customStyle.showSeparators && (
                  <div className={`h-[3px] mb-8 rounded-full`} style={{ backgroundColor: customStyle.accentColor, width: '50px', opacity: 0.6, marginLeft: customStyle.headingAlign === 'center' ? 'auto' : (customStyle.headingAlign === 'right' ? 'auto' : '0'), marginRight: customStyle.headingAlign === 'center' ? 'auto' : '0' }} />
                )}
                
                {isTimelineSection(section.title) ? (
                  renderTimeline(section.items)
                ) : isTagSection(section.title) ? (
                  renderTags(section.items)
                ) : (
                  <div className="space-y-4 opacity-80" style={{ textAlign: getTextAlign() }}>
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
