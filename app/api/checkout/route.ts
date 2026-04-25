import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userEmail } = body;

    if (!userId) {
      return NextResponse.json({ error: "Käyttäjä-ID puuttuu" }, { status: 400 });
    }

    // Varmistetaan, että saamme varmasti kiinni oikean nettiosoitteen
    const origin = req.headers.get("origin") || "https://duuniharava-frontend.vercel.app";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: userEmail || undefined,
      client_reference_id: userId, // YHDISTÄÄ MAKSUN SUPABASE-KÄYTTÄJÄÄN!
      line_items: [
        {
          // Lisätty !, jotta TypeScript ei valita mahdollisesta undefined-arvosta
          price: process.env.STRIPE_PRICE_ID!, 
          quantity: 1,
        },
      ],
      mode: "subscription",
      // Stripe ohjaa takaisin näihin osoitteisiin maksun jälkeen
      success_url: `${origin}?payment=success`,
      cancel_url: `${origin}?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
