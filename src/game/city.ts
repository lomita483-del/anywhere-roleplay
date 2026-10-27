// City layout data — single source of truth for geometry, collision, and POIs.

export interface Box {
  x: number;
  z: number;
  w: number; // width (x extent)
  d: number; // depth (z extent)
  h: number; // height
}

export interface BuildingDef extends Box {
  color: string;
  kind?: "bank" | "police" | "dealership" | "apartments" | "market" | "depot" | "clothing" | "airport";
  label?: string;
}

export const WORLD = 240; // full world size; playable bounds ±118
export const BOUND = 118;

// Roads: N–S at x = -80, 0, 80; E–W at z = -80, 0, 80
export const ROADS_X = [-80, 0, 80];
export const ROADS_Z = [-80, 0, 80];
export const ROAD_HALF = 7;
export const SIDEWALK = 3; // sidewalk band on each side of the road

export const BUILDINGS: BuildingDef[] = [
  // North-west block
  { x: -38, z: -46, w: 26, d: 20, h: 15, color: "#c9b08a", kind: "bank", label: "ZENITH  /  KUDA BANK" },
  { x: -56, z: -60, w: 24, d: 16, h: 9, color: "#7f9ec4", kind: "police", label: "LAGOS POLICE STATION" },
  { x: -58, z: -18, w: 16, d: 16, h: 22, color: "#d8a681" },
  { x: -24, z: -20, w: 14, d: 12, h: 12, color: "#b7c4a0" },
  { x: -38, z: -22, w: 10, d: 10, h: 8, color: "#c98f6d" },
  { x: -62, z: -40, w: 12, d: 12, h: 10, color: "#b5a18b" },
  { x: -18, z: -48, w: 12, d: 10, h: 7, color: "#d5c6a5" },
  { x: -20, z: -62, w: 12, d: 10, h: 8, color: "#b3c0b1" },
  // North-east block
  { x: 40, z: -50, w: 32, d: 16, h: 8, color: "#e0b13e", kind: "dealership", label: "OJOTO CAR DEALERSHIP" },
  { x: 20, z: -22, w: 16, d: 14, h: 24, color: "#9db8c9" },
  { x: 58, z: -22, w: 20, d: 16, h: 13, color: "#c4a3d1" },
  { x: 56, z: -46, w: 12, d: 10, h: 6, color: "#a0b89a" },
  { x: 35, z: -31, w: 12, d: 10, h: 12, color: "#b7a9a0" },
  { x: 65, z: -57, w: 12, d: 10, h: 9, color: "#c4b49b" },
  { x: 18, z: -53, w: 10, d: 10, h: 7, color: "#9caeac" },
  // South-west block — Balogun-style market
  { x: -40, z: 46, w: 34, d: 20, h: 6, color: "#e2954f", kind: "market", label: "BALOGUN MARKET" },
  { x: -20, z: 60, w: 16, d: 14, h: 14, color: "#b8b0a0" },
  { x: -58, z: 30, w: 14, d: 12, h: 18, color: "#c9a0a0" },
  { x: -58, z: 60, w: 18, d: 14, h: 10, color: "#a0c4b8" },
  { x: -12, z: 43, w: 10, d: 10, h: 8, color: "#d6b49c" },
  // Airport district at the edge of the playable city
  { x: 91, z: -96, w: 20, d: 13, h: 8, color: "#b9c7c8", kind: "airport", label: "LAGOS INTERNATIONAL AIRPORT" },
  // South-east block
  { x: 42, z: 52, w: 26, d: 22, h: 26, color: "#d9c4e0", kind: "apartments", label: "IKOYI TOWERS" },
  { x: 62, z: 24, w: 16, d: 14, h: 9, color: "#c4d1a3" },
  { x: 24, z: 26, w: 14, d: 12, h: 11, color: "#d1bfa3" },
  { x: 22, z: 58, w: 14, d: 16, h: 8, color: "#a3b8d1", kind: "depot", label: "TRADE DEPOT" },
  { x: 65, z: 45, w: 10, d: 10, h: 11, color: "#c2b39c" },
  { x: 12, z: 42, w: 10, d: 10, h: 7, color: "#b9c4ba" },
  { x: 2, z: 42, w: 18, d: 14, h: 8, color: "#d2b46b", kind: "clothing", label: "LAGOS BOUTIQUE" },
];

export interface Poi {
  id: string;
  kind: "atm" | "bank" | "police" | "dealership" | "apartments" | "market" | "depot" | "clothing" | "jobboard";
  x: number;
  z: number;
  label: string;
}

