import { NextResponse } from "next/navigation";
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
        systemPrompt = "Olet asiantunteva uravalmentaja. Kirjoita lyhyt, iskevä ja ammattimainen lähestymisviesti (esim. LinkedIn-viesti tai sähköposti) päättäjälle. Älä kerjää töitä, vaan tarjoa arvoa.";
        userMessage = `Kohdeala/Yritys: ${data.targetIndustry}. Oma ydinosaamiseni: ${data.userCoreSkill}. Kirjoita valmis viesti.`;
        break;

      case "calling-script":
        systemPrompt = "Olet myyntivalmentaja. Kirjoita erittäin lyhyt ja luonnollinen puhelukäsikirjoitus työnhakijalle, joka soittaa rekrytoijalle. Käytä askelia: 1. Jäänmurtaja, 2. Koukku (kysymys yrityksen haasteista), 3. Vastaus. Kirjoita se puhekielellä.";
        userMessage = `Kohdeyritys: ${data.callCompany}. Haettava rooli: ${data.callRole}.`;
        break;

      case "salary-negotiation":
        systemPrompt = "Olet neuvotteluekspertti. Kirjoita asiallinen, mutta jämäkkä sähköpostivastaus palkkatarjoukseen. Tavoitteena on nostaa tarjousta kohti hakijan tavoitepalkkaa, perustellen sitä tuodulla lisäarvolla.";
        userMessage = `Tarjottu palkka: ${data.offeredSalary}€. Oma tavoitepalkka: ${data.targetSalary}€. Muotoile vastatarjous.`;
        break;

      case "linkedin-magnet":
        systemPrompt = "Olet LinkedIn-asiantuntija. Kirjoita kaksi asiaa: 1. Lyhyt, arvoa korostava 'Tietoja' (About) teksti profiiliin. 2. Innostava postaus uutisvirtaan uuden työn etsimisestä. Älä käytä liikaa emojeita, pidä sävy asiantuntevana.";
        userMessage = `Tavoiteltu rooli: ${data.linkedInRole}.`;
        break;

      case "career-pivot":
        systemPrompt = "Olet uranvaihdoksen asiantuntija. Hakija on vaihtamassa alaa. Etsi piileviä, siirrettäviä taitoja vanhasta ammatista ja kerro 3 kohdan suunnitelma, miten myydä nämä taidot uudelle alalle.";
        userMessage = `Vanha ammatti: ${data.oldJob}. Uusi tavoiteammatti: ${data.newJob}.`;
        break;

      case "red-flag":
        systemPrompt = "Olet kokenut rekrytoija. Hakijalla on taustassaan 'punainen lippu' (esim. potkut, tauko). Kirjoita lyhyt, noin 3 lauseen suora vastaus haastatteluun, joka kääntää tämän haasteen opituksi läksyksi ja vahvuudeksi.";
        userMessage = `Ongelma taustassa: ${data.redFlagIssue}. Käännä tämä positiiviseksi oppimiskokemukseksi.`;
        break;

      case "reference":
        systemPrompt = "Kirjoita lämminhenkinen, mutta ammattimainen viesti entiselle esimiehelle tai kollegalle, jossa pyydetään häntä suosittelijaksi uutta työnhakua varten.";
        userMessage = `Suosittelijan etunimi: ${data.refPersonName}. Taito, jota toivon hänen korostavan: ${data.refSkill}.`;
        break;

      case "headhunter":
        systemPrompt = "Olet suorahakukonsultti. Kirjoita erittäin ytimekäs LinkedIn-verkostoitumisviesti headhunterille. Älä liitä perinteistä CV:tä, vaan korosta hakijan tuottamaa ROI:ta ja arvoa.";
        userMessage = `Nykyinen tittelini: ${data.hhRole}. Tuottamani lisäarvo yritykselle: ${data.hhValue}. Muotoile pitch.`;
        break;

      default:
        return NextResponse.json({ error: "Tuntematon työkalu" }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Käytetään edullista ja nopeaa mallia
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
