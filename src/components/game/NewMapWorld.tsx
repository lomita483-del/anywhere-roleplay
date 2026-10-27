import { WORLD } from "@/game/city";

/**
 * New Map sandbox with one large oval football stadium.
 * The surrounding world remains completely empty: no roads, buildings,
 * trees, vehicles, or other landmarks.
 */
export default function NewMapWorld() {
  return (
    <group>
      {/* Empty grass world */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[WORLD * 3, WORLD * 3]} />
        <meshStandardMaterial color="#668553" roughness={1} metalness={0} />
      </mesh>

      {/* Stadium outer foundations and layered oval seating bowl */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 1.1, 0]} scale={[74, 2.2, 48]} castShadow receiveShadow>
          <sphereGeometry args={[1, 64, 18]} />
          <meshStandardMaterial color="#777d7d" roughness={0.92} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 2.5, 0]} scale={[70, 44, 1]}>
          <ringGeometry args={[0.76, 1, 96]} />
          <meshStandardMaterial color="#c3c5bd" roughness={0.9} side={2} />
        </mesh>

        {/* Distinct seating tiers around the open pitch */}
        {[
          { x: 65, z: 41, y: 5.5, color: "#c7c9c3" },
          { x: 60, z: 37, y: 8.2, color: "#a9343d" },
          { x: 55, z: 33, y: 10.6, color: "#d8d6cc" },
          { x: 50, z: 29, y: 12.8, color: "#315c9b" },
          { x: 45, z: 25, y: 14.6, color: "#d6d3c8" },
        ].map((tier, index) => (
          <mesh
            key={index}
            rotation-x={-Math.PI / 2}
            position={[0, tier.y, 0]}
            scale={[tier.x, tier.z, 1]}
            castShadow
            receiveShadow
          >
            <ringGeometry args={[0.91, 1, 96]} />
            <meshStandardMaterial color={tier.color} roughness={0.86} side={2} />
          </mesh>
        ))}

        {/* Open-air roof canopy, represented by a broad oval rim */}
        <mesh
          rotation-x={-Math.PI / 2}
          position={[0, 18.5, 0]}
          scale={[70, 44, 1]}
          castShadow
        >
          <ringGeometry args={[0.91, 1, 96]} />
          <meshStandardMaterial color="#343d45" metalness={0.25} roughness={0.65} side={2} />
        </mesh>

        {/* Football pitch */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 3.05, 0]} receiveShadow>
          <planeGeometry args={[82, 43]} />
          <meshStandardMaterial color="#287844" roughness={1} />
        </mesh>
        {/* Alternating grass bands */}
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} rotation-x={-Math.PI / 2} position={[-35.875 + i * 10.25, 3.075, 0]}>
            <planeGeometry args={[10.25, 42.5]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#2d8249" : "#246e3d"} roughness={1} />
          </mesh>
        ))}
        {/* Pitch boundary, halfway line, centre circle and penalty boxes */}
        <group position={[0, 3.11, 0]}>
          <mesh position={[0, 0, -21.2]}>
            <boxGeometry args={[80, 0.08, 0.18]} />
            <meshBasicMaterial color="#f4f0d8" />
          </mesh>
          <mesh position={[0, 0, 21.2]}>
            <boxGeometry args={[80, 0.08, 0.18]} />
            <meshBasicMaterial color="#f4f0d8" />
          </mesh>
          {[-40, 40].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <boxGeometry args={[0.18, 0.08, 42.5]} />
              <meshBasicMaterial color="#f4f0d8" />
            </mesh>
          ))}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.16, 0.08, 42.4]} />
            <meshBasicMaterial color="#f4f0d8" />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.045, 0]}>
            <ringGeometry args={[9.7, 9.95, 64]} />
            <meshBasicMaterial color="#f4f0d8" side={2} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]}>
            <circleGeometry args={[0.45, 20]} />
            <meshBasicMaterial color="#f4f0d8" />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 29, 0, 0]}>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[22, 0.08, 32]} />
                <meshBasicMaterial color="#f4f0d8" wireframe />
              </mesh>
              <mesh position={[side * 7, 0, 0]}>
                <boxGeometry args={[8, 0.08, 16]} />
                <meshBasicMaterial color="#f4f0d8" wireframe />
              </mesh>
            </group>
          ))}
        </group>

        {/* Four tall floodlight pylons */}
        {[
          [-67, -41],
          [67, -41],
          [-67, 41],
          [67, 41],
        ].map(([x, z], index) => (
          <group key={index} position={[x, 0, z]}>
            <mesh position={[0, 11, 0]} castShadow>
              <cylinderGeometry args={[0.42, 0.72, 22, 8]} />
              <meshStandardMaterial color="#777f82" metalness={0.45} roughness={0.55} />
            </mesh>
            <mesh position={[0, 22.2, 0]}>
              <boxGeometry args={[4.2, 1.5, 1.1]} />
              <meshStandardMaterial color="#e8e4d3" emissive="#fff0bd" emissiveIntensity={0.4} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
