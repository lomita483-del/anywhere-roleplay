/**
 * Logical NEW MAP layout shared by the 3D world, HUD minimap and phone map.
 * Coordinates stay in game-space; NewMapWorld applies NEW_MAP_SCALE for rendering.
 */
export const NEW_MAP_SCALE = 0.48;
export type NewMapPoiKind = "airport" | "port" | "stadium" | "university" | "lake" | "bank" | "atm" | "shop" | "market" | "hospital" | "police" | "fuel" | "pharmacy" | "mama-put" | "dealership" | "real-estate" | "residential";
export interface NewMapPoi { id: string; label: string; kind: NewMapPoiKind; x: number; z: number; }
export const NEW_MAP_ROADS: [number, number][][] = [
  // West-side city spine: lake -> university -> industrial -> downtown -> market.
  [[-112, 126], [-108, 105], [-111, 82], [-110, 61], [-110, 43], [-112, 21], [-123, -1], [-135, -24], [-143, -46], [-145, -64], [-145, -82], [-126, -84], [-104, -84], [-82, -81], [-61, -78], [-38, -76]],
  // Airport access road links the terminal to the market and stadium boulevard.
  [[6, -142], [-10, -126], [-24, -109], [-34, -92], [-38, -76], [-30, -70], [-18, -69], [-9, -70]],
  // Main east arterial: airport -> stadium east junction -> civic edge -> port gate.
  [[6, -142], [20, -122], [34, -98], [49, -75], [60, -59], [67, -50], [67, -27], [72, 3], [84, 8], [96, 27], [101, 48], [108, 64], [103, 75], [90, 84], [76, 92], [72, 103], [72, 114]],
  // University access road joins the west spine directly to the stadium loop.
  [[-110, 43], [-96, 35], [-85, 22], [-78, 10], [-72, 1]],
  // Market-to-boulevard connector, with the junction placed beside the market entrance.
  [[-38, -76], [-42, -66], [-47, -52]],
  // Residential access street stays along the west edge of the housing grid.
  [[67, -27], [72, -40], [74, -52], [72, -64], [60, -72], [49, -75]],
  // Bank and civic access spur off the eastern stadium junction.
  [[72, 3], [65, 12], [54, 19], [44, 23], [38, 24]],
  // Hospital and civic offices access spur.
  [[84, 8], [83, 16], [80, 22], [78, 24]],
  // A short port approach follows the dry western edge of the waterfront.
  [[72, 103], [76, 108], [76, 116], [76, 124]],
  // U-shaped boulevard around the central stadium plaza; kept as the final route.
  [[-9, -70], [22, -68], [49, -52], [67, -27], [72, 3], [63, 33], [43, 55], [14, 67], [-17, 67], [-45, 53], [-64, 30], [-72, 1], [-66, -29], [-47, -52], [-21, -67], [-9, -70]],
];
export const NEW_MAP_POIS: NewMapPoi[] = [
  { id: "airport", label: "NEW MAP INTERNATIONAL AIRPORT", kind: "airport", x: 6, z: -142 },
  { id: "market", label: "CENTRAL MARKET & DEPOT", kind: "market", x: -38, z: -76 },
  { id: "industrial", label: "INDUSTRIAL DISTRICT", kind: "shop", x: -143, z: -46 },
  { id: "corporate", label: "DOWNTOWN / CORPORATE", kind: "shop", x: -145, z: -82 },
  { id: "university", label: "UNIVERSITY DISTRICT", kind: "university", x: -110, z: 43 },
  { id: "school", label: "COMMUNITY SECONDARY SCHOOL", kind: "university", x: -88, z: 60 },
  { id: "stadium", label: "CITY STADIUM", kind: "stadium", x: 0, z: 0 },
  { id: "residential", label: "WALK-UP APARTMENTS", kind: "residential", x: 82, z: -57 },
  { id: "civic", label: "CIVIC & OFFICE BLOCKS", kind: "shop", x: 78, z: 10 },
  { id: "lake", label: "LAKE PARK & RESORT", kind: "lake", x: -112, z: 118 },
  { id: "port", label: "PORT OF LAGOS", kind: "port", x: 116, z: 120 },
  { id: "bank", label: "COMMUNITY BANK", kind: "bank", x: 38, z: 24 },
  { id: "atm-market", label: "MARKET ATM", kind: "atm", x: -20, z: -65 },
  { id: "atm-university", label: "UNIVERSITY ATM", kind: "atm", x: -94, z: 26 },
  { id: "hospital", label: "CITY HOSPITAL", kind: "hospital", x: 78, z: 32 },
  { id: "police", label: "POLICE STATION", kind: "police", x: -130, z: -33 },
  { id: "fuel", label: "FUEL STATION", kind: "fuel", x: 58, z: -33 },
  { id: "pharmacy", label: "NEIGHBOURHOOD PHARMACY", kind: "pharmacy", x: -36, z: 7 },
  { id: "mama-put", label: "MAMA PUT BUKA", kind: "mama-put", x: -24, z: 32 },
  { id: "dealership", label: "CAR DEALERSHIP", kind: "dealership", x: 96, z: 46 },
  { id: "real-estate", label: "REAL ESTATE OFFICE", kind: "real-estate", x: 110, z: 64 },
];

export const NEW_MAP_BUILDINGS = [
  ...Array.from({ length: 64 }, (_, i) => ({
    x: 82 + (i % 8) * 10.4, z: -63 + Math.floor(i / 8) * 10.3,
    w: 6.1 + (i % 3) * 0.35, d: 6.1 + (i % 2) * 0.5,
    h: 6.2 + ((i * 7) % 8) * 1.25, color: ["#d9c9a8","#d7d4c8","#c9b39a","#d7b8a5","#b9c9bd","#d8cdbb","#c3b7a6","#e0d1b4"][i % 8]!,
    ...(i % 8 === 0 ? { kind: "apartments" as const, label: "Walk-up Apartments" } : {}),
  })),
  { x: 38, z: 18, w: 12, d: 10, h: 9, color: "#c8b78c", kind: "bank" as const, label: "Community Bank" },
  { x: -38, z: -82, w: 22, d: 12, h: 6, color: "#c7864b", kind: "market" as const, label: "Central Market" },
  { x: -24, z: 28, w: 9, d: 8, h: 4, color: "#d7b37a", kind: "clothing" as const, label: "Mama Put Buka" },
  { x: 58, z: -40, w: 12, d: 9, h: 5, color: "#d7bd65", kind: "fuel" as const, label: "Fuel Station" },
  { x: -130, z: -42, w: 14, d: 12, h: 8, color: "#8ba2b4", kind: "police" as const, label: "Police Station" },
  { x: 78, z: 22, w: 15, d: 12, h: 10, color: "#d9d2bd", label: "City Hospital" },
  { x: -36, z: 2, w: 8, d: 7, h: 5, color: "#b8c7b9", label: "Neighbourhood Pharmacy" },
  { x: -110, z: 38, w: 24, d: 17, h: 9, color: "#b8a28d", label: "University District" },
  { x: 96, z: 40, w: 14, d: 10, h: 7, color: "#b5b6a7", kind: "dealership" as const, label: "Car Dealership" },
  { x: 110, z: 58, w: 12, d: 9, h: 7, color: "#c7b89c", label: "Real Estate Office" },
];
export const NEW_MAP_BOUNDS = { minX: -180, maxX: 180, minZ: -180, maxZ: 180 };

