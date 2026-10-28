import { Suspense } from "react";
import { Sky, Environment, Lightformer } from "@react-three/drei";
import DayNight from "./DayNight";
import World from "./World";
import GameWorld from "./GameWorld";
import UmuahiaWorld from "./UmuahiaWorld";
import NewMapWorld from "./NewMapWorld";
import { useGame } from "@/game/store";
import { getGraphicsProfile } from "@/game/graphics";

export default function Scene() {
  const city = useGame((s) => s.city);
  const quality = useGame((s) => s.graphicsQuality);
  const profile = getGraphicsProfile(quality);
  return (
    <>
      <DayNight />
      {city === "newmap" ? <NewMapWorld /> : city === "umuahia" ? <UmuahiaWorld /> : <World />}
      <Suspense fallback={null}>
        <GameWorld key={city} />
      </Suspense>
      <Environment resolution={profile.environmentResolution}>
        {quality !== "low" && <Lightformer intensity={1.6} position={[0, 8, 0]} scale={[12, 12, 1]} />}
        <Lightformer intensity={quality === "high" ? 0.7 : 0.35} color="#ffd9a0" position={[-6, 2, -1]} rotation-y={Math.PI / 2} scale={[24, 1.5, 1]} />
        {quality === "high" && <Lightformer intensity={0.7} color="#a8d4ff" position={[6, 2, 1]} rotation-y={-Math.PI / 2} scale={[24, 1.5, 1]} />}
      </Environment>
    </>
  );
}
