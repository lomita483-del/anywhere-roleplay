import { create } from "zustand";
import { JOB_POINTS, POIS, isBlocked, clampWorld } from "./city";
import { g } from "./state";

export type JobType = "courier" | "driver" | "trader" | "security";

export interface ActiveJob {
  type: JobType;
  stage: number;
  targets: [number, number][]; // per-stage target coords
  payout: number;
  title: string;
  hint: string;
}

export type PromptKind = "vehicle" | "atm" | "dealer" | "home" | "job-target" | null;

export interface JobStats {
  deliveries: number;
  drives: number;
  trades: number;
  patrols: number;
}

export interface SaveData {
  name: string;
  cash: number;
  bank: number;
  inventory: Record<string, number>;
  owned: string[];
  jobStats: JobStats;
  time: number;
  x: number;
  z: number;
}

export const SAVE_KEY = "lagos-hustle-save-v1";

const N = (n: number) => "₦" + n.toLocaleString("en-NG");

export const VEHICLE_CATALOG: Record<
  string,
  { model: string; name: string; price: number; maxSpeed: number; accel: number; turn: number }
> = {
  keke: { model: "keke", name: "Keke Napep", price: 25000, maxSpeed: 12, accel: 14, turn: 2.6 },
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
  trader: { title: "Trader", desc: "Buy goods at Balogun Market, sell at the Trade Depot.", payout: 4500 },
  security: { title: "Security Patrol", desc: "Walk 3 checkpoints across the city on foot.", payout: 2600 },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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
  name: string;
  cash: number;
  bank: number;
  inventory: Record<string, number>;
  owned: string[];
  jobStats: JobStats;
  activeJob: ActiveJob | null;
  phoneOpen: boolean;
  phoneApp: "home" | "bank" | "jobs" | "garage" | "inventory" | "map" | "radio";
  prompt: { kind: PromptKind; label: string; vehicleId?: string } | null;
  modal: "atm" | "dealer" | "home" | "bank" | null;
  clock: number; // HUD-facing in-game hour, synced at ~1Hz
  speedKph: number;
  nearJobTarget: number; // meters to current target
  driving: boolean;
  hasSave: boolean;
  lastRadio: number;

  start: (fresh: boolean) => void;
  setName: (n: string) => void;
  save: () => void;
  spend: (amount: number, from: "cash" | "bank") => boolean;
  earn: (amount: number, to: "cash" | "bank") => void;
  transfer: (amount: number, dir: "deposit" | "withdraw") => void;
  addItem: (item: string, count?: number) => void;
  removeItem: (item: string, count?: number) => void;
  buyVehicle: (key: string) => boolean;
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
  name: "",
  cash: 5000,
  bank: 10000,
  inventory: {} as Record<string, number>,
  owned: [] as string[],
  jobStats: { deliveries: 0, drives: 0, trades: 0, patrols: 0 },
  activeJob: null as ActiveJob | null,
  phoneOpen: false,
  phoneApp: "home" as const,
  prompt: null as GameStore["prompt"],
  modal: null as GameStore["modal"],
  clock: 8,
  speedKph: 0,
  nearJobTarget: 0,
  driving: false,
};

export const useGame = create<GameStore>((set, get) => ({
  ...DEFAULTS,
  hasSave: false,
  lastRadio: 0,

  start: (fresh) => {
    const saved = fresh ? null : loadSave();
    if (saved) {
      g.playerPos.set(saved.x, 0, saved.z);
      g.time = saved.time;
      set({
        started: true, name: saved.name || "Hustler", cash: saved.cash, bank: saved.bank,
        inventory: saved.inventory || {}, owned: saved.owned || [],
        jobStats: { ...DEFAULTS.jobStats, ...saved.jobStats }, clock: saved.time, hasSave: true,
      });
    } else {
      g.playerPos.set(-14, 0, -14);
      g.time = 8;
      localStorage.removeItem(SAVE_KEY);
      set({ ...DEFAULTS, started: true, name: get().name || "Hustler" });
    }
    g.started = true;
  },
  setName: (name) => set({ name: name.slice(0, 16) }),

  save: () => {
    const s = get();
    if (!s.started) return;
    const data: SaveData = {
      name: s.name, cash: s.cash, bank: s.bank, inventory: s.inventory, owned: s.owned,
      jobStats: s.jobStats, time: g.time, x: g.playerPos.x, z: g.playerPos.z,
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* storage full */ }
  },

  spend: (amount, from) => {
    const s = get();
    const bal = from === "cash" ? s.cash : s.bank;
    if (bal < amount) return false;
    set(from === "cash" ? { cash: s.cash - amount } : { bank: s.bank - amount });
    return true;
  },
  earn: (amount, to) => {
    const s = get();
    set(to === "cash" ? { cash: s.cash + amount } : { bank: s.bank + amount });
  },
  transfer: (amount, dir) => {
    const s = get();
    if (dir === "deposit") {
      if (s.cash < amount) return;
      set({ cash: s.cash - amount, bank: s.bank + amount });
    } else {
      if (s.bank < amount) return;
      set({ bank: s.bank - amount, cash: s.cash + amount });
    }
  },
  addItem: (item, count = 1) => {
    const inv = { ...get().inventory };
    inv[item] = (inv[item] || 0) + count;
    set({ inventory: inv });
  },
  removeItem: (item, count = 1) => {
    const inv = { ...get().inventory };
    const left = (inv[item] || 0) - count;
    if (left > 0) inv[item] = left; else delete inv[item];
    set({ inventory: inv });
  },
  buyVehicle: (key) => {
    const v = VEHICLE_CATALOG[key];
    if (!v) return false;
    if (!get().spend(v.price, "bank")) return false;
    set({ owned: [...get().owned, key] });
    return true;
  },

  acceptJob: (type) => set({ activeJob: makeJob(type), phoneOpen: false }),
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
      set({ activeJob: null, jobStats: stats });
      get().radio(`✅ Job complete — ${N(job.payout)} paid into your bank account.`);
    } else {
      set({ activeJob: { ...job, stage: next } });
    }
  },
  cancelJob: () => set({ activeJob: null }),

  bumpStat: (stat) => set({ jobStats: { ...get().jobStats, [stat]: get().jobStats[stat] + 1 } }),
  openPhone: (app) => set({ phoneOpen: true, phoneApp: app ?? get().phoneApp }),
  closePhone: () => set({ phoneOpen: false }),
  setPrompt: (p) => { if (JSON.stringify(p) !== JSON.stringify(get().prompt)) set({ prompt: p }); },
  setModal: (m) => set({ modal: m }),
  setClock: (h) => set({ clock: h }),
  setSpeed: (kph) => { if (Math.abs(kph - get().speedKph) > 0.8) set({ speedKph: kph }); },
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
  return job.targets[job.stage];
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
    if (job.type === "trader" && job.stage === 1 && !(useGame.getState().inventory["goods"] > 0)) {
      useGame.getState().radio("❌ You have no goods to sell.");
      return;
    }
    if (job.type === "courier" && job.stage === 0) useGame.getState().addItem("package", 1);
    if (job.type === "courier" && job.stage === 1) {
      if (!(useGame.getState().inventory["package"] > 0)) return;
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
