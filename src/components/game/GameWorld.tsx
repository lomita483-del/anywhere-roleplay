import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Html } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import { g } from "@/game/state";
import { getInteriorDefinition } from "@/game/interiors";
import InteriorWorld from "@/components/game/InteriorWorld";
import { NEW_MAP_SCALE, NEW_MAP_BOUNDS, isNewMapBlocked } from "@/game/newMap";
import { useGame, VEHICLE_CATALOG, tryJobProgress, nearestPoi, type ActiveJob } from "@/game/store";
import { enterBuilding, interact } from "@/game/actions";
import { supabase } from "@/integrations/supabase/client";
import { VEHICLE_SPAWNS, TRAFFIC, PED_WALKS, BUILDINGS, STALLS, ROADS_X, ROADS_Z, isBlocked, clampWorld, districtAt, getMapPlaces } from "@/game/city";

// Kenney GLB vehicles face -Z; our physics forward is +Z at yaw 0.
const MODEL_FLIP = Math.PI;

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
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const skin = outfit.skinTone || "#986344";
  const female = outfit.gender === "female";
  const tops: Record<string, string> = { streetwear: "#e7e4e0", formal: "#202b3c", agbada: "#d8b24c", uniform: "#263d66" };
  const bottoms: Record<string, string> = { jeans: "#334c75", formal: "#202733", traditional: "#b28b3f", cargo: "#5c6245" };
  const top = tops[outfit.top] ?? tops["streetwear"]!;
  const bottom = bottoms[outfit.bottom] ?? bottoms["jeans"]!;
  const hair = outfit.hairColor || (outfit.hair === "locs" ? "#211a29" : outfit.hair === "braids" ? "#241b17" : "#4b1877");
  const shoe = outfit.top === "formal" ? "#25252b" : "#d9dcdf";

  useFrame((state) => {
    const moving = Math.min(Math.abs(g.playerSpeed) / 6, 1);
    const swing = Math.sin(state.clock.elapsedTime * 9) * moving * 0.42;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing;
    if (rightLeg.current) rightLeg.current.rotation.x = swing;
  });

  return (
    <group>
      {/* Neck and layered torso */}
      <mesh position={[0, 1.36, 0]} castShadow><cylinderGeometry args={[0.085, 0.1, 0.18, 9]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
      <mesh position={[0, 1.04, 0]} castShadow receiveShadow><capsuleGeometry args={[female ? 0.235 : 0.26, 0.43, 5, 10]} /><meshStandardMaterial color={top} roughness={0.88} /></mesh>
      <mesh position={[0, 0.68, 0]} castShadow><capsuleGeometry args={[female ? 0.22 : 0.19, 0.18, 4, 8]} /><meshStandardMaterial color={bottom} roughness={0.9} /></mesh>
      <mesh position={[0, 1.27, 0.015]}><torusGeometry args={[0.105, 0.022, 5, 12]} /><meshStandardMaterial color={outfit.top === "formal" ? "#e6e6e3" : top} roughness={0.8} /></mesh>
      {outfit.accessory === "chain" && <mesh position={[0, 1.245, 0.18]}><torusGeometry args={[0.13, 0.012, 6, 18]} /><meshStandardMaterial color="#eab308" metalness={0.82} roughness={0.24} /></mesh>}
      <mesh position={[0.13, 1.12, 0.245]}><boxGeometry args={[0.075, 0.1, 0.016]} /><meshStandardMaterial color={outfit.top === "formal" ? "#d8dce2" : "#c5c8c8"} roughness={0.9} /></mesh>
      {outfit.top === "formal" && <group>
        <mesh position={[0, 1.05, 0.258]}><boxGeometry args={[0.025, 0.33, 0.015]} /><meshStandardMaterial color="#e6e6e3" roughness={0.8} /></mesh>
        <mesh position={[0, 1.07, 0.275]} rotation-z={Math.PI}><coneGeometry args={[0.055, 0.19, 4]} /><meshStandardMaterial color="#8d1f32" roughness={0.72} /></mesh>
        <mesh position={[-0.11, 1.17, 0.245]} rotation-z={-0.18}><boxGeometry args={[0.08, 0.22, 0.025]} /><meshStandardMaterial color="#e7e8e9" roughness={0.85} /></mesh>
        <mesh position={[0.11, 1.17, 0.245]} rotation-z={0.18}><boxGeometry args={[0.08, 0.22, 0.025]} /><meshStandardMaterial color="#e7e8e9" roughness={0.85} /></mesh>
      </group>}
      {outfit.top === "streetwear" && <group>
        <mesh position={[0, 1.34, -0.13]} scale={[0.19, 0.18, 0.1]} castShadow><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color={top} roughness={0.94} /></mesh>
        <mesh position={[0, 1.34, -0.07]}><torusGeometry args={[0.145, 0.025, 6, 12]} /><meshStandardMaterial color={top} roughness={0.92} /></mesh>
        <mesh position={[0, 0.91, 0.245]}><boxGeometry args={[0.2, 0.12, 0.025]} /><meshStandardMaterial color={top} roughness={0.9} /></mesh>
        {[-1, 1].map(side => <mesh key={"hood-string"+side} position={[side*0.045, 1.12, 0.266]}><cylinderGeometry args={[0.008, 0.008, 0.2, 5]} /><meshStandardMaterial color="#d5d0c8" roughness={0.85} /></mesh>)}
      </group>}
      {outfit.top === "uniform" && <group>
        <mesh position={[0.15, 1.16, 0.258]}><boxGeometry args={[0.085, 0.09, 0.018]} /><meshStandardMaterial color="#eab308" metalness={0.35} roughness={0.4} /></mesh>
        <mesh position={[-0.12, 1.15, 0.257]}><boxGeometry args={[0.1, 0.08, 0.018]} /><meshStandardMaterial color="#dbe7ee" roughness={0.75} /></mesh>
        <mesh position={[0, 0.83, 0.15]}><boxGeometry args={[0.37, 0.035, 0.31]} /><meshStandardMaterial color="#171d26" roughness={0.65} /></mesh>
      </group>}
      {outfit.top === "agbada" && <group>
        <mesh position={[-0.2, 1.04, 0.02]} rotation-z={-0.08}><boxGeometry args={[0.12, 0.56, 0.31]} /><meshStandardMaterial color={top} roughness={0.92} /></mesh>
        <mesh position={[0.2, 1.04, 0.02]} rotation-z={0.08}><boxGeometry args={[0.12, 0.56, 0.31]} /><meshStandardMaterial color={top} roughness={0.92} /></mesh>
        <mesh position={[0, 1.25, 0.25]}><boxGeometry args={[0.18, 0.035, 0.018]} /><meshStandardMaterial color="#f2d77b" metalness={0.15} roughness={0.5} /></mesh>
      </group>}
      {/* Shaped head, ears, face and hair */}
      <group position={[0, 1.66, 0.015]}>
        <mesh position={[0, -0.045, 0]} scale={[0.205, 0.25, 0.19]} castShadow><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
        <mesh position={[0, -0.155, 0.035]} scale={[0.145, 0.1, 0.145]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
        {[-1, 1].map(side => <mesh key={"ear"+side} position={[side*0.205,-0.055,0]} scale={[0.04,0.065,0.035]}><sphereGeometry args={[1,8,7]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>)}
        <mesh position={[0,-0.06,0.184]}><boxGeometry args={[0.043,0.105,0.05]} /><meshStandardMaterial color="#885538" roughness={0.92} /></mesh>
        {[-1,1].map(side => <group key={"eye"+side} position={[side*0.08,0.005,0.17]}>
          <mesh scale={[0.052,0.024,0.016]}><sphereGeometry args={[1,10,6]} /><meshStandardMaterial color="#f2e8d8" roughness={0.75} /></mesh>
          <mesh position={[0,0,0.014]} scale={[0.015,0.018,0.008]}><sphereGeometry args={[1,8,6]} /><meshStandardMaterial color="#211a16" roughness={0.55} /></mesh>
          <mesh position={[0,0.04,0]}><boxGeometry args={[0.07,0.016,0.02]} /><meshStandardMaterial color={hair} roughness={0.9} /></mesh>
        </group>)}
        {outfit.accessory === "shades" && <group>
          <mesh position={[-0.08,0.005,0.195]}><boxGeometry args={[0.085,0.05,0.025]} /><meshStandardMaterial color="#111820" metalness={0.35} roughness={0.22} /></mesh>
          <mesh position={[0.08,0.005,0.195]}><boxGeometry args={[0.085,0.05,0.025]} /><meshStandardMaterial color="#111820" metalness={0.35} roughness={0.22} /></mesh>
          <mesh position={[0,0.005,0.195]}><boxGeometry args={[0.04,0.012,0.02]} /><meshStandardMaterial color="#d5b75a" metalness={0.65} roughness={0.25} /></mesh>
        </group>}
        <mesh position={[0,-0.155,0.176]}><boxGeometry args={[0.06,0.01,0.01]} /><meshStandardMaterial color="#603a2c" roughness={0.9} /></mesh>
        <mesh position={[0,0.14,-0.005]} scale={[0.21,0.14,0.2]}><sphereGeometry args={[1,12,8]} /><meshStandardMaterial color={hair} roughness={0.92} /></mesh>
        {female && <group>
          <mesh position={[-0.18,-0.13,-0.035]} rotation-z={-0.12}><capsuleGeometry args={[0.055,0.28,4,7]} /><meshStandardMaterial color={hair} roughness={0.94} /></mesh>
          <mesh position={[0.18,-0.13,-0.035]} rotation-z={0.12}><capsuleGeometry args={[0.055,0.28,4,7]} /><meshStandardMaterial color={hair} roughness={0.94} /></mesh>
          {[-1,1].map(side => <mesh key={"earring"+side} position={[side*0.215,-0.095,0.03]}><torusGeometry args={[0.035,0.009,5,10]} /><meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.25} /></mesh>)}
        </group>}
        {outfit.hair === "locs" && Array.from({length:13},(_,i)=>{
          const a=i/13*Math.PI*2;
          return <mesh key={"loc"+i} position={[Math.cos(a)*0.17,0.16+(i%3)*0.02,Math.sin(a)*0.15]} rotation-z={Math.cos(a)*0.25} rotation-x={Math.sin(a)*0.22} castShadow><cylinderGeometry args={[0.027,0.038,0.17+(i%2)*0.04,6]} /><meshStandardMaterial color={hair} roughness={0.95} /></mesh>;
        })}
        {outfit.hair === "braids" && Array.from({length:7},(_,i)=><mesh key={"braid"+i} position={[(i-3)*0.045,0.1,-0.04]} rotation-z={(i-3)*0.06} castShadow><cylinderGeometry args={[0.02,0.026,0.2,6]} /><meshStandardMaterial color={hair} roughness={0.94} /></mesh>)}
        {outfit.accessory === "cap" && <group position={[0,0.19,0.015]}><mesh scale={[0.215,0.07,0.2]}><sphereGeometry args={[1,12,8]} /><meshStandardMaterial color="#d4a72c" roughness={0.6} /></mesh><mesh position={[0,-0.03,0.15]}><boxGeometry args={[0.25,0.025,0.16]} /><meshStandardMaterial color="#b48b24" roughness={0.6} /></mesh></group>}
      </group>
      {/* Sleeves, forearms and individual hands */}
      {[-1,1].map(side=><group key={"arm"+side} ref={side<0?leftArm:rightArm} position={[side*0.29,1.22,0]}>
        <mesh position={[side*0.07,-0.13,0]} rotation-z={side*-0.12} castShadow><capsuleGeometry args={[0.082,0.22,4,8]} /><meshStandardMaterial color={top} roughness={0.88} /></mesh>
        <mesh position={[side*0.1,-0.34,0.01]} rotation-z={side*-0.08} castShadow><capsuleGeometry args={[0.063,0.22,4,8]} /><meshStandardMaterial color={outfit.top==="agbada"?top:skin} roughness={0.9} /></mesh>
        <mesh position={[side*0.11,-0.5,0.03]} castShadow><capsuleGeometry args={[0.06,0.09,4,7]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
        {[-1,0,1].map(f=><mesh key={f} position={[side*(0.11+f*0.024),-0.57,0.045]}><capsuleGeometry args={[0.011,0.06,3,5]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>)}
      </group>)}
      {/* Waist, articulated trouser legs and sneakers */}
      <mesh position={[0,0.78,0]} castShadow><boxGeometry args={[0.34,0.18,0.28]} /><meshStandardMaterial color={bottom} roughness={0.9} /></mesh>
      {[-1,1].map(side=><group key={"leg"+side} ref={side<0?leftLeg:rightLeg} position={[side*0.105,0.7,0]}>
        <mesh position={[0,-0.17,0]} castShadow><capsuleGeometry args={[0.09,0.27,4,8]} /><meshStandardMaterial color={bottom} roughness={0.9} /></mesh>
        <mesh position={[0,-0.45,0.015]} castShadow><capsuleGeometry args={[0.07,0.27,4,8]} /><meshStandardMaterial color={bottom} roughness={0.9} /></mesh>
        <mesh position={[0,-0.64,0.08]} castShadow><boxGeometry args={[0.15,0.1,0.27]} /><meshStandardMaterial color={shoe} roughness={0.76} /></mesh>
        <mesh position={[0,-0.695,0.105]}><boxGeometry args={[0.16,0.025,0.29]} /><meshStandardMaterial color="#aeb4b9" roughness={0.75} /></mesh>
        {[-1,1].map(l=><mesh key={l} position={[l*0.028,-0.63,0.19]}><boxGeometry args={[0.009,0.008,0.05]} /><meshStandardMaterial color="#f5f2ec" roughness={0.8} /></mesh>)}
      </group>)}
    </group>
  );
}

function PedBody({ variant = 0, skinTone, topColor, hairColor, gender }: { variant?: number; skinTone?: string; topColor?: string; hairColor?: string; gender?: "male" | "female" }) {
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
        if (/skin|face|head|body/.test(name)) standard.color.set(skinTone || skinTones[variant % skinTones.length]!);
        else if (/shirt|top|jacket|torso|coat|dress/.test(name)) standard.color.set(topColor || tops[variant % tops.length]!);
        else if (/hair/.test(name)) standard.color.set(hairColor || (variant % 3 === 0 ? "#171411" : variant % 3 === 1 ? "#35241c" : "#241e28"));
      }
    });
    actions["walk"]?.reset().play();
  }, [clone, actions, variant, skinTone, topColor, hairColor]);
  const isChild = variant % 6 === 0;
  return <primitive object={clone} scale={isChild ? 1.35 : gender === "female" ? [2.08, 2.2, 2.2] : 2.2} />;
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

