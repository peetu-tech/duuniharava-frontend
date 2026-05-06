"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "../../lib/supabaseAuth";
import { trackUsageEvent } from "../../lib/usageTracking";

type ToolTab = "headhunter" | "hidden-jobs" | "calling-script" | "salary-negotiation" | "linkedin-magnet" | "career-pivot" | "red-flag" | "reference";

export default function ExtraToolsPage() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState<ToolTab>("linkedin-magnet");

  // Tilamuuttujat: PiilotyÃ¶paikat
  const [targetIndustry, setTargetIndustry] = useState("");
  const [userCoreSkill, setUserCoreSkill] = useState("");
  const [hiddenJobResult, setHiddenJobResult] = useState("");
  const [isLoadingHidden, setIsLoadingHidden] = useState(false);

  // Tilamuuttujat: SoittokÃ¤sikirjoitus
  const [callCompany, setCallCompany] = useState("");
  const [callRole, setCallRole] = useState("");
  const [callScriptResult, setCallScriptResult] = useState("");
  const [isLoadingCall, setIsLoadingCall] = useState(false);

  // Tilamuuttujat: Palkkaneuvottelu
  const [offeredSalary, setOfferedSalary] = useState("");
  const [targetSalary, setTargetSalary] = useState("");
  const [salaryResult, setSalaryResult] = useState("");
  const [isLoadingSalary, setIsLoadingSalary] = useState(false);

  // Tilamuuttujat: LinkedIn-Magneetti
  const [linkedInRole, setLinkedInRole] = useState("");
  const [linkedInResult, setLinkedInResult] = useState({ about: "", post: "" });
  const [isLoadingLinkedIn, setIsLoadingLinkedIn] = useState(false);

  // Tilamuuttujat: Uravaihtajan kompassi
  const [oldJob, setOldJob] = useState("");
  const [newJob, setNewJob] = useState("");
  const [pivotResult, setPivotResult] = useState("");
  const [isLoadingPivot, setIsLoadingPivot] = useState(false);

  // Tilamuuttujat: Punaisen lipun kÃ¤Ã¤ntÃ¤jÃ¤
  const [redFlagIssue, setRedFlagIssue] = useState("");
  const [redFlagResult, setRedFlagResult] = useState("");
  const [isLoadingRedFlag, setIsLoadingRedFlag] = useState(false);

  // Tilamuuttujat: Suosittelija-automaatti
  const [refPersonName, setRefPersonName] = useState("");
  const [refSkill, setRefSkill] = useState("");
  const [refResult, setRefResult] = useState("");
  const [isLoadingRef, setIsLoadingRef] = useState(false);

  // Tilamuuttujat: Headhunter-Magneetti
  const [hhRole, setHhRole] = useState("");
  const [hhValue, setHhValue] = useState("");
  const [hhResult, setHhResult] = useState("");
  const [isLoadingHh, setIsLoadingHh] = useState(false);

  const [message, setMessage] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);

  const trackToolUsage = (tool: string) => {
    void trackUsageEvent("tool_used", { tool }, "tools");
  };

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setIsAuthChecking(false);
  }, [router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage("Kopioitu leikepÃ¶ydÃ¤lle!");
    setTimeout(() => setMessage(""), 2500);
  };

  // Yhteinen apufunktio API-kutsuille
  const fetchToolResult = async (toolName: string, dataPayload: any, setResult: Function, setLoading: Function) => {
    setLoading(true);
    try {
      const session = getSession();
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: toolName, userId: session?.user?.id, data: dataPayload }),
      });
      const data = await res.json();
      
      if (data.output) {
        setResult(data.output);
        trackToolUsage(toolName);
      } else {
        setMessage("TekoÃ¤ly palautti tyhjÃ¤n vastauksen.");
      }
    } catch (err) {
      setMessage("Virhe yhteydessÃ¤ palvelimeen.");
    } finally {
      setLoading(false);
    }
  };

  const generateHiddenJobApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetIndustry || !userCoreSkill) return;
    fetchToolResult("hidden-jobs", { targetIndustry, userCoreSkill }, setHiddenJobResult, setIsLoadingHidden);
  };

  const generateCallScript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callCompany || !callRole) return;
    fetchToolResult("calling-script", { callCompany, callRole }, setCallScriptResult, setIsLoadingCall);
  };

  const generateSalaryCounter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offeredSalary || !targetSalary) return;
    fetchToolResult("salary-negotiation", { offeredSalary, targetSalary }, setSalaryResult, setIsLoadingSalary);
  };

  const generateLinkedIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedInRole) return;
    setIsLoadingLinkedIn(true);
    try {
      const session = getSession();
      const res = await fetch("/api/tools", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "linkedin-magnet", userId: session?.user?.id, data: { linkedInRole } }),
      });
      const data = await res.json();
      if (data.output) {
        // Yksinkertainen parseri, jos vastaus on yhdessÃ¤ pÃ¶tkÃ¶ssÃ¤
        const aboutMatch = data.output.split("POST:")[0]?.replace("ABOUT:", "")?.trim();
        const postMatch = data.output.split("POST:")[1]?.trim();
        setLinkedInResult({ 
          about: aboutMatch || data.output, 
          post: postMatch || "" 
        });
        trackToolUsage("linkedin-magnet");
      }
    } catch (err) {
      setMessage("Virhe API-kutsussa.");
    } finally {
      setIsLoadingLinkedIn(false);
    }
  };

  const generatePivotPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldJob || !newJob) return;
    fetchToolResult("career-pivot", { oldJob, newJob }, setPivotResult, setIsLoadingPivot);
  };

  const generateRedFlag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!redFlagIssue) return;
    fetchToolResult("red-flag", { redFlagIssue }, setRedFlagResult, setIsLoadingRedFlag);
  };

  const generateReference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refPersonName || !refSkill) return;
    fetchToolResult("reference", { refPersonName, refSkill }, setRefResult, setIsLoadingRef);
  };

  const generateHeadhunterMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hhRole || !hhValue) return;
    fetchToolResult("headhunter", { hhRole, hhValue }, setHhResult, setIsLoadingHh);
  };

  if (isAuthChecking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0F0F0F] text-white">
        <p className="text-[#00BFA6] font-black text-2xl animate-pulse uppercase tracking-widest">KÃ¤ynnistetÃ¤Ã¤n tyÃ¶kaluja...</p>
      </main>
    );
  }

  const InputClass = `w-full rounded-2xl border px-6 py-5 text-base outline-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-black/50 border-white/10 text-white placeholder:text-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'}`;
  const LabelClass = `mb-3 block text-sm font-bold ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`;

  const handleTabClick = (tab: ToolTab, e: React.MouseEvent<HTMLButtonElement>) => {
    setActiveTab(tab);
    const target = e.currentTarget;
    if (tabsRef.current) {
      const container = tabsRef.current;
      const scrollLeft = target.offsetLeft - (container.offsetWidth / 2) + (target.offsetWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  const tools = [
    { id: "linkedin-magnet", icon: "ðŸš€", title: "LinkedIn", summary: "Profiili ja julkaisu", activeClass: "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border-blue-500" },
    { id: "headhunter", icon: "ðŸ’Ž", title: "Headhunterit", summary: "Ensivaikutelma kuntoon", activeClass: "bg-slate-800 text-white shadow-[0_0_20px_rgba(255,255,255,0.2)] border-slate-600" },
    { id: "hidden-jobs", icon: "ðŸ•µï¸", title: "PiilotyÃ¶t", summary: "LÃ¤hesty suoraan pÃ¤Ã¤ttÃ¤jÃ¤Ã¤", activeClass: "bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border-purple-400" },
    { id: "red-flag", icon: "ðŸ•³ï¸", title: "Haastattelu", summary: "Vaikeat kysymykset", activeClass: "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] border-red-400" },
    { id: "reference", icon: "â­", title: "Suosittelijat", summary: "PyydÃ¤ tuki oikein", activeClass: "bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] border-amber-400" },
    { id: "calling-script", icon: "ðŸ“ž", title: "Puhelut", summary: "Valmis puhelurunko", activeClass: "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] border-indigo-400" },
    { id: "career-pivot", icon: "ðŸ§­", title: "Uranvaihto", summary: "Taidot uuteen suuntaan", activeClass: "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border-emerald-400" },
    { id: "salary-negotiation", icon: "ðŸ¤", title: "Palkka", summary: "Vastatarjous helposti", activeClass: "bg-[#00BFA6] text-black shadow-[0_0_20px_rgba(0,191,166,0.4)] border-[#00BFA6]" },
  ];

  const activeToolMeta = tools.find((tool) => tool.id === activeTab) ?? tools[0];
  const completedDraftCount = [
    linkedInResult.about || linkedInResult.post ? 1 : 0,
    hhResult ? 1 : 0,
    hiddenJobResult ? 1 : 0,
    callScriptResult ? 1 : 0,
    pivotResult ? 1 : 0,
    redFlagResult ? 1 : 0,
    refResult ? 1 : 0,
    salaryResult ? 1 : 0,
  ].reduce((sum, value) => sum + value, 0);

  return (
    <div className={theme === 'light' ? 'light-theme' : ''}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes softFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes softPulse {
          0%, 100% { box-shadow: 0 0 0 rgba(0,191,166,0); }
          50% { box-shadow: 0 0 30px rgba(0,191,166,0.12); }
        }
        .light-theme .bg-\\[\\#0F0F0F\\] { background-color: #F9FAFB !important; }
        .light-theme .bg-\\[\\#141414\\] { background-color: #FFFFFF !important; }
        .light-theme .bg-black\\/50 { background-color: #FFFFFF !important; border: 1px solid #E5E7EB !important; }
        .light-theme .text-white { color: #111827 !important; }
        .light-theme .text-gray-400 { color: #6B7280 !important; }
        .light-theme .border-white\\/10 { border-color: #E5E7EB !important; }
        .light-theme .border-white\\/5 { border-color: #F3F4F6 !important; }
        .soft-float { animation: softFloat 6s ease-in-out infinite; }
        .soft-pulse { animation: softPulse 4s ease-in-out infinite; }
      `}} />
      <main className="min-h-screen overflow-hidden bg-[#0F0F0F] text-white font-sans pb-32 sm:pb-24 transition-colors duration-300">
        
        {/* MOBIILIN PIKANAVIGOINTI */}
        <nav className={`fixed bottom-3 left-3 right-3 z-50 flex justify-around items-center gap-2 rounded-[28px] border p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_18px_50px_rgba(0,0,0,0.35)] sm:hidden backdrop-blur-2xl transition-colors ${theme === 'dark' ? 'bg-[#0A0A0A]/92 border-white/10' : 'bg-white/92 border-gray-200 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'}`} aria-label="Mobiilin pikavalikko">
          <button onClick={() => router.push('/studio')} className={`flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'}`}>
            <span className="text-xl" aria-hidden="true">ðŸ </span> Studio
          </button>
          <button className={`flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-bold text-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 bg-purple-500/10`}>
            <span className="text-xl" aria-hidden="true">ðŸ› ï¸</span> TyÃ¶kalut
          </button>
        </nav>

        {/* HERO */}
        <section className="border-b border-white/10 bg-gradient-to-b from-purple-900/20 to-transparent pt-16 pb-14 sm:pt-12 sm:pb-16 px-4 sm:px-8">
          <div className="max-w-[1920px] mx-auto flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 xl:gap-12">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="font-black text-2xl sm:text-3xl tracking-tighter"><span className="text-[#00BFA6]">DUUNI</span><span className="text-[#FF6F3C]">HARAVA</span></span>
                <div className="bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full text-[10px] font-bold text-purple-400 uppercase tracking-widest">Automaatio</div>
              </div>
              <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.24em] text-purple-400">LisÃ¤tyÃ¶kalut</p>
              <h1 className="mt-3 max-w-4xl text-4xl sm:text-6xl xl:text-7xl font-black leading-[0.96] tracking-tight">Anna tekoÃ¤lyn <span className="text-purple-500">tehdÃ¤ tyÃ¶t.</span></h1>
              <p className={`mt-5 text-base sm:text-xl max-w-2xl leading-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Ã„lÃ¤ keksi pyÃ¶rÃ¤Ã¤ uudelleen. Valitse tyÃ¶kalu alta, kerro tÃ¤rkeimmÃ¤t tiedot ja anna Duuniharavan rakentaa sinulle valmis luonnos sekunneissa.
              </p>
            </div>
            
            <div className="flex gap-4 w-full xl:w-auto xl:min-w-[360px]">
              <button onClick={() => router.push('/studio')} className="flex-1 sm:flex-none rounded-2xl border border-white/10 px-6 py-4 sm:py-4 text-sm font-black text-gray-400 hover:bg-white/5 hover:text-white transition-all text-center hover:-translate-y-1">
                â† TAKAISIN STUDIOON
              </button>
              <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-2xl border border-white/10 px-6 py-4 sm:py-4 text-lg sm:text-sm font-black text-gray-400 hover:bg-white/5 hover:text-white transition-all flex items-center justify-center hover:-translate-y-1">
                {theme === 'light' ? 'ðŸŒ™' : 'â˜€ï¸'}
              </button>
            </div>
          </div>
        </section>

        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 xl:px-10 2xl:px-14 mt-8 sm:mt-12">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:gap-8 mb-10 sm:mb-14">
            <div className={`rounded-[32px] border p-6 sm:p-7 ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-white'}`}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00BFA6]">1. Valitse tyÃ¶kalu</p>
              <p className={`mt-3 text-sm leading-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Aloita siitÃ¤ kohdasta, jossa olet juuri nyt jumissa. Jokainen tyÃ¶kalu ratkaisee yhden selkeÃ¤n tilanteen.</p>
            </div>
            <div className={`rounded-[32px] border p-6 sm:p-7 ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-white'}`}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00BFA6]">2. Kerro vain tÃ¤rkein</p>
              <p className={`mt-3 text-sm leading-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Et tarvitse tÃ¤ydellistÃ¤ briiffiÃ¤. RiittÃ¤Ã¤, ettÃ¤ tÃ¤ytÃ¤t yhden tai kaksi tÃ¤rkeintÃ¤ tietoa kunnolla.</p>
            </div>
            <div className={`rounded-[32px] border p-6 sm:p-7 ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-white'}`}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00BFA6]">3. Kopioi ja jatka</p>
              <p className={`mt-3 text-sm leading-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Kun luonnos nÃ¤yttÃ¤Ã¤ hyvÃ¤ltÃ¤, kopioi se talteen ja jatka suoraan studioon tai alkuperÃ¤iseen palveluun.</p>
            </div>
          </div>

          {/* TABS - "App Icon" Grid Layout */}
          <div ref={tabsRef} className="grid grid-cols-2 min-[560px]:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8 gap-4 sm:gap-5 xl:gap-6 mb-10 sm:mb-16">
            {tools.map(tool => (
              <button 
                key={tool.id}
                onClick={(e) => handleTabClick(tool.id as ToolTab, e)} 
                className={`flex min-h-[132px] sm:min-h-[150px] flex-col items-center justify-center text-center rounded-[28px] sm:rounded-[30px] p-4 sm:p-6 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-purple-500 ${
                  activeTab === tool.id 
                    ? tool.activeClass 
                    : (theme === 'dark' ? 'border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:-translate-y-2 hover:border-white/20' : 'border border-gray-200 bg-white shadow-sm text-gray-600 hover:bg-gray-50 hover:-translate-y-2')
                }`}
              >
                <span className="text-3xl sm:text-5xl mb-2 sm:mb-4 block transition-transform duration-300 hover:scale-110" aria-hidden="true">{tool.icon}</span>
                <span className="text-[10px] sm:text-sm font-black uppercase tracking-[0.18em] leading-tight">{tool.title}</span>
                <span className={`mt-3 text-[11px] sm:text-xs leading-5 ${activeTab === tool.id ? 'text-white/80' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}`}>
                  {tool.summary}
                </span>
              </button>
            ))}
          </div>


          <div className={`mb-6 rounded-[32px] border p-5 sm:p-6 ${theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-white/95'}`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#00BFA6]">Helppo eteneminen</p>
                <h2 className={`mt-2 text-2xl sm:text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {activeToolMeta.title}: ensin syöte vasemmalle, valmis luonnos oikealle
                </h2>
                <p className={`mt-3 text-sm sm:text-base leading-7 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tämä näkymä on nyt tarkoituksella selkeämpi: yksi työkalu kerrallaan, enemmän ilmaa elementtien väliin ja huomio olennaiseen.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 lg:w-[360px]">
                <div className={`rounded-2xl border px-4 py-4 ${theme === 'dark' ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-gray-50'}`}><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#00BFA6]">1</p><p className={`mt-2 text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Valitse</p></div>
                <div className={`rounded-2xl border px-4 py-4 ${theme === 'dark' ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-gray-50'}`}><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#00BFA6]">2</p><p className={`mt-2 text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Syötä</p></div>
                <div className={`rounded-2xl border px-4 py-4 ${theme === 'dark' ? 'border-white/10 bg-black/25' : 'border-gray-200 bg-gray-50'}`}><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#00BFA6]">3</p><p className={`mt-2 text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Kopioi</p></div>
              </div>
            </div>
          </div>
          <div className={`rounded-[32px] sm:rounded-[40px] border p-6 sm:p-12 xl:p-14 shadow-2xl backdrop-blur-xl ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
            
            {/* LINKEDIN MAGNEETTI */}
            {activeTab === "linkedin-magnet" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Tee profiilistasi magneetti</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Ã„lÃ¤ hae tÃ¶itÃ¤, vaan anna rekrytoijien lÃ¶ytÃ¤Ã¤ sinut. TekoÃ¤ly kirjoittaa sinulle asiantuntijatason esittelyn ja postauksen sekunneissa.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generateLinkedIn} className="space-y-6">
                    <div>
                      <label className={LabelClass}>MitÃ¤ tyÃ¶tÃ¤ haluat tehdÃ¤?</label>
                      <input value={linkedInRole} onChange={e => setLinkedInRole(e.target.value)} placeholder="Esim. Graafinen suunnittelija tai MyyjÃ¤" className={InputClass} required />
                    </div>
                    <button type="submit" disabled={isLoadingLinkedIn} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(37,99,235,0.3)]">
                      {isLoadingLinkedIn ? "TekoÃ¤ly generoi..." : "LUO LINKEDIN-SISÃ„LLÃ–T"}
                    </button>
                  </form>

                  <div className="space-y-6">
                    <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>1. "About" -teksti profiiliin</p>
                      <textarea readOnly value={linkedInResult.about || "TÃ¤ytÃ¤ tiedot ja paina nappia, niin teksti ilmestyy tÃ¤hÃ¤n."} className={`w-full min-h-[150px] bg-transparent outline-none resize-none leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                      {linkedInResult.about && <button onClick={() => copyToClipboard(linkedInResult.about)} className="mt-2 text-sm font-bold text-blue-500 hover:underline">Kopioi teksti</button>}
                    </div>
                    <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>2. Valmis postaus uutisvirtaan</p>
                      <textarea readOnly value={linkedInResult.post || "TÃ¤ytÃ¤ tiedot ja paina nappia, niin teksti ilmestyy tÃ¤hÃ¤n."} className={`w-full min-h-[150px] bg-transparent outline-none resize-none leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                      {linkedInResult.post && <button onClick={() => copyToClipboard(linkedInResult.post)} className="mt-2 text-sm font-bold text-blue-500 hover:underline">Kopioi postaus</button>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HEADHUNTER-MAGNEETTI */}
            {activeTab === "headhunter" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>ðŸ’Ž Headhunter-magneetti</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Asiantuntijat ja johtajat eivÃ¤t hae tÃ¶itÃ¤, heidÃ¤t lÃ¶ydetÃ¤Ã¤n. TekoÃ¤ly muotoilee sinulle vakuuttavan, arvoa (ROI) korostavan viestin, jolla voit lÃ¤hestyÃ¤ suorahakukonsultteja ennakoivasti.</p>
                
                <div className={`mb-10 p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                  <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span>ðŸ’¡</span> Miten lÃ¤hestyÃ¤ headhunteria?
                  </h3>
                  <p className={`leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Etsi oman alasi suorahakukonsultteja LinkedInistÃ¤. Ã„lÃ¤ lÃ¤hetÃ¤ perinteistÃ¤ CV:tÃ¤ ja kysy epÃ¤toivoisesti tÃ¶itÃ¤. Esittele sen sijaan itsesi asiantuntijana, joka tuottaa yrityksille <strong>mitattavaa arvoa ja tulosta</strong>, ja ehdota verkostoitumista tulevaisuuden varalta. NÃ¤in jÃ¤Ã¤t heidÃ¤n mieleensÃ¤, kun sopiva piilohaku aukeaa.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generateHeadhunterMessage} className="space-y-6">
                    <div>
                      <label className={LabelClass}>MikÃ¤ on asiantuntijaroolisi / tittelisi?</label>
                      <input value={hhRole} onChange={e => setHhRole(e.target.value)} placeholder="Esim. Talousjohtaja tai Senior Developer" className={InputClass} required />
                    </div>
                    <div>
                      <label className={LabelClass}>MinkÃ¤ tuloksen / arvon (ROI) tuotat yritykselle?</label>
                      <textarea value={hhValue} onChange={e => setHhValue(e.target.value)} placeholder="Esim. Olen skaalannut startupeja kansainvÃ¤lisille markkinoille ja leikannut kuluja..." className={`${InputClass} min-h-[120px]`} required />
                    </div>
                    <button type="submit" disabled={isLoadingHh} className="w-full bg-slate-700 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(255,255,255,0.1)] border border-slate-500">
                      {isLoadingHh ? "Luodaan viestiÃ¤..." : "LUO PITCH HEADHUNTERILLE"}
                    </button>
                  </form>

                  <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Valmis viesti LinkedIniin</p>
                    {hhResult ? (
                      <div className="space-y-4">
                        <textarea readOnly value={hhResult} className={`w-full min-h-[300px] bg-transparent outline-none resize-none leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                        <button onClick={() => copyToClipboard(hhResult)} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-colors">
                          KOPIOI VIESTI
                        </button>
                      </div>
                    ) : (
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>TekoÃ¤ly muotoilee viestin tÃ¤hÃ¤n.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PIILOTYÃ–PAIKAT */}
            {activeTab === "hidden-jobs" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>PiilotyÃ¶paikan kartoittaja</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Yli 70 % paikoista ei tule koskaan julkiseen hakuun. Anna tekoÃ¤lyn laatia avoin hakemus suoraan yrityksen pÃ¤Ã¤ttÃ¤jÃ¤lle.</p>
                
                <div className={`mb-10 p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
                  <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>
                    <span>ðŸ’¡</span> Miten lÃ¤hestyÃ¤ pÃ¤Ã¤ttÃ¤jiÃ¤?
                  </h3>
                  <p className={`leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Ã„lÃ¤ lÃ¤hetÃ¤ viestiÃ¤ "info@yritys.fi" sÃ¤hkÃ¶postiin. Etsi LinkedInistÃ¤ yrityksen toimitusjohtaja (pienet yritykset) tai osaston vetÃ¤jÃ¤ (isot yritykset). LÃ¤hetÃ¤ tekoÃ¤lyn generoima viesti suoraan heille yksityisviestinÃ¤. Tarjoa heille <strong>ratkaisua heidÃ¤n ongelmaansa</strong>, Ã¤lÃ¤ vain pyydÃ¤ tÃ¶itÃ¤.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generateHiddenJobApp} className="space-y-6">
                    <div>
                      <label className={LabelClass}>Kohdetoimiala tai yritys</label>
                      <input value={targetIndustry} onChange={e => setTargetIndustry(e.target.value)} placeholder="Esim. Ohjelmistoala tai Wolt" className={InputClass} required />
                    </div>
                    <div>
                      <label className={LabelClass}>MikÃ¤ on se yksi ongelma, jonka osaat ratkaista?</label>
                      <textarea value={userCoreSkill} onChange={e => setUserCoreSkill(e.target.value)} placeholder="Esim. Osaan nopeuttaa asiakaspalvelua automaatiolla..." className={`${InputClass} min-h-[120px]`} required />
                    </div>
                    <button type="submit" disabled={isLoadingHidden} className="w-full bg-purple-500 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(168,85,247,0.3)]">
                      {isLoadingHidden ? "Luodaan viestiÃ¤..." : "LUO LÃ„HESTYMISVIESTI"}
                    </button>
                  </form>

                  <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>Valmis viesti kopioitavaksi</p>
                    {hiddenJobResult ? (
                      <div className="space-y-4">
                        <textarea readOnly value={hiddenJobResult} className={`w-full min-h-[300px] bg-transparent outline-none resize-none leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                        <button onClick={() => copyToClipboard(hiddenJobResult)} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-colors">
                          KOPIOI TEKSTI LEIKEPÃ–YDÃ„LLE
                        </button>
                      </div>
                    ) : (
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>TekoÃ¤ly luonnostelee viestin tÃ¤hÃ¤n.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SOITTOKÃ„SIKIRJOITUS */}
            {activeTab === "calling-script" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Puhelun Teleprompteri</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>JÃ¤nnittÃ¤Ã¤kÃ¶ soittaa? Et ole yksin. TÃ¤mÃ¤ tyÃ¶kalu tekee sinulle askel-askeleelta etenevÃ¤n kÃ¤sikirjoituksen, jonka voit lukea suoraan puhelun aikana.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generateCallScript} className="space-y-6">
                    <div>
                      <label className={LabelClass}>Kohdeyritys</label>
                      <input value={callCompany} onChange={e => setCallCompany(e.target.value)} placeholder="Esim. Kone Keskus Oy" className={InputClass} required />
                    </div>
                    <div>
                      <label className={LabelClass}>Mihin rooliin haet?</label>
                      <input value={callRole} onChange={e => setCallRole(e.target.value)} placeholder="Esim. ProjektipÃ¤Ã¤llikkÃ¶" className={InputClass} required />
                    </div>
                    <button type="submit" disabled={isLoadingCall} className="w-full bg-indigo-500 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(99,102,241,0.3)]">
                      {isLoadingCall ? "Laaditaan skriptiÃ¤..." : "LUO KÃ„SIKIRJOITUS"}
                    </button>
                  </form>

                  <div className={`relative p-6 sm:p-8 rounded-[32px] border-4 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-gray-100 border-gray-300'}`}>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-gray-500/50"></div>
                    <p className={`text-xs font-bold uppercase text-center tracking-widest mt-2 mb-6 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>Puhelimen nÃ¤kymÃ¤</p>
                    {callScriptResult ? (
                      <div className="space-y-4">
                        <textarea readOnly value={callScriptResult} className={`w-full min-h-[350px] bg-transparent outline-none resize-none leading-relaxed text-base sm:text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                      </div>
                    ) : (
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>KÃ¤sikirjoitus ilmestyy tÃ¤hÃ¤n puhelimen nÃ¤ytÃ¶lle luettavaksi.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* URAVAIHTAJAN KOMPASSI */}
            {activeTab === "career-pivot" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Uravaihtajan kompassi</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Haluatko vaihtaa alaa, mutta tuntuu ettÃ¤ aloitat nollasta? TekoÃ¤ly etsii vanhasta kokemuksestasi piilevÃ¤t taidot ja kÃ¤Ã¤ntÃ¤Ã¤ ne uuden alan kielelle.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generatePivotPlan} className="space-y-6">
                    <div>
                      <label className={LabelClass}>Nykyinen / Vanha ammattisi</label>
                      <input value={oldJob} onChange={e => setOldJob(e.target.value)} placeholder="Esim. Sairaanhoitaja" className={InputClass} required />
                    </div>
                    <div>
                      <label className={LabelClass}>Mihin tyÃ¶hÃ¶n haluat siirtyÃ¤?</label>
                      <input value={newJob} onChange={e => setNewJob(e.target.value)} placeholder="Esim. AsiakaspalvelupÃ¤Ã¤llikkÃ¶ tai koodari" className={InputClass} required />
                    </div>
                    <button type="submit" disabled={isLoadingPivot} className="w-full bg-emerald-500 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(16,185,129,0.3)]">
                      {isLoadingPivot ? "Analysoidaan taitoja..." : "NÃ„YTÃ„ REITTI UUDELLE ALALLE"}
                    </button>
                  </form>

                  <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>Toimintasuunnitelma</p>
                    {pivotResult ? (
                      <div className="space-y-4">
                        <textarea readOnly value={pivotResult} className={`w-full min-h-[300px] bg-transparent outline-none resize-none leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                        <button onClick={() => copyToClipboard(pivotResult)} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-colors">
                          KOPIOI SUUNNITELMA
                        </button>
                      </div>
                    ) : (
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>TekoÃ¤ly rakentaa reitin tÃ¤hÃ¤n.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PUNAISEN LIPUN KÃ„Ã„NTÃ„JÃ„ */}
            {activeTab === "red-flag" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Haastattelun Pelastusrengas</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>PelkÃ¤Ã¤tkÃ¶ jotain tiettyÃ¤ kysymystÃ¤ haastattelussa? Anna tekoÃ¤lyn kÃ¤Ã¤ntÃ¤Ã¤ "heikkoutesi" tai huono historiasi vakuuttavaksi vahvuudeksi.</p>
                
                <div className={`mb-10 p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                  <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>
                    <span>ðŸ’¡</span> Miten vastata vaikeisiin kysymyksiin?
                  </h3>
                  <p className={`leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Rekrytoija ei etsi tÃ¤ydellistÃ¤ ihmistÃ¤, vaan ihmistÃ¤ joka pystyy myÃ¶ntÃ¤mÃ¤Ã¤n virheensÃ¤ ja <strong>oppimaan niistÃ¤</strong>. Jos sinut erotettiin tai olet ollut pitkÃ¤Ã¤n tyÃ¶ttÃ¶mÃ¤nÃ¤, Ã¤lÃ¤ selittele tai syytÃ¤ muita. Ota vastuu, kerro mitÃ¤ opit, ja kÃ¤Ã¤nnÃ¤ keskustelu siihen, miksi olet nyt vahvempi tyÃ¶ntekijÃ¤.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generateRedFlag} className="space-y-6">
                    <div>
                      <label className={LabelClass}>MikÃ¤ on CV:si tai taustasi suurin heikkous/ongelma?</label>
                      <textarea value={redFlagIssue} onChange={e => setRedFlagIssue(e.target.value)} placeholder="Esim. Sain potkut edellisestÃ¤ tyÃ¶stÃ¤ koska en saavuttanut myyntitavoitteita... TAI Olin vuoden tyÃ¶ttÃ¶mÃ¤nÃ¤ mielenterveysongelmien takia..." className={`${InputClass} min-h-[140px]`} required />
                    </div>
                    <button type="submit" disabled={isLoadingRedFlag} className="w-full bg-red-500 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(239,68,68,0.3)]">
                      {isLoadingRedFlag ? "Luodaan pelastusta..." : "KÃ„Ã„NNÃ„ POSITIIVISEKSI"}
                    </button>
                  </form>

                  <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Vastaus haastattelijalle</p>
                    {redFlagResult ? (
                      <div className="space-y-4">
                        <textarea readOnly value={redFlagResult} className={`w-full min-h-[300px] bg-transparent outline-none resize-none leading-relaxed text-sm sm:text-base italic ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                        <button onClick={() => copyToClipboard(redFlagResult)} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-colors">
                          KOPIOI VASTAUS
                        </button>
                      </div>
                    ) : (
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>TekoÃ¤ly muotoilee vastauksen tÃ¤hÃ¤n.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUOSITTELIJA-AUTOMAATTI */}
            {activeTab === "reference" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Suosittelija-automaatti</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Toisen ihmisen antama suositus on tyÃ¶nhaun tehokkain tyÃ¶kalu. Anna tekoÃ¤lyn laatia kohtelias viesti, jolla pyydÃ¤t entistÃ¤ pomoa tai kollegaa suosittelijaksi.</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generateReference} className="space-y-6">
                    <div>
                      <label className={LabelClass}>Entisen pomon tai kollegan etunimi</label>
                      <input value={refPersonName} onChange={e => setRefPersonName(e.target.value)} placeholder="Esim. Sari" className={InputClass} required />
                    </div>
                    <div>
                      <label className={LabelClass}>MitÃ¤ taitoa haluaisit hÃ¤nen korostavan?</label>
                      <input value={refSkill} onChange={e => setRefSkill(e.target.value)} placeholder="Esim. KykyÃ¤ni johtaa projekteja tiukoissa aikatauluissa" className={InputClass} required />
                    </div>
                    <button type="submit" disabled={isLoadingRef} className="w-full bg-amber-500 text-black font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(245,158,11,0.3)]">
                      {isLoadingRef ? "Kirjoitetaan viestiÃ¤..." : "LAADI PYYNTÃ–VIESTI"}
                    </button>
                  </form>

                  <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>Viestiluonnos (SÃ¤hkÃ¶posti / LinkedIn)</p>
                    {refResult ? (
                      <div className="space-y-4">
                        <textarea readOnly value={refResult} className={`w-full min-h-[300px] bg-transparent outline-none resize-none leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                        <button onClick={() => copyToClipboard(refResult)} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-colors">
                          KOPIOI VIESTI
                        </button>
                      </div>
                    ) : (
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>TÃ¤ytÃ¤ tiedot ja paina nappia.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PALKKANEUVOTTELIJA */}
            {activeTab === "salary-negotiation" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Asiantuntijan palkkaneuvottelija</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>TyÃ¶nantajat odottavat sinun neuvottelevan. Anna tekoÃ¤lyn muotoilla asiallinen mutta jÃ¤mÃ¤kkÃ¤ vastatarjous.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generateSalaryCounter} className="space-y-6">
                    <div>
                      <label className={LabelClass}>MitÃ¤ he tarjosivat? (â‚¬/kk)</label>
                      <input type="number" value={offeredSalary} onChange={e => setOfferedSalary(e.target.value)} placeholder="Esim. 2800" className={InputClass} required />
                    </div>
                    <div>
                      <label className={LabelClass}>MikÃ¤ on oma tavoitteesi? (â‚¬/kk)</label>
                      <input type="number" value={targetSalary} onChange={e => setTargetSalary(e.target.value)} placeholder="Esim. 3200" className={InputClass} required />
                    </div>
                    <button type="submit" disabled={isLoadingSalary} className="w-full bg-[#00BFA6] text-black font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(0,191,166,0.3)]">
                      {isLoadingSalary ? "Lasketaan vastatarjousta..." : "LAADI VASTATARJOUS"}
                    </button>
                  </form>

                  <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-[#00BFA6]' : 'text-teal-700'}`}>Valmis vastaus sÃ¤hkÃ¶postiin</p>
                    {salaryResult ? (
                      <div className="space-y-4">
                        <textarea readOnly value={salaryResult} className={`w-full min-h-[300px] bg-transparent outline-none resize-none leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                        <button onClick={() => copyToClipboard(salaryResult)} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-colors">
                          KOPIOI TEKSTI
                        </button>
                      </div>
                    ) : (
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>SyÃ¶tÃ¤ luvut, niin teemme tarjouksen.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* TOAST MESSAGE */}
        {message && (
          <div className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 z-50 max-w-[340px] rounded-[24px] border border-[#00BFA6]/30 bg-[#0f172a]/92 p-4 sm:p-5 text-sm sm:text-base font-bold text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5">
            {message}
          </div>
        )}
      </main>
    </div>
  );
}



