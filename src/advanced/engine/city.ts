export const BLOCKS = 7;
export const ROAD = 12;
export const BLOCK = 40;
export const PITCH = BLOCK + ROAD;
export const HALF = (BLOCKS * PITCH + ROAD) / 2;
export const LANE = 3;
export const SIDEWALK = 3;

export type District = "market" | "downtown" | "residential" | "industrial" | "beach";

export const DISTRICTS: Record<District, { name: string; color: string; heights: [number, number]; palette: string[] }> = {
  market: { name: "Balogun Market", color: "#f5c400", heights: [6, 14], palette: ["#c9734a", "#d9a25f", "#b85c3c", "#e0c48a", "#8f5a3a"] },
  downtown: { name: "Marina Downtown", color: "#4fa3ff", heights: [24, 62], palette: ["#5d6b7a", "#7c8a99", "#394552", "#9aa7b3", "#4a5868"] },
  residential: { name: "Surulere", color: "#1fbf75", heights: [7, 18], palette: ["#e6d3b3", "#c7b299", "#f0e2c8", "#b9a07f", "#d8c2a0"] },
  industrial: { name: "Apapa Docks", color: "#ff7a3d", heights: [8, 16], palette: ["#6e6a63", "#857f73", "#5a564f", "#9a8f7c", "#4d4a45"] },
  beach: { name: "Bar Beach", color: "#3ee0d0", heights: [5, 12], palette: ["#f2e6cf", "#e8d6b5", "#ffffff", "#d4c3a3", "#c6e2e0"] },
};

export type LandmarkKind = "garage" | "fuel" | "hospital" | "police" | "food" | "home" | "bank" | "market";

export const LANDMARK_INFO: Record<LandmarkKind, { label: string; color: string; action: string }> = {
  garage: { label: "Ikeja Motors", color: "#f5c400", action: "Buy & repair vehicles" },
  fuel: { label: "NNPC Fuel", color: "#ff7a3d", action: "Refuel vehicle" },
  hospital: { label: "General Hospital", color: "#ff4d6d", action: "Heal" },
  police: { label: "Police HQ", color: "#4fa3ff", action: "Pay fines" },
  food: { label: "Mama Put", color: "#1fbf75", action: "Eat" },
  home: { label: "Your Apartment", color: "#c58bff", action: "Sleep & save" },
  bank: { label: "Eko Bank", color: "#3ee0d0", action: "Deposit cash" },
  market: { label: "Market Depot", color: "#f5c400", action: "Pick up deliveries" },
};

export type Building = { x: number; z: number; w: number; d: number; h: number; color: string; district: District; bucket: number };
export type Landmark = { kind: LandmarkKind; x: number; z: number; w: number; d: number; h: number; door: [number, number] };
export type BlockInfo = { bx: number; bz: number; x0: number; z0: number; x1: number; z1: number; district: District; park: boolean };

export const HEIGHT_BUCKETS = [10, 18, 30, 48, 70];

export function roadCenter(i: number) {
  return -HALF + ROAD / 2 + i * PITCH;
}

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function districtFor(bx: number, bz: number): District {
  if (bz === BLOCKS - 1) return "beach";
  if (bx >= 2 && bx <= 4 && bz >= 2 && bz <= 4) return "downtown";
  if (bx <= 1 && bz <= 2) return "market";
  if (bx >= 5 && bz <= 2) return "industrial";
  return "residential";
}

const LANDMARK_BLOCKS: Array<[LandmarkKind, number, number]> = [
  ["home", 1, 4],
  ["garage", 5, 3],
  ["fuel", 2, 1],
  ["fuel", 4, 5],
  ["hospital", 4, 1],
  ["police", 2, 5],
  ["food", 3, 3],
  ["food", 0, 1],
  ["bank", 3, 2],
  ["market", 0, 0],
];

const PARK_BLOCKS = new Set(["3,4", "6,5", "1,6", "5,6"]);

function buildCity() {
  const rand = mulberry(20260611);
  const blocks: BlockInfo[] = [];
  const buildings: Building[] = [];
  const landmarks: Landmark[] = [];

  for (let bx = 0; bx < BLOCKS; bx++) {
    for (let bz = 0; bz < BLOCKS; bz++) {
      const x0 = roadCenter(bx) + ROAD / 2;
      const z0 = roadCenter(bz) + ROAD / 2;
      const x1 = x0 + BLOCK;
      const z1 = z0 + BLOCK;
      const district = districtFor(bx, bz);
      const park = PARK_BLOCKS.has(`${bx},${bz}`);
      blocks.push({ bx, bz, x0, z0, x1, z1, district, park });
      if (park) continue;

      const landmark = LANDMARK_BLOCKS.find(([, lx, lz]) => lx === bx && lz === bz);
      const inner = SIDEWALK + 1;
      const ix0 = x0 + inner;
      const iz0 = z0 + inner;
      const span = BLOCK - inner * 2;
      const info = DISTRICTS[district];
      const lots = district === "downtown" ? 2 : 3;
      const lot = span / lots;

      for (let lx = 0; lx < lots; lx++) {
        for (let lz = 0; lz < lots; lz++) {
          if (lots === 3 && lx === 1 && lz === 1) continue;
          if (landmark && lz === 0 && (lots === 2 ? lx === 0 : lx <= 1)) continue;
          if (district === "beach" && lz === lots - 1) continue;
          const gap = 1.4;
          const w = lot - gap - rand() * 2;
          const d = lot - gap - rand() * 2;
          const [hmin, hmax] = info.heights;
          const h = hmin + Math.pow(rand(), 1.6) * (hmax - hmin);
          let bucket = HEIGHT_BUCKETS.findIndex((b) => h <= b);
          if (bucket < 0) bucket = HEIGHT_BUCKETS.length - 1;
          buildings.push({
            x: ix0 + lot * lx + lot / 2,
            z: iz0 + lot * lz + lot / 2,
            w,
            d,
            h: HEIGHT_BUCKETS[bucket],
            color: info.palette[Math.floor(rand() * info.palette.length)],
            district,
            bucket,
          });
        }
      }

      if (landmark) {
        const [kind] = landmark;
        const w = lots === 2 ? lot - 2 : lot * 2 - 2;
        const d = lot - 3;
        const x = ix0 + w / 2 + 1;
        const z = iz0 + d / 2 + 1.5;
        landmarks.push({ kind, x, z, w, d, h: kind === "hospital" ? 16 : kind === "bank" ? 22 : 7, door: [x, z0 - 1] });
      }
    }
  }
  return { blocks, buildings, landmarks };
}

