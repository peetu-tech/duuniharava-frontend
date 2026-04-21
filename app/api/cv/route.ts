import OpenAI from "openai";
import { buildCreateCvPrompt, buildImproveCvPrompt } from "@/lib/prompts";

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
    const mode = body.mode as "improve" | "create";

    const prompt =
      mode === "improve"
        ? buildImproveCvPrompt({
            cvText: body.cvText,
            targetJob: body.targetJob,
            education: body.education,
            experience: body.experience,
            languages: body.languages,
            skills: body.skills,
            phone: body.phone,
            email: body.email,
            location: body.location,
            cards: body.cards,
            hobbies: body.hobbies,
            name: body.name,
          })
        : buildCreateCvPrompt({
            name: body.name,
            phone: body.phone,
            email: body.email,
            location: body.location,
            targetJob: body.targetJob,
            education: body.education,
            experience: body.experience,
            languages: body.languages,
            skills: body.skills,
            cards: body.cards,
            hobbies: body.hobbies,
          });

    // Korjattu OpenAI kutsun syntaksi ja vaihdettu tehokkaaseen gpt-4o malliin
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Olet huipputason suomalainen ura-asiantuntija ja rekrytoija. Tehtäväsi on luoda tai parantaa suomalaisia ansioluetteloita (CV). Kirjoitat erinomaista, ytimekästä ja ammattimaista suomea. Et koskaan keksi työkokemusta, taitoja tai saavutuksia, joita hakija ei ole itse antanut. Vältät tekoälylle tyypillisiä ylisanoja (esim. 'innovatiivinen', 'dynaaminen'). Noudatat annettua vastausformaattia kirjaimellisesti.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5, // 0.5 pitää CV:n faktoissa kiinni, mutta sallii sujuvan kielen
    });

    const output =
      response.choices[0]?.message?.content?.trim() || "Virhe: mallilta ei saatu vastausta.";

    return Response.json({ output });
  } catch (error) {
    console.error("CV route error:", error);
    return Response.json(
      { error: "Palvelimella tapahtui virhe CV:n luonnissa." },
      { status: 500 }
    );
  }
}
