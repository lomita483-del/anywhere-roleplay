import type { BuildingDef, Poi } from "./city";

// A game-scale interpretation of central Umuahia. Coordinates are designed for
// the existing 360 x 360 playable world; this is a gameplay layout, not a survey.
export const UMUAHIA_BUILDINGS: BuildingDef[] = [
  { x: -42, z: -44, w: 28, d: 20, h: 8, color: "#d9b47d", kind: "market", label: "UMUAHIA MAIN MARKET" },
  { x: 42, z: -44, w: 25, d: 18, h: 17, color: "#d8d1c2", kind: "civic", label: "ABIA STATE SECRETARIAT" },
  { x: 105, z: -44, w: 25, d: 18, h: 15, color: "#c7c9c2", kind: "civic", label: "GOVERNMENT HOUSE · ABIA" },
  { x: -105, z: -44, w: 23, d: 17, h: 11, color: "#e3d7bf", kind: "civic", label: "UMUAHIA GENERAL HOSPITAL" },
  { x: -105, z: 42, w: 29, d: 24, h: 11, color: "#c8bca6", kind: "depot", label: "UMUAHIA CENTRAL BUS TERMINAL" },
  { x: -42, z: 42, w: 26, d: 22, h: 8, color: "#d5a45f", kind: "market", label: "UMUAHIA TRADERS ARCADE" },
  { x: 42, z: 42, w: 27, d: 19, h: 14, color: "#d4d0c7", kind: "civic", label: "ABIA STATE JUDICIARY" },
  { x: 105, z: 42, w: 25, d: 18, h: 12, color: "#d2c8b2", kind: "civic", label: "FEDERAL HIGH COURT" },
  { x: -105, z: 112, w: 34, d: 27, h: 10, color: "#c9c5bd", kind: "civic", label: "UMUAHIA TOWNSHIP STADIUM" },
  { x: -42, z: 112, w: 22, d: 17, h: 17, color: "#b9cbd3", kind: "apartments", label: "ROYAL PALM HOTEL & SUITES" },
  { x: 42, z: 112, w: 24, d: 18, h: 13, color: "#d5c4a6", kind: "civic", label: "ST. MICHAEL'S CATHOLIC CHURCH" },
  { x: 105, z: 112, w: 28, d: 21, h: 16, color: "#c7d0d0", kind: "civic", label: "FEDERAL POLYTECHNIC UMUAHIA" },
  { x: -105, z: -112, w: 26, d: 20, h: 13, color: "#c8d0d1", kind: "civic", label: "ABIA STATE UNIVERSITY · CITY CAMPUS" },
  { x: -42, z: -112, w: 22, d: 17, h: 9, color: "#d7c6a7", kind: "bank", label: "COMMUNITY BANK" },
  { x: 42, z: -112, w: 22, d: 16, h: 13, color: "#b9c7ce", kind: "apartments", label: "UMUAHIA BUSINESS CENTRE" },
  { x: 105, z: -112, w: 25, d: 18, h: 12, color: "#d3c3a5", kind: "police", label: "UMUAHIA POLICE STATION" },
  { x: -142, z: -44, w: 18, d: 14, h: 7, color: "#d2a36a", kind: "market", label: "NEIGHBOURHOOD MARKET" },
  { x: 142, z: 42, w: 20, d: 15, h: 12, color: "#c9c6b8", kind: "civic", label: "CIVIC SERVICES OFFICE" },
  { x: 142, z: -112, w: 18, d: 14, h: 8, color: "#d9c9ae", kind: "depot", label: "UMUDIKE ROAD TRANSPORT STOP" },
  // Mixed-use urban blocks
  ...Array.from({ length: 36 }, (_, i) => {
    const xs = [-142, -105, -42, 42, 105, 142];
    const zs = [-142, -78, -44, 42, 78, 142];
    const x = xs[(i * 5 + 1) % xs.length]!;
    const z = zs[(i * 7 + 2) % zs.length]!;
    const w = 10 + (i % 4) * 2;
    const d = 9 + (i % 3) * 2;
    const h = 5 + (i % 5) * 2.5;
    const colors = ["#d2b99a", "#c5c8b7", "#d6c5ac", "#b8c9cc", "#caa27d", "#d7d0c1"];
    const labels = ["LOCAL PROVISIONS", "FAMILY BUNGALOW", "PHARMACY", "PHONE & REPAIRS", "TAILORING HOUSE", "NEIGHBOURHOOD SHOP", "SMALL OFFICE", "GUEST HOUSE"];
    return { x: x + ((i % 3) - 1) * 7, z: z + ((i % 4) - 1.5) * 5, w, d, h, color: colors[i % colors.length]!, label: labels[i % labels.length]! };
  }),
  // Outskirts village compounds, estates and Umudike approach
  { x: -145, z: 142, w: 18, d: 14, h: 5, color: "#c7a17a", label: "IBEKU FAMILY COMPOUND" },
  { x: -118, z: 142, w: 17, d: 13, h: 5, color: "#d4b68d", label: "VILLAGE BUNGALOW" },
  { x: -90, z: 142, w: 18, d: 14, h: 6, color: "#b9c6a8", label: "COMMUNITY PRIMARY SCHOOL", kind: "civic" },
  { x: 75, z: 142, w: 18, d: 14, h: 8, color: "#d2c0a0", label: "GARDEN VIEW ESTATE" },
  { x: 108, z: 142, w: 18, d: 14, h: 8, color: "#c9d1c4", label: "UMUDIKE ROAD HOMES" },
];

export const UMUAHIA_POIS: Poi[] = [
  { id: "umuahia-market", kind: "market", x: -42, z: -30, label: "Umuahia Main Market" },
  { id: "umuahia-bank", kind: "bank", x: -42, z: -96, label: "Community Bank" },
  { id: "umuahia-police", kind: "police", x: 105, z: -96, label: "Umuahia Police Station" },
  { id: "umuahia-terminal", kind: "depot", x: -105, z: 25, label: "Central Bus Terminal" },
  { id: "umuahia-hotel", kind: "apartments", x: -42, z: 95, label: "Royal Palm Hotel & Suites" },
  { id: "umuahia-food", kind: "food", x: -65, z: -28, label: "Abia Kitchen & Suya" },
  { id: "umuahia-fuel", kind: "fuel", x: 76, z: -27, label: "Umuahia Fuel Station" },
  { id: "umuahia-jobs", kind: "jobboard", x: 10, z: 14, label: "Umuahia City Job Board" },
];
