import OpenAI from "openai";
import { buildCoverLetterPrompt } from "@/lib/prompts";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt = buildCoverLetterPrompt({
      name: body.name || "",
      phone: body.phone || "",
      email: body.email || "",
      location: body.location || "",
      targetJob: body.targetJob || "",
      jobTitle: body.jobTitle || "",
      companyName: body.companyName || "",
      jobAd: body.jobAd || "",
      education: body.education || "",
      experience: body.experience || "",
      languages: body.languages || "",
      skills: body.skills || "",
      cards: body.cards || "",
      hobbies: body.hobbies || "",
      cvText: body.cvText || "",
    });

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