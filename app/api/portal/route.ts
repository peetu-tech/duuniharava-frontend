import { NextResponse } from "next/server";
import Stripe from "stripe";

// Alustetaan Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any, // Käytä uusinta versiota tai jätä tämä
});

export async function POST(req: Request) {
  try {
    const { userEmail } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ error: "Sähköposti puuttuu" }, { status: 400 });
    }

    // 1. Etsitään asiakas Stripestä sähköpostin perusteella
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: "Asiakasta ei löytynyt Stripestä tällä sähköpostilla." },
        { status: 404 }
      );
    }

    const customerId = customers.data[0].id;

    // 2. Luodaan turvallinen linkki Stripen Customer Portaliin
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.get("origin")}/studio`, // Mihin palataan, kun asiakas poistuu portaalista
    });

    // Palautetaan portaalin URL frontendille
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Virhe portaalin luonnissa:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
