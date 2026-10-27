import { create } from "zustand";
import { JOB_POINTS, POIS, isBlocked, clampWorld, districtAt, setCityWorld, type CityId } from "./city";
import { g } from "./state";

export type JobType = "courier" | "driver" | "trader" | "security" | "construction" | "retail" | "airport" | "estate-agent";

export const DISTRICT_INFO = [
  { name: "Yaba / Surulere", price: 0, description: "Starter mainland: tech hustlers, students and buka stalls." },
  { name: "Oshodi / Mushin", price: 25000, description: "Transport terminals, spare-parts lanes and street trade." },
  { name: "Ajegunle / Makoko", price: 20000, description: "Waterfront communities, fish markets and neighbourhood life." },
  { name: "Ikeja / Airport", price: 50000, description: "Airport terminals, logistics yards and government offices." },
  { name: "Lekki / Victoria Island", price: 100000, description: "High-rise offices, gated estates and premium business." },
  { name: "Eko Atlantic", price: 500000, description: "Aspirational future-city skyline and luxury towers." },
] as const;

export const MARKET_ITEMS = [
  { id: "streetwear-fit", name: "Lagos Streetwear Fit", category: "Clothing", description: "A fresh street-ready look.", price: 4500 },
  { id: "emerald-luxury-fit", name: "Emerald Luxury Fit", category: "Clothing", description: "Premium emerald-and-gold outfit.", price: 12000 },
  { id: "engine-tune", name: "Engine Tune", category: "Car upgrade", description: "A permanent performance upgrade token.", price: 18000 },
  { id: "premium-rims", name: "Premium Rims", category: "Car upgrade", description: "A cosmetic vehicle upgrade token.", price: 9000 },
  { id: "mainland-studio", name: "Mainland Studio", category: "Property", description: "Your first property deed.", price: 85000 },
  { id: "ikoyi-apartment", name: "Ikoyi Apartment", category: "Property", description: "A premium apartment deed.", price: 250000 },
] as const;

export interface ActiveJob {
  type: JobType;
  stage: number;
  targets: [number, number][]; // per-stage target coords
  payout: number;
  title: string;
  hint: string;
  startedAt?: number;
  timeLimitSeconds?: number;
}

export type PromptKind = "vehicle" | "atm" | "dealer" | "home" | "job-target" | "wardrobe" | "jobboard" | "police" | "building" | "food" | "fuel" | "vendor" | null;

export interface GpsWaypoint { x: number; z: number; label: string; kind?: string; }
export interface RideRequest { id: string; service: "ride" | "bike" | "private"; status: "approaching" | "travelling"; destination: GpsWaypoint; fare: number; x: number; z: number; yaw: number; }
export interface PlayerOutfit { gender?: "male" | "female"; skinTone: string; hair: string; hairColor?: string; top: string; bottom: string; accessory: string; }

export interface PlayerNeeds { hunger: number; energy: number; health: number; stress: number; hygiene: number; }
export interface CharacterBackground { family: string; education: string; neighborhood: string; }

export const DEFAULT_NEEDS: PlayerNeeds = { hunger: 100, energy: 100, health: 100, stress: 8, hygiene: 100 };

export interface JobStats {
  deliveries: number;
  drives: number;
  trades: number;
  patrols: number;
}

export interface BankTransaction { id: string; at: string; type: string; amount: number; note: string; }
export interface OnlinePlayer { name: string; x: number; y: number; z: number; yaw: number; vehicle: string | null; outfit?: { gender?: "male" | "female"; skinTone?: string; top?: string; hairColor?: string }; }

export interface SaveData {
  name: string;
  city?: CityId;
  xp?: number;
  cash: number;
  bank: number;
  inventory: Record<string, number>;
  owned: string[];
  jobStats: JobStats;
  time: number;
  savedAt?: number;
  x: number;
  z: number;
  activeJob?: ActiveJob | null;
  waypoint?: GpsWaypoint | null;
  outfit?: PlayerOutfit;
  needs?: PlayerNeeds;
  unlockedDistricts?: string[];
  background?: CharacterBackground;
  characterTraits?: string[];
  rentals?: Record<string, number>;
  spawnedVehicles?: { id: string; model: string; x: number; z: number; rotY: number; fuel?: number; condition?: number }[];
  transactions?: BankTransaction[];
}

export const SAVE_KEY = "lagos-hustle-save-v1";

const N = (n: number) => "₦" + n.toLocaleString("en-NG");

export const VEHICLE_CATALOG: Record<
  string,
  { model: string; name: string; price: number; maxSpeed: number; accel: number; turn: number }
