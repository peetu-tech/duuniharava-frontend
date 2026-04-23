import { NextResponse } from "next/server";
import Stripe from "stripe";

// Alustetaan Stripe salaisella avaimella
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

export async function POST(req: Request) {
  try {
    // Luodaan maksuistunto
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // Voit lisätä "mobilepay" myöhemmin Live-tilassa
      line_items: [
        {
          // Käytetään sitä Price ID:tä, jonka juuri hait
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription", // Koska kyseessä on jatkuva tilaus (9,90€/kk)
      
      // Mihin käyttäjä palaa maksun jälkeen?
      success_url: `${req.headers.get("origin")}/studio?session_id={CHECKOUT_SESSION_ID}&payment=success`,
      cancel_url: `${req.headers.get("origin")}/studio?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
