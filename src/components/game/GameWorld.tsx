import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import { g } from "@/game/state";
import { useGame, VEHICLE_CATALOG, tryJobProgress, nearestPoi } from "@/game/store";
import { interact } from "@/game/actions";
import { VEHICLE_SPAWNS, TRAFFIC, PED_WALKS, isBlocked, clampWorld } from "@/game/city";

// Kenney GLB vehicles face -Z; our physics forward is +Z at yaw 0.
const MODEL_FLIP = Math.PI;
const CHAR_SCALE = 2.2;

const _target = new THREE.Vector3();
const _ideal = new THREE.Vector3();

const RADIO = [
  "📻 Wazobia FM: Traffic is light on the express this morning.",
  "📻 Radio: Danfo drivers reminded — no picking passengers on the express lane!",
  "📻 Radio: Balogun Market has fresh stock in today, traders are smiling.",
  "📻 Radio: Area boys report say fuel price don change again. Hmm.",
  "📻 Radio: Ojoto Motors dey run promo — check the dealership!",
  "📻 Radio: Suya spot at the junction opens at sunset. Oya come chop.",
  "📻 Radio: Police HQ advise all residents: carry your ID card.",
  "📻 Radio: NEPA don bring light — enjoy am while e last.",
];

function useKeys() {
  const keys = useRef(new Set<string>());
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
      if (e.code === "KeyE" || e.code === "Enter") interact();
      if (e.code === "Escape") {
        const s = useGame.getState();
        if (s.phoneOpen) s.closePhone();
        else s.setModal(null);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
  return keys;
}

function CharacterBody() {
  const { scene, animations } = useGLTF("/models/character.glb");
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, clone);
  const current = useRef("");

  useEffect(() => {
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }, [clone]);

  useFrame(() => {
    const speed = g.playerSpeed;
    let clip = "idle";
    if (speed > 4.5) clip = "sprint";
    else if (speed > 0.2) clip = "walk";
    if (current.current !== clip) {
      if (current.current) actions[current.current]?.fadeOut(0.18);
      actions[clip]?.reset().fadeIn(0.18).play();
      current.current = clip;
    }
    clone.visible = !g.drivingId;
  });

  return <primitive object={clone} scale={CHAR_SCALE} />;
}

function PedBody() {
  const { scene, animations } = useGLTF("/models/character.glb");
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, clone);
  useEffect(() => {
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    actions["walk"]?.reset().play();
  }, [clone, actions]);
  return <primitive object={clone} scale={CHAR_SCALE} />;
}

function KekeMesh() {
  return (
    <group>
      <mesh position={[0, 0.72, 0.1]} castShadow>
        <boxGeometry args={[1.15, 0.75, 1.9]} />
        <meshStandardMaterial color="#f2c230" flatShading roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.4, 0.05]} castShadow>
        <boxGeometry args={[1.25, 0.6, 1.7]} />
        <meshStandardMaterial color="#23282f" flatShading roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.3, 0.92]} rotation-x={-0.3}>
        <planeGeometry args={[1.05, 0.5]} />
        <meshStandardMaterial color="#9fd6e8" transparent opacity={0.5} metalness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.36, 1.08]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.16, 10]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.9} />
      </mesh>
      {[0.58, -0.58].map((x, i) => (
        <mesh key={i} position={[x, 0.4, -0.55]} rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.2, 10]} />
          <meshStandardMaterial color="#1a1a1e" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.85, 1.12]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color="#fff3c4" emissive="#ffd257" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function CarGlb({ name }: { name: string }) {
  const { scene } = useGLTF(`/models/${name}.glb`);
  const clone = useMemo(() => scene.clone(true), [scene]);
  useEffect(() => {
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
  }, [clone]);
  return (
    <group rotation-y={MODEL_FLIP}>
      <primitive object={clone} />
    </group>
  );
}

function VehicleBody({ model }: { model: string }) {
  if (model === "keke") return <KekeMesh />;
  return <CarGlb name={model} />;
}

