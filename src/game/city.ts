// City layout data — single source of truth for geometry, collision, and POIs.
import { UMUAHIA_BUILDINGS, UMUAHIA_POIS } from "./umuahia";
import { NEW_MAP_BUILDINGS, NEW_MAP_POIS } from "./newMap";

export interface Box {
  x: number;
  z: number;
  w: number; // width (x extent)
  d: number; // depth (z extent)
  h: number; // height
}

export interface BuildingDef extends Box {
  color: string;
  kind?: string;
  label?: string;
}

export const WORLD = 360; // expanded Lagos world; playable bounds ±178
export const BOUND = 178;

// Main express roads connect the starter mainland to outer districts.
export const ROADS_X = [-140, -80, 0, 80, 140];
export const ROADS_Z = [-140, -80, 0, 80, 140];
export const ROAD_HALF = 7;
export const SIDEWALK = 3; // sidewalk band on each side of the road

export const LAGOS_BUILDINGS: BuildingDef[] = [
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
  // Civic and education landmarks — shared by the 3D world, collisions and minimap.
  { x: -94, z: -36, w: 19, d: 13, h: 8, color: "#e6d3a5", label: "PRIMARY SCHOOL" },
  { x: -92, z: -12, w: 22, d: 14, h: 10, color: "#d6c7b0", label: "SECONDARY SCHOOL", kind: "civic" },
  { x: 92, z: -42, w: 20, d: 16, h: 13, color: "#d9d2bd", label: "LAGOS UNIVERSITY", kind: "civic" },
  { x: 92, z: -16, w: 17, d: 13, h: 9, color: "#d8d2c8", label: "COURT OF JUSTICE", kind: "civic" },
  { x: 92, z: 10, w: 20, d: 15, h: 12, color: "#d8c8a6", label: "GOVERNMENT HOUSE", kind: "civic" },
  { x: -92, z: 12, w: 17, d: 13, h: 8, color: "#d5c2a5", label: "REAL ESTATE & PROPERTY", kind: "civic" },
  // Outer districts — opened up as the Lagos world expands.
  { x: -142, z: -64, w: 28, d: 18, h: 7, color: "#d9a13b", kind: "market", label: "OSHODI TRANSPORT & MARKET HUB" },
  { x: -118, z: -42, w: 18, d: 14, h: 12, color: "#c49a73", label: "MUSHIN STREET TRADE" },
  { x: -145, z: -105, w: 22, d: 16, h: 9, color: "#a9b8c2", kind: "depot", label: "MAINLAND MOTOR PARK" },
  { x: 140, z: -132, w: 38, d: 22, h: 12, color: "#b8c7cb", kind: "airport", label: "MURTALA MUHAMMED AIRPORT" },
  { x: 111, z: -137, w: 18, d: 14, h: 10, color: "#d5d1c6", label: "AIRLINE CARGO & LOGISTICS" },
  { x: 140, z: -82, w: 24, d: 18, h: 20, color: "#a8c6d3", label: "IKEJA BUSINESS DISTRICT" },
  { x: 112, z: -61, w: 18, d: 15, h: 15, color: "#c7b5a1", label: "LAGOS GOVERNMENT OFFICES" },
  { x: 140, z: 48, w: 24, d: 20, h: 34, color: "#9cb6c8", label: "VICTORIA ISLAND TOWER" },
  { x: 112, z: 76, w: 20, d: 18, h: 27, color: "#d1c4a8", label: "LEKKI BUSINESS PLAZA" },
  { x: 151, z: 88, w: 18, d: 18, h: 23, color: "#9ab9ad", label: "LEKKI GATED ESTATE" },
  { x: -142, z: 58, w: 25, d: 16, h: 7, color: "#d3b38b", label: "AJEGUNLE COMMUNITY MARKET", kind: "market" },
  { x: -112, z: 88, w: 24, d: 18, h: 6, color: "#b5a18b", label: "MAKOKO WATERFRONT", kind: "market" },
  { x: -147, z: 93, w: 18, d: 12, h: 5, color: "#c49b72", label: "WATERFRONT FISH MARKET" },
  { x: 140, z: 140, w: 32, d: 24, h: 48, color: "#a6c8d5", label: "EKO ATLANTIC FUTURE CITY" },
  { x: 111, z: 141, w: 20, d: 18, h: 32, color: "#d3dce0", label: "EKO FINANCIAL CENTRE" },
  { x: 68, z: -23, w: 14, d: 11, h: 7, color: "#d8d0b9", kind: "civic", label: "INEC POLLING UNIT" },
  { x: 67, z: -5, w: 15, d: 13, h: 8, color: "#d7c6a9", kind: "civic", label: "CHURCH OF HOPE" },
  { x: 67, z: 15, w: 15, d: 13, h: 7, color: "#d2c4a4", kind: "civic", label: "CENTRAL MOSQUE" },
  // Dense mainland streets — mixed-use blocks, shops and walk-up apartments.
  { x: -112, z: -44, w: 16, d: 13, h: 8, color: "#c9a27b", kind: "clothing", label: "YABA FASHION PLAZA" },
  { x: -103, z: -24, w: 14, d: 12, h: 13, color: "#b7c8cb", label: "TECH HUB YABA" },
  { x: -119, z: -18, w: 15, d: 12, h: 10, color: "#d6b58e", label: "COMPUTER VILLAGE ANNEX" },
  { x: -105, z: 18, w: 17, d: 13, h: 7, color: "#d9a15a", kind: "market", label: "SURULERE DAILY MARKET" },
  { x: -118, z: 38, w: 14, d: 12, h: 12, color: "#b7a7a0", label: "MAINLAND COURTYARD FLATS" },
  { x: -101, z: 51, w: 17, d: 13, h: 9, color: "#d1c4a9", label: "NEIGHBOURHOOD SHOP ROW" },
  { x: -54, z: -8, w: 12, d: 11, h: 7, color: "#c5a77f", kind: "clothing", label: "TAILORING HOUSE" },
  { x: -38, z: 4, w: 14, d: 12, h: 10, color: "#d2b08b", label: "MAINLAND PHARMACY" },
  { x: -22, z: 14, w: 13, d: 12, h: 8, color: "#c2b7a4", label: "ELECTRONICS & REPAIRS" },
  { x: -55, z: 55, w: 16, d: 13, h: 11, color: "#c7b49a", label: "SURULERE FAMILY FLATS" },
  { x: -32, z: 62, w: 15, d: 12, h: 8, color: "#d4b58a", label: "LOCAL PROVISIONS" },
  // Oshodi / Mushin transport district.
  { x: -164, z: -44, w: 18, d: 14, h: 9, color: "#d5ad72", kind: "market", label: "MUSHIN SPARE PARTS MARKET" },
  { x: -123, z: -58, w: 16, d: 12, h: 12, color: "#b7b4a5", label: "OSHODI COMMERCIAL HOUSE" },
  { x: -163, z: -22, w: 17, d: 13, h: 8, color: "#c5a27a", kind: "depot", label: "INTERSTATE BUS TICKET OFFICE" },
  { x: -119, z: -31, w: 15, d: 12, h: 10, color: "#c4b39a", label: "MOTOR SPARES & TYRES" },
  // Ikeja commercial skyline and airport support buildings.
  { x: 105, z: -48, w: 16, d: 13, h: 22, color: "#a8c4d2", label: "IKEJA TECH TOWER" },
  { x: 120, z: -28, w: 18, d: 13, h: 17, color: "#d2c3ac", label: "AIRLINE STAFF OFFICES" },
  { x: 103, z: -13, w: 15, d: 12, h: 12, color: "#b4c5c5", label: "COMPUTER & PHONE PLAZA" },
  { x: 121, z: -8, w: 15, d: 12, h: 9, color: "#d0b08a", label: "IKEJA FOOD COURT" },
  // Victoria Island / Lekki: premium offices, apartments and estate services.
  { x: 102, z: 24, w: 16, d: 14, h: 29, color: "#a6c6d5", label: "VICTORIA ISLAND FINANCE TOWER" },
  { x: 122, z: 40, w: 15, d: 13, h: 20, color: "#d2c8b7", label: "LEKKI BUSINESS CENTRE" },
  { x: 101, z: 57, w: 16, d: 13, h: 15, color: "#b8c7c0", kind: "apartments", label: "LEKKI RESIDENCE" },
  { x: 122, z: 63, w: 14, d: 12, h: 12, color: "#d8c6a6", label: "ESTATE MANAGEMENT OFFICE", kind: "civic" },
  { x: 48, z: 72, w: 16, d: 12, h: 8, color: "#d5c4a4", label: "IKOYI RESIDENTS CLUB" },
  { x: 28, z: 72, w: 14, d: 12, h: 10, color: "#a8bdb4", kind: "apartments", label: "IKOYI COURTYARD APARTMENTS" },
  // Named, purpose-built localities with their own street identities.
  // Government Avenue: civic buildings, assembly complex and formal landscaped compounds.
  { x: -34, z: -124, w: 22, d: 16, h: 13, color: "#d9c7a6", kind: "civic", label: "LAGOS HOUSE OF ASSEMBLY" },
  { x: -5, z: -124, w: 24, d: 18, h: 16, color: "#d8d2c4", kind: "civic", label: "GOVERNMENT HOUSE" },
  { x: 27, z: -124, w: 22, d: 16, h: 12, color: "#c8b89d", kind: "civic", label: "LAGOS CITY HALL" },
  { x: -33, z: -101, w: 17, d: 13, h: 9, color: "#d8d0be", kind: "civic", label: "HIGH COURT OF LAGOS" },
  { x: 0, z: -101, w: 20, d: 14, h: 10, color: "#c9d0d1", kind: "civic", label: "CIVIL SERVICE SECRETARIAT" },
  { x: 31, z: -101, w: 18, d: 14, h: 11, color: "#c7c9c4", kind: "civic", label: "LAGOS POLICE COMMAND" },
  // Estate Drive: gated low-rise estates, duplexes and apartment blocks.
  { x: 49, z: 119, w: 15, d: 13, h: 7, color: "#d6c3a1", label: "PALM COURT DUPLEXES" },
  { x: 72, z: 119, w: 15, d: 13, h: 7, color: "#c7d0c2", label: "GARDEN VIEW ESTATE" },
  { x: 95, z: 119, w: 18, d: 14, h: 10, color: "#d7d0c3", kind: "apartments", label: "LEKKI RESIDENCES" },
  { x: 49, z: 143, w: 17, d: 14, h: 8, color: "#d2b99a", label: "OLIVE GARDEN BUNGALOWS" },
  { x: 75, z: 143, w: 17, d: 14, h: 8, color: "#bfcbbd", label: "PALM GROVE ESTATE" },
  { x: 100, z: 143, w: 17, d: 14, h: 8, color: "#d7c4a6", label: "ESTATE CLUBHOUSE" },
  // Village Road: compounds, family bungalows, local shops and community services.
  { x: -154, z: 119, w: 13, d: 11, h: 4.5, color: "#c69c73", label: "UMU-NA VILLAGE COMPOUND" },
  { x: -132, z: 119, w: 14, d: 12, h: 4.8, color: "#d4b58a", label: "VILLAGE FAMILY HOUSE" },
  { x: -154, z: 143, w: 13, d: 11, h: 4.5, color: "#b9c5a6", label: "COMMUNITY BUNGALOW" },
  { x: -131, z: 143, w: 14, d: 12, h: 4.8, color: "#d0a87d", label: "VILLAGE PROVISIONS SHOP" },
  { x: -105, z: 119, w: 15, d: 12, h: 5, color: "#c9b18f", label: "COMMUNITY HEALTH POST" },
  { x: -104, z: 143, w: 15, d: 12, h: 5, color: "#d3c5a7", label: "VILLAGE PRIMARY SCHOOL" },
  // Market Square Road: covered stalls, traders' blocks, produce sheds and motor loading bay.
  { x: -78, z: 119, w: 24, d: 16, h: 6, color: "#d79b51", kind: "market", label: "NEW LAGOS MARKET SQUARE" },
  { x: -48, z: 119, w: 20, d: 14, h: 7, color: "#c8a477", kind: "market", label: "TRADERS' ARCADE" },
  { x: -78, z: 143, w: 22, d: 14, h: 5.5, color: "#c8b08a", kind: "market", label: "FRESH PRODUCE MARKET" },
  { x: -49, z: 143, w: 19, d: 14, h: 6, color: "#d4a15c", kind: "market", label: "MAMA PUT FOOD COURT" },
  { x: -20, z: 119, w: 16, d: 12, h: 6, color: "#c5a27a", kind: "depot", label: "MARKET MOTOR PARK" },
  // Big City commercial skyline and workplaces.
  { x: -25, z: 82, w: 18, d: 14, h: 27, color: "#8fb5c8", label: "BIG CITY FINANCIAL TOWER" },
  { x: 1, z: 82, w: 20, d: 15, h: 32, color: "#c7d2d6", label: "BIG CITY BUSINESS CENTRE" },
  { x: 28, z: 82, w: 17, d: 14, h: 22, color: "#b7c5bd", label: "CENTRAL OFFICE PLAZA" },
  { x: -25, z: 104, w: 18, d: 13, h: 15, color: "#d1c0a6", label: "BIG CITY APARTMENTS", kind: "apartments" },
  { x: 2, z: 104, w: 17, d: 13, h: 11, color: "#c9b4a0", label: "COMMERCIAL COURT" },
];

