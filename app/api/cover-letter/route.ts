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
      cvText: body.cvText || "",
      jobTitle: body.jobTitle || "",
      companyName: body.companyName || "",
      jobAd: body.jobAd || "",
      tone: body.tone || "professional",
    });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const output =
      response.output_text || "HAKEMUS:\nHakemuksen luonti epäonnistui.";

    return Response.json({ output });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Hakemuksen luonti epäonnistui." },
      { status: 500 }
    );
  }
}