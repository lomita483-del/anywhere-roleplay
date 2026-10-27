import { useEffect, useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/game/store";

/** Compact premium stadium; expensive match and crowd actors mount only in spectator mode. */
type MatchPlayerData = { x: number; z: number; team: number; index: number };

function MatchPlayer({ player }: { player: MatchPlayerData }) {
  const body = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const shirt = player.team === 0 ? "#f5f5ed" : "#d82f45";
  const shorts = player.team === 0 ? "#243b75" : "#f1f1e9";

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const phase = t * (1.4 + (player.index % 4) * 0.16) + player.index * 1.73;
    if (body.current) {
      body.current.position.set(
        player.x + Math.sin(phase * 0.72) * (player.index % 3 === 0 ? 5.5 : 2.1),
        Math.abs(Math.sin(phase * 2.4)) * 0.12,
        player.z + Math.cos(phase * 0.64) * (player.index % 4 === 0 ? 4.2 : 1.7),
      );
      body.current.rotation.y = Math.atan2(Math.cos(phase * 0.64), Math.cos(phase * 0.72));
    }
    const run = Math.sin(phase * 3.2) * 0.72;
    if (leftLeg.current) leftLeg.current.rotation.x = run;
    if (rightLeg.current) rightLeg.current.rotation.x = -run;
    if (leftArm.current) leftArm.current.rotation.x = -run * 0.6;
    if (rightArm.current) rightArm.current.rotation.x = run * 0.6;
  });

  return (
    <group ref={body} position={[player.x, 0, player.z]} scale={[2.4, 2.4, 2.4]}>
      <mesh position={[0, 1.12, 0]} castShadow><capsuleGeometry args={[0.28, 0.42, 4, 8]} /><meshStandardMaterial color={shirt} roughness={0.78} /></mesh>
      <mesh position={[0, 1.48, 0]} castShadow><sphereGeometry args={[0.19, 12, 10]} /><meshStandardMaterial color="#996747" roughness={0.9} /></mesh>
      <mesh position={[0, 0.79, 0]}><boxGeometry args={[0.4, 0.24, 0.27]} /><meshStandardMaterial color={shorts} roughness={0.85} /></mesh>
      <group ref={leftArm} position={[-0.3, 1.28, 0]}><mesh position={[0, -0.19, 0]} rotation-z={-0.13}><capsuleGeometry args={[0.075, 0.32, 3, 6]} /><meshStandardMaterial color="#996747" /></mesh></group>
      <group ref={rightArm} position={[0.3, 1.28, 0]}><mesh position={[0, -0.19, 0]} rotation-z={0.13}><capsuleGeometry args={[0.075, 0.32, 3, 6]} /><meshStandardMaterial color="#996747" /></mesh></group>
      <group ref={leftLeg} position={[-0.12, 0.68, 0]}><mesh position={[0, -0.27, 0]}><capsuleGeometry args={[0.085, 0.42, 3, 6]} /><meshStandardMaterial color="#20272d" /></mesh><mesh position={[0, -0.5, 0.08]}><boxGeometry args={[0.16, 0.1, 0.3]} /><meshStandardMaterial color="#f1f1e8" /></mesh></group>
      <group ref={rightLeg} position={[0.12, 0.68, 0]}><mesh position={[0, -0.27, 0]}><capsuleGeometry args={[0.085, 0.42, 3, 6]} /><meshStandardMaterial color="#20272d" /></mesh><mesh position={[0, -0.5, 0.08]}><boxGeometry args={[0.16, 0.1, 0.3]} /><meshStandardMaterial color="#f1f1e8" /></mesh></group>
    </group>
  );
}

function MatchBall() {
  const ball = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ball.current) {
      ball.current.position.set(Math.sin(t * 0.62) * 19, 0.42 + Math.abs(Math.sin(t * 2.8)) * 0.22, Math.sin(t * 0.43) * 8);
      ball.current.rotation.set(t * 2.5, t * 3.1, t * 1.7);
    }
  });
  return <mesh ref={ball} position={[0, 0.4, 0]} castShadow><sphereGeometry args={[0.42, 18, 14]} /><meshStandardMaterial color="#f7f5e9" roughness={0.58} /></mesh>;
}

function InstancedCrowd() {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const leftArmRef = useRef<THREE.InstancedMesh>(null);
  const rightArmRef = useRef<THREE.InstancedMesh>(null);
  const people = useMemo(() => {
    const colors = ["#f2f0e7", "#d53d4c", "#24579a", "#e2b84f", "#243c35", "#b9c6d1", "#8a4d37", "#f6f6f2", "#1c2633"];
    const crowd: { x: number; z: number; y: number; angle: number; color: string; index: number }[] = [];
    let index = 0;
    for (let row = 0; row < 4; row++) {
      const rx = 45 + row * 3.1;
      const rz = 28 + row * 2.05;
      const y = 4.8 + row * 3.15;
      const count = 128;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (row % 2) * 0.018;
        crowd.push({ x: Math.cos(angle) * rx, z: Math.sin(angle) * rz, y, angle: -angle, color: colors[index % colors.length]!, index });
        index++;
      }
    }
    return crowd;
  }, []);

  const animationTick = useRef(0);
  useFrame((state, delta) => {
    animationTick.current += delta;
    if (animationTick.current < 0.075) return;
    animationTick.current = 0;
    const left = leftArmRef.current, right = rightArmRef.current;
    if (!left || !right) return;
    const dummy = new THREE.Object3D();
    people.forEach((p, i) => {
      const cheer = Math.sin(state.clock.elapsedTime * 4.2 + p.index * 1.61) * 0.82;
      dummy.position.set(p.x - Math.cos(p.angle) * 0.42, p.y + 1.28, p.z + Math.sin(p.angle) * 0.42);
      dummy.rotation.set(0, p.angle, -0.65 - cheer); dummy.updateMatrix(); left.setMatrixAt(i, dummy.matrix);
      dummy.position.set(p.x + Math.cos(p.angle) * 0.42, p.y + 1.28, p.z - Math.sin(p.angle) * 0.42);
      dummy.rotation.set(0, p.angle, 0.65 + cheer); dummy.updateMatrix(); right.setMatrixAt(i, dummy.matrix);
    });
    left.instanceMatrix.needsUpdate = true; right.instanceMatrix.needsUpdate = true;
  });

  useEffect(() => {
    const body = bodyRef.current, head = headRef.current, left = leftArmRef.current, right = rightArmRef.current;
    if (!body || !head || !left || !right) return;
    const dummy = new THREE.Object3D();
    people.forEach((p, i) => {
      dummy.position.set(p.x, p.y + 1.05, p.z); dummy.rotation.set(0, p.angle, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
      body.setMatrixAt(i, dummy.matrix);
      body.setColorAt(i, new THREE.Color(p.color));
      dummy.position.set(p.x, p.y + 2.05, p.z); dummy.updateMatrix(); head.setMatrixAt(i, dummy.matrix);
      dummy.position.set(p.x - Math.cos(p.angle) * 0.42, p.y + 1.28, p.z + Math.sin(p.angle) * 0.42);
      dummy.rotation.set(0, p.angle, -0.65); dummy.updateMatrix(); left.setMatrixAt(i, dummy.matrix);
      dummy.position.set(p.x + Math.cos(p.angle) * 0.42, p.y + 1.28, p.z - Math.sin(p.angle) * 0.42);
      dummy.rotation.set(0, p.angle, 0.65); dummy.updateMatrix(); right.setMatrixAt(i, dummy.matrix);
    });
    body.instanceMatrix.needsUpdate = true; head.instanceMatrix.needsUpdate = true;
    left.instanceMatrix.needsUpdate = true; right.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;
    body.computeBoundingSphere(); head.computeBoundingSphere(); left.computeBoundingSphere(); right.computeBoundingSphere();
  }, [people]);

  return (
    <>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, people.length]} frustumCulled={false}>
        <capsuleGeometry args={[0.68, 1.2, 2, 5]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, people.length]} frustumCulled={false}>
        <sphereGeometry args={[0.4, 6, 5]} />
        <meshStandardMaterial color="#986747" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={leftArmRef} args={[undefined, undefined, people.length]} frustumCulled={false}>
        <capsuleGeometry args={[0.16, 0.48, 2, 4]} />
        <meshStandardMaterial color="#986747" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={rightArmRef} args={[undefined, undefined, people.length]} frustumCulled={false}>
        <capsuleGeometry args={[0.16, 0.48, 2, 4]} />
        <meshStandardMaterial color="#986747" roughness={0.95} />
      </instancedMesh>
    </>
  );
}

