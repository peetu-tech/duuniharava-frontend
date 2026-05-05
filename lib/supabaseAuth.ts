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
  expires_at?: number;
  token_type: string;
  user: {
    id: string;
    email?: string;
  };
};

const SESSION_KEY = "duuniharava.auth.session";
const REFRESH_SKEW_SECONDS = 60;
let refreshPromise: Promise<AuthSession | null> | null = null;

function normalizeSession(session: AuthSession): AuthSession {
  if (!session.expires_at && session.expires_in) {
    return {
      ...session,
      expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
    };
  }

  return session;
}

function isSessionExpiringSoon(session: AuthSession) {
  if (!session.expires_at) return false;
  return session.expires_at - REFRESH_SKEW_SECONDS <= Math.floor(Date.now() / 1000);
}

export function saveSession(session: AuthSession) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(normalizeSession(session)));
  }
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return normalizeSession(JSON.parse(raw) as AuthSession);
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export async function refreshSession(session?: AuthSession | null) {
  assertEnv();

  const currentSession = session || getSession();
  if (!currentSession?.refresh_token) return null;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify({ refresh_token: currentSession.refresh_token }),
  });

  const data = await res.json();
  if (!res.ok) {
    clearSession();
    throw new Error(data?.msg || data?.error_description || "Istunnon päivitys epäonnistui.");
  }

  const nextSession = normalizeSession(data as AuthSession);
  saveSession(nextSession);
  return nextSession;
}

export async function getValidSession(forceRefresh = false): Promise<AuthSession | null> {
  const session = getSession();
  if (!session) return null;

  if (!forceRefresh && !isSessionExpiringSoon(session)) {
    return session;
  }

  if (!refreshPromise) {
    refreshPromise = refreshSession(session).finally(() => {
      refreshPromise = null;
    });
  }

  try {
    return await refreshPromise;
  } catch {
    return null;
  }
}

export async function signInWithPassword(email: string, password: string) {
  assertEnv();

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

  const session = normalizeSession(data as AuthSession);
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
