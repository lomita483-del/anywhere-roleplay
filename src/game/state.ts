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
  fuel?: number;
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
  interiorReturn: new THREE.Vector3(42, 0, 38),
  playerYaw: 0,
  playerSpeed: 0, // horizontal speed, for anim blend
  joy: { x: 0, y: 0 }, // virtual joystick (-1..1)
  drivingId: null as string | null,
  ridingPassenger: false,
  raining: false,
  powerOutage: false,
  sirenOn: false,
  vehicles: new Map<string, VehicleRuntime>(),
  sprint: false,
  adminInvisible: false,
  adminLevitating: false,
  adminFlying: false,
  adminFrozen: false,
  adminFlySpeed: 28,
  adminFlyHeight: 0,
  adminSpawnedNpcs: [] as { id: string; x: number; z: number; name: string }[],
};


/** Convert forward/strafe input into a normalized world-space vector using the camera's ground-plane basis. */
export function getCameraRelativeMove(cameraYaw: number, forwardInput: number, strafeInput: number) {
  const forwardX = -Math.sin(cameraYaw);
  const forwardZ = -Math.cos(cameraYaw);
  const rightX = -Math.cos(cameraYaw);
  const rightZ = Math.sin(cameraYaw);
  let x = forwardX * forwardInput + rightX * strafeInput;
  let z = forwardZ * forwardInput + rightZ * strafeInput;
  const magnitude = Math.hypot(x, z);
  if (magnitude > 1) { x /= magnitude; z /= magnitude; }
  return { x, z };
}

export const DAY_SECONDS = 600; // 10 real minutes = one in-game day

export function advanceTime(delta: number) {
  g.time = (g.time + (delta / DAY_SECONDS) * 24) % 24;
}
