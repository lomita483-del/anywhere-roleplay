import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SAVE_KEY, useGame } from "@/game/store";
import { g } from "@/game/state";
import Scene from "./Scene";
import Hud from "./Hud";

function CloudSaveSync() {
  useEffect(() => {
    let stopped = false;
    let busy = false;
    let userId: string | null = null;

    const sync = async () => {
      if (stopped || busy || !useGame.getState().started) return;
      busy = true;
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session) return;
        userId = session.user.id;
        useGame.getState().save();
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return;
        const state = JSON.parse(raw) as Record<string, unknown>;
        const { error } = await supabase.from("player_save").upsert({
          user_id: userId,
          state: state as unknown as import('@/integrations/supabase/types').Json,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        if (error) console.warn("[Anywhere Roleplay] Cloud save failed:", error.message);
        // Persist the public roleplay profile separately so wallet and coordinates
        // can be queried by other game services without unpacking the full save blob.
        try {
          const current = useGame.getState();
          const profileUpdate = await (supabase as any).from("profiles").upsert({
            id: userId,
            display_name: current.name || "Hustler",
            alias: current.name || "Hustler",
            cash_balance: current.cash,
            bank_balance: current.bank,
            pos_x: g.playerPos.x,
            pos_y: g.playerPos.y,
            pos_z: g.playerPos.z,
            rotation: g.playerYaw,
            current_job: current.activeJob?.type ?? null,
            active_vehicle: g.drivingId,
            outfit: current.outfit,
            updated_at: new Date().toISOString(),
          }, { onConflict: "id" });
          if (profileUpdate.error) console.warn("[Anywhere Roleplay] Profile sync skipped:", profileUpdate.error.message);
        } catch (profileError) {
          console.warn("[Anywhere Roleplay] Profile sync unavailable:", profileError);
        }
      } catch (error) {
        console.warn("[Anywhere Roleplay] Cloud save unavailable:", error);
      } finally {
        busy = false;
      }
    };

    const timer = window.setInterval(() => { void sync(); }, 12000);
    const onPageHide = () => { void sync(); };
    window.addEventListener("pagehide", onPageHide);
    void sync();
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  return null;
}

export default function GameCanvas() {
  return (
    <div className="fixed inset-0 touch-none select-none overflow-hidden">
      <CloudSaveSync />
      <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 55, near: 0.5, far: 420, position: [-14, 6, 2] }} gl={{ antialias: true }}>
        <Scene />
      </Canvas>
      <Hud />
    </div>
  );
}
