import { NextResponse } from "next/server";
import OpenAI from "openai";
import fetch from "node-fetch"; // Tarvitaan proxyä varten
import { HttpsProxyAgent } from "https-proxy-agent";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Otetaan Fixie-proxy käyttöön (Vercelin vaihtuvan IP:n kiertämiseksi KEHAn suuntaan)
const proxyAgent = process.env.FIXIE_URL 
  ? new HttpsProxyAgent(process.env.FIXIE_URL) 
  : undefined;

const TYOMARKKINATORI_URL = "https://api.ahtp.fi/kipa/p67/v2/jobpostings";

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OpenAI avain puuttuu.");
      return NextResponse.json({ error: "OpenAI avain puuttuu." }, { status: 500 });
    }

    const body = await req.json();
    const searchTerms = [body.targetJob, body.desiredRoles, body.keywords].filter(Boolean).join(" ");
    
    let rawJobs: any[] = [];

    // ==========================================================
    // VAIHE 1: HAKU TYÖMARKKINATORIN TUOTANTO-APIsta
    // ==========================================================
    const tmKey = process.env.TYOMARKKINATORI_API_KEY;

    if (tmKey) {
      try {
        console.log("🔍 Haetaan Työmarkkinatorilta...");
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 14); // Haetaan 14 pv sisällä julkaistut osumien maksimoimiseksi

        const payload = {
          onlyStatus: "PUBLISHED",
          created: {
            from: recentDate.toISOString()
          }
        };

        const tmResponse = await fetch(TYOMARKKINATORI_URL, {
          method: "POST",
          agent: proxyAgent as any,
          headers: {
            "KIPA-Subscription-Key": tmKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload)
        });

        if (tmResponse.ok) {
          const textData = await tmResponse.text();
          const allParsedJobs = textData
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => {
              try { return JSON.parse(line); } catch (e) { return null; }
            })
            .filter(Boolean);

          rawJobs = allParsedJobs.slice(0, 60);
          console.log(`✅ Työmarkkinatorilta löytyi ${allParsedJobs.length} paikkaa, joista ${rawJobs.length} lähetetään tekoälylle perattavaksi.`);
        } else {
          const errText = await tmResponse.text();
          console.error(`❌ Työmarkkinatori API virhe (${tmResponse.status}):`, errText);
        }
      } catch (e) {
        console.error("❌ Virhe aitojen työpaikkojen haussa:", e);
      }
    } else {
      console.warn("⚠️ TYOMARKKINATORI_API_KEY puuttuu .env tiedostosta. Käytetään vain tekoälysimulaatiota.");
    }

    let aiPrompt = "";
    let isFallback = false;

    // ==========================================
    // VAIHE 2: RIKASTETAAN TAI GENEROIDAAN
    // ==========================================
    if (rawJobs.length > 0) {
      const jobsForAI = rawJobs.map((job: any) => ({
        id: job.metadata?.externalId || job.id || Math.random().toString(36).substr(2, 9),
        title: job.position?.title?.FI || job.position?.title || "Avoin työpaikka",
        company: job.client?.company?.FI || job.client?.company || job.owner?.company?.FI || job.owner?.company || "Yritys",
        location: job.location?.workplacePostOffice || job.location?.municipalities?.[0] || "Suomi",
        description: (job.position?.jobDescription?.FI || job.position?.jobDescription || "").substring(0, 600),
        url: job.application?.url?.FI || job.application?.url || `https://tyomarkkinatori.fi/henkiloasiakkaat/tyopaikat/${job.metadata?.externalId || job.id}`,
        deadline: job.application?.expires || ""
      }));

      aiPrompt = `
Olet rekrytointikonsultti. Tässä on hakijan profiili:
- Etsii töitä: ${searchTerms}
- Alue: ${body.desiredLocation || 'Suomi'}
- Kokemus: ${body.experience || 'Ei määritelty'}

Tässä on lista AITOJA ja TUOREITA avoimia työpaikkoja (JSON):
${JSON.stringify(jobsForAI)}

Valitse listasta 3-5 työpaikkaa, jotka sopivat parhaiten hakijalle. Palauta VAIN JSON-objekti avaimella "jobs", jossa valitut työpaikat on tässä muodossa:
{
  "jobs": [
    {
      "title": "Sama kuin syötteessä",
      "company": "Sama kuin syötteessä",
      "location": "Sama kuin syötteessä",
      "type": "Kokoaikainen tai Osa-aikainen",
      "summary": "Myyvä 2 lauseen tiivistelmä tehtävästä",
      "adText": "Alkuperäinen kuvaus siistittynä",
      "url": "Sama kuin syötteessä",
      "whyFit": "Miksi hakija sopii tähän paikkaan (henkilökohtainen arvio)",
      "source": "Työmarkkinatori",
      "matchScore": 85,
      "status": "interested",
      "priority": "medium",
      "salary": "Sopimuksen mukaan",
      "deadline": "Sama kuin syötteessä",
      "notes": ""
    }
  ]
}`;
    } else {
      isFallback = true;
      console.log("⚠️ Aitoja työpaikkoja ei saatu. Siirrytään tekoälysimulaatioon (Fallback).");
      aiPrompt = `
Työmarkkinatorilta ei saatu juuri nyt dataa haulle.
Luo hakijalle 4 realistista simuloitua avointa työpaikkaa Suomesta hänen toiveidensa perusteella:
- Toive: ${searchTerms || body.desiredRoles || body.targetJob || 'Avoimet työpaikat'}
- Alue: ${body.desiredLocation || 'Suomi'}

Palauta VAIN TÄSMÄLLEEN tämä JSON-rakenne avaimella "jobs" täytettynä:
{
  "jobs": [
    {
      "title": "Ammattinimike",
      "company": "Realistinen keksitty yritys Oy",
      "location": "Kaupunki",
      "type": "Kokoaikainen",
      "summary": "Lyhyt myyvä tiivistelmä",
      "adText": "Pitkä ja aito työpaikkailmoituksen teksti",
      "url": "https://tyomarkkinatori.fi/simuloitu",
      "whyFit": "Miksi hakija sopii tähän",
      "source": "Tekoäly-simulaatio",
      "matchScore": 90,
      "status": "interested",
      "priority": "medium",
      "salary": "Esim. 2500-3500 €/kk",
      "deadline": "2024-12-31",
      "notes": ""
    }
  ]
}`;
    }

    // ==========================================
    // VAIHE 3: OPENAI KUTSU
    // ==========================================
    console.log("🧠 Pyydetään OpenAI:ta muodostamaan vastaus...");
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Olet apuri, joka palauttaa vain validia JSON-dataa." },
        { role: "user", content: aiPrompt }
      ],
      temperature: isFallback ? 0.7 : 0.2,
    });

    const rawOutput = aiResponse.choices[0]?.message?.content?.trim() || '{"jobs": []}';
    let finalOutput = "[]";
    try {
      const parsed = JSON.parse(rawOutput);
      if (parsed.jobs && Array.isArray(parsed.jobs)) {
        finalOutput = JSON.stringify(parsed.jobs);
        console.log(`✅ OpenAI palautti ${parsed.jobs.length} valmista työpaikkaa.`);
      }
    } catch (e) {
      console.error("❌ JSON parse error from AI:", e);
    }

    return NextResponse.json({ output: finalOutput });

  } catch (error: any) {
    console.error("❌ Jobs route error:", error);
    return NextResponse.json({ error: "Työpaikkojen haku epäonnistui." }, { status: 500 });
  }
}
