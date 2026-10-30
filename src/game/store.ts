import { create } from "zustand";
import { JOB_POINTS, POIS, isBlocked, clampWorld, districtAt, setCityWorld, type CityId } from "./city";
import { g } from "./state";
import { queueCloudSave, readCloudSave } from "./cloudSave";

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

export type PromptKind = "vehicle" | "atm" | "dealer" | "home" | "job-target" | "wardrobe" | "jobboard" | "police" | "building" | "food" | "fuel" | "vendor" | "interior-hotspot" | null;

export interface GpsWaypoint { x: number; z: number; label: string; kind?: string; }
export interface RideRequest { id: string; service: "ride" | "bike" | "private" | "danfo" | "keke"; status: "approaching" | "travelling"; destination: GpsWaypoint; fare: number; x: number; z: number; yaw: number; }
export interface PlayerOutfit { gender?: "male" | "female"; skinTone: string; hair: string; hairColor?: string; top: string; bottom: string; accessory: string; }

export interface PlayerNeeds { hunger: number; energy: number; health: number; stress: number; hygiene: number; fun: number; bladder: number; }
export interface CharacterBackground { family: string; education: string; neighborhood: string; }

export type SkillKey = "driving" | "trading" | "security" | "construction" | "retail" | "aviation" | "courier" | "negotiation";
export interface SkillProgress { xp: number; level: number; }
export type SkillProgression = Record<SkillKey, SkillProgress>;
export const DEFAULT_SKILLS: SkillProgression = {
  driving: { xp: 0, level: 1 }, trading: { xp: 0, level: 1 },
  security: { xp: 0, level: 1 }, construction: { xp: 0, level: 1 },
  retail: { xp: 0, level: 1 }, aviation: { xp: 0, level: 1 },
  courier: { xp: 0, level: 1 }, negotiation: { xp: 0, level: 1 },
};
export const SKILL_INFO: Record<SkillKey, { label: string; description: string; perk: string }> = {
  driving: { label: "Driving", description: "Build experience completing transport work.", perk: "Smoother handling at higher levels" },
  trading: { label: "Trading", description: "Learn the city markets and complete trade runs.", perk: "Better trade opportunities" },
  security: { label: "Security", description: "Gain experience from patrol assignments.", perk: "Improved patrol reputation" },
  construction: { label: "Construction", description: "Develop experience at construction sites.", perk: "Access to advanced site roles" },
  retail: { label: "Retail", description: "Learn customer service and shop operations.", perk: "Unlock specialist shop shifts" },
  aviation: { label: "Aviation", description: "Gain experience around airport operations.", perk: "Access to advanced ground-crew roles" },
  courier: { label: "Courier", description: "Improve your delivery and navigation skills.", perk: "Unlock priority delivery work" },
  negotiation: { label: "Negotiation", description: "Build professional experience through property work.", perk: "Unlock premium client assignments" },
};
export function skillLevelForXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / 100) + 1;
}

export const DEFAULT_NEEDS: PlayerNeeds = { hunger: 100, energy: 100, health: 100, stress: 8, hygiene: 100, fun: 82, bladder: 12 };

export interface JobStats {
  deliveries: number;
  drives: number;
  trades: number;
  patrols: number;
}

export interface BankTransaction { id: string; at: string; type: string; amount: number; note: string; }
export interface OnlinePlayer { name: string; x: number; y: number; z: number; yaw: number; vehicle: string | null; outfit?: { gender?: "male" | "female"; skinTone?: string; top?: string; hairColor?: string }; }

export interface EmploymentRecord { role: JobType; hiredAt: number; shiftsCompleted: number; totalEarned: number; }
export interface WorkShift { role: JobType; startedAt: number; durationMinutes: number; }
export interface WorkCommute { role: JobType; stage: "pickup" | "driving" | "working"; startedAt: number; workplace: string; }

