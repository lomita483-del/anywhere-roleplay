import { useEffect, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/game/store";
import { getInteriorDefinition } from "@/game/interiors";

type Prop = {type:string;x:number;z:number;rotY:number;scale:[number,number,number];color:string};
function PropBatch({items}:{items:Prop[]}) {
  const ref=useRef<THREE.InstancedMesh>(null);
  const matrices=useMemo(()=>items.map(item=>{
    const matrix=new THREE.Matrix4();
    matrix.compose(new THREE.Vector3(item.x,item.scale[1]/2+0.03,item.z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,item.rotY,0)),new THREE.Vector3(...item.scale));
    return matrix;
  }),[items]);
  useEffect(()=>{if(!ref.current)return;matrices.forEach((m,i)=>ref.current!.setMatrixAt(i,m));ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere()},[matrices]);
  if(!items.length)return null;
  return <instancedMesh ref={ref} args={[undefined,undefined,items.length]} castShadow receiveShadow><boxGeometry args={[1,1,1]}/><meshStandardMaterial color={items[0]?.color??"#777"} roughness={0.82}/></instancedMesh>;
}
function Npc({npc,index}:{npc:{role:string;x:number;z:number;lines:string[]};index:number}) {
  const group=useRef<THREE.Group>(null);const [line,setLine]=useState(0);
  useEffect(()=>{const id=window.setInterval(()=>setLine(v=>(v+1)%Math.max(1,npc.lines.length)),6500+index*350);return()=>window.clearInterval(id)},[npc.lines.length,index]);
  useFrame(({clock})=>{
    if(!group.current)return;
    const t=clock.elapsedTime*.14+index*1.7;
    group.current.position.set(npc.x+Math.sin(t)*.32,.035+Math.sin(clock.elapsedTime*1.8+index)*.035,npc.z+Math.cos(t*.8)*.22);
    group.current.rotation.y=Math.atan2(Math.cos(t*.8)*-.18,Math.cos(t)*.32);
  });
  return <group ref={group} position={[npc.x,0,npc.z]}>
    <mesh position={[0,.75,0]} castShadow><capsuleGeometry args={[.22,.65,4,8]}/><meshStandardMaterial color={index%2?"#3d9a86":"#c59a5a"} roughness={.8}/></mesh>
    <mesh position={[0,1.35,0]} castShadow><sphereGeometry args={[.19,12,12]}/><meshStandardMaterial color="#8b5c3c" roughness={.8}/></mesh>
    <Html position={[0,1.75,0]} center distanceFactor={12} style={{pointerEvents:"none"}}><div className="max-w-36 rounded-xl border border-emerald-200/25 bg-[#071319]/95 px-2 py-1 text-center shadow-lg"><div className="text-[10px] font-extrabold text-emerald-200">{npc.role}</div><div className="mt-0.5 text-[10px] leading-tight text-white">{npc.lines[line]??npc.lines[0]}</div></div></Html>
  </group>;
}
export default function InteriorWorld() {
  const inside=useGame(s=>s.interior);const label=useGame(s=>s.interiorLabel);const kind=useGame(s=>(s as any).interiorKind);
  const city=useGame(s=>s.city);const quality=useGame(s=>s.graphicsQuality);
  const def=useMemo(()=>getInteriorDefinition(label,kind),[label,kind]);
  const scale=city==="newmap"?.48:1;
  const groups=useMemo(()=>{
    const buckets=new Map<string,Prop[]>();
    for(const prop of def.props){const key=prop.type+"|"+prop.color;const a=buckets.get(key)??[];a.push(prop);buckets.set(key,a)}
    return [...buckets.entries()].map(([key,items])=>({key,items}));
  },[def]);
  if(!inside)return null;
  const [w,d]=def.size;
  return <group position={[104*scale,0,104*scale]} scale={scale}>
    <ambientLight intensity={.75}/><pointLight position={[0,3.2,0]} intensity={1.8} color="#ffd9a0" distance={22}/>
    <mesh position={[0,-.08,0]} receiveShadow><boxGeometry args={[w,.16,d]}/><meshStandardMaterial color={def.floorColor} roughness={.9}/></mesh>
    <mesh position={[0,1.75,-d/2]} receiveShadow><boxGeometry args={[w,3.5,.18]}/><meshStandardMaterial color={def.wallColor} roughness={.92}/></mesh>
    <mesh position={[-w/2,1.75,0]} receiveShadow><boxGeometry args={[.18,3.5,d]}/><meshStandardMaterial color={def.wallColor} roughness={.92}/></mesh>
    <mesh position={[w/2,1.75,0]} receiveShadow><boxGeometry args={[.18,3.5,d]}/><meshStandardMaterial color={def.wallColor} roughness={.92}/></mesh>
    <mesh position={[0,3.45,0]}><boxGeometry args={[w,.12,d]}/><meshStandardMaterial color={def.wallColor} transparent opacity={.18}/></mesh>
    {groups.map(group=><PropBatch key={group.key} items={group.items}/>)}
    {def.npcs.slice(0,quality==="low"?1:def.npcs.length).map((n,i)=><Npc key={n.role+"-"+i} npc={n} index={i}/>)}
    {def.hotspots.map(h=><group key={h.id} position={[h.x,.045,h.z]}>
      <mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.42,.55,20]}/><meshStandardMaterial color={def.accent} emissive={def.accent} emissiveIntensity={.9} side={THREE.DoubleSide}/></mesh>
      <Html position={[0,.15,0]} center distanceFactor={14} style={{pointerEvents:"none"}}><div className="whitespace-nowrap rounded-lg border border-emerald-200/30 bg-[#071319]/90 px-2 py-1 text-[11px] font-bold text-white">{h.label}</div></Html>
    </group>)}
    <mesh position={[def.exit.x,.04,def.exit.z]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[1.6,.9]}/><meshStandardMaterial color="#39df9b" emissive="#20b979" emissiveIntensity={1.2} transparent opacity={.8}/></mesh>
    <Html position={[def.exit.x,.25,def.exit.z]} center distanceFactor={12} style={{pointerEvents:"none"}}><div className="rounded-full border border-emerald-200/50 bg-[#06231a]/95 px-3 py-1 text-xs font-extrabold text-emerald-100">EXIT ↗</div></Html>
    <Html position={[0,3.95,-d/2+.2]} center distanceFactor={17} style={{pointerEvents:"none"}}><div className="whitespace-nowrap rounded-xl border border-amber-200/35 bg-[#101d20]/95 px-4 py-2 text-sm font-extrabold tracking-wide text-amber-100 shadow-xl">{def.name}</div></Html>
  </group>;
}