// Interaction points — placed on sidewalks / plazas next to their building fronts
export const POIS: Poi[] = [
  { id: "atm-bank", kind: "atm", x: -19, z: -40, label: "ATM" },
  { id: "atm-market", kind: "atm", x: 30, z: 9, label: "ATM" },
  { id: "atm-se", kind: "atm", x: 62, z: 10, label: "ATM" },
  { id: "bank", kind: "bank", x: -19, z: -30, label: "Zenith / Kuda Bank" },
  { id: "police", kind: "police", x: -41, z: -64, label: "Police HQ" },
  { id: "dealership", kind: "dealership", x: 40, z: -61, label: "Ojoto Motors" },
  { id: "home", kind: "apartments", x: 42, z: 38, label: "Ikoyi Towers" },
  { id: "market", kind: "market", x: -40, z: 32, label: "Balogun Market" },
  { id: "depot", kind: "depot", x: 22, z: 47, label: "Trade Depot" },
  { id: "boutique", kind: "clothing", x: 2, z: 32, label: "Lagos Boutique" },
  { id: "job-board", kind: "jobboard", x: 0, z: -14, label: "City Job Board" },
];

// Collision boxes for every building (slightly padded)
export function buildingBoxes(): { minX: number; maxX: number; minZ: number; maxZ: number }[] {
  return BUILDINGS.map((b) => ({
    minX: b.x - b.w / 2 - 0.2,
    maxX: b.x + b.w / 2 + 0.2,
    minZ: b.z - b.d / 2 - 0.2,
    maxZ: b.z + b.d / 2 + 0.2,
  }));
}
export const COLLIDERS = buildingBoxes();

export function isBlocked(x: number, z: number, r: number): boolean {
  for (const b of COLLIDERS) {
    if (
      x > b.minX - r && x < b.maxX + r &&
      z > b.minZ - r && z < b.maxZ + r
    ) return true;
  }
  return false;
}

export function clampWorld(x: number, z: number, r = 0.5): [number, number] {
  const lim = BOUND - r;
  return [Math.max(-lim, Math.min(lim, x)), Math.max(-lim, Math.min(lim, z))];
}

// Market stall canopies in front of the market building
export const STALLS: { x: number; z: number; color: string }[] = [
  { x: -50, z: 30, color: "#e2574c" },
  { x: -44, z: 30, color: "#3fa37a" },
  { x: -38, z: 30, color: "#e2a13c" },
  { x: -32, z: 30, color: "#4a7ec9" },
  { x: -46, z: 36, color: "#c95bb0" },
  { x: -34, z: 36, color: "#5bb06a" },
];

// Display cars in the dealership lot
export const LOT_CARS: { x: number; z: number; rotY: number; color: string }[] = [
  { x: 30, z: -66, rotY: 0.2, color: "#e2c53c" },
  { x: 40, z: -66, rotY: -0.1, color: "#c94a3c" },
  { x: 50, z: -66, rotY: 0.05, color: "#3c9fc9" },
];

// Parked/drivable vehicles around the city
export type VehicleModel = "keke" | "danfo" | "bike" | "taxi" | "sedan" | "sports" | "suv" | "police";
export interface VehicleSpawn {
  id: string;
  model: VehicleModel;
  x: number;
  z: number;
  rotY: number;
}
export const VEHICLE_SPAWNS: VehicleSpawn[] = [
  { id: "keke-1", model: "keke", x: -5, z: -20, rotY: Math.PI },
  { id: "keke-2", model: "keke", x: 74.5, z: 30, rotY: -Math.PI / 2 },
  { id: "danfo-1", model: "danfo", x: -74.5, z: 24, rotY: Math.PI / 2 },
  { id: "danfo-2", model: "danfo", x: 20, z: 74.5, rotY: 0 },
  { id: "bike-1", model: "bike", x: -5, z: 30, rotY: Math.PI },
  { id: "taxi-1", model: "taxi", x: 5, z: 30, rotY: Math.PI },
  { id: "sedan-1", model: "sedan", x: 85.5, z: -30, rotY: Math.PI / 2 },
  { id: "sports-1", model: "sports", x: -30, z: -74.5, rotY: 0 },
  { id: "suv-1", model: "suv", x: -85.5, z: -40, rotY: Math.PI / 2 },
  { id: "police-1", model: "police", x: -44, z: -68, rotY: 0 },
];

