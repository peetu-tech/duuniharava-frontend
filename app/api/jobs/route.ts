import { NextResponse } from "next/server";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import OpenAI from "openai";

// 1. Alustetaan palvelut ympäristömuuttujista
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Reititin Fixien kautta (välttämätön KEHA:n palomuurin takia)
const proxyAgent = process.env.FIXIE_URL 
  ? new HttpsProxyAgent(process.env.FIXIE_URL) 
  : undefined;

export async function POST(req: Request) {
  try {
    // Tarkistetaan, että kaikki avaimet löytyvät
    if (!process.env.OPENAI_API_KEY || !process.env.KIPA_SUBSCRIPTION_KEY) {
      return NextResponse.json(
        { error: "Palvelimen avaimet (OpenAI tai KEHA) puuttuvat." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const searchTerms = [body.targetJob, body.desiredRoles, body.keywords].filter(Boolean).join(" ");
    const locationTerm = body.desiredLocation || "";

    // ==========================================
    // VAIHE 1: HAE AIDOT TYÖPAIKAT KEHA-KESKUKSELTA
    // ==========================================
    const baseUrl = 'https://api-qa.ahtp.fi/v1/job-postings';
    const url = new URL(baseUrl);
    
    // Lisätään hakusanat, jos niitä on
    if (searchTerms) url.searchParams.append('q', searchTerms);
    if (locationTerm) url.searchParams.append('location', locationTerm);
    url.searchParams.append('limit', '5'); // Haetaan 5 parasta osumaa

    const kehaResponse = await fetch(url.toString(), {
      method: "GET",
      agent: proxyAgent as any,
      headers: {
        "KIPA-Subscription-Key": process.env.KIPA_SUBSCRIPTION_KEY,
        "Content-Type": "application/json",
      }
    });

    if (!kehaResponse.ok) {
      console.error("KEHA API virhe:", kehaResponse.status);
      throw new Error("Työmarkkinatorin rajapinta ei vastannut oikein.");
    }

    // TÄSSÄ KORJAUS: lisätty "as any", jotta TypeScript hyväksyy datan rakenteen
    const kehaData = await kehaResponse.json() as any;
    const rawJobs = kehaData.items || kehaData.results || [];

    if (rawJobs.length === 0) {
      return NextResponse.json({ output: "[]" });
    }

    // Yksinkertaistetaan KEHA:n dataa OpenAI:ta varten (säästetään tokeneita)
    const jobsForAI = rawJobs.map((job: any) => ({
      id: job.id,
      title: job.title || "Tuntematon",
      company: job.employerName || "Tuntematon",
      location: job.municipalities?.[0]?.name || "Suomi",
      description: job.description ? job.description.substring(0, 800) : "", // Rajataan pituutta
      url: job.externalUrl || `https://tyomarkkinatori.fi/henkiloasiakkaat/tyopaikat/${job.id}`,
      deadline: job.applicationEndDate || "",
    }));

    // ==========================================
    // VAIHE 2: RIKASTA DATA OPENAI:LLA (Match Score & Perustelut)
    // ==========================================
    const aiPrompt = `
Olet rekrytointikonsultti. Tässä on käyttäjän profiilin tiivistelmä:
- Kokemus: ${body.experience || 'Ei määritelty'}
- Taidot: ${body.skills || 'Ei määritelty'}
- Koulutus/Kielet: ${body.languages || 'Ei määritelty'}

Ja tässä on lista AITOJA avoimia työpaikkoja (JSON-muodossa):
${JSON.stringify(jobsForAI)}

TEHTÄVÄSI:
Lue oikeat työpaikkailmoitukset läpi ja arvioi, kuinka hyvin hakija sopii niihin.
Palauta JSON-objekti, jossa on avain "jobs". Jokaisen työpaikan tulee noudattaa tarkalleen tätä muotoa:

{
  "title": "Sama kuin syötteessä",
  "company": "Sama kuin syötteessä",
  "location": "Sama kuin syötteessä",
  "type": "Kokoaikainen/Osa-aikainen (päättele kuvauksesta)",
  "summary": "Myyvä 2 lauseen tiivistelmä tehtävästä hakijalle",
  "adText": "Työpaikkailmoituksen alkuperäinen teksti tiivistettynä (väh. 3 lausetta)",
  "url": "Sama kuin syötteessä",
  "whyFit": "Sinun kirjoittamasi henkilökohtainen perustelu: miksi juuri TÄMÄ hakija sopii tähän paikkaan?",
  "source": "Työmarkkinatori",
  "matchScore": Numero 50-99 (Kuinka hyvin taidot osuvat vaatimuksiin),
  "status": "interested",
  "priority": "high tai medium",
  "salary": "Palkkaus sopimuksen mukaan",
  "appliedAt": "",
  "deadline": "Sama kuin syötteessä",
  "notes": "",
  "contactPerson": "Katso ilmoitus",
  "contactEmail": "",
  "companyWebsite": ""
}
`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o", 
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Olet apuri, joka palauttaa vain validia JSON-dataa pyydetyssä muodossa." },
        { role: "user", content: aiPrompt }
      ],
      temperature: 0.4, // Hieman matalampi lämpötila, jotta pysyy faktuaalisena
    });

    const rawOutput = aiResponse.choices[0]?.message?.content?.trim() || '{"jobs": []}';
    
    // Parsitaan ja varmistetaan tulos
    let finalOutput = "[]";
    try {
      const parsed = JSON.parse(rawOutput);
      if (parsed.jobs && Array.isArray(parsed.jobs)) {
        finalOutput = JSON.stringify(parsed.jobs);
      }
    } catch (e) {
      console.error("JSON parse error from AI:", e);
      finalOutput = "[]";
    }

    return NextResponse.json({ output: finalOutput });

  } catch (error: any) {
    console.error("Jobs route error:", error);
    return NextResponse.json(
      { error: "Työpaikkaehdotusten haku epäonnistui." },
      { status: 500 }
    );
  }
}