export const CITY = buildCity();

export type Rect = { x0: number; z0: number; x1: number; z1: number };

export const COLLIDERS: Rect[] = [
  ...CITY.buildings.map((b) => ({ x0: b.x - b.w / 2, z0: b.z - b.d / 2, x1: b.x + b.w / 2, z1: b.z + b.d / 2 })),
  ...CITY.landmarks.map((b) => ({ x0: b.x - b.w / 2, z0: b.z - b.d / 2, x1: b.x + b.w / 2, z1: b.z + b.d / 2 })),
];

const GRID: Map<string, Rect[]> = new Map();
const CELL = 26;
for (const r of COLLIDERS) {
  for (let cx = Math.floor(r.x0 / CELL); cx <= Math.floor(r.x1 / CELL); cx++) {
    for (let cz = Math.floor(r.z0 / CELL); cz <= Math.floor(r.z1 / CELL); cz++) {
      const k = `${cx},${cz}`;
      if (!GRID.has(k)) GRID.set(k, []);
      GRID.get(k)!.push(r);
    }
  }
}

export type Hit = { nx: number; nz: number; depth: number };

export function resolveCircle(p: { x: number; z: number }, radius: number): Hit | null {
  let hit: Hit | null = null;
  const cx = Math.floor(p.x / CELL);
  const cz = Math.floor(p.z / CELL);
  for (let ox = -1; ox <= 1; ox++) {
    for (let oz = -1; oz <= 1; oz++) {
      const list = GRID.get(`${cx + ox},${cz + oz}`);
      if (!list) continue;
      for (const r of list) {
        const qx = Math.max(r.x0, Math.min(p.x, r.x1));
        const qz = Math.max(r.z0, Math.min(p.z, r.z1));
        let dx = p.x - qx;
        let dz = p.z - qz;
        let dist = Math.hypot(dx, dz);
        if (dist >= radius) continue;
        let depth: number;
        if (dist < 1e-5) {
          const l = p.x - r.x0, rr = r.x1 - p.x, t = p.z - r.z0, b = r.z1 - p.z;
          const m = Math.min(l, rr, t, b);
          dx = m === l ? -1 : m === rr ? 1 : 0;
          dz = m === t ? -1 : m === b ? 1 : 0;
          dist = 1;
          depth = m + radius;
        } else {
          depth = radius - dist;
        }
        const nx = dx / dist;
        const nz = dz / dist;
        p.x += nx * depth;
        p.z += nz * depth;
        hit = { nx, nz, depth };
      }
    }
  }
  const lim = HALF - 1;
  if (Math.abs(p.x) > lim) {
    p.x = Math.sign(p.x) * lim;
    hit = { nx: -Math.sign(p.x), nz: 0, depth: 0.5 };
  }
  if (Math.abs(p.z) > lim) {
    p.z = Math.sign(p.z) * lim;
    hit = { nx: 0, nz: -Math.sign(p.z), depth: 0.5 };
  }
  return hit;
}

export function districtAt(x: number, z: number): District {
  const bx = Math.max(0, Math.min(BLOCKS - 1, Math.floor((x + HALF) / PITCH)));
  const bz = Math.max(0, Math.min(BLOCKS - 1, Math.floor((z + HALF) / PITCH)));
  return districtFor(bx, bz);
}

export function nearestLandmark(x: number, z: number, max = 6) {
  let best: Landmark | null = null;
  let bestD = max;
  for (const l of CITY.landmarks) {
    const d = Math.hypot(l.door[0] - x, l.door[1] - z);
    if (d < bestD) {
      bestD = d;
      best = l;
    }
  }
  return best;
}

export function landmarkOf(kind: LandmarkKind) {
  return CITY.landmarks.find((l) => l.kind === kind)!;
}

export function randomCurbPoint(rand: () => number = Math.random): [number, number] {
  const roadIdx = Math.floor(rand() * (BLOCKS + 1));
  const along = -HALF + ROAD + rand() * (HALF * 2 - ROAD * 2);
  const side = rand() < 0.5 ? -1 : 1;
  const c = roadCenter(roadIdx) + side * (ROAD / 2 + 1);
  return rand() < 0.5 ? [c, along] : [along, c];
}

export const DIRS: Array<[number, number]> = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];
