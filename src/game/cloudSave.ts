import { supabase } from "@/integrations/supabase/client";

type CloudSave = { user_id: string; state: Record<string, unknown>; updated_at?: string };

let pendingTimer: ReturnType<typeof setTimeout> | undefined;
let pendingState: Record<string, unknown> | undefined;
let saving = false;

/** Queue a cloud save for authenticated players; local storage remains the instant offline cache. */
export function queueCloudSave(state: Record<string, unknown>) {
  pendingState = state;
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => { void flushCloudSave(); }, 1800);
}

export async function flushCloudSave() {
  if (saving || !pendingState) return;
  const snapshot = pendingState;
  pendingState = undefined;
  saving = true;
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return;
    const row: CloudSave = { user_id: user.id, state: snapshot, updated_at: new Date().toISOString() };
    const { error } = await (supabase as any).from("player_save").upsert(row, { onConflict: "user_id" });
    if (error) throw error;
  } catch (error) {
    // Preserve the latest snapshot and retry later; never block local play.
    pendingState = snapshot;
    console.warn("[CloudSave] Save deferred; local save is safe.", error);
  } finally {
    saving = false;
    if (pendingState && !pendingTimer) pendingTimer = setTimeout(() => { pendingTimer = undefined; void flushCloudSave(); }, 8000);
  }
}

/** Return the signed-in player's cloud state, if one exists. */
export async function readCloudSave(): Promise<{ state: Record<string, unknown>; updatedAt: number } | null> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await (supabase as any)
      .from("player_save").select("state,updated_at").eq("user_id", auth.user.id).maybeSingle();
    if (error || !data?.state || typeof data.state !== "object") return null;
    return { state: data.state as Record<string, unknown>, updatedAt: Date.parse(data.updated_at ?? "") || 0 };
  } catch (error) {
    console.warn("[CloudSave] Cloud restore unavailable; using local save.", error);
    return null;
  }
}
