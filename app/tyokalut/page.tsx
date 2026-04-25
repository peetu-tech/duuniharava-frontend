"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "../../lib/supabaseAuth";

type ToolTab = "hidden-jobs" | "calling-script" | "salary-negotiation";

export default function ExtraToolsPage() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState<ToolTab>("hidden-jobs");

  // Tilamuuttujat työkaluille
  const [companyName, setCompanyName] = useState("");
  const [userCoreSkill, setUserCoreSkill] = useState("");
  const [hiddenJobResult, setHiddenJobResult] = useState("");
  const [isLoadingHidden, setIsLoadingHidden] = useState(false);

  const [callTarget, setCallTarget] = useState("");
  const [callGoal, setCallGoal] = useState("");
  const [callScriptResult, setCallScriptResult] = useState("");
  const [isLoadingCall, setIsLoadingCall] = useState(false);

  const [offeredSalary, setOfferedSalary] = useState("");
  const [targetSalary, setTargetSalary] = useState("");
  const [salaryResult, setSalaryResult] = useState("");
  const [isLoadingSalary, setIsLoadingSalary] = useState(false);

  const [message, setMessage] = useState("");

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

  // --- SIMULOIDUT API-KUTSUT ---
  const generateHiddenJobApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !userCoreSkill) return;
    setIsLoadingHidden(true);
    
    setTimeout(() => {
      setHiddenJobResult(`Hei [Toimitusjohtajan/Rekrytoijan Nimi],\n\nSeuraan ${companyName}n tekemistä mielenkiinnolla. Huomasin, että teillä ei ole tällä hetkellä avoimia hakuja päällä, mutta uskon vakaasti, että tiiminne voisi hyötyä osaamisestani.\n\nYdinosaamistani on ${userCoreSkill}. Olen huomannut, että monilla alan yrityksillä on juuri nyt haasteita [Keksi alan haaste], ja tiedän pystyväni tuomaan tähän ratkaisun heti ensimmäisestä päivästä alkaen.\n\nOlisiko teillä 10 minuuttia aikaa lyhyelle Teams-puhelulle ensi viikon tiistaina tai torstaina? Haluaisin kertoa, miten voisin auttaa ${companyName}a säästämään aikaa ja kasvattamaan tulosta.\n\nYstävällisin terveisin,\n[Nimesi]\n[Puhelinnumero]\n[LinkedIn-profiili]`);
      setIsLoadingHidden(false);
    }, 1800);
  };

  const generateCallScript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callTarget || !callGoal) return;
    setIsLoadingCall(true);

    setTimeout(() => {
      setCallScriptResult(`(Hengitä syvään, hymyile ja soita)\n\n"Hei ${callTarget}, täällä on [Nimesi]. Häiritsenkö pahasti?"\n\n(Jos ei häiritse, jatka:)\n"Hienoa. Soitan siksi, että huomasin teidän hakevan [Rooli] ja laitoinkin jo hakemukseni tulemaan. Minulla on vahva tausta ${callGoal}, ja halusin vain lyhyesti varmistaa, oletteko jo ehtineet käydä hakemuksia läpi?"\n\n(Anna heidän vastata)\n\n"Ymmärrän täysin. Halusin soittaa, koska olen erittäin motivoitunut tästä tehtävästä. Mikä on teidän mielestänne se kaikkein tärkein ominaisuus, jota tähän rooliin etsitte?"\n\n(Kuuntele tarkasti ja vastaa siihen peilaten omaa osaamistasi)`);
      setIsLoadingCall(false);
    }, 1800);
  };

  const generateSalaryCounter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offeredSalary || !targetSalary) return;
    setIsLoadingSalary(true);

    setTimeout(() => {
      setSalaryResult(`Hei, ja kiitos todella paljon tarjouksesta! Olen erittäin innoissani mahdollisuudesta aloittaa tiimissänne.\n\nMitä tulee palkkaan, olin ajatellut tason olevan lähempänä ${targetSalary} euroa, perustuen aiempaan kokemukseeni ja tuomaani lisäarvoon (erityisesti [Lisää tärkein taitosi]).\n\nTarjoamanne ${offeredSalary} € on hyvä alku, mutta olisiko meidän mahdollista tulla hieman vastaan ja lyödä kättä päälle esimerkiksi [Laske tarjouksen ja tavoitteen puoliväli] euron kohdalla? Tällä summalla olisin valmis allekirjoittamaan sopimuksen vaikka heti tänään.\n\nMiltä tämä kuulostaa?`);
      setIsLoadingSalary(false);
    }, 1800);
  };

  if (isAuthChecking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0F0F0F] text-white">
        <p className="text-[#00BFA6] font-black text-2xl animate-pulse uppercase tracking-widest">Ladataan työkaluja...</p>
      </main>
    );
  }

  const InputClass = `w-full rounded-2xl border px-6 py-5 text-base outline-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA6] ${theme === 'dark' ? 'bg-black/50 border-white/10 text-white placeholder:text-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'}`;
  const LabelClass = `mb-3 block text-sm font-bold ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`;

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
      <main className="min-h-screen bg-[#0F0F0F] text-white font-sans pb-20 transition-colors duration-300">
        
        {/* HERO */}
        <section className="border-b border-white/10 bg-gradient-to-b from-zinc-900/50 to-transparent pt-12 pb-16 px-8">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="font-black text-3xl tracking-tighter"><span className="text-[#00BFA6]">DUUNI</span><span className="text-[#FF6F3C]">HARAVA</span></span>
                <div className="bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full text-[10px] font-bold text-purple-400 uppercase tracking-widest">Työkalupakki</div>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black">Työnhakijan <span className="text-purple-500">Salaiset Aseet</span></h1>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => router.push('/studio')} className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-black text-gray-400 hover:bg-white/5 hover:text-white transition-all">
                ← TAKAISIN STUDIOON
              </button>
              <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-black text-gray-400 hover:bg-white/5 hover:text-white transition-all">
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-8 mt-12">
          
          {/* TABS */}
          <div className={`flex overflow-x-auto gap-4 border-b pb-6 mb-12 custom-scrollbar ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
            <button 
              onClick={() => setActiveTab("hidden-jobs")} 
              className={`rounded-2xl px-8 py-4 font-black transition-all whitespace-nowrap ${activeTab === 'hidden-jobs' ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' : (theme === 'dark' ? 'border border-white/10 bg-white/5 text-gray-400' : 'border border-gray-200 bg-gray-50 text-gray-600')}`}
            >
              🕵️ Piilotyöpaikka-tutka
            </button>
            <button 
              onClick={() => setActiveTab("calling-script")} 
              className={`rounded-2xl px-8 py-4 font-black transition-all whitespace-nowrap ${activeTab === 'calling-script' ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : (theme === 'dark' ? 'border border-white/10 bg-white/5 text-gray-400' : 'border border-gray-200 bg-gray-50 text-gray-600')}`}
            >
              📞 Soittokäsikirjoitus
            </button>
            <button 
              onClick={() => setActiveTab("salary-negotiation")} 
              className={`rounded-2xl px-8 py-4 font-black transition-all whitespace-nowrap ${activeTab === 'salary-negotiation' ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' : (theme === 'dark' ? 'border border-white/10 bg-white/5 text-gray-400' : 'border border-gray-200 bg-gray-50 text-gray-600')}`}
            >
              🤝 Palkkaneuvottelija
            </button>
          </div>

          <div className={`rounded-[40px] border p-8 sm:p-12 shadow-2xl backdrop-blur-xl ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
            
            {/* PIILOTYÖPAIKAT */}
            {activeTab === "hidden-jobs" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Luo vastustamaton avoin hakemus</h2>
                <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Piilotyöpaikat ovat yritysten tarpeita, joita ei ole vielä julkaistu avoimeksi hauksi. Ole askeleen edellä.</p>
                
                {/* VINKKIBOKSI */}
                <div className={`mb-10 p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
                  <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>
                    <span>💡</span> Mitä ovat piilotyöpaikat ja miten niitä haetaan?
                  </h3>
                  <p className={`leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Jopa <strong>70–80 % avoimista työpaikoista</strong> ei koskaan päädy julkisiin hakuportaaleihin. Yritykset palkkaavat suositusten, verkostojen tai suorien yhteydenottojen kautta välttääkseen raskaat rekrytointiprosessit. Kun lähetät hyvän avoimen hakemuksen, <strong>et kilpaile satojen muiden kanssa</strong>. <br/><br/>
                    <strong>Näin onnistut:</strong> Etsi yritys, jonka toiminnasta pidät. Selvitä LinkedInistä kuka vetää sinun alaasi (esim. Myyntijohtaja tai CTO) ja lähesty häntä suoraan. Älä pelkästään "kysy töitä", vaan tarjoa heille <em>ratkaisu johonkin heidän ongelmaansa</em>.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <form onSubmit={generateHiddenJobApp} className="space-y-6">
                    <div>
                      <label className={LabelClass}>Yrityksen nimi</label>
                      <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Esim. Supercell" className={InputClass} required />
                    </div>
                    <div>
                      <label className={LabelClass}>Mikä on vahvin taitosi?</label>
                      <textarea value={userCoreSkill} onChange={e => setUserCoreSkill(e.target.value)} placeholder="Esim. B2B-myynti ja prosessien automatisointi..." className={`${InputClass} min-h-[140px]`} required />
                    </div>
                    <button type="submit" disabled={isLoadingHidden} className="w-full bg-purple-500 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(168,85,247,0.3)]">
                      {isLoadingHidden ? "Kirjoitetaan..." : "LUO AVOIN HAKEMUS"}
                    </button>
                  </form>

                  <div className={`p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-sm font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>Generoidun viestin luonnos</p>
                    {hiddenJobResult ? (
                      <div className="space-y-4">
                        <textarea readOnly value={hiddenJobResult} className={`w-full min-h-[300px] bg-transparent outline-none resize-none leading-relaxed ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                        <button onClick={() => copyToClipboard(hiddenJobResult)} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-colors">
                          KOPIOI TEKSTI
                        </button>
                      </div>
                    ) : (
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Täytä tiedot ja paina nappia.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SOITTOKÄSIKIRJOITUS */}
            {activeTab === "calling-script" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className={`text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Erotu massasta soittamalla</h2>
                <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Jännittääkö soittaa rekrytoijalle? Tekoäly rakentaa sinulle luonnollisen hissipuheen, jonka voit lukea suoraan paperista.</p>
                
                {/* VINKKIBOKSI */}
                <div className={`mb-10 p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                  <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-700'}`}>
                    <span>💡</span> Miksi rekrytoijalle soittaminen kannattaa?
                  </h3>
                  <p className={`leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Soittaminen on nopein tapa erottua paperipinosta ja muuttua kasvottomasta hakijasta aidoksi ihmiseksi. Hyvä puhelu jättää rekrytoijalle positiivisen muistijäljen, ja usein he kaivavat hakemuksesi esiin heti puhelun jälkeen.<br/><br/>
                    <strong>Muista tämä:</strong> Älä soita vain kysyäksesi "tuliko hakemus perille" tai "mitä prosessissa tapahtuu seuraavaksi". Soita silloin, kun sinulla on <em>aito, fiksusti mietitty kysymys</em> itse työtehtävästä. Tämä osoittaa, että olet todella perehtynyt rooliin. Hymyile puhelun aikana – se nimittäin kuuluu äänestä!
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <form onSubmit={generateCallScript} className="space-y-6">
                    <div>
                      <label className={LabelClass}>Kenelle soitat?</label>
                      <input value={callTarget} onChange={e => setCallTarget(e.target.value)} placeholder="Esim. Matti (HR-päällikkö)" className={InputClass} required />
                    </div>
                    <div>
                      <label className={LabelClass}>Mikä on soiton kulma/tavoite?</label>
                      <textarea value={callGoal} onChange={e => setCallGoal(e.target.value)} placeholder="Esim. Haluan kysyä, painottavatko he enemmän koodausta vai asiakaspalvelua..." className={`${InputClass} min-h-[140px]`} required />
                    </div>
                    <button type="submit" disabled={isLoadingCall} className="w-full bg-indigo-500 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(99,102,241,0.3)]">
                      {isLoadingCall ? "Laaditaan skriptiä..." : "TEE SOITTOKÄSIKIRJOITUS"}
                    </button>
                  </form>

                  <div className={`p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-sm font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>Käsikirjoitus puheluun</p>
                    {callScriptResult ? (
                      <div className="space-y-4">
                        <textarea readOnly value={callScriptResult} className={`w-full min-h-[300px] bg-transparent outline-none resize-none leading-relaxed text-lg ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                        <button onClick={() => copyToClipboard(callScriptResult)} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-colors">
                          KOPIOI TEKSTI
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
                <h2 className={`text-3xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Älä jätä rahaa pöydälle</h2>
                <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Saitko tarjouksen, mutta palkka on liian pieni? Tekoäly muotoilee asiallisen mutta jämäkän vastatarjouksen.</p>
                
                {/* VINKKIBOKSI */}
                <div className={`mb-10 p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                  <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
                    <span>💡</span> Palkkaneuvottelun kultaiset säännöt
                  </h3>
                  <p className={`leading-relaxed text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Palkasta neuvotteleminen ei ole ahneutta, se on odotettua ammattimaisuutta. Työnantajat jättävät usein ensimmäiseen tarjoukseensa tarkoituksella hieman neuvotteluvaraa. Jos hyväksyt ensimmäisen tarjouksen suoraan, saatat jättää tuhansia euroja pöydälle vuositasolla.<br/><br/>
                    <strong>Näin onnistut:</strong> Älä koskaan perustele palkkapyyntöäsi omilla elinkustannuksillasi tai asuntolainallasi. Perustele se <em>markkinatasolla ja sillä suoralla arvolla, jonka tuot yritykselle</em>. Aseta vastatarjouksesi hieman todellista tavoitettasi korkeammalle, jotta teillä on tilaa kohdata sujuvasti puolivälissä.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <form onSubmit={generateSalaryCounter} className="space-y-6">
                    <div>
                      <label className={LabelClass}>Mitä he tarjosivat? (€/kk)</label>
                      <input type="number" value={offeredSalary} onChange={e => setOfferedSalary(e.target.value)} placeholder="Esim. 2800" className={InputClass} required />
                    </div>
                    <div>
                      <label className={LabelClass}>Mikä on oma tavoitteesi? (€/kk)</label>
                      <input type="number" value={targetSalary} onChange={e => setTargetSalary(e.target.value)} placeholder="Esim. 3200" className={InputClass} required />
                    </div>
                    <button type="submit" disabled={isLoadingSalary} className="w-full bg-blue-500 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[0_10px_20px_rgba(59,130,246,0.3)]">
                      {isLoadingSalary ? "Lasketaan..." : "LAADI VASTATARJOUS"}
                    </button>
                  </form>

                  <div className={`p-8 rounded-3xl border ${theme === 'dark' ? 'bg-black/50 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-sm font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Ehdotus sähköpostiksi</p>
                    {salaryResult ? (
                      <div className="space-y-4">
                        <textarea readOnly value={salaryResult} className={`w-full min-h-[300px] bg-transparent outline-none resize-none leading-relaxed ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`} />
                        <button onClick={() => copyToClipboard(salaryResult)} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-colors">
                          KOPIOI TEKSTI
                        </button>
                      </div>
                    ) : (
                      <p className={`text-center py-20 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Täytä tiedot ja paina nappia.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* TOAST MESSAGE */}
        {message && (
          <div className="fixed bottom-8 right-8 z-50 rounded-[28px] border-2 border-green-500 bg-green-500/95 p-6 text-lg font-black text-black shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5">
            {message}
          </div>
        )}
      </main>
    </div>
  );
}