// Ambient traffic — cars that loop along the roads
export interface TrafficRoute {
  model: VehicleModel;
  lane: { axis: "x" | "z"; fixed: number; from: number; to: number };
  speed: number;
  offset: number;
}
export const TRAFFIC: TrafficRoute[] = [
  { model: "sedan", lane: { axis: "x", fixed: -5.5, from: -110, to: 110 }, speed: 9, offset: 0.1 },
  { model: "danfo", lane: { axis: "x", fixed: 5.5, from: -110, to: 110 }, speed: 7, offset: 0.55 },
  { model: "taxi", lane: { axis: "x", fixed: 85.5, from: -110, to: 110 }, speed: 10, offset: 0.3 },
  { model: "keke", lane: { axis: "x", fixed: -85.5, from: -110, to: 110 }, speed: 8, offset: 0.8 },
  { model: "suv", lane: { axis: "z", fixed: 5.5, from: -110, to: 110 }, speed: 9, offset: 0.2 },
  { model: "police", lane: { axis: "z", fixed: -5.5, from: -110, to: 110 }, speed: 11, offset: 0.65 },
  { model: "sedan", lane: { axis: "z", fixed: 74.5, from: -110, to: 110 }, speed: 8, offset: 0.4 },
  { model: "taxi", lane: { axis: "z", fixed: -74.5, from: -110, to: 110 }, speed: 9, offset: 0.75 },
];

// Pedestrian walks (sidewalk loops)
export const PED_WALKS: { pts: [number, number][] }[] = [
  { pts: [[-10, -60], [-10, -15], [-73, -15], [-73, -60]] },
  { pts: [[10, 15], [10, 60], [73, 60], [73, 15]] },
  { pts: [[-87, 10], [-87, 73], [-30, 73], [-30, 10]] },
  { pts: [[87, -10], [87, -73], [30, -73], [30, -10]] },
  { pts: [[-73, 87], [-10, 87], [-10, 30], [-73, 30]] },
  { pts: [[-34, -66], [-12, -66], [-12, -42], [-34, -42]] },
  { pts: [[12, -66], [32, -66], [32, -42], [12, -42]] },
  { pts: [[32, 14], [58, 14], [58, 34], [32, 34]] },
  { pts: [[-66, 14], [-50, 14], [-50, 26], [-66, 26]] },
  { pts: [[-30, 40], [-12, 40], [-12, 64], [-30, 64]] },
  { pts: [[18, 40], [18, 68], [36, 68], [36, 40]] },
  { pts: [[70, -70], [70, -42], [94, -42], [94, -70]] },
  { pts: [[72, -112], [104, -112], [104, -88], [72, -88]] },
  { pts: [[-94, 40], [-94, 70], [-76, 70], [-76, 40]] },
  { pts: [[-26, -8], [-8, -8], [-8, 8], [-26, 8]] },
  { pts: [[12, 6], [26, 6], [26, 22], [12, 22]] },
];

// POI points used by job generators
export const JOB_POINTS: { pickups: [number, number][]; dropoffs: [number, number][]; checkpoints: [number, number][] } = {
  pickups: [
    [-40, 28], [-30, 28], [-52, 24], [-19, -40], [40, -61], [-44, -64], [62, 10], [30, 9], [42, 38],
  ],
  dropoffs: [
    [-19, -30], [-44, -64], [40, -61], [42, 38], [-40, 32], [22, 47], [62, 10], [-74.5, 60], [74.5, -60],
  ],
  checkpoints: [
    [-10, -70], [70, -10], [10, 70], [-70, 10], [0, -40], [40, 10], [-40, 74.5], [74.5, 40],
  ],
};

// Streetlight positions along road edges
export function lampPositions(): [number, number][] {
  const lamps: [number, number][] = [];
  for (const rx of ROADS_X) {
    for (let z = -110; z <= 110; z += 40) {
      if (Math.abs(z % 80) < 1 || Math.abs(Math.abs(z) - 80) < 1) continue;
      lamps.push([rx - ROAD_HALF - 1.5, z]);
      lamps.push([rx + ROAD_HALF + 1.5, z + 20]);
    }
  }
  for (const rz of ROADS_Z) {
    for (let x = -100; x <= 100; x += 40) {
      lamps.push([x, rz - ROAD_HALF - 1.5]);
      lamps.push([x + 20, rz + ROAD_HALF + 1.5]);
    }
  }
  return lamps;
}

export function treePositions(): [number, number][] {
  const trees: [number, number][] = [];
  // Outer park ring
  for (let i = 0; i < 36; i++) {
    const side = i % 4;
    const t = (Math.floor(i / 4) + 0.5) * (236 / 9);
    const ox = side === 0 ? -118 + ((i * 37) % 9) : side === 1 ? 118 - ((i * 53) % 9) : t;
    const oz = side === 2 ? -118 + ((i * 29) % 9) : side === 3 ? 118 - ((i * 41) % 9) : t;
    trees.push([Math.max(-115, Math.min(115, ox)), Math.max(-115, Math.min(115, oz))]);
  }
  // Block corners
  for (const bx of [-73, 73]) for (const bz of [-73, 73]) {
    trees.push([bx + (bx > 0 ? -3 : 3), bz + (bz > 0 ? -3 : 3)]);
  }
  return trees;
}
