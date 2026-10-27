import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SAVE_KEY, useGame } from "@/game/store";
import { g } from "@/game/state";
import { VEHICLE_CATALOG } from "@/game/store";
import Scene from "./Scene";
import Hud from "./Hud";
import FirstDayTutorial from "./FirstDayTutorial";

function CloudSaveSync() {
  useEffect(() => {
    let stopped = false;
    let busy = false;
    let userId: string | null = null;
    let cloudLoaded = false;

    const sync = async () => {
      if (stopped || busy || !useGame.getState().started) return;
      busy = true;
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session) return;
        userId = session.user.id;
        if (!cloudLoaded) {
          cloudLoaded = true;
          const { data: cloudSave, error: cloudReadError } = await supabase.from("player_save").select("state,updated_at").eq("user_id", userId).maybeSingle();
          if (cloudReadError) console.warn("[Anywhere Roleplay] Cloud save read skipped:", cloudReadError.message);
          if (cloudSave?.state) {
            const localRaw = localStorage.getItem(SAVE_KEY);
            let localSavedAt = 0;
            try { localSavedAt = Number((JSON.parse(localRaw ?? "{}") as { savedAt?: number }).savedAt ?? 0); } catch { localSavedAt = 0; }
            const cloudSavedAt = Date.parse(cloudSave.updated_at ?? "") || 0;
            if (cloudSavedAt > localSavedAt) {
              const restored = { ...(cloudSave.state as Record<string, unknown>), savedAt: Math.max(cloudSavedAt, Number((cloudSave.state as { savedAt?: number }).savedAt ?? 0)) };
              localStorage.setItem(SAVE_KEY, JSON.stringify(restored));
              useGame.getState().start(false);
              console.info("[Anywhere Roleplay] Restored a newer cloud save for this account.");
              return;
            }
          }
        }
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
            background: current.background,
            character_traits: current.characterTraits,
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
              fuel_level: 100,
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
          const housingRows = [
            ...(current.inventory["mainland-studio"] ? [{ owner_id: userId, house_type: "mainland-studio", rent_due: null, has_generator: false, has_solar: false, stored_cash: 0 }] : []),
            ...(current.inventory["ikoyi-apartment"] ? [{ owner_id: userId, house_type: "ikoyi-apartment", rent_due: null, has_generator: false, has_solar: false, stored_cash: 0 }] : []),
            ...Object.entries(current.rentals).filter(([, expiry]) => expiry > Date.now()).map(([house_type, expiry]) => ({
              owner_id: userId, house_type, rent_due: new Date(expiry).toISOString(), has_generator: false, has_solar: false, stored_cash: 0,
            })),
          ];
          if (housingRows.length) {
            const housingSync = await (supabase as any).from("housing").upsert(housingRows, { onConflict: "owner_id,house_type" });
            if (housingSync.error) console.warn("[Anywhere Roleplay] Housing sync skipped:", housingSync.error.message);
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

    const onJobCompleted = (event: Event) => {
      const detail = (event as CustomEvent<{ job_type?: string; earnings?: number; title?: string }>).detail;
      if (!userId || !detail?.job_type) return;
      void (supabase as any).from("jobs_history").insert({
        player_id: userId,
        job_type: detail.job_type,
        earnings: Math.max(0, Math.round(detail.earnings ?? 0)),
        metadata: { title: detail.title ?? detail.job_type },
      }).then(({ error }: { error: { message: string } | null }) => {
        if (error) console.warn("[Anywhere Roleplay] Job history sync skipped:", error.message);
      });
    };
    window.addEventListener("roleplay-job-completed", onJobCompleted);
    const timer = window.setInterval(() => { void sync(); }, 12000);
    const onPageHide = () => { void sync(); };
    window.addEventListener("pagehide", onPageHide);
    void sync();
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("roleplay-job-completed", onJobCompleted);
    };
  }, []);

  return null;
}


