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
      return NextResponse.json({ error: "OpenAI avain puuttuu." }, { status: 500 });
    }

    const body = await req.json();
    const searchTerms = [body.targetJob, body.desiredRoles, body.keywords].filter(Boolean).join(" ");
    
    let rawJobs: any[] = [];

    // ==========================================================
    // VAIHE 1: HAKU TYÖMARKKINATORIN TUOTANTO-APIsta (YAML-määrittelyn mukaisesti)
    // ==========================================================
    const tmKey = process.env.TYOMARKKINATORI_API_KEY;

    if (tmKey) {
      try {
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 5); // Haetaan max 5 pv vanhat

        const payload = {
          onlyStatus: "PUBLISHED",
          created: {
            from: recentDate.toISOString()
          }
        };

        // Kutsutaan Työmarkkinatoria käyttäen proxyä, jos se on asennettu
        const tmResponse = await fetch(TYOMARKKINATORI_URL, {
          method: "POST",
          agent: proxyAgent as any, // Tästä KEHA näkee sinun staattisen IP-osoitteesi!
          headers: {
            "KIPA-Subscription-Key": tmKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload)
        });

        if (tmResponse.ok) {
          const textData = await tmResponse.text();
          
          // PARSITAAN NDJSON
          const allParsedJobs = textData
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => {
              try { return JSON.parse(line); } catch (e) { return null; }
            })
            .filter(Boolean);

          // Otetaan 60 tuoreinta AI:ta varten
          rawJobs = allParsedJobs.slice(0, 60);
        } else {
          console.error("Työmarkkinatori API virhe:", tmResponse.status, await tmResponse.text());
        }
      } catch (e) {
        console.error("Virhe aitojen työpaikkojen haussa:", e);
      }
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
Olet rekrytointikonsultti. Tässä on käyttäjän profiili ja toiveet:
- Etsii töitä: ${searchTerms}
- Alue: ${body.desiredLocation || 'Suomi'}
- Kokemus: ${body.experience || 'Ei määritelty'}
- Taidot: ${body.skills || 'Ei määritelty'}

Tässä on lista AITOJA ja TUOREITA avoimia työpaikkoja Suomesta (JSON):
${JSON.stringify(jobsForAI)}

TEHTÄVÄSI:
Valitse listasta 2-5 työpaikkaa, jotka sopivat parhaiten käyttäjän toiveisiin (erityisesti sijainti ja ala).
Palauta JSON-objekti avaimella "jobs", jossa valitut työpaikat on rikastettu näin:
{
  "jobs": [
    {
      "title": "Sama kuin syötteessä",
      "company": "Sama kuin syötteessä",
      "location": "Sama kuin syötteessä",
      "type": "Kokoaikainen/Osa-aikainen (päättele kuvauksesta)",
      "summary": "Myyvä 2 lauseen tiivistelmä miksi tämä kiinnostaisi hakijaa",
      "adText": "Alkuperäinen kuvaus tiivistettynä",
      "url": "Sama kuin syötteessä",
      "whyFit": "Miksi tämä hakija sopii tähän paikkaan (hyödynnä profiilia)?",
      "source": "Työmarkkinatori",
      "matchScore": Numero 50-99 (arvioi osumatarkkuus),
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
Työmarkkinatorilta ei saatu juuri nyt dataa haulle: "${searchTerms}".
Luo hakijalle 4 realistista simuloitua työpaikkaa Suomesta hänen toiveidensa perusteella:
- Toive: ${body.desiredRoles || body.targetJob}
- Alue: ${body.desiredLocation || 'Suomi'}

Palauta VAIN JSON-objekti avaimella "jobs". Muotoile se Duuniharavan käyttöliittymään sopivaksi.`;
    }

    // ==========================================
    // VAIHE 3: OPENAI KUTSU
    // ==========================================
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Olet rekrytoinnin asiantuntija. Palautat vain validia JSON-dataa." },
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
      }
    } catch (e) {
      console.error("JSON parse error from AI:", e);
    }

    return NextResponse.json({ output: finalOutput });

  } catch (error: any) {
    console.error("Jobs route error:", error);
    return NextResponse.json({ error: "Työpaikkojen haku epäonnistui." }, { status: 500 });
  }
}
