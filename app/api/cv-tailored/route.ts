import OpenAI from "openai";
import { buildTailoredCvPrompt } from "@/lib/prompts";

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

    const prompt = buildTailoredCvPrompt({
      currentCv: body.currentCv,
      jobTitle: body.jobTitle,
      companyName: body.companyName,
      jobAd: body.jobAd,
    });

    // Korjattu OpenAI kutsun syntaksi ja vaihdettu tehokkaaseen gpt-4o malliin
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Käytetään lippulaivamallia parhaan räätälöintilaadun takaamiseksi
      messages: [
        {
          role: "system",
          content:
            "Olet asiantunteva suomalainen ura-asiantuntija, jonka tehtävänä on räätälöidä olemassa oleva CV täydellisesti vastaamaan kohdetyöpaikan vaatimuksia. Sinun on korostettava hakijan aitoa, relevanttia kokemusta ja taitoja. Et koskaan keksi uutta kokemusta tai asioita, joita alkuperäisessä CV:ssä ei ole. Kirjoitat luonnollista, selkeää ja uskottavaa suomea.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5, // Pidetään hieman matalampana (0.5), jotta CV pysyy tiukasti faktoissa
    });

    const output =
      response.choices[0]?.message?.content?.trim() ||
      "CV_BODY:\nKohdistetun CV:n luonti epäonnistui (Tekoäly palautti tyhjän vastauksen).";

    return Response.json({ output });
  } catch (error) {
    console.error("Tailored CV route error:", error);
    return Response.json(
      { error: "Työpaikkaan sopivan CV-version luonti epäonnistui teknisen virheen vuoksi." },
      { status: 500 }
    );
  }
}
