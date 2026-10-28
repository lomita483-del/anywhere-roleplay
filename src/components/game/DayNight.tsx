import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { g, advanceTime } from "@/game/state";
import { useGame } from "@/game/store";
import { getGraphicsProfile } from "@/game/graphics";
import { NEW_MAP_SCALE } from "@/game/newMap";

const DAY_COLOR = new THREE.Color("#cfe4ee");
const DUSK_COLOR = new THREE.Color("#e8b78a");
const NIGHT_COLOR = new THREE.Color("#0d1424");
const _c = new THREE.Color();

function Rainfall({ active }: { active: boolean }) {
  const geometry = useMemo(() => new THREE.BufferGeometry(), []);
  const quality = useGame((s) => s.graphicsQuality);
  const city = useGame((s) => s.city);
  const worldScale = city === "newmap" ? NEW_MAP_SCALE : 1;
  const count = getGraphicsProfile(quality).rainfallCount;
  const offsets = useMemo(() => Array.from({ length: count }, () => ({ x: (Math.random() - 0.5) * 62, z: (Math.random() - 0.5) * 62, y: Math.random() * 24, speed: 12 + Math.random() * 12 })), [count]);
  const positions = useMemo(() => new Float32Array(count * 2 * 3), [count]);
  useEffect(() => {
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return () => geometry.dispose();
  }, [geometry, positions]);
  useFrame((_, rawDelta) => {
    if (!active) return;
    const dt = Math.min(rawDelta, 0.05);
    offsets.forEach((drop, i) => {
      drop.y -= drop.speed * dt;
      if (drop.y < 0) drop.y = 18 + Math.random() * 10;
      const x = (g.playerPos.x + drop.x) * worldScale;
      const z = (g.playerPos.z + drop.z) * worldScale;
      const j = i * 6;
      positions[j] = x; positions[j + 1] = drop.y * worldScale; positions[j + 2] = z;
      positions[j + 3] = x + 0.08 * worldScale; positions[j + 4] = (drop.y + 0.65) * worldScale; positions[j + 5] = z - 0.04 * worldScale;
    });
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    attr.needsUpdate = true;
  });
  if (!active) return null;
  return <lineSegments geometry={geometry} frustumCulled={false}><lineBasicMaterial color="#b9d8ec" transparent opacity={0.48} /></lineSegments>;
}

export default function DayNight() {
  const skyRef = useRef<any>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const { scene } = useThree();
  const [rainActive, setRainActive] = useState(false);
  const city = useGame((s) => s.city);
  const quality = useGame((s) => s.graphicsQuality);
  const shadowMapSize = getGraphicsProfile(quality).shadowMapSize;
  useEffect(() => { if (city === "newmap") { g.raining = false; g.powerOutage = false; setRainActive(false); } }, [city]);

  useEffect(() => {
    let rainTimer: number | undefined;
    const cycle = window.setInterval(() => {
      const rain = useGame.getState().city === "newmap" ? Math.random() < 0.08 : Math.random() < 0.38;
      const outage = Math.random() < 0.22;
      g.raining = rain;
      g.powerOutage = outage;
      setRainActive(rain);
      if (rain) window.dispatchEvent(new CustomEvent("city-radio", { detail: "🌧️ Lagos rain don start. Watch for slippery roads and flooding." }));
      if (outage) window.dispatchEvent(new CustomEvent("city-radio", { detail: "💡 NEPA don take light! Street lights are out — generators are running." }));
      if (rainTimer) window.clearTimeout(rainTimer);
      rainTimer = window.setTimeout(() => { g.powerOutage = false; }, outage ? 22000 + Math.random() * 18000 : 1000);
    }, 65000);
    // Start a quiet generator hum after the first user gesture; mute it outside outages.
    let audio: AudioContext | null = null;
    let oscillator: OscillatorNode | null = null;
    let gain: GainNode | null = null;
    const startAudio = () => {
      if (audio) return;
      try {
        audio = new AudioContext();
        oscillator = audio.createOscillator();
        gain = audio.createGain();
        oscillator.type = "sawtooth";
        oscillator.frequency.value = 48;
        gain.gain.value = 0;
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start();
      } catch { /* Audio is optional on unsupported browsers. */ }
    };
    window.addEventListener("pointerdown", startAudio, { once: true });
    const audioTimer = window.setInterval(() => {
      if (audio && gain) gain.gain.setTargetAtTime(g.powerOutage ? 0.012 : 0, audio.currentTime, 0.8);
    }, 300);
    return () => {
      window.clearInterval(cycle); window.clearInterval(audioTimer);
      if (rainTimer) window.clearTimeout(rainTimer);
      window.removeEventListener("pointerdown", startAudio);
      try { oscillator?.stop(); audio?.close(); } catch { /* already stopped */ }
    };
  }, []);

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

    const worldScale = city === "newmap" ? NEW_MAP_SCALE : 1;
    const playerX = g.playerPos.x * worldScale;
    const playerZ = g.playerPos.z * worldScale;
    if (sunRef.current) {
      // Follow the active player so the shadow camera stays useful as the player explores.
      sunRef.current.position.set(playerX + sunX * 0.5 * worldScale, Math.max(elev, 0.1) * 80 * worldScale + 12, playerZ + 40 * worldScale);
      sunRef.current.target.position.set(playerX, 0, playerZ);
      sunRef.current.target.updateMatrixWorld();
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
    if (scene.background instanceof THREE.Color) scene.background.copy(_c);
    else scene.background = _c.clone();
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(_c);
  });

  return (
    <>
      <Rainfall active={rainActive} />
      <Sky ref={skyRef} distance={4000} sunPosition={[80, 60, 40]} turbidity={7} rayleigh={1.5} mieCoefficient={0.008} mieDirectionalG={0.85} />
      <ambientLight ref={ambRef} intensity={0.5} />
      <hemisphereLight ref={hemiRef} args={["#b8d4e8", "#5e6b4a", 0.4]} />
      <directionalLight
        ref={sunRef}
        castShadow
        intensity={2}
        position={[60, 80, 40]}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
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
