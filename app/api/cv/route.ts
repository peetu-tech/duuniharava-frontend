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
        // MUUTETTU: Raja laskettu kolmesta yhteen (1)
        if (profile && profile.api_usage_count >= 1) {
          return NextResponse.json({ error: "LIMIT_REACHED" }, { status: 403 });
        }
        
        // Kasvatetaan laskuria heti onnistuneen tarkistuksen jälkeen
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
          // KORJATTU: Lisätty erittäin tiukka sääntö oikeinkirjoituksesta ja keksityistä nimistä
          content: "Olet huipputason suomalainen ura-asiantuntija ja rekrytoija. Tehtäväsi on luoda tai parantaa suomalaisia ansioluetteloita (CV). Kirjoitat erinomaista, ytimekästä ja ammattimaista suomea. Et koskaan keksi työkokemusta, taitoja tai saavutuksia, joita hakija ei ole itse antanut. Vältät tekoälylle tyypillisiä ylisanoja (esim. 'innovatiivinen', 'dynaaminen').\n\nTÄRKEÄ SÄÄNTÖ: Olet absoluuttisen tarkka oikeinkirjoituksesta. Varmista, että kaikki erisnimet, kaupungit (esim. Helsinki) ja yritykset on kirjoitettu 100% oikein ja kieliopillisesti täydellisesti. Älä koskaan muuta käyttäjän syöttämiä nimiä väärään muotoon. Noudatat annettua vastausformaattia kirjaimellisesti.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      // KORJATTU: Lämpötila laskettu 0.5 -> 0.3 hallusinaatioiden estämiseksi
      temperature: 0.3,
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
