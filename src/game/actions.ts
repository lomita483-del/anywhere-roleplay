import { g } from "./state";
import { useGame, VEHICLE_CATALOG } from "./store";
import { ROADS_X, ROADS_Z, BOUND, isBlocked, clampWorld } from "./city";
import { getInteriorDefinition } from "./interiors";

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


export function enterBuilding(label: string, kind = "building"): boolean {
  const s = useGame.getState();
  const lower = (label + " " + kind).toLowerCase();
  const isHome = /home|residential|apartment|house|bungalow/.test(lower);
  if (isHome && !(s.city === "newmap" || (s.inventory["mainland-studio"] ?? 0) > 0 ||
      (s.inventory["ikoyi-apartment"] ?? 0) > 0 ||
      (s.rentals["mainland-studio"] ?? 0) > Date.now() ||
      (s.rentals["ikoyi-apartment"] ?? 0) > Date.now())) {
    s.setModal("home");
    return false;
  }
  if (/mama.?put|buka|food/.test(lower)) {
    if (s.city === "newmap" && /mama.?put|buka/.test(lower)) {
      g.interiorReturn.copy(g.playerPos); g.playerPos.set(104,0,104);
      s.setInterior(true, label, "mama-put"); s.setWaypoint(null); s.openPhone("food");
      s.radio("🍲 Welcome to Mama Put. Order your meal from the food app, then exit back to the street.");
    } else s.openPhone("food");
    return true;
  }
  if (/market|trade depot|transport hub/.test(lower)) { g.interiorReturn.copy(g.playerPos); g.playerPos.set(104,0,104); s.setInterior(true,label,kind); s.setWaypoint(null); s.openPhone("market"); return true; }
  if (/police/.test(lower)) {
    g.interiorReturn.copy(g.playerPos); g.playerPos.set(104,0,104); s.setInterior(true,label,"police"); s.setWaypoint(null);
    s.setOutfit({ top: "uniform" }); s.acceptJob("security");
    s.radio("🚔 Police duty started. Patrol uniform equipped.");
    return true;
  }
  g.interiorReturn.copy(g.playerPos);
  g.playerPos.set(104, 0, 104);
  s.setInterior(true, label, kind);
  s.setWaypoint(null);
  if (/bank|atm/.test(lower)) {
    s.openPhone("bank"); s.radio("🏦 Welcome to the bank. Use the banking app for account services.");
  } else if (/airport|terminal/.test(lower)) {
    s.openPhone("travel"); s.radio("✈️ Welcome to the terminal. Proceed to airline check-in.");
  } else {
    s.radio("🏢 Welcome inside " + label + ". Explore the interior and use Exit to return outside.");
  }
  return true;
}

