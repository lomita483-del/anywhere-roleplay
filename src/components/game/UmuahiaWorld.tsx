import { useMemo } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { BUILDINGS, WORLD, ROADS_X, ROADS_Z, ROAD_HALF, SIDEWALK } from "@/game/city";
import { groundTexture, asphaltTexture, sidewalkTexture } from "@/game/textures";

function UmuahiaBuilding({ b }: { b: (typeof BUILDINGS)[number] }) {
  const windowRows = Math.max(1, Math.floor((b.h - 1.5) / 3));
  const windowCols = Math.max(2, Math.floor((b.w - 2) / 3.2));
  const isCivic = b.kind === "civic";
  return <group position={[b.x, 0, b.z]}>
    <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[b.w, b.h, b.d]} />
      <meshStandardMaterial color={b.color} roughness={0.88} />
    </mesh>
    <mesh position={[0, b.h + 0.12, 0]} castShadow>
      <boxGeometry args={[b.w + 0.5, 0.24, b.d + 0.5]} />
      <meshStandardMaterial color={b.h < 7 ? "#8b5540" : "#777a75"} roughness={0.9} />
    </mesh>
    {Array.from({ length: windowRows }, (_, row) => Array.from({ length: windowCols }, (_, col) => {
      const x = -b.w / 2 + 1.4 + col * ((b.w - 2.8) / Math.max(1, windowCols - 1));
      const y = 1.7 + row * 3;
      return <group key={row + ":" + col}>
        <mesh position={[x, y, b.d / 2 + 0.025]}>
          <boxGeometry args={[0.9, 1.05, 0.06]} />
          <meshStandardMaterial color="#477080" metalness={0.18} roughness={0.32} />
        </mesh>
        <mesh position={[x, y, -b.d / 2 - 0.025]} rotation-y={Math.PI}>
          <boxGeometry args={[0.9, 1.05, 0.06]} />
          <meshStandardMaterial color="#477080" metalness={0.18} roughness={0.32} />
        </mesh>
      </group>;
    }))}
    {b.h >= 8 && [-1, 1].map((side) => <mesh key={side} position={[side * (b.w / 2 + 0.035), Math.min(b.h * 0.5, 4), 0]} rotation-y={Math.PI / 2}>
      <planeGeometry args={[b.d * 0.68, 1.15]} />
      <meshStandardMaterial color="#527785" roughness={0.35} />
    </mesh>)}
    <mesh position={[0, 1.05, b.d / 2 + 0.045]}>
      <boxGeometry args={[1.05, 2.1, 0.09]} />
      <meshStandardMaterial color="#493629" roughness={0.92} />
    </mesh>
    {b.label && <group>
      <mesh position={[0, Math.min(b.h - 0.7, Math.max(2.4, b.h * 0.72)), b.d / 2 + 0.08]}>
        <boxGeometry args={[Math.min(b.w * 0.9, 14), 0.8, 0.14]} />
        <meshStandardMaterial color={isCivic ? "#163d35" : b.kind === "market" ? "#8d3e27" : "#263642"} roughness={0.65} />
      </mesh>
      <Html position={[0, Math.min(b.h - 0.7, Math.max(2.4, b.h * 0.72)), b.d / 2 + 0.17]} center distanceFactor={19} style={{ pointerEvents: "none" }}>
        <div className="max-w-[180px] whitespace-nowrap border border-amber-200/45 bg-[#10231f]/95 px-2 py-1 text-center text-[9px] font-black tracking-wide text-amber-50 shadow-lg">{b.label}</div>
      </Html>
      <Html position={[0, b.h + 1.1, b.d / 2 + 0.25]} center distanceFactor={25} style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap rounded bg-slate-950/80 px-2 py-1 text-[10px] font-bold text-white">{b.label}</div>
      </Html>
    </group>}
    {b.kind === "civic" && <mesh position={[0, 0.65, b.d / 2 + 1.8]} castShadow>
      <boxGeometry args={[b.w * 0.85, 1.3, 0.18]} />
      <meshStandardMaterial color="#d2c6a9" roughness={0.95} />
    </mesh>}
  </group>;
}

