import { NextResponse } from "next/server";
import OpenAI from "openai";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const JOBS_CACHE_TTL_MS = 1000 * 60 * 15;
const JOBS_FAILURE_CACHE_TTL_MS = 1000 * 60;
const jobsCache = new Map<
  string,
  {
    expiresAt: number;
    payload: Record<string, unknown>;
  }
>();

const fixieUrl = process.env.FIXIE_URL?.trim();
const proxyAgent = fixieUrl ? new HttpsProxyAgent(fixieUrl) : undefined;

const TYOMARKKINATORI_URL = "https://api.ahtp.fi/kipa/p67/v2/jobpostings";

function getLocText(field: unknown): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object") {
    const localized = field as Record<string, string | undefined>;
    return (
      localized.fi ||
      localized.FI ||
      localized.sv ||
      localized.SV ||
      localized.en ||
      localized.EN ||
      ""
    );
  }
  return "";
}

function makeExternalId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeTextValue(value?: string) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function normalizeComparableText(value?: string) {
  return normalizeTextValue(value)
    .toLowerCase()
    .replace(/[|\-–—].*$/, "")
    .trim();
}

function normalizeJobUrl(url?: string) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "mc_cid",
      "mc_eid",
    ];

    for (const key of trackingParams) {
      parsed.searchParams.delete(key);
    }

    parsed.hash = "";
    const normalizedPath = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.origin}${normalizedPath}${parsed.search}`;
  } catch {
    return url.trim();
  }
}

function makeJobIdentityKey(job: {
  url?: string;
  title?: string;
  company?: string;
  source?: string;
}) {
  const normalizedUrl = normalizeJobUrl(job.url);
  const title = normalizeComparableText(job.title);
  const company = normalizeComparableText(job.company);
  const source = normalizeComparableText(job.source);

  if (normalizedUrl) return `url::${normalizedUrl}`;

  let domain = "";
  try {
    domain = job.url ? new URL(job.url).hostname.replace(/^www\./, "") : "";
  } catch {
    domain = "";
  }

  return `meta::${domain}::${title}::${company}::${source}`;
}

function normalizeDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function safeJsonLinesParse(text: string): any[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function buildDeterministicJobsFallback(
  jobs: Array<{
    title?: string;
    company?: string;
    location?: string;
    description?: string;
    url?: string;
    source?: string;
  }>,
) {
  const fallbackDeadline = new Date();
  fallbackDeadline.setDate(fallbackDeadline.getDate() + 30);
  const deadline = normalizeDateString(fallbackDeadline);

  return jobs.slice(0, 12).map((job, index) => ({
    title: job.title || "Avoin työpaikka",
    company: job.company || "Katso ilmoituksesta",
    location: job.location || "Suomi",
    type: "Kokoaikainen",
    summary: job.description
      ? `${job.description.slice(0, 140).trim()}...`
      : "Tutustu ilmoitukseen ja arvioi sopivuus tarkemmin.",
    adText:
      job.source && job.source !== "Työmarkkinatori"
        ? "Tämä työpaikka löytyi ulkoisesta palvelusta. Klikkaa alla olevaa painiketta avataksesi ilmoituksen, kopioi sen teksti ja tuo se Duuniharavaan analysoitavaksi!"
        : job.description || "Avaa ilmoitus nähdäksesi tarkemmat tiedot.",
    url: job.url || "https://tyomarkkinatori.fi/",
    whyFit: "Perustuu hakusanoihin, sijaintiin ja ilmoituksen kuvaukseen.",
    source: job.source || "Internet",
    matchScore: Math.max(55, 88 - index * 2),
    status: "interested",
    priority: "medium",
    salary: "Sopimuksen mukaan",
    deadline,
    notes: "",
  }));
}

function uniqueByUrl<T extends { url?: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeJobUrl(item.url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueJobsByUrlOrTitle<
  T extends { url?: string; title?: string; company?: string }
>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = makeJobIdentityKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pickTyomarkkinatoriUrl(job: any) {
  const directApplyUrl = normalizeJobUrl(
    getLocText(job?.application?.url) ||
      getLocText(job?.applicationUrl) ||
      getLocText(job?.applyUrl) ||
      getLocText(job?.externalUrl),
  );

  if (directApplyUrl) return directApplyUrl;

  const idCandidate =
    job?.id || job?.metadata?.externalId || job?.metadata?.id || "";

  return idCandidate
    ? `https://tyomarkkinatori.fi/henkiloasiakkaat/tyopaikat/${idCandidate}`
    : "https://tyomarkkinatori.fi/";
}

