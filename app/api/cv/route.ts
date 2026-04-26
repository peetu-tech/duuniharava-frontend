import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { buildCreateCvPrompt, buildImproveCvPrompt } from "@/lib/prompts";

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
    const { userId, mode, ...formParams } = body;

    // ==========================================
    // 🔒 PORTINVARTIJA (RAJOITUS: 1 KOKEILU)
    // ==========================================
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
    // ==========================================

    const prompt =
      mode === "improve"
        ? buildImproveCvPrompt({
            cvText: formParams.cvText,
            targetJob: formParams.targetJob,
            education: formParams.education,
            experience: formParams.experience,
            languages: formParams.languages,
            skills: formParams.skills,
            phone: formParams.phone,
            email: formParams.email,
            location: formParams.location,
            cards: formParams.cards,
            hobbies: formParams.hobbies,
            name: formParams.name,
          })
        : buildCreateCvPrompt({
            name: formParams.name,
            phone: formParams.phone,
            email: formParams.email,
            location: formParams.location,
            targetJob: formParams.targetJob,
            education: formParams.education,
            experience: formParams.experience,
            languages: formParams.languages,
            skills: formParams.skills,
            cards: formParams.cards,
            hobbies: formParams.hobbies,
          });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Olet huipputason suomalainen ura-asiantuntija ja rekrytoija. Tehtäväsi on luoda tai parantaa suomalaisia ansioluetteloita (CV). Kirjoitat erinomaista, ytimekästä ja ammattimaista suomea. 

TÄRKEÄT SÄÄNNÖT:
1. TOTUUDENMUKAISUUS: Et koskaan keksi työkokemusta, taitoja tai saavutuksia, joita hakija ei ole itse antanut.
2. EI KLISEITÄ: Älä IKINÄ käytä sanoja: 'innovatiivinen', 'dynaaminen', 'tiimipelaaja', 'tiimityöskentelijä', 'motivoitunut', 'kuten CV:stäni näkyy'. Korvaa nämä aina konkreettisilla teoilla ja asiatekstillä.
3. OIKEINKIRJOITUS: Ole absoluuttisen tarkka. Varmista, että paikkakunnat (esim. Helsinki, Tampere), nimet ja yritykset on kirjoitettu 100 % oikein. Älä muuta käyttäjän antamia nimiä tai paikkoja keksittyihin muotoihin.
4. RAKENNE: Noudata annettua vastausformaattia kirjaimellisesti.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Hallusinaatioiden minimoimiseksi ja tarkkuuden maksimoimiseksi
    });

    const output =
      response.choices[0]?.message?.content?.trim() || "Virhe: mallilta ei saatu vastausta.";

    return NextResponse.json({ output });
  } catch (error: any) {
    console.error("CV route error:", error);
    return NextResponse.json(
      { error: "Palvelimella tapahtui virhe CV:n luonnissa." },
      { status: 500 }
    );
  }
}
