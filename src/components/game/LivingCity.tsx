import { useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/game/store";

/** Lagos street life props: roadside kiosks, public landmarks, flyover and ambient people. */
function MarketCanopy({ x, z, color, label, phase = 0 }: { x: number; z: number; color: string; label: string; phase?: number }) {
  return <group position={[x, 0, z]} rotation-y={phase}>
    {[-1.35, 1.35].map((px) => [-0.85, 0.85].map((pz) => <mesh key={px + ":" + pz} position={[px, 1.25, pz]} castShadow><cylinderGeometry args={[0.045, 0.06, 2.5, 6]} /><meshStandardMaterial color="#514638" /></mesh>))}
    <mesh position={[0, 2.42, 0]} rotation-y={Math.PI / 4} castShadow><coneGeometry args={[2.15, 0.55, 4]} /><meshStandardMaterial color={color} roughness={0.95} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 2.15, 1.12]} castShadow><boxGeometry args={[3.1, 0.28, 0.08]} /><meshStandardMaterial color={color} roughness={1} /></mesh>
    <mesh position={[0, 0.82, 0.2]} castShadow><boxGeometry args={[2.8, 0.22, 1.05]} /><meshStandardMaterial color="#775238" roughness={0.92} /></mesh>
    {[-0.8, 0, 0.8].map((px, i) => <mesh key={px} position={[px, 1.04, 0.3]} castShadow><boxGeometry args={[0.55, 0.32, 0.62]} /><meshStandardMaterial color={["#d9a441", "#c84f36", "#4d9a68"][i] ?? "#d9a441"} /></mesh>)}
    <Html position={[0, 2.8, 0]} center distanceFactor={24}><div className="whitespace-nowrap rounded bg-[#1b211c]/90 px-2 py-1 text-[9px] font-bold tracking-wide text-amber-100">{label}</div></Html>
  </group>;
}


function StreetUmbrella({ x, z, color, label, phase = 0 }: { x: number; z: number; color: string; label: string; phase?: number }) {
  return <group position={[x, 0, z]} rotation-y={phase}>
    <mesh position={[0, 1.95, 0]} castShadow><cylinderGeometry args={[0.035, 0.05, 3.9, 6]} /><meshStandardMaterial color="#8a7353" roughness={0.9} /></mesh>
    <mesh position={[0, 3.55, 0]} castShadow><coneGeometry args={[1.85, 0.5, 8]} /><meshStandardMaterial color={color} roughness={0.92} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 0.8, 0.25]} castShadow><boxGeometry args={[1.8, 0.18, 0.8]} /><meshStandardMaterial color="#70472d" roughness={0.95} /></mesh>
    {[-0.55, 0, 0.55].map((px, i) => <mesh key={px} position={[px, 1.02, 0.3]} castShadow><boxGeometry args={[0.42, 0.28, 0.48]} /><meshStandardMaterial color={["#d9a441", "#be493a", "#53935a"][i] ?? "#d9a441"} /></mesh>)}
    <mesh position={[0.82, 0.43, 0.82]} castShadow><cylinderGeometry args={[0.22, 0.22, 0.18, 10]} /><meshStandardMaterial color="#493a2d" /></mesh>
    <Html position={[0, 3.9, 0]} center distanceFactor={23}><div className="whitespace-nowrap rounded-sm border border-white/20 bg-[#1a1712]/90 px-2 py-1 text-[9px] font-black uppercase text-amber-100">{label}</div></Html>
  </group>;
}

