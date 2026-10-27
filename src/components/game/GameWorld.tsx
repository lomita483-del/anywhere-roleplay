import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Html } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import { g } from "@/game/state";
import { useGame, VEHICLE_CATALOG, tryJobProgress, nearestPoi, type ActiveJob } from "@/game/store";
import { interact } from "@/game/actions";
import { supabase } from "@/integrations/supabase/client";
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
  const outfit = useGame((s) => s.outfit);
  const { scene, animations } = useGLTF("/models/character.glb");
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, clone);
  const current = useRef("");

  useEffect(() => {
    const topColors: Record<string, string> = { streetwear: "#2d8b67", formal: "#24334c", agbada: "#d4a72c", uniform: "#263d66" };
    const bottomColors: Record<string, string> = { jeans: "#334c75", formal: "#202733", traditional: "#b28b3f", cargo: "#5c6245" };
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone();
      const name = mesh.name.toLowerCase();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        const standard = material as THREE.MeshStandardMaterial;
        if (!standard.color) continue;
        if (/skin|face|head|body/.test(name)) standard.color.set(outfit.skinTone);
        else if (/shirt|top|jacket|torso|coat|dress/.test(name)) standard.color.set(topColors[outfit.top] ?? topColors["streetwear"]!);
        else if (/pants|trouser|bottom|leg/.test(name)) standard.color.set(bottomColors[outfit.bottom] ?? bottomColors["jeans"]!);
        else if (/hair/.test(name)) standard.color.set(outfit.hair === "locs" ? "#171411" : outfit.hair === "braids" ? "#231a17" : "#2b211c");
        else if (/hat|cap|accessory/.test(name) && outfit.accessory === "cap") standard.color.set("#d4a72c");
      }
    });
  }, [clone, outfit]);

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

function PedBody({ variant = 0 }: { variant?: number }) {
  const { scene, animations } = useGLTF("/models/character.glb");
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, clone);
  useEffect(() => {
    const skinTones = ["#986344", "#6f442e", "#b77b55", "#805238", "#c18b62"];
    const tops = ["#c35c3e", "#286e59", "#d1a52d", "#344d7b", "#6e477d", "#e4e1d8"];
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone();
      const name = (mesh.name + " " + (Array.isArray(mesh.material) ? mesh.material.map((m) => m.name).join(" ") : mesh.material.name)).toLowerCase();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        const standard = material as THREE.MeshStandardMaterial;
        if (!standard.color) continue;
        if (/skin|face|head|body/.test(name)) standard.color.set(skinTones[variant % skinTones.length]!);
        else if (/shirt|top|jacket|torso|coat|dress/.test(name)) standard.color.set(tops[variant % tops.length]!);
        else if (/hair/.test(name)) standard.color.set(variant % 3 === 0 ? "#171411" : variant % 3 === 1 ? "#35241c" : "#241e28");
      }
    });
    actions["walk"]?.reset().play();
  }, [clone, actions, variant]);
  const isChild = variant % 6 === 0;
  return <primitive object={clone} scale={isChild ? 1.35 : 2.2} />;
}

