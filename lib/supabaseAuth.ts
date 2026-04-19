const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function assertEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase envit puuttuvat.");
  }
}

const SESSION_KEY = "duuniharava.auth.session";

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function saveSession(session: any) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function signInWithPassword(email: string, password: string) {
  assertEnv();

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.msg || data?.error_description || "Kirjautuminen epäonnistui.");
  saveSession(data);
  return data;
}

export async function signUp(email: string, password: string, name?: string) {
  assertEnv();

  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({
      email,
      password,
      data: name ? { full_name: name } : undefined,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.msg || data?.error_description || "Tilin luonti epäonnistui.");

  if (data?.session || data?.user?.email_confirmed_at) {
    return signInWithPassword(email, password);
  }
  return null;
}
