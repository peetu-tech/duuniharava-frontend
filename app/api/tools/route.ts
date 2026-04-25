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

    // Valitaan oikea ohjeistus (prompt) sen mukaan, mitä työkalua käytetään
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

      default:
        return NextResponse.json({ error: "Tuntematon työkalu" }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
    });

    const resultText = response.choices[0].message.content;

    return NextResponse.json({ output: resultText });

  } catch (error: any) {
    console.error("Tools API Error:", error);
    return NextResponse.json(
      { error: "Virhe työkalun prosessoinnissa." },
      { status: 500 }
    );
  }
}