function KekeMesh() {
  const rubber = "#17191c";
  const yellow = "#eab308";
  const frame = "#242b30";
  const glass = "#7fb9cb";
  return (
    <group>
      {/* Chassis and painted passenger body */}
      <mesh position={[0, 0.62, 0.02]} castShadow><boxGeometry args={[1.12, 0.48, 1.92]} /><meshStandardMaterial color={yellow} metalness={0.18} roughness={0.48} /></mesh>
      <mesh position={[0, 0.95, -0.08]} castShadow><boxGeometry args={[1.04, 0.56, 1.22]} /><meshStandardMaterial color="#f4c62d" metalness={0.12} roughness={0.5} /></mesh>
      {/* Canopy and tubular safety frame */}
      <mesh position={[0, 1.65, -0.08]} castShadow><boxGeometry args={[1.28, 0.12, 1.75]} /><meshStandardMaterial color={yellow} metalness={0.15} roughness={0.42} /></mesh>
      {[-0.54, 0.54].flatMap((x) => [-0.82, 0.62].map((z) => (
        <mesh key={x + ":" + z} position={[x, 1.32, z]} castShadow><boxGeometry args={[0.055, 0.66, 0.055]} /><meshStandardMaterial color={frame} metalness={0.55} roughness={0.35} /></mesh>
      )))}
      {[-0.54, 0.54].map((x) => <mesh key={"rail" + x} position={[x, 1.18, -0.1]}><boxGeometry args={[0.055, 0.05, 1.55]} /><meshStandardMaterial color={frame} metalness={0.55} roughness={0.35} /></mesh>)}
      {/* Front windscreen, rear panel and open passenger sides */}
      <mesh position={[0, 1.35, 0.79]} rotation-x={-0.08}><planeGeometry args={[0.88, 0.46]} /><meshPhysicalMaterial color={glass} transparent opacity={0.48} roughness={0.18} metalness={0.28} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 1.27, -0.72]}><planeGeometry args={[0.78, 0.42]} /><meshPhysicalMaterial color={glass} transparent opacity={0.35} roughness={0.2} side={THREE.DoubleSide} /></mesh>
      {/* Bench seat visible through the open sides */}
      <mesh position={[0, 0.98, -0.22]}><boxGeometry args={[0.82, 0.12, 0.34]} /><meshStandardMaterial color="#4a3023" roughness={0.92} /></mesh>
      <mesh position={[0, 1.13, -0.38]}><boxGeometry args={[0.82, 0.26, 0.09]} /><meshStandardMaterial color="#4a3023" roughness={0.92} /></mesh>
      {/* Front fender, headlamps, grille and bumper */}
      <mesh position={[0, 0.49, 1.01]}><boxGeometry args={[0.9, 0.14, 0.1]} /><meshStandardMaterial color="#30363b" metalness={0.5} roughness={0.4} /></mesh>
      {[-0.37, 0.37].map((x) => <mesh key={"lamp" + x} position={[x, 0.72, 1.015]}><boxGeometry args={[0.2, 0.13, 0.045]} /><meshStandardMaterial color="#fff2c4" emissive="#ffd66b" emissiveIntensity={0.8} roughness={0.25} /></mesh>)}
      {[-0.18, 0, 0.18].map((x) => <mesh key={"grille" + x} position={[x, 0.63, 1.02]}><boxGeometry args={[0.045, 0.16, 0.025]} /><meshStandardMaterial color="#30363b" metalness={0.65} roughness={0.35} /></mesh>)}
      <mesh position={[0, 0.42, 1.05]}><boxGeometry args={[1.18, 0.12, 0.13]} /><meshStandardMaterial color="#b8bec3" metalness={0.75} roughness={0.28} /></mesh>
      {/* Three wheels, with metallic hubs */}
      {[{x:0,z:1.0},{x:-0.58,z:-0.63},{x:0.58,z:-0.63}].map((w,i) => (
        <group key={"wheel" + i} position={[w.x, 0.35, w.z]}>
          <mesh rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.31, 0.31, 0.16, 16]} /><meshStandardMaterial color={rubber} roughness={0.98} /></mesh>
          <mesh position={[w.x === 0 ? 0.09 : Math.sign(w.x) * 0.09, 0, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.16, 0.16, 0.025, 12]} /><meshStandardMaterial color="#aeb8c0" metalness={0.82} roughness={0.24} /></mesh>
          <mesh position={[w.x === 0 ? 0.105 : Math.sign(w.x) * 0.105, 0, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.055, 0.055, 0.03, 10]} /><meshStandardMaterial color="#3c454b" metalness={0.65} roughness={0.32} /></mesh>
        </group>
      ))}
      {/* Side safety stripe and registration plate */}
      {[-1, 1].map((side) => <mesh key={"stripe" + side} position={[side * 0.57, 0.66, -0.06]}><boxGeometry args={[0.025, 0.09, 1.25]} /><meshStandardMaterial color="#fff0b0" roughness={0.5} /></mesh>)}
      <mesh position={[0, 0.52, 1.125]}><boxGeometry args={[0.34, 0.1, 0.025]} /><meshStandardMaterial color="#f4f1e8" roughness={0.65} /></mesh>
    </group>
  );
}

function CarGlb({ name }: { name: string }) {
  const { scene } = useGLTF(`/models/${name}.glb`);
  const clone = useMemo(() => scene.clone(true), [scene]);
  useEffect(() => {
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        const standard = material as THREE.MeshStandardMaterial;
        if (standard.roughness > 0.78) standard.roughness = 0.62;
        if (standard.metalness > 0.92) standard.metalness = 0.72;
      });
    });
  }, [clone]);
  return (
    <group rotation-y={MODEL_FLIP}>
      <primitive object={clone} />
    </group>
  );
}

