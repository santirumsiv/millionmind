import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import type { TierId } from "@millionmind/shared";
import { supabase } from "@/lib/supabase";
import {
  initRevenueCat,
  loginRevenueCat,
  logoutRevenueCat,
} from "@/lib/revenuecat";

interface AuthState {
  session: Session | null;
  user: User | null;
  tier: TierId;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshTier: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  tier: "free",
  loading: false,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    set({ loading: true });

    initRevenueCat();

    const { data } = await supabase.auth.getSession();
    set({ session: data.session, user: data.session?.user ?? null });

    if (data.session?.user) {
      await get().refreshTier();
      await loginRevenueCat(data.session.user.id);
    }

    supabase.auth.onAuthStateChange((event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) {
        void get().refreshTier();
        void loginRevenueCat(session.user.id);
      } else {
        if (event === "SIGNED_OUT") {
          void logoutRevenueCat();
        }
        set({ tier: "free" });
      }
    });

    set({ loading: false, initialized: true });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    await logoutRevenueCat();
    set({ session: null, user: null, tier: "free" });
  },

  refreshTier: async () => {
    const userId = get().user?.id;
    if (!userId) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", userId)
      .single();
    if (!error && data) {
      set({ tier: data.tier as TierId });
    }
  },
}));
