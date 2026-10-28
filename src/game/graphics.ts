export type GraphicsQuality = "low" | "medium" | "high";

export interface GraphicsProfile {
  /** Renderer pixel ratio cap; adaptive lower bound remains 1 on mobile. */
  dpr: number | [number, number];
  shadowMapSize: 512 | 1024 | 1536;
  environmentResolution: 16 | 32 | 64;
  rainfallCount: 70 | 140 | 220;
  buildingCullDistance: 70 | 115 | 180;
  trafficCount: 14 | 26 | 40;
  pedestrianCount: 20 | 45 | 80;
  interiorNpcCount: 1 | 2 | 4;
}

const GRAPHICS_PROFILES: Record<GraphicsQuality, GraphicsProfile> = {
  low: {
    dpr: 1,
    shadowMapSize: 512,
    environmentResolution: 16,
    rainfallCount: 70,
    buildingCullDistance: 70,
    trafficCount: 14,
    pedestrianCount: 20,
    interiorNpcCount: 1,
  },
  medium: {
    dpr: [1, 1.25],
    shadowMapSize: 1024,
    environmentResolution: 32,
    rainfallCount: 140,
    buildingCullDistance: 115,
    trafficCount: 26,
    pedestrianCount: 45,
    interiorNpcCount: 2,
  },
  high: {
    dpr: [1, 1.5],
    shadowMapSize: 1536,
    environmentResolution: 64,
    rainfallCount: 220,
    buildingCullDistance: 180,
    trafficCount: 40,
    pedestrianCount: 80,
    interiorNpcCount: 4,
  },
};

export function getGraphicsProfile(quality: GraphicsQuality): GraphicsProfile {
  return GRAPHICS_PROFILES[quality];
}