function DanfoMesh() {
  const yellow = "#f2c51d";
  const glass = "#213b4b";
  const tire = "#17191d";
  return (
    <group>
      {/* Classic high-roof Lagos minibus body */}
      <mesh position={[0, 0.88, 0]} castShadow receiveShadow><boxGeometry args={[2.02, 1.55, 4.35]} /><meshStandardMaterial color={yellow} metalness={0.14} roughness={0.48} /></mesh>
      <mesh position={[0, 1.63, -0.12]} castShadow><boxGeometry args={[1.94, 0.78, 3.15]} /><meshStandardMaterial color="#f6d43c" metalness={0.12} roughness={0.42} /></mesh>
      <mesh position={[0, 2.04, -0.12]} castShadow><boxGeometry args={[1.88, 0.06, 3.05]} /><meshStandardMaterial color="#c89e12" metalness={0.25} roughness={0.38} /></mesh>
      {/* Tinted side windows with pillars */}
      {[-1, 1].map((side) => (
        <group key={"windows" + side} position={[side * 1.018, 1.63, -0.12]} rotation-y={side * Math.PI / 2}>
          {[-1.17, -0.22, 0.73].map((z) => <mesh key={z} position={[0, 0, z]}><planeGeometry args={[0.78, 0.47]} /><meshPhysicalMaterial color={glass} metalness={0.38} roughness={0.2} clearcoat={0.65} side={THREE.DoubleSide} /></mesh>)}
          <mesh position={[0, -0.41, 0]}><boxGeometry args={[0.035, 0.055, 2.92]} /><meshStandardMaterial color="#e3b817" roughness={0.5} /></mesh>
          <mesh position={[0, -0.71, 0]}><boxGeometry args={[0.045, 0.035, 3.08]} /><meshStandardMaterial color="#a98410" metalness={0.25} roughness={0.45} /></mesh>
        </group>
      ))}
      {/* Windshield and rear window */}
      <mesh position={[0, 1.63, 2.184]} rotation-x={-0.06}><planeGeometry args={[1.48, 0.58]} /><meshPhysicalMaterial color={glass} metalness={0.32} roughness={0.18} clearcoat={0.8} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 1.62, -2.184]}><planeGeometry args={[1.35, 0.55]} /><meshPhysicalMaterial color={glass} metalness={0.3} roughness={0.22} side={THREE.DoubleSide} /></mesh>
      {/* Front grille, chrome bumpers and headlamps */}
      <mesh position={[0, 0.59, 2.205]}><boxGeometry args={[1.72, 0.18, 0.12]} /><meshStandardMaterial color="#b8c0c5" metalness={0.82} roughness={0.25} /></mesh>
      <mesh position={[0, 0.78, 2.207]}><boxGeometry args={[0.55, 0.2, 0.04]} /><meshStandardMaterial color="#30383d" metalness={0.6} roughness={0.32} /></mesh>
      {[-0.7, -0.48, -0.26, 0.26, 0.48, 0.7].map((x) => <mesh key={"grille" + x} position={[x, 0.78, 2.23]}><boxGeometry args={[0.025, 0.16, 0.025]} /><meshStandardMaterial color="#aeb8bf" metalness={0.72} roughness={0.3} /></mesh>)}
      {[-0.72, 0.72].map((x) => <group key={"head" + x}><mesh position={[x, 0.94, 2.21]}><boxGeometry args={[0.28, 0.2, 0.06]} /><meshStandardMaterial color="#fff0c2" emissive="#ffd45d" emissiveIntensity={0.75} roughness={0.25} /></mesh><mesh position={[x, 0.65, 2.21]}><boxGeometry args={[0.22, 0.09, 0.05]} /><meshStandardMaterial color="#e34c36" emissive="#9d251c" emissiveIntensity={0.25} /></mesh></group>)}
      <mesh position={[0, 0.45, 2.25]}><boxGeometry args={[1.9, 0.14, 0.16]} /><meshStandardMaterial color="#9ba4ab" metalness={0.82} roughness={0.25} /></mesh>
      <mesh position={[0, 0.45, -2.22]}><boxGeometry args={[1.9, 0.14, 0.16]} /><meshStandardMaterial color="#9ba4ab" metalness={0.82} roughness={0.25} /></mesh>
      {/* Rear brake lamps */}
      {[-0.76, 0.76].map((x) => <mesh key={"tail" + x} position={[x, 0.9, -2.2]}><boxGeometry args={[0.18, 0.32, 0.06]} /><meshStandardMaterial color="#d9322c" emissive="#7c1614" emissiveIntensity={0.35} /></mesh>)}
      {/* Four road tyres with silver wheel hubs */}
      {[-0.9, 0.9].flatMap((x) => [-1.42, 1.42].map((z) => (
        <group key={x + ":" + z} position={[x, 0.43, z]}>
          <mesh rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.38, 0.38, 0.22, 18]} /><meshStandardMaterial color={tire} roughness={0.98} /></mesh>
          <mesh position={[Math.sign(x) * 0.12, 0, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.22, 0.22, 0.035, 14]} /><meshStandardMaterial color="#b8c1c7" metalness={0.88} roughness={0.22} /></mesh>
          <mesh position={[Math.sign(x) * 0.145, 0, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.075, 0.075, 0.04, 10]} /><meshStandardMaterial color="#41494e" metalness={0.65} roughness={0.28} /></mesh>
        </group>
      )))}
      {/* Mirrors, door seams and recognizable Lagos Danfo livery */}
      {[-1, 1].map((side) => (
        <group key={"mirror" + side}>
          <mesh position={[side * 1.12, 1.47, 1.46]} rotation-z={side * 0.22}><boxGeometry args={[0.24, 0.16, 0.13]} /><meshStandardMaterial color="#20272c" metalness={0.45} roughness={0.3} /></mesh>
          <mesh position={[side * 1.025, 1.35, 0.45]}><boxGeometry args={[0.025, 0.76, 0.035]} /><meshStandardMaterial color="#a7800d" roughness={0.55} /></mesh>
          <mesh position={[side * 1.025, 0.76, -0.25]}><boxGeometry args={[0.035, 0.025, 1.12]} /><meshStandardMaterial color="#fff0a5" roughness={0.5} /></mesh>
        </group>
      ))}
      <mesh position={[0, 1.2, 2.215]}><boxGeometry args={[0.86, 0.16, 0.035]} /><meshStandardMaterial color="#f7f0d9" roughness={0.65} /></mesh>
      <mesh position={[0, 1.2, 2.24]}><planeGeometry args={[0.74, 0.1]} /><meshBasicMaterial color="#25313a" /></mesh>
      <mesh position={[0, 1.1, -2.215]}><boxGeometry args={[0.48, 0.13, 0.04]} /><meshStandardMaterial color="#f7f0d9" roughness={0.65} /></mesh>
    </group>
  );
}