export function VehicleBody({ model }: { model: string }) {
  if (model === "keke") return <KekeMesh />;
  if (model === "bike") return <MotorcycleMesh />;
  if (model === "danfo") return <DanfoMesh />;
  return <CarGlb name={model} />;
}

function ParkedVehicle({ id, model, register, scale = 1 }: { id: string; model: string; register: (id: string, grp: THREE.Group | null) => void; scale?: number }) {
  const ref = useRef<THREE.Group | null>(null);
  useFrame(() => {
    const v = g.vehicles.get(id);
    const grp = ref.current;
    if (!v || !grp) return;
    grp.position.set(v.px * scale, 0, v.pz * scale);
    grp.rotation.y = v.yaw;
  });
  return (
    <group
      ref={(o) => {
        ref.current = o;
        register(id, o);
      }}
      scale={scale}
    >
      <VehicleBody model={model} />
      {model === "police" && g.sirenOn && <group position={[0, 1.8, 0]}><mesh position={[-0.28, 0, 0]}><boxGeometry args={[0.28, 0.16, 0.35]} /><meshStandardMaterial color="#ff2638" emissive="#ff2638" emissiveIntensity={2.2} /></mesh><mesh position={[0.28, 0, 0]}><boxGeometry args={[0.28, 0.16, 0.35]} /><meshStandardMaterial color="#268bff" emissive="#268bff" emissiveIntensity={2.2} /></mesh></group>}
    </group>
  );
}

