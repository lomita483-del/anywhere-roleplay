import { useEffect, useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/game/store";
import { NEW_MAP_ROADS, NEW_MAP_ROAD_WIDTHS, NEW_MAP_SCALE, NEW_MAP_BUILDINGS, NEW_MAP_MARKET_STALLS, NEW_MAP_TREES, NEW_MAP_HILLS, NEW_MAP_GROUND_PATCHES, NEW_MAP_JUNCTIONS, NEW_MAP_ROAD_ENDPOINTS, NEW_MAP_POIS, NEW_MAP_DISTRICTS } from "@/game/newMap";
import { VehicleBody } from "./GameWorld";

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
  const palmTrunkRef = useRef<THREE.InstancedMesh>(null);
  const palmFrondRef = useRef<THREE.InstancedMesh>(null);
  const spots = useMemo(() => NEW_MAP_TREES, []);
  const palms = useMemo(()=>spots.map((p,i)=>({...p,i})).filter(p=>p.type==="palm"),[spots]);
  const roundTrees = useMemo(()=>spots.filter(p=>p.type==="round"),[spots]);
  useEffect(() => {
    const dummy = new THREE.Object3D();
    const trunks=trunkRef.current,crowns=crownRef.current,palmTrunks=palmTrunkRef.current,fronds=palmFrondRef.current;
    if(!trunks||!crowns||!palmTrunks||!fronds)return;
    let treeIndex=0;
    spots.forEach((p,i)=>{
      if(p.type==="round"){
        dummy.position.set(p.x,p.h*0.45,p.z);dummy.scale.set(0.32,p.h,0.32);dummy.rotation.set(0,i*0.2,0);dummy.updateMatrix();trunks.setMatrixAt(treeIndex,dummy.matrix);
        dummy.position.set(p.x,p.h+0.65,p.z);dummy.scale.set(1.05+(i%3)*0.18,1.15+(i%4)*0.12,1.05+(i%3)*0.18);dummy.updateMatrix();crowns.setMatrixAt(treeIndex,dummy.matrix);
        treeIndex++;
      }
    });
    palms.forEach((p,i)=>{
      dummy.position.set(p.x,p.h*1.05,p.z);dummy.scale.set(0.22,p.h*2.1,0.22);dummy.rotation.set(0,0,0.05);dummy.updateMatrix();palmTrunks.setMatrixAt(i,dummy.matrix);
      for(let f=0;f<5;f++){
        const angle=(f/5)*Math.PI*2+i*0.73;
        dummy.position.set(p.x+Math.cos(angle)*0.95,p.h*2.0,p.z+Math.sin(angle)*0.95);
        dummy.rotation.set(Math.cos(angle)*0.22,-angle,Math.sin(angle)*0.22);
        dummy.scale.set(2.15,0.12,0.34);dummy.updateMatrix();fronds.setMatrixAt(i*5+f,dummy.matrix);
      }
    });
    for(const mesh of [trunks,crowns,palmTrunks,fronds]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
  },[spots,palms]);
  return <>
    <instancedMesh ref={trunkRef} args={[undefined,undefined,roundTrees.length]} frustumCulled={false}><cylinderGeometry args={[0.5,0.65,1,6]} /><meshStandardMaterial color="#71533b" roughness={1} /></instancedMesh>
    <instancedMesh ref={crownRef} args={[undefined,undefined,roundTrees.length]} frustumCulled={false}><icosahedronGeometry args={[1,1]} /><meshStandardMaterial color="#467442" roughness={1} /></instancedMesh>
    <instancedMesh ref={palmTrunkRef} args={[undefined,undefined,palms.length]} frustumCulled={false}><cylinderGeometry args={[0.5,0.72,1,7]} /><meshStandardMaterial color="#8c6b42" roughness={1} /></instancedMesh>
    <instancedMesh ref={palmFrondRef} args={[undefined,undefined,palms.length*5]} frustumCulled={false}><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#39764a" roughness={1} /></instancedMesh>
  </>;
}

/** Dense Lagos low-rise district rendered with shared instanced geometry for mobile performance. */
function LagosResidentialDistrict() {
  const body = useRef<THREE.InstancedMesh>(null);
  const plots = useRef<THREE.InstancedMesh>(null);
  const roofs = useRef<THREE.InstancedMesh>(null);
  const windows = useRef<THREE.InstancedMesh>(null);
  const balconies = useRef<THREE.InstancedMesh>(null);
  const tanks = useRef<THREE.InstancedMesh>(null);
  const dishes = useRef<THREE.InstancedMesh>(null);
  const walls = useRef<THREE.InstancedMesh>(null);
  const gates = useRef<THREE.InstancedMesh>(null);
  const laundry = useRef<THREE.InstancedMesh>(null);
  const shopFronts = useRef<THREE.InstancedMesh>(null);
  const rollerDoors = useRef<THREE.InstancedMesh>(null);
  const shopSigns = useRef<THREE.InstancedMesh>(null);
  const homes = useMemo(() => NEW_MAP_BUILDINGS.filter(b => b.district === "residential"), []);
  const windowData = useMemo(() => homes.flatMap((b, i) => {
    const floors = Math.max(2, Math.floor(b.h / 2.5));
    return Array.from({ length: floors * 3 }, (_, j) => ({
      x: b.x - b.w * 0.32 + (j % 3) * b.w * 0.32,
      y: 1.7 + Math.floor(j / 3) * 2.05,
      z: b.z + b.d / 2 + 0.035,
      w: 0.7, h: 0.9,
      color: (i + j) % 7 === 0 ? "#c9a15e" : "#6696a5",
    }));
  }), [homes]);
  const balconyData = useMemo(() => homes.flatMap((b, i) => Array.from({ length: Math.max(1, Math.floor(b.h / 5)) }, (_, j) => ({
    x: b.x, y: 2.7 + j * 5, z: b.z + b.d / 2 + 0.34, w: b.w * 0.9, d: 0.7,
    color: i % 3 === 0 ? "#d8d3c5" : "#b7b7ad",
  }))), [homes]);
  useEffect(() => {
    const dummy = new THREE.Object3D();
    const write = (ref: React.RefObject<THREE.InstancedMesh | null>, count: number, transform: (i: number) => { x:number;y:number;z:number;sx:number;sy:number;sz:number;ry?:number;color?:string }) => {
      const mesh = ref.current;
      if (!mesh) return;
      for (let i = 0; i < count; i++) {
        const d = transform(i);
        dummy.position.set(d.x, d.y, d.z);
        dummy.scale.set(d.sx, d.sy, d.sz);
        dummy.rotation.set(0, d.ry ?? 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        if (d.color) mesh.setColorAt(i, new THREE.Color(d.color));
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    };
    write(plots, homes.length, i => { const b=homes[i]!; return {x:b.x,y:0.08,z:b.z,sx:8.8,sy:0.16,sz:8.8,color:i%2?"#a6ad81":"#b7b28d"}; });
    write(body, homes.length, i => { const b=homes[i]!; return {x:b.x,y:b.h/2+0.2,z:b.z,sx:b.w,sy:b.h,sz:b.d,color:b.color}; });
    write(roofs, homes.length, i => { const b=homes[i]!; return {x:b.x,y:b.h+0.32,z:b.z,sx:b.w+0.25,sy:0.32,sz:b.d+0.25,color:i%4===0?"#b7b7ad":"#d4d1c6"}; });
    write(windows, windowData.length, i => { const w=windowData[i]!; return {x:w.x,y:w.y,z:w.z,sx:w.w,sy:w.h,sz:0.06,color:w.color}; });
    write(balconies, balconyData.length, i => { const b=balconyData[i]!; return {x:b.x,y:b.y,z:b.z,sx:b.w,sy:0.14,sz:b.d,color:b.color}; });
    write(tanks, homes.length, i => { const b=homes[i]!; return {x:b.x+(i%2?1.3:-1.3),y:b.h+1.05,z:b.z-0.9,sx:0.72,sy:1.15,sz:0.72,color:"#64777b"}; });
    write(dishes, homes.length, i => { const b=homes[i]!; return {x:b.x-1.5,y:b.h+0.75,z:b.z+1.2,sx:0.45,sy:0.22,sz:0.45,ry:i*0.4,color:"#e0e0d7"}; });
    write(walls, homes.length*3, i => { const b=homes[Math.floor(i/3)]!; const part=i%3; return {x:b.x+(part===0?0:part===1?-4.45:4.45),y:0.48,z:b.z+(part===0?4.4:0),sx:part===0?8.9:0.18,sy:0.82,sz:0.18,color:"#c5c0b0"}; });
    write(gates, homes.length, i => { const b=homes[i]!; return {x:b.x+2.4,y:0.58,z:b.z+4.43,sx:1.15,sy:1.05,sz:0.18,color:"#434b4b"}; });
    const shopCount=Math.ceil(homes.length/8);
    write(shopFronts, shopCount, i => { const b=homes[i*8]!; return {x:b.x-0.8,y:1.45,z:b.z+b.d/2+0.08,sx:2.6,sy:1.5,sz:0.07,color:"#6c9eaa"}; });
    write(rollerDoors, shopCount, i => { const b=homes[i*8]!; return {x:b.x+2.0,y:1.25,z:b.z+b.d/2+0.09,sx:1.15,sy:1.8,sz:0.1,color:"#7c8585"}; });
    write(shopSigns, shopCount, i => { const b=homes[i*8]!; return {x:b.x,y:2.75,z:b.z+b.d/2+0.16,sx:5.2,sy:0.48,sz:0.16,color:["#1f5547","#8d3d32","#294e73","#b47a31"][i%4]!}; });
    write(laundry, Math.floor(homes.length/3), i => { const b=homes[(i*3)%homes.length]!; return {x:b.x-0.7,y:3.3+(i%2)*2.5,z:b.z+b.d/2+0.55,sx:0.8,sy:0.42,sz:0.08,color:["#d9d2bf","#bb7564","#8ea8ba","#e3c56f"][i%4]!}; });
  }, [homes, windowData, balconyData]);
  return <>
    <instancedMesh ref={plots} args={[undefined, undefined, homes.length]} receiveShadow><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#ffffff" roughness={1} /></instancedMesh>
    <instancedMesh ref={body} args={[undefined, undefined, homes.length]} castShadow receiveShadow><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#ffffff" roughness={0.9} /></instancedMesh>
    <instancedMesh ref={roofs} args={[undefined, undefined, homes.length]} castShadow receiveShadow><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#ffffff" roughness={0.82} /></instancedMesh>
    <instancedMesh ref={windows} args={[undefined, undefined, windowData.length]}><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.32} /></instancedMesh>
    <instancedMesh ref={balconies} args={[undefined, undefined, balconyData.length]} castShadow><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#ffffff" roughness={0.75} /></instancedMesh>
    <instancedMesh ref={tanks} args={[undefined, undefined, homes.length]} castShadow><cylinderGeometry args={[0.5,0.5,1,8]} /><meshStandardMaterial color="#ffffff" roughness={0.72} /></instancedMesh>
    <instancedMesh ref={dishes} args={[undefined, undefined, homes.length]}><coneGeometry args={[0.5,0.35,8]} /><meshStandardMaterial color="#ffffff" roughness={0.55} /></instancedMesh>
    <instancedMesh ref={walls} args={[undefined, undefined, homes.length*3]} castShadow><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#ffffff" roughness={0.95} /></instancedMesh>
    <instancedMesh ref={gates} args={[undefined, undefined, homes.length]}><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#ffffff" metalness={0.35} roughness={0.55} /></instancedMesh>
    <instancedMesh ref={shopFronts} args={[undefined, undefined, Math.ceil(homes.length/8)]}><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#ffffff" metalness={.15} roughness={.32} /></instancedMesh>
    <instancedMesh ref={rollerDoors} args={[undefined, undefined, Math.ceil(homes.length/8)]}><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#ffffff" metalness={.2} roughness={.68} /></instancedMesh>
    <instancedMesh ref={shopSigns} args={[undefined, undefined, Math.ceil(homes.length/8)]}><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#ffffff" roughness={.7} /></instancedMesh>
    <instancedMesh ref={laundry} args={[undefined, undefined, Math.floor(homes.length/3)]}><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#ffffff" roughness={0.8} /></instancedMesh>
    <Html position={[NEW_MAP_DISTRICTS.find(d=>d.id==="residential")!.x, 22, NEW_MAP_DISTRICTS.find(d=>d.id==="residential")!.z-18]} center distanceFactor={30} style={{pointerEvents:"none"}}><div style={{padding:"5px 9px",whiteSpace:"nowrap",border:"1px solid #e0bd70",borderRadius:5,background:"#071923e8",color:"#fff0c8",fontSize:10,fontWeight:900,letterSpacing:1.6}}>RESIDENTIAL DISTRICT</div></Html>
  </>;
}

function RoadFurniture() {
  const lampRef = useRef<THREE.InstancedMesh>(null);
  const crossingRef = useRef<THREE.InstancedMesh>(null);
  const signRef = useRef<THREE.InstancedMesh>(null);
  const stopRef = useRef<THREE.InstancedMesh>(null);
  const placements = useMemo(() => {
    const lamps: {x:number;z:number;yaw:number}[] = [];
    const crossings: {x:number;z:number;yaw:number}[] = [];
    const signs: {x:number;z:number;yaw:number}[] = [];
    NEW_MAP_ROADS.forEach((path, r) => {
      if((NEW_MAP_ROAD_WIDTHS[r]??5)===5) return;
      const curve = new THREE.CatmullRomCurve3(path.map(([x,z])=>new THREE.Vector3(x,0,z)),false,"catmullrom",0.22);
      const length=curve.getLength();
      for(let d=12;d<length;d+=32){
        const t=curve.getUtoTmapping(0,d),p=curve.getPointAt(t),tan=curve.getTangentAt(t);
        const yaw=Math.atan2(-tan.z,tan.x);
        lamps.push({x:p.x+tan.z*5.8,z:p.z-tan.x*5.8,yaw});
        if(d%3<1) signs.push({x:p.x-tan.z*5.2,z:p.z+tan.x*5.2,yaw});
      }
    });
    // Zebra crossings belong at real junctions, not at arbitrary road midpoints.
    const junctionCrossings:{x:number;z:number;yaw:number}[]=NEW_MAP_JUNCTIONS.map(([x,z])=>({x,z,yaw:0}));
    junctionCrossings.forEach(({x,z,yaw})=>{for(let stripe=-3;stripe<=3;stripe++)crossings.push({x:x+Math.cos(yaw+Math.PI/2)*stripe*1.05,z:z+Math.sin(yaw+Math.PI/2)*stripe*1.05,yaw});});
    return {lamps,crossings,signs};
  }, []);
  useEffect(()=>{
    const dummy=new THREE.Object3D();
    const write=(mesh:THREE.InstancedMesh|null,items:{x:number;z:number;yaw:number}[],kind:"lamp"|"cross"|"sign"|"stop")=>{
      if(!mesh)return;
      items.forEach((p,i)=>{
        dummy.position.set(p.x,kind==="lamp"?3.3:kind==="cross"?0.072:kind==="sign"?1.8:2.4,p.z);
        dummy.rotation.set(0,p.yaw,0);
        dummy.scale.set(kind==="lamp"?0.16:kind==="cross"?7.2:kind==="sign"?0.9:3.5,kind==="lamp"?6.6:kind==="cross"?0.018:kind==="sign"?1.6:0.18,kind==="lamp"?0.16:kind==="cross"?0.22:kind==="sign"?0.12:1.5);
        dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
    };
    write(lampRef.current,placements.lamps,"lamp");write(crossingRef.current,placements.crossings,"cross");write(signRef.current,placements.signs,"sign");
    write(stopRef.current,placements.lamps.filter((_,i)=>i%7===0),"stop");
  },[placements]);
  return <>
    <instancedMesh ref={lampRef} args={[undefined,undefined,placements.lamps.length]} castShadow><cylinderGeometry args={[0.5,0.5,1,6]} /><meshStandardMaterial color="#353e40" roughness={0.6} /></instancedMesh>
    <instancedMesh ref={crossingRef} args={[undefined,undefined,placements.crossings.length]}><boxGeometry args={[1,1,1]} /><meshBasicMaterial color="#f4f0df" polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} /></instancedMesh>
    <instancedMesh ref={signRef} args={[undefined,undefined,placements.signs.length]}><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#d9bd69" roughness={0.7} /></instancedMesh>
    <instancedMesh ref={stopRef} args={[undefined,undefined,Math.max(1,placements.lamps.filter((_,i)=>i%7===0).length)]}><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#d7c9a8" roughness={0.85} /></instancedMesh>
  </>;
}

// Curved arterial routes replace the old oversized rectangular road grid.
// The S-bends and U-shaped stadium loop are designed to read clearly from the isometric camera.
const CITY_ROAD_PATHS = NEW_MAP_ROADS;

function createRoadGeometry(path: [number, number][], width: number, y: number) {
  const curve = new THREE.CatmullRomCurve3(path.map(([x, z]) => new THREE.Vector3(x, y, z)), false, "catmullrom", 0.22);
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
    const width = NEW_MAP_ROAD_WIDTHS[index] ?? 5;
    const isLocal = width === 5;
    const isNarrowConnector = false;
    const sidewalkWidth = (isLocal || isNarrowConnector) ? width + 0.8 : width + 2.8;
    return { index, ...createRoadGeometry(path, width, 0.05), sidewalk: createRoadGeometry(path, sidewalkWidth, 0.03) };
  }), []);
  const dashData = useMemo(() => {
    const out: { x: number; z: number; yaw: number; width: number }[] = [];
    roadData.forEach((road, roadIndex) => {
      const length = road.curve.getLength();
      const isLocal = (NEW_MAP_ROAD_WIDTHS[roadIndex] ?? 5) === 5;
      const spacing = isLocal ? 16 : 10.5;
      for (let d = 4; d < length - 4; d += spacing) {
        const t = road.curve.getUtoTmapping(0, d);
        const p = road.curve.getPointAt(t);
        const tangent = road.curve.getTangentAt(t);
        out.push({ x: p.x, z: p.z, yaw: Math.atan2(-tangent.z, tangent.x), width: isLocal ? 1.8 : 3.2 });
      }
    });
    return out;
  }, [roadData]);
  const marksRef = useRef<THREE.InstancedMesh>(null);
  const edgeRef = useRef<THREE.InstancedMesh>(null);
  const edgeData = useMemo(() => {
    const out:{x:number;z:number;yaw:number}[]=[];
    roadData.forEach((road)=>{const length=road.curve.getLength(),half=(NEW_MAP_ROAD_WIDTHS[road.index]??5)/2-.35;for(let d=2;d<length-2;d+=3.4){const t=road.curve.getUtoTmapping(0,d),p=road.curve.getPointAt(t),tan=road.curve.getTangentAt(t),yaw=Math.atan2(-tan.z,tan.x);for(const side of [-1,1])out.push({x:p.x+tan.z*half*side,z:p.z-tan.x*half*side,yaw});}});
    return out;
  },[roadData]);
  useEffect(() => {
    const mesh = marksRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    dashData.forEach((d, i) => {
      dummy.position.set(d.x, 0.07, d.z);
      dummy.rotation.set(0, d.yaw, 0);
      dummy.scale.set(d.width, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    const edges=edgeRef.current;
    if(edges){edgeData.forEach((e,i)=>{dummy.position.set(e.x,.075,e.z);dummy.rotation.set(0,e.yaw,0);dummy.scale.set(2.7,1,1);dummy.updateMatrix();edges.setMatrixAt(i,dummy.matrix);});edges.instanceMatrix.needsUpdate=true;edges.computeBoundingSphere();}
  }, [dashData,edgeData]);
  return (
    <>
      {roadData.map((road) => <mesh key={"sidewalk-"+road.index} geometry={road.sidewalk.geometry} receiveShadow>
        <meshStandardMaterial color="#aeb1ab" roughness={0.98} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={road.index + 1} polygonOffsetUnits={1} />
      </mesh>)}
      {roadData.map((road) => <mesh key={road.index} geometry={road.geometry} receiveShadow>
        <meshStandardMaterial color="#3d454b" roughness={0.96} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-road.index - 1} polygonOffsetUnits={-1} />
      </mesh>)}
      {NEW_MAP_ROAD_ENDPOINTS.map((p,i)=><group key={"road-cap-"+i}>
        <mesh rotation-x={-Math.PI/2} position={[p.x,.034,p.z]}><circleGeometry args={[(p.width+2.4)/2,16]}/><meshStandardMaterial color="#aeb1ab" roughness={.98}/></mesh>
        <mesh rotation-x={-Math.PI/2} position={[p.x,.051,p.z]}><circleGeometry args={[p.width/2,16]}/><meshStandardMaterial color="#3d454b" roughness={.96}/></mesh>
      </group>)}
      {NEW_MAP_JUNCTIONS.map(([x,z],i)=><group key={"junction-"+i}>
        <mesh rotation-x={-Math.PI/2} position={[x,.035,z]}><circleGeometry args={[5.2,20]}/><meshStandardMaterial color="#aeb1ab" roughness={.98}/></mesh>
        <mesh rotation-x={-Math.PI/2} position={[x,.052,z]}><circleGeometry args={[4.05,20]}/><meshStandardMaterial color="#3d454b" roughness={.96}/></mesh>
      </group>)}
      <instancedMesh ref={marksRef} args={[undefined, undefined, dashData.length]} frustumCulled={false}>
        <boxGeometry args={[1, 0.035, 0.16]} />
        <meshBasicMaterial color="#f4f0df" polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </instancedMesh>
      <instancedMesh ref={edgeRef} args={[undefined,undefined,edgeData.length]} frustumCulled={false}>
        <boxGeometry args={[1,0.025,0.12]}/>
        <meshBasicMaterial color="#f8f5e8" polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3}/>
      </instancedMesh>
    </>
  );
}

function DrainCovers() {
  const ref=useRef<THREE.InstancedMesh>(null);
  const points=useMemo(()=>{
    const out:{x:number;z:number;yaw:number}[]=[];
    NEW_MAP_ROADS.forEach((path,ri)=>{
      const curve=new THREE.CatmullRomCurve3(path.map(([x,z])=>new THREE.Vector3(x,0,z)),false,"catmullrom",.22);
      for(const t of [.22,.52,.82]){const p=curve.getPointAt(t),tan=curve.getTangentAt(t);out.push({x:p.x+tan.z*5.1,z:p.z-tan.x*5.1,yaw:Math.atan2(-tan.z,tan.x)});}
    });
    return out;
  },[]);
  useEffect(()=>{
    const mesh=ref.current;if(!mesh)return;const dummy=new THREE.Object3D();
    points.forEach((p,i)=>{dummy.position.set(p.x,.055,p.z);dummy.rotation.y=p.yaw;dummy.scale.set(1.2,.035,.62);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
  },[points]);
  return <instancedMesh ref={ref} args={[undefined,undefined,points.length]} frustumCulled={false}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#30383a" metalness={.35} roughness={.72} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3}/></instancedMesh>;
}

function CityNamedTraffic() {
  const refs=useRef<(THREE.Group|null)[]>([]);
  const quality=useGame(s=>s.graphicsQuality);
  const models=useMemo(()=>["danfo","taxi","sedan","suv","police","keke","danfo","taxi","sedan","suv"],[]);
  const count=quality==="low"?2:quality==="high"?8:4;
  const routes=useMemo(()=>NEW_MAP_ROADS.map(path=>new THREE.CatmullRomCurve3(path.map(([x,z])=>new THREE.Vector3(x,0,z)),false,"catmullrom",.22)),[]);
  useFrame((state)=>{
    const t=state.clock.elapsedTime;
    for(let i=0;i<count;i++){
      const group=refs.current[i];if(!group)continue;
      const route=routes[(i*2+1)%routes.length]!;
      const u=((t*(quality==="low"?0.018:0.022)+i*.137)%1);
      const point=route.getPointAt(u),tangent=route.getTangentAt(u);
      group.position.set(point.x,0,point.z);
      group.rotation.y=Math.atan2(tangent.x,tangent.z);
      group.visible=true;
    }
    for(let i=count;i<refs.current.length;i++){const group=refs.current[i];if(group)group.visible=false;}
  });
  return <>{models.slice(0,count).map((model,i)=><group key={model+"-"+i} ref={el=>{refs.current[i]=el;}} scale={model==="danfo" ? 0.72 : model==="keke" ? 0.8 : 0.78}><VehicleBody model={model}/></group>)}</>;
}

function CityTraffic() {
  const bodyRef=useRef<THREE.InstancedMesh>(null);
  const glassRef=useRef<THREE.InstancedMesh>(null);
  const wheelRef=useRef<THREE.InstancedMesh>(null);
  const quality=useGame(s=>s.graphicsQuality);
  const dummy=useMemo(()=>new THREE.Object3D(),[]);
  const count=quality==="low"?14:quality==="high"?40:26;
  const routes=useMemo(()=>NEW_MAP_ROADS.map(path=>new THREE.CatmullRomCurve3(path.map(([x,z])=>new THREE.Vector3(x,0,z)),false,"catmullrom",.22)),[]);
  useEffect(()=>{
    const body=bodyRef.current;if(!body)return;
    const colors=["#e2d9c8","#d7b14d","#39799a","#b7473c","#31553e","#f0eee5","#444d51","#c9c7bd"];
    for(let i=0;i<count;i++)body.setColorAt(i,new THREE.Color(colors[i%colors.length]!));
    if(body.instanceColor)body.instanceColor.needsUpdate=true;
  },[count]);
  useFrame((state)=>{
    const body=bodyRef.current,glass=glassRef.current,wheels=wheelRef.current;if(!body||!glass||!wheels)return;
    const t=state.clock.elapsedTime;
    for(let i=0;i<count;i++){
      const route=routes[i%routes.length]!,length=route.getLength();
      const startDistance=i*(length/count);
      const baseSpeed=quality==="low"?4.8:5.8+(i%4)*.7;
      let distance=(t*baseSpeed+startDistance)%length;
      let point=route.getPointAt(distance/length);
      const nearStadium=Math.hypot(point.x,point.z)<32;
      const nearPort=Math.hypot(point.x-116,point.z-120)<32;
      if(nearStadium||nearPort)distance=(t*baseSpeed*.56+startDistance)%length;
      point=route.getPointAt(distance/length);
      const tangent=route.getTangentAt(distance/length),yaw=Math.atan2(-tangent.z,tangent.x);
      const isBus=i%7===0,isVan=i%5===0&&!isBus;
      const lengthScale=isBus?1.75:isVan?1.35:1;
      const heightScale=isBus?1.15:1;
      dummy.position.set(point.x,.34,point.z);dummy.rotation.set(0,yaw,0);dummy.scale.set(lengthScale,heightScale,1);dummy.updateMatrix();body.setMatrixAt(i,dummy.matrix);
      dummy.position.set(point.x,.66,point.z);dummy.rotation.set(0,yaw,0);dummy.scale.set(lengthScale*.48,.35,.78);dummy.updateMatrix();glass.setMatrixAt(i,dummy.matrix);
      // Four small shared wheels per vehicle.
      for(let w=0;w<4;w++){
        const side=w<2?-1:1,front=w%2===0?1:-1;
        const ox=Math.cos(yaw)*front*.78-Math.sin(yaw)*side*.52;
        const oz=Math.sin(yaw)*front*.78+Math.cos(yaw)*side*.52;
        dummy.position.set(point.x+ox,.13,point.z+oz);dummy.rotation.set(0,yaw,0);dummy.scale.set(.36,.28,.18);dummy.updateMatrix();wheels.setMatrixAt(i*4+w,dummy.matrix);
      }
    }
    body.instanceMatrix.needsUpdate=true;glass.instanceMatrix.needsUpdate=true;wheels.instanceMatrix.needsUpdate=true;
  });
  return <>
    <instancedMesh ref={bodyRef} args={[undefined,undefined,count]} frustumCulled={false} castShadow><boxGeometry args={[2.6,.75,1.25]}/><meshStandardMaterial color="#ffffff" roughness={.68}/></instancedMesh>
    <instancedMesh ref={glassRef} args={[undefined,undefined,count]} frustumCulled={false}><boxGeometry args={[1.25,.42,1.05]}/><meshStandardMaterial color="#8eb0bb" metalness={.2} roughness={.25}/></instancedMesh>
    <instancedMesh ref={wheelRef} args={[undefined,undefined,count*4]} frustumCulled={false}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#24282a" roughness={.95}/></instancedMesh>
  </>;
}

function TerrainDetails() {
  const patchRef=useRef<THREE.InstancedMesh>(null); const hillRef=useRef<THREE.InstancedMesh>(null);
  const patches=useMemo(()=>NEW_MAP_GROUND_PATCHES,[]);
  const hills=useMemo(()=>NEW_MAP_HILLS,[]);
  useEffect(()=>{const dummy=new THREE.Object3D(),patch=patchRef.current,hill=hillRef.current;
    if(patch)patches.forEach((p,i)=>{dummy.position.set(p.x,-.01,p.z);dummy.scale.set(p.w,1,p.d);dummy.rotation.y=(i%3)*.08;dummy.updateMatrix();patch.setMatrixAt(i,dummy.matrix);patch.setColorAt(i,new THREE.Color(i%2?"#92975f":"#718657"));});
    if(hill)hills.forEach((p,i)=>{dummy.position.set(p.x,p.h*.35,p.z);dummy.scale.set(p.w,p.h,p.d);dummy.rotation.y=i*.35;dummy.updateMatrix();hill.setMatrixAt(i,dummy.matrix);hill.setColorAt(i,new THREE.Color(i%2?"#969960":"#7d8e58"));});
    for(const mesh of [patch,hill])if(mesh){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();}
  },[patches,hills]);
  return <><instancedMesh ref={patchRef} args={[undefined,undefined,patches.length]} receiveShadow><boxGeometry args={[1,.03,1]}/><meshStandardMaterial color="#ffffff" roughness={1}/></instancedMesh><instancedMesh ref={hillRef} args={[undefined,undefined,hills.length]} receiveShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#ffffff" roughness={1}/></instancedMesh></>;
}

function MarketStreetLife() {
  const tables=useRef<THREE.InstancedMesh>(null);
  const canopies=useRef<THREE.InstancedMesh>(null);
  const generators=useRef<THREE.InstancedMesh>(null);
  const umbrellas=useRef<THREE.InstancedMesh>(null);
  const billboards=useRef<THREE.InstancedMesh>(null);
  const poles=useRef<THREE.InstancedMesh>(null);
  const stalls=useMemo(()=>NEW_MAP_MARKET_STALLS,[]);
  const vendorSpots=useMemo(()=> ([[-83,-132],[-75,-132],[-67,-132],[-83,-140],[-75,-140],[-67,-140]] as [number,number][]).map(([x,z])=>({x,z})),[]);
  const poleSpots=useMemo(()=>Array.from({length:18},(_,i)=>({x:-150+(i%9)*34,z:-20+Math.floor(i/9)*44})),[]);
  useEffect(()=>{
    const dummy=new THREE.Object3D();
    const write=(ref:{current:THREE.InstancedMesh|null},items:{x:number;z:number;w?:number;h?:number;d?:number;color?:string}[],defaults:[number,number,number])=>{
      const mesh=ref.current;if(!mesh)return;
      items.forEach((p,i)=>{dummy.position.set(p.x,p.h??0.8,p.z);dummy.scale.set(p.w??defaults[0],p.h??defaults[1],p.d??defaults[2]);dummy.rotation.set(0,0,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(p.color)mesh.setColorAt(i,new THREE.Color(p.color));});
      mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();
    };
    write(tables,stalls.map(s=>({...s,h:0.7,w:s.w,d:s.d})),[3.4,.7,2.4]);
    write(canopies,stalls.map(s=>({...s,h:2.5,w:s.w+0.5,d:s.d+0.3})),[3.9,.25,2.7]);
    write(generators,vendorSpots.map((p,i)=>({...p,h:.55,w:1.4,d:.9,color:i%2?"#3b4547":"#697071"})),[1.4,.55,.9]);
    write(umbrellas,vendorSpots.map((p,i)=>({...p,x:p.x+2.5,h:2.5,w:2.5,d:2.5,color:["#db5546","#e1b548","#4387a0","#4d8054"][i%4]!})),[2.5,.25,2.5]);
    write(billboards,[{x:-82,z:-88,h:8,w:1,d:12,color:"#203d4b"},{x:8,z:-100,h:7,w:1,d:12,color:"#9c3d35"},{x:44,z:20,h:6,w:1,d:10,color:"#2c5145"},{x:110,z:83,h:6,w:1,d:10,color:"#b98a3f"}],[1,8,12]);
    write(poles,poleSpots.map(p=>({...p,h:5,w:.18,d:.18,color:"#464b49"})),[.18,5,.18]);
  },[stalls,vendorSpots,poleSpots]);
  return <>
    <instancedMesh ref={tables} args={[undefined,undefined,stalls.length]} castShadow><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#ffffff" roughness={.9}/></instancedMesh>
    <instancedMesh ref={canopies} args={[undefined,undefined,stalls.length]} castShadow><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#ffffff" roughness={.85}/></instancedMesh>
    <instancedMesh ref={generators} args={[undefined,undefined,vendorSpots.length]} castShadow><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="#ffffff" roughness={.85}/></instancedMesh>
    <instancedMesh ref={umbrellas} args={[undefined,undefined,vendorSpots.length]} castShadow><coneGeometry args={[.5,.22,8]}/><meshStandardMaterial color="#ffffff" roughness={.85}/></instancedMesh>
    <instancedMesh ref={billboards} args={[undefined,undefined,4]} castShadow><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#ffffff" roughness={.8}/></instancedMesh>
    <instancedMesh ref={poles} args={[undefined,undefined,poleSpots.length]}><cylinderGeometry args={[.5,.5,1,6]}/><meshStandardMaterial color="#ffffff" roughness={.7}/></instancedMesh>
    {poleSpots.slice(0,8).map((p,i)=><mesh key={"wire-"+i} position={[p.x+16,6,p.z+10]} rotation-y={.4}><boxGeometry args={[36,.06,.06]}/><meshBasicMaterial color="#282d30"/></mesh>)}
    <Html position={[-34,4,-104]} center distanceFactor={32} style={{pointerEvents:"none"}}><div style={{padding:"4px 8px",whiteSpace:"nowrap",background:"#532c18e8",border:"1px solid #e0b85d",color:"#fff0c8",fontSize:10,fontWeight:900,letterSpacing:1.2}}>CENTRAL MARKET & DEPOT</div></Html>
  </>;
}

function CityPedestrians() {
  const bodies=useRef<THREE.InstancedMesh>(null);
  const heads=useRef<THREE.InstancedMesh>(null);
  const quality=useGame(s=>s.graphicsQuality);
  const count=quality==="low"?20:quality==="high"?80:45;
  const anchors=useMemo(()=>[[-38,-76],[-28,-72],[-110,32],[-102,35],[0,0],[12,8],[78,10],[98,-40],[-112,118]] as [number,number][],[]);
  useEffect(()=>{
    const body=bodies.current,head=heads.current;if(!body||!head)return;
    for(let i=0;i<count;i++){body.setColorAt(i,new THREE.Color(["#c94f3d","#2c536f","#d6b75e","#e4d7bd","#42764c","#704e82"][i%6]!));head.setColorAt(i,new THREE.Color(["#754a31","#8c5b3d","#9b6947","#5b3a29"][i%4]!));}
    if(body.instanceColor)body.instanceColor.needsUpdate=true;if(head.instanceColor)head.instanceColor.needsUpdate=true;
  },[count]);
  useFrame((state)=>{
    const body=bodies.current,head=heads.current;if(!body||!head)return;
    const dummy=new THREE.Object3D(),t=state.clock.elapsedTime;
    for(let i=0;i<count;i++){
      const a=anchors[i%anchors.length]!,phase=i*1.73;
      const x=a[0]+Math.sin(t*.32+phase)*2.8,z=a[1]+Math.cos(t*.27+phase)*2.2;
      dummy.position.set(x,.78,z);dummy.scale.set(.34,.95,.28);dummy.rotation.y=Math.sin(t*.32+phase)*.7;dummy.updateMatrix();body.setMatrixAt(i,dummy.matrix);
      dummy.position.set(x,1.48,z);dummy.scale.set(.23,.23,.23);dummy.rotation.set(0,0,0);dummy.updateMatrix();head.setMatrixAt(i,dummy.matrix);
    }
    body.instanceMatrix.needsUpdate=true;head.instanceMatrix.needsUpdate=true;
  });
  return <>
    <instancedMesh ref={bodies} args={[undefined,undefined,count]} frustumCulled={false} castShadow><capsuleGeometry args={[.28,.52,3,5]}/><meshStandardMaterial color="#ffffff" roughness={.9}/></instancedMesh>
    <instancedMesh ref={heads} args={[undefined,undefined,count]} frustumCulled={false}><sphereGeometry args={[.23,7,6]}/><meshStandardMaterial color="#ffffff" roughness={.9}/></instancedMesh>
  </>;
}

function WaterShimmer() {
  const lake=useRef<THREE.MeshStandardMaterial>(null);
  const port=useRef<THREE.MeshStandardMaterial>(null);
  const pond=useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state)=>{
    const pulse=.1+((Math.sin(state.clock.elapsedTime*1.4)+1)*.045);
    for(const material of [lake.current,port.current,pond.current])if(material){material.emissiveIntensity=pulse;material.roughness=.28+Math.sin(state.clock.elapsedTime*.7)*.04;}
  });
  return <>
    <mesh rotation-x={-Math.PI/2} position={[-112,.08,118]}><circleGeometry args={[18,40]}/><meshStandardMaterial ref={lake} color="#3a9fbd" emissive="#237a95" emissiveIntensity={.1} transparent opacity={.32} roughness={.3}/></mesh>
    <mesh rotation-x={-Math.PI/2} position={[121,.08,120]}><planeGeometry args={[84,60]}/><meshStandardMaterial ref={port} color="#3998b5" emissive="#237a95" emissiveIntensity={.1} transparent opacity={.22} roughness={.3}/></mesh>
    <mesh rotation-x={-Math.PI/2} position={[-92,.035,103]}><ringGeometry args={[7.2,9.1,24]}/><meshStandardMaterial color="#d7c391" roughness={1} side={THREE.DoubleSide}/></mesh>
    <mesh rotation-x={-Math.PI/2} position={[-92,.06,103]}><circleGeometry args={[7,24]}/><meshStandardMaterial ref={pond} color="#4aa7b9" emissive="#237a95" emissiveIntensity={.1} transparent opacity={.25} roughness={.3}/></mesh>
  </>;
}

function AnimatedAircraft() {
  const first=useRef<THREE.Group>(null);
  const second=useRef<THREE.Group>(null);
  const quality=useGame(s=>s.graphicsQuality);
  const activePlanes=quality==="low"?0:quality==="medium"?1:2;
  useFrame((state)=>{
    const t=state.clock.elapsedTime;
    if(first.current){first.current.position.set(-12+Math.cos(t*.12)*55,18,-142+Math.sin(t*.12)*24);first.current.rotation.y=-t*.12;}
    if(second.current){second.current.position.set(12+Math.cos(t*.1+Math.PI)*55,15,-142+Math.sin(t*.1+Math.PI)*24);second.current.rotation.y=-t*.1;}
  });
  const plane=<><mesh><boxGeometry args={[7,.65,1.05]}/><meshStandardMaterial color="#e8e9e3" roughness={.6}/></mesh><mesh><boxGeometry args={[2.1,.12,8]}/><meshStandardMaterial color="#d3d8d5" roughness={.55}/></mesh><mesh position={[-3.1,.5,0]}><boxGeometry args={[1.2,.9,.18]}/><meshStandardMaterial color="#7ca8b6"/></mesh></>;
  return <>{activePlanes>0&&<group ref={first}>{plane}</group>}{activePlanes>1&&<group ref={second}>{plane}</group>}</>;
}

function AnimatedWatercraft() {
  const cargo=useRef<THREE.Group>(null);
  const boats=useRef<(THREE.Group|null)[]>([]);
  useFrame((state)=>{
    const t=state.clock.elapsedTime;
    if(cargo.current){cargo.current.position.set(116+Math.sin(t*.035)*18,.15,120+Math.sin(t*.055)*5);cargo.current.rotation.y=Math.sin(t*.035)*.12;}
    boats.current.forEach((boat,i)=>{if(!boat)return;const a=t*.18+i*2.2;boat.position.set(-112+Math.cos(a)*(5+i*2),.2,118+Math.sin(a)*(3+i));boat.rotation.y=-a;});
  });
  return <>
    <group ref={cargo}>
      <mesh position={[0,.35,0]}><boxGeometry args={[16,.8,4.4]}/><meshStandardMaterial color="#263d49" roughness={.8}/></mesh>
      <mesh position={[5,.95,0]}><boxGeometry args={[3,1.4,3.8]}/><meshStandardMaterial color="#e3e0d4" roughness={.8}/></mesh>
      {Array.from({length:6},(_,i)=><mesh key={i} position={[-5+(i%3)*3,1.35,Math.floor(i/3)*1.4-.7]}><boxGeometry args={[2.7,1.1,1.25]}/><meshStandardMaterial color={["#d04e3e","#d5ad45","#367a9c","#47784f"][i%4]!} roughness={.85}/></mesh>)}
    </group>
    {[0,1,2].map(i=><group key={i} ref={el=>{boats.current[i]=el;}}><mesh><boxGeometry args={[3,.28,1.1]}/><meshStandardMaterial color="#6b4d34" roughness={.9}/></mesh><mesh position={[0,.35,0]}><boxGeometry args={[.8,.35,.65]}/><meshStandardMaterial color="#e6d8b8" roughness={.8}/></mesh></group>)}
  </>;
}

function AnimatedSmoke() {
  const smoke=useRef<THREE.InstancedMesh>(null);
  useFrame((state)=>{
    const mesh=smoke.current;if(!mesh)return;
    const dummy=new THREE.Object3D(),t=state.clock.elapsedTime;
    for(let i=0;i<18;i++){
      const stack=i%3,x=-153+stack*10,z=-46;
      const phase=(t*.35+i*.41)%5;
      dummy.position.set(x+Math.sin(t*.2+i)*.45,10+phase,z+Math.cos(t*.2+i)*.4);
      const size=.55+phase*.18;dummy.scale.set(size,size,size);dummy.rotation.set(0,t*.15+i,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;
  });
  return <instancedMesh ref={smoke} args={[undefined,undefined,18]} frustumCulled={false}><sphereGeometry args={[1,6,5]}/><meshStandardMaterial color="#b8b8ad" transparent opacity={.22} depthWrite={false} roughness={1}/></instancedMesh>;
}

function CityBirdsAndFlags() {
  const birds=useRef<THREE.InstancedMesh>(null);
  const flags=useRef<(THREE.Group|null)[]>([]);
  useFrame((state)=>{
    const mesh=birds.current,t=state.clock.elapsedTime;
    if(mesh){const dummy=new THREE.Object3D();for(let i=0;i<18;i++){const a=t*.12+i*2.4;dummy.position.set(Math.cos(a)*(38+(i%4)*13),18+(i%5)*1.6,Math.sin(a)*(32+(i%3)*15));dummy.rotation.y=-a;dummy.scale.set(1,.08,.32);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;}
    flags.current.forEach((flag,i)=>{if(flag)flag.rotation.z=Math.sin(t*2.2+i*1.7)*.09;});
  });
  return <>
    <instancedMesh ref={birds} args={[undefined,undefined,18]} frustumCulled={false}><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#273238" roughness={.9}/></instancedMesh>
    {([[ -110,6,32],[116,6,104],[0,5,17],[6,5,-92]] as [number,number,number][]).map(([x,y,z],i)=><group key={i} ref={el=>{flags.current[i]=el;}} position={[x,y,z]}>
      <mesh><cylinderGeometry args={[.06,.08,5,5]}/><meshStandardMaterial color="#b6b5a7" metalness={.3}/></mesh>
      <mesh position={[.7,1.55,0]}><boxGeometry args={[1.4,.8,.06]}/><meshStandardMaterial color={i%2?"#13834b":"#f3f0e5"} side={THREE.DoubleSide}/></mesh>
    </group>)}
  </>;
}

function CityEcosystem() {
  const airportTerminal=NEW_MAP_BUILDINGS.find(b=>b.id==="airport-terminal")!;
  const industrialDistrict=NEW_MAP_DISTRICTS.find(d=>d.id==="industrial")!;
  const civicDistrict=NEW_MAP_DISTRICTS.find(d=>d.id==="civic")!;
  const lakeDistrict=NEW_MAP_DISTRICTS.find(d=>d.id==="lake-park")!;
  const portDistrict=NEW_MAP_DISTRICTS.find(d=>d.id==="port")!;
  const craneRefs=useRef<(THREE.Group|null)[]>([]);
  const quality=useGame(s=>s.graphicsQuality);
  const parkedAircraftCount=quality==="low"?3:quality==="medium"?5:8;
  useFrame((state)=>{craneRefs.current.forEach((crane,i)=>{if(crane)crane.rotation.y=Math.sin(state.clock.elapsedTime*.32+i*1.4)*.08;});});
  const buildings = useMemo<CityBlock[]>(() => NEW_MAP_BUILDINGS.filter(b => b.district !== "residential").map((b) => ({ x:b.x,z:b.z,w:b.w,d:b.d,h:b.h,color:b.color,label:b.label })), []);
  return <>
    {/* Curving S-roads and a U-shaped boulevard connect compact districts. */}
    <CurvedRoadNetwork />
    <TerrainDetails />
    <MarketStreetLife />
    <CityPedestrians />
    <WaterShimmer />
    <AnimatedAircraft />
    <AnimatedWatercraft />
    <AnimatedSmoke />
    <CityBirdsAndFlags />
    <RoadFurniture />
    <DrainCovers />
    <Html position={[industrialDistrict.x,12,industrialDistrict.z]} center distanceFactor={38} style={{pointerEvents:"none"}}><div style={{padding:"4px 8px",whiteSpace:"nowrap",background:"#071923df",border:"1px solid #d7b66c",color:"#fff0c8",fontSize:9,fontWeight:900,letterSpacing:1.3}}>INDUSTRIAL DISTRICT</div></Html>
    <Html position={[civicDistrict.x,12,civicDistrict.z-20]} center distanceFactor={36} style={{pointerEvents:"none"}}><div style={{padding:"4px 8px",whiteSpace:"nowrap",background:"#071923df",border:"1px solid #d7b66c",color:"#fff0c8",fontSize:9,fontWeight:900,letterSpacing:1.3}}>CIVIC & OFFICE BLOCKS</div></Html>
    <Html position={[lakeDistrict.x,8,lakeDistrict.z-35]} center distanceFactor={38} style={{pointerEvents:"none"}}><div style={{padding:"4px 8px",whiteSpace:"nowrap",background:"#071923df",border:"1px solid #d7b66c",color:"#fff0c8",fontSize:9,fontWeight:900,letterSpacing:1.3}}>LAKE PARK & RESORT</div></Html>
    {/* North airport: runways, taxiways, terminal, aircraft and tower. */}
    <group position={[airportTerminal.x, 0, airportTerminal.z-48]}>
      {[-15, 15].map((x) => <group key={x} position={[x, 0.04, 0]} rotation-y={x < 0 ? -0.16 : 0.16}>
        <mesh rotation-x={-Math.PI / 2}><planeGeometry args={[9, 82]} /><meshStandardMaterial color="#4a5054" roughness={1} /></mesh>
        {Array.from({ length: 8 }, (_, i) => <mesh key={i} rotation-x={-Math.PI / 2} position={[0, 0.015, -34 + i * 9]}><planeGeometry args={[0.22, 4]} /><meshBasicMaterial color="#f5f1df" /></mesh>)}
      </group>)}
      <mesh position={[0, 1.6, 48]}><boxGeometry args={[44, 3.2, 13]} /><meshStandardMaterial color="#c5c9c6" metalness={0.3} roughness={0.5} /></mesh>
      <mesh position={[0, 3.3, 48]}><boxGeometry args={[34, 0.5, 9]} /><meshStandardMaterial color="#7ea9b6" metalness={0.25} roughness={0.3} /></mesh>
      <mesh position={[27, 5, 48]}><cylinderGeometry args={[1.2, 1.5, 10, 8]} /><meshStandardMaterial color="#d0d4d2" /></mesh>
      <mesh position={[27, 10, 48]}><boxGeometry args={[4, 2.4, 4]} /><meshStandardMaterial color="#7194a2" metalness={0.2} /></mesh>
      {([[-25, -20], [-5, -30], [8, -12], [24, -23], [2, -4], [-28, -8], [15, -38], [30, -18]] as [number, number][]).slice(0, parkedAircraftCount).map(([x,z],i) => <group key={i} position={[x, 0.7, z]} rotation-y={i%2?0.3:-0.2}>
        <mesh><boxGeometry args={[9, 1.1, 1.8]} /><meshStandardMaterial color={i%2?"#e9e8df":"#d4d9d8"} /></mesh>
        <mesh position={[0, 0.15, 0]}><boxGeometry args={[2.5, 0.16, 12]} /><meshStandardMaterial color="#d6dbd9" /></mesh>
        <mesh position={[0, 0.7, 0]}><boxGeometry args={[2, 0.2, 1.2]} /><meshStandardMaterial color="#7fa9b8" /></mesh>
      </group>)}
      <Html position={[0, 8, 60]} center distanceFactor={40} style={{ pointerEvents: "none" }}><div style={{ whiteSpace: "nowrap", padding: "5px 10px", color: "#fff0c8", background: "#071923e8", border: "1px solid #d7b66c", fontWeight: 900, letterSpacing: 2, fontSize: 11 }}>NEW MAP INTERNATIONAL AIRPORT</div></Html>
    </group>
    {/* University sports court and landscaped quad. */}
    <group position={[NEW_MAP_BUILDINGS.find(b=>b.id==="university")!.x+13, 0, NEW_MAP_BUILDINGS.find(b=>b.id==="university")!.z+16]}>
      <mesh rotation-x={-Math.PI/2} position={[0, 0.035, 0]}><planeGeometry args={[22, 13]} /><meshStandardMaterial color="#2d7a43" roughness={1} /></mesh>
      <mesh rotation-x={-Math.PI/2} position={[0, 0.05, 0]}><planeGeometry args={[0.12, 12]} /><meshBasicMaterial color="#f3f0dc" /></mesh>
      <mesh rotation-x={-Math.PI/2} position={[0, 0.05, 0]}><ringGeometry args={[3.1, 3.2, 24]} /><meshBasicMaterial color="#f3f0dc" side={THREE.DoubleSide} /></mesh>
    </group>
    {/* Port and waterfront with container stacks, crane frames and ships. */}
    <group position={[NEW_MAP_BUILDINGS.find(b=>b.id==="port-terminal")!.x, 0, NEW_MAP_BUILDINGS.find(b=>b.id==="port-terminal")!.z]}>
      <mesh rotation-x={-Math.PI / 2} position={[5, 0, 0]}><planeGeometry args={[88, 64]} /><meshStandardMaterial color="#267b9c" roughness={0.34} metalness={0.1} /></mesh>
      <mesh position={[-22, 0.28, -1]}><boxGeometry args={[47, 0.55, 17]} /><meshStandardMaterial color="#777e7e" roughness={0.9} /></mesh>
      {Array.from({ length: 28 }, (_, i) => <mesh key={i} position={[-40 + (i % 7) * 5.6, 1.3 + Math.floor(i / 7) * 1.65, -5 + Math.floor(i / 7) * 3.6]} castShadow><boxGeometry args={[5, 1.5, 3.1]} /><meshStandardMaterial color={["#d45d45", "#d4ad4d", "#396a89", "#b9c2be", "#406b55"][i % 5]!} roughness={0.8} /></mesh>)}
      {([[-27, -11], [8, -12]] as [number, number][]).map(([x,z],i) => <group key={i} ref={el=>{craneRefs.current[i]=el;}} position={[x, 0, z]}>
        <mesh position={[0, 7, 0]}><boxGeometry args={[1, 14, 1]} /><meshStandardMaterial color="#d4b76f" metalness={0.35} /></mesh>
        <mesh position={[4, 13, 0]}><boxGeometry args={[9, 0.8, 0.8]} /><meshStandardMaterial color="#d4b76f" metalness={0.35} /></mesh>
        <mesh position={[7, 6, 0]}><boxGeometry args={[0.8, 12, 0.8]} /><meshStandardMaterial color="#d4b76f" metalness={0.35} /></mesh>
      </group>)}
      {[40, 65].map((x,i) => <group key={i} position={[x, 0.5, 30]}>
        <mesh><boxGeometry args={[19, 1.3, 5]} /><meshStandardMaterial color="#263b49" metalness={0.35} roughness={0.4} /></mesh>
        <mesh position={[0, 1.4, -1]}><boxGeometry args={[7, 1.2, 3]} /><meshStandardMaterial color="#e4e3d8" /></mesh>
      </group>)}
      <Html position={[portDistrict.x-22, 8, portDistrict.z-16]} center distanceFactor={35} style={{ pointerEvents: "none" }}><div style={{ whiteSpace: "nowrap", padding: "5px 10px", color: "#fff0c8", background: "#071923e8", border: "1px solid #d7b66c", fontWeight: 900, letterSpacing: 2, fontSize: 11 }}>PORT OF LAGOS</div></Html>
    </group>
    {/* Scenic lake and sandy recreational edge, south-west. */}
    <group position={[NEW_MAP_POIS.find(p=>p.id==="lake")!.x, 0, NEW_MAP_POIS.find(p=>p.id==="lake")!.z]}>
      <mesh rotation-x={-Math.PI/2} position={[0, 0.035, 0]}><circleGeometry args={[27, 40]} /><meshStandardMaterial color="#287f9d" roughness={0.35} /></mesh>
      <mesh rotation-x={-Math.PI/2} position={[0, 0.05, 0]}><ringGeometry args={[27, 32, 40]} /><meshStandardMaterial color="#d7c391" roughness={1} side={THREE.DoubleSide} /></mesh>
      {[-1, 1].map((side) => <group key={side} position={[side * 29, 0.3, 0]}><mesh><boxGeometry args={[5, 0.6, 3.5]} /><meshStandardMaterial color="#c5a779" /></mesh><mesh position={[0, 1.8, -0.7]}><boxGeometry args={[5, 3, 0.3]} /><meshStandardMaterial color="#876344" /></mesh><mesh position={[0, 3.4, 0]}><boxGeometry args={[6, 0.3, 4.5]} /><meshStandardMaterial color="#cfa85d" /></mesh></group>)}
    </group>
    {/* District labels and premium map title. */}
    <Html position={[-25, 8, -166]} center distanceFactor={48} style={{ pointerEvents: "none" }}>
      <div style={{ whiteSpace: "nowrap", textAlign: "center", padding: "12px 22px", borderRadius: 9, color: "#f8e4ac", background: "linear-gradient(135deg,rgba(7,19,29,.97),rgba(19,46,48,.94))", border: "2px solid rgba(224,188,105,.9)", boxShadow: "0 8px 28px #0008", fontWeight: 1000, letterSpacing: 5, fontSize: 25 }}>NEW MAP<div style={{ marginTop: 4, fontSize: 10, letterSpacing: 3, color: "#d8e3d9" }}>A LIVING LAGOS-INSPIRED CITY · ALWAYS ROLEPLAY</div></div>
    </Html>
    <CityTrees />
    {buildings.map((b, i) => <CityBuilding key={i} b={b} />)}
    {quality === "high" ? <CityNamedTraffic /> : <CityTraffic />}
  </>;
}

function StadiumPlaza() {
  return <>
    <mesh rotation-x={-Math.PI/2} position={[0,0.015,0]} receiveShadow><ringGeometry args={[13.6,23,72]}/><meshStandardMaterial color="#b9b9ad" roughness={.92} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1}/></mesh>
    <mesh rotation-x={-Math.PI/2} position={[0,0.025,0]}><ringGeometry args={[18.5,19.2,72]}/><meshStandardMaterial color="#d7c18c" roughness={.8}/></mesh>
    <group position={[0,0,18]}>
      <mesh position={[0,.18,0]}><cylinderGeometry args={[3.1,3.5,.36,24]}/><meshStandardMaterial color="#d1c6ae" roughness={.7}/></mesh>
      <mesh position={[0,.42,0]}><cylinderGeometry args={[2.3,2.5,.18,24]}/><meshStandardMaterial color="#398ca6" emissive="#1e6c83" emissiveIntensity={.16} roughness={.28}/></mesh>
      <mesh position={[0,.72,0]}><cylinderGeometry args={[.5,.7,.55,12]}/><meshStandardMaterial color="#d8bd76" metalness={.35} roughness={.5}/></mesh>
      <mesh position={[0,1.1,0]}><sphereGeometry args={[.42,10,8]}/><meshStandardMaterial color="#7cc4d4" transparent opacity={.8} roughness={.25}/></mesh>
    </group>
    <group position={[-23,0,9]}>
      <mesh position={[0,1.5,0]} castShadow receiveShadow><boxGeometry args={[10,3,7]}/><meshStandardMaterial color="#d5c8af" roughness={.85}/></mesh>
      <mesh position={[0,3.25,0]} castShadow><boxGeometry args={[10.8,.5,7.8]}/><meshStandardMaterial color="#a84438" roughness={.8}/></mesh>
      <mesh position={[0,1.25,3.55]}><boxGeometry args={[4,1.7,.1]}/><meshStandardMaterial color="#6d9eaa" metalness={.15} roughness={.3}/></mesh>
      <mesh position={[0,2.55,3.62]}><boxGeometry args={[7,.55,.16]}/><meshStandardMaterial color="#243c43"/></mesh>
    </group>
    <group position={[23,0,9]}>
      <mesh position={[0,1.5,0]} castShadow receiveShadow><boxGeometry args={[10,3,7]}/><meshStandardMaterial color="#d5c8af" roughness={.85}/></mesh>
      <mesh position={[0,3.25,0]} castShadow><boxGeometry args={[10.8,.5,7.8]}/><meshStandardMaterial color="#315f91" roughness={.8}/></mesh>
      <mesh position={[0,1.25,3.55]}><boxGeometry args={[4,1.7,.1]}/><meshStandardMaterial color="#6d9eaa" metalness={.15} roughness={.3}/></mesh>
      <mesh position={[0,2.55,3.62]}><boxGeometry args={[7,.55,.16]}/><meshStandardMaterial color="#243c43"/></mesh>
    </group>
    {[-4,-1.3,1.3,4].map((x,i)=><mesh key={i} position={[x,.95,14.4]} castShadow><boxGeometry args={[.35,1.9,.35]}/><meshStandardMaterial color={i%2?"#c8a65f":"#263b47"} metalness={.3} roughness={.55}/></mesh>)}
    <mesh position={[0,2.1,14.4]}><boxGeometry args={[9,.25,.45]}/><meshStandardMaterial color="#e1bd6b" emissive="#b58b3b" emissiveIntensity={.2}/></mesh>
  </>;
}

function NewMapSky() { return <mesh frustumCulled={false} renderOrder={-1000}><sphereGeometry args={[390,32,20]}/><shaderMaterial side={THREE.BackSide} depthWrite={false} vertexShader={`varying float vSkyY; void main(){vSkyY=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`} fragmentShader={`varying float vSkyY; void main(){float t=smoothstep(-0.08,0.72,vSkyY);vec3 horizon=vec3(0.78,0.86,0.87);vec3 zenith=vec3(0.20,0.43,0.66);vec3 col=mix(horizon,zenith,t);gl_FragColor=vec4(col,1.0);}`}/></mesh>; }
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
  const hdEnabled = typeof window === "undefined" || new URLSearchParams(window.location.search).get("hd") !== "0";

  return (
    <group>
      {hdEnabled && <NewMapSky />}
      {/* The entire city is intentionally compact so destinations are close together. */}
      <group scale={[NEW_MAP_SCALE, NEW_MAP_SCALE, NEW_MAP_SCALE]}>
        {/* Named, connected districts with S-curves and a U-shaped stadium boulevard. */}
        <CityEcosystem />
         <LagosResidentialDistrict />
      </group>
      {/* Olive terrain base, stadium plaza and entrance forecourt */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[220, 220, 1, 1]} />
        <meshStandardMaterial color="#89935e" roughness={1} metalness={0} />
      </mesh>

      <StadiumPlaza />
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