> = {
  keke: { model: "keke", name: "Keke Napep", price: 25000, maxSpeed: 12, accel: 14, turn: 2.6 },
  bike: { model: "bike", name: "Okada Motorcycle", price: 18000, maxSpeed: 24, accel: 19, turn: 3.1 },
  danfo: { model: "danfo", name: "Danfo Bus", price: 120000, maxSpeed: 15, accel: 10, turn: 1.9 },
  taxi: { model: "taxi", name: "City Taxi", price: 80000, maxSpeed: 18, accel: 14, turn: 2.3 },
  sedan: { model: "sedan", name: "Executive Sedan", price: 250000, maxSpeed: 20, accel: 15, turn: 2.2 },
  suv: { model: "suv", name: "Luxury SUV", price: 400000, maxSpeed: 19, accel: 13, turn: 2.0 },
  sports: { model: "sports", name: "Sports Car", price: 600000, maxSpeed: 27, accel: 22, turn: 2.5 },
  police: { model: "police", name: "Patrol Jeep", price: 350000, maxSpeed: 22, accel: 16, turn: 2.3 },
};

export const JOB_INFO: Record<JobType, { title: string; desc: string; payout: number }> = {
  courier: { title: "Courier Run", desc: "Pick up a package and deliver it across town.", payout: 1800 },
  driver: { title: "Transport Driver", desc: "Drive a vehicle: pick up a passenger and drop them off.", payout: 3200 },
  trader: { title: "Street Hustle", desc: "Buy goods at Balogun Market, sell at the Trade Depot for profit.", payout: 4500 },
  security: { title: "Security Patrol", desc: "Walk 3 checkpoints across the city on foot.", payout: 2600 },
  construction: { title: "Construction Crew", desc: "Report to the worksite, then deliver materials to the foreman.", payout: 5200 },
  retail: { title: "Shop Assistant", desc: "Check in at a Lagos boutique and restock a nearby market stall.", payout: 2800 },
  airport: { title: "Airport Ground Crew", desc: "Report to cargo operations and move a shipment to the terminal.", payout: 6200 },
  "estate-agent": { title: "Property Viewing Agent", desc: "Meet a client at the estate office and show them a property.", payout: 7000 },
};

function pick<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error("Cannot choose from an empty list.");
  return arr[Math.floor(Math.random() * arr.length)] ?? arr[0]!;
}
function near(a: [number, number], b: [number, number]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]) < 30;
}

export function makeJob(type: JobType): ActiveJob {
  if (type === "courier") {
    const from = pick(JOB_POINTS.pickups);
    let to = pick(JOB_POINTS.dropoffs);
    let guard = 0;
    while (near(from, to) && guard++ < 10) to = pick(JOB_POINTS.dropoffs);
    return {
      type, stage: 0,
      targets: [from, to],
      payout: JOB_INFO.courier.payout,
      title: JOB_INFO.courier.title,
      hint: "Collect the package, then deliver it.",
    };
  }
  if (type === "driver") {
    const from = pick(JOB_POINTS.pickups);
    let to = pick(JOB_POINTS.dropoffs);
    let guard = 0;
    while (near(from, to) && guard++ < 10) to = pick(JOB_POINTS.dropoffs);
    return {
      type, stage: 0,
      targets: [from, to],
      payout: JOB_INFO.driver.payout,
      title: JOB_INFO.driver.title,
      hint: "Get in a vehicle first, then pick up your passenger.",
    };
  }
  if (type === "trader") {
    return {
      type, stage: 0,
      targets: [[-40, 32], [22, 47]],
      payout: JOB_INFO.trader.payout,
      title: JOB_INFO.trader.title,
      hint: "Buy goods at the market, sell at the Trade Depot.",
    };
  }
  const districtJobs: Partial<Record<JobType, { targets: [number, number][]; hint: string }>> = {
    construction: { targets: [[86, 78], [78, 84]], hint: "Check in at the construction site, then report to the foreman." },
    retail: { targets: [[2, 42], [-40, 32]], hint: "Clock in at Lagos Boutique, then restock a market stall." },
    airport: { targets: [[140, -132], [91, -96]], hint: "Check in at cargo operations, then report to the terminal." },
    "estate-agent": { targets: [[151, 88], [112, 76]], hint: "Meet your client at the gated estate, then show the business plaza." },
  };
  const districtJob = districtJobs[type];
  if (districtJob) return {
    type, stage: 0, targets: districtJob.targets,
    payout: JOB_INFO[type].payout, title: JOB_INFO[type].title, hint: districtJob.hint,
  };
  const pts = [...JOB_POINTS.checkpoints].sort(() => Math.random() - 0.5).slice(0, 3) as [number, number][];
  return {
    type: "security", stage: 0,
    targets: pts,
    payout: JOB_INFO.security.payout,
    title: JOB_INFO.security.title,
    hint: "Walk to each of the 3 checkpoints.",
  };
}