function Traffic() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const graphicsQuality = useGame((s) => s.graphicsQuality);
  const trafficCount = graphicsQuality === "low" ? 12 : graphicsQuality === "medium" ? 24 : TRAFFIC.length;
  const cars = useMemo(
    () => TRAFFIC.map((t, i) => ({
      t,
      dir: t.offset > 0.5 ? -1 as const : 1 as const,
      p: t.lane.from + (t.offset % 0.5) * 2 * (t.lane.to - t.lane.from),
      speed: t.speed * 0.72,
      desiredSpeed: t.speed,
    })),
    []
  );

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const horizontalGreen = Math.floor(state.clock.elapsedTime / 12) % 2 === 0;
    const roadLength = 336;
    const acceleration = 3.2;
    const braking = 7.5;
    const safeGap = 3.2;

    cars.forEach((car, i) => {
      const group = refs.current[i];
      const x = car.t.lane.axis === "x" ? car.p : car.t.lane.fixed;
      const z = car.t.lane.axis === "x" ? car.t.lane.fixed : car.p;
      const nearPlayer = Math.hypot(g.playerPos.x - x, g.playerPos.z - z) < 135;
      if (i >= trafficCount || !nearPlayer) {
        if (group) group.visible = false;
        return;
      }
      if (group) group.visible = true;

      let targetSpeed = car.t.speed;
      // Follow the closest vehicle ahead in the same lane. This prevents overlap
      // and produces natural queues instead of cars passing through one another.
      let nearestGap = Infinity;
      let leaderSpeed = targetSpeed;
      for (let j = 0; j < cars.length; j += 1) {
        if (i === j) continue;
        const other = cars[j];
        if (other.t.lane.axis !== car.t.lane.axis ||
            Math.abs(other.t.lane.fixed - car.t.lane.fixed) > 0.15 ||
            other.dir !== car.dir) continue;
        const rawGap = (other.p - car.p) * car.dir;
        const gap = rawGap >= 0 ? rawGap : rawGap + roadLength;
        if (gap > 0.5 && gap < nearestGap) {
          nearestGap = gap;
          leaderSpeed = other.speed;
        }
      }
      if (nearestGap < 18) {
        const available = Math.max(0, nearestGap - safeGap);
        targetSpeed = Math.min(targetSpeed, Math.sqrt(Math.max(0, leaderSpeed * leaderSpeed + 2 * 4.5 * available)));
      }

      // Respect the alternating junction lights with progressive braking.
      const crossings = car.t.lane.axis === "x" ? ROADS_X : ROADS_Z;
      const nextCrossing = crossings
        .map((point) => ({ point, ahead: (point - car.p) * car.dir }))
        .filter((point) => point.ahead >= 0 && point.ahead < 24)
        .sort((left, right) => left.ahead - right.ahead)[0];
      const green = car.t.lane.axis === "x" ? horizontalGreen : !horizontalGreen;
      if (nextCrossing && !green) {
        const stoppingDistance = Math.max(0, nextCrossing.ahead - 5.5);
        targetSpeed = Math.min(targetSpeed, Math.sqrt(2 * 4.5 * stoppingDistance));
      }

      if (car.speed < targetSpeed) car.speed = Math.min(targetSpeed, car.speed + acceleration * dt);
      else car.speed = Math.max(targetSpeed, car.speed - braking * dt);
      car.p += car.dir * car.speed * dt;
      if (car.p > car.t.lane.to) car.p = car.t.lane.from + (car.p - car.t.lane.to);
      if (car.p < car.t.lane.from) car.p = car.t.lane.to - (car.t.lane.from - car.p);

      if (!group) return;
      if (car.t.lane.axis === "x") {
        group.position.set(car.p, 0, car.t.lane.fixed);
        group.rotation.y = car.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        group.position.set(car.t.lane.fixed, 0, car.p);
        group.rotation.y = car.dir > 0 ? 0 : Math.PI;
      }
    });
  });

  return (
    <>
      {TRAFFIC.map((route, i) => (
        <group key={i} ref={(node) => { refs.current[i] = node; }}>
          <VehicleBody model={route.model} />
        </group>
      ))}
    </>
  );
}

