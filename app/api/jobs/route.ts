import { NextResponse } from "next/server";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const proxyAgent = process.env.FIXIE_URL 
  ? new HttpsProxyAgent(process.env.FIXIE_URL) 
  : undefined;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI avain puuttuu." }, { status: 500 });
    }

    const body = await req.json();
    const searchTerms = [body.targetJob, body.desiredRoles, body.keywords].filter(Boolean).join(" ");
    const locationTerm = body.desiredLocation || "";

    let rawJobs: any[] = [];

    // ==========================================
    // VAIHE 1: KOKEILLAAN HAKEA KEHASTA (JOS AVAIN ON)
    // ==========================================
    if (process.env.KIPA_SUBSCRIPTION_KEY) {
      try {
        const baseUrl = 'https://api-qa.ahtp.fi/v1/job-postings';
        const url = new URL(baseUrl);
        if (searchTerms) url.searchParams.append('q', searchTerms);
        if (locationTerm) url.searchParams.append('location', locationTerm);
        url.searchParams.append('limit', '5');

        const kehaResponse = await fetch(url.toString(), {
          method: "GET",
          agent: proxyAgent as any,
          headers: {
            "KIPA-Subscription-Key": process.env.KIPA_SUBSCRIPTION_KEY,
            "Content-Type": "application/json",
          }
        });

        if (kehaResponse.ok) {
          const kehaData = await kehaResponse.json() as any;
          // Haetaan fiksusti riippumatta siitä, missä taulukossa KEHA sen palauttaa
          rawJobs = Array.isArray(kehaData) ? kehaData : (kehaData.items || kehaData.results || kehaData.postings || []);
        }
      } catch (e) {
        console.log("Virhe KEHA-haussa, siirrytään varajärjestelmään.", e);
      }
    }

    let aiPrompt = "";
    let isFallback = false;

    // ==========================================
    // VAIHE 2: VALITAAN RIKASTETAANKO VAI GENEROIDAANKO
    // ==========================================
    if (rawJobs.length > 0) {
      // A: KEHA PALAUTTI OIKEITA TÖITÄ -> RIKASTETAAN NE TEKOÄLYLLÄ
      const jobsForAI = rawJobs.map((job: any) => ({
        id: job.id,
        title: job.title || "Tuntematon",
        company: job.employerName || "Tuntematon",
        location: job.municipalities?.[0]?.name || "Suomi",
        description: job.description ? job.description.substring(0, 800) : "",
        url: job.externalUrl || `https://tyomarkkinatori.fi/henkiloasiakkaat/tyopaikat/${job.id}`,
        deadline: job.applicationEndDate || "",
      }));

      aiPrompt = `
Olet rekrytointikonsultti. Tässä on käyttäjän profiilin tiivistelmä:
- Kokemus: ${body.experience || 'Ei määritelty'}
- Taidot: ${body.skills || 'Ei määritelty'}
- Koulutus: ${body.education || 'Ei määritelty'}

Ja tässä on lista AITOJA avoimia työpaikkoja (JSON):
${JSON.stringify(jobsForAI)}

Lue nämä läpi ja palauta JSON-objekti avaimella "jobs", joka sisältää tismalleen samat työpaikat, mutta rikastettuna näillä kentillä:
{
  "title": "Sama kuin syötteessä",
  "company": "Sama kuin syötteessä",
  "location": "Sama kuin syötteessä",
  "type": "Kokoaikainen/Osa-aikainen",
  "summary": "Myyvä 2 lauseen tiivistelmä hakijalle",
  "adText": "Ilmoituksen alkuperäinen teksti tiivistettynä (väh 3 lausetta)",
  "url": "Sama kuin syötteessä",
  "whyFit": "Miksi tämä hakija sopii tähän paikkaan (henkilökohtainen perustelu)?",
  "source": "Työmarkkinatori",
  "matchScore": Numero 50-99 (Kuinka hyvin taidot osuvat),
  "status": "interested",
  "priority": "high",
  "salary": "Sopimuksen mukaan",
  "deadline": "Sama kuin syötteessä",
  "notes": "",
  "contactPerson": "Katso ilmoitus",
  "contactEmail": "",
  "companyWebsite": ""
}`;
    } else {
      // B: KEHA OLI TYHJÄ -> GENEROIDAAN SIMULOIDUT TYÖPAIKAT (Varajärjestelmä)
      isFallback = true;
      const today = new Date();
      const d1 = new Date(today); d1.setDate(d1.getDate() + 5);
      const d2 = new Date(today); d2.setDate(d2.getDate() + 20);
      
      aiPrompt = `
Olet rekrytointikonsultti. Työmarkkinatorin rajapinnasta ei juuri nyt löytynyt hakijan täydellisesti vastaavia osumia.
Luo hakijalle 4 erittäin realistista simuloitua työpaikkaa Suomesta hänen tietojensa perusteella.
- Toive: ${body.desiredRoles || body.targetJob || 'Avoimet työpaikat'}
- Alue: ${body.desiredLocation || 'Suomi'}
- Taidot: ${body.skills || 'Ei määritelty'}

Aseta 'deadline' päivämäärien ${d1.toLocaleDateString("fi-FI")} - ${d2.toLocaleDateString("fi-FI")} välille (muoto YYYY-MM-DD).
Palauta VAIN JSON-objekti avaimella "jobs", jossa taulukko työpaikkoja:
{
  "title": "Ammattinimike",
  "company": "Realistinen keksitty yritys",
  "location": "Kaupunki",
  "type": "Kokoaikainen",
  "summary": "Lyhyt myyvä tiivistelmä",
  "adText": "Pitkä ja aito työpaikkailmoituksen teksti",
  "url": "https://duunitori.fi/tyopaikat/simuloitu",
  "whyFit": "Miksi hakija sopii tähän tiimiin",
  "source": "AI-Simulaatio (Ei aitoa dataa saatavilla)",
  "matchScore": Numero 70-99,
  "status": "interested",
  "priority": "medium",
  "salary": "Esim. 2500 - 3500 €/kk",
  "deadline": "YYYY-MM-DD",
  "notes": "",
  "contactPerson": "Matti Rekry",
  "contactEmail": "",
  "companyWebsite": ""
}`;
    }

    // ==========================================
    // VAIHE 3: OPENAI KUTSU
    // ==========================================
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o", 
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Olet apuri, joka palauttaa vain validia JSON-dataa." },
        { role: "user", content: aiPrompt }
      ],
      temperature: isFallback ? 0.6 : 0.3, // Luovempi jos simuloidaan, tiukempi jos rikastetaan aitoa
    });
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
        // Lasketaan päivämäärä 5 päivää sitten, jotta emme lataa kymmeniä tuhansia vanhoja työpaikkoja
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 5);

        // YAML-skeeman mukainen FiltersV2 payload
        const payload = {
          onlyStatus: "PUBLISHED",
          created: {
            from: recentDate.toISOString() // Haetaan vain tuoreet ilmoitukset!
          }
        };

        const tmResponse = await fetch(TYOMARKKINATORI_URL, {
          method: "POST",
          headers: {
            "KIPA-Subscription-Key": tmKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload)
        });

        if (tmResponse.ok) {
          const textData = await tmResponse.text();
          
          // PARSITAAN NDJSON: Työmarkkinatori palauttaa kohteet rivivaihdolla erotettuina.
          // Rajoitetaan määrä max 50:een, jotta OpenAI:n prompti ei kasva liian isoksi
          const allParsedJobs = textData
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => {
              try {
                return JSON.parse(line);
              } catch (e) {
                return null;
              }
            })
            .filter(Boolean);

          // Otetaan esimerkiksi 60 tuoreinta
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
      // Muunnetaan YAML-skeeman (JobPostingV2) mukainen data AI-ystävälliseen muotoon
      const jobsForAI = rawJobs.map((job: any) => ({
        id: job.metadata?.externalId || job.id || Math.random().toString(36).substr(2, 9),
        // YAML-skeemassa monet tekstit voivat olla lokalisointiobjekteja (esim. { FI: "Otsikko", EN: "Title" })
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
Valitse listasta 2-5 työpaikkaa, jotka sopivat parhaiten käyttäjän toiveisiin (erityisesti sijainti ja ala). Jos täydellisiä osumia ei ole, valitse lähimpänä olevat tuoreet paikat.
Palauta JSON-objekti avaimella "jobs", jossa valitut työpaikat on rikastettu näin:
{
  "jobs": [
    {
      "title": "Sama kuin syötteessä",
      "company": "Sama kuin syötteessä",
      "location": "Sama kuin syötteessä",
      "type": "Kokoaikainen/Osa-aikainen (päättele kuvauksesta)",
      "summary": "Myyvä 2 lauseen tiivistelmä miksi tämä kiinnostaisi hakijaa",
      "adText": "Alkuperäinen kuvaus tiivistettynä muttei liian lyhyesti",
      "url": "Sama kuin syötteessä",
      "whyFit": "Miksi tämä hakija sopii tähän paikkaan (hyödynnä profiilia)?",
      "source": "Työmarkkinatori",
      "matchScore": Numero 50-99 (arvioi osumatarkkuus),
      "status": "interested",
      "priority": "medium",
      "salary": "Sopimuksen mukaan (tai lue kuvauksesta)",
      "deadline": "Sama kuin syötteessä",
      "notes": ""
    }
  ]
}`;
    } else {
      // VARAJÄRJESTELMÄ: Jos API on alhaalla tai avain puuttuu
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
      temperature: isFallback ? 0.7 : 0.2, // Aitojen suodattamisessa AI saa olla tiukempi (0.2)
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
    return NextResponse.json({ error: "Työpaikkaehdotusten haku epäonnistui." }, { status: 500 });
  }
}