function Floodlight({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 15, 0]} castShadow><cylinderGeometry args={[0.28, 0.48, 30, 8]} /><meshStandardMaterial color="#5d6870" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 30, 0]}><boxGeometry args={[4.6, 1.5, 1.3]} /><meshStandardMaterial color="#e8e7dc" emissive="#fff1c0" emissiveIntensity={1.1} /></mesh>
      {[-1.5, -0.5, 0.5, 1.5].map((dx) => <mesh key={dx} position={[dx, 30, 0.72]}><planeGeometry args={[0.55, 0.75]} /><meshBasicMaterial color="#fff5cf" /></mesh>)}

    </group>
  );
}

function BigScreen({ z, rotate = false }: { z: number; rotate?: boolean }) {
  return (
    <group position={[0, 18, z]} rotation-y={rotate ? Math.PI : 0}>
      <mesh position={[0, -1.2, 0]} castShadow><boxGeometry args={[0.55, 8, 0.65]} /><meshStandardMaterial color="#5c6268" metalness={0.5} /></mesh>
      <mesh position={[0, 3.5, 0]} castShadow><boxGeometry args={[17, 9, 0.9]} /><meshStandardMaterial color="#101c27" metalness={0.35} roughness={0.3} /></mesh>
      <mesh position={[0, 3.5, 0.49]}><planeGeometry args={[15.9, 7.9]} /><meshStandardMaterial color="#092c32" emissive="#0a4a4b" emissiveIntensity={0.7} roughness={0.35} /></mesh>
      <Html position={[0, 3.55, 0.54]} transform distanceFactor={15} center style={{ pointerEvents: "none" }}>
        <div style={{ width: 230, color: "white", textAlign: "center", fontFamily: "Arial,sans-serif", textShadow: "0 2px 8px #000" }}>
          <div style={{ fontSize: 13, letterSpacing: 4, fontWeight: 900, color: "#f5d58a" }}>ALWAYS ROLEPLAY</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 7 }}>HOME TEAM　2 : 1　AWAY</div>
          <div style={{ fontSize: 10, letterSpacing: 2, marginTop: 5 }}>LIVE MATCH · 67:24</div>
        </div>
      </Html>
    </group>
  );
}


type CityBlock = { x: number; z: number; w: number; d: number; h: number; color: string; label?: string };

