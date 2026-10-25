import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { g, advanceTime } from "@/game/state";

const DAY_COLOR = new THREE.Color("#cfe4ee");
const DUSK_COLOR = new THREE.Color("#e8b78a");
const NIGHT_COLOR = new THREE.Color("#0d1424");
const _c = new THREE.Color();

export default function DayNight() {
  const skyRef = useRef<any>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const { scene } = useThree();

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    advanceTime(delta);

    // Sun elevation: -1 (midnight) .. 0 (6am/6pm) .. 1 (noon)
    const theta = ((g.time - 6) / 24) * Math.PI * 2;
    const elev = Math.sin(theta);
    const sunX = Math.cos(theta) * 120;
    const sunY = Math.max(elev, -0.25) * 100 + 10;

    if (skyRef.current?.material?.uniforms) {
      skyRef.current.material.uniforms.sunPosition.value.set(sunX, sunY, 40);
    }

    if (sunRef.current) {
      sunRef.current.position.set(sunX * 0.5, Math.max(elev, 0.1) * 80 + 12, 40);
      sunRef.current.intensity = Math.max(0.08, elev) * 2.1;
      const warm = 1 - Math.min(1, Math.max(0, elev) * 2.2);
      sunRef.current.color.setRGB(1, 0.92 - warm * 0.25, 0.78 - warm * 0.35);
    }
    if (ambRef.current) {
      ambRef.current.intensity = 0.3 + Math.max(0, elev) * 0.35;
      ambRef.current.color.setRGB(0.55 + Math.max(0, elev) * 0.45, 0.6 + Math.max(0, elev) * 0.35, 0.85 - Math.max(0, elev) * 0.2);
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = 0.25 + Math.max(0, elev) * 0.4;
    }

    // Fog + tone shifts with time of day
    const t = Math.max(0, Math.min(1, elev * 2 + 0.3)); // 0 night → 1 day
    if (t < 0.5) _c.copy(NIGHT_COLOR).lerp(DUSK_COLOR, t * 2);
    else _c.copy(DUSK_COLOR).lerp(DAY_COLOR, (t - 0.5) * 2);
    scene.background = _c.clone();
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(_c);
  });

  return (
    <>
      <Sky ref={skyRef} distance={4000} sunPosition={[80, 60, 40]} turbidity={7} rayleigh={1.5} mieCoefficient={0.008} mieDirectionalG={0.85} />
      <ambientLight ref={ambRef} intensity={0.5} />
      <hemisphereLight ref={hemiRef} args={["#b8d4e8", "#5e6b4a", 0.4]} />
      <directionalLight
        ref={sunRef}
        castShadow
        intensity={2}
        position={[60, 80, 40]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={10}
        shadow-camera-far={220}
      />
      <fog attach="fog" args={["#cfe4ee", 90, 260]} />
    </>
  );
}
