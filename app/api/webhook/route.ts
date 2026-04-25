import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Alustetaan Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

export async function POST(req: Request) {
  // 1. Luetaan raw body, jonka Stripe vaatii allekirjoituksen tarkistukseen
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  // 2. Haetaan salaisuudet turvallisesti ympäristömuuttujista
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // HUOM: Varmista, että olet lisännyt tämän avaimen Vercelin asetuksiin!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

  // Varmistetaan, että kaikki tarvittavat avaimet löytyvät Vercelistä
  if (!signature || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error("Puuttuvia ympäristömuuttujia tai Stripe-allekirjoitus puuttuu.");
    return NextResponse.json({ error: "Missing configuration" }, { status: 400 });
  }

  let event: Stripe.Event;

  // 3. Tarkistetaan, että viesti tuli aidosti Stripeltä
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // 4. Käsitellään onnistunut maksu
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id; 

    if (userId) {
      console.log(`Maksu onnistui! Päivitetään käyttäjä ${userId} Pro-tasolle.`);
      
      // Alustetaan Supabase Admin vasta täällä
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      // Päivitetään Supabase-tietokantaan is_pro = true
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ is_pro: true })
        .eq("id", userId);

      if (error) {
        console.error("Supabase päivitysvirhe:", error);
        return NextResponse.json({ error: "Database update error" }, { status: 500 });
      }
      
      console.log("Käyttäjän päivitys onnistui!");
    } else {
      console.error("Maksu meni läpi, mutta client_reference_id puuttui!");
    }
  }

  return NextResponse.json({ received: true });
}
