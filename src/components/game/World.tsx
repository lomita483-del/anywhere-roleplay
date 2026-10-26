import { useMemo, useRef } from "react";
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
          <meshStandardMaterial color={["#e2574c", "#e2a13c", "#3fa37a"][i]} roughness={0.9} />
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
