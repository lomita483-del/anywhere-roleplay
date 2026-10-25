import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import Scene from "./Scene";
import Hud from "./Hud";

export default function GameCanvas() {
  return (
    <div className="fixed inset-0 touch-none select-none overflow-hidden">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 55, near: 0.5, far: 420, position: [-14, 6, 2] }}
        gl={{ antialias: true }}
      >
        <Scene />
      </Canvas>
      <Hud />
    </div>
  );
}
