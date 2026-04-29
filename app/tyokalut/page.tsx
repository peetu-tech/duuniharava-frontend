"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "../../lib/supabaseAuth";

type ToolTab = "headhunter" | "hidden-jobs" | "calling-script" | "salary-negotiation" | "linkedin-magnet" | "career-pivot" | "red-flag" | "reference";

export default function ExtraToolsPage() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState<ToolTab>("linkedin-magnet");

  // Tilamuuttujat: Piilotyöpaikat
  const [targetIndustry, setTargetIndustry] = useState("");
  const [userCoreSkill, setUserCoreSkill] = useState("");
  const [hiddenJobResult, setHiddenJobResult] = useState("");
  const [isLoadingHidden, setIsLoadingHidden] = useState(false);

  // Tilamuuttujat: Soittokäsikirjoitus
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

  // Tilamuuttujat: Uravaihtajan Kompassi
  const [oldJob, setOldJob] = useState("");
  const [newJob, setNewJob] = useState("");
  const [pivotResult, setPivotResult] = useState("");
  const [isLoadingPivot, setIsLoadingPivot] = useState(false);

  // Tilamuuttujat: Punaisen lipun kääntäjä
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
    setMessage("Kopioitu leikepöydälle!");
    setTimeout(() => setMessage(""), 2500);
  };

  // YHTEINEN APUFUKTIO API-KUTSUILLE
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
      } else {
        setMessage("Tekoäly palautti tyhjän vastauksen.");
      }
    } catch (err) {
      setMessage("Virhe yhteydessä palvelimeen.");
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
        // Yksinkertainen parseri, jos vastaus on yhdessä pötkössä
        const aboutMatch = data.output.split("POST:")[0]?.replace("ABOUT:", "")?.trim();
        const postMatch = data.output.split("POST:")[1]?.trim();
        setLinkedInResult({ 
          about: aboutMatch || data.output, 
          post: postMatch || "" 
        });
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
        <p className="text-[#00BFA6] font-black text-2xl animate-pulse uppercase tracking-widest">Käynnistetään työkaluja...</p>
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
    { id: "linkedin-magnet", icon: "🚀", title: "LinkedIn", activeClass: "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border-blue-500" },
    { id: "headhunter", icon: "💎", title: "Headhunterit", activeClass: "bg-slate-800 text-white shadow-[0_0_20px_rgba(255,255,255,0.2)] border-slate-600" },
    { id: "hidden-jobs", icon: "🕵️", title: "Piilotyöt", activeClass: "bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border-purple-400" },
    { id: "red-flag", icon: "🕳️", title: "Haastattelu", activeClass: "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] border-red-400" },
    { id: "reference", icon: "⭐", title: "Suosittelijat", activeClass: "bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] border-amber-400" },
    { id: "calling-script", icon: "📞", title: "Puhelut", activeClass: "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] border-indigo-400" },
    { id: "career-pivot", icon: "🧭", title: "Uranvaihto", activeClass: "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border-emerald-400" },
    { id: "salary-negotiation", icon: "🤝", title: "Palkka", activeClass: "bg-[#00BFA6] text-black shadow-[0_0_20px_rgba(0,191,166,0.4)] border-[#00BFA6]" },
  ];

  return (
    <div className={theme === 'light' ? 'light-theme' : ''}>
      <style dangerouslySetInnerHTML={{__html: `
        .light-theme .bg-\\[\\#0F0F0F\\] { background-color: #F9FAFB !important; }
        .light-theme .bg-\\[\\#141414\\] { background-color: #FFFFFF !important; }
        .light-theme .bg-black\\/50 { background-color: #FFFFFF !important; border: 1px solid #E5E7EB !important; }
        .light-theme .text-white { color: #111827 !important; }
        .light-theme .text-gray-400 { color: #6B7280 !important; }
        .light-theme .border-white\\/10 { border-color: #E5E7EB !important; }
        .light-theme .border-white\\/5 { border-color: #F3F4F6 !important; }
      `}} />
      <main className="min-h-screen bg-[#0F0F0F] text-white font-sans pb-32 sm:pb-24 transition-colors duration-300">
        
        {/* MOBIILIN PIKANAVIGOINTI */}
        <nav className={`fixed bottom-3 left-3 right-3 z-50 flex justify-around items-center gap-2 rounded-[28px] border p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_18px_50px_rgba(0,0,0,0.35)] sm:hidden backdrop-blur-2xl transition-colors ${theme === 'dark' ? 'bg-[#0A0A0A]/92 border-white/10' : 'bg-white/92 border-gray-200 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'}`} aria-label="Mobiilin pikavalikko">
          <button onClick={() => router.push('/studio')} className={`flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'}`}>
            <span className="text-xl" aria-hidden="true">🏠</span> Studio
          </button>
          <button className={`flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-bold text-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 bg-purple-500/10`}>
            <span className="text-xl" aria-hidden="true">🛠️</span> Työkalut
          </button>
        </nav>

        {/* HERO */}
        <section className="border-b border-white/10 bg-gradient-to-b from-purple-900/20 to-transparent pt-16 pb-14 sm:pt-12 sm:pb-16 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="font-black text-2xl sm:text-3xl tracking-tighter"><span className="text-[#00BFA6]">DUUNI</span><span className="text-[#FF6F3C]">HARAVA</span></span>
                <div className="bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full text-[10px] font-bold text-purple-400 uppercase tracking-widest">Automaatio</div>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black">Anna tekoälyn <span className="text-purple-500">tehdä työt.</span></h1>
              <p className={`mt-4 text-sm sm:text-lg max-w-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Älä keksi pyörää uudelleen. Valitse työkalu alta, kerro perusasiat ja anna algoritmin tuottaa asiantuntijatason tekstiä sekunneissa.
              </p>
            </div>
            
            <div className="flex gap-4 w-full sm:w-auto">
              <button onClick={() => router.push('/studio')} className="flex-1 sm:flex-none rounded-2xl border border-white/10 px-6 py-4 sm:py-3 text-sm font-black text-gray-400 hover:bg-white/5 hover:text-white transition-all text-center">
                ← TAKAISIN STUDIOON
              </button>
              <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-2xl border border-white/10 px-6 py-4 sm:py-3 text-lg sm:text-sm font-black text-gray-400 hover:bg-white/5 hover:text-white transition-all flex items-center justify-center">
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-8 sm:mt-12">
          
          {/* TABS - "App Icon" Grid Layout */}
          <div ref={tabsRef} className="grid grid-cols-2 min-[500px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 mb-8 sm:mb-14">
            {tools.map(tool => (
              <button 
                key={tool.id}
                onClick={(e) => handleTabClick(tool.id as ToolTab, e)} 
                className={`flex flex-col items-center justify-center text-center rounded-2xl sm:rounded-[24px] p-3 sm:p-5 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-purple-500 ${
                  activeTab === tool.id 
                    ? tool.activeClass 
                    : (theme === 'dark' ? 'border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:-translate-y-1' : 'border border-gray-200 bg-white shadow-sm text-gray-600 hover:bg-gray-50 hover:-translate-y-1')
                }`}
              >
                <span className="text-2xl sm:text-4xl mb-1 sm:mb-3 block transition-transform hover:scale-110" aria-hidden="true">{tool.icon}</span>
                <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider leading-tight">{tool.title}</span>
              </button>
            ))}
          </div>

          <div className={`rounded-[32px] sm:rounded-[40px] border p-6 sm:p-12 shadow-2xl backdrop-blur-xl ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
            
            {/* LINKEDIN MAGNEETTI */}
            {activeTab === "linkedin-magnet" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Tee profiilistasi magneetti</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Älä hae töitä, vaan anna rekrytoijien löytää sinut. Tekoäly kirjoittaa sinulle asiantuntijatason esittelyn ja postauksen sekunneissa.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generateLinkedIn} className="space-y-6">
                    <div>
                      <label className={LabelClass}>Mitä työtä haluat tehdä?</label>
                      <input value={linkedInRole} onChange={e => setLinkedInRole(e.target.value)} placeholder="Esim. Graafinen suunnittelija tai Myyjä" className={InputClass} required />
                    </div>
                    <button type="submit" disabled={isLoadingLinkedIn} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(37,99,235,0.3)]">
                      {isLoadingLinkedIn ? "Tekoäly generoi..." : "LUO LINKEDIN-SISÄLLÖT"}
                    </button>
                  </form>

                  <div className="space-y-6">
                    <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>1. "About" -teksti profiiliin</p>
                      <textarea readOnly value={linkedInResult.about || "Täytä tiedot ja paina nappia, niin teksti ilmestyy tähän."} className={`w-full min-h-[150px] bg-transparent outline-none resize-none leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                      {linkedInResult.about && <button onClick={() => copyToClipboard(linkedInResult.about)} className="mt-2 text-sm font-bold text-blue-500 hover:underline">Kopioi teksti</button>}
                    </div>
                    <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>2. Valmis postaus uutisvirtaan</p>
                      <textarea readOnly value={linkedInResult.post || "Täytä tiedot ja paina nappia, niin teksti ilmestyy tähän."} className={`w-full min-h-[150px] bg-transparent outline-none resize-none leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                      {linkedInResult.post && <button onClick={() => copyToClipboard(linkedInResult.post)} className="mt-2 text-sm font-bold text-blue-500 hover:underline">Kopioi postaus</button>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HEADHUNTER-MAGNEETTI */}
            {activeTab === "headhunter" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>💎 Headhunter-Magneetti</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Asiantuntijat ja johtajat eivät hae töitä, heidät löydetään. Tekoäly muotoilee sinulle vakuuttavan, arvoa (ROI) korostavan viestin, jolla voit lähestyä suorahakukonsultteja ennakoivasti.</p>
                
                <div className={`mb-10 p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                  <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span>💡</span> Miten lähestyä headhunteria?
                  </h3>
                  <p className={`leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Etsi oman alasi suorahakukonsultteja LinkedInistä. Älä lähetä perinteistä CV:tä ja kysy epätoivoisesti töitä. Esittele sen sijaan itsesi asiantuntijana, joka tuottaa yrityksille <strong>mitattavaa arvoa ja tulosta</strong>, ja ehdota verkostoitumista tulevaisuuden varalta. Näin jäät heidän mieleensä, kun sopiva piilohaku aukeaa.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generateHeadhunterMessage} className="space-y-6">
                    <div>
                      <label className={LabelClass}>Mikä on asiantuntijaroolisi / tittelisi?</label>
                      <input value={hhRole} onChange={e => setHhRole(e.target.value)} placeholder="Esim. Talousjohtaja tai Senior Developer" className={InputClass} required />
                    </div>
                    <div>
                      <label className={LabelClass}>Minkä tuloksen / arvon (ROI) tuotat yritykselle?</label>
                      <textarea value={hhValue} onChange={e => setHhValue(e.target.value)} placeholder="Esim. Olen skaalannut startupeja kansainvälisille markkinoille ja leikannut kuluja..." className={`${InputClass} min-h-[120px]`} required />
                    </div>
                    <button type="submit" disabled={isLoadingHh} className="w-full bg-slate-700 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(255,255,255,0.1)] border border-slate-500">
                      {isLoadingHh ? "Luodaan viestiä..." : "LUO PITCH HEADHUNTERILLE"}
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
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Tekoäly muotoilee viestin tähän.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PIILOTYÖPAIKAT */}
            {activeTab === "hidden-jobs" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Piilotyöpaikan Kartoittaja</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Yli 70% paikoista ei tule koskaan julkiseen hakuun. Anna tekoälyn laatia avoin hakemus suoraan yrityksen päättäjälle.</p>
                
                <div className={`mb-10 p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
                  <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>
                    <span>💡</span> Miten lähestyä päättäjiä?
                  </h3>
                  <p className={`leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Älä lähetä viestiä "info@yritys.fi" sähköpostiin. Etsi LinkedInistä yrityksen toimitusjohtaja (pienet yritykset) tai osaston vetäjä (isot yritykset). Lähetä tekoälyn generoima viesti suoraan heille yksityisviestinä. Tarjoa heille <strong>ratkaisua heidän ongelmaansa</strong>, älä vain pyydä töitä.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generateHiddenJobApp} className="space-y-6">
                    <div>
                      <label className={LabelClass}>Kohdetoimiala tai yritys</label>
                      <input value={targetIndustry} onChange={e => setTargetIndustry(e.target.value)} placeholder="Esim. Ohjelmistoala tai Wolt" className={InputClass} required />
                    </div>
                    <div>
                      <label className={LabelClass}>Mikä on se yksi ongelma, jonka osaat ratkaista?</label>
                      <textarea value={userCoreSkill} onChange={e => setUserCoreSkill(e.target.value)} placeholder="Esim. Osaan nopeuttaa asiakaspalvelua automaatiolla..." className={`${InputClass} min-h-[120px]`} required />
                    </div>
                    <button type="submit" disabled={isLoadingHidden} className="w-full bg-purple-500 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(168,85,247,0.3)]">
                      {isLoadingHidden ? "Luodaan viestiä..." : "LUO LÄHESTYMISVIESTI"}
                    </button>
                  </form>

                  <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>Valmis viesti kopioitavaksi</p>
                    {hiddenJobResult ? (
                      <div className="space-y-4">
                        <textarea readOnly value={hiddenJobResult} className={`w-full min-h-[300px] bg-transparent outline-none resize-none leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                        <button onClick={() => copyToClipboard(hiddenJobResult)} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-colors">
                          KOPIOI TEKSTI LEIKEPÖYDÄLLE
                        </button>
                      </div>
                    ) : (
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Tekoäly luonnostelee viestin tähän.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SOITTOKÄSIKIRJOITUS */}
            {activeTab === "calling-script" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Puhelun Teleprompteri</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Jännittääkö soittaa? Et ole yksin. Tämä työkalu tekee sinulle askel-askeleelta etenevän käsikirjoituksen, jonka voit lukea suoraan puhelun aikana.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generateCallScript} className="space-y-6">
                    <div>
                      <label className={LabelClass}>Kohdeyritys</label>
                      <input value={callCompany} onChange={e => setCallCompany(e.target.value)} placeholder="Esim. Kone Keskus Oy" className={InputClass} required />
                    </div>
                    <div>
                      <label className={LabelClass}>Mihin rooliin haet?</label>
                      <input value={callRole} onChange={e => setCallRole(e.target.value)} placeholder="Esim. Projektipäällikkö" className={InputClass} required />
                    </div>
                    <button type="submit" disabled={isLoadingCall} className="w-full bg-indigo-500 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(99,102,241,0.3)]">
                      {isLoadingCall ? "Laaditaan skriptiä..." : "LUO KÄSIKIRJOITUS"}
                    </button>
                  </form>

                  <div className={`relative p-6 sm:p-8 rounded-[32px] border-4 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-gray-100 border-gray-300'}`}>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-gray-500/50"></div>
                    <p className={`text-xs font-bold uppercase text-center tracking-widest mt-2 mb-6 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>Puhelimen näkymä</p>
                    {callScriptResult ? (
                      <div className="space-y-4">
                        <textarea readOnly value={callScriptResult} className={`w-full min-h-[350px] bg-transparent outline-none resize-none leading-relaxed text-base sm:text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                      </div>
                    ) : (
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Käsikirjoitus ilmestyy tähän puhelimen näytölle luettavaksi.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* URAVAIHTAJAN KOMPASSI */}
            {activeTab === "career-pivot" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Uravaihtajan Kompassi</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Haluatko vaihtaa alaa, mutta tuntuu että aloitat nollasta? Tekoäly etsii vanhasta kokemuksestasi piilevät taidot ja kääntää ne uuden alan vaatimalle kielelle.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generatePivotPlan} className="space-y-6">
                    <div>
                      <label className={LabelClass}>Nykyinen / Vanha ammattisi</label>
                      <input value={oldJob} onChange={e => setOldJob(e.target.value)} placeholder="Esim. Sairaanhoitaja" className={InputClass} required />
                    </div>
                    <div>
                      <label className={LabelClass}>Mihin työhön haluat siirtyä?</label>
                      <input value={newJob} onChange={e => setNewJob(e.target.value)} placeholder="Esim. Asiakaspalvelupäällikkö tai Koodari" className={InputClass} required />
                    </div>
                    <button type="submit" disabled={isLoadingPivot} className="w-full bg-emerald-500 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(16,185,129,0.3)]">
                      {isLoadingPivot ? "Analysoidaan taitoja..." : "NÄYTÄ REITTI UUDELLE ALALLE"}
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
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Tekoäly rakentaa reitin tähän.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PUNAISEN LIPUN KÄÄNTÄJÄ */}
            {activeTab === "red-flag" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Haastattelun Pelastusrengas</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Pelkäätkö jotain tiettyä kysymystä haastattelussa? Anna tekoälyn kääntää "heikkoutesi" tai huono historiasi vakuuttavaksi vahvuudeksi.</p>
                
                <div className={`mb-10 p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                  <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>
                    <span>💡</span> Miten vastata vaikeisiin kysymyksiin?
                  </h3>
                  <p className={`leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Rekrytoija ei etsi täydellistä ihmistä, vaan ihmistä joka pystyy myöntämään virheensä ja <strong>oppimaan niistä</strong>. Jos sinut erotettiin tai olet ollut pitkään työttömänä, älä selittele tai syytä muita. Ota vastuu, kerro mitä opit, ja käännä keskustelu siihen, miksi olet nyt vahvempi työntekijä.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generateRedFlag} className="space-y-6">
                    <div>
                      <label className={LabelClass}>Mikä on CV:si tai taustasi suurin heikkous/ongelma?</label>
                      <textarea value={redFlagIssue} onChange={e => setRedFlagIssue(e.target.value)} placeholder="Esim. Sain potkut edellisestä työstä koska en saavuttanut myyntitavoitteita... TAI Olin vuoden työttömänä mielenterveysongelmien takia..." className={`${InputClass} min-h-[140px]`} required />
                    </div>
                    <button type="submit" disabled={isLoadingRedFlag} className="w-full bg-red-500 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(239,68,68,0.3)]">
                      {isLoadingRedFlag ? "Luodaan pelastusta..." : "KÄÄNNÄ POSITIIVISEKSI"}
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
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Tekoäly muotoilee vastauksen tähän.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUOSITTELIJA-AUTOMAATTI */}
            {activeTab === "reference" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Suosittelija-automaatti</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Toisen ihmisen antama suositus on työnhaun tehokkain työkalu. Anna tekoälyn laatia kohtelias viesti, jolla pyydät entistä pomoa tai kollegaa suosittelijaksi.</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generateReference} className="space-y-6">
                    <div>
                      <label className={LabelClass}>Entisen pomon tai kollegan etunimi</label>
                      <input value={refPersonName} onChange={e => setRefPersonName(e.target.value)} placeholder="Esim. Sari" className={InputClass} required />
                    </div>
                    <div>
                      <label className={LabelClass}>Mitä taitoa haluaisit hänen korostavan?</label>
                      <input value={refSkill} onChange={e => setRefSkill(e.target.value)} placeholder="Esim. Kykyäni johtaa projekteja tiukoissa aikatauluissa" className={InputClass} required />
                    </div>
                    <button type="submit" disabled={isLoadingRef} className="w-full bg-amber-500 text-black font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(245,158,11,0.3)]">
                      {isLoadingRef ? "Kirjoitetaan viestiä..." : "LAADI PYYNTÖVIESTI"}
                    </button>
                  </form>

                  <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>Viestiluonnos (Sähköposti / LinkedIn)</p>
                    {refResult ? (
                      <div className="space-y-4">
                        <textarea readOnly value={refResult} className={`w-full min-h-[300px] bg-transparent outline-none resize-none leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                        <button onClick={() => copyToClipboard(refResult)} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-colors">
                          KOPIOI VIESTI
                        </button>
                      </div>
                    ) : (
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Täytä tiedot ja paina nappia.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PALKKANEUVOTTELIJA */}
            {activeTab === "salary-negotiation" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-2xl sm:text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Asiantuntijan Palkkaneuvottelija</h2>
                <p className={`text-base sm:text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Työnantajat odottavat sinun neuvottelevan. Anna tekoälyn muotoilla täydellisen asiallinen, mutta jämäkkä vastatarjous.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <form onSubmit={generateSalaryCounter} className="space-y-6">
                    <div>
                      <label className={LabelClass}>Mitä he tarjosivat? (€/kk)</label>
                      <input type="number" value={offeredSalary} onChange={e => setOfferedSalary(e.target.value)} placeholder="Esim. 2800" className={InputClass} required />
                    </div>
                    <div>
                      <label className={LabelClass}>Mikä on oma tavoitteesi? (€/kk)</label>
                      <input type="number" value={targetSalary} onChange={e => setTargetSalary(e.target.value)} placeholder="Esim. 3200" className={InputClass} required />
                    </div>
                    <button type="submit" disabled={isLoadingSalary} className="w-full bg-[#00BFA6] text-black font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(0,191,166,0.3)]">
                      {isLoadingSalary ? "Lasketaan vastatarjousta..." : "LAADI VASTATARJOUS"}
                    </button>
                  </form>

                  <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-[#00BFA6]' : 'text-teal-700'}`}>Valmis vastaus sähköpostiin</p>
                    {salaryResult ? (
                      <div className="space-y-4">
                        <textarea readOnly value={salaryResult} className={`w-full min-h-[300px] bg-transparent outline-none resize-none leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                        <button onClick={() => copyToClipboard(salaryResult)} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-colors">
                          KOPIOI TEKSTI
                        </button>
                      </div>
                    ) : (
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Syötä luvut, niin teemme tarjouksen.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* TOAST MESSAGE */}
        {message && (
          <div className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 z-50 rounded-[28px] border-2 border-green-500 bg-green-500/95 p-5 sm:p-6 text-base sm:text-lg font-black text-black shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5">
            {message}
          </div>
        )}
      </main>
    </div>
  );
}