function Pedestrians() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const graphicsQuality = useGame((s) => s.graphicsQuality);
  const pedestrianCount = graphicsQuality === "low" ? 12 : graphicsQuality === "medium" ? 28 : PED_WALKS.length;
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
      const grp = refs.current[i];
      if (i >= pedestrianCount || Math.hypot(g.playerPos.x - p.x, g.playerPos.z - p.z) > 95) {
        if (grp) grp.visible = false;
        return;
      }
      if (grp) grp.visible = true;
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
      if (grp) {
        grp.position.set(p.x, 0, p.z);
        grp.rotation.y = Math.atan2(dx, dz);
      }
    });
  });
  return (
    <>
      {PED_WALKS.slice(0, pedestrianCount).map((w, i) => (
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
function buildRoadRoute(startX: number, startZ: number, destX: number, destZ: number): [number, number][] {
  const nearest = (value: number, roads: readonly number[]) => roads.reduce((best, road) => Math.abs(road - value) < Math.abs(best - value) ? road : best, roads[0] ?? 0);
  const startRoadX = nearest(startX, ROADS_X);
  const targetRoadX = nearest(destX, ROADS_X);
  const targetRoadZ = nearest(destZ, ROADS_Z);
  const raw: [number, number][] = [
    [startX, startZ], [startRoadX, startZ], [startRoadX, targetRoadZ],
    [targetRoadX, targetRoadZ], [targetRoadX, destZ], [destX, destZ],
  ];
  return raw.filter((point, index) => index === 0 || Math.hypot(point[0] - raw[index - 1]![0], point[1] - raw[index - 1]![1]) > 1);
}

function GpsRoute({ waypoint, isNewMap = false, worldScale = 1 }: { waypoint: { x: number; z: number; label: string } | null; isNewMap?: boolean; worldScale?: number }) {
  const glow = useMemo(() => new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: "#24ef91", transparent: true, opacity: 0.24 })), []);
  const route = useMemo(() => new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: "#57f5a9", transparent: true, opacity: 0.98 })), []);
  const beacon = useRef<THREE.Group>(null);
  const distanceTimer = useRef(0);
  const [distance, setDistance] = useState(0);
  useEffect(() => () => {
    glow.geometry.dispose(); (glow.material as THREE.Material).dispose();
    route.geometry.dispose(); (route.material as THREE.Material).dispose();
  }, [glow, route]);
  useFrame((state, delta) => {
    if (!waypoint) return;
    distanceTimer.current += delta;
    if (distanceTimer.current >= 0.5) {
      distanceTimer.current = 0;
      setDistance(Math.round(Math.hypot(waypoint.x - g.playerPos.x, waypoint.z - g.playerPos.z)));
    }
    const routePoints: [number, number][] = isNewMap ? [[g.playerPos.x, g.playerPos.z], [waypoint.x, waypoint.z]] : buildRoadRoute(g.playerPos.x, g.playerPos.z, waypoint.x, waypoint.z);
    const points = routePoints.map(([x, z]) => new THREE.Vector3(x, 0.16, z));
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
    <group scale={worldScale}>
      <primitive object={glow} />
      <primitive object={route} />
      <group ref={beacon} position={[waypoint.x, 0, waypoint.z]}>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.09, 0]}>
          <ringGeometry args={[1.2, 1.8, 32]} />
          <meshBasicMaterial color="#35f29a" transparent opacity={0.96} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 2.4, 0]}>
          <cylinderGeometry args={[0.12, 0.42, 4.8, 10, 1, true]} />
          <meshBasicMaterial color="#35f29a" transparent opacity={0.32} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <Html position={[0, 4.8, 0]} center distanceFactor={16}>
          <div className="whitespace-nowrap rounded-lg border border-emerald-300/60 bg-[#04170f]/90 px-2.5 py-1 text-[10px] font-black text-emerald-100 shadow-[0_0_18px_rgba(53,242,154,.35)]">{waypoint.label} · {distance}m</div>
        </Html>
      </group>
    </group>
  );
}

