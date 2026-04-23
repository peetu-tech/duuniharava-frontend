import { NextResponse } from "next/server";
import Stripe from "stripe";

// Alustetaan Stripe
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: userEmail || undefined, // Esitäyttää asiakkaan sähköpostin maksuikkunaan
      client_reference_id: userId, // TÄMÄ ON KRIITTINEN! Yhdistää maksun Supabase-käyttäjään
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Esim. price_1Pxxxxxx (Se jonka kopioit aiemmin)
          quantity: 1,
        },
      ],
      mode: "subscription", // Kuukausitilaus
      success_url: `${req.headers.get("origin")}/studio?payment=success`,
      cancel_url: `${req.headers.get("origin")}/studio?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
