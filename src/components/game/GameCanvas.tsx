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
          const profileUpdate = await (supabase as any).from("profiles").update({
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
            needs: current.needs,
            background: { neighbourhood: "Yaba / Surulere", family: "Mainland family", education: "Secondary school" },
            character_traits: [],
            skills: {
              driving: 1 + current.jobStats.drives,
              trading: 1 + current.jobStats.trades,
              repairs: 1,
              hustling: 1 + current.jobStats.deliveries,
              negotiation: 1 + current.jobStats.patrols,
            },
            reputation: {
              score: current.jobStats.deliveries + current.jobStats.drives + current.jobStats.trades + current.jobStats.patrols,
              tier: "Newcomer",
            },
            updated_at: new Date().toISOString(),
          }).eq("id", userId);
          if (profileUpdate.error) console.warn("[Anywhere Roleplay] Profile sync skipped:", profileUpdate.error.message);
          if (current.owned.length) {
            const vehicleRows = current.owned.map((model) => ({
              owner_id: userId,
              vehicle_type: model,
              plate_number: "LR-" + userId!.slice(0, 4).toUpperCase() + "-" + model.toUpperCase(),
              color: model === "danfo" ? "#f2c230" : model === "police" ? "#263d66" : "#eab308",
            }));
            const vehicleSync = await (supabase as any).from("vehicles").upsert(vehicleRows, { onConflict: "owner_id,plate_number" });
            if (vehicleSync.error) console.warn("[Anywhere Roleplay] Vehicle sync skipped:", vehicleSync.error.message);
          }
          const inventoryRows = Object.entries(current.inventory).filter(([, quantity]) => quantity > 0).map(([item_name, quantity]) => ({
            owner_id: userId, item_name, quantity, item_type: item_name.includes("fit") ? "clothing" : item_name.includes("apartment") || item_name.includes("studio") ? "property" : "item", updated_at: new Date().toISOString(),
          }));
          if (inventoryRows.length) {
            const inventorySync = await (supabase as any).from("inventories").upsert(inventoryRows, { onConflict: "owner_id,item_name,item_type" });
            if (inventorySync.error) console.warn("[Anywhere Roleplay] Inventory sync skipped:", inventorySync.error.message);
          }
          const propertyRows = [
            ...(current.inventory["mainland-studio"] ? [{ owner_id: userId, property_key: "mainland-studio", property_name: "Mainland Studio", status: "owned", rent_until: null }] : []),
            ...(current.inventory["ikoyi-apartment"] ? [{ owner_id: userId, property_key: "ikoyi-apartment", property_name: "Ikoyi Apartment", status: "owned", rent_until: null }] : []),
            ...Object.entries(current.rentals).filter(([, expiry]) => expiry > Date.now()).map(([property_key, expiry]) => ({
              owner_id: userId, property_key, property_name: property_key === "ikoyi-apartment" ? "Ikoyi Apartment" : "Mainland Studio", status: "rented", rent_until: new Date(expiry).toISOString(),
            })),
          ];
          if (propertyRows.length) {
            const propertySync = await (supabase as any).from("properties").upsert(propertyRows, { onConflict: "owner_id,property_key" });
            if (propertySync.error) console.warn("[Anywhere Roleplay] Property sync skipped:", propertySync.error.message);
          }
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
