import { NextResponse } from "next/server";
import OpenAI from "openai";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const proxyAgent = process.env.FIXIE_URL 
  ? new HttpsProxyAgent(process.env.FIXIE_URL) 
  : undefined;

const TYOMARKKINATORI_URL = "https://api.ahtp.fi/kipa/p67/v2/jobpostings";

// APUFUNKTIO: Purkaa Työmarkkinatorin kieliobjektit (esim. { fi: "Teksti", en: "Text" }) puhtaaksi tekstiksi
function getLocText(field: any): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  // Kokeillaan ensin suomea, sitten ruotsia/englantia
  return field.fi || field.FI || field.sv || field.SV || field.en || field.EN || "";
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI avain puuttuu." }, { status: 500 });
    }

    const body = await req.json();
    
    // Yhdistetään kaikki käyttäjän syöttämät toiveet yhdeksi isoksi hakusanakentäksi
    const searchTerms = [body.targetJob, body.desiredRoles, body.keywords, body.desiredLocation].filter(Boolean).join(" ");
    const searchKeywords = searchTerms.toLowerCase().split(/[\s,]+/).filter(w => w.length > 2); // Pilkotaan sanoiksi ("myynti", "pirkanmaa", "b2b")
    
    let rawJobs: any[] = [];
    const tmKey = process.env.TYOMARKKINATORI_API_KEY;

    // ==========================================================
    // VAIHE 1: HAKU TYÖMARKKINATORILTA JA ESIHARAVOINTI
    // ==========================================================
    if (tmKey) {
      try {
        console.log("🔍 Haetaan Työmarkkinatorilta...");
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 14);

        const payload = {
          onlyStatus: "PUBLISHED",
          created: { from: recentDate.toISOString() }
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

          console.log(`✅ Työmarkkinatorilta löytyi ${allParsedJobs.length} paikkaa. Pisteytetään...`);

          // ESIHARAVA: Pisteytetään työpaikat käyttäjän hakusanojen perusteella
          let scoredJobs = allParsedJobs.map(job => {
            const title = getLocText(job.position?.title);
            const company = getLocText(job.client?.company) || getLocText(job.owner?.company);
            const desc = getLocText(job.position?.jobDescription) || getLocText(job.position?.marketingDescription);
            const loc = getLocText(job.location?.workplacePostOffice) || job.location?.municipalities?.[0] || "";

            const fullText = `${title} ${company} ${desc} ${loc}`.toLowerCase();
            let score = 0;

            searchKeywords.forEach(kw => {
              if (fullText.includes(kw)) score += 1;
            });

            return { job, score, title, company, desc, loc };
          });

          // Otetaan vain ne, joissa on edes jotain osumaa, ja järjestetään parhaat ylös
          scoredJobs = scoredJobs.filter(j => j.score > 0).sort((a, b) => b.score - a.score);

          // Jos hakusanoilla ei löytynyt yhtään mitään, otetaan tuoreimmat
          if (scoredJobs.length === 0) {
            console.log("⚠️ Hakusanoilla ei löytynyt osumia, otetaan tuoreimmat.");
            scoredJobs = allParsedJobs.slice(0, 15).map(job => ({
              job,
              title: getLocText(job.position?.title),
              company: getLocText(job.client?.company) || getLocText(job.owner?.company),
              desc: getLocText(job.position?.jobDescription),
              loc: getLocText(job.location?.workplacePostOffice) || job.location?.municipalities?.[0] || ""
            }));
          }

          rawJobs = scoredJobs.slice(0, 15);
          console.log(`✅ Tekoälylle lähetetään ${rawJobs.length} parhaiten osuvaa paikkaa.`);
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
      const jobsForAI = rawJobs.map((j: any) => ({
        id: j.job.metadata?.externalId || j.job.id || Math.random().toString(36).substr(2, 9),
        title: j.title || "Avoin työpaikka",
        company: j.company || "Tuntematon yritys",
        location: j.loc || "Suomi",
        description: j.desc.substring(0, 600), // Teksti on nyt turvallisesti purettu!
        url: getLocText(j.job.application?.url) || `https://tyomarkkinatori.fi/henkiloasiakkaat/tyopaikat/${j.job.metadata?.externalId || j.job.id}`,
        deadline: j.job.application?.expires || ""
      }));

      aiPrompt = `
Olet rekrytointikonsultti. Tässä on hakijan profiili:
- Etsii töitä: ${searchTerms}

Tässä on 15 aitoa ja hakijalle esisuodatettua työpaikkaa (JSON):
${JSON.stringify(jobsForAI)}

Valitse näistä 3-5 parhaiten hakijalle sopivaa työpaikkaa.
HUOMIO SIJAINNISTA: Jos sijainti on pelkkä numero (esim. 285 tai 837), se on kuntakoodi. Etsi silloin oikea kaupunki kuvauksesta tai jätä kaupungiksi alue (esim. Pirkanmaa).

Palauta VAIN JSON-objekti avaimella "jobs", jossa on nämä kentät:
{
  "jobs": [
    {
      "title": "Sama kuin syötteessä",
      "company": "Sama kuin syötteessä",
      "location": "Sama kuin syötteessä (korjaa kuntakoodi kaupungiksi, jos osaat)",
      "type": "Kokoaikainen tai Osa-aikainen",
      "summary": "Myyvä 2 lauseen tiivistelmä",
      "adText": "Alkuperäinen kuvaus siistittynä",
      "url": "Sama kuin syötteessä",
      "whyFit": "Miksi hakija sopii tähän",
      "source": "Työmarkkinatori",
      "matchScore": 95,
      "status": "interested",
      "priority": "high",
      "salary": "Lue kuvauksesta tai Sopimuksen mukaan",
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
