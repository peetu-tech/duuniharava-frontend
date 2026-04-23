import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

// Käytetään suoraan antamaasi service keytä ohittamaan tietoturvasäännöt (RLS) taustalla
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4dG5oaXR4YWNocnVkcmNyb3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI4MTA5NSwiZXhwIjoyMDg3ODU3MDk1fQ.s1okmo_ojETisTEyyClAo4EFGwpz8g-Ep39RK7Qge_4"
);

// Tämän saat Vercelin ympäristömuuttujista, kun asetat webhookin Stripessä
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!; 

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (!signature || !webhookSecret) {
      console.error("Webhook signature or secret missing.");
      return NextResponse.json({ error: "Missing configuration" }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Kun tilaus on maksettu onnistuneesti
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id; 

    if (userId) {
      console.log(`Maksu onnistui! Päivitetään käyttäjä ${userId} Pro-tasolle.`);
      
      // Päivitetään Supabase-tietokantaan is_pro = true
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ is_pro: true })
        .eq("id", userId);

      if (error) {
        console.error("Supabase päivitysvirhe:", error);
      }
    }
  }

  // Jos tilaus perutaan tai loppuu, poistetaan Pro-oikeudet (optio tulevaisuuteen)
  // if (event.type === "customer.subscription.deleted") {
  //   // Toteutus vaatii asiakkaan Stripe Customer ID:n tallentamista Supabaseen
  // }

  return NextResponse.json({ received: true });
}
