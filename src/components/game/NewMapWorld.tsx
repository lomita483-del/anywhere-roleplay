import { Html } from "@react-three/drei";
import { WORLD } from "@/game/city";

/**
 * New Map is intentionally an empty sandbox: a flat, uninterrupted terrain
 * with no buildings, roads, paths, props, trees, or landmarks.
 */
export default function NewMapWorld() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[WORLD * 3, WORLD * 3]} />
        <meshStandardMaterial color="#668553" roughness={1} metalness={0} />
      </mesh>
      <Html position={[0, 0.08, -18]} center distanceFactor={48} style={{ pointerEvents: "none" }}>
        <div className="rounded-md border border-white/15 bg-black/25 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/70">
          NEW MAP · EMPTY SANDBOX
        </div>
      </Html>
    </group>
  );
}