function MotorcycleMesh() {
  return (
    <group>
      <mesh position={[0, 0.76, 0]} castShadow><boxGeometry args={[0.32, 0.32, 0.92]} /><meshStandardMaterial color="#24292e" metalness={0.58} roughness={0.38} /></mesh>
      <mesh position={[0, 1.02, -0.18]} castShadow><boxGeometry args={[0.42, 0.34, 0.58]} /><meshStandardMaterial color="#d62828" metalness={0.22} roughness={0.42} /></mesh>
      <mesh position={[0, 0.97, 0.38]}><boxGeometry args={[0.28, 0.28, 0.3]} /><meshStandardMaterial color="#d9dde0" metalness={0.4} roughness={0.32} /></mesh>
      {[-0.68, 0.7].map((z) => <group key={z} position={[0, 0.38, z]}>
        <mesh rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.34, 0.34, 0.13, 18]} /><meshStandardMaterial color="#17191c" roughness={0.96} /></mesh>
        <mesh rotation-z={Math.PI / 2}><cylinderGeometry args={[0.18, 0.18, 0.145, 12]} /><meshStandardMaterial color="#aab4bc" metalness={0.85} roughness={0.25} /></mesh>
      </group>)}
      <mesh position={[0, 0.7, 0.62]} rotation-x={-0.18} castShadow><cylinderGeometry args={[0.055, 0.055, 0.72, 8]} /><meshStandardMaterial color="#aeb8bf" metalness={0.82} roughness={0.25} /></mesh>
      <mesh position={[0, 1.25, 0.55]}><boxGeometry args={[0.84, 0.055, 0.055]} /><meshStandardMaterial color="#333a40" metalness={0.7} roughness={0.28} /></mesh>
      <mesh position={[0, 1.15, 0.79]}><sphereGeometry args={[0.13, 12, 8]} /><meshStandardMaterial color="#fff1bc" emissive="#ffce53" emissiveIntensity={0.9} /></mesh>
      <mesh position={[0, 1.23, -0.18]}><boxGeometry args={[0.32, 0.12, 0.42]} /><meshStandardMaterial color="#181b20" roughness={0.82} /></mesh>
      <mesh position={[0, 0.62, -0.8]}><boxGeometry args={[0.14, 0.12, 0.04]} /><meshStandardMaterial color="#ef463b" emissive="#a71916" emissiveIntensity={0.35} /></mesh>
      {[-1, 1].map((side) => <mesh key={side} position={[side * 0.18, 0.84, -0.05]}><boxGeometry args={[0.08, 0.3, 0.45]} /><meshStandardMaterial color={side > 0 ? "#eab308" : "#d62828"} roughness={0.46} /></mesh>)}
    </group>
  );
}

