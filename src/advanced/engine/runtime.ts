import type { VehicleModel } from "./vehicles";

export type CarBody = {
  id: string;
  model: VehicleModel;
  x: number;
  z: number;
  heading: number;
  speed: number;
  lateral: number;
  steer: number;
  owned: boolean;
  tint?: string;
};

export type TrafficCar = CarBody & {
  tx: number;
  tz: number;
  dir: number;
  node: [number, number];
  cruise: number;
  alive: boolean;
};

export type Cop = CarBody & { active: boolean; siren: number };

export type Ped = {
  id: number;
  x: number;
  z: number;
  heading: number;
  loop: number;
  t: number;
  speed: number;
  down: number;
  tint: string;
};

export const rt = {
  player: { x: -150, z: -40, heading: Math.PI / 2, vy: 0, y: 0, moving: 0 },
  vehicle: null as CarBody | null,
  parked: [] as CarBody[],
  traffic: [] as TrafficCar[],
  cops: [] as Cop[],
  peds: [] as Ped[],
  camera: { yaw: Math.PI / 2 + Math.PI, pitch: 0.35, dist: 7 },
  input: {
    keys: new Set<string>(),
    joy: { x: 0, y: 0 },
    touchGas: 0,
    touchBrake: 0,
    touchDrift: false,
    touchSprint: false,
    pressed: new Set<string>(),
  },
  clock: { time: 8 * 60 },
  shake: 0,
  bustTimer: 0,
  lastSeenCop: 0,
};

export function consumePress(key: string) {
  if (rt.input.pressed.has(key)) {
    rt.input.pressed.delete(key);
    return true;
  }
  return false;
}

export function axis() {
  const k = rt.input.keys;
  let x = (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0);
  let y = (k.has("w") || k.has("arrowup") ? 1 : 0) - (k.has("s") || k.has("arrowdown") ? 1 : 0);
  x += rt.input.joy.x;
  y += rt.input.joy.y;
  y += rt.input.touchGas - rt.input.touchBrake;
  return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
}

export function isDown(key: string) {
  return rt.input.keys.has(key);
}