export let BUILDINGS: BuildingDef[] = LAGOS_BUILDINGS;

export interface Poi {
  id: string;
  kind: "atm" | "bank" | "police" | "dealership" | "apartments" | "market" | "depot" | "clothing" | "jobboard" | "food" | "airport" | "fuel" | "hospital" | "pharmacy" | "school" | "university" | "real-estate" | "shop" | "stadium" | "port" | "lake" | "residential";
  x: number;
  z: number;
  label: string;
}

// Interaction points — placed on sidewalks / plazas next to their building fronts
export const LAGOS_POIS: Poi[] = [
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
  { id: "mama-put", kind: "food", x: -77, z: 25, label: "Mama Put Buka" },
  { id: "suya-stand", kind: "food", x: -70, z: 15, label: "Roadside Suya" },
  { id: "oshodi-buka", kind: "food", x: -160, z: -78, label: "Oshodi Buka" },
  { id: "oando-fuel", kind: "fuel", x: -65, z: -84, label: "Oando Fuel Station" },
  { id: "ikeja-fuel", kind: "fuel", x: 125, z: -112, label: "Ikeja Express Fuel Stop" },
  { id: "lekki-fuel", kind: "fuel", x: 126, z: 22, label: "Lekki Fuel Station" },
];

export const NEW_MAP_POI_DATA: Poi[] = NEW_MAP_POIS.map((p) => ({
  id: p.id, label: p.label, x: p.x, z: p.z,
  kind: p.kind === "mama-put" ? "food" :
    p.kind === "residential" ? "apartments" :
    p.kind,
}));
export let POIS: Poi[] = LAGOS_POIS;