function pickGoogleResultUrl(item: any) {
  const fallbackUrl = normalizeJobUrl(item?.link || "");
  const metaTags = Array.isArray(item?.pagemap?.metatags)
    ? item.pagemap.metatags
    : [];
  const metaCandidate = metaTags
    .map(
      (tag: Record<string, string>) =>
        tag["og:url"] || tag["twitter:url"] || tag["og:site:url"] || "",
    )
    .find(Boolean);

  const normalizedMetaCandidate = normalizeJobUrl(metaCandidate || "");
  if (!normalizedMetaCandidate) return fallbackUrl;

  try {
    const fallbackHost = new URL(fallbackUrl).hostname.replace(/^www\./, "");
    const candidateHost = new URL(normalizedMetaCandidate).hostname.replace(/^www\./, "");
    return fallbackHost === candidateHost ? normalizedMetaCandidate : fallbackUrl;
  } catch {
    return fallbackUrl;
  }
}

function restoreCanonicalJobs<
  T extends {
    url?: string;
    title?: string;
    company?: string;
    source?: string;
    location?: string;
  },
>(
  jobs: T[],
  originals: Array<{
    url?: string;
    title?: string;
    company?: string;
    source?: string;
    location?: string;
  }>,
) {
  const byIdentity = new Map<string, (typeof originals)[number]>();
  const byMeta = new Map<string, (typeof originals)[number]>();

  for (const original of originals) {
    const identityKey = makeJobIdentityKey(original);
    const metaKey = `meta::${normalizeComparableText(original.title)}::${normalizeComparableText(original.company)}::${normalizeComparableText(original.source)}`;
    if (identityKey) byIdentity.set(identityKey, original);
    if (metaKey) byMeta.set(metaKey, original);
  }

  return jobs.map((job) => {
    const identityKey = makeJobIdentityKey(job);
    const metaKey = `meta::${normalizeComparableText(job.title)}::${normalizeComparableText(job.company)}::${normalizeComparableText(job.source)}`;
    const original = byIdentity.get(identityKey) || byMeta.get(metaKey);

    if (!original) {
      return {
        ...job,
        url: normalizeJobUrl(job.url),
      };
    }

    return {
      ...job,
      title: job.title || original.title,
      company:
        !job.company || normalizeComparableText(job.company) === "katso ilmoituksesta"
          ? original.company || job.company
          : job.company,
      location: job.location || original.location,
      source: original.source || job.source,
      url: original.url || normalizeJobUrl(job.url),
    };
  });
}

function buildJobsCacheKey(body: Record<string, unknown>) {
  return JSON.stringify({
    targetJob: `${body.targetJob || ""}`.trim().toLowerCase(),
    desiredRoles: `${body.desiredRoles || ""}`.trim().toLowerCase(),
    desiredLocation: `${body.desiredLocation || ""}`.trim().toLowerCase(),
    keywords: `${body.keywords || ""}`.trim().toLowerCase(),
    workType: `${body.workType || ""}`.trim().toLowerCase(),
  });
}

function readJobsCache(key: string) {
  const cached = jobsCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    jobsCache.delete(key);
    return null;
  }
  return cached.payload;
}

