import { useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WORLD } from "@/game/city";
import { g } from "@/game/state";

/** A compact, deep oval stadium with a large open pitch, animated match and cheering crowd. */
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
    <group ref={body} position={[player.x, 0, player.z]}>
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

function Supporter({ x, z, y, angle, color, index }: { x: number; z: number; y: number; angle: number; color: string; index: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const cheer = Math.max(0, Math.sin(clock.elapsedTime * 3 + index * 1.91));
    group.current.rotation.z = Math.sin(clock.elapsedTime * 2.3 + index) * 0.035;
    group.current.position.y = y + cheer * 0.12;
  });
  return (
    <group ref={group} position={[x, y, z]} rotation-y={angle}>
      <mesh position={[0, 0.58, 0]}><capsuleGeometry args={[0.2, 0.28, 3, 6]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>
      <mesh position={[0, 0.94, 0]}><sphereGeometry args={[0.145, 8, 7]} /><meshStandardMaterial color="#986747" roughness={0.9} /></mesh>
      <mesh position={[-0.24, 0.78, 0]} rotation-z={-0.58}><capsuleGeometry args={[0.055, 0.34, 3, 5]} /><meshStandardMaterial color="#986747" /></mesh>
      <mesh position={[0.24, 0.78, 0]} rotation-z={0.58}><capsuleGeometry args={[0.055, 0.34, 3, 5]} /><meshStandardMaterial color="#986747" /></mesh>
    </group>
  );
}