function AdminCommandSync() {
  useEffect(() => {
    let stopped = false;
    let busy = false;
    const poll = async () => {
      if (stopped || busy) return;
      busy = true;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (!user) return;
        const result = await (supabase as any).from("admin_commands").select("id,command,payload")
          .eq("target_user_id", user.id).is("acknowledged_at", null).order("created_at", { ascending: true }).limit(12);
        if (result.error || !result.data?.length) return;
        for (const command of result.data as { id: string; command: string; payload: Record<string, unknown> | null }[]) {
          const payload = command.payload ?? {};
          switch (command.command) {
            case "teleport":
              if (Number.isFinite(Number(payload["x"])) && Number.isFinite(Number(payload["z"]))) {
                g.playerPos.set(Number(payload["x"]), 0, Number(payload["z"]));
                g.adminFlyHeight = 0;
              }
              break;
            case "freeze": g.adminFrozen = true; break;
            case "unfreeze": g.adminFrozen = false; break;
            case "invisible": g.adminInvisible = true; break;
            case "visible": g.adminInvisible = false; break;
            case "levitate": g.adminLevitating = true; g.adminFlying = false; g.adminFlyHeight = 3.5; break;
            case "land": g.adminLevitating = false; g.adminFlying = false; g.adminFlyHeight = 0; break;
            case "fly":
              g.adminFlying = true; g.adminLevitating = false;
              g.adminFlyHeight = Math.max(8, g.adminFlyHeight);
              g.adminFlySpeed = Math.max(8, Math.min(100, Number(payload["speed"]) || 28));
              break;
            case "stop_fly": g.adminFlying = false; g.adminFlyHeight = 0; break;
            case "spawn_vehicle": {
              const model = String(payload["model"] ?? "sedan");
              if (VEHICLE_CATALOG[model]) {
                const id = "admin-" + (crypto.randomUUID?.() ?? String(Date.now()));
                useGame.getState().addSpawned({ id, model, x: g.playerPos.x + 2.5, z: g.playerPos.z + 2.5, rotY: g.playerYaw, fuel: 100 });
                g.vehicles.set(id, { id, model, px: g.playerPos.x + 2.5, pz: g.playerPos.z + 2.5, vx: 0, vz: 0, yaw: g.playerYaw, speed: 0, color: "#d9ad42", fuel: 100 });
                useGame.getState().save();
              }
              break;
            }
            case "spawn_npc": {
              const id = "npc-" + (crypto.randomUUID?.() ?? String(Date.now()));
              g.adminSpawnedNpcs = [...g.adminSpawnedNpcs, { id, x: g.playerPos.x + (Math.random() * 4 - 2), z: g.playerPos.z + (Math.random() * 4 - 2), name: String(payload["name"] ?? "Admin NPC").slice(0, 32) }];
              break;
            }
            case "remove_npc":
              g.adminSpawnedNpcs = payload["id"] ? g.adminSpawnedNpcs.filter(n => n.id !== String(payload["id"])) : [];
              break;
          }
          await (supabase as any).from("admin_commands").update({ acknowledged_at: new Date().toISOString() })
            .eq("id", command.id).eq("target_user_id", user.id);
        }
      } catch (error) {
        console.warn("[Anywhere Roleplay] Admin command poll skipped:", error);
      } finally { busy = false; }
    };
    const timer = window.setInterval(() => { void poll(); }, 2200);
    void poll();
    return () => { stopped = true; window.clearInterval(timer); };
  }, []);
  return null;
}

export default function GameCanvas() {
  return (
    <div className="fixed inset-0 touch-none select-none overflow-hidden">
      <CloudSaveSync />\n      <AdminCommandSync />
      <Canvas dpr={[1, 1.25]} camera={{ fov: 55, near: 0.5, far: 420, position: [-14, 6, 2] }} gl={{ antialias: true, powerPreference: "high-performance" }}>
        <Scene />
      </Canvas>
      <Hud />
      <FirstDayTutorial />
    </div>
  );
}