function ParkedVehicle({ id, model, register }: { id: string; model: string; register: (id: string, grp: THREE.Group | null) => void }) {
  const ref = useRef<THREE.Group | null>(null);
  useFrame(() => {
    const v = g.vehicles.get(id);
    const grp = ref.current;
    if (!v || !grp) return;
    grp.position.set(v.px, 0, v.pz);
    grp.rotation.y = v.yaw;
  });
  return (
    <group
      ref={(o) => {
        ref.current = o;
        register(id, o);
      }}
    >
      <VehicleBody model={model} />
    </group>
  );
}

function Traffic() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const cars = useMemo(
    () =>
      TRAFFIC.map((t, i) => ({
        t,
        dir: t.offset > 0.5 ? -1 : 1,
        p: t.lane.from + (t.offset % 1) * (t.lane.to - t.lane.from),
      })),
    []
  );
  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    cars.forEach((c, i) => {
      c.p += c.dir * c.t.speed * dt;
      if (c.p > c.t.lane.to) c.p = c.t.lane.from;
      if (c.p < c.t.lane.from) c.p = c.t.lane.to;
      const grp = refs.current[i];
      if (!grp) return;
      if (c.t.lane.axis === "x") {
        grp.position.set(c.p, 0, c.t.lane.fixed);
        grp.rotation.y = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        grp.position.set(c.t.lane.fixed, 0, c.p);
        grp.rotation.y = c.dir > 0 ? 0 : Math.PI;
      }
    });
  });
  return (
    <>
      {TRAFFIC.map((t, i) => (
        <group
          key={i}
          ref={(o) => {
            refs.current[i] = o;
          }}
        >
          <VehicleBody model={t.model} />
        </group>
      ))}
    </>
  );
}

function Pedestrians() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const peds = useMemo(
    () =>
      PED_WALKS.map((w, i) => ({
        pts: w.pts,
        wi: 1 % w.pts.length,
        x: w.pts[0][0],
        z: w.pts[0][1],
        speed: 1.1 + (i % 3) * 0.3,
      })),
    []
  );
  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    peds.forEach((p, i) => {
      const wp = p.pts[p.wi];
      const dx = wp[0] - p.x;
      const dz = wp[1] - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.6) {
        p.wi = (p.wi + 1) % p.pts.length;
        return;
      }
      p.x += (dx / d) * p.speed * dt;
      p.z += (dz / d) * p.speed * dt;
      const grp = refs.current[i];
      if (grp) {
        grp.position.set(p.x, 0, p.z);
        grp.rotation.y = Math.atan2(dx, dz);
      }
    });
  });
  return (
    <>
      {PED_WALKS.map((w, i) => (
        <group
          key={i}
          ref={(o) => {
            refs.current[i] = o;
          }}
          position={[w.pts[0][0], 0, w.pts[0][1]]}
        >
          <PedBody />
        </group>
      ))}
    </>
  );
}