function Roundabout() {
  return <group position={[0, 0.035, 0]}>
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <circleGeometry args={[14.5, 48]} />
      <meshStandardMaterial color="#a6a394" roughness={0.9} />
    </mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.025, 0]}>
      <ringGeometry args={[10.5, 12.5, 48]} />
      <meshStandardMaterial color="#e6d9b6" roughness={0.8} />
    </mesh>
    <mesh position={[0, 0.55, 0]} castShadow>
      <cylinderGeometry args={[6.7, 7.4, 1.1, 32]} />
      <meshStandardMaterial color="#497c45" roughness={1} />
    </mesh>
    <mesh position={[0, 1.18, 0]} castShadow>
      <cylinderGeometry args={[0.5, 0.75, 1.25, 12]} />
      <meshStandardMaterial color="#d0b36a" metalness={0.3} roughness={0.42} />
    </mesh>
    <mesh position={[0, 2.25, 0]} castShadow>
      <sphereGeometry args={[0.65, 16, 12]} />
      <meshStandardMaterial color="#e8d5a1" metalness={0.28} roughness={0.3} />
    </mesh>
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return <group key={i} position={[Math.cos(a) * 5.4, 0, Math.sin(a) * 5.4]}>
        <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.12, 0.18, 0.9, 7]} /><meshStandardMaterial color="#705239" /></mesh>
        <mesh position={[0, 1.15, 0]}><sphereGeometry args={[0.65, 8, 7]} /><meshStandardMaterial color="#3f7a45" roughness={1} /></mesh>
      </group>;
    })}
    <Html position={[0, 4, 8]} center distanceFactor={22}>
      <div className="whitespace-nowrap rounded-md border border-amber-300/60 bg-[#10271f]/95 px-3 py-1.5 text-[11px] font-black tracking-widest text-amber-100 shadow-xl">NNAMDI AZIKIWE ROUNDABOUT</div>
    </Html>
  </group>;
}

function RoadSigns() {
  const signs = [
    { x: -5, z: -146, text: "UMUDIKE / MOUAU →", rot: 0 },
    { x: -146, z: -6, text: "← IBEKU", rot: Math.PI / 2 },
    { x: 146, z: -5, text: "ISIALA NGWA NORTH →", rot: -Math.PI / 2 },
    { x: 5, z: 146, text: "OHUHU →", rot: Math.PI },
  ];
  return <group>{signs.map((s) => <group key={s.text} position={[s.x, 0, s.z]} rotation-y={s.rot}>
    <mesh position={[0, 3.2, 0]}><boxGeometry args={[8, 1.15, 0.18]} /><meshStandardMaterial color="#174c3a" roughness={0.65} /></mesh>
    <Html position={[0, 3.2, 0.12]} center distanceFactor={25}><div className="whitespace-nowrap border border-white/20 bg-[#174c3a] px-2 py-1 text-[9px] font-black text-white">{s.text}</div></Html>
    <mesh position={[0, 1.55, 0]}><cylinderGeometry args={[0.08, 0.1, 3.1, 6]} /><meshStandardMaterial color="#a4a8a4" metalness={0.3} /></mesh>
  </group>)}</group>;
}

