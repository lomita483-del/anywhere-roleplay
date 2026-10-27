import { useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  BUILDINGS, ROADS_X, ROADS_Z, ROAD_HALF, WORLD, STALLS, LOT_CARS, POIS,
  lampPositions, treePositions,
} from "@/game/city";
import { asphaltTexture, sidewalkTexture, groundTexture, facadeTexture, signTexture } from "@/game/textures";
import { g } from "@/game/state";

const SIGN_SIDES: Record<string, { dx: number; dz: number; ry: number }> = {
  bank: { dx: 1, dz: 0, ry: Math.PI / 2 },
  police: { dx: 0, dz: -1, ry: 0 },
  dealership: { dx: 0, dz: -1, ry: 0 },
  market: { dx: 0, dz: -1, ry: 0 },
  apartments: { dx: 0, dz: -1, ry: 0 },
  depot: { dx: 0, dz: -1, ry: 0 },
  clothing: { dx: 0, dz: -1, ry: 0 },
  airport: { dx: 0, dz: -1, ry: 0 },
};

function Building({ b }: { b: (typeof BUILDINGS)[number] }) {
  const facade = useMemo(() => facadeTexture("#ffffff", false), []);
  useMemo(() => facade.repeat.set(Math.max(1, Math.round(b.w / 4)), Math.max(1, Math.round(b.h / 4))), [facade, b.w, b.h]);

  const side = b.kind ? SIGN_SIDES[b.kind] : null;
  const sign = useMemo(() => (b.label ? signTexture(b.label, b.kind === "dealership" ? "#b98a1f" : b.kind === "police" ? "#2c4a7c" : b.kind === "bank" ? "#1f6b4a" : "#8a4a2a") : null), [b.label, b.kind]);

  return (
    <group position={[b.x, 0, b.z]}>
      <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[b.w, b.h, b.d]} />
        <meshStandardMaterial map={facade} color={b.color} roughness={0.9} />
      </mesh>
      <mesh position={[0, b.h + 0.15, 0]}>
        <boxGeometry args={[b.w + 0.5, 0.4, b.d + 0.5]} />
        <meshStandardMaterial color="#5a5248" roughness={1} />
      </mesh>
      {sign && side && (
        <mesh
          position={[side.dx * (b.w / 2 + 0.12), Math.min(b.h - 1.6, b.h * 0.62), side.dz * (b.d / 2 + 0.12)]}
          rotation-y={side.ry}
        >
          <planeGeometry args={[Math.min(b.w * 0.9, 12), Math.min(b.w * 0.9, 12) * 0.25]} />
          <meshStandardMaterial map={sign} roughness={0.6} emissive="#ffffff" emissiveMap={sign} emissiveIntensity={0.25} />
        </mesh>
      )}
      {/* Door hint on the front face */}
      {side && (
        <mesh position={[side.dx * (b.w / 2 + 0.06), 1.4, side.dz * (b.d / 2 + 0.06)]} rotation-y={side.ry}>
          <planeGeometry args={[2.2, 2.8]} />
          <meshStandardMaterial color="#3a2f26" roughness={0.8} />
        </mesh>
      )}
      {b.h >= 8 && Array.from({ length: Math.max(1, Math.floor((b.h - 2.5) / 3.2)) }, (_, floor) => {
        const y = 2.2 + floor * 3.2;
        const count = Math.max(2, Math.floor((b.w - 2) / 3.1));
        return Array.from({ length: count }, (_, n) => {
          const x = -b.w / 2 + 1.5 + n * ((b.w - 3) / Math.max(1, count - 1));
          return (
            <group key={floor + ":" + n}>
              <mesh position={[x, y, b.d / 2 + 0.035]} castShadow><boxGeometry args={[1.05, 1.25, 0.08]} /><meshStandardMaterial color="#243846" metalness={0.35} roughness={0.28} emissive="#89b5c4" emissiveIntensity={0.06} /></mesh>
              <mesh position={[x, y, -b.d / 2 - 0.035]} rotation-y={Math.PI}><boxGeometry args={[1.05, 1.25, 0.08]} /><meshStandardMaterial color="#243846" metalness={0.35} roughness={0.28} /></mesh>
            </group>
          );
        });
      })}
      {b.h >= 14 && (
        <group position={[b.w * 0.24, b.h + 0.55, -b.d * 0.2]}>
          <mesh position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.85, 0.85, 1.8, 12]} /><meshStandardMaterial color="#aeb9b8" metalness={0.25} roughness={0.55} /></mesh>
          <mesh position={[0, 1.82, 0]}><cylinderGeometry args={[0.9, 0.9, 0.12, 12]} /><meshStandardMaterial color="#677879" metalness={0.35} roughness={0.5} /></mesh>
        </group>
      )}
    </group>
  );
}

