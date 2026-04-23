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

    // Määritellään sävyt huomattavasti tarkemmin, jotta tekoäly ymmärtää nyanssit
    const toneInstructions = {
      professional: "SÄVY: Asiallinen, ytimekäs ja asiantunteva. Keskity puhtaasti siihen, miten hakijan aiempi kokemus ja taidot tuovat yritykselle välitöntä hyötyä. Älä jaarittele.",
      warm: "SÄVY: Ihmisläheinen, helposti lähestyttävä ja innostunut. Tuo esiin hakijan persoonaa, tiimitaitoja ja kykyä tulla toimeen erilaisten ihmisten kanssa. Sopii erinomaisesti kulttuuripainotteisiin yrityksiin.",
      sales: "SÄVY: Itsevarma, tuloshakuinen ja rohkea. Aloita erittäin vahvalla koukulla. Keskity saavutuksiin, lukuihin ja tavoitteiden ylittämiseen. Älä kuitenkaan kuulosta ylimieliseltä."
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Olet Suomen kokenein rekrytoija ja taitavin copywriter. Kirjoitat huipputason työhakemuksia, jotka erottuvat massasta edukseen olemalla aitoja, suoria ja vakuuttavia.

TÄRKEIMMÄT SÄÄNNÖT, JOITA SINUN ON NOUDATETTAVA:
1. KIELLETYT KLISEET: Älä IKINÄ käytä sanoja tai fraaseja kuten "Olen erittäin motivoitunut", "Innovatiivinen", "Dynaaminen", "Kuten CV:stäni näkyy", "Olen tiimipelaaja" tai "Kirjoitan hakeakseni".
2. SUOMALAINEN TYÖKULTTUURI: Ole suorapuheinen, rehellinen ja itsevarma, mutta vältä jenkkityylistä ylimielisyyttä ja liiallista hehkutusta.
3. TOTUUDENMUKAISUUS: ÄLÄ keksi kokemusta, taitoja tai numeroita, joita hakija ei ole antanut. Käytä vain annettua dataa ja yhdistä se älykkäästi työpaikkailmoituksen tarpeisiin.
4. RAKENNE JA MUOTOILU: Kirjoita sujuvaa leipätekstiä. ÄLÄ käytä ranskalaisia viivoja (bullet pointteja). Jaa teksti maksimissaan 3-4 lyhyeen kappaleeseen. Kukaan ei jaksa lukea pitkiä tekstimassoja.
5. VAHVA ALOITUS & LOPETUS: Aloita heti asiaan menevällä "koukulla" (esim. hakijan paras saavutus, ydinosaaminen tai miksi hän on täydellinen match juuri tähän rooliin). Lopeta aktiiviseen ja luontevaan toimintakehotteeseen (CTA), esim. ehdottamalla lyhyttä puhelua.
6. ${toneInstructions[selectedTone]}

HUOM: Aloita vastauksesi AINA täsmälleen sanalla "HAKEMUS:" ja sen jälkeen rivinvaihto. Tämä on kriittistä sovelluksen toiminnan kannalta.`
        },
        {
          role: "user",
          content: basePrompt,
        },
      ],
      // Lämpötila 0.6 pitää tekstin erittäin asiallisena ja estää tekoälyä hallusinoimasta omiaan
      temperature: 0.6, 
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