export interface SaveData {
  name: string;
  city?: CityId;
  xp?: number;
  skills?: Partial<SkillProgression>;
  employment?: Partial<Record<JobType, EmploymentRecord>>;
  workShift?: WorkShift | null;
  timeMode?: "device" | "accelerated";
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

export const JOB_SKILL_MAP: Record<JobType, SkillKey> = {
  courier: "courier", driver: "driving", trader: "trading", security: "security",
  construction: "construction", retail: "retail", airport: "aviation", "estate-agent": "negotiation",
};
export function skillPayoutMultiplier(level: number): number {
  return level >= 5 ? 1.1 : level >= 3 ? 1.05 : 1;
}

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
  skills: SkillProgression;
  employment: Partial<Record<JobType, EmploymentRecord>>;
  workShift: WorkShift | null;
  workCommute: WorkCommute | null;
  timeMode: "device" | "accelerated";
  setTimeMode: (mode: "device" | "accelerated") => void;
  hireForRole: (role: JobType) => boolean;
  clockIn: (role: JobType) => boolean;
  clockOut: () => boolean;
  addSkillXp: (skill: SkillKey, amount: number) => void;
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
  useBathroom: () => boolean;
  shower: () => boolean;
  restoreFun: (amount?: number) => void;
  rentals: Record<string, number>;
  rentMarketItem: (key: string) => boolean;
  setOutfit: (outfit: Partial<PlayerOutfit>) => void;
  interior: boolean;
  interiorLabel: string;
  interiorKind: string;
  setInterior: (inside: boolean, label?: string, kind?: string) => void;
  waypoint: GpsWaypoint | null;
  rideRequest: RideRequest | null;
  requestRide: (service: RideRequest["service"]) => boolean;
  setRideRequest: (rideRequest: RideRequest | null) => void;
  setWaypoint: (waypoint: GpsWaypoint | null) => void;
  clearWaypoint: () => void;
  phoneApp: "home" | "bank" | "jobs" | "garage" | "inventory" | "map" | "radio" | "market" | "wardrobe" | "rides" | "food" | "travel" | "districts" | "fuel" | "radar" | "settings" | "friends";
  prompt: { kind: PromptKind; label: string; vehicleId?: string; buildingLabel?: string; buildingKind?: string; hotspotId?: string } | null;
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

function detectDefaultGraphicsQuality(): "low" | "medium" | "high" {
  if (typeof window === "undefined") return "medium";
  const nav = window.navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;
  const screenWidth = Math.max(window.screen?.width ?? 0, window.innerWidth || 0);

  if (memory <= 3 || cores <= 4 || screenWidth < 380) return "low";
  if (memory >= 8 && cores >= 8 && screenWidth >= 1200) return "high";
  return "medium";
}

function getInitialGraphicsQuality(): "low" | "medium" | "high" {
  if (typeof window === "undefined") return "medium";
  try {
    const saved = localStorage.getItem("lagos-graphics-quality");
    if (saved === "low" || saved === "medium" || saved === "high") return saved;
  } catch {
    // Storage may be disabled; fall back to device detection.
  }
  return detectDefaultGraphicsQuality();
}

const DEFAULTS = {
  started: false,
  city: "newmap" as CityId,
  stadiumMode: false,
  onlinePlayers: {} as Record<string, OnlinePlayer>,
  xp: 0,
  level: 1,
  skills: { ...DEFAULT_SKILLS },
  employment: {} as Partial<Record<JobType, EmploymentRecord>>,
  workShift: null as WorkShift | null,
  workCommute: null as WorkCommute | null,
  timeMode: "accelerated" as const,
  graphicsQuality: getInitialGraphicsQuality(),
  name: "",
  cash: 100_000_000_000,
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
  interior: true,
  interiorLabel: "Your 3-Room Flat",
  interiorKind: "home",
  waypoint: null as GpsWaypoint | null,
  rideRequest: null as RideRequest | null,
  phoneApp: "home" as const,
  prompt: null as GameStore["prompt"],
  modal: null as GameStore["modal"],
  clock: 9.5,
  speedKph: 0,
  fuelLevel: 100,
  nearJobTarget: 0,
  driving: false,
};

export const useGame = create<GameStore>((set, get) => ({
  ...DEFAULTS,
  setTimeMode: (timeMode) => { set({ timeMode }); get().save(); },
  hireForRole: (role) => {
    if (get().employment[role]) return false;
    set({ employment: { ...get().employment, [role]: { role, hiredAt: Date.now(), shiftsCompleted: 0, totalEarned: 0 } } });
    get().radio("📄 Employment contract signed: " + JOB_INFO[role].title + ". You can now clock in for shifts.");
    get().save(); return true;
  },
  clockIn: (role) => {
    const current = get();
    if (!current.employment[role] || current.workShift || current.workCommute || current.activeJob) return false;
    if (current.needs.energy < 10 || current.needs.health < 15) return false;
    if (current.interior && current.interiorKind !== "home") return false;
    const workplaces: Record<JobType, { label: string; kind: string; point: [number, number] }> = {
      courier: { label: "Courier & Logistics Depot", kind: "courier-depot", point: [22, 47] },
      driver: { label: "City Transport Depot", kind: "transport-depot", point: [-40, 32] },
      trader: { label: "Balogun Market", kind: "market", point: [-40, 32] },
      security: { label: "Police Headquarters", kind: "police", point: [86, 78] },
      construction: { label: "Construction Site Office", kind: "construction-site", point: [86, 78] },
      retail: { label: "Retail & Corporate Plaza", kind: "retail-workplace", point: [2, 42] },
      airport: { label: "Airport Cargo Operations", kind: "airport", point: [140, -132] },
      "estate-agent": { label: "Property & Estate Office", kind: "estate-office", point: [151, 88] },
    };
    const destination = workplaces[role];
    if (current.interior) {
      const returnPosition = g.interiorReturn.clone();
      current.setInterior(false);
      g.playerPos.copy(returnPosition);
    }
    g.joy.x = 0; g.joy.y = 0; g.playerSpeed = 0;
    const start = { x: g.playerPos.x, z: g.playerPos.z };
    const end = { x: destination.point[0], z: destination.point[1] };
    const vehicleId = "work-commute-" + Date.now();
    g.vehicles.set(vehicleId, { id: vehicleId, model: "taxi", px: start.x, pz: start.z, vx: 0, vz: 0, yaw: Math.atan2(end.x-start.x,end.z-start.z), speed: 0, color: "#d8b83f", fuel: 100 });
    const startedAt = Date.now();
    set({ workCommute: { role, stage: "pickup", startedAt, workplace: destination.label }, waypoint: { x: end.x, z: end.z, label: destination.label, kind: destination.kind } });
    get().radio("🚕 Your work ride is arriving. Your commute is beginning.");
    const duration = 6500;
    const timer = window.setInterval(() => {
      const elapsed = Math.min(1, (Date.now() - startedAt) / duration);
      const vehicle = g.vehicles.get(vehicleId);
      if (vehicle) {
        vehicle.px = start.x + (end.x-start.x) * elapsed;
        vehicle.pz = start.z + (end.z-start.z) * elapsed;
        vehicle.speed = elapsed < 1 ? 8 : 0;
        vehicle.yaw = Math.atan2(end.x-start.x,end.z-start.z);
      }
      if (elapsed >= 1) {
        window.clearInterval(timer);
        g.vehicles.delete(vehicleId);
        g.playerPos.set(104, 0, 104);
        g.playerYaw = Math.PI;
        current.setInterior(true, destination.label, destination.kind);
        set({ workCommute: { role, stage: "working", startedAt, workplace: destination.label }, waypoint: null, workShift: { role, startedAt: Date.now(), durationMinutes: 10 } });
        get().radio("🏢 Arrived at " + destination.label + ". Your shift has started.");
        get().save();
      }
    }, 50);
    get().save();
    return true;
  },
  clockOut: () => {
    const shift = get().workShift; if (!shift) return false;
    const elapsed = (Date.now() - shift.startedAt) / 60000;
    if (elapsed < 2) return false;
    const minutes = Math.min(shift.durationMinutes, elapsed);
    const base = JOB_INFO[shift.role].payout;
    const skill = get().skills[JOB_SKILL_MAP[shift.role]];
    const payout = Math.round(base * Math.min(1, minutes / 10) * skillPayoutMultiplier(skill.level));
    const record = get().employment[shift.role];
    if (!record || payout <= 0) return false;
    get().earn(payout, "bank"); get().addXp(25); get().addSkillXp(JOB_SKILL_MAP[shift.role], 20);
    set({ workShift: null, workCommute: null, employment: { ...get().employment, [shift.role]: { ...record, shiftsCompleted: record.shiftsCompleted + 1, totalEarned: record.totalEarned + payout } }, needs: { ...get().needs, energy: Math.max(0, get().needs.energy - 8), fun: Math.max(0, get().needs.fun - 3) } });
    get().radio("✅ Shift completed. " + N(payout) + " paid to your bank."); get().save(); return true;
  },
  setGraphicsQuality: (quality) => { if (typeof window !== "undefined") localStorage.setItem("lagos-graphics-quality", quality); set({ graphicsQuality: quality }); },
  setCity: (city) => {
    setCityWorld(city);
    g.playerPos.set(city === "newmap" ? 0 : -14, 0, city === "newmap" ? 29 : -14);
    g.playerYaw = Math.PI; g.camYaw = 0; g.camPitch = 0.34; g.camDistance = 8;
    g.joy.x = 0; g.joy.y = 0; g.drivingId = null; g.vehicles.clear(); g.ridingPassenger = false; g.sirenOn = false;
    set({ city, stadiumMode: false, clock: city === "newmap" ? 9.5 : get().clock, driving: false, speedKph: 0, waypoint: null, activeJob: null, interior: false, interiorLabel: "", phoneOpen: false });
     if (city === "newmap") g.time = 9.5;
    get().save();
  },
  enterStadium: () => {
    g.playerPos.set(0, 0, 8.4); g.playerYaw = Math.PI;
    g.camYaw = 0; g.camPitch = 0.08; g.camDistance = 38;
    g.joy.x = 0; g.joy.y = 0; g.drivingId = null; g.ridingPassenger = false; g.playerSpeed = 0;
    set({ stadiumMode: true, driving: false, speedKph: 0, phoneOpen: false });
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
  addSkillXp: (skill, amount) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const current = get().skills[skill];
    if (!current) return;
    const xp = current.xp + Math.floor(amount);
    const level = skillLevelForXp(xp);
    set({ skills: { ...get().skills, [skill]: { xp, level } } });
    if (level > current.level) get().radio("⭐ " + SKILL_INFO[skill].label + " skill reached Level " + level + ".");
    get().save();
  },
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
      g.playerPos.set(104, 0, 104); g.interiorReturn.set(savedCity === "newmap" ? 0 : saved.x, 0, savedCity === "newmap" ? 29 : saved.z);
      if (savedCity === "newmap") { g.playerYaw = Math.PI; g.camYaw = 0; g.camPitch = 0.34; g.camDistance = 8; }
      // Restore the saved world clock for NEW MAP too; resetting it to 09:30
      // on every load made the day/night cycle appear to never persist.
      const restoredTime = Number.isFinite(saved.time) ? ((saved.time % 24) + 24) % 24 : 9.5;
      g.time = restoredTime;
      set({
        started: true, city: savedCity, stadiumMode: false, interior: true, interiorLabel: "Your 3-Room Flat", interiorKind: "home", name: saved.name || "Hustler", cash: saved.cash, bank: saved.bank, transactions: saved.transactions ?? [], xp: Math.max(0, saved.xp ?? 0), level: Math.floor(Math.max(0, saved.xp ?? 0) / 100) + 1,
        employment: saved.employment ?? {}, workShift: saved.workShift ?? null, timeMode: saved.timeMode ?? "accelerated",
        skills: Object.fromEntries((Object.keys(DEFAULT_SKILLS) as SkillKey[]).map((key) => { const savedSkill = saved.skills?.[key]; const skillXp = Math.max(0, Number(savedSkill?.xp) || 0); return [key, { xp: skillXp, level: skillLevelForXp(skillXp) }]; })) as SkillProgression,
        inventory: saved.inventory || {}, owned: saved.owned || [],
        jobStats: { ...DEFAULTS.jobStats, ...saved.jobStats },
        activeJob: saved.activeJob ?? null,
        waypoint: saved.waypoint ?? null,
        outfit: { ...DEFAULTS.outfit, ...(saved.outfit ?? {}) },
        needs: { ...DEFAULT_NEEDS, ...(saved.needs ?? {}) },
        background: { ...DEFAULTS.background, ...(saved.background ?? {}) },
        characterTraits: saved.characterTraits ?? DEFAULTS.characterTraits,
        unlockedDistricts: saved.unlockedDistricts ?? ["Yaba / Surulere"],
        rentals: saved.rentals ?? {},
        spawnedVehicles: Array.isArray(saved.spawnedVehicles) ? saved.spawnedVehicles : [],
        clock: restoredTime,
        hasSave: true,
      });
    } else {
      setCityWorld(get().city);
      if (get().city === "newmap") {
        g.playerPos.set(104, 0, 104); g.interiorReturn.set(0, 0, 29);
        g.camDistance = 24; g.camPitch = 0.72;
        g.playerYaw = Math.PI; g.camYaw = 0; g.camPitch = 0.34; g.camDistance = 8;
      } else {
        g.playerPos.set(104, 0, 104); g.interiorReturn.set(-14, 0, 18.2);
        g.camDistance = 24; g.camPitch = 0.72;
        g.playerYaw = Math.PI; g.camYaw = 0; g.camPitch = 0.25; g.camDistance = 16;
      }
      g.time = get().city === "newmap" ? 9.5 : 8;
      localStorage.removeItem(SAVE_KEY);
      set({ ...DEFAULTS, started: true, interior: true, interiorLabel: "Your 3-Room Flat", interiorKind: "home", cash: DEFAULTS.cash, clock: get().city === "newmap" ? 9.5 : 8, name: get().name || "Hustler" });
    }
    g.started = true;
    if (!fresh && typeof window !== "undefined") {
      void readCloudSave().then((cloud) => {
        if (!cloud || !get().started) return;
        let localSavedAt = 0;
        try {
          const local = localStorage.getItem(SAVE_KEY);
          localSavedAt = local ? (Number((JSON.parse(local) as SaveData).savedAt) || 0) : 0;
        } catch { /* ignore corrupt local cache */ }
        if (cloud.updatedAt > localSavedAt && cloud.state && typeof cloud.state === "object") {
          try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(cloud.state));
            get().start(false);
            get().radio("☁️ Your latest cloud save has been restored.");
          } catch (error) {
            console.warn("[CloudSave] Could not apply cloud snapshot.", error);
          }
        } else if (localSavedAt > cloud.updatedAt) {
          get().save();
        }
      });
    }
  },
  setName: (name) => { set({ name: name.slice(0, 16) }); get().save(); },
  setBackground: (background) => { set({ background: { ...get().background, ...background } }); get().save(); },
  setCharacterTraits: (characterTraits) => { set({ characterTraits: [...new Set(characterTraits)].slice(0, 3) }); get().save(); },

  save: () => {
    const s = get();
    if (!s.started) return;
    const data: SaveData = {
      name: s.name, city: s.city, xp: s.xp, skills: s.skills, employment: s.employment, workShift: s.workShift, timeMode: s.timeMode, cash: s.cash, bank: s.bank, transactions: s.transactions.slice(-50), inventory: s.inventory, owned: s.owned,
      jobStats: s.jobStats, time: g.time, savedAt: Date.now(), x: g.playerPos.x, z: g.playerPos.z,
      activeJob: s.activeJob, waypoint: s.waypoint, outfit: s.outfit, needs: s.needs, background: s.background, characterTraits: s.characterTraits, unlockedDistricts: s.unlockedDistricts, rentals: s.rentals, spawnedVehicles: s.spawnedVehicles.map((vehicle) => { const runtime = g.vehicles.get(vehicle.id); const shouldPersistFuel = vehicle.id.startsWith("own-") || vehicle.fuel !== undefined; return { ...vehicle, x: runtime?.px ?? vehicle.x, z: runtime?.pz ?? vehicle.z, rotY: runtime?.yaw ?? vehicle.rotY, ...(shouldPersistFuel ? { fuel: runtime?.fuel ?? vehicle.fuel ?? 100 } : {}), ...(vehicle.condition !== undefined ? { condition: vehicle.condition } : {}) }; }),
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* storage full */ }
    queueCloudSave(data as unknown as Record<string, unknown>);
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
      const jobSkill = JOB_SKILL_MAP[job.type];
      const skillLevel = get().skills[jobSkill].level;
      const paidAmount = Math.round(job.payout * skillPayoutMultiplier(skillLevel));
      get().earn(paidAmount, "bank");
      get().addXp(45);
      get().addSkillXp(jobSkill, 35);
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("roleplay-job-completed", { detail: { job_type: job.type, earnings: paidAmount, title: job.title } }));
      set({ activeJob: null, jobStats: stats, waypoint: null });
      get().save();
      get().radio(`✅ Job complete — ${N(paidAmount)} paid into your bank account. ${skillLevel >= 5 ? "10% skill bonus applied." : skillLevel >= 3 ? "5% skill bonus applied." : ""}`);
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
    const fun = Math.max(0, n.fun - seconds / 150);
    const bladder = Math.min(100, n.bladder + seconds / 210);
    const stress = Math.min(100, n.stress + (g.playerSpeed > 5 ? seconds * 0.035 : seconds * 0.008));
    const hygiene = Math.max(0, n.hygiene - seconds / 180);
    const health = Math.max(0, Math.min(100, n.health + (hunger > 15 && energy > 10 ? seconds * 0.006 : -seconds * 0.06)));
    set({ needs: { hunger, energy, health, stress, hygiene, fun, bladder } });
  },
  eatFood: (kind) => {
    const choices = { "mama-put": { price: 900, hunger: 42, energy: 12, stress: -8, hygiene: 0, message: "🍲 Mama Put rice and stew — belle don full!" }, snack: { price: 250, hunger: 12, energy: 3, stress: -2, hygiene: 0, message: "🥟 Quick roadside snack bought." }, water: { price: 150, hunger: 0, energy: 2, stress: -4, hygiene: 0, message: "💧 Cold sachet water. Refreshing!" } } as const;
    const item = choices[kind];
    if (!get().spend(item.price, "cash") && !get().spend(item.price, "bank")) return false;
    const n = get().needs;
    set({ needs: { ...n, hunger: Math.min(100, n.hunger + item.hunger), energy: Math.min(100, n.energy + item.energy), stress: Math.max(0, n.stress + item.stress), bladder: Math.min(100, n.bladder + (kind === "water" ? 14 : 5)) } });
    get().radio(item.message); get().save(); return true;
  },
  sleep: () => {
    const n = get().needs;
    g.time = 7;
    set({ clock: 7, needs: { ...n, hunger: Math.max(0, n.hunger - 8), energy: 100, health: Math.min(100, n.health + 8), stress: Math.max(0, n.stress - 24), fun: Math.min(100, n.fun + 24), bladder: Math.min(100, n.bladder + 10) } });
    get().save();
    get().radio("🏠 You rested until 07:00. Energy restored; a new Lagos morning begins.");
  },
  useBathroom: () => {
    const s = get();
    if (!s.interior) { get().radio("🚻 Find a home, mall or public restroom first."); return false; }
    set({ needs: { ...s.needs, bladder: 0, hygiene: Math.min(100, s.needs.hygiene + 3), stress: Math.max(0, s.needs.stress - 3) } });
    get().radio("🚻 Bathroom break complete."); get().save(); return true;
  },
  shower: () => {
    const s = get();
    if (!s.interior || !/home|apartment|studio|house|mansion/i.test(s.interiorLabel)) { get().radio("🚿 You need to be inside your home to shower."); return false; }
    set({ needs: { ...s.needs, hygiene: 100, stress: Math.max(0, s.needs.stress - 8) } });
    get().radio("🚿 Fresh and clean. Hygiene restored."); get().save(); return true;
  },
  restoreFun: (amount = 18) => { const n=get().needs; set({ needs: { ...n, fun: Math.min(100,n.fun+Math.max(0,amount)), stress: Math.max(0,n.stress-5) } }); get().save(); },
  setInterior: (inside, label, kind) => set({ interior: inside, ...(label ? { interiorLabel: label } : {}), ...(kind ? { interiorKind: kind } : {}) }),
  setWaypoint: (waypoint) => { set({ waypoint }); get().save(); },
  requestRide: (service) => {
    const s = get();
    if (!s.waypoint || s.driving || s.rideRequest) return false;
    const destinationDistrict = districtAt(s.waypoint.x, s.waypoint.z);
    if (destinationDistrict && (!s.unlockedDistricts.includes(destinationDistrict) || (destinationDistrict === "Eko Atlantic" && !s.unlockedDistricts.includes("Lekki / Victoria Island")))) return false;
    const distance = Math.hypot(g.playerPos.x - s.waypoint.x, g.playerPos.z - s.waypoint.z);
    const baseFare = service === "bike" ? 700 : service === "private" ? 4200 : service === "danfo" ? 300 : service === "keke" ? 500 : 1600;
    const rate = service === "bike" ? 3.2 : service === "private" ? 10 : service === "danfo" ? 1.1 : service === "keke" ? 1.8 : 4.5;
    const fare = Math.ceil(baseFare + distance * rate);
    // Split payment: use available cash first, then debit only the remainder from the bank.
    const cashPart = Math.min(s.cash, fare);
    if (cashPart > 0 && !s.spend(cashPart, "cash")) return false;
    const bankPart = fare - cashPart;
    if (bankPart > 0 && !get().spend(bankPart, "bank")) {
      if (cashPart > 0) get().earn(cashPart, "cash");
      return false;
    }
    const offset = service === "bike" ? 10 : service === "danfo" ? 20 : 16;
    const x = clampWorld(g.playerPos.x + offset, g.playerPos.z - offset, 2)[0];
    const z = clampWorld(g.playerPos.x + offset, g.playerPos.z - offset, 2)[1];
    set({ rideRequest: { id: `ride-${Date.now()}`, service, status: "approaching", destination: { ...s.waypoint }, fare, x, z, yaw: Math.atan2(-offset, offset) } });
    get().radio(service === "bike" ? "🏍️ Okada rider accepted the trip and is coming to your location." : service === "private" ? "🚘 Private driver confirmed and is on the way." : service === "danfo" ? "🚌 Danfo driver accepted your trip." : service === "keke" ? "🛺 Keke driver accepted your trip." : "🚕 Ride accepted. Your driver is on the way.");
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