function VehicleBody({ model }: { model: string }) {
  if (model === "keke") return <KekeMesh />;
  if (model === "bike") return <MotorcycleMesh />;
  if (model === "danfo") return <DanfoMesh />;
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
      {model === "police" && g.sirenOn && <group position={[0, 1.8, 0]}><mesh position={[-0.28, 0, 0]}><boxGeometry args={[0.28, 0.16, 0.35]} /><meshStandardMaterial color="#ff2638" emissive="#ff2638" emissiveIntensity={2.2} /></mesh><mesh position={[0.28, 0, 0]}><boxGeometry args={[0.28, 0.16, 0.35]} /><meshStandardMaterial color="#268bff" emissive="#268bff" emissiveIntensity={2.2} /></mesh></group>}
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
      PED_WALKS.map((w, i) => {
        const start = w.pts[0] ?? ([0, 0] as [number, number]);
        return {
          pts: w.pts,
          wi: 1 % w.pts.length,
          x: start[0],
          z: start[1],
          speed: 1.1 + (i % 3) * 0.3,
        };
      }),
    []
  );
  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    peds.forEach((p, i) => {
      const wp = p.pts[p.wi];
      if (!wp) return;
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
          position={[w.pts[0]?.[0] ?? 0, 0, w.pts[0]?.[1] ?? 0]}
        >
          <PedBody variant={i} />
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

function RemotePlayer({ name, x, y, z, yaw, vehicle, outfit }: { name: string; x: number; y: number; z: number; yaw: number; vehicle: string | null; outfit?: { skinTone: string; top: string } }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(x, y, z);
    ref.current.rotation.y = yaw;
  });
  return (
    <group ref={ref}>
      {vehicle ? (
        <mesh position={[0, 0.85, 0]} castShadow><boxGeometry args={[1.6, 1.1, 3.2]} /><meshStandardMaterial color="#eab308" roughness={0.45} metalness={0.2} /></mesh>
      ) : (
        <>
          <mesh position={[0, 0.95, 0]} castShadow><capsuleGeometry args={[0.32, 0.9, 4, 8]} /><meshStandardMaterial color={outfit?.top === "uniform" ? "#263d66" : outfit?.top === "formal" ? "#24334c" : outfit?.top === "agbada" ? "#d4a72c" : "#2d8b67"} roughness={0.8} /></mesh>
          <mesh position={[0, 1.8, 0]} castShadow><sphereGeometry args={[0.24, 12, 12]} /><meshStandardMaterial color={outfit?.skinTone ?? "#9b694b"} roughness={0.8} /></mesh>
        </>
      )}
      <Html position={[0, 2.25, 0]} center distanceFactor={18} occlude={false}>
        <div className="whitespace-nowrap rounded-md border border-[#eab308]/35 bg-[#07100f]/85 px-2 py-1 text-[10px] font-semibold text-white shadow-lg">{name}{vehicle ? " · " + vehicle.toUpperCase() : ""}</div>
      </Html>
    </group>
  );
}

