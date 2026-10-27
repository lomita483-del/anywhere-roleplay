import { WORLD } from "@/game/city";

/**
 * New Map is intentionally an empty sandbox: a flat, uninterrupted terrain
 * with no buildings, roads, paths, props, trees, or landmarks.
 */
export default function NewMapWorld() {
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[WORLD * 3, WORLD * 3]} />
      <meshStandardMaterial color="#668553" roughness={1} metalness={0} />
    </mesh>
  );
}
