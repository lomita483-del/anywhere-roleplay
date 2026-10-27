/**
 * Logical NEW MAP layout shared by the 3D world, HUD minimap and phone map.
 * Coordinates stay in game-space; NewMapWorld applies NEW_MAP_SCALE for rendering.
 */
export const NEW_MAP_SCALE = 0.48;
export type NewMapPoiKind = "airport" | "port" | "stadium" | "university" | "lake" | "bank" | "shop" | "market" | "hospital" | "police" | "fuel" | "pharmacy" | "mama-put" | "dealership" | "real-estate" | "residential";
export interface NewMapPoi { id: string; label: string; kind: NewMapPoiKind; x: number; z: number; }
export const NEW_MAP_ROADS: [number, number][][] = [
  [[-168, 94], [-137, 74], [-116, 47], [-112, 16], [-91, -8], [-62, -22], [-36, -19], [-13, -3], [11, 12], [38, 16], [65, 4], [91, -18], [116, -47], [145, -61], [169, -54]],
  [[-165, -25], [-133, -18], [-108, -30], [-92, -56], [-76, -86], [-52, -109], [-23, -119], [9, -112], [36, -94], [55, -70], [72, -49], [99, -39], [130, -42], [164, -28]],
  [[-78, 164], [-64, 130], [-71, 100], [-54, 73], [-40, 49], [-43, 28], [-61, 10]],
  [[62, 163], [75, 133], [71, 108], [90, 83], [112, 66], [128, 39], [126, 12], [111, -7]],
  [[-165, 125], [-132, 119], [-111, 133], [-94, 153], [-68, 166]],
  [[-150, -137], [-118, -119], [-95, -96], [-78, -74]],
  // U-shaped boulevard around the central stadium plaza.
  [[-9, -70], [22, -68], [49, -52], [67, -27], [72, 3], [63, 33], [43, 55], [14, 67], [-17, 67], [-45, 53], [-64, 30], [-72, 1], [-66, -29], [-47, -52], [-21, -67], [-9, -70]],
];
export const NEW_MAP_POIS: NewMapPoi[] = [
  { id: "airport", label: "NEW MAP INTERNATIONAL AIRPORT", kind: "airport", x: 6, z: -142 },
  { id: "market", label: "CENTRAL MARKET & DEPOT", kind: "market", x: -38, z: -76 },
  { id: "industrial", label: "INDUSTRIAL DISTRICT", kind: "shop", x: -143, z: -46 },
  { id: "corporate", label: "DOWNTOWN / CORPORATE", kind: "shop", x: -145, z: -82 },
  { id: "university", label: "UNIVERSITY DISTRICT", kind: "university", x: -110, z: 32 },
  { id: "stadium", label: "CITY STADIUM", kind: "stadium", x: 0, z: 0 },
  { id: "residential", label: "RESIDENTIAL DISTRICT", kind: "residential", x: 98, z: -40 },
  { id: "civic", label: "CIVIC & OFFICE BLOCKS", kind: "shop", x: 78, z: 10 },
  { id: "lake", label: "LAKE PARK & RESORT", kind: "lake", x: -112, z: 118 },
  { id: "port", label: "PORT OF LAGOS", kind: "port", x: 116, z: 120 },
  { id: "bank", label: "COMMUNITY BANK & ATMs", kind: "bank", x: 38, z: 24 },
  { id: "hospital", label: "CITY HOSPITAL", kind: "hospital", x: 78, z: 28 },
  { id: "police", label: "POLICE STATION", kind: "police", x: -130, z: -38 },
  { id: "fuel", label: "FUEL STATION", kind: "fuel", x: 58, z: -34 },
  { id: "pharmacy", label: "NEIGHBOURHOOD PHARMACY", kind: "pharmacy", x: -36, z: 6 },
  { id: "mama-put", label: "MAMA PUT BUKA", kind: "mama-put", x: -24, z: 32 },
  { id: "dealership", label: "CAR DEALERSHIP", kind: "dealership", x: 96, z: 36 },
  { id: "real-estate", label: "REAL ESTATE OFFICE", kind: "real-estate", x: 110, z: 54 },
];
export const NEW_MAP_BOUNDS = { minX: -180, maxX: 180, minZ: -180, maxZ: 180 };