function RemotePlayerAvatar({ player, variant, worldScale = 1 }: { player: { name: string; x: number; y: number; z: number; yaw: number; vehicle: string | null; outfit?: { gender?: "male" | "female"; skinTone?: string; top?: string; hairColor?: string } }; variant: number; worldScale?: number }) {
  const ref = useRef<THREE.Group>(null);
  const target = useRef(new THREE.Vector3());
  const topColors: Record<string, string> = { streetwear: "#e7e4e0", formal: "#202b3c", agbada: "#d8b24c", uniform: "#263d66" };
  useFrame((_, delta) => {
    if (!ref.current) return;
    target.current.set(player.x, player.y, player.z);
    ref.current.position.lerp(target.current, 1 - Math.exp(-Math.min(delta, 0.05) * 10));
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, player.yaw, 8, delta);
  });
  return (
    <group ref={ref} position={[player.x, player.y, player.z]} scale={worldScale} rotation-y={player.yaw}>
      {player.vehicle ? <VehicleBody model={player.vehicle} /> : <PedBody variant={variant} gender={player.outfit?.gender ?? "male"} skinTone={player.outfit?.skinTone ?? "#986344"} topColor={topColors[player.outfit?.top ?? ""] ?? "#c35c3e"} hairColor={player.outfit?.hairColor ?? "#171411"} />}
      <Html position={[0, player.vehicle ? 2.8 : 3.05, 0]} center distanceFactor={12} occlude={false}>
        <div className="pointer-events-none whitespace-nowrap rounded-full border border-[#eab308]/55 bg-[#07131d]/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg shadow-black/30">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {player.name}
        </div>
      </Html>
    </group>
  );
}

function RideDriver() {
  const ride = useGame((s) => s.rideRequest);
  const ref = useRef<THREE.Group>(null);
  const runtime = useRef<{ id: string; x: number; z: number; yaw: number; status: "approaching" | "travelling"; route: [number, number][]; routeIndex: number } | null>(null);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const group = ref.current;
    if (!ride || !group) {
      g.ridingPassenger = false;
      runtime.current = null;
      return;
    }
    if (!runtime.current || runtime.current.id !== ride.id) {
      runtime.current = { id: ride.id, x: ride.x, z: ride.z, yaw: ride.yaw, status: "approaching", route: [], routeIndex: 0 };
    }
    const r = runtime.current;
    const routeTarget = r.status === "travelling" ? (r.route[r.routeIndex] ?? [ride.destination.x, ride.destination.z]) : null;
    const targetX = r.status === "approaching" ? g.playerPos.x : (routeTarget?.[0] ?? ride.destination.x);
    const targetZ = r.status === "approaching" ? g.playerPos.z : (routeTarget?.[1] ?? ride.destination.z);
    const dx = targetX - r.x;
    const dz = targetZ - r.z;
    const distance = Math.hypot(dx, dz);
    const speed = r.status === "approaching" ? (ride.service === "bike" ? 10 : ride.service === "danfo" ? 5 : ride.service === "keke" ? 7 : 8) : (ride.service === "bike" ? 14 : ride.service === "private" ? 11 : ride.service === "danfo" ? 6 : ride.service === "keke" ? 8 : 9);
    if (distance > (r.status === "approaching" ? 2.8 : 2.2)) {
      const step = Math.min(distance, speed * dt);
      r.x += (dx / distance) * step;
      r.z += (dz / distance) * step;
      r.yaw = Math.atan2(dx, dz);
    } else if (r.status === "approaching") {
      r.status = "travelling";
      r.route = buildRoadRoute(r.x, r.z, ride.destination.x, ride.destination.z);
      r.routeIndex = Math.min(1, Math.max(0, r.route.length - 1));
      g.ridingPassenger = true;
      g.playerPos.set(r.x, 0, r.z);
      useGame.getState().setRideRequest({ ...ride, status: "travelling", x: r.x, z: r.z, yaw: r.yaw });
      useGame.getState().radio(ride.service === "bike" ? "🏍️ Okada arrived. Oya, your trip has started!" : ride.service === "danfo" ? "🚌 Danfo arrived. Your trip has started." : ride.service === "keke" ? "🛺 Keke arrived. Your trip has started." : "🚘 Your driver has arrived. Trip started.");
    } else if (r.routeIndex < r.route.length - 1) {
      r.routeIndex += 1;
    } else {
      g.playerPos.set(ride.destination.x, 0, ride.destination.z);
      g.ridingPassenger = false;
      useGame.getState().setWaypoint(null);
      useGame.getState().setRideRequest(null);
      useGame.getState().radio("📍 Arrived at " + ride.destination.label + ". Safe journey — fare paid: ₦" + ride.fare.toLocaleString("en-NG") + ".");
      return;
    }
    group.position.set(r.x, 0, r.z);
    group.rotation.y = r.yaw;
    if (r.status === "travelling") g.playerPos.set(r.x, 0, r.z);
  });

  if (!ride) return null;
  const model = ride.service === "bike" ? "bike" : ride.service === "private" ? "sedan" : ride.service === "danfo" ? "danfo" : ride.service === "keke" ? "keke" : "taxi";
  return <group ref={ref} position={[ride.x, 0, ride.z]} rotation-y={ride.yaw}>
    <VehicleBody model={model} />
    {ride.status === "approaching" && <Html position={[0, 2.6, 0]} center distanceFactor={18}><div className="whitespace-nowrap rounded-full border border-emerald-300/40 bg-[#071c16]/90 px-2 py-1 text-[9px] font-bold text-emerald-100">{ride.service === "bike" ? "OKADA · DRIVER ARRIVING" : ride.service === "private" ? "PRIVATE DRIVER · ARRIVING" : ride.service === "danfo" ? "DANFO · ARRIVING" : ride.service === "keke" ? "KEKE · ARRIVING" : "TAXI · DRIVER ARRIVING"}</div></Html>}
  </group>;
}

