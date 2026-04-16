import OpenAI from "openai";
import { buildCreateCvPrompt, buildImproveCvPrompt } from "@/lib/prompts";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type CvMode = "improve" | "create";

function safeMode(value: unknown): CvMode {
  return value === "improve" ? "improve" : "create";
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
    const mode = safeMode(body.mode);

    const prompt =
      mode === "improve"
        ? buildImproveCvPrompt({
            cvText: body.cvText || "",
            targetJob: body.targetJob || "",
            education: body.education || "",
            experience: body.experience || "",
            languages: body.languages || "",
            skills: body.skills || "",
            phone: body.phone || "",
            email: body.email || "",
            location: body.location || "",
            cards: body.cards || "",
            hobbies: body.hobbies || "",
            name: body.name || "",
          })
        : buildCreateCvPrompt({
            name: body.name || "",
            phone: body.phone || "",
            email: body.email || "",
            location: body.location || "",
            targetJob: body.targetJob || "",
            education: body.education || "",
            experience: body.experience || "",
            languages: body.languages || "",
            skills: body.skills || "",
            cards: body.cards || "",
            hobbies: body.hobbies || "",
          });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const output =
      response.output_text?.trim() ||
      "KUNTOTARKASTUS:\n-\n\nMUUTOSRAPORTTI:\n1. CV:n luonti epäonnistui.\n\nCV_BODY:\n";

    return Response.json({ output });
  } catch (error) {
    console.error("cv route error:", error);

    return Response.json(
      { error: "Palvelimella tapahtui virhe CV:n luonnissa." },
      { status: 500 }
    );
  }
}