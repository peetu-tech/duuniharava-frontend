import OpenAI from "openai";
import { buildCoverLetterPrompt } from "@/lib/prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type CoverLetterTone = "professional" | "warm" | "sales";

function safeTone(value: unknown): CoverLetterTone {
  if (value === "warm" || value === "sales" || value === "professional") {
    return value;
  }
  return "professional";
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY puuttuu palvelimen ympäristömuuttujista." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const selectedTone = safeTone(body.tone);

    const basePrompt = buildCoverLetterPrompt({
      name: body.name || "",
      phone: body.phone || "",
      email: body.email || "",
      location: body.location || "",
      targetJob: body.targetJob || "",
      cvText: body.cvText || "",
      jobTitle: body.jobTitle || "",
      companyName: body.companyName || "",
      jobAd: body.jobAd || "",
      tone: selectedTone,
    });

    // Määritellään sävyt todella tarkasti suoraan täällä, jotta tekoäly ymmärtää eron
    const toneInstructions = {
      professional: "Kirjoita asiallinen, ytimekäs ja skarppi hakemus. Fokusoi vahvasti ammatilliseen osaamiseen, faktoihin ja siihen, miten hakijan aiempi kokemus ratkaisee yrityksen ongelmia.",
      warm: "Kirjoita lämmin, ihmisläheinen ja innostunut hakemus. Tuo esiin hakijan persoonaa, tiimitaitoja ja aitoa paloa kyseistä yritystä kohtaan. Pidä teksti kuitenkin ammattimaisena.",
      sales: "Kirjoita erittäin myyvä, itsevarmuutta huokuva ja tuloshakuinen hakemus. Aloita todella rohkealla ja erottuvalla 'hookilla'. Keskity numeroihin, saavutuksiin ja siihen, mitä viivan alle jää."
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Olet Suomen kokenein rekrytointikonsultti ja huipputason copywriter. Tehtäväsi on kirjoittaa täydellinen, 100% aidon ihmisen kuuloinen ja moderni työhakemus.

TÄRKEÄT SÄÄNNÖT, JOITA SINUN ON NOUDATETTAVA:
1. KIELLETYT KLISEET: Älä KOSKAAN käytä fraaseja kuten "Olen erittäin motivoitunut", "Kirjoitan hakeakseni", "Innovatiivinen", "Dynaaminen", "Kuten CV:stäni käy ilmi" tai "Olen tiimipelaaja".
2. VAHVA ALOITUS: Aloita HETI kiinnostavalla "Hookilla" tai tuloksella. Älä tuhlaa ensimmäistä lausetta itsestäänselvyyksiin (kuten siihen, mitä paikkaa hakee).
3. LISÄARVO: Keskity siihen, mitä konkreettista hyötyä hakija tuo yritykselle. Yhdistä CV:n faktat työpaikkailmoituksen tarpeisiin.
4. RAKENNE: Pidä teksti napakkana. Maksimissaan 3-4 lyhyttä, iskevää kappaletta. Kukaan ei jaksa lukea romaania.
5. LOPETUS: Päätä luontevaan ja aktiiviseen toimintakehotteeseen (Call to Action), esim. tapaamisen ehdottamiseen.
6. SÄVY: ${toneInstructions[selectedTone]}

HUOM: Aloita vastauksesi AINA täsmälleen sanalla "HAKEMUS:" ja sen jälkeen rivinvaihto. Tämä on kriittistä sovelluksen toiminnan kannalta.`
        },
        {
          role: "user",
          content: basePrompt,
        },
      ],
      temperature: 0.65, // Lämptila 0.65 pitää tekstin luovana mutta estää tekoälymäisen "hallusinoinnin" ja jaarittelun
    });

    const output =
      response.choices[0]?.message?.content?.trim() ||
      "HAKEMUS:\nHakemuksen luonti epäonnistui. Kokeile uudelleen.";

    return Response.json({ output });
  } catch (error) {
    console.error("cover-letter route error:", error);

    return Response.json(
      { error: "Hakemuksen luonti epäonnistui teknisen virheen vuoksi." },
      { status: 500 }
    );
  }
}