function Shopfront({ x, z, color, title, phase = 0 }: { x: number; z: number; color: string; title: string; phase?: number }) {
  return <group position={[x, 0, z]} rotation-y={phase}>
    <mesh position={[0, 1.5, 0]} castShadow receiveShadow><boxGeometry args={[5.4, 3, 3.8]} /><meshStandardMaterial color="#a68b6b" roughness={0.95} /></mesh>
    <mesh position={[0, 3.12, 0]} castShadow><boxGeometry args={[5.8, 0.22, 4.15]} /><meshStandardMaterial color="#4c4a42" roughness={0.96} /></mesh>
    <mesh position={[0, 2.5, 1.94]}><boxGeometry args={[3.7, 0.68, 0.12]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>
    <Html position={[0, 2.5, 2.04]} center distanceFactor={20}><div className="max-w-[105px] whitespace-nowrap text-center text-[10px] font-black uppercase tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">{title}</div></Html>
    <mesh position={[0, 1.12, 1.98]} castShadow><boxGeometry args={[4.3, 0.12, 0.5]} /><meshStandardMaterial color="#573d2b" roughness={0.95} /></mesh>
    {[-1.35, 0, 1.35].map((px, i) => <mesh key={px} position={[px, 1.33, 2.03]}><boxGeometry args={[0.62, 0.35, 0.4]} /><meshStandardMaterial color={["#c7a33e", "#8e4a35", "#4d8756"][i] ?? "#c7a33e"} roughness={0.9} /></mesh>)}
  </group>;
}

function LagosStreetInfrastructure() {
  const poles = [-78, -52, -26, 0, 26, 52, 78];
  return <group>
    {poles.map((x) => <group key={x} position={[x, 0, 7.5]}>
      <mesh position={[0, 3.8, 0]} castShadow><cylinderGeometry args={[0.16, 0.23, 7.6, 7]} /><meshStandardMaterial color="#55564f" roughness={0.95} /></mesh>
      <mesh position={[0.6, 7.15, 0]} rotation-z={-0.22}><boxGeometry args={[1.5, 0.12, 0.12]} /><meshStandardMaterial color="#55564f" /></mesh>
      <mesh position={[0.9, 7.0, 0]}><boxGeometry args={[0.4, 0.16, 0.3]} /><meshStandardMaterial color="#d6d0b4" emissive="#f4c86b" emissiveIntensity={0.1} /></mesh>
    </group>)}
    {poles.slice(0, -1).map((x, i) => <mesh key={"wire" + x} position={[x + 13, 7.05, 7.5]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.025, 0.025, 26, 4]} /><meshStandardMaterial color="#252b2d" roughness={1} /></mesh>)}
    <group position={[73, 0, 9]}>
      <mesh position={[0, 4.1, 0]} castShadow><cylinderGeometry args={[0.12, 0.18, 8.2, 6]} /><meshStandardMaterial color="#575650" /></mesh>
      <mesh position={[0, 1.1, 0.45]} castShadow><boxGeometry args={[1.7, 1.2, 1.3]} /><meshStandardMaterial color="#4e5352" roughness={0.9} /></mesh>
      <mesh position={[0, 1.74, 0.45]}><boxGeometry args={[1.3, 0.08, 0.8]} /><meshStandardMaterial color="#272c2d" /></mesh>
      <Html position={[0, 2.1, 1.15]} center distanceFactor={20}><div className="rounded bg-[#111718]/90 px-1.5 py-1 text-[8px] font-black text-amber-100">GENERATOR</div></Html>
    </group>
    <group position={[-78, 0, 4]}>
      <mesh position={[0, 5.4, 0]} castShadow><cylinderGeometry args={[0.2, 0.25, 10.8, 7]} /><meshStandardMaterial color="#494c49" /></mesh>
      <mesh position={[1.8, 8.1, 0]} castShadow><boxGeometry args={[8, 3.2, 0.3]} /><meshStandardMaterial color="#123c35" roughness={0.9} /></mesh>
      <mesh position={[1.8, 8.1, 0.2]}><boxGeometry args={[7.55, 2.7, 0.08]} /><meshStandardMaterial color="#e0bd56" roughness={0.85} /></mesh>
      <Html position={[1.8, 8.1, 0.28]} center distanceFactor={30}><div className="whitespace-nowrap text-center text-[11px] font-black tracking-widest text-[#17241c]">YABA · NO SHARPING NO GOING</div></Html>
    </group>
  </group>;
}

