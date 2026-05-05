import { getValidSession } from "./supabaseAuth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

type UsageMetadata = Record<string, unknown>;

export async function trackUsageEvent(
  eventName: string,
  metadata: UsageMetadata = {},
  page: string = "studio",
) {
  if (!supabaseUrl || !supabaseAnonKey) return;

  try {
    const session = await getValidSession();
    if (!session?.user?.id || !session.access_token) return;

    await fetch(`${supabaseUrl}/rest/v1/usage_events`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: session.user.id,
        event_name: eventName,
        page,
        metadata,
      }),
    });
  } catch (error) {
    console.warn("Usage tracking skipped", error);
  }
}
