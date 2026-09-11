import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/integrations/supabase-external/client";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  default_address: string | null;
  default_method: string | null;
  is_admin: boolean;
};

type AuthContextValue = {
  client: SupabaseClient | null;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    getSupabaseClient()
      .then(async (c) => {
        if (cancelled || !c) {
          setLoading(false);
          return;
        }
        setClient(c);
        const { data } = await c.auth.getSession();
        if (cancelled) return;
        setSession(data.session);
        setLoading(false);
        const sub = c.auth.onAuthStateChange((_event, next) => {
          setSession(next);
        });
        unsubscribe = () => sub.data.subscription.unsubscribe();
      })
      .catch(() => setLoading(false));

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  const loadProfile = useCallback(async () => {
    if (!client || !userId) {
      setProfile(null);
      return;
    }
    const { data } = await client
      .from("profiles")
      .select("id, full_name, phone, default_address, default_method, is_admin")
      .eq("id", userId)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  }, [client, userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await client?.auth.signOut();
    setProfile(null);
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      client,
      session,
      user: session?.user ?? null,
      profile,
      loading,
      refreshProfile: loadProfile,
      signOut,
    }),
    [client, session, profile, loading, loadProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function initials(nameOrEmail: string | null | undefined) {
  if (!nameOrEmail) return "?";
  const cleaned = nameOrEmail.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}