function StreetPerson({ x, z, phase, shirt, scale = 1 }: { x: number; z: number; phase: number; shirt: string; scale?: number }) {
  const root = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!root.current) return;
    const t = clock.elapsedTime * 0.65 + phase;
    root.current.position.x = x + Math.sin(t) * 1.1;
    root.current.position.z = z + Math.cos(t * 0.7) * 0.7;
    root.current.rotation.y = Math.atan2(Math.cos(t) * 0.7, Math.cos(t * 0.7) * -1.1);
    const gait = Math.sin(t * 5) * 0.12;
    root.current.children[0] && (root.current.children[0].rotation.x = gait);
  });
  const skin = ["#6c402d", "#8e5b3f", "#ad7958", "#573323"][Math.floor((phase * 13) % 4)] ?? "#8e5b3f";
  return <group ref={root} position={[x, 0, z]} scale={scale}>
    <group>
      <mesh position={[0, 0.98, 0]} castShadow><capsuleGeometry args={[0.22, 0.62, 4, 8]} /><meshStandardMaterial color={shirt} roughness={0.86} /></mesh>
      <mesh position={[0, 1.57, 0]} castShadow><sphereGeometry args={[0.19, 12, 10]} /><meshStandardMaterial color={skin} roughness={0.94} /></mesh>
      <mesh position={[0, 1.69, -0.025]}><sphereGeometry args={[0.195, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} /><meshStandardMaterial color={phase % 2 ? "#1d1b1a" : "#25202a"} roughness={0.95} /></mesh>
      {[-0.105, 0.105].map((px) => <mesh key={px} position={[px, 0.34, 0]} castShadow><capsuleGeometry args={[0.075, 0.42, 3, 6]} /><meshStandardMaterial color={phase % 3 ? "#303f58" : "#44362b"} /></mesh>)}
      {[-0.27, 0.27].map((px) => <mesh key={px} position={[px, 0.99, 0]} rotation-z={px * 0.6} castShadow><capsuleGeometry args={[0.065, 0.42, 3, 6]} /><meshStandardMaterial color={shirt} /></mesh>)}
    </group>
  </group>;
}

