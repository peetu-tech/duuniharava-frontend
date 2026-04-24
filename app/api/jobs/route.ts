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
