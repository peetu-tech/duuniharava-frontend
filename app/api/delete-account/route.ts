import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" as any });

// HUOM: Service Role Key tarvitaan Auth-poistoon (löytyy Supabase Settings -> API)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const { userId, userEmail } = await req.json();

    // 1. STRIPE: Etsitään asiakas ja perutaan tilaukset
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    
    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      const subs = await stripe.subscriptions.list({ customer: customerId });
      
      // Perutaan kaikki aktiiviset tilaukset heti (cancel_at_period_end: false)
      for (const sub of subs.data) {
        await stripe.subscriptions.cancel(sub.id);
      }
    }

    // 2. SUPABASE: Poistetaan käyttäjä Auth-palvelusta
    // Tämä poistaa automaattisesti myös profiilin, jos olet asettanut "Cascade delete"
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) throw authError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Poistovirhe:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