// Collision boxes for every building (slightly padded)
export function buildingBoxes(): { minX: number; maxX: number; minZ: number; maxZ: number }[] {
  return BUILDINGS.map((b) => ({
    minX: b.x - b.w / 2 - 0.2,
    maxX: b.x + b.w / 2 + 0.2,
    minZ: b.z - b.d / 2 - 0.2,
    maxZ: b.z + b.d / 2 + 0.2,
  }));
}
export let COLLIDERS = buildingBoxes();

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

export function districtAt(x: number, z: number): string | null {
  if (currentCity !== "lagos") return null;
  if (x > 110 && z > 110) return "Eko Atlantic";
  if (x > 110 && z >= -20) return "Lekki / Victoria Island";
  if (x > 110 && z < -20) return "Ikeja / Airport";
  if (x < -110 && z >= -20) return "Ajegunle / Makoko";
  if (x < -110 && z < -20) return "Oshodi / Mushin";
  return null;
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
  { model: "sedan", lane: { axis: "x", fixed: -134.5, from: -168, to: 168 }, speed: 9, offset: 0.080 },
  { model: "danfo", lane: { axis: "x", fixed: -145.5, from: -168, to: 168 }, speed: 7, offset: 0.253 },
  { model: "taxi", lane: { axis: "x", fixed: -74.5, from: -168, to: 168 }, speed: 11, offset: 0.426 },
  { model: "keke", lane: { axis: "x", fixed: -85.5, from: -168, to: 168 }, speed: 7.5, offset: 0.599 },
  { model: "suv", lane: { axis: "x", fixed: 5.5, from: -168, to: 168 }, speed: 10, offset: 0.772 },
  { model: "sedan", lane: { axis: "x", fixed: -5.5, from: -168, to: 168 }, speed: 11, offset: 0.125 },
  { model: "danfo", lane: { axis: "x", fixed: 85.5, from: -168, to: 168 }, speed: 7, offset: 0.298 },
  { model: "taxi", lane: { axis: "x", fixed: 74.5, from: -168, to: 168 }, speed: 10, offset: 0.471 },
  { model: "police", lane: { axis: "x", fixed: 145.5, from: -168, to: 168 }, speed: 10.5, offset: 0.644 },
  { model: "suv", lane: { axis: "x", fixed: 134.5, from: -168, to: 168 }, speed: 9, offset: 0.817 },
  { model: "sedan", lane: { axis: "z", fixed: -134.5, from: -168, to: 168 }, speed: 10, offset: 0.170 },
  { model: "danfo", lane: { axis: "z", fixed: -145.5, from: -168, to: 168 }, speed: 7, offset: 0.343 },
  { model: "taxi", lane: { axis: "z", fixed: -74.5, from: -168, to: 168 }, speed: 9, offset: 0.516 },
  { model: "keke", lane: { axis: "z", fixed: -85.5, from: -168, to: 168 }, speed: 7.5, offset: 0.689 },
  { model: "suv", lane: { axis: "z", fixed: 5.5, from: -168, to: 168 }, speed: 11, offset: 0.862 },
  { model: "sedan", lane: { axis: "z", fixed: -5.5, from: -168, to: 168 }, speed: 9, offset: 0.215 },
  { model: "danfo", lane: { axis: "z", fixed: 85.5, from: -168, to: 168 }, speed: 7, offset: 0.388 },
  { model: "taxi", lane: { axis: "z", fixed: 74.5, from: -168, to: 168 }, speed: 11, offset: 0.561 },
  { model: "police", lane: { axis: "z", fixed: 145.5, from: -168, to: 168 }, speed: 10.5, offset: 0.734 },
  { model: "suv", lane: { axis: "z", fixed: 134.5, from: -168, to: 168 }, speed: 10, offset: 0.087 }
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
  { pts: [[-160, -78], [-128, -78], [-128, -48], [-160, -48]] },
  { pts: [[118, -154], [160, -154], [160, -116], [118, -116]] },
  { pts: [[118, 36], [162, 36], [162, 68], [118, 68]] },
  { pts: [[-160, 42], [-128, 42], [-128, 86], [-160, 86]] },
  { pts: [[112, 126], [154, 126], [154, 158], [112, 158]] },
  // Additional pedestrian loops: market customers, commuters, campus walkers and village residents.
  { pts: [[-166, -54], [-145, -54], [-145, -32], [-166, -32]] },
  { pts: [[-158, -18], [-132, -18], [-132, 4], [-158, 4]] },
  { pts: [[-118, -52], [-94, -52], [-94, -30], [-118, -30]] },
  { pts: [[-110, 10], [-88, 10], [-88, 34], [-110, 34]] },
  { pts: [[-88, 40], [-66, 40], [-66, 62], [-88, 62]] },
  { pts: [[-52, -22], [-32, -22], [-32, -2], [-52, -2]] },
  { pts: [[-24, 22], [-4, 22], [-4, 42], [-24, 42]] },
  { pts: [[-8, -78], [14, -78], [14, -56], [-8, -56]] },
  { pts: [[24, -78], [46, -78], [46, -56], [24, -56]] },
  { pts: [[48, -42], [68, -42], [68, -20], [48, -20]] },
  { pts: [[82, -88], [104, -88], [104, -66], [82, -66]] },
  { pts: [[112, -100], [144, -100], [144, -78], [112, -78]] },
  { pts: [[132, -54], [158, -54], [158, -30], [132, -30]] },
  { pts: [[112, 8], [136, 8], [136, 30], [112, 30]] },
  { pts: [[138, 76], [164, 76], [164, 98], [138, 98]] },
  { pts: [[88, 88], [110, 88], [110, 108], [88, 108]] },
  { pts: [[72, 112], [96, 112], [96, 136], [72, 136]] },
  { pts: [[-166, 92], [-140, 92], [-140, 116], [-166, 116]] },
  { pts: [[-120, 102], [-96, 102], [-96, 124], [-120, 124]] },
  { pts: [[-52, 96], [-28, 96], [-28, 118], [-52, 118]] },
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
    for (let z = -170; z <= 170; z += 40) {
      if (Math.abs(z % 80) < 1 || Math.abs(Math.abs(z) - 80) < 1) continue;
      lamps.push([rx - ROAD_HALF - 1.5, z]);
      lamps.push([rx + ROAD_HALF + 1.5, z + 20]);
    }
  }
  for (const rz of ROADS_Z) {
    for (let x = -170; x <= 170; x += 40) {
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


// Current world is switched by the in-game city selector. Existing Lagos data
// stays intact and is restored when players return to Lagos.
export type CityId = "newmap" | "lagos" | "umuahia";
export let currentCity: CityId = "newmap";

export function setCityWorld(city: CityId) {
  currentCity = city;
  BUILDINGS = city === "newmap" ? NEW_MAP_BUILDINGS : city === "umuahia" ? UMUAHIA_BUILDINGS : LAGOS_BUILDINGS;
  POIS = city === "newmap" ? NEW_MAP_POI_DATA : city === "umuahia" ? UMUAHIA_POIS : LAGOS_POIS;
  COLLIDERS = buildingBoxes();
}

// Start in the empty sandbox before the game session begins.
setCityWorld("newmap");


export type MapPlaceIcon = "bank" | "atm" | "hospital" | "police" | "fuel" | "pharmacy" | "food" | "market" | "school" | "airport" | "port" | "stadium" | "real-estate" | "dealership" | "tower" | "factory" | "home" | "park";
export interface MapPlace {
  id: string; label: string; kind: string; district: string;
  x: number; z: number; w: number; d: number; h: number; color: string;
  doorX: number; doorZ: number; icon: MapPlaceIcon;
}
const MAP_ICON_KIND: Record<string, MapPlaceIcon> = {
  bank: "bank", atm: "atm", hospital: "hospital", police: "police", fuel: "fuel",
  pharmacy: "pharmacy", food: "food", "mama-put": "food", market: "market", depot: "market",
  school: "school", university: "school", airport: "airport", port: "port", stadium: "stadium",
  "real-estate": "real-estate", dealership: "dealership", tower: "tower", factory: "factory",
  warehouse: "factory", home: "home", residential: "home", apartments: "home", resort: "park", lake: "park",
};
const mapDoor = (b: BuildingDef, pois: Poi[]) => {
  const match = pois.find(p => p.id === (b as any).id)
    ?? pois.find(p => p.label.toLowerCase() === (b.label ?? "").toLowerCase())
    ?? pois.filter(p => p.kind === b.kind).sort((a, z) => Math.hypot(a.x-b.x,a.z-b.z)-Math.hypot(z.x-b.x,z.z-b.z))[0];
  if (Number.isFinite((b as any).doorX) && Number.isFinite((b as any).doorZ)) return { doorX: (b as any).doorX as number, doorZ: (b as any).doorZ as number };
  if (match) return { doorX: match.x, doorZ: match.z };
  return { doorX: b.x, doorZ: b.z + b.d / 2 + 1.5 };
};

/** Returns the current city's real building footprints and door positions for the phone map. */
export function getMapPlaces(city: CityId): MapPlace[] {
  const buildings: BuildingDef[] = city === "newmap" ? NEW_MAP_BUILDINGS : city === "umuahia" ? UMUAHIA_BUILDINGS : LAGOS_BUILDINGS;
  const pois: Poi[] = city === "newmap" ? NEW_MAP_POI_DATA : city === "umuahia" ? UMUAHIA_POIS : LAGOS_POIS;
  const districtName = (b: BuildingDef) => {
    if ((b as any).district) return String((b as any).district).replace(/-/g, " ");
    if (city === "lagos") return districtAt(b.x, b.z) ?? "Lagos";
    if (city === "umuahia") return "Umuahia";
    return "City";
  };
  const places: MapPlace[] = buildings.map((b, i) => {
    const id = String((b as any).id ?? `${city}-building-${i}`);
    const kind = String(b.kind ?? "building");
    const door = mapDoor(b, pois);
    return { id, label: b.label?.trim() || `${kind === "building" ? "Local Building" : kind.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} ${String(i + 1).padStart(2, "0")}`,
      kind, district: districtName(b), x: b.x, z: b.z, w: b.w, d: b.d, h: b.h,
      color: b.color, ...door, icon: MAP_ICON_KIND[kind] ?? "tower" };
  });
  // Keep POIs that are not attached to a building (ATMs, job boards and natural landmarks) tappable too.
  for (const p of pois) {
    if (places.some(b => b.id === p.id || (Math.hypot(b.doorX-p.x,b.doorZ-p.z) < 1.5 && b.kind === p.kind))) continue;
    const b = buildings.find(b => b.label?.toLowerCase() === p.label.toLowerCase());
    places.push({ id: p.id, label: p.label, kind: p.kind, district: b ? districtName(b) : city === "newmap" ? "NEW MAP" : city === "umuahia" ? "Umuahia" : districtAt(p.x,p.z) ?? "Lagos",
      x: p.x, z: p.z, w: b?.w ?? 5, d: b?.d ?? 5, h: b?.h ?? 1, color: b?.color ?? "#5d806e",
      doorX: p.x, doorZ: p.z, icon: MAP_ICON_KIND[p.kind] ?? "park" });
  }
  return places;
}
