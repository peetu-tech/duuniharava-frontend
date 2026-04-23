const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function assertEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase envit puuttuvat.");
  }
}

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email?: string;
  };
};

const SESSION_KEY = "duuniharava.auth.session";

export function saveSession(session: AuthSession) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export async function signInWithPassword(email: string, password: string) {
  assertEnv();

  // Käytetään as string -määritystä, jotta TypeScript tietää näiden olevan olemassa
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.msg || data?.error_description || "Kirjautuminen epäonnistui.");
  }

  const session = data as AuthSession;
  saveSession(session);
  return session;
}

export async function signUp(email: string, password: string, name?: string) {
  assertEnv();

  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify({
      email,
      password,
      data: name ? { full_name: name } : undefined,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.msg || data?.error_description || "Tilin luonti epäonnistui.");
  }

  if (data?.user?.email_confirmed_at || data?.session) {
    return signInWithPassword(email, password);
  }

  return null;
}
