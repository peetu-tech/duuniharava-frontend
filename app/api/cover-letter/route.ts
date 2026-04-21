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

    const prompt = buildCoverLetterPrompt({
      name: body.name || "",
      phone: body.phone || "",
      email: body.email || "",
      location: body.location || "",
      targetJob: body.targetJob || "",
      cvText: body.cvText || "",
      jobTitle: body.jobTitle || "",
      companyName: body.companyName || "",
      jobAd: body.jobAd || "",
      tone: safeTone(body.tone),
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Käytetään OpenAI:n lippulaivamallia laadun takaamiseksi
      messages: [
        {
          role: "system",
          content: "Olet huipputason suomalainen rekrytointikonsultti ja uravalmentaja. Kirjoitat täydellistä, inhimillistä ja vaikuttavaa suomea. Et koskaan käytä tekoälylle tyypillisiä kliseitä tai ylisanoja (esim. 'innovatiivinen', 'dynaaminen', 'synergia'). Tekstisi on uskottavaa ja kohdistuu suoraan suomalaiseen työkulttuuriin.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7, // 0.7 antaa luonnollisen ja luovan, mutta ammattimaisen sävyn
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