export function interact() {
  if (!g.started) return;
  const s = useGame.getState();
  if (s.modal) { s.setModal(null); return; }
  const p = s.prompt;
  if (!p) return;
  if (p.kind === "interior-hotspot" && p.hotspotId) {
    const hotspot = getInteriorDefinition(s.interiorLabel, s.interiorKind).hotspots.find(h => h.id === p.hotspotId);
    if (!hotspot) return;
    const [action, value] = hotspot.action.includes(":") ? hotspot.action.split(":", 2) : [hotspot.action, ""];
    if (action === "openPhone") s.openPhone(value as any);
    else if (action === "sleep") s.sleep();
    else if (action === "eat") { if (!s.eatFood("mama-put")) s.radio("🍲 You need to buy food first."); }
    else if (action === "heal") {
      const fee = 2500;
      if (!s.spend(fee, "cash") && !s.spend(fee, "bank")) s.radio("Not enough money for treatment. You need ₦2,500.");
      else { useGame.setState(state => ({ needs: { ...state.needs, health: 100, stress: Math.max(0,state.needs.stress-12) } })); s.radio("🩺 Check-up complete. Health restored."); }
    } else if (action === "startShift") {
      const jobMap: Record<string, any> = { security:"security", courier:"courier", "office-clerk":"retail", packer:"construction", loader:"construction", "dock-worker":"construction", "customs-clerk":"retail", teacher:"retail" };
      const job = value ? jobMap[value] : undefined;
      if (job) { s.acceptJob(job); s.radio("🧾 Shift started: " + hotspot.label + ". Follow the job target markers."); }
      else s.radio("This shift is not available yet.");
    } else if (action === "openModal") {
      if (value === "uniform") { s.setOutfit({ top: "uniform" }); s.radio("Uniform equipped."); }
      else if (value === "property") s.openPhone("market");
      else if (value === "loan") s.radio("Loan information: visit the Bank app to review your balance and transactions.");
      else if (value === "interview") s.radio("Reception interview: speak clearly and show your experience. Level 2 is required for office work.");
      else if (value === "enrol") s.radio("University admissions: enrolment opens when the education service is available.");
      else if (value === "dealer") s.setModal("dealer");
      else if (value === "home") s.setModal("home");
      else if (value === "bank") s.openPhone("bank");
      else if (value === "service") s.radio("A staff member will assist you shortly.");
      else s.radio("You interacted with " + hotspot.label + ".");
    } else if (action === "study") {
      useGame.setState(state => ({ xp: state.xp + 15, needs: { ...state.needs, energy: Math.max(0,state.needs.energy-3) } }));
      s.radio("📚 Study session complete. +15 skill XP.");
    } else if (action === "haggle") s.radio(Math.random() < 0.25 ? "🤝 You bargained well — the vendor offered a small discount." : "The vendor says: 'Last price, my customer!' Try again later.");
    else if (action === "buyCar") s.setModal("dealer");
    else if (action === "exit") exitApartment();
    return;
  }
  if (p.kind === "vehicle" && p.vehicleId === "__exit__") exitVehicle();
  else if (p.kind === "vehicle" && p.vehicleId) enterVehicle(p.vehicleId);
  else if (p.kind === "atm") s.openPhone("bank");
  else if (p.kind === "dealer") s.setModal("dealer");
  else if (p.kind === "home") {
    if (s.city === "newmap" || (s.inventory["mainland-studio"] ?? 0) > 0 || (s.inventory["ikoyi-apartment"] ?? 0) > 0 || (s.rentals["mainland-studio"] ?? 0) > Date.now() || (s.rentals["ikoyi-apartment"] ?? 0) > Date.now()) {
      g.interiorReturn.copy(g.playerPos);
      g.playerPos.set(104, 0, 104);
      s.setInterior(true, s.city === "newmap" ? (p.label.replace("Enter ", "") || "Residential Apartment") : "Ikoyi Apartment", "home");
      s.setWaypoint(null);
      s.radio("🏠 Welcome inside. Use Exit to return to the street.");
    } else s.setModal("home");
  }
  else if (p.kind === "food") {
    if (s.city === "newmap" && /mama put|buka/i.test(p.label)) {
      g.interiorReturn.copy(g.playerPos);
      g.playerPos.set(104, 0, 104);
      s.setInterior(true, "Mama Put Buka", "mama-put");
      s.openPhone("food");
      s.radio("🍲 Welcome to Mama Put. Order your meal from the food app, then exit back to the street.");
    } else s.openPhone("food");
  }
  else if (p.kind === "vendor") s.openPhone("market");
  else if (p.kind === "fuel") s.openPhone("fuel");
  else if (p.kind === "wardrobe") s.openPhone("wardrobe");
  else if (p.kind === "jobboard") s.openPhone("jobs");
  else if (p.kind === "police") { s.setOutfit({ top: "uniform" }); s.acceptJob("security"); s.radio("🚔 Police duty started. Patrol uniform equipped."); }
  else if (p.kind === "building") enterBuilding(p.buildingLabel ?? "City Building", p.buildingKind ?? "building");}

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
    id, model, px: best.x, pz: best.z, vx: 0, vz: 0, yaw: best.yaw, speed: 0, color: "#c94a3c", fuel: 100,
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
