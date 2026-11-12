"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_PREFS, readUserPrefs, type UserPrefs } from "@/lib/prefs";

/** Account preferences (user_metadata.prefs) with a save helper. */
export function usePrefs() {
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (cancelled) return;
        setPrefs(readUserPrefs(data.user?.user_metadata));
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (patch: Partial<UserPrefs>) => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const next = { ...readUserPrefs(data.user?.user_metadata), ...patch };
    const { error } = await supabase.auth.updateUser({ data: { prefs: next } });
    if (error) throw error;
    setPrefs(next);
    return next;
  }, []);

  return { prefs, loaded, save };
}
