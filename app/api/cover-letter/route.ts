import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { buildCoverLetterPrompt } from "@/lib/prompts";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      return NextResponse.json(
        { error: "OPENAI_API_KEY puuttuu palvelimen ympäristömuuttujista." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { userId, cvText, jobTitle, companyName, jobAd, tone, name, phone, email, location, targetJob } = body;
    const selectedTone = safeTone(tone);

    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("is_pro, api_usage_count")
        .eq("id", userId)
        .single();
        
      if (!profile?.is_pro) {
        if (profile && profile.api_usage_count >= 1) {
          return NextResponse.json({ error: "LIMIT_REACHED" }, { status: 403 });
        }
        
        await supabaseAdmin
          .from("profiles")
          .update({ api_usage_count: (profile?.api_usage_count || 0) + 1 })
          .eq("id", userId);
      }
    }

    const basePrompt = buildCoverLetterPrompt({
      name: name || "",
      phone: phone || "",
      email: email || "",
      location: location || "",
      targetJob: targetJob || "",
      cvText: cvText || "",
      jobTitle: jobTitle || "",
      companyName: companyName || "",
      jobAd: jobAd || "",
      tone: selectedTone,
    });

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
4. RAKENNE JA MUOTOILU: Kirjoita sujuvaa leipätekstiä. ÄLÄ käytä ranskalaisia viivoja (bullet pointteja). Jaa teksti maksimissaan 3-4 lyhyeen kappaleeseen.
5. VAHVA ALOITUS & LOPETUS: Aloita heti asiaan menevällä "koukulla". Lopeta aktiiviseen ja luontevaan toimintakehotteeseen (CTA).
6. ${toneInstructions[selectedTone]}
7. OIKEINKIRJOITUS JA TARKKUUS: Ole absoluuttisen tarkka oikeinkirjoituksesta. Varmista, että paikkakunnat (kuten Helsinki, Tampere), nimet ja yritykset on kirjoitettu täysin oikein. Älä koskaan muuta käyttäjän antamia nimiä tai paikkoja keksittyihin muotoihin (kuten "Heldifin").

HUOM: Aloita vastauksesi AINA täsmälleen sanalla "HAKEMUS:" ja sen jälkeen rivinvaihto. Tämä on kriittistä sovelluksen toiminnan kannalta.`
        },
        {
          role: "user",
          content: basePrompt,
        },
      ],
      temperature: 0.4, // Laskettu tarkkuuden parantamiseksi
    });

    const output =
      response.choices[0]?.message?.content?.trim() ||
      "HAKEMUS:\nHakemuksen luonti epäonnistui. Kokeile uudelleen.";

    return NextResponse.json({ output });
  } catch (error: any) {
    console.error("cover-letter route error:", error);
    return NextResponse.json(
      { error: "Hakemuksen luonti epäonnistui teknisen virheen vuoksi." },
      { status: 500 }
    );
  }
}