function Landmark({ x, z, w, d, h, name, color, accent }: { x: number; z: number; w: number; d: number; h: number; name: string; color: string; accent: string }) {
  return <group position={[x, 0, z]}>
    <mesh position={[0, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={color} roughness={0.82} /></mesh>
    <mesh position={[0, h + 0.12, 0]} castShadow><boxGeometry args={[w + 0.6, 0.24, d + 0.6]} /><meshStandardMaterial color={accent} metalness={0.25} roughness={0.5} /></mesh>
    {Array.from({ length: Math.max(2, Math.floor(w / 3)) }, (_, i) => <mesh key={i} position={[-w / 2 + 1.3 + i * ((w - 2.6) / Math.max(1, Math.floor(w / 3) - 1)), h * 0.58, d / 2 + 0.03]}><boxGeometry args={[0.9, 1.1, 0.06]} /><meshStandardMaterial color="#2b5265" metalness={0.35} roughness={0.3} emissive="#6eabbc" emissiveIntensity={0.07} /></mesh>)}
    <mesh position={[0, h * 0.32, d / 2 + 0.06]}><boxGeometry args={[Math.min(9, w * 0.78), 0.72, 0.12]} /><meshStandardMaterial color={accent} roughness={0.5} /></mesh>
    <Html position={[0, h + 1, 0]} center distanceFactor={34}><div className="whitespace-nowrap rounded-md border border-white/20 bg-[#101a21]/90 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white">{name}</div></Html>
  </group>;
}

function Flyover() {
  return <group>
    {/* Raised expressway at the market / civic district. */}
    <mesh position={[0, 5.2, 13]} castShadow receiveShadow><boxGeometry args={[52, 0.8, 7.8]} /><meshStandardMaterial color="#777b7d" roughness={0.9} /></mesh>
    <mesh position={[0, 5.66, 13]}><boxGeometry args={[52, 0.12, 7.8]} /><meshStandardMaterial color="#30383d" roughness={0.95} /></mesh>
    {Array.from({ length: 18 }, (_, i) => <mesh key={"lane" + i} position={[-24 + i * 2.8, 5.74, 13]}><boxGeometry args={[1.35, 0.025, 0.12]} /><meshStandardMaterial color="#e6d9a0" /></mesh>)}
    {[-23, -12, 0, 12, 23].map((x) => <group key={x} position={[x, 0, 13]}>
      <mesh position={[0, 2.6, 0]} castShadow><boxGeometry args={[0.85, 5.2, 1.05]} /><meshStandardMaterial color="#a2a6a7" roughness={0.92} /></mesh>
      <mesh position={[0, 4.95, 0]}><boxGeometry args={[1.45, 0.22, 1.5]} /><meshStandardMaterial color="#858c8e" /></mesh>
    </group>)}
    {[-1, 1].map((side) => <mesh key={side} position={[0, 5.8, 13 + side * 3.55]}><boxGeometry args={[52, 0.6, 0.16]} /><meshStandardMaterial color="#c3c7c8" /></mesh>)}
    <Html position={[0, 7, 13]} center distanceFactor={40}><div className="rounded bg-[#17242b]/90 px-3 py-1 text-[10px] font-bold tracking-widest text-amber-100">LAGOS CITY FLYOVER</div></Html>
  </group>;
}

function InteriorLife() {
  const inside = useGame((s) => s.interior);
  const label = useGame((s) => s.interiorLabel.toLowerCase());
  const people = useMemo(() => {
    if (!inside) return [];
    const bank = label.includes("bank"), airport = label.includes("airport") || label.includes("international"), police = label.includes("police");
    const count = bank || airport ? 6 : police ? 4 : 5;
    return Array.from({ length: count }, (_, i) => ({
      x: -4.2 + (i % 3) * 4.1, z: -2.5 + Math.floor(i / 3) * 2.5,
      phase: i * 1.73, shirt: ["#244d70", "#8e3347", "#d7a42d", "#38694d", "#e2ddd4", "#4e536c"][i] ?? "#244d70",
    }));
  }, [inside, label]);
  if (!inside) return null;
  const role = label.includes("bank") ? "TELLER / CUSTOMER SERVICE" : label.includes("airport") || label.includes("international") ? "AIRLINE CHECK-IN / PASSENGERS" : label.includes("police") ? "OFFICERS / VISITORS" : label.includes("boutique") || label.includes("clothing") ? "SHOP ASSISTANT / CUSTOMERS" : label.includes("market") ? "TRADERS / CUSTOMERS" : "RESIDENTS / VISITORS";
  return <group position={[104, 0, 104]}>
    {people.map((p, i) => <StreetPerson key={i} {...p} scale={0.92} />)}
    <Html position={[0, 3.1, 0]} center distanceFactor={14}><div className="rounded-lg border border-emerald-300/30 bg-[#101b1a]/90 px-3 py-1.5 text-[9px] font-bold tracking-wider text-emerald-100">{role} · OPEN</div></Html>
  </group>;
}


/** Distinct residential zones: a guarded Lekki estate and a lived-in mainland village edge. */
function EstateAndVillageDetail() {
  const estateX = 119;
  const estateZ = 103;
  const wall = "#d7d0bd";
  return <group>
    {/* Gated estate perimeter, gatehouse and boom barrier. */}
    <group position={[estateX, 0, estateZ]}>
      {[-18, 18].map((x) => <group key={"sidewall" + x} position={[x, 0, 0]}>
        <mesh position={[0, 1.15, 0]} castShadow><boxGeometry args={[0.65, 2.3, 29]} /><meshStandardMaterial color={wall} roughness={0.9} /></mesh>
        {[-12, -6, 0, 6, 12].map((z) => <mesh key={z} position={[0, 2.38, z]}><boxGeometry args={[0.85, 0.18, 0.8]} /><meshStandardMaterial color="#b9b3a5" /></mesh>)}
      </group>)}
      {[-13, 13].map((z) => <mesh key={"backwall" + z} position={[0, 1.15, z]} castShadow><boxGeometry args={[36, 2.3, 0.55]} /><meshStandardMaterial color={wall} roughness={0.9} /></mesh>)}
      {/* Entrance pillars and illuminated estate nameboard */}
      {[-5.2, 5.2].map((x) => <group key={x} position={[x, 0, 14.5]}>
        <mesh position={[0, 2, 0]} castShadow><boxGeometry args={[1.1, 4, 1.1]} /><meshStandardMaterial color="#e4d9c2" roughness={0.65} /></mesh>
        <mesh position={[0, 4.12, 0]}><boxGeometry args={[1.3, 0.2, 1.3]} /><meshStandardMaterial color="#c7a44f" metalness={0.65} roughness={0.3} /></mesh>
        <mesh position={[0, 4.35, 0]}><sphereGeometry args={[0.12, 10, 8]} /><meshStandardMaterial color="#ffe7a0" emissive="#e8b84b" emissiveIntensity={0.7} /></mesh>
      </group>)}
      <mesh position={[0, 3.35, 14.2]} castShadow><boxGeometry args={[8.5, 0.72, 0.45]} /><meshStandardMaterial color="#173d34" roughness={0.5} /></mesh>
      <Html position={[0, 3.36, 14.48]} center distanceFactor={22}><div className="whitespace-nowrap border border-amber-300/60 bg-[#10271f]/95 px-3 py-1 text-[10px] font-black tracking-[0.16em] text-amber-100">LEKKI GARDENS ESTATE</div></Html>
      {/* Guard booth */}
      <group position={[8, 0, 16]}>
        <mesh position={[0, 1.3, 0]} castShadow><boxGeometry args={[3.2, 2.6, 2.8]} /><meshStandardMaterial color="#e7e0d1" roughness={0.88} /></mesh>
        <mesh position={[0, 2.68, 0]}><boxGeometry args={[3.4, 0.16, 3]} /><meshStandardMaterial color="#173d34" /></mesh>
        <mesh position={[0, 1.55, 1.43]}><boxGeometry args={[1.6, 0.85, 0.06]} /><meshStandardMaterial color="#4c7783" metalness={0.25} roughness={0.25} /></mesh>
        <Html position={[0, 2.15, 1.55]} center distanceFactor={18}><div className="rounded bg-slate-950/90 px-2 py-1 text-[8px] font-bold text-white">SECURITY / VISITORS</div></Html>
      </group>
      {/* Sliding gate and boom arm */}
      {[-3.7, -2.6, -1.5, -0.4, 0.7, 1.8, 2.9, 4].map((x) => <mesh key={"gate" + x} position={[x, 1.35, 14.5]}><boxGeometry args={[0.09, 2.25, 0.16]} /><meshStandardMaterial color="#202c2a" metalness={0.45} roughness={0.35} /></mesh>)}
      <mesh position={[0, 1.55, 18.4]} rotation-z={-0.06}><boxGeometry args={[7.5, 0.16, 0.16]} /><meshStandardMaterial color="#f0e9d9" /></mesh>
      {[-3, -1, 1, 3].map((x) => <mesh key={"barstripe" + x} position={[x, 1.55, 18.32]} rotation-z={-0.06}><boxGeometry args={[0.65, 0.17, 0.18]} /><meshStandardMaterial color="#c83c32" /></mesh>)}
      {/* Landscaped estate courtyard */}
      {[-11, 11].map((x) => [-7, 0, 7].map((z) => <group key={x + ":" + z} position={[x, 0, z]}>
        <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[1.1, 1.2, 0.44, 10]} /><meshStandardMaterial color="#526b43" roughness={1} /></mesh>
        <mesh position={[0, 1.15, 0]} castShadow><cylinderGeometry args={[0.12, 0.2, 1.9, 7]} /><meshStandardMaterial color="#6d5035" /></mesh>
        <mesh position={[0, 2.2, 0]} castShadow><sphereGeometry args={[1.05, 8, 7]} /><meshStandardMaterial color="#39764a" roughness={1} /></mesh>
      </group>))}
      <mesh position={[0, 0.04, -1]} receiveShadow><boxGeometry args={[7.5, 0.08, 25]} /><meshStandardMaterial color="#a5a094" roughness={1} /></mesh>
    </group>

    {/* Mainland village compound: family homes, water tank, well and courtyard. */}
    <group position={[94, 0, 91]}>
      <mesh position={[0, 0.025, 0]} receiveShadow><boxGeometry args={[34, 0.05, 25]} /><meshStandardMaterial color="#b29b78" roughness={1} /></mesh>
      {[-10, 0, 10].map((x, i) => <group key={"compound" + x} position={[x, 0, i === 1 ? -5 : 4]}>
        <mesh position={[0, 1.35, 0]} castShadow receiveShadow><boxGeometry args={[7, 2.7, 6]} /><meshStandardMaterial color={["#c6a47d", "#d4bd98", "#b99168"][i] ?? "#c6a47d"} roughness={0.98} /></mesh>
        <mesh position={[0, 2.95, 0]} rotation-y={Math.PI / 4} castShadow><coneGeometry args={[5.1, 1.45, 4]} /><meshStandardMaterial color={i === 1 ? "#5f6a58" : "#765039"} roughness={1} /></mesh>
        <mesh position={[0, 0.92, 3.06]}><boxGeometry args={[1.05, 1.75, 0.08]} /><meshStandardMaterial color="#473225" roughness={0.9} /></mesh>
        <mesh position={[-1.75, 1.55, 3.06]}><boxGeometry args={[1.1, 0.75, 0.08]} /><meshStandardMaterial color="#6b9aaa" roughness={0.4} /></mesh>
      </group>)}
      {/* Low compound wall with an open entrance */}
      {[-15, 15].map((x) => <mesh key={"compoundwall" + x} position={[x, 0.6, 0]}><boxGeometry args={[0.45, 1.2, 23]} /><meshStandardMaterial color="#cbb99b" roughness={1} /></mesh>)}
      {[-10, -5, 0, 5, 10].map((z) => <mesh key={"frontwall" + z} position={[0, 0.6, 12]}><boxGeometry args={[z === 0 ? 3 : 5, 1.2, 0.4]} /><meshStandardMaterial color="#cbb99b" roughness={1} /></mesh>)}
      {/* Borehole stand and elevated plastic water tank */}
      <mesh position={[12, 2.7, -7]} castShadow><cylinderGeometry args={[0.12, 0.12, 5.4, 7]} /><meshStandardMaterial color="#575c5c" /></mesh>
      <mesh position={[12, 5.5, -7]} castShadow><cylinderGeometry args={[1.15, 1.15, 1.5, 12]} /><meshStandardMaterial color="#2c6882" roughness={0.5} /></mesh>
      <mesh position={[4, 0.6, -8]}><cylinderGeometry args={[0.75, 0.85, 1.2, 10]} /><meshStandardMaterial color="#8d8b7a" roughness={1} /></mesh>
      <mesh position={[4, 1.25, -8]}><torusGeometry args={[0.72, 0.08, 6, 14]} /><meshStandardMaterial color="#5c5b50" /></mesh>
      <Html position={[0, 5.5, 10]} center distanceFactor={30}><div className="rounded border border-amber-200/30 bg-[#241b12]/90 px-3 py-1 text-[9px] font-black tracking-widest text-amber-100">UMUDIKE OUTSKIRTS · FAMILY COMPOUNDS</div></Html>
    </group>

    {/* More street-side commerce, drainage and signboards along the mainland and waterfront. */}
    {[
      { x: -165, z: -58, c: "#d6a738", t: "SPARE PARTS" },
      { x: -155, z: -58, c: "#3c855c", t: "MAMA PUT" },
      { x: -145, z: -58, c: "#c34a3b", t: "PHONE REPAIR" },
      { x: -162, z: 43, c: "#3979ad", t: "FISH MARKET" },
      { x: -151, z: 43, c: "#d6a738", t: "SEAFOOD" },
      { x: -140, z: 43, c: "#b74637", t: "COLD DRINKS" },
    ].map((s, i) => <group key={"districtstall" + i} position={[s.x, 0, s.z]}>
      <mesh position={[0, 1.15, 0]} castShadow><boxGeometry args={[3.3, 2.3, 2.6]} /><meshStandardMaterial color="#987451" roughness={0.96} /></mesh>
      <mesh position={[0, 2.42, 0]} castShadow><coneGeometry args={[2.35, 0.5, 4]} /><meshStandardMaterial color={s.c} side={THREE.DoubleSide} roughness={0.98} /></mesh>
      <mesh position={[0, 2.08, 1.33]}><boxGeometry args={[2.7, 0.34, 0.08]} /><meshStandardMaterial color={s.c} /></mesh>
      <Html position={[0, 2.12, 1.42]} center distanceFactor={24}><div className="whitespace-nowrap bg-[#171b18]/90 px-1.5 py-0.5 text-[8px] font-black text-white">{s.t}</div></Html>
    </group>)}
    {[-169, -137, -105, 105, 137, 169].map((x) => <group key={"streetlight" + x} position={[x, 0, 5]}>
      <mesh position={[0, 3.2, 0]}><cylinderGeometry args={[0.07, 0.11, 6.4, 6]} /><meshStandardMaterial color="#555c60" /></mesh>
      <mesh position={[0.6, 6.1, 0]} rotation-z={-0.2}><boxGeometry args={[1.25, 0.1, 0.1]} /><meshStandardMaterial color="#555c60" /></mesh>
      <mesh position={[1.1, 6, 0]}><boxGeometry args={[0.35, 0.14, 0.25]} /><meshStandardMaterial color="#f7e6b5" emissive="#f7d06b" emissiveIntensity={0.25} /></mesh>
    </group>)}
    {/* Large roadside billboard for the city skyline and destination districts. */}
    <group position={[112, 0, 56]}>
      <mesh position={[0, 5.6, 0]}><boxGeometry args={[0.22, 11.2, 0.25]} /><meshStandardMaterial color="#4e5558" metalness={0.35} /></mesh>
      <mesh position={[0, 8.2, 0.3]} castShadow><boxGeometry args={[12, 4.2, 0.35]} /><meshStandardMaterial color="#102e32" roughness={0.7} /></mesh>
      <mesh position={[0, 8.2, 0.5]}><boxGeometry args={[11.5, 3.7, 0.06]} /><meshStandardMaterial color="#d6ae48" roughness={0.65} /></mesh>
      <Html position={[0, 8.2, 0.56]} center distanceFactor={28}><div className="text-center text-[12px] font-black tracking-widest text-[#17251f]">LAGOS LIFE RP<br/><span className="text-[9px] tracking-normal">LIVE · WORK · OWN YOUR CITY</span></div></Html>
    </group>
  </group>;
}

export default function LivingCity() {
  const vendors = [
    { x: -62, z: 20, color: "#dc493b", label: "SUYA / GRILLS" },
    { x: -56, z: 20, color: "#e6b638", label: "MAMA PUT" },
    { x: -50, z: 20, color: "#3b9b66", label: "FRUITS & VEG" },
    { x: -44, z: 20, color: "#3b6fb2", label: "CLOTHES" },
    { x: -38, z: 20, color: "#cf4e8c", label: "PHONE ACCESSORIES" },
    { x: -32, z: 20, color: "#d67b32", label: "SNACKS / DRINKS" },
    { x: -60, z: 27, color: "#438bba", label: "PROVISIONS" },
    { x: -52, z: 27, color: "#d3aa35", label: "MARKET WOMAN" },
    { x: -44, z: 27, color: "#5c9c62", label: "TAILOR" },
    { x: -36, z: 27, color: "#a64e49", label: "LOCAL GOODS" },
    { x: 20, z: 21, color: "#d7a63b", label: "ROADSIDE KIOSK" },
    { x: 28, z: 21, color: "#c85042", label: "COLD DRINKS" },
    { x: -160, z: -73, color: "#e1b13c", label: "OSHODI BUKA" },
    { x: -151, z: -73, color: "#3f8c5e", label: "MOTOR PARK SNACKS" },
    { x: -133, z: -57, color: "#cc493a", label: "SPARE PARTS" },
    { x: -159, z: 50, color: "#3c86b5", label: "FISH & SEAFOOD" },
    { x: -150, z: 76, color: "#d3a73c", label: "MAKOKO MARKET" },
    { x: 126, z: 53, color: "#b8a36a", label: "LEKKI COFFEE" },
    { x: 132, z: 84, color: "#447e62", label: "ESTATE GROCERY" },
  ];
  const crowd = useMemo(() => [
    [-67, 16], [-64, 24], [-58, 16], [-55, 25], [-49, 16], [-46, 24], [-40, 16], [-34, 24], [-29, 17],
    [14, 25], [19, 26], [24, 25], [31, 26], [36, 24], [40, 28], [46, 25], [51, 28],
    [-28, -12], [-24, -10], [-18, -12], [16, -12], [22, -10], [29, -12], [36, -10],
    [-162, -67], [-157, -58], [-149, -65], [-141, -56], [-134, -61],
    [-160, 57], [-151, 66], [-143, 77], [-133, 82], [122, 45], [130, 58], [138, 73], [146, 84],
  ] as [number, number][], []);
  return <group>
    {vendors.map((v, i) => <MarketCanopy key={i} x={v.x} z={v.z} color={v.color} label={v.label} phase={i % 3 * 0.15} />)}
    <StreetUmbrella x={-70} z={15} color="#dc493b" label="SUYA" phase={0.2} />
    <StreetUmbrella x={-26} z={15} color="#e6b638" label="COLD DRINKS" phase={0.5} />
    <StreetUmbrella x={34} z={18} color="#3b9b66" label="FRUITS" phase={0.1} />
    <StreetUmbrella x={48} z={19} color="#3b6fb2" label="PHONE REPAIR" phase={0.35} />
    <Shopfront x={-77} z={30} color="#b74637" title="MAMA PUT" phase={0} />
    <Shopfront x={-68} z={30} color="#285e46" title="PROVISIONS" phase={0} />
    <Shopfront x={-59} z={30} color="#294b70" title="PHONE ACCESSORIES" phase={0} />
    <Shopfront x={-50} z={30} color="#7c3b56" title="TAILOR / FASHION" phase={0} />
    <LagosStreetInfrastructure />
    {crowd.map(([x, z], i) => <StreetPerson key={i} x={x} z={z} phase={i * 1.19} shirt={["#263f60", "#d8a63d", "#b6473e", "#3b7754", "#ded4c6", "#8c4567"][i % 6] ?? "#263f60"} scale={i % 5 === 0 ? 0.82 : 0.94} />)}
    <Flyover />
    {/* Civic/education district and property sales office. */}
    {/* A small village edge with compound walls and pitched roofs. */}
    {[
      { x: 91, z: 58, c: "#c4a17a" }, { x: 103, z: 58, c: "#d0b18a" },
      { x: 91, z: 72, c: "#b88f68" }, { x: 103, z: 72, c: "#d7c29e" },
    ].map((h, i) => <group key={i} position={[h.x, 0, h.z]}>
      <mesh position={[0, 1.45, 0]} castShadow><boxGeometry args={[8, 2.9, 7]} /><meshStandardMaterial color={h.c} roughness={0.95} /></mesh>
      <mesh position={[0, 3.2, 0]} rotation-y={Math.PI / 4} castShadow><coneGeometry args={[5.8, 1.8, 4]} /><meshStandardMaterial color={i % 2 ? "#6b4935" : "#7a5335"} roughness={1} /></mesh>
      <mesh position={[0, 0.85, 3.56]}><boxGeometry args={[1.1, 1.7, 0.08]} /><meshStandardMaterial color="#473426" /></mesh>
    </group>)}
    <Html position={[97, 5.5, 80]} center distanceFactor={32}><div className="rounded-md border border-amber-300/30 bg-[#21180e]/90 px-3 py-1 text-[10px] font-bold tracking-wider text-amber-100">OUTSKIRTS VILLAGE · FAMILY COMPOUNDS</div></Html>

    {/* Makoko-inspired waterfront homes raised on timber stilts. */}
    <group>
      <mesh position={[-145, -0.12, 116]} receiveShadow><boxGeometry args={[48, 0.08, 28]} /><meshStandardMaterial color="#315d60" roughness={0.3} metalness={0.08} /></mesh>
      {[
        { x: -160, z: 108, c: "#b98d61" }, { x: -148, z: 111, c: "#c9a16f" },
        { x: -136, z: 108, c: "#b7865a" }, { x: -158, z: 122, c: "#c7a273" },
        { x: -144, z: 124, c: "#d2b487" }, { x: -131, z: 120, c: "#b99269" },
      ].map((h, i) => <group key={"waterhome" + i} position={[h.x, 0, h.z]}>
        {[-2, 2].map((px) => [-1.5, 1.5].map((pz) => <mesh key={px + ":" + pz} position={[px, 0.9, pz]}><cylinderGeometry args={[0.08, 0.1, 1.8, 5]} /><meshStandardMaterial color="#6d5035" roughness={1} /></mesh>))}
        <mesh position={[0, 2.1, 0]} castShadow><boxGeometry args={[6.8, 2.4, 5.8]} /><meshStandardMaterial color={h.c} roughness={0.95} /></mesh>
        <mesh position={[0, 3.55, 0]} rotation-y={Math.PI / 4} castShadow><coneGeometry args={[5, 1.2, 4]} /><meshStandardMaterial color={i % 2 ? "#59665e" : "#79563c"} roughness={1} /></mesh>
        <mesh position={[0, 1.95, 2.94]}><boxGeometry args={[1, 1.5, 0.08]} /><meshStandardMaterial color="#48352a" /></mesh>
      </group>)}
      <Html position={[-145, 5.8, 133]} center distanceFactor={38}><div className="rounded border border-cyan-200/30 bg-[#102326]/90 px-3 py-1.5 text-[10px] font-black tracking-widest text-cyan-100">MAKOKO WATERFRONT COMMUNITY</div></Html>
    </group>

    <EstateAndVillageDetail />
    <InteriorLife />
  </group>;
}