function writeJobsCache(
  key: string,
  payload: Record<string, unknown>,
  ttlMs: number = JOBS_CACHE_TTL_MS,
) {
  jobsCache.set(key, {
    expiresAt: Date.now() + ttlMs,
    payload,
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI avain puuttuu." },
        { status: 500 },
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const cacheKey = buildJobsCacheKey(body);

    const rawSearchTerms = [
      body.targetJob,
      body.desiredRoles,
      body.keywords,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const locationSearch = `${body.desiredLocation || ""}`.trim();
    const googleSearchTerms = [
      body.targetJob,
      body.desiredRoles,
      body.desiredLocation,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const searchKeywords = Array.from(
      new Set(
        rawSearchTerms
          .toLowerCase()
          .split(/[\s,]+/)
          .filter((word) => word.length > 3),
      ),
    );

    if (
      !`${body.targetJob || ""}`.trim() &&
      !`${body.desiredRoles || ""}`.trim() &&
      searchKeywords.length === 0
    ) {
      const responsePayload = {
        output: "[]",
        diagnostics: {
          hasTyomarkkinatoriKey: Boolean(process.env.TYOMARKKINATORI_API_KEY),
          hasGoogleKey: Boolean(process.env.GOOGLE_API_KEY),
          hasGoogleCx: Boolean(process.env.GOOGLE_CX_ID),
          usesProxy: Boolean(proxyAgent),
          tyomarkkinatoriCount: 0,
          googleCount: 0,
          tyomarkkinatoriStatus: "skipped",
          googleStatus: "skipped",
          tyomarkkinatoriError: "",
          googleError: "",
        },
        error:
          "Lisää ensin selkeä rooli tai hakusanoja työnhakuun. Näin vältämme turhat haut ja saat osuvammat ehdotukset.",
      };
      writeJobsCache(cacheKey, responsePayload, JOBS_FAILURE_CACHE_TTL_MS);
      return NextResponse.json(responsePayload);
    }

    const cachedPayload = readJobsCache(cacheKey);
    if (cachedPayload) {
      return NextResponse.json(cachedPayload);
    }

    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 14);

    const tmKey = process.env.TYOMARKKINATORI_API_KEY;
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const googleCxId = process.env.GOOGLE_CX_ID || "1219b99e3495d43d8";
    const diagnostics = {
      hasTyomarkkinatoriKey: Boolean(tmKey),
      hasGoogleKey: Boolean(googleApiKey),
      hasGoogleCx: Boolean(googleCxId),
      usesProxy: Boolean(proxyAgent),
      tyomarkkinatoriCount: 0,
      googleCount: 0,
      tyomarkkinatoriStatus: "not_tried",
      googleStatus: "not_tried",
      tyomarkkinatoriError: "",
      googleError: "",
    };

    let tmJobsForAI: any[] = [];
    let googleJobsForAI: any[] = [];

    if (tmKey) {
      try {
        console.log("Searching Tyomarkkinatori with narrow payload...");
        diagnostics.tyomarkkinatoriStatus = "request_started";

        const tmPayloads: Record<string, unknown>[] = [];
        if (searchKeywords.length > 0) {
          tmPayloads.push({
            onlyStatus: "PUBLISHED",
            created: { from: recentDate.toISOString() },
            query: searchKeywords[0],
          });
        }
        tmPayloads.push({
          onlyStatus: "PUBLISHED",
          created: { from: recentDate.toISOString() },
        });

        let allParsedJobs: any[] = [];
        for (const payload of tmPayloads) {
          const fetchOptions: Record<string, unknown> = {
            method: "POST",
            headers: {
              "KIPA-Subscription-Key": tmKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          };

          if (proxyAgent) {
            fetchOptions.agent = proxyAgent;
          }

          const tmResponse = await fetch(
            TYOMARKKINATORI_URL,
            fetchOptions as Parameters<typeof fetch>[1],
          );

          if (!tmResponse.ok) {
            console.error("Tyomarkkinatori API error:", tmResponse.status);
            diagnostics.tyomarkkinatoriStatus = `http_${tmResponse.status}`;
            continue;
          }

          allParsedJobs = safeJsonLinesParse(await tmResponse.text());
          if (allParsedJobs.length > 0) {
            diagnostics.tyomarkkinatoriStatus = "ok";
            break;
          }
        }

        if (allParsedJobs.length === 0 && diagnostics.tyomarkkinatoriStatus === "request_started") {
          diagnostics.tyomarkkinatoriStatus = "empty";
        }

        if (allParsedJobs.length > 0) {
          const scoredJobs = allParsedJobs
            .map((job) => {
              const title = getLocText(job.position?.title);
              const company =
                getLocText(job.client?.company) ||
                getLocText(job.owner?.company) ||
                "Työnantaja";
              const desc =
                getLocText(job.position?.jobDescription) ||
                getLocText(job.position?.marketingDescription);
              const loc =
                getLocText(job.location?.workplacePostOffice) ||
                job.location?.municipalities?.[0] ||
                "";
              const fullText = `${title} ${company} ${desc} ${loc}`.toLowerCase();

              let score = 0;
              if (locationSearch && fullText.includes(locationSearch.toLowerCase())) {
                score += 5;
              }
              for (const keyword of searchKeywords) {
                if (fullText.includes(keyword)) score += 1;
              }

              return {
                id: job.metadata?.externalId || job.id || makeExternalId("tm"),
                title: title || "Avoin työpaikka",
                company,
                location: loc || "Suomi",
                description: desc ? desc.slice(0, 500) : "",
                url: pickTyomarkkinatoriUrl(job),
                source: "Työmarkkinatori",
                _score: score,
              };
            })
            .sort((a, b) => b._score - a._score)
            .slice(0, 20);

          tmJobsForAI = scoredJobs.map(({ _score, ...job }) => job);
          diagnostics.tyomarkkinatoriCount = tmJobsForAI.length;
          console.log(
            `Tyomarkkinatori returned ${tmJobsForAI.length} shortlisted jobs.`,
          );
        }
      } catch (error) {
        console.error("Tyomarkkinatori fetch failed:", error);
        diagnostics.tyomarkkinatoriStatus = "failed";
        diagnostics.tyomarkkinatoriError =
          error instanceof Error ? error.message : "Tuntematon virhe";
      }
    }

    if (googleApiKey && googleCxId && googleSearchTerms) {
      try {
        console.log("Searching Google Custom Search...");
        diagnostics.googleStatus = "request_started";

        const googleQueries = [
          `${googleSearchTerms} työpaikka`,
          `${body.targetJob || ""} ${body.desiredLocation || ""} työpaikka`,
          `${body.desiredRoles || ""} ${body.desiredLocation || ""} työpaikka`,
          `${body.targetJob || body.desiredRoles || ""} site:duunitori.fi`,
          `${body.targetJob || body.desiredRoles || ""} site:oikotie.fi työpaikat`,
          `${body.targetJob || body.desiredRoles || ""} site:jobly.fi`,
          `${body.targetJob || body.desiredRoles || ""} site:linkedin.com/jobs`,
        ]
          .map((query) => query.replace(/\s+/g, " ").trim())
          .filter(Boolean);

        let googleItems: any[] = [];
        for (const query of googleQueries) {
          const requestUrls = [
            `https://customsearch.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCxId}&q=${encodeURIComponent(query)}&gl=fi&dateRestrict=d14&num=10`,
            `https://customsearch.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCxId}&q=${encodeURIComponent(query)}&gl=fi&num=10`,
          ];

          for (const requestUrl of requestUrls) {
            const googleResponse = await fetch(requestUrl);
            if (!googleResponse.ok) {
              diagnostics.googleStatus = `http_${googleResponse.status}`;
              diagnostics.googleError = `Google API vastasi koodilla ${googleResponse.status}`;
              continue;
            }

            const googleData = (await googleResponse.json()) as {
              items?: any[];
              error?: { message?: string };
            };

            if (googleData.error?.message) {
              diagnostics.googleStatus = "api_error";
              diagnostics.googleError = googleData.error.message;
            }
            if (Array.isArray(googleData.items) && googleData.items.length > 0) {
              googleItems.push(...googleData.items);
              diagnostics.googleStatus = "ok";
            }
            if (googleItems.length >= 24) {
              break;
            }
          }

          if (googleItems.length >= 24) {
            break;
          }
        }

        const dedupedGoogleItems = uniqueByUrl(
          googleItems.map((item) => ({ ...item, url: item.link })),
        );

        if (dedupedGoogleItems.length > 0) {
          googleJobsForAI = dedupedGoogleItems.slice(0, 12).map((item) => {
            const canonicalUrl = pickGoogleResultUrl(item);
            let source = "Internet";
            if (canonicalUrl.includes("duunitori.fi")) source = "Duunitori";
            else if (canonicalUrl.includes("oikotie.fi")) source = "Oikotie";
            else if (canonicalUrl.includes("jobly.fi")) source = "Jobly";
            else if (canonicalUrl.includes("linkedin.com")) source = "LinkedIn";
            else if (canonicalUrl.includes("indeed.")) source = "Indeed";
            else if (canonicalUrl.includes("monster.")) source = "Monster";
            else if (canonicalUrl.includes("kuntarekry.fi")) source = "Kuntarekry";

            return {
              id: makeExternalId("ext"),
              title: `${item.title || "Avoin työpaikka"}`
                .split(/[-|–]/)[0]
                .trim(),
              company: "Katso ilmoituksesta",
              location: locationSearch || "Suomi",
              description: item.snippet || "",
              url: canonicalUrl,
              source,
            };
          });
          diagnostics.googleCount = googleJobsForAI.length;
          console.log(`Google returned ${googleJobsForAI.length} external jobs.`);
        } else if (diagnostics.googleStatus === "request_started") {
          diagnostics.googleStatus = "empty";
        }
      } catch (error) {
        console.error("Google search failed:", error);
        diagnostics.googleStatus = "failed";
        diagnostics.googleError =
          error instanceof Error ? error.message : "Tuntematon virhe";
      }
    }

    const combinedJobs = uniqueJobsByUrlOrTitle([
      ...googleJobsForAI.slice(0, 10),
      ...tmJobsForAI.slice(0, 20),
    ]);

    if (combinedJobs.length === 0) {
      const responsePayload = {
        output: "[]",
        diagnostics,
        error:
          "Työpaikkoja ei löytynyt yhdestäkään lähteestä. Tarkista proxy- tai Google-asetukset.",
      };
      writeJobsCache(cacheKey, responsePayload, JOBS_FAILURE_CACHE_TTL_MS);
      return NextResponse.json(responsePayload);
    }

    const today = new Date();
    const fallbackFutureDeadline = new Date(today);
    fallbackFutureDeadline.setDate(today.getDate() + 30);

    const aiPrompt = `
Olet rekrytointikonsultti. Hakijan toiveet:
- Rooli: ${rawSearchTerms || body.targetJob || body.desiredRoles || "Avoin työ"}
- Alue: ${locationSearch || "Suomi"}

Alla on lista oikeita työpaikkahakuosumia eri lähteistä:
${JSON.stringify(combinedJobs)}

Tehtävä:
1. Valitse 12 parhaiten sopivaa työpaikkaa.
2. Ota mukaan useita eri lähteitä, jos niitä on tarjolla.
3. Jos mukana on ulkoisia lähteitä, valitse vähintään 4 paikkaa muualta kuin Työmarkkinatorilta.
4. Älä keksi uusia työpaikkoja listan ulkopuolelta.
5. Säilytä url-kenttä täsmälleen sellaisena kuin syötteessä.
6. Jos ilmoituksen teksti on lyhyt ulkoisesta lähteestä, käytä adText-kentässä tätä tekstiä:
"Tämä työpaikka löytyi ulkoisesta palvelusta. Klikkaa alla olevaa painiketta avataksesi ilmoituksen, kopioi sen teksti ja tuo se Duuniharavaan analysoitavaksi!"

Deadline-ohje:
- Tänään on ${normalizeDateString(today)}.
- Jos oikeaa deadlinea ei voi päätellä, käytä tulevaa päivämäärää ${normalizeDateString(fallbackFutureDeadline)}.
- Älä koskaan anna mennyttä päivämäärää.

Palauta vain validi JSON muodossa:
{
  "jobs": [
    {
      "title": "Työn nimi",
      "company": "Yritys",
      "location": "Sijainti",
      "type": "Kokoaikainen tai Osa-aikainen",
      "summary": "Houkutteleva 1-2 lauseen yhteenveto",
      "adText": "Ilmoitusteksti tai yllä oleva vakioteksti",
      "url": "Sama url kuin syötteessä",
      "whyFit": "Miksi sopii hakijalle",
      "source": "Sama kuin syötteessä",
      "matchScore": 1,
      "status": "interested",
      "priority": "medium",
      "salary": "Lue kuvauksesta, muuten Sopimuksen mukaan",
      "deadline": "YYYY-MM-DD",
      "notes": ""
    }
  ]
}`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Olet apuri, joka palauttaa vain validia JSON-dataa eikä koskaan keksi uusia työpaikkoja syötteen ulkopuolelta.",
        },
        { role: "user", content: aiPrompt },
      ],
      temperature: 0.2,
    });

    const rawOutput =
      aiResponse.choices[0]?.message?.content?.trim() || '{"jobs": []}';
    const parsed = JSON.parse(rawOutput) as { jobs?: unknown[] };
    let finalJobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];

    if (finalJobs.length === 0 && combinedJobs.length > 0) {
      finalJobs = buildDeterministicJobsFallback(combinedJobs);
    }

    finalJobs = uniqueJobsByUrlOrTitle(
      restoreCanonicalJobs(
        finalJobs as Array<{
          url?: string;
          title?: string;
          company?: string;
          source?: string;
          location?: string;
        }>,
        combinedJobs,
      ),
    );

    const responsePayload = {
      output: JSON.stringify(finalJobs),
      diagnostics,
    };
    writeJobsCache(cacheKey, responsePayload);
    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Jobs route error:", error);
    return NextResponse.json(
      { error: "Työpaikkojen haku epäonnistui." },
      { status: 500 },
    );
  }
}

