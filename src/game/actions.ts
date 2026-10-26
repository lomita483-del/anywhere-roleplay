import { g } from "./state";
import { useGame, VEHICLE_CATALOG } from "./store";
import { ROADS_X, ROADS_Z, isBlocked, clampWorld } from "./city";

export function enterVehicle(id: string) {
  const v = g.vehicles.get(id);
  if (!v || v.ai) return;
  g.drivingId = id;
  g.playerSpeed = 0;
  const s = useGame.getState();
  s.setDriving(true);
  s.setPrompt({ kind: "vehicle", label: "Exit " + (VEHICLE_CATALOG[v.model]?.name ?? v.model), vehicleId: "__exit__" });
  s.radio(`🔑 Got in the ${VEHICLE_CATALOG[v.model]?.name ?? v.model}.`);
}

export function exitVehicle() {
  const id = g.drivingId;
  if (!id) return;
  const v = g.vehicles.get(id);
  g.drivingId = null;
  const s = useGame.getState();
  s.setDriving(false);
  s.setSpeed(0);
  if (v) {
    const lx = v.px + Math.cos(v.yaw) * 1.8;
    const lz = v.pz - Math.sin(v.yaw) * 1.8;
    const [cx, cz] = clampWorld(lx, lz);
    if (!isBlocked(cx, cz, 0.5)) g.playerPos.set(cx, 0, cz);
    else g.playerPos.set(v.px, 0, v.pz);
  }
}

export function interact() {
  if (!g.started) return;
  const s = useGame.getState();
  if (s.modal) { s.setModal(null); return; }
  const p = s.prompt;
  if (!p) return;
  if (p.kind === "vehicle" && p.vehicleId === "__exit__") exitVehicle();
  else if (p.kind === "vehicle" && p.vehicleId) enterVehicle(p.vehicleId);
  else if (p.kind === "atm") s.openPhone("bank");
  else if (p.kind === "dealer") s.setModal("dealer");
  else if (p.kind === "home") s.setModal("home");
}

// Deliver an owned vehicle to a nearby clear road position.
export function deliverOwnedVehicle(model: string) {
  const s = useGame.getState();
  if (!s.owned.includes(model)) return;

  const px = g.playerPos.x;
  const pz = g.playerPos.z;
  const candidates: { x: number; z: number; yaw: number; distance: number }[] = [];

  for (const rx of ROADS_X) {
    const x = px < rx ? rx - 5.5 : rx + 5.5;
    const z = Math.max(-110, Math.min(110, pz));
    candidates.push({ x, z, yaw: 0, distance: Math.hypot(x - px, z - pz) });
  }
  for (const rz of ROADS_Z) {
    const x = Math.max(-110, Math.min(110, px));
    const z = pz < rz ? rz - 5.5 : rz + 5.5;
    candidates.push({ x, z, yaw: Math.PI / 2, distance: Math.hypot(x - px, z - pz) });
  }

  candidates.sort((a, b) => a.distance - b.distance);
  const best = candidates.find((p) => {
    if (Math.abs(p.x) > 115 || Math.abs(p.z) > 115 || isBlocked(p.x, p.z, 1.6)) return false;
    for (const vehicle of g.vehicles.values()) {
      if (Math.hypot(vehicle.px - p.x, vehicle.pz - p.z) < 3.8) return false;
    }
    return true;
  });

  if (!best) {
    s.radio("⚠️ No clear road space nearby. Move to an open street and try again.");
    return;
  }

  const id = `own-${model}-${Date.now()}`;
  g.vehicles.set(id, {
    id, model, px: best.x, pz: best.z, vx: 0, vz: 0, yaw: best.yaw, speed: 0, color: "#c94a3c",
  });
  s.addSpawned({ id, model, x: best.x, z: best.z, rotY: best.yaw });
  s.radio(`🚗 Your ${VEHICLE_CATALOG[model]?.name ?? model} is waiting on the road nearby.`);
  s.openPhone("garage");
}
