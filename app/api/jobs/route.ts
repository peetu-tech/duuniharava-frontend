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

function getLocText(field: any): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field.fi || field.FI || field.sv || field.SV || field.en || field.EN || "";
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI avain puuttuu." }, { status: 500 });
    }

    const body = await req.json();
    
    const searchTerms = [body.targetJob, body.desiredRoles, body.keywords, body.desiredLocation].filter(Boolean).join(" ");
    const searchKeywords = searchTerms.toLowerCase().split(/[\s,]+/).filter(w => w.length > 2);
    
    let tmJobsForAI: any[] = [];
    const tmKey = process.env.TYOMARKKINATORI_API_KEY;

    // ==========================================================
    // VAIHE 1A: HAKU TYÖMARKKINATORILTA
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
          const allParsedJobs = textData.split('\n').filter(line => line.trim().length > 0).map(line => {
            try { return JSON.parse(line); } catch (e) { return null; }
          }).filter(Boolean);

          let scoredJobs = allParsedJobs.map(job => {
            const title = getLocText(job.position?.title);
            const company = getLocText(job.client?.company) || getLocText(job.owner?.company);
            const desc = getLocText(job.position?.jobDescription) || getLocText(job.position?.marketingDescription);
            const loc = getLocText(job.location?.workplacePostOffice) || job.location?.municipalities?.[0] || "";
            const fullText = `${title} ${company} ${desc} ${loc}`.toLowerCase();
            
            let score = 0;
            searchKeywords.forEach(kw => { if (fullText.includes(kw)) score += 1; });
            return { job, score, title, company, desc, loc };
          });

          scoredJobs = scoredJobs.filter(j => j.score > 0).sort((a, b) => b.score - a.score);

          if (scoredJobs.length === 0) {
            scoredJobs = allParsedJobs.slice(0, 30).map(job => ({
              job, score: 0,
              title: getLocText(job.position?.title),
              company: getLocText(job.client?.company) || getLocText(job.owner?.company),
              desc: getLocText(job.position?.jobDescription),
              loc: getLocText(job.location?.workplacePostOffice) || job.location?.municipalities?.[0] || ""
            }));
          }

          // NOSTETTU: Otetaan jopa 25 parasta paikkaa Työmarkkinatorilta pohjaksi
          tmJobsForAI = scoredJobs.slice(0, 25).map((j: any) => ({
            id: j.job.metadata?.externalId || j.job.id,
            title: j.title || "Avoin työpaikka",
            company: j.company || "Tuntematon yritys",
            location: j.loc || "Suomi",
            description: j.desc ? j.desc.substring(0, 400) : "", // Hieman lyhyempi kuvaus tekoälylle, säästää aikaa
            url: getLocText(j.job.application?.url) || `https://tyomarkkinatori.fi/henkiloasiakkaat/tyopaikat/${j.job.id}`,
            source: "Työmarkkinatori"
          }));
        }
      } catch (e) {
        console.error("❌ Virhe Työmarkkinatorin haussa:", e);
      }
    }

    // ==========================================================
    // VAIHE 1B: HAKU GOOGLESTA (Oikotie, Duunitori jne.)
    // ==========================================================
    let googleJobsForAI: any[] = [];
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const googleCxId = process.env.GOOGLE_CX_ID || "1219b99e3495d43d8"; 

    if (googleApiKey && googleCxId) {
      try {
        console.log("🔍 Haetaan Google Custom Searchin kautta (Duunitori, Oikotie jne)...");
        const googleUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCxId}&q=${encodeURIComponent(searchTerms)}&gl=fi`;
        
        const gRes = await fetch(googleUrl);
        const gData: any = await gRes.json();

        if (gData.items && gData.items.length > 0) {
          // NOSTETTU: Otetaan jopa 10 osumaa Googlelta
          googleJobsForAI = gData.items.slice(0, 10).map((item: any) => {
            let sourceDomain = "Ulkoisesta palvelusta";
            if (item.link.includes("duunitori.fi")) sourceDomain = "Duunitori";
            if (item.link.includes("oikotie.fi")) sourceDomain = "Oikotie";
            if (item.link.includes("jobly.fi")) sourceDomain = "Jobly";
            if (item.link.includes("linkedin.com")) sourceDomain = "LinkedIn";

            return {
              id: Math.random().toString(36).substr(2, 9),
              title: item.title,
              company: "Katso ilmoituksesta", 
              location: body.desiredLocation || "Suomi",
              description: item.snippet, 
              url: item.link,
              source: sourceDomain
            };
          });
          console.log(`✅ Google löysi ${googleJobsForAI.length} ulkoista paikkaa.`);
        }
      } catch (e) {
        console.error("❌ Virhe Google-haussa:", e);
      }
    } else {
      console.log("⚠️ GOOGLE_API_KEY puuttuu .env tiedostosta, ohitetaan muiden portaalien haku.");
    }

    // Yhdistetään Työmarkkinatorin ja Googlen tulokset listaksi (nyt jopa 35 paikkaa tekoälyn valittavaksi)
    const combinedJobs = [...googleJobsForAI, ...tmJobsForAI];

    let aiPrompt = "";
    let isFallback = false;

    // ==========================================
    // VAIHE 2: AI-RIKASTUS & VALINTA
    // ==========================================
    if (combinedJobs.length > 0) {
      aiPrompt = `
Olet rekrytointikonsultti. Tässä on hakijan profiili:
- Etsii töitä: ${searchTerms}
- Alue: ${body.desiredLocation || 'Suomi'}

Tässä on lista löydettyjä työpaikkoja (Työmarkkinatorilta ja muista palveluista):
${JSON.stringify(combinedJobs)}

Valitse näistä 10-15 parhaiten hakijalle sopivaa työpaikkaa. Yritä ottaa mukaan tuloksia ERI lähteistä (source).

Laske jokaiselle valitsemallesi paikalle tarkka ja totuudenmukainen matchScore (1-100) sen perusteella, miten hyvin ilmoituksen tiedot vastaavat hakijan toiveita.

ERITYISOHJEET (Jos source on Duunitori, Oikotie, Jobly tai LinkedIn):
Näiden paikkojen kohdalla sinulla on vain lyhyt esikatseluteksti. Aseta näiden kohdalla adText-kentän arvoksi täsmälleen tämä: "Tämä työpaikka löytyi ulkoisesta palvelusta. Klikkaa alla olevaa painiketta avataksesi ilmoituksen, kopioi sen teksti ja tuo se Duuniharavaan analysoitavaksi!"
Yritä päätellä yrityksen nimi 'title' tai 'description' kentistä näille.

Palauta VAIN JSON-objekti avaimella "jobs", jossa on nämä kentät:
{
  "jobs": [
    {
      "title": "Sama kuin syötteessä (siistittynä)",
      "company": "Päätelty tai Sama kuin syötteessä",
      "location": "Sama kuin syötteessä (korjaa kuntakoodit)",
      "type": "Kokoaikainen tai Osa-aikainen",
      "summary": "Myyvä 2 lauseen tiivistelmä",
      "adText": "Alkuperäinen kuvaus TAI yllä mainittu erikoisohje",
      "url": "Sama kuin syötteessä",
      "whyFit": "Miksi hakija sopii (perustele)",
      "source": "Sama kuin syötteessä",
      "matchScore": laskettu_arvosana_välillä_1_100,
      "status": "interested",
      "priority": "medium",
      "salary": "Lue kuvauksesta, muuten Sopimuksen mukaan",
      "deadline": "Lue kuvauksesta",
      "notes": ""
    }
  ]
}`;
    } else {
      isFallback = true;
      aiPrompt = `
Työmarkkinatorilta ei saatu juuri nyt dataa haulle. Luo 10 simuloitua avointa työpaikkaa:
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
      "matchScore": 85,
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
    console.log("🧠 Pyydetään OpenAI:ta yhdistämään tulokset...");
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