function JobMarker() {
  const job = useGame((s) => s.activeJob);
  const ref = useRef<THREE.Group>(null);
  const target = job ? job.targets[job.stage] : null;
  useFrame((_, delta) => {
    const grp = ref.current;
    if (!grp) return;
    grp.rotation.y += delta * 1.4;
    grp.position.y = 0.15 + Math.sin(performance.now() / 350) * 0.12;
  });
  if (!target) return null;
  return (
    <group ref={ref} position={[target[0], 0.15, target[1]]}>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.4, 2.1, 28]} />
        <meshBasicMaterial color="#ffd257" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 12, 8, 1, true]} />
        <meshBasicMaterial color="#ffd257" transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function GameWorld() {
  const keys = useKeys();
  const playerGroup = useRef<THREE.Group>(null);
  const camLook = useRef(new THREE.Vector3(-14, 1, -14));
  const vehRefs = useRef(new Map<string, THREE.Group | null>());
  const timers = useRef({ prox: 0, clock: 0, save: 0, radio: 20 });
  const spawned = useGame((s) => s.spawnedVehicles);

  const register = (id: string, grp: THREE.Group | null) => {
    vehRefs.current.set(id, grp);
  };

  useEffect(() => {
    for (const s of VEHICLE_SPAWNS) {
      if (!g.vehicles.has(s.id)) {
        g.vehicles.set(s.id, {
          id: s.id, model: s.model, px: s.x, pz: s.z, vx: 0, vz: 0, yaw: s.rotY, speed: 0, color: "#888888",
        });
      }
    }

    // Rebuild player-owned vehicles from the save after the runtime world mounts.
    for (const saved of useGame.getState().spawnedVehicles) {
      if (!g.vehicles.has(saved.id)) {
        g.vehicles.set(saved.id, {
          id: saved.id, model: saved.model, px: saved.x, pz: saved.z,
          vx: 0, vz: 0, yaw: saved.rotY, speed: 0, color: "#c94a3c",
        });
      }
    }
  }, []);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const k = keys.current;
    const st = useGame.getState();
    const camera = state.camera as THREE.PerspectiveCamera;

    if (g.drivingId) {
      const v = g.vehicles.get(g.drivingId);
      if (!v) {
        g.drivingId = null;
        st.setDriving(false);
      } else {
        const cat = VEHICLE_CATALOG[v.model] ?? VEHICLE_CATALOG.sedan;
        const kf = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
        const ks = (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) - (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0);
        const forward = Math.max(-1, Math.min(1, kf - g.joy.y));
        const steer = Math.max(-1, Math.min(1, ks - g.joy.x));
        const brake = k.has("Space");

        const fdx = Math.sin(v.yaw), fdz = Math.cos(v.yaw);
        const rdx = Math.cos(v.yaw), rdz = -Math.sin(v.yaw);
        let vLong = v.vx * fdx + v.vz * fdz;
        let vLat = v.vx * rdx + v.vz * rdz;
        vLong += forward * cat.accel * dt;
        if (brake) vLong -= Math.sign(vLong) * 18 * dt;
        vLong -= vLong * 0.9 * dt;
        vLong = Math.max(-cat.maxSpeed * 0.4, Math.min(cat.maxSpeed, vLong));
        const speedFactor = Math.min(Math.abs(vLong) / 8, 1);
        v.yaw += steer * cat.turn * speedFactor * dt * (brake ? 1.4 : 1);
        vLat *= Math.exp(-6.5 * dt);
        v.vx = fdx * vLong + rdx * vLat;
        v.vz = fdz * vLong + rdz * vLat;
        const nx = v.px + v.vx * dt;
        const nz = v.pz + v.vz * dt;
        if (!isBlocked(nx, nz, 1.5)) {
          v.px = nx;
          v.pz = nz;
        } else {
          v.vx *= -0.15;
          v.vz *= -0.15;
        }
        const cw = clampWorld(v.px, v.pz, 2);
        v.px = cw[0];
        v.pz = cw[1];
        v.speed = Math.hypot(v.vx, v.vz);
        g.playerPos.set(v.px, 0, v.pz);
        g.playerYaw = v.yaw;
        st.setSpeed(v.speed * 3.6);
      }
    } else {
      const kf = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
      const ks = (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) - (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0);
      const ix = ks - g.joy.x;
      const iz = kf - g.joy.y;
      const fx = -Math.sin(g.camYaw), fz = -Math.cos(g.camYaw);
      const rx = Math.cos(g.camYaw), rz = -Math.sin(g.camYaw);
      let dx = fx * iz + rx * ix;
      let dz = fz * iz + rz * ix;
      const mag = Math.hypot(dx, dz);
      if (mag > 0.01) {
        dx /= mag;
        dz /= mag;
        const sprint = k.has("ShiftLeft") || k.has("ShiftRight");
        const speed = sprint ? 6.2 : 3.2;
        const step = speed * dt;
        const nx = g.playerPos.x + dx * step;
        if (!isBlocked(nx, g.playerPos.z, 0.5)) g.playerPos.x = nx;
        const nz = g.playerPos.z + dz * step;
        if (!isBlocked(g.playerPos.x, nz, 0.5)) g.playerPos.z = nz;
        const cw = clampWorld(g.playerPos.x, g.playerPos.z, 0.5);
        g.playerPos.x = cw[0];
        g.playerPos.z = cw[1];
        g.playerSpeed = mag * speed;
        g.playerYaw = Math.atan2(dx, dz);
      } else {
        g.playerSpeed = 0;
      }
      st.setSpeed(0);
    }

    const pg = playerGroup.current;
    if (pg) {
      pg.position.set(g.playerPos.x, 0, g.playerPos.z);
      pg.rotation.y = g.playerYaw;
    }

    // Camera rig — orbit yaw + smooth follow
    const driving = !!g.drivingId;
    _target.set(g.playerPos.x, driving ? 1.5 : 1.1, g.playerPos.z);
    const dist = driving ? 12 : 8;
    const height = driving ? 5.5 : 4.5;
    _ideal.set(
      _target.x + Math.sin(g.camYaw) * dist,
      _target.y + height,
      _target.z + Math.cos(g.camYaw) * dist
    );
    const alpha = 1 - Math.exp(-5 * dt);
    camera.position.lerp(_ideal, alpha);
    camLook.current.lerp(_target, alpha);
    camera.lookAt(camLook.current);
    if (driving) {
      const v = g.vehicles.get(g.drivingId!);
      const targetFov = 55 + Math.min(16, (v?.speed ?? 0) * 0.6);
      camera.fov += (targetFov - camera.fov) * Math.min(1, 4 * dt);
      camera.updateProjectionMatrix();
    } else if (camera.fov !== 55) {
      camera.fov += (55 - camera.fov) * Math.min(1, 4 * dt);
      camera.updateProjectionMatrix();
    }

    // Low-frequency housekeeping
    const T = timers.current;
    T.prox += dt;
    T.clock += dt;
    T.save += dt;
    T.radio += dt;
    if (T.prox > 0.15) {
      T.prox = 0;
      proximityTick(st);
    }
    if (T.clock > 1) {
      T.clock = 0;
      st.setClock(g.time);
    }
    if (T.save > 10) {
      T.save = 0;
      st.save();
    }
    if (T.radio > 45) {
      T.radio = 0;
      if (Math.random() < 0.7) st.radio(RADIO[Math.floor(Math.random() * RADIO.length)]);
    }
  });

  return (
    <>
      <group ref={playerGroup} position={[-14, 0, -14]}>
        <CharacterBody />
      </group>
      {VEHICLE_SPAWNS.map((v) => (
        <ParkedVehicle key={v.id} id={v.id} model={v.model} register={register} />
      ))}
      {spawned.map((v) => (
        <ParkedVehicle key={v.id} id={v.id} model={v.model} register={register} />
      ))}
      <Traffic />
      <Pedestrians />
      <JobMarker />
    </>
  );
}

