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
  pattern?: "none" | "dots" | "lines" | "grid" | "diagonal" | "cross" | "intersecting" | "waves" | "zigzag";
  patternOpacity?: number;
  sidebarPattern?: "none" | "dots" | "lines" | "grid" | "diagonal" | "cross" | "intersecting" | "waves" | "zigzag";
  sidebarPatternOpacity?: number;
  showSeparators?: boolean;
  fontFamily?: "modern" | "classic" | "mono" | "elegant" | "clean" | "tech" | "brutalist" | "playful";
  layout?: "left-sidebar" | "right-sidebar" | "top-header" | "two-column" | "minimalist";
  headerStyle?: "solid" | "transparent" | "gradient";
  headingAlign?: "left" | "center" | "right";
  tagStyle?: "solid" | "outline" | "minimal" | "pill" | "sharp";
  imageShape?: "square" | "circle" | "rounded" | "blob" | "leaf";
  pagePadding?: number;
  headingStyle?: "simple" | "underline" | "boxed" | "highlight";
  mainBg2?: string;
  sidebarBg2?: string;
  mainGradientDirection?: "none" | "to bottom" | "to right" | "135deg" | "circle";
  sidebarGradientDirection?: "none" | "to bottom" | "to right" | "135deg" | "circle";
  shadowStyle?: "none" | "soft" | "hard" | "3d" | "neon";
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
  const isProfileSection = (title: string) => ["PROFIILI", "TIIVISTELMÄ", "TAVOITE"].includes(title.toUpperCase());

  // --- DYNAAMISET TYYLIT ---
  const getFontFamily = () => {
    switch(customStyle.fontFamily) {
      case 'classic': return '"Times New Roman", Times, serif';
      case 'elegant': return 'Georgia, serif';
      case 'mono': return '"Courier New", Courier, monospace';
      case 'clean': return 'Arial, Helvetica, sans-serif';
      case 'tech': return '"Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", sans-serif';
      case 'brutalist': return 'Impact, Charcoal, sans-serif';
      case 'playful': return '"Comic Sans MS", "Marker Felt", sans-serif';
      case 'modern':
      default: return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
  };

  const getImageBorderRadius = () => {
    switch(customStyle.imageShape) {
      case 'circle': return '50%';
      case 'square': return '0px';
      case 'blob': return '40% 60% 70% 30% / 40% 50% 60% 50%'; 
      case 'leaf': return '0 50% 50% 50%'; 
      case 'rounded':
      default: return `${customStyle.imageRadius}px`;
    }
  };

  const getTextAlign = () => {
    if (customStyle.headingAlign === 'center') return 'center';
    if (customStyle.headingAlign === 'right') return 'right';
    return 'left';
  };

  const getPatternStyle = (type: "main" | "sidebar"): React.CSSProperties => {
    const patternType = type === "main" ? customStyle.pattern : customStyle.sidebarPattern;
    const opacityVal = type === "main" ? customStyle.patternOpacity : customStyle.sidebarPatternOpacity;
    
    const bg1 = type === "main" ? customStyle.mainBg : customStyle.sidebarBg;
    const bg2 = type === "main" ? (customStyle.mainBg2 || customStyle.mainBg) : (customStyle.sidebarBg2 || customStyle.sidebarBg);
    const gradientDir = type === "main" ? customStyle.mainGradientDirection : customStyle.sidebarGradientDirection;
    
    let baseBackground = bg1;
    if (gradientDir && gradientDir !== "none") {
      baseBackground = gradientDir === "circle" 
        ? `radial-gradient(circle, ${bg1}, ${bg2})`
        : `linear-gradient(${gradientDir}, ${bg1}, ${bg2})`;
    }

    if (!patternType || patternType === "none") return { background: baseBackground };

    const opacity = (opacityVal || 5) / 100;
    const color = `rgba(0, 0, 0, ${opacity})`;
    const colorWhite = `rgba(255, 255, 255, ${opacity})`; 
    const isDarkBg = bg1.startsWith('#') && parseInt(bg1.replace('#',''), 16) < 0xffffff / 2;
    const useColor = isDarkBg ? colorWhite : color;

    let patternImg = "";
    let patternSize = "";

    if (patternType === "dots") {
      patternImg = `radial-gradient(${useColor} 2px, transparent 2px)`;
      patternSize = "20px 20px";
    } else if (patternType === "lines") {
      patternImg = `repeating-linear-gradient(180deg, ${useColor} 0, ${useColor} 1px, transparent 1px, transparent 20px)`;
    } else if (patternType === "diagonal") {
      patternImg = `repeating-linear-gradient(45deg, ${useColor} 0, ${useColor} 2px, transparent 2px, transparent 15px)`;
    } else if (patternType === "grid") {
      patternImg = `linear-gradient(${useColor} 1px, transparent 1px), linear-gradient(90deg, ${useColor} 1px, transparent 1px)`;
      patternSize = "20px 20px";
    } else if (patternType === "cross") {
      patternImg = `radial-gradient(circle, transparent 20%, ${bg1} 20%, ${bg1} 80%, transparent 80%, transparent), radial-gradient(circle, transparent 20%, ${bg1} 20%, ${bg1} 80%, transparent 80%, transparent) ${useColor}`;
      patternSize = "40px 40px";
    } else if (patternType === "intersecting") {
      patternImg = `repeating-linear-gradient(45deg, ${useColor} 0, ${useColor} 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, ${useColor} 0, ${useColor} 1px, transparent 1px, transparent 20px)`;
    } else if (patternType === "waves") {
      patternImg = `radial-gradient(circle at 100% 50%, transparent 20%, ${useColor} 21%, ${useColor} 34%, transparent 35%, transparent), radial-gradient(circle at 0% 50%, transparent 20%, ${useColor} 21%, ${useColor} 34%, transparent 35%, transparent) 0 -50px`;
      patternSize = "100px 100px";
    } else if (patternType === "zigzag") {
      patternImg = `linear-gradient(135deg, ${useColor} 25%, transparent 25%) -50px 0, linear-gradient(225deg, ${useColor} 25%, transparent 25%) -50px 0, linear-gradient(315deg, ${useColor} 25%, transparent 25%), linear-gradient(45deg, ${useColor} 25%, transparent 25%)`;
      patternSize = "100px 100px";
    }

    return { 
      background: baseBackground,
      backgroundImage: patternImg ? (gradientDir !== "none" ? `${patternImg}, ${baseBackground}` : patternImg) : baseBackground,
      backgroundSize: patternSize || "auto"
    };
  };

  const getHeaderStyle = (): React.CSSProperties => {
    if (customStyle.headerStyle === "gradient") {
      return { background: `linear-gradient(135deg, ${customStyle.sidebarBg}, ${customStyle.accentColor})`, color: customStyle.sidebarText, ...getPatternStyle("sidebar") };
    }
    if (customStyle.headerStyle === "transparent") {
      return { background: "transparent", color: customStyle.mainText, borderBottom: `2px solid ${customStyle.accentColor}40` };
    }
    return { background: customStyle.sidebarBg, color: customStyle.sidebarText, ...getPatternStyle("sidebar") };
  };

  // SHADOWS
  const getShadowClass = () => {
    switch (customStyle.shadowStyle) {
      case "soft": return "shadow-lg";
      case "hard": return "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";
      case "3d": return "shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10";
      case "neon": return `shadow-[0_0_20px_${customStyle.accentColor}]`;
      default: return "shadow-none";
    }
  };

  const renderTags = (items: string[]) => {
    const tags = items.flatMap(i => i.split(/,|•|-/)).map(t => t.trim()).filter(Boolean);
    
    return (
      <div className="flex flex-wrap mt-3" style={{ gap: '8px', justifyContent: customStyle.headingAlign === 'center' ? 'center' : (customStyle.headingAlign === 'right' ? 'flex-end' : 'flex-start') }}>
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
            tagCss = { backgroundColor: customStyle.accentColor, color: '#fff', border: 'none', borderRadius: '6px' };
          }

          return (
            <span key={idx} className="px-3 py-1.5 text-[11.5px] font-bold tracking-wide shadow-sm" style={tagCss}>
              {tag}
            </span>
          );
        })}
      </div>
    );
  };

  const renderTimeline = (items: string[]) => {
    const isMinimalist = customStyle.layout === "minimalist";
    
    return (
      <div className={`mt-4`} style={{ display: 'flex', flexDirection: 'column', gap: `${(customStyle.sectionSpacing || 24) * 0.7}px`, borderColor: `${customStyle.accentColor}40`, paddingLeft: (customStyle.headingAlign !== 'center' && !isMinimalist) ? '1rem' : '0', borderLeftWidth: (customStyle.headingAlign !== 'center' && !isMinimalist) ? '2px' : '0' }}>
        {items.map((item, idx) => {
          const isMainPoint = !item.startsWith("-") && (item.includes("|") || item.includes(","));
          const parts = item.includes("|") ? item.split("|").map(s => s.trim()) : item.split(",").map(s => s.trim());

          if (isMainPoint && parts.length >= 2) {
            return (
              <div key={idx} className={`relative`} style={{ textAlign: getTextAlign() }}>
                {customStyle.headingAlign !== 'center' && !isMinimalist && (
                  <div className="absolute -left-[23px] top-1.5 w-4 h-4 rounded-full border-4 bg-white" style={{ borderColor: customStyle.accentColor }} />
                )}
                
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

          return (
            <p key={idx} className={`relative leading-relaxed opacity-80 ${item.startsWith("-") ? 'pl-5' : ''}`} style={{ fontSize: `${customStyle.bodySize}px`, color: customStyle.mainText, textAlign: getTextAlign() }}>
              {item.startsWith("-") && <span className="absolute left-0 top-0 font-bold" style={{ color: customStyle.accentColor }}>•</span>}
              {item.replace(/^- /, '')}
            </p>
          );
        })}
      </div>
    );
  };

  const renderProfileHook = (items: string[]) => {
    return (
      <div className={`relative p-6 mt-4 rounded-2xl overflow-hidden ${getShadowClass()}`} style={{ backgroundColor: `${customStyle.accentColor}08`, borderLeft: `4px solid ${customStyle.accentColor}` }}>
        <div className="absolute -top-4 -left-2 opacity-10 font-serif" style={{ fontSize: "80px", color: customStyle.accentColor }}>"</div>
        <div className="relative z-10 opacity-90 font-medium italic" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: `${customStyle.bodySize + 1}px`, color: customStyle.mainText, textAlign: getTextAlign() }}>
          {items.map((line, j) => <p key={j}>{line}</p>)}
        </div>
      </div>
    );
  };

  const renderHeading = (title: string) => {
    const hStyle = customStyle.headingStyle || "simple";
    const align = getTextAlign();

    let css: React.CSSProperties = { fontSize: "16px", color: customStyle.headingColor, textAlign: align as any };

    if (hStyle === "boxed") {
      css = { ...css, backgroundColor: customStyle.accentColor, color: "#fff", padding: "8px 16px", borderRadius: "8px", display: "inline-block" };
    } else if (hStyle === "highlight") {
      css = { ...css, borderBottom: `8px solid ${customStyle.accentColor}40`, display: "inline-block", lineHeight: "0.6" };
    } else if (hStyle === "underline") {
      css = { ...css, borderBottom: `2px solid ${customStyle.accentColor}`, paddingBottom: "4px", display: "inline-block" };
    }

    return (
      <div style={{ textAlign: align as any, marginBottom: '24px' }}>
        <h2 className="uppercase tracking-[0.2em] font-black" style={css}>
          {title}
        </h2>
      </div>
    );
  };

  const isTopHeader = customStyle.layout === "top-header";
  const isRightSidebar = customStyle.layout === "right-sidebar";
  const isTwoColumn = customStyle.layout === "two-column"; 
  const isMinimalist = customStyle.layout === "minimalist";

  const padding = customStyle.pagePadding || 48;

  const ContactInfo = ({ isDarkBg }: { isDarkBg: boolean }) => (
    <div className={`text-sm font-medium ${isDarkBg ? 'opacity-90' : 'opacity-80'}`} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {phone && <div className="flex items-center gap-3" style={{ justifyContent: getTextAlign() }}><span style={{ color: customStyle.accentColor }}><Icons.Phone /></span> {phone}</div>}
      {email && <div className="flex items-center gap-3" style={{ justifyContent: getTextAlign() }}><span style={{ color: customStyle.accentColor }}><Icons.Mail /></span> <span className="break-all">{email}</span></div>}
      {location && <div className="flex items-center gap-3" style={{ justifyContent: getTextAlign() }}><span style={{ color: customStyle.accentColor }}><Icons.MapPin /></span> {location}</div>}
    </div>
  );

  return (
    <div 
      id="cv-preview" 
      className={`mx-auto w-full max-w-[900px] overflow-hidden transition-all duration-300 ${getShadowClass()}`} 
      style={{ color: customStyle.mainText, borderRadius: `${customStyle.borderRadius}px`, fontFamily: getFontFamily(), ...getPatternStyle("main") }}
    >
      
      {/* YLÄPALKKI / MINIMALISTINEN */}
      {(isTopHeader || isMinimalist) && (
        <header className="flex flex-col sm:flex-row items-center gap-10 relative" style={{ padding: `${padding}px`, ...(isMinimalist ? { borderBottom: `4px solid ${customStyle.accentColor}` } : getHeaderStyle()) }}>
          {image && (
            <img src={image} alt="Profiili" className={`relative z-10 object-cover border-4 border-white/20 ${getShadowClass()}`} style={{ width: '160px', height: '160px', borderRadius: getImageBorderRadius() }} />
          )}
          <div className={`relative z-10 flex-1 ${(!image || customStyle.headingAlign === 'center') ? 'text-center w-full' : ''}`} style={{ textAlign: getTextAlign() }}>
            <h1 style={{ fontSize: `${customStyle.nameSize}px`, lineHeight: 1.05, fontWeight: 900, letterSpacing: "-0.03em" }}>{name}</h1>
            {roleLine && <p className="mt-4 text-xl font-bold tracking-widest uppercase" style={{ color: customStyle.accentColor, opacity: 0.9 }}>{roleLine}</p>}
            <div className="mt-8 flex flex-wrap gap-6 justify-center sm:justify-start" style={{ justifyContent: getTextAlign() }}>
               <ContactInfo isDarkBg={!isMinimalist && customStyle.headerStyle !== "transparent"} />
            </div>
          </div>
        </header>
      )}

      <div className={`flex flex-col ${isTopHeader || isMinimalist ? '' : (isRightSidebar ? 'md:flex-row-reverse' : 'md:flex-row')} min-h-[1050px]`}>
        
        {/* SIVUPALKKI */}
        {(!isTopHeader && !isMinimalist) && (
          <aside className="flex flex-col shrink-0 relative overflow-hidden" style={{ padding: `${padding}px`, color: customStyle.sidebarText, width: isTwoColumn ? '50%' : `${customStyle.sidebarWidth}px`, ...getPatternStyle("sidebar") }}>
            <div className="relative z-10 flex flex-col h-full">
              {image && (
                <img src={image} alt="Profiili" className={`mb-12 aspect-square w-full object-cover border-2 border-white/10 ${getShadowClass()}`} style={{ borderRadius: getImageBorderRadius() }} />
              )}

              <div className="mb-14" style={{ textAlign: getTextAlign() }}>
                <h1 style={{ fontSize: `${customStyle.nameSize * 0.75}px`, lineHeight: 1.1, fontWeight: 900, letterSpacing: "-0.02em" }}>{name}</h1>
                {roleLine && <p className="mt-4 text-sm font-bold tracking-widest uppercase opacity-90" style={{ color: customStyle.accentColor }}>{roleLine}</p>}
              </div>

              <div className="mb-14">
                <h2 className="uppercase tracking-[0.2em] font-black mb-6 opacity-40 text-[10px]" style={{ textAlign: getTextAlign() }}>Yhteystiedot</h2>
                <ContactInfo isDarkBg={true} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: `${customStyle.sectionSpacing}px`, marginTop: 'auto' }}>
                {sections.filter(s => isTagSection(s.title)).map((section, i) => (
                  <div key={i}>
                    <h2 className="uppercase tracking-[0.2em] font-black mb-5 opacity-40 text-[10px]" style={{ textAlign: getTextAlign() }}>{section.title}</h2>
                    {renderTags(section.items)}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* PÄÄALUE */}
        <main className={`relative z-10 flex-1`} style={{ padding: `${padding}px` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${customStyle.sectionSpacing}px`, fontSize: `${customStyle.bodySize}px`, lineHeight: customStyle.lineHeight }}>
            
            {sections.filter(s => (isTopHeader || isMinimalist) ? true : !isTagSection(s.title)).map((section, index) => (
              <section key={index} className={isTwoColumn && (isTopHeader || isMinimalist) ? 'break-inside-avoid' : ''}>
                
                {renderHeading(section.title)}
                
                {/* Valinnainen erotinviiva otsikon alle */}
                {customStyle.showSeparators && (
                  <div className={`h-[3px] mb-8 rounded-full`} style={{ backgroundColor: customStyle.accentColor, width: '50px', opacity: 0.6, marginLeft: customStyle.headingAlign === 'center' ? 'auto' : (customStyle.headingAlign === 'right' ? 'auto' : '0'), marginRight: customStyle.headingAlign === 'center' ? 'auto' : '0' }} />
                )}
                
                {isProfileSection(section.title) ? (
                  renderProfileHook(section.items)
                ) : isTimelineSection(section.title) ? (
                  renderTimeline(section.items)
                ) : isTagSection(section.title) ? (
                  renderTags(section.items)
                ) : (
                  <div className="opacity-80" style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: getTextAlign() }}>
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