interface GameStore {
  started: boolean;
  city: CityId;
  setCity: (city: CityId) => void;
  stadiumMode: boolean;
  enterStadium: () => void;
  exitStadium: () => void;
  onlinePlayers: Record<string, OnlinePlayer>;
  setOnlinePlayers: (players: Record<string, OnlinePlayer>) => void;
  xp: number;
  level: number;
  addXp: (amount: number) => void;
  graphicsQuality: "low" | "medium" | "high";
  setGraphicsQuality: (quality: "low" | "medium" | "high") => void;
  name: string;
  cash: number;
  bank: number;
  transactions: BankTransaction[];
  inventory: Record<string, number>;
  owned: string[];
  jobStats: JobStats;
  activeJob: ActiveJob | null;
  phoneOpen: boolean;
  outfit: PlayerOutfit;
  needs: PlayerNeeds;
  background: CharacterBackground;
  characterTraits: string[];
  setBackground: (background: Partial<CharacterBackground>) => void;
  setCharacterTraits: (traits: string[]) => void;
  unlockedDistricts: string[];
  unlockDistrict: (district: string) => boolean;
  tickNeeds: (seconds: number) => void;
  eatFood: (kind: "mama-put" | "snack" | "water") => boolean;
  sleep: () => void;
  rentals: Record<string, number>;
  rentMarketItem: (key: string) => boolean;
  setOutfit: (outfit: Partial<PlayerOutfit>) => void;
  interior: boolean;
  interiorLabel: string;
  setInterior: (inside: boolean, label?: string) => void;
  waypoint: GpsWaypoint | null;
  rideRequest: RideRequest | null;
  requestRide: (service: RideRequest["service"]) => boolean;
  setRideRequest: (rideRequest: RideRequest | null) => void;
  setWaypoint: (waypoint: GpsWaypoint | null) => void;
  clearWaypoint: () => void;
  phoneApp: "home" | "bank" | "jobs" | "garage" | "inventory" | "map" | "radio" | "market" | "wardrobe" | "rides" | "food" | "travel" | "districts" | "fuel" | "radar" | "settings" | "friends";
  prompt: { kind: PromptKind; label: string; vehicleId?: string; buildingLabel?: string } | null;
  modal: "atm" | "dealer" | "home" | "bank" | null;
  clock: number; // HUD-facing in-game hour, synced at ~1Hz
  speedKph: number;
  fuelLevel: number;
  setFuelLevel: (level: number) => void;
  refuelVehicle: (amount: number, price: number) => boolean;
  nearJobTarget: number; // meters to current target
  driving: boolean;
  hasSave: boolean;
  lastRadio: number;
  spawnedVehicles: { id: string; model: string; x: number; z: number; rotY: number; fuel?: number; condition?: number }[];

  addSpawned: (v: { id: string; model: string; x: number; z: number; rotY: number; fuel?: number; condition?: number }) => void;

  start: (fresh: boolean) => void;
  setName: (n: string) => void;
  save: () => void;
  spend: (amount: number, from: "cash" | "bank") => boolean;
  earn: (amount: number, to: "cash" | "bank") => void;
  transfer: (amount: number, dir: "deposit" | "withdraw") => void;
  addItem: (item: string, count?: number) => void;
  removeItem: (item: string, count?: number) => void;
  useInventoryItem: (item: string) => boolean;
  buyVehicle: (key: string) => boolean;
  purchaseMarketItem: (key: string) => boolean;
  acceptJob: (type: JobType) => void;
  advanceJob: () => void;
  cancelJob: () => void;
  bumpStat: (stat: keyof JobStats) => void;
  openPhone: (app?: GameStore["phoneApp"]) => void;
  closePhone: () => void;
  setPrompt: (p: GameStore["prompt"]) => void;
  setModal: (m: GameStore["modal"]) => void;
  setClock: (h: number) => void;
  setSpeed: (kph: number) => void;
  setNearTarget: (m: number) => void;
  setDriving: (d: boolean) => void;
  radio: (msg: string) => void;
}

function loadSave(): SaveData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as SaveData) : null;
  } catch {
    return null;
  }
}