function CityBuilding({ b }: { b: CityBlock }) {
  const isHouse = b.h < 6;
  const windowRows = Math.max(1, Math.floor(b.h / 3.2));
  const windowCols = Math.max(2, Math.floor(b.w / 2.8));
  const windows = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        out.push({
          x: -b.w * 0.38 + col * ((b.w * 0.76) / Math.max(1, windowCols - 1)),
          y: 1.7 + row * ((Math.max(0.8, b.h - 3.1)) / Math.max(1, windowRows - 1)),
        });
      }
    }
    return out;
  }, [b.h, b.w, windowCols, windowRows]);
  const roofColors = ["#934b37", "#4f5c66", "#a75f3d", "#596b56", "#6c5147"];
  const roofColor = roofColors[Math.abs(Math.round(b.x * 3 + b.z)) % roofColors.length]!;
  return (
    <group position={[b.x, 0, b.z]}>
      {isHouse ? (
        <>
          {/* A small landscaped plot makes each home read as a real property, not a loose box. */}
          <mesh position={[0, 0.08, 0]} receiveShadow>
            <boxGeometry args={[b.w + 5.2, 0.16, b.d + 5.2]} />
            <meshStandardMaterial color="#76966a" roughness={1} />
          </mesh>
          <mesh position={[0, 0.2, 0]} receiveShadow>
            <boxGeometry args={[b.w + 1.2, 0.24, b.d + 1.2]} />
            <meshStandardMaterial color="#c5bba6" roughness={0.96} />
          </mesh>
          {/* Main house body with a warm, distinct façade. */}
          <mesh position={[0, b.h / 2 + 0.34, 0]} castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.color} roughness={0.9} />
          </mesh>
          {/* Two sloped roof planes form a visible pitched suburban roof and ridge. */}
          <mesh position={[0, b.h + 0.72, -b.d * 0.235]} rotation-x={-0.53} castShadow receiveShadow>
            <boxGeometry args={[b.w + 1.6, 0.32, b.d * 0.68]} />
            <meshStandardMaterial color={roofColor} roughness={0.94} />
          </mesh>
          <mesh position={[0, b.h + 0.72, b.d * 0.235]} rotation-x={0.53} castShadow receiveShadow>
            <boxGeometry args={[b.w + 1.6, 0.32, b.d * 0.68]} />
            <meshStandardMaterial color={roofColor} roughness={0.94} />
          </mesh>
          <mesh position={[0, b.h + 1.18, 0]} castShadow>
            <boxGeometry args={[b.w + 1.7, 0.18, 0.24]} />
            <meshStandardMaterial color="#e1d7c3" roughness={0.88} />
          </mesh>
          {/* Front porch, entry door, and two framed windows. */}
          <mesh position={[b.w * 0.12, 0.68, b.d / 2 + 0.58]} castShadow>
            <boxGeometry args={[b.w * 0.48, 0.18, 1.65]} />
            <meshStandardMaterial color="#b8a68a" roughness={0.95} />
          </mesh>
          {[-b.w * 0.08, b.w * 0.32].map((x, i) => <mesh key={"porch-post-"+i} position={[x, 1.35, b.d / 2 + 1.12]} castShadow>
            <boxGeometry args={[0.18, 1.5, 0.18]} />
            <meshStandardMaterial color="#eee6d4" roughness={0.9} />
          </mesh>)}
          <mesh position={[b.w * 0.19, 1.35, b.d / 2 + 0.045]} castShadow>
            <boxGeometry args={[1.05, 2.25, 0.1]} />
            <meshStandardMaterial color="#5b392d" roughness={0.78} />
          </mesh>
          <mesh position={[b.w * 0.19 + 0.28, 1.35, b.d / 2 + 0.105]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshStandardMaterial color="#e7c16d" metalness={0.65} roughness={0.28} />
          </mesh>
          {[-b.w * 0.27, -b.w * 0.02].map((x, i) => <group key={"front-window-"+i} position={[x, 2.25, b.d / 2 + 0.055]}>
            <mesh><boxGeometry args={[1.45, 1.18, 0.12]} /><meshStandardMaterial color="#f0e6d2" roughness={0.8} /></mesh>
            <mesh position={[0, 0, 0.075]}><boxGeometry args={[1.17, 0.9, 0.045]} /><meshStandardMaterial color="#7da9b5" emissive="#27454b" emissiveIntensity={0.15} metalness={0.2} roughness={0.3} /></mesh>
            <mesh position={[0, 0, 0.11]}><boxGeometry args={[0.07, 0.92, 0.04]} /><meshStandardMaterial color="#eee6d4" /></mesh>
            <mesh position={[0, 0, 0.11]}><boxGeometry args={[1.2, 0.07, 0.04]} /><meshStandardMaterial color="#eee6d4" /></mesh>
          </group>)}
          {/* A short driveway and a small garage wing add a recognizable house silhouette. */}
          <mesh position={[-b.w * 0.29, 0.19, b.d / 2 + 2.4]} receiveShadow>
            <boxGeometry args={[b.w * 0.34, 0.12, 3.8]} />
            <meshStandardMaterial color="#aaa99f" roughness={0.96} />
          </mesh>
          <mesh position={[-b.w * 0.29, 1.45, b.d * 0.18]} castShadow>
            <boxGeometry args={[b.w * 0.36, 2.4, b.d * 0.54]} />
            <meshStandardMaterial color={b.color} roughness={0.9} />
          </mesh>
          <mesh position={[-b.w * 0.29, 1.4, b.d * 0.18 + b.d * 0.27 + 0.06]}>
            <boxGeometry args={[b.w * 0.28, 1.8, 0.08]} />
            <meshStandardMaterial color="#7e8583" roughness={0.86} />
          </mesh>
          <mesh position={[b.w * 0.34, b.h + 0.95, -b.d * 0.23]} castShadow>
            <boxGeometry args={[0.8, 2.0, 0.8]} />
            <meshStandardMaterial color="#b8b3a7" roughness={0.9} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0.18, 0]} receiveShadow>
            <boxGeometry args={[b.w + 2.2, 0.36, b.d + 2.2]} />
            <meshStandardMaterial color="#b8b8ad" roughness={0.96} />
          </mesh>
          <mesh position={[0, b.h / 2 + 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.color} roughness={0.66} metalness={b.h > 18 ? 0.2 : 0.03} />
          </mesh>
          <mesh position={[0, b.h + 0.55, 0]} castShadow>
            <boxGeometry args={[b.w + 0.9, 0.42, b.d + 0.9]} />
            <meshStandardMaterial color={b.h > 18 ? "#253847" : "#c5b99e"} roughness={0.7} metalness={0.18} />
          </mesh>
          <mesh position={[0, b.h + 0.86, 0]} castShadow>
            <boxGeometry args={[b.w * 0.58, 0.24, b.d * 0.54]} />
            <meshStandardMaterial color="#a9b3b4" roughness={0.76} metalness={0.12} />
          </mesh>
          {windows.map((w, i) => (
            <mesh key={i} position={[w.x, w.y + 0.35, b.d / 2 + 0.012]}>
              <boxGeometry args={[Math.min(1.35, b.w / (windowCols + 1)), Math.min(1.7, b.h / (windowRows + 1)), 0.035]} />
              <meshStandardMaterial color="#6f9aa9" emissive="#1d3942" emissiveIntensity={0.18} metalness={0.35} roughness={0.32} />
            </mesh>
          ))}
          <mesh position={[b.w * 0.22, 1.25, b.d / 2 + 0.04]}>
            <boxGeometry args={[Math.min(1.7, b.w * 0.16), 2.5, 0.08]} />
            <meshStandardMaterial color="#263943" metalness={0.22} roughness={0.4} />
          </mesh>
        </>
      )}
      {b.label && <Html position={[0, b.h + (isHouse ? 2.0 : 1.8), 0]} center distanceFactor={25} style={{ pointerEvents: "none" }}>
        <div style={{ whiteSpace: "nowrap", padding: "4px 8px", borderRadius: 5, background: "rgba(7,19,28,.9)", border: "1px solid rgba(230,199,127,.82)", color: "#f8e8bd", fontSize: 10, fontWeight: 900, letterSpacing: 1.3 }}>{b.label}</div>
      </Html>}
    </group>
  );
}

