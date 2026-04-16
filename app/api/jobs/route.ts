import OpenAI from "openai";
import { buildJobSuggestionsPrompt } from "@/lib/prompts";

const client = new OpenAI({
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

    const prompt = buildJobSuggestionsPrompt({
      desiredRoles: body.desiredRoles || "",
      desiredLocation: body.desiredLocation || "",
      workType: body.workType || "",
      shiftPreference: body.shiftPreference || "",
      salaryWish: body.salaryWish || "",
      keywords: body.keywords || "",
      targetJob: body.targetJob || "",
      experience: body.experience || "",
      skills: body.skills || "",
      languages: body.languages || "",
    });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const output = response.output_text?.trim() || "[]";

    return Response.json({ output });
  } catch (error) {
    console.error("jobs route error:", error);

    return Response.json(
      { error: "Työpaikkaehdotusten haku epäonnistui." },
      { status: 500 }
    );
  }
}