const DEFAULTS = {
  started: false,
  city: "newmap" as CityId,
  stadiumMode: false,
  onlinePlayers: {} as Record<string, OnlinePlayer>,
  xp: 0,
  level: 1,
  graphicsQuality: (typeof window !== "undefined" && ["low","medium","high"].includes(localStorage.getItem("lagos-graphics-quality") ?? "") ? localStorage.getItem("lagos-graphics-quality") : "medium") as "low" | "medium" | "high",
  name: "",
  cash: 5000,
  bank: 10000,
  transactions: [] as BankTransaction[],
  inventory: {} as Record<string, number>,
  owned: [] as string[],
  jobStats: { deliveries: 0, drives: 0, trades: 0, patrols: 0 },
  activeJob: null as ActiveJob | null,
  phoneOpen: false,
  outfit: { gender: "male", skinTone: "#a86f48", hair: "short", top: "streetwear", bottom: "jeans", accessory: "none" } as PlayerOutfit,
  needs: { ...DEFAULT_NEEDS },
  background: { family: "Mainland family", education: "Secondary school", neighborhood: "Yaba / Surulere" },
  characterTraits: ["Street smart"],
  unlockedDistricts: ["Yaba / Surulere"],
  rentals: {} as Record<string, number>,
  interior: false,
  interiorLabel: "Ikoyi Apartment",
  waypoint: null as GpsWaypoint | null,
  rideRequest: null as RideRequest | null,
  phoneApp: "home" as const,
  prompt: null as GameStore["prompt"],
  modal: null as GameStore["modal"],
  clock: 8,
  speedKph: 0,
  fuelLevel: 100,
  nearJobTarget: 0,
  driving: false,
};