function Lamps() {
  const lamps = useMemo(lampPositions, []);
  const headMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (headMat.current) {
      const elev = Math.sin(((g.time - 6) / 24) * Math.PI * 2);
      headMat.current.emissiveIntensity = elev < 0.1 ? 2.4 : 0;
    }
  });

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const setInstances = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    lamps.forEach(([x, z], i) => {
      dummy.position.set(x, 0, z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };

  return (
    <group>
      <instancedMesh ref={setInstances} args={[undefined, undefined, lamps.length]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 6, 6]} />
        <meshStandardMaterial color="#4a4f58" roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={setInstances} args={[undefined, undefined, lamps.length]}>
        <boxGeometry args={[0.7, 0.25, 0.35]} />
        <meshStandardMaterial ref={headMat} color="#ffe9b0" emissive="#ffd257" emissiveIntensity={0} />
      </instancedMesh>
    </group>
  );
}


function Trees() {
  const trees = useMemo(treePositions, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const setInstances = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    trees.forEach(([x, z], i) => {
      dummy.position.set(x, 0, z);
      dummy.scale.setScalar(0.8 + ((i * 37) % 10) / 20);
      dummy.rotation.y = i * 1.7;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  return (
    <group>
      <instancedMesh ref={setInstances} args={[undefined, undefined, trees.length]} castShadow>
        <cylinderGeometry args={[0.22, 0.3, 2.2, 6]} />
        <meshStandardMaterial color="#6b4a2a" flatShading roughness={1} />
      </instancedMesh>
      <instancedMesh ref={setInstances} args={[undefined, undefined, trees.length]} castShadow>
        <icosahedronGeometry args={[1.9, 0]} />
        <meshStandardMaterial color="#3f7d4e" flatShading roughness={1} />
      </instancedMesh>
    </group>
  );
}

function Stall({ s }: { s: (typeof STALLS)[number] }) {
  return (
    <group position={[s.x, 0, s.z]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[3.4, 0.3, 2]} />
        <meshStandardMaterial color="#8a6a4a" roughness={1} />
      </mesh>
      <mesh position={[0, 2.4, 0]} rotation-x={-0.12} castShadow>
        <boxGeometry args={[3.8, 0.12, 2.6]} />
        <meshStandardMaterial color={s.color} roughness={0.9} />
      </mesh>
      {[-1.7, 1.7].map((px, i) => (
        <mesh key={i} position={[px, 1.6, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 3.2, 5]} />
          <meshStandardMaterial color="#6a5a44" />
        </mesh>
      ))}
      {[-0.6, 0, 0.6].map((px, i) => (
        <mesh key={"c" + i} position={[px, 1.05, 0.3]} castShadow>
          <boxGeometry args={[0.5, 0.45, 0.9]} />
          <meshStandardMaterial color={["#e2574c", "#e2a13c", "#3fa37a"][i] ?? "#e2574c"} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Atm({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[0.9, 2, 0.6]} />
        <meshStandardMaterial color="#2c4a5c" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.5, 0.32]}>
        <planeGeometry args={[0.6, 0.4]} />
        <meshStandardMaterial color="#9fe8c8" emissive="#59d6a2" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

const STREET_SIGNS = [
  { x: -11, z: -19, label: "VICTORIA ISLAND" },
  { x: 12, z: 12, label: "LEKKI  •  MAINLAND" },
  { x: 67, z: 12, label: "BALOGUN MARKET" },
];
const BILLBOARDS = [
  { x: 13, z: -20, label: "LAGOS LIFE  •  LIVE YOUR STORY", color: "#17392f" },
  { x: -14, z: 18, label: "OJOTO MOTORS  •  DRIVE YOUR DREAM", color: "#7b5419" },
  { x: 67, z: 36, label: "YOUR HUSTLE. YOUR CITY.", color: "#1d3d54" },
];

function LagosStreetProps() {
  const signs = useMemo(() => STREET_SIGNS.map((s) => ({ ...s, texture: signTexture(s.label, "#174c3a") })), []);
  const boards = useMemo(() => BILLBOARDS.map((b) => ({ ...b, texture: signTexture(b.label, b.color) })), []);
  return (
    <group>
      {signs.map((s) => (
        <group key={s.label} position={[s.x, 0, s.z]}>
          <mesh position={[0, 1.45, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.075, 2.9, 6]} />
            <meshStandardMaterial color="#8a9299" metalness={0.6} roughness={0.45} />
          </mesh>
          <mesh position={[0.65, 2.45, 0]}>
            <boxGeometry args={[1.35, 0.48, 0.12]} />
            <meshStandardMaterial color="#175b3d" roughness={0.7} />
          </mesh>
          <mesh position={[0.65, 2.45, 0.075]}>
            <planeGeometry args={[1.22, 0.35]} />
            <meshStandardMaterial map={s.texture} emissive="#ffffff" emissiveMap={s.texture} emissiveIntensity={0.15} />
          </mesh>
        </group>
      ))}
      {boards.map((b) => (
        <group key={b.label} position={[b.x, 0, b.z]} rotation-y={-0.18}>
          <mesh position={[0, 2.6, 0]} castShadow>
            <boxGeometry args={[6.4, 2.5, 0.22]} />
            <meshStandardMaterial color={b.color} metalness={0.25} roughness={0.55} />
          </mesh>
          <mesh position={[0, 2.6, 0.13]}>
            <planeGeometry args={[6.05, 2.15]} />
            <meshStandardMaterial map={b.texture} emissive="#ffffff" emissiveMap={b.texture} emissiveIntensity={0.22} />
          </mesh>
          {[-2.3, 2.3].map((x) => (
            <mesh key={x} position={[x, 0.95, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.16, 1.9, 6]} />
              <meshStandardMaterial color="#555d66" metalness={0.55} roughness={0.55} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function RoadMarkings() {
  const dashes = useMemo(() => {
    const items: { x: number; z: number; horizontal: boolean }[] = [];
    for (const x of ROADS_X) for (let z = -112; z <= 112; z += 15) items.push({ x, z, horizontal: false });
    for (const z of ROADS_Z) for (let x = -112; x <= 112; x += 15) items.push({ x, z, horizontal: true });
    return items;
  }, []);
  return (
    <group>
      {dashes.map((d, i) => <mesh key={"dash" + i} rotation-x={-Math.PI / 2} position={[d.x, 0.052, d.z]}><planeGeometry args={d.horizontal ? [7, 0.12] : [0.12, 7]} /><meshBasicMaterial color="#e7c85d" /></mesh>)}
      {ROADS_X.flatMap((x) => ROADS_Z.map((z) => (
        <group key={x + ":" + z}>
          {Array.from({ length: 6 }, (_, n) => <mesh key={n} rotation-x={-Math.PI / 2} position={[x - 5 + n * 2, 0.055, z - 5.8]}><planeGeometry args={[1.15, 1.8]} /><meshBasicMaterial color="#e6e4dc" /></mesh>)}
          {Array.from({ length: 6 }, (_, n) => <mesh key={"b" + n} rotation-x={-Math.PI / 2} position={[x - 5 + n * 2, 0.055, z + 5.8]}><planeGeometry args={[1.15, 1.8]} /><meshBasicMaterial color="#e6e4dc" /></mesh>)}
        </group>
      )))}
    </group>
  );
}

function AirportDistrict() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[51, 0.035, -96]} receiveShadow><planeGeometry args={[54, 10]} /><meshStandardMaterial color="#353b43" roughness={0.92} /></mesh>
      {[-100, -96, -92].map((z) => <mesh key={z} rotation-x={-Math.PI / 2} position={[51, 0.052, z]}><planeGeometry args={[50, 0.16]} /><meshBasicMaterial color="#f4f0dc" /></mesh>)}
      <mesh position={[53, 0.72, -96]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.52, 0.62, 13, 12]} /><meshStandardMaterial color="#e5e7e9" metalness={0.25} roughness={0.4} /></mesh>
      <mesh position={[53, 0.82, -96]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.2, 0.25, 14, 10]} /><meshStandardMaterial color="#2e6b91" metalness={0.3} roughness={0.35} /></mesh>
      <mesh position={[53, 0.62, -96]} castShadow><boxGeometry args={[3.5, 0.16, 14]} /><meshStandardMaterial color="#e5e7e9" metalness={0.25} roughness={0.4} /></mesh>
      <mesh position={[58.5, 0.75, -96]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.22, 0.3, 2.1, 10]} /><meshStandardMaterial color="#e5e7e9" /></mesh>
      <mesh position={[47.5, 0.78, -96]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.22, 0.3, 2.1, 10]} /><meshStandardMaterial color="#e5e7e9" /></mesh>
      <mesh position={[47, 0.85, -96]} castShadow><boxGeometry args={[2.5, 0.12, 5]} /><meshStandardMaterial color="#e5e7e9" /></mesh>
      <mesh position={[59, 0.85, -96]} castShadow><boxGeometry args={[2.5, 0.12, 5]} /><meshStandardMaterial color="#e5e7e9" /></mesh>
      <mesh position={[51, 1.5, -96]} castShadow><boxGeometry args={[1.8, 1.6, 1.7]} /><meshStandardMaterial color="#e5e7e9" roughness={0.45} /></mesh>
      <Html position={[91, 8.5, -96]} center distanceFactor={28}><div className="whitespace-nowrap rounded-lg border border-white/20 bg-[#0c1720]/85 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white">MURTALA MUHAMMED INT'L AIRPORT</div></Html>
    </group>
  );
}

function ConstructionSite() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[86, 0.018, 78]} receiveShadow><planeGeometry args={[28, 24]} /><meshStandardMaterial color="#8c826b" roughness={1} /></mesh>
      {Array.from({ length: 5 }, (_, i) => <mesh key={"foundation" + i} position={[78 + i * 4, 0.18, 77]}><boxGeometry args={[3.5, 0.35, 18]} /><meshStandardMaterial color="#a9a69b" roughness={0.95} /></mesh>)}
      {/* Tower crane */}
      <group position={[91, 0, 78]}>
        <mesh position={[0, 7, 0]} castShadow><boxGeometry args={[0.55, 14, 0.55]} /><meshStandardMaterial color="#eab308" metalness={0.3} roughness={0.6} /></mesh>
        <mesh position={[4, 13.7, 0]} castShadow><boxGeometry args={[15, 0.35, 0.38]} /><meshStandardMaterial color="#eab308" metalness={0.3} roughness={0.6} /></mesh>
        <mesh position={[-3.8, 13.2, 0]} castShadow><boxGeometry args={[5.5, 0.25, 0.3]} /><meshStandardMaterial color="#f1c64d" /></mesh>
        <mesh position={[9.5, 6.9, 0]}><cylinderGeometry args={[0.035, 0.035, 13.4, 6]} /><meshStandardMaterial color="#424b50" /></mesh>
        <mesh position={[9.5, 0.25, 0]}><boxGeometry args={[0.45, 0.45, 0.45]} /><meshStandardMaterial color="#4e565a" /></mesh>
      </group>
      {/* Steel-frame building under construction */}
      {[-5, -1, 3, 7].map((x) => <mesh key={"column" + x} position={[x + 80, 3.2, 74]} castShadow><boxGeometry args={[0.22, 6.4, 0.22]} /><meshStandardMaterial color="#69747b" metalness={0.65} roughness={0.4} /></mesh>)}
      {[1.5, 4.5, 6.4].map((y) => <mesh key={"beam" + y} position={[84, y, 74]} castShadow><boxGeometry args={[16, 0.2, 0.2]} /><meshStandardMaterial color="#69747b" metalness={0.65} roughness={0.4} /></mesh>)}
      {/* Excavator / site machinery */}
      <group position={[79, 0, 84]}>
        <mesh position={[0, 0.72, 0]} castShadow><boxGeometry args={[2.8, 0.9, 1.5]} /><meshStandardMaterial color="#e5a51b" roughness={0.7} /></mesh>
        <mesh position={[0.35, 1.55, -0.15]} rotation-z={-0.28} castShadow><boxGeometry args={[0.85, 1.15, 0.85]} /><meshStandardMaterial color="#eab308" /></mesh>
        <mesh position={[1.2, 2.05, 0]} rotation-z={-0.55} castShadow><boxGeometry args={[0.3, 2.1, 0.35]} /><meshStandardMaterial color="#d79b18" /></mesh>
        <mesh position={[2, 2.65, 0]} rotation-z={0.45} castShadow><boxGeometry args={[0.28, 1.6, 0.3]} /><meshStandardMaterial color="#d79b18" /></mesh>
        {[-0.85, 0.85].map((x) => <mesh key={x} position={[x, 0.28, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.34, 0.34, 0.25, 12]} /><meshStandardMaterial color="#24272a" roughness={0.9} /></mesh>)}
      </group>
      {/* Site crew in reflective workwear and hard hats */}
      {[
        { x: 82, z: 72, shirt: "#eab308" },
        { x: 88, z: 85, shirt: "#f07824" },
        { x: 96, z: 76, shirt: "#eab308" },
      ].map((worker, i) => (
        <group key={"worker" + i} position={[worker.x, 0, worker.z]} rotation-y={i * 1.4}>
          <mesh position={[0, 0.95, 0]} castShadow><capsuleGeometry args={[0.23, 0.72, 4, 8]} /><meshStandardMaterial color={worker.shirt} roughness={0.85} /></mesh>
          <mesh position={[0, 1.65, 0]} castShadow><sphereGeometry args={[0.22, 12, 10]} /><meshStandardMaterial color={i === 1 ? "#6f442e" : "#986344"} roughness={0.9} /></mesh>
          <mesh position={[0, 1.83, 0]} castShadow><sphereGeometry args={[0.24, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.48]} /><meshStandardMaterial color="#f6ca42" roughness={0.6} /></mesh>
          {[-0.13, 0.13].map((x) => <mesh key={x} position={[x, 0.3, 0]} castShadow><boxGeometry args={[0.14, 0.6, 0.16]} /><meshStandardMaterial color="#3b4850" roughness={0.9} /></mesh>)}
          <mesh position={[0.28, 0.95, 0.05]} rotation-z={-0.4} castShadow><capsuleGeometry args={[0.09, 0.55, 3, 6]} /><meshStandardMaterial color={worker.shirt} /></mesh>
        </group>
      ))}
      {/* Concrete mixer and safety cones */}
      <group position={[96, 0, 85]}>
        <mesh position={[0, 0.75, 0]} castShadow><boxGeometry args={[2.3, 1, 1.2]} /><meshStandardMaterial color="#e5a51b" /></mesh>
        <mesh position={[0.1, 1.4, -0.15]} rotation-z={0.25} castShadow><cylinderGeometry args={[0.42, 0.65, 1.15, 10]} /><meshStandardMaterial color="#c7cbd0" roughness={0.55} /></mesh>
        <mesh position={[-0.75, 0.28, 0.65]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.3, 0.3, 0.2, 10]} /><meshStandardMaterial color="#22252a" /></mesh>
        <mesh position={[0.75, 0.28, 0.65]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.3, 0.3, 0.2, 10]} /><meshStandardMaterial color="#22252a" /></mesh>
      </group>
      {[{ x: 75, z: 72 }, { x: 76.5, z: 72 }, { x: 98, z: 73 }, { x: 99.5, z: 73 }].map((cone, i) => <mesh key={"cone" + i} position={[cone.x, 0.45, cone.z]} castShadow><cylinderGeometry args={[0.06, 0.32, 0.9, 7]} /><meshStandardMaterial color="#f07824" roughness={0.7} /></mesh>)}
      <Html position={[86, 10, 88]} center distanceFactor={28}><div className="whitespace-nowrap rounded-lg border border-[#eab308]/35 bg-[#17130b]/90 px-3 py-1.5 text-[10px] font-bold tracking-wider text-[#f4d16a]">LAGOS NEW CITY · CONSTRUCTION IN PROGRESS</div></Html>
    </group>
  );
}

function ApartmentInterior() {
  return (
    <group position={[104, 0, 104]}>
      <mesh position={[0, 0.04, 0]} receiveShadow><boxGeometry args={[12, 0.12, 10]} /><meshStandardMaterial color="#8b7355" roughness={0.85} /></mesh>
      <mesh position={[0, 1.8, 4.9]}><boxGeometry args={[12, 3.6, 0.18]} /><meshStandardMaterial color="#e2d5bd" roughness={0.9} /></mesh>
      <mesh position={[-5.9, 1.8, 0]}><boxGeometry args={[0.18, 3.6, 10]} /><meshStandardMaterial color="#d1c3aa" roughness={0.9} /></mesh>
      <mesh position={[5.9, 1.8, 0]}><boxGeometry args={[0.18, 3.6, 10]} /><meshStandardMaterial color="#d1c3aa" roughness={0.9} /></mesh>
      <mesh position={[0, 3.65, 0]}><boxGeometry args={[12, 0.18, 10]} /><meshStandardMaterial color="#252a2c" roughness={0.9} /></mesh>
      <mesh position={[-2.4, 0.62, -2.5]} castShadow><boxGeometry args={[3.2, 0.9, 1.1]} /><meshStandardMaterial color="#174b3b" roughness={0.7} /></mesh>
      <mesh position={[0.7, 0.42, -1.2]} castShadow><boxGeometry args={[1.7, 0.45, 1.1]} /><meshStandardMaterial color="#4b3927" roughness={0.65} /></mesh>
      <mesh position={[3.8, 1.3, 4.72]}><boxGeometry args={[2.2, 1.2, 0.12]} /><meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.15} /></mesh>
      <mesh position={[3.7, 0.55, 2.5]} castShadow><boxGeometry args={[1.5, 1.1, 1.5]} /><meshStandardMaterial color="#3c504b" roughness={0.8} /></mesh>
    </group>
  );
}

export default function World() {
  const ground = useMemo(groundTexture, []);
  const asphalt = useMemo(asphaltTexture, []);
  const sidewalk = useMemo(sidewalkTexture, []);
  const lotAsphalt = useMemo(asphaltTexture, []);

  return (
    <group>
      {/* Ground */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[WORLD, WORLD]} />
        <meshStandardMaterial map={ground} roughness={1} />
      </mesh>

      {/* Sidewalk corridors then roads on top */}
      {ROADS_X.map((rx, i) => (
        <mesh key={"sx" + i} rotation-x={-Math.PI / 2} position={[rx, 0.01, 0]} receiveShadow>
          <planeGeometry args={[ROAD_HALF * 2 + 6, WORLD]} />
          <meshStandardMaterial map={sidewalk} roughness={1} />
        </mesh>
      ))}
      {ROADS_Z.map((rz, i) => (
        <mesh key={"sz" + i} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.012, rz]} receiveShadow>
          <planeGeometry args={[ROAD_HALF * 2 + 6, WORLD]} />
          <meshStandardMaterial map={sidewalk} roughness={1} />
        </mesh>
      ))}
      {ROADS_X.map((rx, i) => (
        <mesh key={"rx" + i} rotation-x={-Math.PI / 2} position={[rx, 0.025, 0]} receiveShadow>
          <planeGeometry args={[ROAD_HALF * 2, WORLD]} />
          <meshStandardMaterial map={asphalt} roughness={0.95} />
        </mesh>
      ))}
      {ROADS_Z.map((rz, i) => (
        <mesh key={"rz" + i} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.028, rz]} receiveShadow>
          <planeGeometry args={[ROAD_HALF * 2, WORLD]} />
          <meshStandardMaterial map={asphalt} roughness={0.95} />
        </mesh>
      ))}

      <RoadMarkings />
      {/* Dealership display lot */}
      <mesh rotation-x={-Math.PI / 2} position={[40, 0.03, -64]} receiveShadow>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial map={lotAsphalt} color="#5a5a60" roughness={1} />
      </mesh>
      {LOT_CARS.map((c, i) => (
        <mesh key={i} position={[c.x, 0.5, c.z]} rotation-y={c.rotY} castShadow>
          <boxGeometry args={[1.9, 1, 4]} />
          <meshStandardMaterial color={c.color} flatShading roughness={0.4} metalness={0.3} />
        </mesh>
      ))}

      {BUILDINGS.map((b, i) => <Building key={i} b={b} />)}
      <LagosStreetProps />
      <AirportDistrict />
      <ConstructionSite />
      <ApartmentInterior />
      <Lamps />
      <Trees />
      {STALLS.map((s, i) => <Stall key={i} s={s} />)}
      {POIS.filter((p) => p.kind === "atm").map((p) => <Atm key={p.id} x={p.x} z={p.z} />)}

      {/* POI ground rings */}
      {POIS.map((p) => (
        <mesh key={p.id} rotation-x={-Math.PI / 2} position={[p.x, 0.05, p.z]}>
          <ringGeometry args={[1.1, 1.5, 24]} />
          <meshBasicMaterial color="#ffd257" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}