function proximityTick(st: ReturnType<typeof useGame.getState>) {
  const x = g.playerPos.x;
  const z = g.playerPos.z;
  tryJobProgress(x, z);

  const s2 = useGame.getState();
  const job = s2.activeJob;
  if (job) {
    const t = job.targets[job.stage];
    s2.setNearTarget(Math.hypot(x - t[0], z - t[1]));
  }

  if (g.drivingId) {
    const v = g.vehicles.get(g.drivingId);
    st.setPrompt({
      kind: "vehicle",
      label: "Exit " + (VEHICLE_CATALOG[v?.model ?? ""]?.name ?? "vehicle"),
      vehicleId: "__exit__",
    });
    return;
  }

  let bestId: string | null = null;
  let bestD = 3.5;
  for (const [id, v] of g.vehicles) {
    const d = Math.hypot(x - v.px, z - v.pz);
    if (d < bestD) {
      bestD = d;
      bestId = id;
    }
  }
  if (bestId) {
    const v = g.vehicles.get(bestId)!;
    st.setPrompt({
      kind: "vehicle",
      label: "Enter " + (VEHICLE_CATALOG[v.model]?.name ?? v.model),
      vehicleId: bestId,
    });
    return;
  }

  const poi = nearestPoi(x, z, 4.5);
  if (poi) {
    if (poi.kind === "atm") st.setPrompt({ kind: "atm", label: "Use ATM" });
    else if (poi.kind === "dealership") st.setPrompt({ kind: "dealer", label: "Browse Ojoto Motors" });
    else if (poi.kind === "apartments") st.setPrompt({ kind: "home", label: "Enter home" });
    else {
      st.setPrompt(null);
      return;
    }
    return;
  }
  st.setPrompt(null);
}

useGLTF.preload("/models/character.glb");
for (const m of ["danfo", "sedan", "sports", "taxi", "suv", "police"]) useGLTF.preload(`/models/${m}.glb`);
