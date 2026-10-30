import { useEffect, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/game/store";
import { g } from "@/game/state";
import { getInteriorDefinition } from "@/game/interiors";
import { getGraphicsProfile } from "@/game/graphics";

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
  return <instancedMesh ref={ref} args={[undefined,undefined,items.length]} castShadow receiveShadow>{items[0]?.type==="plant"?<coneGeometry args={[0.5,1,8]}/>:items[0]?.type==="stove"||items[0]?.type==="pool"?<cylinderGeometry args={[0.5,0.5,1,12]}/>:items[0]?.type==="seat"?<cylinderGeometry args={[0.5,0.5,1,10]}/>:<boxGeometry args={[1,1,1]}/>}<meshStandardMaterial color={items[0]?.color??"#777"} roughness={0.82}/></instancedMesh>;
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

function InteriorTapNavigation({scale}:{scale:number}) {
  const target=useRef<THREE.Vector3|null>(null);\n  useEffect(()=>{const handler=(event:Event)=>{const detail=(event as CustomEvent<{x:number;z:number;hotspotId:string;label:string}>).detail;target.current=new THREE.Vector3(detail.x,0,detail.z);(window as any).__pendingInteriorHotspot={id:detail.hotspotId,label:detail.label};};window.addEventListener("interior-walk",handler);return()=>window.removeEventListener("interior-walk",handler);},[]);
  useEffect(()=>{target.current=null;},[scale]);
  useFrame((_,dt)=>{
    const point=target.current;if(!point)return;
    const dx=point.x-g.playerPos.x,dz=point.z-g.playerPos.z;
    const distance=Math.hypot(dx,dz);
    if(distance<.22){g.playerPos.set(point.x,0,point.z);g.playerSpeed=0;target.current=null;const pending=(window as any).__pendingInteriorHotspot;if(pending){useGame.getState().setPrompt({kind:"interior-hotspot",label:pending.label,hotspotId:pending.id});(window as any).__pendingInteriorHotspot=null;}return;}
    const step=Math.min(distance,Math.max(0,3.2*dt));
    g.playerPos.x+=dx/distance*step;g.playerPos.z+=dz/distance*step;
    g.playerYaw=Math.atan2(dx,dz);g.playerSpeed=3.2;
  });
  return null;
}
\nexport default function InteriorWorld() {
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
  return <group position={[104*scale,0,104*scale]} scale={scale}>\n    <InteriorTapNavigation scale={scale}/>
        <ambientLight intensity={.58}/><hemisphereLight args={["#d9fff2","#203b32",.65]}/>
    {[[-9,-5],[8,-6],[-9,7],[-14,2]].map(([x,z],i)=><group key={"spot-"+i} position={[x,3.1,z]}>
      <pointLight position={[0,-.25,0]} intensity={i===0?1.6:1.1} distance={8} color="#fff0d0" castShadow={false}/>
      <mesh><cylinderGeometry args={[.22,.16,.08,16]}/><meshStandardMaterial color="#f4e9c8" emissive="#ffe6a8" emissiveIntensity={.65}/></mesh>
    </group>)}
    <mesh position={[0,-.08,0]} receiveShadow><boxGeometry args={[w,.16,d]}/><meshStandardMaterial color={def.floorColor} roughness={.9}/></mesh>
    {kind==="home" && <>
      <mesh position={[-8,.012,-5]} receiveShadow><boxGeometry args={[16,.025,13]}/><meshStandardMaterial color="#e8e5dc" roughness={.88}/></mesh>
      <mesh position={[9,.018,-2]} receiveShadow><boxGeometry args={[15,.03,17]}/><meshStandardMaterial color="#815a3d" roughness={.78}/></mesh>
      <mesh position={[-9,.02,7]} receiveShadow><boxGeometry args={[15,.035,8]}/><meshStandardMaterial color="#c9c9bd" roughness={.82}/></mesh>
      <mesh position={[-13,.025,3.5]} receiveShadow><boxGeometry args={[5,.04,8]}/><meshStandardMaterial color="#dce5df" roughness={.8}/></mesh>
      <mesh position={[0,1.25,2]}><boxGeometry args={[.14,2.5,13]}/><meshStandardMaterial color="#087b70" roughness={.9}/></mesh>
      <mesh position={[-1,1.25,-7]}><boxGeometry args={[.14,2.5,10]}/><meshStandardMaterial color="#087b70" roughness={.9}/></mesh>
      <mesh position={[-6,1.25,4]}><boxGeometry args={[8,2.5,.14]}/><meshStandardMaterial color="#087b70" roughness={.9}/></mesh>
      <mesh position={[-12,1.25,0]}><boxGeometry args={[.14,2.5,8]}/><meshStandardMaterial color="#087b70" roughness={.9}/></mesh>
    </>}
    <mesh position={[0,1.75,-d/2]} receiveShadow><boxGeometry args={[w,3.5,.18]}/><meshStandardMaterial color={def.wallColor} roughness={.92}/></mesh>
    <mesh position={[-w/2,1.75,0]} receiveShadow><boxGeometry args={[.18,3.5,d]}/><meshStandardMaterial color={def.wallColor} roughness={.92}/></mesh>
    <mesh position={[w/2,1.75,0]} receiveShadow><boxGeometry args={[.18,3.5,d]}/><meshStandardMaterial color={def.wallColor} roughness={.92}/></mesh>
    <mesh position={[0,3.45,0]}><boxGeometry args={[w,.12,d]}/><meshStandardMaterial color={def.wallColor} transparent opacity={.18}/></mesh>
    {groups.map(group=><PropBatch key={group.key} items={group.items}/>)}
    {def.npcs.slice(0,getGraphicsProfile(quality).interiorNpcCount).map((n,i)=><Npc key={n.role+"-"+i} npc={n} index={i}/>)}
    {def.hotspots.map(h=><group key={h.id} position={[h.x,.055,h.z]}>
      <mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.42,.55,24]}/><meshStandardMaterial color={def.accent} emissive={def.accent} emissiveIntensity={.9} side={THREE.DoubleSide}/></mesh>
      <Html position={[0,.2,0]} center distanceFactor={14} style={{pointerEvents:"auto"}}>
        <button type="button" onClick={(event)=>{event.stopPropagation();g.playerSpeed=0;const destination=new THREE.Vector3(104+h.x,0,104+h.z);window.dispatchEvent(new CustomEvent("interior-walk",{detail:{x:destination.x,z:destination.z,hotspotId:h.id,label:h.label}}));}} className="whitespace-nowrap rounded-lg border border-emerald-200/40 bg-[#071319]/95 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-lg active:scale-95">{h.label}</button>
      </Html>
    </group>)}
    <mesh position={[def.exit.x,.04,def.exit.z]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[1.6,.9]}/><meshStandardMaterial color="#39df9b" emissive="#20b979" emissiveIntensity={1.2} transparent opacity={.8}/></mesh>
    <Html position={[def.exit.x,.25,def.exit.z]} center distanceFactor={12} style={{pointerEvents:"none"}}><div className="rounded-full border border-emerald-200/50 bg-[#06231a]/95 px-3 py-1 text-xs font-extrabold text-emerald-100">EXIT ↗</div></Html>
    <Html position={[0,3.95,-d/2+.2]} center distanceFactor={17} style={{pointerEvents:"none"}}><div className="whitespace-nowrap rounded-xl border border-amber-200/35 bg-[#101d20]/95 px-4 py-2 text-sm font-extrabold tracking-wide text-amber-100 shadow-xl">{def.name}</div></Html>
  </group>;
}
