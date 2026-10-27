import { Suspense } from "react";
import { Sky, Environment, Lightformer } from "@react-three/drei";
import DayNight from "./DayNight";
import World from "./World";
import GameWorld from "./GameWorld";
import UmuahiaWorld from "./UmuahiaWorld";
import { useGame } from "@/game/store";

export default function Scene() {
  const city = useGame((s) => s.city);
  return (
    <>
      <DayNight />
      {city === "umuahia" ? <UmuahiaWorld /> : <World />}
      <Suspense fallback={null}>
        <GameWorld key={city} />
      </Suspense>
      <Environment resolution={64}>
        <Lightformer intensity={1.6} position={[0, 8, 0]} scale={[12, 12, 1]} />
        <Lightformer intensity={0.7} color="#ffd9a0" position={[-6, 2, -1]} rotation-y={Math.PI / 2} scale={[24, 1.5, 1]} />
        <Lightformer intensity={0.7} color="#a8d4ff" position={[6, 2, 1]} rotation-y={-Math.PI / 2} scale={[24, 1.5, 1]} />
      </Environment>
    </>
  );
}
