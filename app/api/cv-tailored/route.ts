import OpenAI from "openai";
import { buildTailoredCvPrompt } from "@/lib/prompts";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt = buildTailoredCvPrompt({
      currentCv: body.currentCv || "",
      jobTitle: body.jobTitle || "",
      companyName: body.companyName || "",
      jobAd: body.jobAd || "",
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
      { error: "Työpaikkaan kohdistetun CV:n luonti epäonnistui." },
      { status: 500 }
    );
  }
}