function Floodlight({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 15, 0]} castShadow><cylinderGeometry args={[0.28, 0.48, 30, 8]} /><meshStandardMaterial color="#5d6870" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 30, 0]}><boxGeometry args={[4.6, 1.5, 1.3]} /><meshStandardMaterial color="#e8e7dc" emissive="#fff1c0" emissiveIntensity={1.1} /></mesh>
      {[-1.5, -0.5, 0.5, 1.5].map((dx) => <mesh key={dx} position={[dx, 30, 0.72]}><planeGeometry args={[0.55, 0.75]} /><meshBasicMaterial color="#fff5cf" /></mesh>)}
      <pointLight position={[0, 29, 0]} color="#fff0ca" intensity={12} distance={58} decay={2} />
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

  const supporters = useMemo(() => {
    const crowd: { x: number; z: number; y: number; angle: number; color: string; index: number }[] = [];
    const colors = ["#f2f0e7", "#d53d4c", "#24579a", "#e2b84f", "#243c35", "#b9c6d1", "#8a4d37"];
    let index = 0;
    // Audience is placed on the stepped seating decks, facing inward toward the pitch.
    for (let row = 0; row < 3; row++) {
      const rx = 48 + row * 3.3;
      const rz = 29 + row * 2.3;
      const y = 4.8 + row * 3.5;
      const count = 38;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        crowd.push({ x: Math.cos(angle) * rx, z: Math.sin(angle) * rz, y, angle: -angle, color: colors[index % colors.length]!, index });
        index++;
      }
    }
    return crowd;
  }, []);

  const enterStadium = () => {
    g.playerPos.set(0, 0, 27);
    g.playerYaw = Math.PI;
    g.camYaw = 0;
    g.camPitch = 0.25;
    g.camDistance = 16;
    g.drivingId = null;
    g.playerSpeed = 0;
  };

  return (
    <group>
      {/* Plain world beyond the stadium */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[WORLD * 3, WORLD * 3]} />
        <meshStandardMaterial color="#668553" roughness={1} metalness={0} />
      </mesh>

      {/* Stadium bowl: reduced exterior footprint, deep layered seating and a completely open centre */}
      <group>
        {/* Thick outer shell walls; these sit outside the open pitch rather than over the player */}
        <mesh position={[0, 5.2, 0]} scale={[60, 1, 40]} castShadow receiveShadow>
          <cylinderGeometry args={[1, 0.96, 10.4, 96, 1, true]} />
          <meshStandardMaterial color="#444d56" roughness={0.78} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.12, 0]} scale={[60, 40, 1]} receiveShadow>
          <ringGeometry args={[0.72, 1, 96]} />
          <meshStandardMaterial color="#777f83" roughness={0.92} side={THREE.DoubleSide} />
        </mesh>

        {/* Structural concrete bands and tier fascia make the bowl feel thick and architectural */}
        {[3.2, 6.8, 10.4, 14, 17.4].map((y, i) => (
          <mesh key={y} rotation-x={-Math.PI / 2} position={[0, y, 0]} scale={[60 - i * 2.6, 40 - i * 2.1, 1]} castShadow>
            <ringGeometry args={[0.73, 1, 96]} />
            <meshStandardMaterial color={i % 2 ? "#c6c9c7" : "#737c83"} roughness={0.82} side={THREE.DoubleSide} />
          </mesh>
        ))}
        {[
          { rx: 57, rz: 37.5, y: 5.3, color: "#d4d4cd" },
          { rx: 54, rz: 35.1, y: 8.7, color: "#c83e50" },
          { rx: 51, rz: 32.8, y: 12.1, color: "#e0e0d8" },
          { rx: 48, rz: 30.4, y: 15.5, color: "#356cb2" },
          { rx: 45, rz: 28.2, y: 18.2, color: "#d7d9d3" },
        ].map((tier, index) => (
          <mesh key={index} rotation-x={-Math.PI / 2} position={[0, tier.y, 0]} scale={[tier.rx, tier.rz, 1]} castShadow receiveShadow>
            <ringGeometry args={[0.84, 1, 112]} />
            <meshStandardMaterial color={tier.color} roughness={0.78} side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* Roof rim is narrow and elevated so it does not cover the field or spectators */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 21, 0]} scale={[59, 39, 1]} castShadow>
          <ringGeometry args={[0.94, 1, 112]} />
          <meshStandardMaterial color="#252f3a" metalness={0.4} roughness={0.45} side={THREE.DoubleSide} />
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

        {/* 22 animated footballers and a moving match ball */}
        {players.map((player) => <MatchPlayer key={player.index} player={player} />)}
        <MatchBall />

        {/* Cheering crowd throughout the three visible seating tiers */}
        {supporters.map((person) => <Supporter key={person.index} {...person} />)}

        {/* Stadium screens face the seats from both ends */}
        <BigScreen z={-26} />
        <BigScreen z={26} rotate />

        {/* Floodlights and visible lighting fixtures */}
        {[[-53, -35], [53, -35], [-53, 35], [53, 35]].map(([x, z], index) => <Floodlight key={index} x={x} z={z} />)}

        {/* Exterior entrance gate */}
        <group position={[0, 0, 43]}>
          {[-8, 8].map((x) => <mesh key={x} position={[x, 3.3, 0]} castShadow><boxGeometry args={[0.9, 6.6, 1.2]} /><meshStandardMaterial color="#b7a16c" metalness={0.5} roughness={0.35} /></mesh>)}
          <mesh position={[0, 6.5, 0]} castShadow><boxGeometry args={[17, 1, 1.4]} /><meshStandardMaterial color="#252f39" metalness={0.45} roughness={0.35} /></mesh>
          <Html position={[0, 7.2, 0]} center distanceFactor={18} style={{ pointerEvents: "none" }}>
            <div style={{ whiteSpace: "nowrap", padding: "7px 13px", borderRadius: 8, color: "#f5d58a", background: "rgba(8,20,29,.92)", border: "1px solid rgba(245,213,138,.7)", fontWeight: 900, letterSpacing: 2, fontSize: 12 }}>ALWAYS ROLEPLAY STADIUM</div>
          </Html>
          <Html position={[0, 2.2, 2]} center distanceFactor={16} style={{ pointerEvents: "auto" }}>
            <button onClick={enterStadium} style={{ whiteSpace: "nowrap", cursor: "pointer", padding: "11px 18px", borderRadius: 999, color: "#071b13", background: "linear-gradient(135deg,#f5dc9b,#c7a354)", border: "2px solid #fff0c6", boxShadow: "0 5px 22px #0008", fontSize: 13, fontWeight: 900, letterSpacing: 1 }}>⚽ ENTER STADIUM</button>
          </Html>
        </group>
      </group>
    </group>
  );
}
