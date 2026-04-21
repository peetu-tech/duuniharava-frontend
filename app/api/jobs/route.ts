import OpenAI from "openai";
import { buildJobSuggestionsPrompt } from "@/lib/prompts";

// Huom! Ei "use client" -tunnistetta, koska tämä on backend/API-reitti.

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY puuttuu palvelimen ympäristömuuttujista." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const prompt = buildJobSuggestionsPrompt({
      desiredRoles: body.desiredRoles,
      desiredLocation: body.desiredLocation,
      workType: body.workType,
      shiftPreference: body.shiftPreference,
      salaryWish: body.salaryWish,
      keywords: body.keywords,
      targetJob: body.targetJob,
      experience: body.experience,
      skills: body.skills,
      languages: body.languages,
    });

    // Lasketaan tarkka nykyhetki ja realistiset tulevaisuuden deadlinet
    const todayDate = new Date();
    const todayString = todayDate.toLocaleDateString("fi-FI");
    
    const futureDate1 = new Date(todayDate);
    futureDate1.setDate(futureDate1.getDate() + 10); // Vähintään 10 päivää hakuaikaa
    
    const futureDate2 = new Date(todayDate);
    futureDate2.setDate(futureDate2.getDate() + 25); // Max 25 päivää hakuaikaa

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Lippulaivamalli parhaan päättelykyvyn takaamiseksi
      response_format: { type: "json_object" }, // Pakotetaan konekielinen JSON-vastaus
      messages: [
        {
          role: "system",
          content: `Olet huipputason suomalainen rekrytointikonsultti ja ohjelmistoarkkitehti.
Tehtäväsi on analysoida käyttäjän profiili ja generoida 4-6 erittäin realistista, juuri hänelle räätälöityä työpaikkaehdotusta.

AIKASÄÄNTÖ: Tänään on ${todayString}. Kaikkien deadline-päivämäärien on oltava tulevaisuudessa, aikavälillä ${futureDate1.toLocaleDateString("fi-FI")} - ${futureDate2.toLocaleDateString("fi-FI")}. Muotoile deadline muodossa YYYY-MM-DD.

REALISMI & LAATU:
- Simuloi aidot suomalaiset työpaikkailmoitukset (lähteinä esim. Duunitori, Oikotie Työpaikat, LinkedIn, Työmarkkinatori).
- Käytä aitojen suomalaisten tai Suomessa toimivien yritysten nimiä, jotka sopivat alaan (esim. Kesko, Elisa, Nordea, Attendot, paikalliset rakennusliikkeet tms.).
- Palkka-arvioiden (salary) tulee olla erittäin realistisia ja noudattaa Suomen yleistä palkkatasoa.
- 'matchScore' (numero 50-99) pitää laskea OIKEASTI sen perusteella, miten hyvin käyttäjän syöttämät taidot kohtaavat ilmoituksen keksityt vaatimukset.
- 'adText' pitää olla pitkä ja uskottava: kerro yrityksestä, tehtävästä, vaatimuksista ja tarjotuista eduista.

PALAUTUSMUOTO:
Palauta AINOASTAAN validi JSON-objekti, jolla on avain "jobs". "jobs" sisältää taulukon (array) työpaikkaobjekteja.

JSON-rakenne jokaiselle työpaikalle:
{
  "title": "String (Ammattinimike)",
  "company": "String (Yrityksen nimi)",
  "location": "String (Kaupunki/Alue)",
  "type": "String (Esim. Kokoaikainen, Vakituinen)",
  "summary": "String (Myyvä 1-2 lauseen tiivistelmä paikasta)",
  "adText": "String (Kokonainen ja pitkä työpaikkailmoituksen teksti)",
  "url": "String (Keksitty uskottava linkki, esim. https://duunitori.fi/tyopaikat/123456)",
  "whyFit": "String (Henkilökohtainen perustelu, miksi hakijan profiili sopii tähän)",
  "source": "String (Esim. Duunitori, Oikotie)",
  "matchScore": Number (Kokonaisluku 50-99),
  "status": "interested",
  "priority": "String (high, medium, tai low)",
  "salary": "String (Esim. 2500 - 3000 €/kk)",
  "appliedAt": "",
  "deadline": "String (YYYY-MM-DD)",
  "notes": "",
  "contactPerson": "String (Keksitty nimi ja titteli)",
  "contactEmail": "String (Keksitty sähköposti muodossa etunimi.sukunimi@yritys.fi)",
  "companyWebsite": "String (Yrityksen kotisivu URL)"
}`
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6, // Pidetään tasapainossa luovuuden (ilmoitusten tekstit) ja logiikan (JSON-formaatti) välillä
    });

    const rawOutput = response.choices[0]?.message?.content?.trim() || '{"jobs": []}';
    
    // Varmistetaan, että data puretaan oikein JSON-muodosta arrayksi
    let outputArray = "[]";
    try {
      const parsedJson = JSON.parse(rawOutput);
      if (parsedJson.jobs && Array.isArray(parsedJson.jobs)) {
        outputArray = JSON.stringify(parsedJson.jobs);
      } else {
        outputArray = rawOutput;
      }
    } catch (e) {
      console.error("JSON parse error from AI:", e);
      outputArray = "[]";
    }

    return Response.json({ output: outputArray });
  } catch (error) {
    console.error("Jobs route error:", error);
    return Response.json(
      { error: "Työpaikkaehdotusten haku epäonnistui teknisen virheen vuoksi." },
      { status: 500 }
    );
  }
}
