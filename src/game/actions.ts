import { g } from "./state";
import { useGame, VEHICLE_CATALOG } from "./store";
import { ROADS_X, ROADS_Z, BOUND, isBlocked, clampWorld } from "./city";

export function enterVehicle(id: string) {
  const v = g.vehicles.get(id);
  if (!v) return;
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
    // Step out to the left side of the vehicle
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
  else if (p.kind === "home") {
    if ((s.inventory["mainland-studio"] ?? 0) > 0 || (s.inventory["ikoyi-apartment"] ?? 0) > 0 || (s.rentals["mainland-studio"] ?? 0) > Date.now() || (s.rentals["ikoyi-apartment"] ?? 0) > Date.now()) {
      g.interiorReturn.copy(g.playerPos);
      g.playerPos.set(104, 0, 104);
      s.setInterior(true, "Ikoyi Apartment");
      s.setWaypoint(null);
      s.radio("🏠 Welcome home. Your apartment storage is safe here.");
    } else s.setModal("home");
  }
  else if (p.kind === "food") s.openPhone("food");
  else if (p.kind === "fuel") s.openPhone("fuel");
  else if (p.kind === "wardrobe") s.openPhone("wardrobe");
  else if (p.kind === "jobboard") s.openPhone("jobs");
  else if (p.kind === "police") { s.setOutfit({ top: "uniform" }); s.acceptJob("security"); s.radio("🚔 Police duty started. Patrol uniform equipped."); }
  else if (p.kind === "building") {
    const label = p.buildingLabel ?? "City Building";
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes("bank")) {
      g.interiorReturn.copy(g.playerPos);
      g.playerPos.set(104, 0, 104);
      s.setInterior(true, label);
      s.openPhone("bank");
      s.radio("🏦 Welcome to the bank. Use the banking app for account services.");
      return;
    }
    if (lowerLabel.includes("airport")) {
      g.interiorReturn.copy(g.playerPos);
      g.playerPos.set(104, 0, 104);
      s.setInterior(true, label);
      s.openPhone("travel");
      s.radio("✈️ Welcome to the terminal. Proceed to airline check-in.");
      return;
    }
    if (lowerLabel.includes("mama put") || lowerLabel.includes("buka")) { s.openPhone("food"); return; }
    if (lowerLabel.includes("market") || lowerLabel.includes("trade depot") || lowerLabel.includes("transport hub")) { s.openPhone("market"); return; }
    if (lowerLabel.includes("police")) {
      s.setOutfit({ top: "uniform" });
      s.acceptJob("security");
      s.radio("🚔 Police duty started. Patrol uniform equipped.");
    }
    g.interiorReturn.copy(g.playerPos);
    g.playerPos.set(104, 0, 104);
    s.setInterior(true, label);
    s.setWaypoint(null);
    s.radio("🏢 Welcome inside " + label + ". Explore the interior and use Exit to return outside.");
  }
}

// Spawn an owned vehicle on the nearest road lane to the player.
export function deliverOwnedVehicle(model: string) {
  const s = useGame.getState();
  if (!s.owned.includes(model)) return;
  const px = g.playerPos.x;
  const pz = g.playerPos.z;
  let best: { x: number; z: number; yaw: number } | null = null;
  let bestD = Infinity;
  for (const rx of ROADS_X) {
    const lane = px < rx ? rx - 5.5 : rx + 5.5;
    const d = Math.hypot(lane - px, pz - pz);
    if (Math.abs(pz) <= BOUND - 8 && d < bestD) { bestD = d; best = { x: lane, z: Math.max(-BOUND + 8, Math.min(BOUND - 8, pz)), yaw: 0 }; }
  }
  for (const rz of ROADS_Z) {
    const lane = pz < rz ? rz - 5.5 : rz + 5.5;
    const d = Math.hypot(px - px, lane - pz);
    if (Math.abs(px) <= BOUND - 8 && d < bestD) { bestD = d; best = { x: Math.max(-BOUND + 8, Math.min(BOUND - 8, px)), z: lane, yaw: Math.PI / 2 }; }
  }
  if (!best) return;
  const id = `own-${model}-${Date.now()}`;
  g.vehicles.set(id, {
    id, model, px: best.x, pz: best.z, vx: 0, vz: 0, yaw: best.yaw, speed: 0, color: "#c94a3c",
  });
  s.addSpawned({ id, model, x: best.x, z: best.z, rotY: best.yaw });
  s.radio(`🚗 Your ${VEHICLE_CATALOG[model]?.name} is waiting on the road nearby.`);
  s.openPhone("garage");
}

export function exitApartment() {
  const s = useGame.getState();
  if (!s.interior) return;
  g.playerPos.copy(g.interiorReturn);
  s.setInterior(false);
  s.radio("🏠 You left your apartment.");
}