function CityTrees() {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);
  const spots = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i < 120; i++) {
      const a = i * 2.399963;
      const r = 104 + (i % 5) * 11;
      out.push([Math.cos(a) * r, 0, Math.sin(a) * r]);
    }
    for (let i = 0; i < 30; i++) {
      const a = i * 2.399963;
      out.push([Math.cos(a) * (32 + (i % 3) * 4), 0, Math.sin(a) * (32 + (i % 3) * 4)]);
    }
    return out;
  }, []);
  useEffect(() => {
    const trunks = trunkRef.current, crowns = crownRef.current;
    if (!trunks || !crowns) return;
    const dummy = new THREE.Object3D();
    spots.forEach(([x, y, z], i) => {
      const h = 1.5 + (i % 4) * 0.2;
      dummy.position.set(x, y + h * 0.5, z); dummy.scale.set(0.34, h, 0.34); dummy.rotation.set(0, i, 0); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, y + h + 1.1 + (i % 3) * 0.18, z); dummy.scale.set(1.05 + (i % 3) * 0.12, 1.45 + (i % 2) * 0.2, 1.05 + (i % 3) * 0.12); dummy.updateMatrix(); crowns.setMatrixAt(i, dummy.matrix);
    });
    trunks.instanceMatrix.needsUpdate = true; crowns.instanceMatrix.needsUpdate = true;
    trunks.computeBoundingSphere(); crowns.computeBoundingSphere();
  }, [spots]);
  return <>
    <instancedMesh ref={trunkRef} args={[undefined, undefined, spots.length]} frustumCulled={false}><cylinderGeometry args={[0.5, 0.65, 1, 5]} /><meshStandardMaterial color="#71533b" roughness={1} /></instancedMesh>
    <instancedMesh ref={crownRef} args={[undefined, undefined, spots.length]} frustumCulled={false}><coneGeometry args={[1, 2, 5]} /><meshStandardMaterial color="#315f3b" roughness={1} /></instancedMesh>
  </>;
}

// Curved arterial routes replace the old oversized rectangular road grid.
// The S-bends and U-shaped stadium loop are designed to read clearly from the isometric camera.
const CITY_ROAD_PATHS: [number, number][][] = [
  [[-168, 94], [-137, 74], [-116, 47], [-112, 16], [-91, -8], [-62, -22], [-36, -19], [-13, -3], [11, 12], [38, 16], [65, 4], [91, -18], [116, -47], [145, -61], [169, -54]],
  [[-165, -25], [-133, -18], [-108, -30], [-92, -56], [-76, -86], [-52, -109], [-23, -119], [9, -112], [36, -94], [55, -70], [72, -49], [99, -39], [130, -42], [164, -28]],
  [[-78, 164], [-64, 130], [-71, 100], [-54, 73], [-40, 49], [-43, 28], [-61, 10]],
  [[62, 163], [75, 133], [71, 108], [90, 83], [112, 66], [128, 39], [126, 12], [111, -7]],
  [[-165, 125], [-132, 119], [-111, 133], [-94, 153], [-68, 166]],
  [[-150, -137], [-118, -119], [-95, -96], [-78, -74]],
  // Broad U-shaped boulevard around the stadium plaza.
  [[-9, -70], [22, -68], [49, -52], [67, -27], [72, 3], [63, 33], [43, 55], [14, 67], [-17, 67], [-45, 53], [-64, 30], [-72, 1], [-66, -29], [-47, -52], [-21, -67], [-9, -70]],
];