export default function UmuahiaWorld() {
  const ground = useMemo(groundTexture, []);
  const asphalt = useMemo(asphaltTexture, []);
  const sidewalk = useMemo(sidewalkTexture, []);
  return <group>
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[WORLD, WORLD]} />
      <meshStandardMaterial map={ground} roughness={1} />
    </mesh>
    {ROADS_X.map((x) => <group key={"xroad" + x}>
      <mesh rotation-x={-Math.PI / 2} position={[x, 0.012, 0]} receiveShadow>
        <planeGeometry args={[ROAD_HALF * 2 + SIDEWALK * 2, WORLD]} />
        <meshStandardMaterial map={sidewalk} roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[x, 0.027, 0]} receiveShadow>
        <planeGeometry args={[ROAD_HALF * 2, WORLD]} />
        <meshStandardMaterial map={asphalt} roughness={0.94} />
      </mesh>
    </group>)}
    {ROADS_Z.map((z) => <group key={"zroad" + z}>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.014, z]} receiveShadow>
        <planeGeometry args={[ROAD_HALF * 2 + SIDEWALK * 2, WORLD]} />
        <meshStandardMaterial map={sidewalk} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.03, z]} receiveShadow>
        <planeGeometry args={[ROAD_HALF * 2, WORLD]} />
        <meshStandardMaterial map={asphalt} roughness={0.94} />
      </mesh>
    </group>)}
    {/* Road centre dashes, edge lines and crosswalks at each junction. */}
    {ROADS_X.map((x) => Array.from({ length: 32 }, (_, i) => <mesh key={x + "dash" + i} rotation-x={-Math.PI / 2} position={[x, 0.05, -166 + i * 10.5]}>
      <planeGeometry args={[0.13, 4.2]} /><meshBasicMaterial color="#e8d9a7" />
    </mesh>))}
    {ROADS_Z.map((z) => Array.from({ length: 32 }, (_, i) => <mesh key={z + "dash" + i} rotation-x={-Math.PI / 2} position={[-166 + i * 10.5, 0.05, z]}>
      <planeGeometry args={[4.2, 0.13]} /><meshBasicMaterial color="#e8d9a7" />
    </mesh>))}
    {ROADS_X.flatMap((x) => ROADS_Z.map((z) => <group key={"cross" + x + ":" + z}>
      {Array.from({ length: 5 }, (_, i) => <mesh key={i} rotation-x={-Math.PI / 2} position={[x - 5 + i * 2.5, 0.052, z - 8.8]}>
        <planeGeometry args={[1.4, 2]} /><meshBasicMaterial color="#f1eee4" />
      </mesh>)}
      {Array.from({ length: 5 }, (_, i) => <mesh key={"b" + i} rotation-x={-Math.PI / 2} position={[x - 5 + i * 2.5, 0.052, z + 8.8]}>
        <planeGeometry args={[1.4, 2]} /><meshBasicMaterial color="#f1eee4" />
      </mesh>)}
    </group>))}
    {/* Small river and bridge at the northern edge, without implying survey accuracy. */}
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, -169]} receiveShadow>
      <planeGeometry args={[WORLD, 10]} /><meshStandardMaterial color="#287fa1" roughness={0.28} metalness={0.12} />
    </mesh>
    <mesh position={[0, 0.35, -169]} receiveShadow>
      <boxGeometry args={[26, 0.55, 12]} /><meshStandardMaterial color="#a7aaa7" roughness={0.8} />
    </mesh>
    {[-11, 11].map((x) => <mesh key={x} position={[x, -0.8, -169]}><boxGeometry args={[0.7, 2.4, 10]} /><meshStandardMaterial color="#727c7e" /></mesh>)}
    <Html position={[0, 2, -158]} center distanceFactor={30}><div className="rounded bg-[#0e2c37]/90 px-3 py-1 text-[10px] font-black tracking-widest text-cyan-100">RIVER CROSSING</div></Html>
    <Roundabout />
    {BUILDINGS.map((b, i) => <UmuahiaBuilding key={(b.label ?? "building") + i} b={b} />)}
    {/* Market canopy row and covered loading bays. */}
    {Array.from({ length: 7 }, (_, i) => <group key={"stall" + i} position={[-61 + i * 6, 0, -26]}>
      <mesh position={[0, 1.2, 0]} castShadow><boxGeometry args={[4.8, 2.4, 3.5]} /><meshStandardMaterial color={["#bd493c", "#2e8054", "#d5a333", "#356fa5"][i % 4]} roughness={0.92} /></mesh>
      <mesh position={[0, 2.55, 0]} castShadow><boxGeometry args={[5.3, 0.25, 4]} /><meshStandardMaterial color={["#d8a14b", "#8c3e31", "#33744d"][i % 3]} roughness={0.8} /></mesh>
    </group>)}
    {/* Trees, streetlights and compound walls are placed in verges, not lanes. */}
    {Array.from({ length: 48 }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      const road = ROADS_X[Math.floor(i / 6) % ROADS_X.length]!;
      const z = -158 + (i % 6) * 58;
      const x = road + side * (ROAD_HALF + SIDEWALK + 4);
      return <group key={"tree" + i} position={[x, 0, z]}>
        <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[0.16, 0.24, 3, 6]} /><meshStandardMaterial color="#73533a" /></mesh>
        <mesh position={[0, 3.6, 0]} castShadow><sphereGeometry args={[1.35, 8, 7]} /><meshStandardMaterial color={i % 3 ? "#39774a" : "#4b8651"} roughness={1} /></mesh>
      </group>;
    })}
    {Array.from({ length: 30 }, (_, i) => {
      const road = ROADS_Z[Math.floor(i / 6) % ROADS_Z.length]!;
      const x = -158 + (i % 6) * 58;
      return <group key={"lamp" + i} position={[x, 0, road + (i % 2 ? 11 : -11)]}>
        <mesh position={[0, 3, 0]}><cylinderGeometry args={[0.07, 0.11, 6, 6]} /><meshStandardMaterial color="#525a5c" metalness={0.35} /></mesh>
        <mesh position={[0.45, 5.85, 0]} rotation-z={-0.18}><boxGeometry args={[1, 0.1, 0.1]} /><meshStandardMaterial color="#525a5c" /></mesh>
        <mesh position={[0.85, 5.8, 0]}><boxGeometry args={[0.32, 0.15, 0.28]} /><meshStandardMaterial color="#ffe4a0" emissive="#ffca63" emissiveIntensity={0.45} /></mesh>
      </group>;
    })}
    <RoadSigns />
    <Html position={[0, 12, 0]} center distanceFactor={60}>
      <div className="pointer-events-none rounded-xl border border-amber-200/50 bg-[#0d211d]/90 px-5 py-3 text-center shadow-2xl">
        <div className="text-[22px] font-black tracking-[0.16em] text-amber-100">UMUAHIA</div>
        <div className="text-[10px] font-semibold tracking-[0.2em] text-white">ABIA STATE · NIGERIA</div>
      </div>
    </Html>
  </group>;
}
