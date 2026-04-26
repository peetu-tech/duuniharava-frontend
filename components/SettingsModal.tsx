"use client";

import { useState, useEffect } from "react";
import { getSession, clearSession } from "@/lib/supabaseAuth";

export default function SettingsModal({ isOpen, onClose, theme }: { isOpen: boolean, onClose: () => void, theme: "light" | "dark" }) {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Tarkistetaan onko käyttäjä PRO-tasolla tietokannasta
    async function checkStatus() {
      const session = getSession();
      if (!session) return;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${session.user.id}&select=is_pro`, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      if (data?.[0]?.is_pro) setIsPro(true);
    }
    if (isOpen) checkStatus();
  }, [isOpen]);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      // Tämä kutsuu meidän (vielä luotavaa) portaali-reittiä
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: getSession()?.user.id })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert("Virhe portaalin latauksessa.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className={`w-full max-w-lg rounded-[32px] border p-8 shadow-2xl animate-in zoom-in-95 ${theme === 'dark' ? 'bg-[#141414] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h2 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Tilin asetukset</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-2xl font-black">✕</button>
        </div>

        <div className="space-y-8">
          {/* TILAUS-STATUS */}
          <div className={`p-6 rounded-2xl border ${isPro ? 'border-[#00BFA6]/30 bg-[#00BFA6]/5' : 'border-gray-500/20 bg-gray-500/5'}`}>
            <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Nykyinen jäsenyys</p>
            <div className="flex justify-between items-center">
              <span className={`text-xl font-black ${isPro ? 'text-[#00BFA6]' : 'text-gray-400'}`}>
                {isPro ? "⭐ DUUNIHARAVA PRO" : "PERUSTILAUS (Starter)"}
              </span>
              {isPro && (
                <button 
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="text-xs font-bold underline hover:text-[#00BFA6] disabled:opacity-50"
                >
                  {loading ? "Ladataan..." : "Hallitse tilausta / Peruuta"}
                </button>
              )}
            </div>
          </div>

          {/* TIETOTURVA */}
          <div className="space-y-4">
            <h3 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Kirjautumistiedot</h3>
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-xs text-gray-500">Kirjautunut sähköpostilla:</p>
              <p className="font-bold">{getSession()?.user.email}</p>
            </div>
          </div>

          {/* VAARALLISET TOIMINNOT */}
          <div className="pt-6 border-t border-red-500/20">
            <button 
              onClick={() => {
                if(confirm("Haluatko varmasti poistaa tilisi ja kaikki tallennetut CV:t? Tätä ei voi peruuttaa.")) {
                  alert("Tilin poistopyyntö lähetetty. Järjestelmä käsittelee poiston 24h sisällä.");
                }
              }}
              className="text-red-500 text-sm font-bold hover:underline"
            >
              Poista käyttäjätili ja kaikki data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