function JobPickupVisual({ job }: { job: ActiveJob | null }) {
  if (!job || job.stage !== 0) return null;
  const target = job.targets[0];
  if (!target) return null;
  if (job.type === "driver") return (
    <group position={[target[0], 0, target[1]]}>
      <mesh position={[0, 0.9, 0]} castShadow><capsuleGeometry args={[0.28, 0.9, 4, 8]} /><meshStandardMaterial color="#f0b85c" roughness={0.8} /></mesh>
      <mesh position={[0, 1.72, 0]} castShadow><sphereGeometry args={[0.23, 12, 12]} /><meshStandardMaterial color="#8a5a3c" roughness={0.8} /></mesh>
      <Html position={[0, 2.2, 0]} center distanceFactor={15}><div className="whitespace-nowrap rounded-md border border-[#eab308]/40 bg-black/80 px-2 py-1 text-[10px] font-semibold text-[#ffe8a3]">Passenger · Pick up</div></Html>
    </group>
  );
  if (job.type === "courier") return (
    <group position={[target[0], 0, target[1]]}>
      <mesh position={[0, 0.65, 0]} castShadow><boxGeometry args={[0.9, 0.9, 0.9]} /><meshStandardMaterial color="#c48b45" roughness={0.75} /></mesh>
      <mesh position={[0, 1.35, 0]}><sphereGeometry args={[0.65, 12, 12]} /><meshBasicMaterial color="#eab308" transparent opacity={0.13} /></mesh>
      <Html position={[0, 1.7, 0]} center distanceFactor={15}><div className="whitespace-nowrap rounded-md border border-[#eab308]/40 bg-black/80 px-2 py-1 text-[10px] font-semibold text-[#ffe8a3]">Delivery package</div></Html>
    </group>
  );
  return null;
}
function GpsRoute({ waypoint }: { waypoint: { x: number; z: number; label: string } | null }) {
  const glow = useMemo(() => new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: "#eab308", transparent: true, opacity: 0.2 })), []);
  const route = useMemo(() => new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: "#ffe38a", transparent: true, opacity: 0.95 })), []);
  const beacon = useRef<THREE.Group>(null);
  useEffect(() => () => {
    glow.geometry.dispose(); (glow.material as THREE.Material).dispose();
    route.geometry.dispose(); (route.material as THREE.Material).dispose();
  }, [glow, route]);
  useFrame((state) => {
    if (!waypoint) return;
    const points = [new THREE.Vector3(g.playerPos.x, 0.16, g.playerPos.z), new THREE.Vector3(waypoint.x, 0.16, waypoint.z)];
    glow.geometry.setFromPoints(points);
    route.geometry.setFromPoints(points);
    if (beacon.current) {
      beacon.current.position.set(waypoint.x, 0, waypoint.z);
      beacon.current.children[0]!.rotation.y = state.clock.elapsedTime * 0.8;
      beacon.current.children[1]!.position.y = 2.4 + Math.sin(state.clock.elapsedTime * 2.4) * 0.18;
    }
  });
  if (!waypoint) return null;
  return (
    <>
      <primitive object={glow} />
      <primitive object={route} />
      <group ref={beacon} position={[waypoint.x, 0, waypoint.z]}>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.09, 0]}>
          <ringGeometry args={[1.2, 1.8, 32]} />
          <meshBasicMaterial color="#ff5757" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 2.4, 0]}>
          <cylinderGeometry args={[0.12, 0.42, 4.8, 10, 1, true]} />
          <meshBasicMaterial color="#ff5757" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}

