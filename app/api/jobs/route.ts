import { NextResponse } from "next/server";
import OpenAI from "openai";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

// TÄMÄ ON KRIITTINEN LISÄYS: Pidentää Vercelin aikarajaa, jotta tekoäly ehtii vastata ennen aikakatkaisua!
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const proxyAgent = process.env.FIXIE_URL 
  ? new HttpsProxyAgent(process.env.FIXIE_URL) 
  : undefined;

const TYOMARKKINATORI_URL = "https://api.ahtp.fi/kipa/p67/v2/jobpostings";

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI avain puuttuu." }, { status: 500 });
    }

    const body = await req.json();
    const searchTerms = [body.targetJob, body.desiredRoles, body.keywords].filter(Boolean).join(" ");
    
    let rawJobs: any[] = [];
    const tmKey = process.env.TYOMARKKINATORI_API_KEY;

    // ==========================================================
    // VAIHE 1: HAKU TYÖMARKKINATORILTA
    // ==========================================================
    if (tmKey) {
      try {
        console.log("🔍 Haetaan Työmarkkinatorilta...");
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 14);

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

          // 15 paikkaa on AI:lle tarpeeksi ja säästää prosessointiaikaa valtavasti
          rawJobs = allParsedJobs.slice(0, 15);
          console.log(`✅ Työmarkkinatorilta lähetetään ${rawJobs.length} paikkaa AI:lle.`);
        } else {
          console.error("❌ Työmarkkinatori API virhe:", tmResponse.status);
        }
      } catch (e) {
        console.error("❌ Virhe Työmarkkinatorin haussa:", e);
      }
    }

    let aiPrompt = "";
    let isFallback = false;

    // ==========================================
    // VAIHE 2: RIKASTETAAN TAI GENEROIDAAN
    // ==========================================
    if (rawJobs.length > 0) {
      const jobsForAI = rawJobs.map((job: any) => {
        // TÄMÄ ON SE KORJAUS: Turvallinen tekstien purku (Estää .substring virheen)
        const titleRaw = job.position?.title?.FI || job.position?.title || "Avoin työpaikka";
        const title = typeof titleRaw === 'string' ? titleRaw : "Avoin työpaikka";

        const companyRaw = job.client?.company?.FI || job.client?.company || job.owner?.company?.FI || job.owner?.company || "Tuntematon yritys";
        const company = typeof companyRaw === 'string' ? companyRaw : "Tuntematon yritys";

        const descRaw = job.position?.jobDescription?.FI || job.position?.jobDescription || "";
        // Tarkistetaan, että kuvaus on OIKESTI string ennen kuin käytetään .substring()
        const description = typeof descRaw === 'string' ? descRaw.substring(0, 600) : "";

        return {
          id: job.metadata?.externalId || job.id || Math.random().toString(36).substr(2, 9),
          title,
          company,
          location: job.location?.workplacePostOffice || job.location?.municipalities?.[0] || "Suomi",
          description,
          url: job.application?.url?.FI || job.application?.url || `https://tyomarkkinatori.fi/henkiloasiakkaat/tyopaikat/${job.metadata?.externalId || job.id}`,
          deadline: job.application?.expires || ""
        };
      });

      aiPrompt = `
Olet rekrytointikonsultti. Tässä on hakijan profiili:
- Etsii töitä: ${searchTerms}
- Alue: ${body.desiredLocation || 'Suomi'}

Tässä on lista aitoja työpaikkoja (JSON):
${JSON.stringify(jobsForAI)}

Valitse listasta 3-5 parhaiten hakijalle sopivaa työpaikkaa. Palauta VAIN JSON-objekti avaimella "jobs", jossa on nämä kentät:
{
  "jobs": [
    {
      "title": "Sama kuin syötteessä",
      "company": "Sama kuin syötteessä",
      "location": "Sama kuin syötteessä",
      "type": "Kokoaikainen tai Osa-aikainen",
      "summary": "Myyvä 2 lauseen tiivistelmä",
      "adText": "Alkuperäinen kuvaus siistittynä",
      "url": "Sama kuin syötteessä",
      "whyFit": "Miksi hakija sopii tähän",
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
      aiPrompt = `
Työmarkkinatorilta ei saatu juuri nyt dataa haulle. Luo 4 simuloitua avointa työpaikkaa:
- Toive: ${searchTerms || body.desiredRoles || body.targetJob || 'Avoimet työpaikat'}
- Alue: ${body.desiredLocation || 'Suomi'}

Palauta TÄSMÄLLEEN tämä JSON-rakenne avaimella "jobs":
{
  "jobs": [
    {
      "title": "Ammattinimike",
      "company": "Keksitty Yritys Oy",
      "location": "Kaupunki",
      "type": "Kokoaikainen",
      "summary": "Myyvä tiivistelmä",
      "adText": "Työpaikkailmoituksen teksti",
      "url": "https://tyomarkkinatori.fi/",
      "whyFit": "Miksi hakija sopii",
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
