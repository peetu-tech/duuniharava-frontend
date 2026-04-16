import OpenAI from "openai";
import { buildCreateCvPrompt, buildImproveCvPrompt } from "@/lib/prompts";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const mode = body.mode as "improve" | "create";

    let prompt = "";

    if (mode === "improve") {
      prompt = buildImproveCvPrompt({
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
      });
    } else {
      prompt = buildCreateCvPrompt({
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
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const output =
      response.output_text || "Virhe: mallilta ei saatu vastausta.";

    return Response.json({ output });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Palvelimella tapahtui virhe." },
      { status: 500 }
    );
  }
}