export default function GameWorld() {
  const keys = useKeys();
  const playerGroup = useRef<THREE.Group>(null);
  const camLook = useRef(new THREE.Vector3(-14, 1, -14));
  const vehRefs = useRef(new Map<string, THREE.Group | null>());
  const timers = useRef({ prox: 0, clock: 0, save: 0, radio: 20 });
  const spawned = useGame((s) => s.spawnedVehicles);
  const waypoint = useGame((s) => s.waypoint);
  const activeJob = useGame((s) => s.activeJob);
  const [remotePlayers, setRemotePlayers] = useState<Record<string, { name: string; x: number; y: number; z: number; yaw: number; vehicle: string | null; outfit?: { skinTone: string; top: string } }>>({});

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let lastX = 0;
    let lastY = 0;
    let pinchDistance = 0;
    let dragging = false;
    const down = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 1) {
        lastX = event.clientX; lastY = event.clientY; dragging = true;
      } else if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinchDistance = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
        dragging = false;
      }
    };
    const move = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      const old = pointers.get(event.pointerId)!;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size >= 2) {
        const pts = [...pointers.values()];
        const distance = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
        if (pinchDistance > 0) g.camDistance = THREE.MathUtils.clamp(g.camDistance - (distance - pinchDistance) * 0.055, 4, 95);
        pinchDistance = distance;
        return;
      }
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX; lastY = event.clientY;
      g.camYaw -= dx * 0.006;
      g.camPitch = THREE.MathUtils.clamp(g.camPitch + dy * 0.0045, 0.12, 1.48);
    };
    const up = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinchDistance = 0;
      if (!pointers.size) dragging = false;
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      g.camDistance = THREE.MathUtils.clamp(g.camDistance + event.deltaY * 0.025, 4, 95);
    };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      canvas.removeEventListener("wheel", wheel);
    };
  }, []);



  const register = (id: string, grp: THREE.Group | null) => {
    vehRefs.current.set(id, grp);
  };

  useEffect(() => {
    let alive = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let publishTimer = 0;
    let playerId: string | null = null;
    const connect = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!alive || !data.session) return;
        playerId = data.session.user.id;
        channel = supabase.channel("lagos-life-world", { config: { presence: { key: playerId }, broadcast: { self: false } } });
        channel
          .on("broadcast", { event: "player_state" }, ({ payload }) => {
            const p = payload as { id?: string; name?: string; x?: number; y?: number; z?: number; yaw?: number; vehicle?: string | null; outfit?: { skinTone: string; top: string } };
            if (!p.id || p.id === playerId || typeof p.x !== "number" || typeof p.z !== "number") return;
            setRemotePlayers((current) => ({ ...current, [p.id!]: { name: p.name || "Hustler", x: p.x!, y: p.y ?? 0, z: p.z!, yaw: p.yaw || 0, vehicle: p.vehicle ?? null, ...(p.outfit ? { outfit: p.outfit } : {}) } }));
          })
          .on("presence", { event: "sync" }, () => {
            const state = channel?.presenceState() ?? {};
            const activeIds = new Set(Object.keys(state).filter((id) => id !== playerId));
            setRemotePlayers((current) => Object.fromEntries(Object.entries(current).filter(([id]) => activeIds.has(id))));
          })
          .subscribe(async (status) => {
            if (status !== "SUBSCRIBED" || !channel || !playerId) return;
            await channel.track({ online: true, name: useGame.getState().name, joined_at: new Date().toISOString() });
            if (publishTimer) window.clearInterval(publishTimer);
            publishTimer = window.setInterval(() => {
              if (!channel || !playerId) return;
              const v = g.drivingId ? g.vehicles.get(g.drivingId) : null;
              void channel.send({ type: "broadcast", event: "player_state", payload: { id: playerId, name: useGame.getState().name || "Hustler", x: g.playerPos.x, y: g.playerPos.y, z: g.playerPos.z, yaw: g.playerYaw, vehicle: v?.model ?? null, outfit: { skinTone: useGame.getState().outfit.skinTone, top: useGame.getState().outfit.top } } });
            }, 250);
          });
      } catch (error) {
        console.warn("[Anywhere Roleplay] Multiplayer presence unavailable:", error);
      }
    };
    void connect();
    return () => {
      alive = false;
      if (publishTimer) window.clearInterval(publishTimer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

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
        const baseCat = VEHICLE_CATALOG[v.model] ?? VEHICLE_CATALOG["sedan"]!;
        const tuned = (st.inventory["engine-tune"] ?? 0) > 0;
        const cat = tuned ? { ...baseCat, maxSpeed: baseCat.maxSpeed * 1.2, accel: baseCat.accel * 1.15 } : baseCat;
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
    const dist = driving ? Math.max(10, g.camDistance * 1.45) : g.camDistance;
    const pitch = driving ? Math.min(g.camPitch, 0.85) : g.camPitch;
    _ideal.set(
      _target.x + Math.sin(g.camYaw) * dist * Math.cos(pitch),
      _target.y + Math.sin(pitch) * dist,
      _target.z + Math.cos(g.camYaw) * dist * Math.cos(pitch)
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
      if (Math.random() < 0.7) st.radio(RADIO[Math.floor(Math.random() * RADIO.length)] ?? RADIO[0]!);
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
      <JobPickupVisual job={activeJob} />
      <GpsRoute waypoint={waypoint} />
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
    if (t) s2.setNearTarget(Math.hypot(x - t[0], z - t[1]));
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
    else if (poi.kind === "clothing") st.setPrompt({ kind: "wardrobe", label: "Open Lagos Boutique" });
    else if (poi.kind === "jobboard") st.setPrompt({ kind: "jobboard", label: "Browse City Job Board" });
    else if (poi.kind === "police") st.setPrompt({ kind: "police", label: "Clock in at Police HQ" });
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
