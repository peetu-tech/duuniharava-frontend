import { NextResponse } from "next/server";
import OpenAI from "openai";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const fixieUrl = process.env.FIXIE_URL?.trim();
const proxyAgent = fixieUrl ? new HttpsProxyAgent(fixieUrl) : undefined;

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
    const rawSearchTerms = [body.targetJob, body.desiredRoles, body.keywords].filter(Boolean).join(" ");
    const searchKeywords = Array.from(new Set(rawSearchTerms.toLowerCase().split(/[\s,]+/).filter(w => w.length > 3)));
    
    let tmJobsForAI: any[] = [];
    let googleJobsForAI: any[] = [];

    const tmKey = process.env.TYOMARKKINATORI_API_KEY;
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const googleCxId = process.env.GOOGLE_CX_ID || "1219b99e3495d43d8";

    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 14);

    // ==========================================================
    // VAIHE 1A: HAKU TYÖMARKKINATORILTA
    // ==========================================================
    if (tmKey) {
      try {
        const payload: any = {
          onlyStatus: "PUBLISHED",
          created: { from: recentDate.toISOString() }
        };

        if (searchKeywords.length > 0) {
          payload.query = searchKeywords[0];
        }

        const fetchOptions: any = {
          method: "POST",
          headers: {
            "KIPA-Subscription-Key": tmKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload)
        };

        if (proxyAgent) fetchOptions.agent = proxyAgent;

        const tmResponse = await fetch(TYOMARKKINATORI_URL, fetchOptions);

        if (tmResponse.ok) {
          const textData = await tmResponse.text();
          const allParsedJobs = textData.split('\n').filter(line => line.trim().length > 0).map(line => {
            try { return JSON.parse(line); } catch (e) { return null; }
          }).filter(Boolean);

          tmJobsForAI = allParsedJobs.map(job => {
            const title = getLocText(job.position?.title);
            const company = getLocText(job.client?.company) || getLocText(job.owner?.company) || "Työnantaja";
            const desc = getLocText(job.position?.jobDescription) || getLocText(job.position?.marketingDescription);
            const loc = getLocText(job.location?.workplacePostOffice) || job.location?.municipalities?.[0] || "";
            
            // KORJAUS: Linkin rakentaminen Työmarkkinatorille
            // Ensisijaisesti käytetään application.url jos se on olemassa, muuten rakennetaan TM-linkki
            const applicationUrl = job.application?.url ? getLocText(job.application.url) : null;
            const fallbackTmUrl = `https://tyomarkkinatori.fi/henkiloasiakkaat/tyopaikat/${job.id}`;
            const finalUrl = applicationUrl || fallbackTmUrl;

            return {
              id: job.id,
              title,
              company,
              location: loc,
              description: desc ? desc.substring(0, 500) : "",
              url: finalUrl,
              source: "Työmarkkinatori"
            };
          });
        }
      } catch (e) {
        console.error("❌ Työmarkkinatori error:", e);
      }
    }

    // ==========================================================
    // VAIHE 1B: HAKU GOOGLESTA (Duunitori, Oikotie jne.)
    // ==========================================================
    const googleSearchStr = [body.targetJob, body.desiredRoles, body.desiredLocation].filter(Boolean).join(" ");

    if (googleApiKey && googleCxId && googleSearchStr) {
      try {
        const googleUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCxId}&q=${encodeURIComponent(googleSearchStr)}&gl=fi&dateRestrict=d[14]`;
        const gRes = await fetch(googleUrl);
        const gData: any = await gRes.json();

        if (gData.items) {
          googleJobsForAI = gData.items.map((item: any) => {
            let source = "Internet";
            if (item.link.includes("duunitori.fi")) source = "Duunitori";
            else if (item.link.includes("oikotie.fi")) source = "Oikotie";
            else if (item.link.includes("linkedin.com")) source = "LinkedIn";
            else if (item.link.includes("jobly.fi")) source = "Jobly";

            return {
              id: Math.random().toString(36).substr(2, 9),
              title: item.title.split(/[-|–]/)[0].trim(),
              company: "Katso ilmoituksesta",
              location: body.desiredLocation || "Suomi",
              description: item.snippet,
              url: item.link,
              source: source
            };
          });
        }
      } catch (e) {
        console.error("❌ Google search error:", e);
      }
    }

    // Yhdistetään ja varmistetaan monipuolisuus
    const combinedJobs = [...googleJobsForAI.slice(0, 10), ...tmJobsForAI.slice(0, 20)];
    const todayFi = new Date().toLocaleDateString("fi-FI");

    if (combinedJobs.length === 0) {
      return NextResponse.json({ output: "[]" });
    }

    // ==========================================
    // VAIHE 2: AI-RIKASTUS & LOPULLINEN VALINTA
    // ==========================================
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Olet rekrytointiasiantuntija. Palauta VAIN JSON-dataa." },
        { role: "user", content: `
Valitse tästä listasta 12-15 parhaiten hakijalle sopivaa työpaikkaa: ${JSON.stringify(combinedJobs)}
Hakijan toiveet: ${rawSearchTerms}

TÄRKEÄT OHJEET:
1. MONIPUOLISUUS: Valitse vähintään 5 paikkaa muualta kuin Työmarkkinatorilta (jos niitä on listassa). Suosi Duunitoria ja Oikotietä.
2. LINKIT: Käytä alkuperäisiä URL-osoitteita muuttamatta niitä.
3. TIIVISTELMÄT: Kirjoita jokaiselle oma, houkutteleva myyntipuhe (summary).
4. PÄIVÄMÄÄRÄT: Tänään on ${todayFi}. Varmista että deadline on tulevaisuudessa.

Palauta muodossa:
{ "jobs": [ { "title": "...", "company": "...", "location": "...", "type": "...", "summary": "...", "adText": "...", "url": "...", "whyFit": "...", "source": "...", "matchScore": 0-100, "status": "interested", "priority": "medium", "salary": "...", "deadline": "YYYY-MM-DD" } ] }
` }
      ],
      temperature: 0.3,
    });

    const rawOutput = aiResponse.choices[0]?.message?.content?.trim() || '{"jobs": []}';
    const parsed = JSON.parse(rawOutput);
    return NextResponse.json({ output: JSON.stringify(parsed.jobs || []) });

  } catch (error: any) {
    console.error("❌ Route error:", error);
    return NextResponse.json({ error: "Haku epäonnistui." }, { status: 500 });
  }
}
