import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { buildTailoredCvPrompt } from "@/lib/prompts";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY puuttuu palvelimen ympäristömuuttujista." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { userId, ...formParams } = body;

    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("is_pro, api_usage_count")
        .eq("id", userId)
        .single();
        
      if (!profile?.is_pro) {
        if (profile && profile.api_usage_count >= 1) {
          return NextResponse.json({ error: "LIMIT_REACHED" }, { status: 403 });
        }
        
        await supabaseAdmin
          .from("profiles")
          .update({ api_usage_count: (profile?.api_usage_count || 0) + 1 })
          .eq("id", userId);
      }
    }

    const prompt = buildTailoredCvPrompt({
      currentCv: body.currentCv,
      jobTitle: body.jobTitle,
      companyName: body.companyName,
      jobAd: body.jobAd,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Olet asiantunteva suomalainen ura-asiantuntija, jonka tehtävänä on räätälöidä olemassa oleva CV täydellisesti vastaamaan kohdetyöpaikan vaatimuksia. Sinun on korostettava hakijan aitoa, relevanttia kokemusta ja taitoja. Et koskaan keksi uutta kokemusta. Kirjoitat luonnollista, selkeää ja uskottavaa suomea. TÄRKEÄÄ: Ole absoluuttisen tarkka oikeinkirjoituksesta. Älä koskaan kirjoita nimiä tai kaupunkeja (kuten Helsinki) väärin tai muuta niitä outoihin muotoihin. Pidä kaikki faktatiedot täsmälleen sellaisina kuin ne on annettu.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Laskettu hallusinaatioiden minimoimiseksi
    });

    const output =
      response.choices[0]?.message?.content?.trim() ||
      "CV_BODY:\nKohdistetun CV:n luonti epäonnistui (Tekoäly palautti tyhjän vastauksen).";

    return NextResponse.json({ output });
  } catch (error: any) {
    console.error("Tailored CV route error:", error);
    return NextResponse.json(
      { error: "Työpaikkaan sopivan CV-version luonti epäonnistui teknisen virheen vuoksi." },
      { status: 500 }
    );
  }
}