export const useGame = create<GameStore>((set, get) => ({
  ...DEFAULTS,
  setGraphicsQuality: (quality) => { if (typeof window !== "undefined") localStorage.setItem("lagos-graphics-quality", quality); set({ graphicsQuality: quality }); },
  setCity: (city) => {
    setCityWorld(city);
    g.playerPos.set(city === "newmap" ? 0 : -14, 0, city === "newmap" ? 29 : -14);
    g.playerYaw = Math.PI; g.camYaw = 0; g.camPitch = 0.42; g.camDistance = 8;
    g.joy.x = 0; g.joy.y = 0; g.drivingId = null; g.vehicles.clear(); g.ridingPassenger = false; g.sirenOn = false;
    set({ city, stadiumMode: false, cash: city === "newmap" ? 1_000_000_000 : get().cash, driving: false, speedKph: 0, waypoint: null, activeJob: null, interior: false, interiorLabel: "", phoneOpen: false });
    get().save();
  },
  enterStadium: () => {
    g.playerPos.set(0, 0, 8.4); g.playerYaw = Math.PI;
    g.camYaw = 0; g.camPitch = 0.68; g.camDistance = 14;
    g.joy.x = 0; g.joy.y = 0; g.drivingId = null; g.ridingPassenger = false; g.playerSpeed = 0;
    set({ stadiumMode: true, driving: false, speedKph: 0, phoneOpen: false, cash: get().city === "newmap" ? 1_000_000_000 : get().cash });
    get().save();
  },
  exitStadium: () => {
    g.playerPos.set(0, 0, 29); g.playerYaw = Math.PI;
    g.camYaw = 0; g.camPitch = 0.42; g.camDistance = 8;
    g.joy.x = 0; g.joy.y = 0; g.playerSpeed = 0;
    set({ stadiumMode: false, driving: false, speedKph: 0, phoneOpen: false });
    get().save();
  },
  setOnlinePlayers: (players) => set({ onlinePlayers: players }),
  addXp: (amount) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const current = get();
    const xp = current.xp + Math.floor(amount);
    const level = Math.floor(xp / 100) + 1;
    set({ xp, level });
    if (level > current.level) {
      const reward = 2500 * (level - current.level);
      get().earn(reward, "bank");
      get().radio("🎉 LEVEL UP! You reached Level " + level + " and earned " + N(reward) + " as a progression reward.");
    }
    get().save();
  },
  hasSave: false,
  lastRadio: 0,
  spawnedVehicles: [],

  addSpawned: (v) => set({ spawnedVehicles: [...get().spawnedVehicles, v] }),

  start: (fresh) => {
    const saved = fresh ? null : loadSave();
    if (saved) {
      const migratedToNewMap = saved.city === "lagos" || !saved.city;
      const savedCity: CityId = migratedToNewMap ? "newmap" : (saved.city ?? "newmap");
      setCityWorld(savedCity);
      g.playerPos.set(savedCity === "newmap" ? 0 : saved.x, 0, savedCity === "newmap" ? 29 : saved.z);
      if (savedCity === "newmap") { g.playerYaw = Math.PI; g.camYaw = 0; g.camPitch = 0.42; g.camDistance = 8; }
      g.time = saved.time;
      set({
        started: true, city: savedCity, stadiumMode: false, name: saved.name || "Hustler", cash: savedCity === "newmap" ? 1_000_000_000 : saved.cash, bank: saved.bank, transactions: saved.transactions ?? [], xp: Math.max(0, saved.xp ?? 0), level: Math.floor(Math.max(0, saved.xp ?? 0) / 100) + 1,
        inventory: saved.inventory || {}, owned: saved.owned || [],
        jobStats: { ...DEFAULTS.jobStats, ...saved.jobStats },
        activeJob: savedCity === "newmap" ? null : saved.activeJob ?? null,
        waypoint: savedCity === "newmap" ? null : saved.waypoint ?? null,
        outfit: { ...DEFAULTS.outfit, ...(saved.outfit ?? {}) },
        needs: { ...DEFAULT_NEEDS, ...(saved.needs ?? {}) },
        background: { ...DEFAULTS.background, ...(saved.background ?? {}) },
        characterTraits: saved.characterTraits ?? DEFAULTS.characterTraits,
        unlockedDistricts: saved.unlockedDistricts ?? ["Yaba / Surulere"],
        rentals: saved.rentals ?? {},
        spawnedVehicles: savedCity === "newmap" ? [] : Array.isArray(saved.spawnedVehicles) ? saved.spawnedVehicles : [],
        clock: Number.isFinite(saved.time) ? saved.time : 8,
        hasSave: true,
      });
    } else {
      setCityWorld(get().city);
      g.playerPos.set(0, 0, 18.2);
      g.playerYaw = Math.PI; g.camYaw = 0; g.camPitch = 0.25; g.camDistance = 16;
      g.time = 8;
      localStorage.removeItem(SAVE_KEY);
      set({ ...DEFAULTS, started: true, cash: 1_000_000_000, name: get().name || "Hustler" });
    }
    g.started = true;
  },
  setName: (name) => { set({ name: name.slice(0, 16) }); get().save(); },
  setBackground: (background) => { set({ background: { ...get().background, ...background } }); get().save(); },
  setCharacterTraits: (characterTraits) => { set({ characterTraits: [...new Set(characterTraits)].slice(0, 3) }); get().save(); },

  save: () => {
    const s = get();
    if (!s.started) return;
    const data: SaveData = {
      name: s.name, city: s.city, xp: s.xp, cash: s.cash, bank: s.bank, transactions: s.transactions.slice(-50), inventory: s.inventory, owned: s.owned,
      jobStats: s.jobStats, time: g.time, savedAt: Date.now(), x: g.playerPos.x, z: g.playerPos.z,
      activeJob: s.activeJob, waypoint: s.waypoint, outfit: s.outfit, needs: s.needs, background: s.background, characterTraits: s.characterTraits, unlockedDistricts: s.unlockedDistricts, rentals: s.rentals, spawnedVehicles: s.spawnedVehicles.map((vehicle) => { const runtime = g.vehicles.get(vehicle.id); const shouldPersistFuel = vehicle.id.startsWith("own-") || vehicle.fuel !== undefined; return { ...vehicle, x: runtime?.px ?? vehicle.x, z: runtime?.pz ?? vehicle.z, rotY: runtime?.yaw ?? vehicle.rotY, ...(shouldPersistFuel ? { fuel: runtime?.fuel ?? vehicle.fuel ?? 100 } : {}), ...(vehicle.condition !== undefined ? { condition: vehicle.condition } : {}) }; }),
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* storage full */ }
  },

  spend: (amount, from) => {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    const s = get();
    const bal = from === "cash" ? s.cash : s.bank;
    if (bal < amount) return false;
    const transaction: BankTransaction = { id: crypto.randomUUID?.() ?? String(Date.now()), at: new Date().toISOString(), type: "debit", amount, note: from === "cash" ? "Cash purchase" : "Bank payment" };
    set({ ...(from === "cash" ? { cash: s.cash - amount } : { bank: s.bank - amount }), transactions: [...s.transactions, transaction].slice(-50) });
    get().save();
    return true;
  },
  earn: (amount, to) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const s = get();
    const transaction: BankTransaction = { id: crypto.randomUUID?.() ?? String(Date.now()), at: new Date().toISOString(), type: "credit", amount, note: to === "bank" ? "Job / activity payment" : "Cash earnings" };
    set({ ...(to === "cash" ? { cash: s.cash + amount } : { bank: s.bank + amount }), transactions: [...s.transactions, transaction].slice(-50) });
    get().save();
  },
  transfer: (amount, dir) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const s = get();
    if (dir === "deposit") {
      if (s.cash < amount) return;
      const transaction: BankTransaction = { id: crypto.randomUUID?.() ?? String(Date.now()), at: new Date().toISOString(), type: "deposit", amount, note: "Cash deposited at ATM" };
      set({ cash: s.cash - amount, bank: s.bank + amount, transactions: [...s.transactions, transaction].slice(-50) });
    } else {
      if (s.bank < amount) return;
      const transaction: BankTransaction = { id: crypto.randomUUID?.() ?? String(Date.now()), at: new Date().toISOString(), type: "withdrawal", amount, note: "ATM cash withdrawal" };
      set({ bank: s.bank - amount, cash: s.cash + amount, transactions: [...s.transactions, transaction].slice(-50) });
    }
    get().save();
  },
  addItem: (item, count = 1) => {
    if (!Number.isFinite(count) || count <= 0) return;
    const inv = { ...get().inventory };
    inv[item] = (inv[item] || 0) + count;
    set({ inventory: inv });
  },
  removeItem: (item, count = 1) => {
    if (!Number.isFinite(count) || count <= 0) return;
    const inv = { ...get().inventory };
    const left = (inv[item] || 0) - count;
    if (left > 0) inv[item] = left; else delete inv[item];
    set({ inventory: inv });
    get().save();
  },
  useInventoryItem: (item) => {
    const state = get();
    if ((state.inventory[item] ?? 0) < 1) return false;
    const effects: Record<string, { hunger: number; energy: number; stress: number; message: string }> = {
      water: { hunger: 0, energy: 6, stress: -4, message: "Cold water refreshed you." },
      snack: { hunger: 12, energy: 4, stress: -2, message: "You ate a quick snack." },
      "mama-put": { hunger: 42, energy: 12, stress: -8, message: "You enjoyed a plate from Mama Put." },
      "jollof-rice": { hunger: 36, energy: 10, stress: -6, message: "Jollof rice restored your hunger." },
      "pounded-yam": { hunger: 48, energy: 12, stress: -7, message: "Pounded yam and soup filled you up." },
      suya: { hunger: 22, energy: 8, stress: -4, message: "Suya restored some energy." },
      zobo: { hunger: 2, energy: 8, stress: -5, message: "Cold zobo refreshed you." },
    };
    const effect = effects[item];
    if (!effect) return false;
    const needs = state.needs;
    get().removeItem(item, 1);
    set({ needs: { hunger: Math.min(100, needs.hunger + effect.hunger), energy: Math.min(100, needs.energy + effect.energy), health: needs.health, stress: Math.max(0, needs.stress + effect.stress), hygiene: needs.hygiene } });
    get().radio("🥤 " + effect.message);
    get().save();
    return true;
  },
  buyVehicle: (key) => {
    const v = VEHICLE_CATALOG[key];
    if (!v || get().owned.includes(key)) return false;
    if (!get().spend(v.price, "bank")) return false;
    set({ owned: [...get().owned, key] });
    return true;
  },
  purchaseMarketItem: (key) => {
    const item = MARKET_ITEMS.find((entry) => entry.id === key);
    if (!item) return false;
    const state = get();
    if ((state.inventory[key] ?? 0) > 0) return false;
    const paid = item.category === "Property" ? state.spend(item.price, "bank") : (state.spend(item.price, "bank") || state.spend(item.price, "cash"));
    if (!paid) return false;
    state.addItem(key, 1);
    state.save();
    return true;
  },

  acceptJob: (type) => { const job = { ...makeJob(type), startedAt: Date.now(), timeLimitSeconds: 8 * 60 }; const target = job.targets[0]; set({ activeJob: job, phoneOpen: false, waypoint: target ? { x: target[0], z: target[1], label: job.title + " · pickup", kind: "job" } : null }); get().save(); },
  advanceJob: () => {
    const job = get().activeJob;
    if (!job) return;
    const next = job.stage + 1;
    if (next >= job.targets.length) {
      const stats = { ...get().jobStats };
      if (job.type === "courier") stats.deliveries++;
      if (job.type === "driver") stats.drives++;
      if (job.type === "trader") stats.trades++;
      if (job.type === "security") stats.patrols++;
      get().earn(job.payout, "bank");
      get().addXp(45);
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("roleplay-job-completed", { detail: { job_type: job.type, earnings: job.payout, title: job.title } }));
      set({ activeJob: null, jobStats: stats, waypoint: null });
      get().save();
      get().radio(`✅ Job complete — ${N(job.payout)} paid into your bank account.`);
    } else {
      const target = job.targets[next];
      set({ activeJob: { ...job, stage: next }, waypoint: target ? { x: target[0], z: target[1], label: job.title + " · " + (next + 1), kind: "job" } : null });
      get().save();
    }
  },
  cancelJob: () => { set({ activeJob: null, waypoint: null }); get().save(); },

  bumpStat: (stat) => set({ jobStats: { ...get().jobStats, [stat]: get().jobStats[stat] + 1 } }),
  rentMarketItem: (key) => {
    const item = MARKET_ITEMS.find((entry) => entry.id === key && entry.category === "Property");
    if (!item || (get().inventory[key] ?? 0) > 0) return false;
    const expiry = get().rentals[key] ?? 0;
    if (expiry > Date.now()) return false;
    const rentPrice = Math.max(1000, Math.round(item.price * 0.2));
    if (!get().spend(rentPrice, "bank")) return false;
    set({ rentals: { ...get().rentals, [key]: Date.now() + 7 * 24 * 60 * 60 * 1000 } });
    get().save();
    return true;
  },
  setOutfit: (outfit) => { const next = { ...get().outfit, ...outfit }; set({ outfit: next }); get().save(); },
  unlockDistrict: (district) => {
    const item = DISTRICT_INFO.find((d) => d.name === district);
    if (!item || get().unlockedDistricts.includes(district)) return false;
    if (district === "Eko Atlantic" && !get().unlockedDistricts.includes("Lekki / Victoria Island")) return false;
    if (!get().spend(item.price, "bank") && !get().spend(item.price, "cash")) return false;
    set({ unlockedDistricts: [...get().unlockedDistricts, district] });
    get().radio("🗺️ District unlocked: " + district + ". New streets are open to you.");
    get().save();
    return true;
  },
  tickNeeds: (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0 || !get().started) return;
    const n = get().needs;
    const hunger = Math.max(0, n.hunger - seconds / 30);
    const energy = Math.max(0, n.energy - seconds / 45);
    const stress = Math.min(100, n.stress + (g.playerSpeed > 5 ? seconds * 0.035 : seconds * 0.008));
    const hygiene = Math.max(0, n.hygiene - seconds / 180);
    const health = Math.max(0, Math.min(100, n.health + (hunger > 15 && energy > 10 ? seconds * 0.006 : -seconds * 0.06)));
    set({ needs: { hunger, energy, health, stress, hygiene } });
  },
  eatFood: (kind) => {
    const choices = { "mama-put": { price: 900, hunger: 42, energy: 12, stress: -8, hygiene: 0, message: "🍲 Mama Put rice and stew — belle don full!" }, snack: { price: 250, hunger: 12, energy: 3, stress: -2, hygiene: 0, message: "🥟 Quick roadside snack bought." }, water: { price: 150, hunger: 0, energy: 2, stress: -4, hygiene: 0, message: "💧 Cold sachet water. Refreshing!" } } as const;
    const item = choices[kind];
    if (!get().spend(item.price, "cash") && !get().spend(item.price, "bank")) return false;
    const n = get().needs;
    set({ needs: { hunger: Math.min(100, n.hunger + item.hunger), energy: Math.min(100, n.energy + item.energy), health: n.health, stress: Math.max(0, n.stress + item.stress), hygiene: n.hygiene } });
    get().radio(item.message); get().save(); return true;
  },
  sleep: () => {
    const n = get().needs;
    g.time = 7;
    set({ clock: 7, needs: { hunger: Math.max(0, n.hunger - 8), energy: 100, health: Math.min(100, n.health + 8), stress: Math.max(0, n.stress - 24), hygiene: n.hygiene } });
    get().save();
    get().radio("🏠 You rested until 07:00. Energy restored; a new Lagos morning begins.");
  },
  setInterior: (inside, label) => set({ interior: inside, ...(label ? { interiorLabel: label } : {}) }),
  setWaypoint: (waypoint) => { set({ waypoint }); get().save(); },
  requestRide: (service) => {
    const s = get();
    if (!s.waypoint || s.driving || s.rideRequest) return false;
    const destinationDistrict = districtAt(s.waypoint.x, s.waypoint.z);
    if (destinationDistrict && (!s.unlockedDistricts.includes(destinationDistrict) || (destinationDistrict === "Eko Atlantic" && !s.unlockedDistricts.includes("Lekki / Victoria Island")))) return false;
    const fare = service === "bike" ? 700 : service === "private" ? 4200 : 1600;
    if (!s.spend(fare, "cash") && !s.spend(fare, "bank")) return false;
    const offset = service === "bike" ? 10 : 16;
    const x = clampWorld(g.playerPos.x + offset, g.playerPos.z - offset, 2)[0];
    const z = clampWorld(g.playerPos.x + offset, g.playerPos.z - offset, 2)[1];
    set({ rideRequest: { id: `ride-${Date.now()}`, service, status: "approaching", destination: { ...s.waypoint }, fare, x, z, yaw: Math.atan2(-offset, offset) } });
    get().radio(service === "bike" ? "🏍️ Okada rider accepted the trip and is coming to your location." : service === "private" ? "🚘 Private driver confirmed and is on the way." : "🚕 Ride accepted. Your driver is on the way.");
    get().save();
    return true;
  },
  setRideRequest: (rideRequest) => set({ rideRequest }),
  clearWaypoint: () => { set({ waypoint: null }); get().save(); },
  openPhone: (app) => set({ phoneOpen: true, phoneApp: app ?? get().phoneApp }),
  closePhone: () => set({ phoneOpen: false }),
  setPrompt: (p) => { if (JSON.stringify(p) !== JSON.stringify(get().prompt)) set({ prompt: p }); },
  setModal: (m) => set({ modal: m }),
  setClock: (h) => set({ clock: h }),
  setSpeed: (kph) => { if (Math.abs(kph - get().speedKph) > 0.8) set({ speedKph: kph }); },
  setFuelLevel: (level) => { const safe = Math.max(0, Math.min(100, level)); if (Math.abs(safe - get().fuelLevel) > 0.5) set({ fuelLevel: safe }); },
  refuelVehicle: (amount, price) => {
    const vehicle = g.drivingId ? g.vehicles.get(g.drivingId) : null;
    const station = POIS.find((p) => p.kind === "fuel" && Math.hypot(p.x - g.playerPos.x, p.z - g.playerPos.z) < 12);
    if (!vehicle || !station || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(price) || price <= 0) return false;
    const current = vehicle.fuel ?? 100;
    const litres = Math.min(amount, 100 - current);
    if (litres <= 0) return false;
    const cost = Math.ceil(price * litres / amount);
    if (!get().spend(cost, "cash") && !get().spend(cost, "bank")) return false;
    vehicle.fuel = current + litres;
    get().setFuelLevel(vehicle.fuel);
    get().radio("⛽ Fuel purchased at " + station.label + ". Paid ₦" + cost.toLocaleString("en-NG") + ".");
    get().save();
    return true;
  },
  setNearTarget: (m) => { if (Math.abs(m - get().nearJobTarget) > 4) set({ nearJobTarget: m }); },
  setDriving: (d) => { if (d !== get().driving) set({ driving: d }); },
  radio: (msg) => {
    window.dispatchEvent(new CustomEvent("city-radio", { detail: msg }));
  },
}));