export default function GameWorld() {
  const keys = useKeys();
  const playerGroup = useRef<THREE.Group>(null);
  const camLook = useRef(new THREE.Vector3(-14, 1, -14));
  const vehRefs = useRef(new Map<string, THREE.Group | null>());
  const timers = useRef({ prox: 0, clock: 0, save: 0, radio: 20, needs: 0 });
  const spawned = useGame((s) => s.spawnedVehicles);
  const city = useGame((s) => s.city);
  const isNewMap = city === "newmap";
  const waypoint = useGame((s) => s.waypoint);
  const activeJob = useGame((s) => s.activeJob);
  const [remotePlayers, setRemotePlayers] = useState<Record<string, { name: string; x: number; y: number; z: number; yaw: number; vehicle: string | null; outfit?: { gender?: "male" | "female"; skinTone?: string; top?: string; hairColor?: string } }>>({});
  useEffect(() => { useGame.getState().setOnlinePlayers(remotePlayers); }, [remotePlayers]);

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
        if (pinchDistance > 0) g.camDistance = THREE.MathUtils.clamp(g.camDistance - (distance - pinchDistance) * 0.055, 2.5, 500);
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
      g.camDistance = THREE.MathUtils.clamp(g.camDistance + event.deltaY * 0.06, 2.5, 500);
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
            const p = payload as { id?: string; name?: string; x?: number; y?: number; z?: number; yaw?: number; vehicle?: string | null; outfit?: { gender?: "male" | "female"; skinTone?: string; top?: string; hairColor?: string } };
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
              void channel.send({ type: "broadcast", event: "player_state", payload: { id: playerId, name: useGame.getState().name || "Hustler", x: g.playerPos.x, y: g.playerPos.y, z: g.playerPos.z, yaw: g.playerYaw, vehicle: v?.model ?? null, outfit: { ...useGame.getState().outfit } } });
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
          vx: 0, vz: 0, yaw: saved.rotY, speed: 0, color: "#c94a3c", fuel: saved.fuel ?? 100,
        });
      }
    }
  }, []);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const k = keys.current;
    const st = useGame.getState();
    const controlsBlocked = st.phoneOpen || st.stadiumMode || g.adminFrozen;
    if (controlsBlocked) { g.joy.x = 0; g.joy.y = 0; }
    const active = st.activeJob;
    if (active?.startedAt && active.timeLimitSeconds && Date.now() - active.startedAt >= active.timeLimitSeconds * 1000) {
      st.cancelJob();
      st.radio("⏱ Job timed out. Return to the job board and try another shift.");
    }
    const camera = state.camera as THREE.PerspectiveCamera;

    if (g.ridingPassenger) {
      g.playerSpeed = 0;
      st.setSpeed(0);
    } else if (g.drivingId) {
      const v = g.vehicles.get(g.drivingId);
      if (!v) {
        g.drivingId = null;
        st.setDriving(false);
      } else {
        const baseCat = VEHICLE_CATALOG[v.model] ?? VEHICLE_CATALOG["sedan"]!;
        const tuned = (st.inventory["engine-tune"] ?? 0) > 0;
        const cat = tuned ? { ...baseCat, maxSpeed: baseCat.maxSpeed * 1.2, accel: baseCat.accel * 1.15 } : baseCat;
        const kf = !controlsBlocked ? ((k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0)) : 0;
        const ks = !controlsBlocked ? ((k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) - (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0)) : 0;
        const forward = Math.max(-1, Math.min(1, kf - g.joy.y));
        const steer = Math.max(-1, Math.min(1, ks + g.joy.x));
        const brake = k.has("Space");

        const fdx = Math.sin(v.yaw), fdz = Math.cos(v.yaw);
        const rdx = Math.cos(v.yaw), rdz = -Math.sin(v.yaw);
        let vLong = v.vx * fdx + v.vz * fdz;
        let vLat = v.vx * rdx + v.vz * rdz;
        const fuelAvailable = v.fuel ?? 100;
        vLong += (fuelAvailable > 0 ? forward : 0) * cat.accel * dt;
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
        const targetDistrict = isNewMap ? null : districtAt(nx, nz);
        const districtOpen = !targetDistrict || (st.unlockedDistricts.includes(targetDistrict) && (targetDistrict !== "Eko Atlantic" || st.unlockedDistricts.includes("Lekki / Victoria Island")));
        const blocked = isNewMap ? isNewMapBlocked(nx, nz, 1.5) : isBlocked(nx, nz, 1.5);
        if (districtOpen && !blocked) {
          v.px = nx;
          v.pz = nz;
        } else {
          v.vx *= -0.15;
          v.vz *= -0.15;
        }
        const cw: [number, number] = isNewMap ? [THREE.MathUtils.clamp(v.px, NEW_MAP_BOUNDS.minX + 2, NEW_MAP_BOUNDS.maxX - 2), THREE.MathUtils.clamp(v.pz, NEW_MAP_BOUNDS.minZ + 2, NEW_MAP_BOUNDS.maxZ - 2)] : clampWorld(v.px, v.pz, 2);
        v.px = cw[0];
        v.pz = cw[1];
        v.fuel = Math.max(0, fuelAvailable - (Math.abs(vLong) > 1 ? dt * (0.05 + Math.abs(vLong) * 0.006) : 0));
        v.speed = Math.hypot(v.vx, v.vz);
        g.playerPos.set(v.px, 0, v.pz);
        g.playerYaw = v.yaw;
        st.setSpeed(v.speed * 3.6);
      }
    } else {
      const kf = !controlsBlocked ? ((k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0)) : 0;
      const ks = !controlsBlocked ? ((k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) - (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0)) : 0;
      const ix = ks + g.joy.x;
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
        const exhausted = st.needs.hunger < 20 || st.needs.energy < 15;
        const speed = g.adminFlying ? g.adminFlySpeed : (sprint ? 6.2 : 3.2) * (exhausted ? 0.6 : 1);
        const step = speed * dt;
        const nx = g.playerPos.x + dx * step;
        const nz = g.playerPos.z + dz * step;
        if (g.adminFlying) {
          g.playerPos.x = THREE.MathUtils.clamp(nx, -500, 500);
          g.playerPos.z = THREE.MathUtils.clamp(nz, -500, 500);
          if (k.has("Space")) g.adminFlyHeight = Math.min(180, g.adminFlyHeight + speed * dt);
          if (k.has("ControlLeft") || k.has("ControlRight")) g.adminFlyHeight = Math.max(0, g.adminFlyHeight - speed * dt);
        } else {
          const xDistrict = isNewMap ? null : districtAt(nx, g.playerPos.z);
          const xOpen = !xDistrict || (st.unlockedDistricts.includes(xDistrict) && (xDistrict !== "Eko Atlantic" || st.unlockedDistricts.includes("Lekki / Victoria Island")));
          const xBlocked = isNewMap ? isNewMapBlocked(nx, g.playerPos.z, 0.5) : isBlocked(nx, g.playerPos.z, 0.5);
          if (xOpen && !xBlocked) g.playerPos.x = nx;
          const zDistrict = isNewMap ? null : districtAt(g.playerPos.x, nz);
          const zOpen = !zDistrict || (st.unlockedDistricts.includes(zDistrict) && (zDistrict !== "Eko Atlantic" || st.unlockedDistricts.includes("Lekki / Victoria Island")));
          const zBlocked = isNewMap ? isNewMapBlocked(g.playerPos.x, nz, 0.5) : isBlocked(g.playerPos.x, nz, 0.5);
          if (zOpen && !zBlocked) g.playerPos.z = nz;
        }
        if (st.interior && !g.adminFlying) {
          // Keep the avatar inside the room boundaries while exploring an interior.
          g.playerPos.x = THREE.MathUtils.clamp(g.playerPos.x, 98.8, 109.2);
          g.playerPos.z = THREE.MathUtils.clamp(g.playerPos.z, 99.2, 108.5);
        } else {
          const cw: [number, number] = isNewMap ? [THREE.MathUtils.clamp(g.playerPos.x, NEW_MAP_BOUNDS.minX + 0.5, NEW_MAP_BOUNDS.maxX - 0.5), THREE.MathUtils.clamp(g.playerPos.z, NEW_MAP_BOUNDS.minZ + 0.5, NEW_MAP_BOUNDS.maxZ - 0.5)] : clampWorld(g.playerPos.x, g.playerPos.z, 0.5);
          g.playerPos.x = cw[0];
          g.playerPos.z = cw[1];
        }
        g.playerSpeed = mag * speed;
        g.playerYaw = Math.atan2(dx, dz);
      } else {
        g.playerSpeed = 0;
      }
      st.setSpeed(0);
    }

    const pg = playerGroup.current;
    if (pg) {
      pg.visible = !g.ridingPassenger && !st.stadiumMode && !g.adminInvisible;
      const renderScale = isNewMap && !st.stadiumMode ? NEW_MAP_SCALE : 1;
      const avatarHeight = g.adminFlying ? g.adminFlyHeight : g.adminLevitating ? 3.5 : 0;
      pg.position.set(g.playerPos.x * renderScale, avatarHeight * renderScale, g.playerPos.z * renderScale);
      pg.rotation.y = g.playerYaw;
    }

    // Stadium spectators use a true first-person camera; the player avatar stays hidden.
    // Zoom controls adjust field of view so players can take in more of the match on mobile.
    const driving = !!g.drivingId;
    const alpha = 1 - Math.exp(-5 * dt);
    if (st.stadiumMode) {
      const yaw = g.playerYaw + g.camYaw;
      _ideal.set(g.playerPos.x, 1.62, g.playerPos.z);
      camera.position.lerp(_ideal, alpha);
      _target.set(
        g.playerPos.x + Math.sin(yaw) * 60 * Math.cos(g.camPitch),
        1.62 - Math.sin(g.camPitch) * 60,
        g.playerPos.z + Math.cos(yaw) * 60 * Math.cos(g.camPitch)
      );
      camLook.current.lerp(_target, alpha);
      camera.lookAt(camLook.current);
      const targetFov = THREE.MathUtils.clamp(42 + g.camDistance * 0.34, 44, 76);
      camera.fov += (targetFov - camera.fov) * Math.min(1, 5 * dt);
      camera.updateProjectionMatrix();
    } else {
      _target.set(g.playerPos.x * (isNewMap ? NEW_MAP_SCALE : 1), driving ? 1.5 : 1.1, g.playerPos.z * (isNewMap ? NEW_MAP_SCALE : 1));
      const worldScale = isNewMap ? NEW_MAP_SCALE : 1;
      const requestedDist = driving ? Math.max(10, g.camDistance * 1.45) : g.camDistance;
      const dist = isNewMap ? Math.max(2.5, requestedDist * worldScale) : requestedDist;
      const pitch = driving ? Math.min(g.camPitch, 0.85) : g.camPitch;
      _ideal.set(
        _target.x + Math.sin(g.camYaw) * dist * Math.cos(pitch),
        _target.y + Math.sin(pitch) * dist,
        _target.z + Math.cos(g.camYaw) * dist * Math.cos(pitch)
      );
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
    }

    // Low-frequency housekeeping
    const T = timers.current;
    T.prox += dt;
    T.clock += dt;
    T.save += dt;
    T.radio += dt;
    T.needs += dt;
    if (T.needs >= 1) { st.tickNeeds(T.needs); T.needs = 0; }
    if (T.prox > 0.15) {
      T.prox = 0;
      proximityTick(st);
    }
    if (T.clock > 1) {
      T.clock = 0;
      st.setClock(g.time);
      const activeVehicle = g.drivingId ? g.vehicles.get(g.drivingId) : null;
      st.setFuelLevel(activeVehicle?.fuel ?? 100);
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
      <group ref={playerGroup} position={[-14, 0, -14]} scale={isNewMap ? 0.45 : 1}>
        <CharacterBody />
      </group>
      <InteriorWorld />
      {Object.entries(remotePlayers).map(([id, player], index) => (
        <RemotePlayerAvatar key={id} player={player} variant={index + 1} worldScale={isNewMap ? NEW_MAP_SCALE : 1} />
      ))}
      {!isNewMap && VEHICLE_SPAWNS.map((v) => (
        <ParkedVehicle key={v.id} id={v.id} model={v.model} register={register} />
      ))}
      {spawned.map((v) => (
        <ParkedVehicle key={v.id} id={v.id} model={v.model} register={register} scale={isNewMap ? NEW_MAP_SCALE : 1} />
      ))}
      {g.adminSpawnedNpcs.map((npc) => (
        <group key={npc.id} position={[npc.x * (isNewMap ? NEW_MAP_SCALE : 1), 0, npc.z * (isNewMap ? NEW_MAP_SCALE : 1)]}>
          <mesh position={[0, 0.95, 0]} castShadow><capsuleGeometry args={[0.28, 0.9, 4, 8]} /><meshStandardMaterial color="#d4a72c" roughness={0.8} /></mesh>
          <mesh position={[0, 1.72, 0]} castShadow><sphereGeometry args={[0.23, 12, 12]} /><meshStandardMaterial color="#8a5a3c" roughness={0.8} /></mesh>
          <Html position={[0, 2.2, 0]} center distanceFactor={15}><div className="whitespace-nowrap rounded-md border border-amber-300/40 bg-black/80 px-2 py-1 text-[10px] font-semibold text-amber-100">{npc.name}</div></Html>
        </group>
      ))}
      {!isNewMap && <Traffic />}
      {!isNewMap && <Pedestrians />}
      {!isNewMap && <JobMarker />}
      {!isNewMap && <JobPickupVisual job={activeJob} />}
      <GpsRoute waypoint={waypoint} isNewMap={isNewMap} worldScale={isNewMap ? NEW_MAP_SCALE : 1} />
      <RideDriver />
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

  if (s2.waypoint?.kind === "enter-building" && Math.hypot(x - s2.waypoint.x, z - s2.waypoint.z) < 2.4) {
    const target = getMapPlaces(s2.city).find(place => place.label === s2.waypoint?.label);
    const label = s2.waypoint.label;
    const kind = target?.kind ?? s2.waypoint.kind;
    s2.setWaypoint(null);
    enterBuilding(label, kind);
    s2.closePhone();
    return;
  }
  if (s2.interior) {
    const def = getInteriorDefinition(s2.interiorLabel, s2.interiorKind);
    const hotspot = def.hotspots.find(h => Math.hypot(x - (104 + h.x), z - (104 + h.z)) < 1.8);
    st.setPrompt(hotspot ? { kind: "interior-hotspot", label: "E / Interact · " + hotspot.label, hotspotId: hotspot.id } : null);
    return;
  }

  const nearbyStall = STALLS.find((stall) => Math.hypot(x - stall.x, z - stall.z) < 3.0);
  if (nearbyStall) { st.setPrompt({ kind: "vendor", label: "Browse street vendor" }); return; }

  let nearest: ReturnType<typeof getMapPlaces>[number] | null = null;
  let nearestDistance = 3.0;
  // Use the active city's canonical door coordinates so NEW MAP and Umuahia prompts
  // never fall back to unrelated Lagos building coordinates.
  for (const building of getMapPlaces(s2.city)) {
    if (!building.label) continue;
    const distance = Math.hypot(x - building.doorX, z - building.doorZ);
    if (distance < nearestDistance) { nearest = building; nearestDistance = distance; }
  }
  if (nearest) {
    st.setPrompt({ kind: "building", label: "Enter " + nearest.label, buildingLabel: nearest.label, buildingKind: nearest.kind ?? "building" });
    return;
  }

  const poi = nearestPoi(x, z, 3.0);
  if (poi) {
    if (poi.kind === "atm") st.setPrompt({ kind: "atm", label: "Use ATM" });
    else if (poi.kind === "bank") st.setPrompt(useGame.getState().city === "newmap" ? { kind: "building", label: "Enter Community Bank", buildingLabel: poi.label } : { kind: "atm", label: "Enter Bank / Use ATM" });
    else if (poi.kind === "dealership") st.setPrompt({ kind: "dealer", label: "Browse Ojoto Motors" });
    else if (poi.kind === "apartments") st.setPrompt({ kind: "home", label: useGame.getState().city === "newmap" ? "Enter " + poi.label : "Enter home" });
    else if (poi.kind === "clothing") st.setPrompt({ kind: "wardrobe", label: "Open Lagos Boutique" });
    else if (poi.kind === "food") st.setPrompt({ kind: "food", label: "Order at " + poi.label });
    else if (poi.kind === "fuel") st.setPrompt({ kind: "fuel", label: "Use " + poi.label });
    else if (poi.kind === "jobboard") st.setPrompt({ kind: "jobboard", label: "Browse City Job Board" });
    else if (poi.kind === "police") st.setPrompt({ kind: "police", label: "Clock in at Police HQ" });
    else if (poi.kind === "market" || poi.kind === "depot" || poi.kind === "airport" || poi.kind === "hospital" || poi.kind === "pharmacy" || poi.kind === "school" || poi.kind === "university" || poi.kind === "real-estate" || poi.kind === "shop" || poi.kind === "stadium" || poi.kind === "port" || poi.kind === "lake") st.setPrompt({ kind: "building", label: "Enter " + poi.label, buildingLabel: poi.label });
    else {
      st.setPrompt(null);
      return;
    }
    return;
  }

  st.setPrompt(null);
}

useGLTF.preload("/models/character.glb");
// Danfo and keke vehicles are procedural meshes; only preload the GLBs actually rendered by VehicleBody.\nfor (const m of ["sedan", "sports", "taxi", "suv", "police"]) useGLTF.preload(`/models/${m}.glb`);
