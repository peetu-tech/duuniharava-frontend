"use client";

import React from "react";

export type CvStyleVariant = "modern" | "classic" | "compact" | "bold" | "minimal" | "split";

// Päivitetty tyyppi, johon on lisätty rutkasti uusia ominaisuuksia
export type CvCustomStyle = {
  // Värit
  sidebarBg: string;
  sidebarText: string;
  mainBg: string;
  mainText: string;
  headingColor: string;
  accentColor: string;
  
  // Koot ja välit
  borderRadius: number;
  sidebarWidth: number;
  nameSize: number;
  bodySize: number;
  lineHeight: number;
  sectionSpacing: number;
  imageRadius: number;
  
  // Visuaaliset elementit
  pattern?: "none" | "dots" | "lines" | "grid" | "waves" | "zigzag" | "diagonal";
  patternOpacity?: number;
  showSeparators?: boolean;
  separatorStyle?: "solid" | "dashed" | "dotted";
  
  // Typografia ja asettelu
  fontFamily?: "sans" | "serif" | "mono" | "inter" | "playfair" | "roboto";
  layout?: "left-sidebar" | "right-sidebar" | "top-header" | "two-column" | "minimal-center";
  headingAlign?: "left" | "center" | "right";
  tagStyle?: "solid" | "outline" | "minimal" | "pill" | "badge";
  imageShape?: "square" | "circle" | "rounded" | "hexagon";
  
  // Varjostukset ja efektit
  boxShadow?: "none" | "sm" | "md" | "lg" | "xl";
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

  // Dynaamiset luokat
  let fontClass = 'font-sans';
  switch(customStyle.fontFamily) {
    case 'serif': fontClass = 'font-serif'; break;
    case 'mono': fontClass = 'font-mono'; break;
    case 'inter': fontClass = 'font-inter'; break; // Varmista, että nämä on määritetty CSS:ssä jos haluat täyden tuen
    case 'playfair': fontClass = 'font-playfair'; break;
    case 'roboto': fontClass = 'font-roboto'; break;
  }

  const textAlign = customStyle.headingAlign === 'center' ? 'text-center' : customStyle.headingAlign === 'right' ? 'text-right' : 'text-left';
  
  let imgBorderRadius = `${customStyle.imageRadius}px`;
  if (customStyle.imageShape === 'circle') imgBorderRadius = '50%';
  if (customStyle.imageShape === 'square') imgBorderRadius = '0px';
  // Hexagon vaatii yleensä clip-pathin, mutta käytetään tässä vahvaa pyöristystä approximaationa
  if (customStyle.imageShape === 'hexagon') imgBorderRadius = '25%';

  // Taustakuviointi logiikka laajennettu
  const getPatternStyle = (): React.CSSProperties => {
    if (!customStyle.pattern || customStyle.pattern === "none") return {};
    const opacity = (customStyle.patternOpacity || 5) / 100;
    const color = `rgba(0, 0, 0, ${opacity})`;
    
    switch (customStyle.pattern) {
      case "dots":
        return { backgroundImage: `radial-gradient(${color} 2px, transparent 2px)`, backgroundSize: "20px 20px" };
      case "lines":
        return { backgroundImage: `repeating-linear-gradient(45deg, ${color} 0, ${color} 2px, transparent 0, transparent 50%)`, backgroundSize: "14px 14px" };
      case "grid":
        return { backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`, backgroundSize: "20px 20px" };
      case "diagonal":
        return { backgroundImage: `repeating-linear-gradient(-45deg, ${color} 0, ${color} 1px, transparent 1px, transparent 10px)`, backgroundSize: "20px 20px" };
      default:
        return {};
    }
  };

  // Erotinviivan tyyli
  const separatorBorderStyle = customStyle.separatorStyle || "solid";

  // Tagien renderöinti
  const renderTags = (items: string[]) => {
    const tags = items.flatMap(i => i.split(/,|•|-/)).map(t => t.trim()).filter(Boolean);
    
    const alignClass = customStyle.headingAlign === 'center' ? 'justify-center' : customStyle.headingAlign === 'right' ? 'justify-end' : '';
    
    return (
      <div className={`flex flex-wrap gap-2 mt-3 ${alignClass}`}>
        {tags.map((tag, idx) => {
          let tagCss: React.CSSProperties = {};
          let tagClasses = "px-3 py-1.5 text-xs font-bold tracking-wide";

          switch (customStyle.tagStyle) {
            case 'solid':
              tagCss = { backgroundColor: customStyle.accentColor, color: '#fff' };
              tagClasses += " rounded-md";
              break;
            case 'outline':
              tagCss = { backgroundColor: 'transparent', color: customStyle.accentColor, border: `1.5px solid ${customStyle.accentColor}` };
              tagClasses += " rounded-md";
              break;
            case 'pill':
              tagCss = { backgroundColor: `${customStyle.accentColor}15`, color: customStyle.accentColor };
              tagClasses += " rounded-full";
              break;
            case 'badge':
              tagCss = { backgroundColor: customStyle.accentColor, color: '#fff', borderLeft: `4px solid ${customStyle.headingColor}` };
              tagClasses += " rounded-sm";
              break;
            case 'minimal':
            default:
              tagCss = { color: customStyle.accentColor, borderBottom: `1px solid ${customStyle.accentColor}` };
              tagClasses = "px-1 py-1 text-sm font-semibold mr-2";
              break;
          }

          return (
            <span key={idx} className={tagClasses} style={tagCss}>
              {tag}
            </span>
          );
        })}
      </div>
    );
  };

  // Renderöidään Työkokemus / Koulutus aikajanana
  const renderTimeline = (items: string[]) => {
    const alignCenter = customStyle.headingAlign === 'center';
    const alignRight = customStyle.headingAlign === 'right';

    return (
      <div className={`mt-4 space-y-6 ${alignCenter ? '' : alignRight ? 'pr-4 border-r-2 text-right' : 'pl-4 border-l-2'}`} style={{ borderColor: `${customStyle.accentColor}40` }}>
        {items.map((item, idx) => {
          const isMainPoint = !item.startsWith("-") && item.includes("|");
          const parts = item.split("|").map(s => s.trim());

          if (isMainPoint && parts.length >= 2) {
            return (
              <div key={idx} className={`relative mt-8 first:mt-2 ${alignCenter ? 'text-center' : alignRight ? 'text-right' : ''}`}>
                {!alignCenter && !alignRight && (
                  <div className="absolute -left-[23px] top-1.5 w-4 h-4 rounded-full border-[3px] bg-white" style={{ borderColor: customStyle.accentColor }} />
                )}
                {!alignCenter && alignRight && (
                  <div className="absolute -right-[23px] top-1.5 w-4 h-4 rounded-full border-[3px] bg-white" style={{ borderColor: customStyle.accentColor }} />
                )}
                
                <div className="font-bold text-lg mb-1" style={{ color: customStyle.headingColor }}>
                  {parts[0]} <span className="opacity-40 font-normal px-1">|</span> {parts[1]}
                </div>
                {parts[2] && (
                  <div className="text-[13px] font-bold uppercase tracking-widest inline-block px-2 py-0.5 rounded" style={{ color: customStyle.accentColor, backgroundColor: `${customStyle.accentColor}10` }}>
                    {parts[2]}
                  </div>
                )}
              </div>
            );
          }

          // Normaalit selitystekstit ja bulletit
          const bulletPosition = alignRight ? 'right-0' : 'left-0';
          const paddingClass = item.startsWith("-") ? (alignRight ? 'pr-5' : 'pl-5') : 'mt-2';
          
          return (
            <p key={idx} className={`relative leading-relaxed opacity-85 ${paddingClass}`} style={{ fontSize: `${customStyle.bodySize}px`, color: customStyle.mainText }}>
              {item.startsWith("-") && <span className={`absolute ${bulletPosition} top-0 font-bold`} style={{ color: customStyle.accentColor }}>•</span>}
              {item.replace(/^- /, '')}
            </p>
          );
        })}
      </div>
    );
  };

  const getShadowClass = () => {
    switch(customStyle.boxShadow) {
      case 'sm': return 'shadow-sm';
      case 'md': return 'shadow-md';
      case 'lg': return 'shadow-lg';
      case 'xl': return 'shadow-xl';
      case 'none':
      default: return '';
    }
  };

  // Layoutin määritys
  const isTopHeader = customStyle.layout === "top-header";
  const isRightSidebar = customStyle.layout === "right-sidebar";
  const isTwoColumn = customStyle.layout === "two-column";
  const isMinimalCenter = customStyle.layout === "minimal-center";

  // --- MINIMAL CENTER LAYOUT (Keskitetty, ylhäältä alas) ---
  if (isMinimalCenter) {
    return (
       <div 
        id="cv-preview" 
        className={`mx-auto w-full max-w-[850px] overflow-hidden transition-all duration-300 ${fontClass} ${getShadowClass()}`} 
        style={{ backgroundColor: customStyle.mainBg, color: customStyle.mainText, borderRadius: `${customStyle.borderRadius}px`, ...getPatternStyle() }}
      >
        <div className="p-16 flex flex-col items-center text-center">
          {image && (
            <img src={image} alt="Profiili" className="w-32 h-32 object-cover mb-8" style={{ borderRadius: imgBorderRadius, border: `2px solid ${customStyle.accentColor}50` }} />
          )}
          <h1 style={{ fontSize: `${customStyle.nameSize}px`, lineHeight: 1.1, fontWeight: 900, letterSpacing: "-0.02em", color: customStyle.headingColor }}>{name}</h1>
          {roleLine && <p className="mt-4 text-xl font-medium tracking-widest uppercase" style={{ color: customStyle.accentColor }}>{roleLine}</p>}
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-sm font-medium opacity-80 justify-center">
            {phone && <span>{phone}</span>}
            {email && <span>{email}</span>}
            {location && <span>{location}</span>}
          </div>

          <div className="w-16 h-1 mt-10 rounded-full" style={{ backgroundColor: customStyle.accentColor, opacity: 0.3 }} />

          <div className="w-full mt-12 space-y-14 text-left">
            {sections.map((section, index) => (
              <section key={index} className="max-w-2xl mx-auto">
                <h2 className="uppercase tracking-[0.15em] font-bold mb-6 text-center" style={{ fontSize: "16px", color: customStyle.headingColor }}>
                  {section.title}
                </h2>
                
                {isTimelineSection(section.title) ? (
                  renderTimeline(section.items)
                ) : isTagSection(section.title) ? (
                  <div className="flex justify-center">{renderTags(section.items)}</div>
                ) : (
                  <div className="space-y-3 opacity-85 text-center leading-relaxed" style={{ fontSize: `${customStyle.bodySize}px`, lineHeight: customStyle.lineHeight }}>
                    {section.items.map((line, j) => <p key={j}>{line}</p>)}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- STANDARD LAYOUTS ---
  return (
    <div 
      id="cv-preview" 
      className={`mx-auto w-full max-w-[900px] overflow-hidden border transition-all duration-300 ${fontClass} ${getShadowClass()}`} 
      style={{ backgroundColor: customStyle.mainBg, color: customStyle.mainText, borderRadius: `${customStyle.borderRadius}px`, borderColor: "#e2e8f0", ...getPatternStyle() }}
    >
      
      {isTopHeader && (
        <header className="px-12 py-16 flex flex-col sm:flex-row items-center gap-10 text-center sm:text-left" style={{ backgroundColor: customStyle.sidebarBg, color: customStyle.sidebarText }}>
          {image && (
            <img src={image} alt="Profiili" className="w-36 h-36 object-cover shadow-2xl border-4 border-white/10" style={{ borderRadius: imgBorderRadius }} />
          )}
          <div className={`flex-1 ${!image ? 'text-center' : ''}`}>
            <h1 style={{ fontSize: `${customStyle.nameSize}px`, lineHeight: 1.1, fontWeight: 900, letterSpacing: "-0.03em" }}>{name}</h1>
            {roleLine && <p className="mt-3 text-xl font-bold tracking-widest uppercase opacity-90" style={{ color: customStyle.accentColor }}>{roleLine}</p>}
            <div className={`flex flex-wrap gap-5 mt-6 text-sm font-medium opacity-90 justify-center sm:justify-start ${!image ? 'justify-center w-full' : ''}`}>
              {phone && <span className="flex items-center gap-2"><Icons.Phone /> {phone}</span>}
              {email && <span className="flex items-center gap-2"><Icons.Mail /> {email}</span>}
              {location && <span className="flex items-center gap-2"><Icons.MapPin /> {location}</span>}
            </div>
          </div>
        </header>
      )}

      <div className={`flex flex-col ${isTopHeader ? '' : (isRightSidebar ? 'md:flex-row-reverse' : 'md:flex-row')} min-h-[1050px]`}>
        
        {/* SIVUPALKKI */}
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

            <div className="space-y-10 mt-auto">
              {sections.filter(s => isTagSection(s.title)).map((section, i) => (
                <div key={i}>
                  <h2 className="uppercase tracking-[0.2em] font-black mb-4 opacity-50 text-[11px]">{section.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    {section.items.flatMap(i => i.split(/,|•|-/)).map(t => t.trim()).filter(Boolean).map((tag, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded bg-black/20 text-xs font-semibold border border-white/10">
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
            
            {sections.filter(s => isTopHeader ? true : !isTagSection(s.title)).map((section, index) => (
              <section key={index}>
                <h2 className={`uppercase tracking-[0.2em] font-black mb-5 ${textAlign}`} style={{ fontSize: "16px", color: customStyle.headingColor }}>
                  {section.title}
                </h2>
                
                {customStyle.showSeparators && (
                  <div className={`mb-6 border-b-2 ${textAlign === 'center' ? 'mx-auto' : textAlign === 'right' ? 'ml-auto' : ''}`} style={{ borderColor: customStyle.accentColor, width: '40px', borderStyle: separatorBorderStyle, opacity: 0.5 }} />
                )}
                
                {isTimelineSection(section.title) ? (
                  renderTimeline(section.items)
                ) : isTagSection(section.title) ? (
                  renderTags(section.items)
                ) : (
                  <div className={`space-y-3 opacity-85 ${textAlign}`}>
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