export { N as naira };

// Find the nearest job target the player must reach, and whether job stage rules allow it now.
export function jobTargetPoint(): [number, number] | null {
  const job = useGame.getState().activeJob;
  if (!job) return null;
  if (job.type === "driver" && job.stage === 0 && !useGame.getState().driving) return null;
  return job.targets[job.stage] ?? null;
}

// Called by the proximity loop when the player reaches the active job target.
export function tryJobProgress(playerX: number, playerZ: number) {
  const job = useGame.getState().activeJob;
  if (!job) return;
  const t = job.targets[job.stage];
  if (!t) return;
  if (job.type === "driver" && job.stage === 0 && !useGame.getState().driving) return;
  if (job.type === "driver" && job.stage === 1 && !useGame.getState().driving) return;
  if (Math.hypot(playerX - t[0], playerZ - t[1]) < 5) {
    if (job.type === "trader" && job.stage === 0) {
      const s = useGame.getState();
      if (!s.spend(2000, "cash")) {
        s.radio("❌ Not enough cash for the goods (₦2,000). Visit an ATM.");
        return;
      }
      s.addItem("goods", 1);
      s.radio("🛒 Bought a crate of goods for ₦2,000.");
    }
    if (job.type === "trader" && job.stage === 1 && !((useGame.getState().inventory["goods"] ?? 0) > 0)) {
      useGame.getState().radio("❌ You have no goods to sell.");
      return;
    }
    if (job.type === "courier" && job.stage === 0) useGame.getState().addItem("package", 1);
    if (job.type === "courier" && job.stage === 1) {
      if (!((useGame.getState().inventory["package"] ?? 0) > 0)) return;
      useGame.getState().removeItem("package");
    }
    if (job.type === "driver" && job.stage === 1) useGame.getState().radio("🚕 Passenger dropped off. Owo dey!");
    useGame.getState().advanceJob();
  }
}

export function nearestPoi(x: number, z: number, maxDist: number) {
  let best: (typeof POIS)[number] | null = null;
  let bestD = maxDist;
  for (const p of POIS) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

export { isBlocked, clampWorld };