function createRoadGeometry(path: [number, number][], width: number) {
  const curve = new THREE.CatmullRomCurve3(path.map(([x, z]) => new THREE.Vector3(x, 0.045, z)), false, "catmullrom", 0.22);
  const samples = curve.getPoints(Math.max(80, path.length * 18));
  const positions: number[] = [];
  const indices: number[] = [];
  samples.forEach((p, i) => {
    const tangent = curve.getTangent(i / (samples.length - 1));
    const halfX = tangent.z * width * 0.5;
    const halfZ = -tangent.x * width * 0.5;
    positions.push(p.x - halfX, p.y, p.z - halfZ, p.x + halfX, p.y, p.z + halfZ);
    if (i < samples.length - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return { geometry, curve };
}

function CurvedRoadNetwork() {
  const roadData = useMemo(() => CITY_ROAD_PATHS.map((path, index) => {
    const width = index === 6 ? 8.8 : index < 2 ? 8.2 : 6.4;
    return { index, ...createRoadGeometry(path, width), sidewalk: createRoadGeometry(path, width + 2.8) };
  }), []);
  const dashData = useMemo(() => {
    const out: { x: number; z: number; yaw: number; width: number }[] = [];
    roadData.forEach((road, roadIndex) => {
      const length = road.curve.getLength();
      const spacing = roadIndex === 6 ? 9.2 : 10.5;
      for (let d = 4; d < length - 4; d += spacing) {
        const t = road.curve.getUtoTmapping(0, d);
        const p = road.curve.getPointAt(t);
        const tangent = road.curve.getTangentAt(t);
        out.push({ x: p.x, z: p.z, yaw: Math.atan2(-tangent.z, tangent.x), width: roadIndex === 6 ? 3.7 : 3.2 });
      }
    });
    return out;
  }, [roadData]);
  const marksRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = marksRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    dashData.forEach((d, i) => {
      dummy.position.set(d.x, 0.075, d.z);
      dummy.rotation.set(0, d.yaw, 0);
      dummy.scale.set(d.width, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [dashData]);
  return (
    <>
      {roadData.map((road) => <mesh key={"sidewalk-"+road.index} geometry={road.sidewalk.geometry} receiveShadow>
        <meshStandardMaterial color="#aeb1ab" roughness={0.98} side={THREE.DoubleSide} />
      </mesh>)}
      {roadData.map((road) => <mesh key={road.index} geometry={road.geometry} receiveShadow>
        <meshStandardMaterial color="#3d454b" roughness={0.96} side={THREE.DoubleSide} />
      </mesh>)}
      <instancedMesh ref={marksRef} args={[undefined, undefined, dashData.length]} frustumCulled={false}>
        <boxGeometry args={[1, 0.035, 0.16]} />
        <meshBasicMaterial color="#f4f0df" />
      </instancedMesh>
    </>
  );
}

function CityTraffic() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const routes = useMemo(() => CITY_ROAD_PATHS.map((path) => new THREE.CatmullRomCurve3(
    path.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "catmullrom", 0.22,
  )), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((car, i) => {
      if (!car) return;
      const route = routes[i % routes.length]!;
      const length = route.getLength();
      const distance = (t * (5.5 + (i % 3) * 1.2) + i * (length / 12)) % length;
      const u = distance / length;
      const point = route.getPointAt(u);
      const tangent = route.getTangentAt(u);
      car.position.set(point.x, 0.16, point.z);
      car.rotation.y = Math.atan2(-tangent.z, tangent.x);
    });
  });
  return <>{Array.from({ length: 12 }, (_, i) => <group key={i} ref={(el) => { refs.current[i] = el; }}>
    <mesh castShadow><boxGeometry args={[2.6, 0.75, 1.25]} /><meshStandardMaterial color={["#d9dfe0", "#d9ad4d", "#376a8a", "#a83d35", "#263b32"][i % 5]!} roughness={0.65} /></mesh>
    <mesh position={[0, 0.43, 0]}><boxGeometry args={[1.25, 0.42, 1.05]} /><meshStandardMaterial color="#8eb0bb" metalness={0.2} roughness={0.25} /></mesh>
  </group>)}</>;
}

function CityEcosystem() {
  const buildings = useMemo<CityBlock[]>(() => {
    const out: CityBlock[] = [];
    // Industrial and corporate skyline, north-west.
    for (let i = 0; i < 10; i++) out.push({ x: -145 + (i % 5) * 14, z: -88 + Math.floor(i / 5) * 17, w: 9 + (i % 3) * 2, d: 9, h: 18 + ((i * 7) % 28), color: ["#8daab5", "#b3b9b7", "#d0c4ad", "#728d9b"][i % 4]!, ...(i === 2 ? { label: "CORPORATE DISTRICT" } : {}) });
    for (let i = 0; i < 8; i++) out.push({ x: -151 + (i % 4) * 12, z: -55 + Math.floor(i / 4) * 13, w: 8, d: 8, h: 6 + (i % 3), color: ["#a8a69a", "#b5a18b", "#c8bca5"][i % 3]! });
    // Residential streets, north-east.
    for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) out.push({ x: 64 + col * 16, z: -77 + row * 14, w: 10, d: 8, h: 4.2 + ((row + col) % 2) * 0.7, color: ["#dfd3bb", "#d9c8a7", "#bfc9bb", "#d7b6a0"][(row + col) % 4]!, ...(row === 0 && col === 2 ? { label: "RESIDENTIAL DISTRICT" } : {}) });
    // Commercial blocks around the centre, leaving a clear stadium ring.
    for (let i = 0; i < 8; i++) out.push({ x: (i % 2 ? 1 : -1) * (48 + Math.floor(i / 2) * 7), z: (i % 4 < 2 ? -1 : 1) * 29, w: 9, d: 8, h: 5 + (i % 3) * 2, color: ["#d5c4a6", "#b8c5c4", "#caa16d", "#b8b2a4"][i % 4]! });
    // University district and civic campus, west.
    out.push({ x: -125, z: 17, w: 24, d: 17, h: 9, color: "#d8d0bd", label: "UNIVERSITY DISTRICT" });
    out.push({ x: -95, z: 20, w: 18, d: 13, h: 12, color: "#c1b8a7" });
    out.push({ x: -125, z: 45, w: 17, d: 12, h: 7, color: "#b4c4b7" });
    out.push({ x: -95, z: 45, w: 16, d: 12, h: 6, color: "#d8c7a5" });
    // Port logistics buildings, east/south.
    out.push({ x: 124, z: 91, w: 23, d: 15, h: 8, color: "#b7a58a", label: "PORT OF LAGOS" });
    out.push({ x: 148, z: 75, w: 14, d: 12, h: 7, color: "#c8bca6" });
    return out;
  }, []);
  return <>
    {/* Curving S-roads and a U-shaped boulevard connect compact districts. */}
    <CurvedRoadNetwork />
    {/* North airport: runways, taxiways, terminal, aircraft and tower. */}
    <group position={[6, 0, -142]}>
      {[-15, 15].map((x) => <group key={x} position={[x, 0.04, 0]}>
        <mesh rotation-x={-Math.PI / 2}><planeGeometry args={[9, 82]} /><meshStandardMaterial color="#4a5054" roughness={1} /></mesh>
        {Array.from({ length: 8 }, (_, i) => <mesh key={i} rotation-x={-Math.PI / 2} position={[0, 0.015, -34 + i * 9]}><planeGeometry args={[0.22, 4]} /><meshBasicMaterial color="#f5f1df" /></mesh>)}
      </group>)}
      <mesh position={[0, 1.6, 48]}><boxGeometry args={[44, 3.2, 13]} /><meshStandardMaterial color="#c5c9c6" metalness={0.3} roughness={0.5} /></mesh>
      <mesh position={[0, 3.3, 48]}><boxGeometry args={[34, 0.5, 9]} /><meshStandardMaterial color="#7ea9b6" metalness={0.25} roughness={0.3} /></mesh>
      <mesh position={[27, 5, 48]}><cylinderGeometry args={[1.2, 1.5, 10, 8]} /><meshStandardMaterial color="#d0d4d2" /></mesh>
      <mesh position={[27, 10, 48]}><boxGeometry args={[4, 2.4, 4]} /><meshStandardMaterial color="#7194a2" metalness={0.2} /></mesh>
      {([[-25, -20], [-5, -30], [8, -12], [24, -23], [2, -4]] as [number, number][]).map(([x,z],i) => <group key={i} position={[x, 0.7, z]} rotation-y={i%2?0.3:-0.2}>
        <mesh><boxGeometry args={[9, 1.1, 1.8]} /><meshStandardMaterial color={i%2?"#e9e8df":"#d4d9d8"} /></mesh>
        <mesh position={[0, 0.15, 0]}><boxGeometry args={[2.5, 0.16, 12]} /><meshStandardMaterial color="#d6dbd9" /></mesh>
        <mesh position={[0, 0.7, 0]}><boxGeometry args={[2, 0.2, 1.2]} /><meshStandardMaterial color="#7fa9b8" /></mesh>
      </group>)}
      <Html position={[0, 8, 60]} center distanceFactor={40} style={{ pointerEvents: "none" }}><div style={{ whiteSpace: "nowrap", padding: "5px 10px", color: "#fff0c8", background: "#071923e8", border: "1px solid #d7b66c", fontWeight: 900, letterSpacing: 2, fontSize: 11 }}>LAGOS INTERNATIONAL AIRPORT</div></Html>
    </group>
    {/* University sports court and landscaped quad. */}
    <group position={[-110, 0, 32]}>
      <mesh rotation-x={-Math.PI/2} position={[0, 0.035, 0]}><planeGeometry args={[22, 13]} /><meshStandardMaterial color="#2d7a43" roughness={1} /></mesh>
      <mesh rotation-x={-Math.PI/2} position={[0, 0.05, 0]}><planeGeometry args={[0.12, 12]} /><meshBasicMaterial color="#f3f0dc" /></mesh>
      <mesh rotation-x={-Math.PI/2} position={[0, 0.05, 0]}><ringGeometry args={[3.1, 3.2, 24]} /><meshBasicMaterial color="#f3f0dc" side={THREE.DoubleSide} /></mesh>
    </group>
    {/* Industrial stacks and restrained exhaust plumes. */}
    <group position={[-143, 0, -46]}>
      {[-10, 0, 10].map((x, i) => <group key={i} position={[x, 0, 0]}>
        <mesh position={[0, 5, 0]}><cylinderGeometry args={[1.3, 1.8, 10, 8]} /><meshStandardMaterial color="#7c8587" roughness={0.8} /></mesh>
        <mesh position={[0, 10.2, 0]}><cylinderGeometry args={[1.45, 1.35, 0.7, 8]} /><meshStandardMaterial color="#bd6651" roughness={0.8} /></mesh>
        <mesh position={[0.8, 12 + i, 0]}><sphereGeometry args={[1.4, 7, 6]} /><meshStandardMaterial color="#b9b9b1" transparent opacity={0.34} roughness={1} /></mesh>
      </group>)}
    </group>
    {/* Port and waterfront with container stacks, crane frames and ships. */}
    <group position={[116, 0, 120]}>
      <mesh rotation-x={-Math.PI / 2} position={[5, 0, 0]}><planeGeometry args={[88, 64]} /><meshStandardMaterial color="#267b9c" roughness={0.34} metalness={0.1} /></mesh>
      <mesh position={[-22, 0.28, -1]}><boxGeometry args={[47, 0.55, 17]} /><meshStandardMaterial color="#777e7e" roughness={0.9} /></mesh>
      {Array.from({ length: 28 }, (_, i) => <mesh key={i} position={[-40 + (i % 7) * 5.6, 1.3 + Math.floor(i / 7) * 1.65, -5 + Math.floor(i / 7) * 3.6]} castShadow><boxGeometry args={[5, 1.5, 3.1]} /><meshStandardMaterial color={["#d45d45", "#d4ad4d", "#396a89", "#b9c2be", "#406b55"][i % 5]!} roughness={0.8} /></mesh>)}
      {([[-27, -11], [8, -12]] as [number, number][]).map(([x,z],i) => <group key={i} position={[x, 0, z]}>
        <mesh position={[0, 7, 0]}><boxGeometry args={[1, 14, 1]} /><meshStandardMaterial color="#d4b76f" metalness={0.35} /></mesh>
        <mesh position={[4, 13, 0]}><boxGeometry args={[9, 0.8, 0.8]} /><meshStandardMaterial color="#d4b76f" metalness={0.35} /></mesh>
        <mesh position={[7, 6, 0]}><boxGeometry args={[0.8, 12, 0.8]} /><meshStandardMaterial color="#d4b76f" metalness={0.35} /></mesh>
      </group>)}
      {[-10, 18].map((x,i) => <group key={i} position={[x, 0.5, 20]}>
        <mesh><boxGeometry args={[19, 1.3, 5]} /><meshStandardMaterial color="#263b49" metalness={0.35} roughness={0.4} /></mesh>
        <mesh position={[0, 1.4, -1]}><boxGeometry args={[7, 1.2, 3]} /><meshStandardMaterial color="#e4e3d8" /></mesh>
      </group>)}
      <Html position={[8, 8, 28]} center distanceFactor={35} style={{ pointerEvents: "none" }}><div style={{ whiteSpace: "nowrap", padding: "5px 10px", color: "#fff0c8", background: "#071923e8", border: "1px solid #d7b66c", fontWeight: 900, letterSpacing: 2, fontSize: 11 }}>PORT OF LAGOS</div></Html>
    </group>
    {/* Scenic lake and sandy recreational edge, south-west. */}
    <group position={[-112, 0, 118]}>
      <mesh rotation-x={-Math.PI/2} position={[0, 0.035, 0]}><circleGeometry args={[27, 40]} /><meshStandardMaterial color="#287f9d" roughness={0.35} /></mesh>
      <mesh rotation-x={-Math.PI/2} position={[0, 0.05, 0]}><ringGeometry args={[27, 32, 40]} /><meshStandardMaterial color="#d7c391" roughness={1} side={THREE.DoubleSide} /></mesh>
      {[-1, 1].map((side) => <group key={side} position={[side * 12, 0.3, 0]}><mesh><boxGeometry args={[5, 0.6, 3.5]} /><meshStandardMaterial color="#c5a779" /></mesh><mesh position={[0, 1.8, -0.7]}><boxGeometry args={[5, 3, 0.3]} /><meshStandardMaterial color="#876344" /></mesh><mesh position={[0, 3.4, 0]}><boxGeometry args={[6, 0.3, 4.5]} /><meshStandardMaterial color="#cfa85d" /></mesh></group>)}
    </group>
    {/* District labels and premium map title. */}
    <Html position={[-25, 8, -166]} center distanceFactor={48} style={{ pointerEvents: "none" }}>
      <div style={{ whiteSpace: "nowrap", textAlign: "center", padding: "12px 22px", borderRadius: 9, color: "#f8e4ac", background: "linear-gradient(135deg,rgba(7,19,29,.97),rgba(19,46,48,.94))", border: "2px solid rgba(224,188,105,.9)", boxShadow: "0 8px 28px #0008", fontWeight: 1000, letterSpacing: 5, fontSize: 25 }}>LAGOS METROPLEX<div style={{ marginTop: 4, fontSize: 10, letterSpacing: 3, color: "#d8e3d9" }}>A LIVING OPEN-WORLD CITY · ALWAYS ROLEPLAY</div></div>
    </Html>
    <CityTrees />
    {buildings.map((b, i) => <CityBuilding key={i} b={b} />)}
    <CityTraffic />
  </>;
}

export default function NewMapWorld() {
  const players = useMemo<MatchPlayerData[]>(() => {
    const home: [number, number][] = [
      [-31, -12], [-31, 0], [-31, 12], [-21, -16], [-21, -5], [-21, 6], [-21, 16], [-8, -14], [-8, 0], [-8, 14], [8, 0],
    ];
    const away: [number, number][] = [
      [31, -12], [31, 0], [31, 12], [21, -16], [21, -5], [21, 6], [21, 16], [8, -14], [8, 0], [8, 14], [-8, 0],
    ];
    return [...home.map(([x, z], index) => ({ x, z, team: 0, index })), ...away.map(([x, z], index) => ({ x, z, team: 1, index: index + 11 }))];
  }, []);

  const enterStadium = () => useGame.getState().enterStadium();
  const stadiumMode = useGame((s) => s.stadiumMode);

  return (
    <group>
      {/* The entire city is intentionally compact so destinations are close together. */}
      <group scale={[0.48, 0.48, 0.48]}>
        {/* Named, connected districts with S-curves and a U-shaped stadium boulevard. */}
        <CityEcosystem />
      </group>
      {/* Plain world beyond the stadium */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color="#668553" roughness={1} metalness={0} />
      </mesh>

      {/* Stadium bowl: reduced exterior footprint, deep layered seating and a completely open centre */}
      <group scale={[0.22, 0.22, 0.22]}>
        {/* Thick outer shell walls; these sit outside the open pitch rather than over the player */}
        <mesh position={[0, 5.2, 0]} scale={[60, 1, 40]} castShadow receiveShadow>
          <cylinderGeometry args={[1, 0.96, 10.4, 96, 1, true]} />
          <meshStandardMaterial color="#172431" roughness={0.58} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.12, 0]} scale={[60, 40, 1]} receiveShadow>
          <ringGeometry args={[0.72, 1, 96]} />
          <meshStandardMaterial color="#35434d" roughness={0.78} side={THREE.DoubleSide} />
        </mesh>

        {/* Structural concrete bands and tier fascia make the bowl feel thick and architectural */}
        {[3.2, 6.8, 10.4, 14, 17.4].map((y, i) => (
          <mesh key={y} rotation-x={-Math.PI / 2} position={[0, y, 0]} scale={[60 - i * 2.6, 40 - i * 2.1, 1]} castShadow>
            <ringGeometry args={[0.73, 1, 96]} />
            <meshStandardMaterial color={i % 2 ? "#c6c9c7" : "#737c83"} roughness={0.82} side={THREE.DoubleSide} />
          </mesh>
        ))}
        {[
          { rx: 57, rz: 37.5, y: 5.3, color: "#d6b66e" },
          { rx: 54, rz: 35.1, y: 8.7, color: "#253b4a" },
          { rx: 51, rz: 32.8, y: 12.1, color: "#c8a65f" },
          { rx: 48, rz: 30.4, y: 15.5, color: "#0f625d" },
          { rx: 45, rz: 28.2, y: 18.2, color: "#d6d9dc" },
        ].map((tier, index) => (
          <mesh key={index} rotation-x={-Math.PI / 2} position={[0, tier.y, 0]} scale={[tier.rx, tier.rz, 1]} castShadow receiveShadow>
            <ringGeometry args={[0.84, 1, 112]} />
            <meshStandardMaterial color={tier.color} roughness={0.78} side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* Roof rim is narrow and elevated so it does not cover the field or spectators */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 21, 0]} scale={[59, 39, 1]} castShadow>
          <ringGeometry args={[0.94, 1, 112]} />
          <meshStandardMaterial color="#101923" metalness={0.58} roughness={0.32} side={THREE.DoubleSide} />
        </mesh>

        {/* Open football pitch at ground level, unobstructed by the stadium shell */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.06, 0]} receiveShadow>
          <planeGeometry args={[82, 43]} />
          <meshStandardMaterial color="#24763e" roughness={1} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} rotation-x={-Math.PI / 2} position={[-35.875 + i * 10.25, 0.075, 0]}>
            <planeGeometry args={[10.25, 42.5]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#2f8749" : "#267440"} roughness={1} />
          </mesh>
        ))}
        <group position={[0, 0.13, 0]}>
          <mesh position={[0, 0, -21.2]}><boxGeometry args={[80, 0.055, 0.14]} /><meshBasicMaterial color="#fff9e7" /></mesh>
          <mesh position={[0, 0, 21.2]}><boxGeometry args={[80, 0.055, 0.14]} /><meshBasicMaterial color="#fff9e7" /></mesh>
          {[-40, 40].map((x) => <mesh key={x} position={[x, 0, 0]}><boxGeometry args={[0.14, 0.055, 42.5]} /><meshBasicMaterial color="#fff9e7" /></mesh>)}
          <mesh><boxGeometry args={[0.13, 0.055, 42.4]} /><meshBasicMaterial color="#fff9e7" /></mesh>
          <mesh rotation-x={-Math.PI / 2}><ringGeometry args={[9.6, 9.78, 64]} /><meshBasicMaterial color="#fff9e7" side={THREE.DoubleSide} /></mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}><circleGeometry args={[0.35, 20]} /><meshBasicMaterial color="#fff9e7" /></mesh>
          {[-1, 1].map((side) => <group key={side} position={[side * 29, 0, 0]}>
            <mesh position={[side * 7, 0, 0]}><boxGeometry args={[22, 0.055, 32]} /><meshBasicMaterial color="#fff9e7" wireframe /></mesh>
            <mesh position={[side * 7, 0, 0]}><boxGeometry args={[8, 0.055, 16]} /><meshBasicMaterial color="#fff9e7" wireframe /></mesh>
          </group>)}
        </group>

        {/* Goals */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 38.7, 0.2, 0]}>
            <mesh position={[0, 1.2, 0]}><boxGeometry args={[0.16, 2.4, 7.3]} /><meshStandardMaterial color="#f3f2e8" metalness={0.2} /></mesh>
            <mesh position={[-side * 1.2, 2.35, 0]}><boxGeometry args={[2.5, 0.15, 7.3]} /><meshStandardMaterial color="#f3f2e8" /></mesh>
            <mesh position={[-side * 2.4, 1.2, 0]}><boxGeometry args={[0.14, 2.4, 7.3]} /><meshStandardMaterial color="#f3f2e8" /></mesh>
          </group>
        ))}

        {/* Only mount match actors and the dense instanced crowd after entry. */}
        {stadiumMode && (
          <group>
            {players.map((player) => <MatchPlayer key={player.index} player={player} />)}
            <MatchBall />
            <InstancedCrowd />
            <BigScreen z={-26} />
            <BigScreen z={26} rotate />
          </group>
        )}

        {/* Floodlights and visible lighting fixtures */}
        {([[-53, -35], [53, -35], [-53, 35], [53, 35]] as [number, number][]).map(([x, z], index) => <Floodlight key={index} x={x} z={z} />)}

        {/* Dedicated ground-level spectator deck and front-row benches.
            The spawn is on this deck, outside the pitch, looking toward the match. */}
        <group>
          <mesh position={[0, 0.12, 25.4]} receiveShadow>
            <boxGeometry args={[68, 0.24, 5.8]} />
            <meshStandardMaterial color="#343c43" roughness={0.82} />
          </mesh>
          {Array.from({ length: 13 }, (_, i) => {
            const x = -29 + i * 4.8;
            return (
              <group key={i} position={[x, 0.28, 24.3]}>
                <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[2.5, 0.18, 0.72]} /><meshStandardMaterial color={i % 2 ? "#b8b9b3" : "#c7a75b"} roughness={0.65} /></mesh>
                <mesh position={[0, 0.86, -0.28]} castShadow><boxGeometry args={[2.5, 0.78, 0.16]} /><meshStandardMaterial color={i % 2 ? "#b8b9b3" : "#c7a75b"} roughness={0.65} /></mesh>
                {[-0.82, 0.82].map((dx) => <mesh key={dx} position={[dx, 0.22, 0]}><boxGeometry args={[0.12, 0.42, 0.12]} /><meshStandardMaterial color="#60686d" metalness={0.3} /></mesh>)}
              </group>
            );
          })}
        </group>

        {/* Exterior entrance gate */}
        <group position={[0, 0, 43]}>
          {[-8, 8].map((x) => <mesh key={x} position={[x, 3.3, 0]} castShadow><boxGeometry args={[0.9, 6.6, 1.2]} /><meshStandardMaterial color="#b7a16c" metalness={0.5} roughness={0.35} /></mesh>)}
          <mesh position={[0, 6.5, 0]} castShadow><boxGeometry args={[17, 1, 1.4]} /><meshStandardMaterial color="#252f39" metalness={0.45} roughness={0.35} /></mesh>
          <Html position={[0, 7.2, 0]} center distanceFactor={18} style={{ pointerEvents: "none" }}>
            <div style={{ whiteSpace: "nowrap", padding: "7px 13px", borderRadius: 8, color: "#f5d58a", background: "rgba(8,20,29,.92)", border: "1px solid rgba(245,213,138,.7)", fontWeight: 900, letterSpacing: 2, fontSize: 12 }}>ALWAYS ROLEPLAY STADIUM</div>
          </Html>
          <Html position={[0, 2.2, 2]} center distanceFactor={16} style={{ pointerEvents: "auto" }}>
            <button onClick={enterStadium} style={{ whiteSpace: "nowrap", cursor: "pointer", padding: "11px 18px", borderRadius: 999, color: "#071b13", background: "linear-gradient(135deg,#f5dc9b,#c7a354)", border: "2px solid #fff0c6", boxShadow: "0 5px 22px #0008", fontSize: 13, fontWeight: 900, letterSpacing: 1 }}>⚽ ENTER STADIUM · FREE</button>
          </Html>
        </group>

      </group>

      {/* Premium forecourt outside the compact stadium */}
      <group>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} receiveShadow>
          <circleGeometry args={[22, 56]} />
          <meshStandardMaterial color="#a9b0b0" roughness={0.92} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.028, 0]} receiveShadow>
          <ringGeometry args={[16.5, 18.5, 56]} />
          <meshStandardMaterial color="#d1b16c" metalness={0.15} roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
        {[
          { x: -18, z: -10, title: "MATCH DAY GRILL", color: "#9e3e35" },
          { x: 18, z: -10, title: "FAN SHOP", color: "#0c615b" },
          { x: -18, z: 10, title: "CHILL & DRINKS", color: "#263d58" },
          { x: 18, z: 10, title: "SPORTS STORE", color: "#72532d" },
        ].map((shop) => (
          <group key={shop.title} position={[shop.x, 0, shop.z]} scale={[0.55, 0.55, 0.55]}>
            <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[10, 4.2, 7]} />
              <meshStandardMaterial color="#e6e1d6" roughness={0.84} />
            </mesh>
            <mesh position={[0, 2.25, 3.56]}>
              <boxGeometry args={[6.8, 2.5, 0.12]} />
              <meshStandardMaterial color="#14212a" roughness={0.5} />
            </mesh>
            <mesh position={[0, 3.65, 0]} castShadow>
              <boxGeometry args={[12, 0.34, 9]} />
              <meshStandardMaterial color="#d5b36b" metalness={0.25} roughness={0.45} />
            </mesh>
            <mesh position={[0, 4.15, 0]} castShadow>
              <boxGeometry args={[12.8, 0.7, 9.8]} />
              <meshStandardMaterial color={shop.color} metalness={0.18} roughness={0.4} />
            </mesh>
            {[-4.8, 4.8].map((x) => <mesh key={x} position={[x, 3.2, 0]}><cylinderGeometry args={[0.14, 0.18, 1.5, 10]} /><meshStandardMaterial color="#d6b66e" metalness={0.6} roughness={0.3} /></mesh>)}
            <Html position={[0, 4.55, 5.1]} center distanceFactor={13} style={{ pointerEvents: "none" }}>
              <div style={{ whiteSpace: "nowrap", padding: "5px 9px", borderRadius: 5, background: "rgba(9,20,29,.94)", border: "1px solid rgba(214,182,110,.8)", color: "#f5dfaa", fontSize: 10, fontWeight: 900, letterSpacing: 1.4, boxShadow: "0 3px 12px #0007" }}>{shop.title}</div>
            </Html>
          </group>
        ))}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const x = Math.cos(a) * 20.2;
          const z = Math.sin(a) * 20.2;
          return (
            <group key={i} position={[x, 0, z]}>
              <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[1.25, 1.5, 0.5, 12]} /><meshStandardMaterial color="#3b4947" roughness={0.8} /></mesh>
              <mesh position={[0, 2.2, 0]}><cylinderGeometry args={[0.22, 0.32, 3.6, 8]} /><meshStandardMaterial color="#765638" roughness={0.9} /></mesh>
              {[0, 1, 2].map((leaf) => <mesh key={leaf} position={[Math.cos(leaf * 1.25) * 0.8, 3.3 + (leaf % 2) * 0.25, Math.sin(leaf * 1.25) * 0.8]} rotation-z={Math.cos(leaf * 1.25) * 0.65} rotation-x={Math.sin(leaf * 1.25) * 0.45}><coneGeometry args={[0.35, 2.1, 5]} /><meshStandardMaterial color="#23664d" roughness={0.85} /></mesh>)}
              <mesh position={[1.8, 1.25, 0]}><cylinderGeometry args={[0.13, 0.17, 2.5, 8]} /><meshStandardMaterial color="#303a42" metalness={0.55} /></mesh>
              <mesh position={[1.8, 2.5, 0]}><sphereGeometry args={[0.23, 10, 8]} /><meshStandardMaterial color="#ffe8a5" emissive="#ffcb66" emissiveIntensity={0.8} /></mesh>
  
            </group>
          );
        })}
        <Html position={[0, 3, -5]} center distanceFactor={22} style={{ pointerEvents: "none" }}>
          <div style={{ whiteSpace: "nowrap", textAlign: "center", color: "#f3d99a", textShadow: "0 2px 8px #000", fontWeight: 900, letterSpacing: 3, fontSize: 12 }}>ALWAYS ROLEPLAY ARENA · MATCH DAY PLAZA</div>
        </Html>
      </group>
    </group>
  );
}
