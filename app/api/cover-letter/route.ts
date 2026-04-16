import OpenAI from "openai";
import { buildCoverLetterPrompt } from "@/lib/prompts";

const client = new OpenAI({
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

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const output =
      response.output_text?.trim() ||
      "HAKEMUS:\nHakemuksen luonti epäonnistui.";

    return Response.json({ output });
  } catch (error) {
    console.error("cover-letter route error:", error);

    return Response.json(
      { error: "Hakemuksen luonti epäonnistui." },
      { status: 500 }
    );
  }
}