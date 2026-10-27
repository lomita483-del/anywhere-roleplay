import * as THREE from "three";

export interface VehicleRuntime {
  id: string;
  model: string;
  px: number;
  pz: number;
  vx: number;
  vz: number;
  yaw: number;
  speed: number;
  color: string;
  ai?: boolean; // ambient traffic, not enterable
}

// Mutable non-reactive game state shared between the 3D loop and the HUD.
// Read with g.* inside useFrame; React-facing values go through the zustand store.
export const g = {
  started: false,
  time: 8.0, // in-game hour (0–24)
  camYaw: Math.PI, // orbit yaw of camera around target
  camPitch: 0.42, // elevation angle, adjustable by dragging the world view
  camDistance: 8, // orbit distance, adjustable by wheel/pinch
  camSatellite: false,
  camBeforeSatellite: { pitch: 0.42, distance: 8 },
  playerPos: new THREE.Vector3(-14, 0, -14),
  playerYaw: 0,
  playerSpeed: 0, // horizontal speed, for anim blend
  joy: { x: 0, y: 0 }, // virtual joystick (-1..1)
  drivingId: null as string | null,
  sirenOn: false,
  vehicles: new Map<string, VehicleRuntime>(),
  sprint: false,
};

export const DAY_SECONDS = 600; // 10 real minutes = one in-game day

export function advanceTime(delta: number) {
  g.time = (g.time + (delta / DAY_SECONDS) * 24) % 24;
}
