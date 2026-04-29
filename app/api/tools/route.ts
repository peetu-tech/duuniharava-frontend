import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tool, data, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let systemPrompt = "";
    let userMessage = "";
    let useJsonFormat = false;

    switch (tool) {
      case "hidden-jobs":
        systemPrompt = "Olet asiantunteva ja erittäin vakuuttava uravalmentaja. Kirjoita lyhyt, iskevä ja ammattimainen lähestymisviesti (esim. LinkedIn-yksityisviesti tai sähköposti) suoraan yrityksen päättäjälle. Älä missään nimessä kerjää töitä tai kuulosta epätoivoiselta. Keskity vain siihen arvoon ja ratkaisuun, jonka hakija tuo pöytään.";
        userMessage = `Kohdeala/Yritys: ${data.targetIndustry}. Oma ydinosaamiseni: ${data.userCoreSkill}. Kirjoita minulle valmis lähestymisviesti suomeksi.`;
        break;

      case "calling-script":
        systemPrompt = "Olet kokenut B2B-myyntivalmentaja. Kirjoita erittäin lyhyt, luonnollinen ja rohkea puhelukäsikirjoitus työnhakijalle, joka soittaa rekrytoijalle tai palkkaavalle esihenkilölle. Käytä askelia: 1. Jäänmurtaja, 2. Koukku (arvoa tuottava kysymys yrityksen haasteista), 3. Vastaus (miten hakija ratkaisee ne). Kirjoita skripti puhekielellä ja lisää alkuun lyhyt kannustava lause (esim. 'Hengitä syvään...').";
        userMessage = `Kohdeyritys: ${data.callCompany}. Haettava rooli: ${data.callRole}.`;
        break;

      case "salary-negotiation":
        systemPrompt = "Olet kova ja asiallinen neuvotteluekspertti. Kirjoita sähköpostivastaus liian matalaan palkkatarjoukseen. Sävy on erittäin kohtelias, mutta jämäkkä. Tavoitteena on nostaa tarjousta kohti hakijan tavoitepalkkaa, perustellen sitä tuodulla lisäarvolla ja markkinatasolla. Anna tekoälyn laskea ehdotettu 'puolivälin' kompromissisumma.";
        userMessage = `Tarjottu palkka: ${data.offeredSalary}€. Oma tavoitepalkka: ${data.targetSalary}€. Muotoile vastatarjous suomeksi.`;
        break;

      case "linkedin-magnet":
        systemPrompt = `Olet huipputason LinkedIn-asiantuntija. Kirjoita kaksi asiaa hakijalle:
        1. Lyhyt, arvoa korostava 'Tietoja' (About) teksti profiiliin (max 4 lausetta).
        2. Innostava postaus uutisvirtaan uuden työn etsimisestä (hashtageineen). Älä käytä liikaa emojeita, pidä sävy asiantuntevana.

        TÄRKEÄÄ: Sinun ON EHDOTTOMASTI palautettava vastaus täsmälleen tässä muodossa, jotta järjestelmämme osaa lukea sen:
        ABOUT:
        [Kirjoita About-teksti tähän]

        POST:
        [Kirjoita uutisvirtapostaus tähän]`;
        userMessage = `Tavoiteltu rooli on: ${data.linkedInRole}.`;
        break;

      case "career-pivot":
        systemPrompt = "Olet uranvaihdoksen asiantuntija. Hakija on vaihtamassa täysin uuteen ammattiin. Etsi luovia, piileviä ja siirrettäviä taitoja vanhasta ammatista. Kirjoita innostava ja selkeä 3 kohdan suunnitelma (siltasuunnitelma), miten hakija voi myydä nämä taidot uudelle alalle.";
        userMessage = `Vanha ammatti/kokemus: ${data.oldJob}. Uusi tavoiteammatti: ${data.newJob}. Kirjoita suunnitelma suomeksi.`;
        break;

      case "red-flag":
        systemPrompt = "Olet kokenut rekrytoija ja urapsykologi. Hakijalla on taustassaan ns. 'punainen lippu' (esim. potkut, burnout, riitaantuminen, pitkä työttömyys). Kirjoita lyhyt, noin 3 lauseen suora ja rehellinen vastaus haastatteluun. Käännä tämä haaste vakuuttavasti opituksi läksyksi ja vahvuudeksi, ilman selittelyä tai katkeruutta.";
        userMessage = `Ongelma taustassa: ${data.redFlagIssue}. Muotoile tähän täydellinen vastaus suomeksi.`;
        break;

      case "reference":
        systemPrompt = "Olet ammattimainen urakonsultti. Kirjoita lämminhenkinen, kohtelias ja ammattimainen viesti entiselle esimiehelle tai kollegalle, jossa pyydetään häntä suosittelijaksi uutta työnhakua varten. Viestin voi lähettää esim. LinkedInissä tai sähköpostilla.";
        userMessage = `Suosittelijan etunimi: ${data.refPersonName}. Taito, jota toivon hänen erityisesti korostavan minussa: ${data.refSkill}. Kirjoita viesti suomeksi.`;
        break;

      case "headhunter":
        systemPrompt = "Olet vaativa suorahakukonsultti (headhunter). Kirjoita erittäin ytimekäs ja houkutteleva LinkedIn-verkostoitumisviesti, jolla hakija voi lähestyä headhunteria. Älä liitä perinteistä CV-luetteloa, vaan korosta hakijan tuottamaa ROI:ta (Return on Investment) ja arvoa asiakasyrityksille.";
        userMessage = `Nykyinen tittelini/tasoni: ${data.hhRole}. Tuottamani lisäarvo (ROI) yritykselle: ${data.hhValue}. Muotoile pitch suomeksi.`;
        break;

      case "ats-scan":
        systemPrompt = `Olet ATS-asiantuntija (Applicant Tracking System). Vertaa CV:tä työpaikkailmoitukseen ja tunnista osuvuus.
Palauta VAIN validi JSON tässä muodossa:
{"match": numero_0_100, "found": ["löydetty taito tai avainsana", ...], "missing": ["tärkeä puuttuva taito tai avainsana", ...]}
Maksimissaan 6 kohtaa per lista. Ei muuta tekstiä.`;
        userMessage = `CV:\n${data.cvText ?? ""}\n\nTyöpaikkailmoitus:\n${data.jobAd ?? ""}`;
        useJsonFormat = true;
        break;

      case "interview-prep":
        systemPrompt = `Olet haastattelijavalmentaja. Luo 5 realistista, tehtäväkohtaista haastattelukysymystä suomeksi annetun työpaikan perusteella. Vältä geneerisiä kysymyksiä — räätälöi ne nimenomaan tähän rooliin.
Palauta VAIN validi JSON-taulukko:
[{"q": "Kysymys suomeksi", "tip": "Lyhyt vastaamisvinkki suomeksi"}, ...]
Ei muuta tekstiä.`;
        userMessage = `Tehtävä: ${data.jobTitle ?? "Avoin tehtävä"} yrityksessä ${data.company ?? ""}.\nIlmoitusteksti:\n${data.jobAd ?? ""}`;
        useJsonFormat = true;
        break;

      case "skill-translator":
        systemPrompt = "Olet uravalmentaja. Muunna annettu arkikielinen kokemus tai taito ammattimaisiksi työnhakufraaseiksi suomeksi. Palauta pelkkä pilkulla eroteltu lista 5–8 fraasista. Ei selityksiä, ei markdownia, ei numeroita.";
        userMessage = `Muunna nämä taidot/kokemus ammattikielelle: ${data.skillInput ?? ""}`;
        break;

      case "sparring": {
        systemPrompt = `Olet haastattelijavalmentaja ja vedät harjoitushaastattelua suomeksi. Tehtävä: ${data.jobTitle ?? "avoin tehtävä"} yrityksessä ${data.company ?? "tuntematon yritys"}. Kysy yksi realistinen haastattelukysymys kerrallaan. Kun hakija vastaa, anna lyhyt (1–2 lausetta) rakentava palaute ja esitä seuraava kysymys. Ole kannustava mutta haastava. Aloita ensimmäisellä kysymyksellä.`;
        userMessage = data.userMessage ?? "";

        const history: { role: "user" | "assistant"; content: string }[] = (data.chatHistory ?? []).map(
          (m: { role: string; text: string }) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.text,
          })
        );

        const sparringResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: userMessage },
          ],
          temperature: 0.8,
          max_tokens: 300,
        });

        return NextResponse.json({ output: sparringResponse.choices[0].message.content ?? "" });
      }

      default:
        return NextResponse.json({ error: "Tuntematon työkalu" }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      ...(useJsonFormat ? { response_format: { type: "json_object" } } : {}),
    });

    const resultText = response.choices[0].message.content ?? "";
    return NextResponse.json({ output: resultText });

  } catch (error: any) {
    console.error("Tools API Error:", error);
    return NextResponse.json(
      { error: "Virhe työkalun prosessoinnissa." },
      { status: 500 }
    );
  }
}
