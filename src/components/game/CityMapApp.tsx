import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Banknote, Building2, Car, ChevronDown, Compass, Footprints, Home, MapPin, Minus, Plus, Radio, RotateCcw, ShoppingBag, Users, Briefcase, Fuel, Settings, Hospital, Shield, Plane, Ship, School, Trees, Store, Landmark, Building, X, Navigation, Flag, Clock3 } from "lucide-react";
import { useGame } from "@/game/store";
import { g } from "@/game/state";
import { BOUND, BUILDINGS, getMapPlaces, POIS, ROADS_X, ROADS_Z, WORLD, type CityId, type MapPlace } from "@/game/city";
import { NEW_MAP_BUILDINGS, NEW_MAP_DISTRICTS, NEW_MAP_MARKET_STALLS, NEW_MAP_ROAD_GRAPH, NEW_MAP_TREES } from "@/game/newMap";
import { enterBuilding } from "@/game/actions";

const ICONS: Record<string, typeof Building2> = {
  bank: Landmark, atm: Banknote, hospital: Hospital, police: Shield, fuel: Fuel, pharmacy: Hospital,
  food: Store, market: ShoppingBag, school: School, airport: Plane, port: Ship, stadium: Building2,
  "real-estate": Home, dealership: Car, tower: Building, factory: Building, home: Home, park: Trees,
};
const IMPORTANT = new Set(["bank","atm","hospital","police","fuel","pharmacy","food","market","school","airport","port","stadium","real-estate","dealership","tower","factory","home","residential","university","depot","resort","lake"]);
const NAME_KEY = "anywhere-map-names-v1";
const ZOOM_KEY = "anywhere-map-zoom-v1";
const CITY_KEY = "anywhere-map-city-v1";
const cashLabel = (n:number) => "₦" + Math.floor(n).toLocaleString("en-NG");
type RideOption = { id: "walk" | "ride" | "bike" | "private" | "danfo" | "keke"; title: string; price: number; rate: number; eta: (d:number)=>number; detail: string };
const RIDE_OPTIONS: RideOption[] = [
  {id:"walk",title:"Walk",price:0,rate:0,eta:d=>Math.ceil(d/1.4),detail:"Free · take the streets"},
  {id:"ride",title:"Book taxi",price:1600,rate:4.5,eta:d=>Math.max(2,Math.ceil(d/8)+3),detail:"City taxi · comfortable"},
  {id:"bike",title:"Book bike man / okada",price:700,rate:3.2,eta:d=>Math.max(1,Math.ceil(d/16)+2),detail:"Fastest through traffic"},
  {id:"private",title:"My private driver",price:4200,rate:10,eta:d=>Math.max(2,Math.ceil(d/9)+3),detail:"Private sedan · premium"},
  {id:"danfo",title:"Book danfo",price:300,rate:1.1,eta:d=>Math.max(4,Math.ceil(d/4)+5),detail:"Cheapest · slower shared ride"},
  {id:"keke",title:"Book keke",price:500,rate:1.8,eta:d=>Math.max(3,Math.ceil(d/6)+4),detail:"Local three-wheeler"},
];

export default function CityMapApp() {
  const city = useGame(s=>s.city);
  const setCity = useGame(s=>s.setCity);
  const cash = useGame(s=>s.cash);
  const bank = useGame(s=>s.bank);
  const needs = useGame(s=>s.needs);
  const clock = useGame(s=>s.clock);
  const onlinePlayers = useGame(s=>s.onlinePlayers);
  const waypoint = useGame(s=>s.waypoint);
  const setWaypoint = useGame(s=>s.setWaypoint);
  const clearWaypoint = useGame(s=>s.clearWaypoint);
  const owned = useGame(s=>s.owned);
  const driving = useGame(s=>s.driving);
  const rideRequest = useGame(s=>s.rideRequest);
  const requestRide = useGame(s=>s.requestRide);
  const openPhone = useGame(s=>s.openPhone);
  const closePhone = useGame(s=>s.closePhone);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef(new Map<number,{x:number;y:number}>());
  const gestureRef = useRef<{x:number;y:number;panX:number;panY:number;pinch:number;startZoom:number;dragged:boolean;lastTap:number}>({x:0,y:0,panX:0,panY:0,pinch:0,startZoom:1,dragged:false,lastTap:0});
  const [zoom,setZoomState] = useState(()=>{try{return Math.max(.8,Math.min(3,Number(localStorage.getItem(ZOOM_KEY))||1.4))}catch{return 1.4}});
  const [pan,setPan] = useState({x:0,y:0});
  const [names,setNames] = useState(()=>{try{return localStorage.getItem(NAME_KEY)!=="false"}catch{return true}});
  const [selected,setSelected] = useState<MapPlace|null>(null);
  const [more,setMore] = useState(false);
  const [rides,setRides] = useState(false);
  const [notice,setNotice] = useState("");
  const [muted,setMuted] = useState(false);
  const [tick,setTick] = useState(0);
  const [now,setNow] = useState(()=>new Date());
  const [routeToEnter,setRouteToEnter] = useState(false);
  const [skipFade,setSkipFade] = useState(false);
  const places = useMemo(() => getMapPlaces(city), [city]);
  const playerDistance = selected ? Math.hypot(selected.doorX-g.playerPos.x,selected.doorZ-g.playerPos.z) : 0;
  const etaWalk = Math.max(1,Math.ceil(playerDistance/1.4));

  const setZoom = (next:number) => { const value=Math.max(.8,Math.min(3,Number(next.toFixed(2))));setZoomState(value);try{localStorage.setItem(ZOOM_KEY,String(value))}catch{} };
  useEffect(()=>{try{localStorage.setItem(NAME_KEY,String(names))}catch{}},[names]);
  useEffect(()=>{try{localStorage.setItem(CITY_KEY,city)}catch{}},[city]);
  useEffect(()=>{const id=window.setInterval(()=>{setTick(v=>v+1);setNow(new Date())},300);return()=>window.clearInterval(id)},[]);
  const screen = useCallback((x:number,z:number,S=720)=> {
    const scale=S/WORLD;
    return {x:S/2+x*scale,y:S/2+z*scale*.72};
  },[]);
  const worldAt = useCallback((sx:number,sy:number,S=720)=> {
    return {x:((sx-S/2-pan.x)/zoom)/(S/WORLD),z:((sy-S/2-pan.y)/zoom)/(S/WORLD*.72)};
  },[pan.x,pan.y,zoom]);

  // Render the expensive city geometry once into an offscreen layer. Dynamic GPS, labels and route
  // are composited separately, so dragging only scales/copies this layer on mid-range phones.
  useEffect(()=>{
    const base=document.createElement("canvas");base.width=720;base.height=720;
    const ctx=base.getContext("2d");if(!ctx)return;
    const S=base.width;ctx.fillStyle="#0b1b20";ctx.fillRect(0,0,S,S);
    const xy=(x:number,z:number)=>screen(x,z,S);
    ctx.fillStyle="#102923";ctx.fillRect(0,0,S,S);
    if(city==="newmap"){
      for(const d of NEW_MAP_DISTRICTS){const a=xy(d.x-d.w/2,d.z-d.d/2),b=xy(d.x+d.w/2,d.z+d.d/2);ctx.fillStyle=d.color;ctx.globalAlpha=.20;ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y)}ctx.globalAlpha=1;
      ctx.fillStyle="#163e50";ctx.beginPath();let q=xy(-112,118);ctx.ellipse(q.x,q.y,27*S/WORLD,27*S/WORLD,0,0,Math.PI*2);ctx.fill();
      q=xy(110,142);ctx.fillStyle="#123d4d";ctx.fillRect(q.x-25*S/WORLD,q.y-24*S/WORLD,48*S/WORLD,36*S/WORLD);
      ctx.lineCap="round";ctx.lineJoin="round";
      for(const e of NEW_MAP_ROAD_GRAPH.edges){const draw=(color:string,w:number,dash:number[])=>{ctx.beginPath();e.points.forEach((p,i)=>{const a=xy(p[0],p[1]);i?ctx.lineTo(a.x,a.y):ctx.moveTo(a.x,a.y)});ctx.strokeStyle=color;ctx.lineWidth=Math.max(2,w*S/WORLD);ctx.setLineDash(dash);ctx.stroke()};draw("#243f3e",e.width+2,[]);draw("#536765",e.width,[]);draw("#e0dfc9",.45,[5,5])}
      ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";for(const d of NEW_MAP_DISTRICTS){const p=xy(d.x,d.z);ctx.font="800 10px system-ui,sans-serif";const w=ctx.measureText(d.label).width+18;ctx.fillStyle="rgba(3,16,20,.72)";ctx.beginPath();ctx.roundRect(p.x-w/2,p.y-9,w,18,8);ctx.fill();ctx.fillStyle="#d5e8df";ctx.fillText(d.label,p.x,p.y,Math.max(20,d.w*S/WORLD-8))}ctx.restore();for(const j of NEW_MAP_ROAD_GRAPH.nodes){const a=xy(j.x,j.z);ctx.fillStyle="#34514a";ctx.beginPath();ctx.arc(a.x,a.y,Math.max(3,3*S/WORLD),0,Math.PI*2);ctx.fill()}
      for(const t of NEW_MAP_TREES){const a=xy(t.x,t.z);ctx.fillStyle=t.type==="palm"?"#72a878":"#3b785b";ctx.beginPath();ctx.arc(a.x,a.y,3.2,0,Math.PI*2);ctx.fill();ctx.fillStyle="#1b463a";ctx.beginPath();ctx.arc(a.x+1,a.y+1,2.1,0,Math.PI*2);ctx.fill()}
      for(const stall of NEW_MAP_MARKET_STALLS){const a=xy(stall.x-stall.w/2,stall.z-stall.d/2),b=xy(stall.x+stall.w/2,stall.z+stall.d/2);ctx.fillStyle=stall.color;ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y)}
    } else {
      // Lagos/Umuahia use their own BUILDINGS/POIS datasets and the shared city road grid.
      for(const rx of ROADS_X){const a=xy(rx,-BOUND),b=xy(rx,BOUND);ctx.strokeStyle="#243f3e";ctx.lineWidth=10*S/WORLD;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle="#71817a";ctx.lineWidth=7*S/WORLD;ctx.stroke();ctx.strokeStyle="#e0dfc9";ctx.lineWidth=1;ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([])}
      for(const rz of ROADS_Z){const a=xy(-BOUND,rz),b=xy(BOUND,rz);ctx.strokeStyle="#243f3e";ctx.lineWidth=10*S/WORLD;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle="#71817a";ctx.lineWidth=7*S/WORLD;ctx.stroke();ctx.strokeStyle="#e0dfc9";ctx.lineWidth=1;ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([])}
      for(const p of POIS){if(p.kind==="lake"){const a=xy(p.x,p.z);ctx.fillStyle="#153f51";ctx.beginPath();ctx.ellipse(a.x,a.y,30,23,0,0,Math.PI*2);ctx.fill()}}
    }
    for(const b of places){
      const a=xy(b.x-b.w/2,b.z-b.d/2),c=xy(b.x+b.w/2,b.z+b.d/2);
      const ww=Math.max(2,c.x-a.x),dd=Math.max(2,c.y-a.y),hh=Math.max(2,Math.min(54,b.h*.55));
      ctx.fillStyle="#061316";ctx.fillRect(a.x+hh*.14,a.y+hh*.18,ww,dd);
      ctx.fillStyle=b.color||"#6c807a";ctx.beginPath();ctx.moveTo(a.x,a.y-hh*.18);ctx.lineTo(c.x,a.y-hh*.18);ctx.lineTo(c.x+hh*.16,a.y+hh*.1);ctx.lineTo(a.x+hh*.16,a.y+hh*.1);ctx.closePath();ctx.fill();
      ctx.fillStyle=b.color||"#6c807a";ctx.fillRect(a.x,a.y,ww,dd);
      ctx.fillStyle="#d1e2d2";ctx.globalAlpha=.55;ctx.fillRect(a.x+1,a.y+1,Math.max(1,ww-2),Math.max(1,dd*.14));ctx.globalAlpha=1;
      ctx.strokeStyle="rgba(185,222,204,.4)";ctx.lineWidth=1;ctx.strokeRect(a.x,a.y,ww,dd);
    }
    baseRef.current=base;
  },[city,places,screen]);

  useEffect(()=>{
    const canvas=canvasRef.current,base=baseRef.current;if(!canvas||!base)return;
    const ctx=canvas.getContext("2d");if(!ctx)return;
    const S=canvas.width;ctx.clearRect(0,0,S,S);ctx.fillStyle="#081619";ctx.fillRect(0,0,S,S);
    ctx.save();ctx.translate(S/2+pan.x,S/2+pan.y);ctx.scale(zoom,zoom);ctx.translate(-S/2,-S/2);
    ctx.drawImage(base,0,0);
    const xy=(x:number,z:number)=>screen(x,z,S);
    const labelBoxes:{left:number;top:number;right:number;bottom:number}[]=[];
    if(waypoint){const a=xy(g.playerPos.x,g.playerPos.z),b=xy(waypoint.x,waypoint.z);ctx.strokeStyle="#36ef9a";ctx.lineWidth=3/zoom;ctx.setLineDash([8/zoom,6/zoom]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#36ef9a";ctx.beginPath();ctx.moveTo(b.x,b.y-13/zoom);ctx.lineTo(b.x+10/zoom,b.y);ctx.lineTo(b.x,b.y+13/zoom);ctx.lineTo(b.x-10/zoom,b.y);ctx.closePath();ctx.fill()}
    if(names){
      for(const p of places){
        if(zoom<1.28&&!IMPORTANT.has(p.icon))continue;
        const a=xy(p.x,p.z);const label=p.label.length>25?p.label.slice(0,23)+"…":p.label;
        const compact=p.w<12||p.d<12;ctx.font=`bold ${compact?10:12}px system-ui,sans-serif`;const w=Math.min(230,ctx.measureText(label).width+(compact?22:32)),h=compact?21:25;
        if(a.x < -w || a.y < -h || a.x > S+w || a.y > S+h)continue;
        const box={left:a.x-w/2,top:a.y-h-4,right:a.x+w/2,bottom:a.y-4};
        if(zoom<1.55&&labelBoxes.some(b=>box.left<b.right+3&&box.right>b.left-3&&box.top<b.bottom+3&&box.bottom>b.top-3))continue;
        labelBoxes.push(box);
        ctx.fillStyle="rgba(4,15,20,.94)";ctx.strokeStyle="rgba(115,205,176,.55)";ctx.lineWidth=1;
        ctx.beginPath();ctx.roundRect(a.x-w/2,a.y-h-4,w,h,12);ctx.fill();ctx.stroke();
        ctx.fillStyle="#78e3bd";ctx.beginPath();ctx.arc(a.x-w/2+(compact?9:13),a.y-h/2-4,compact?4.5:7,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#06201c";ctx.font=`bold ${compact?7:9}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText((p.icon[0]||"•").toUpperCase(),a.x-w/2+(compact?9:13),a.y-h/2-4);
        ctx.fillStyle="#f4fbf7";ctx.font=`bold ${compact?10:12}px system-ui,sans-serif`;ctx.textAlign="left";ctx.fillText(label,a.x-w/2+(compact?17:25),a.y-h/2-4);
      }
    }
    const pulse=4+Math.sin(tick*.12)*1.5;const pl=xy(g.playerPos.x,g.playerPos.z);
    ctx.fillStyle="rgba(49,165,255,.2)";ctx.beginPath();ctx.arc(pl.x,pl.y,pulse+7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#2799ff";ctx.beginPath();ctx.arc(pl.x,pl.y,pulse,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#e8f7ff";ctx.lineWidth=2;ctx.stroke();
    ctx.save();ctx.translate(pl.x,pl.y);ctx.rotate(g.playerYaw);ctx.fillStyle="#fff";ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(-5,0);ctx.lineTo(0,-3);ctx.lineTo(5,0);ctx.closePath();ctx.fill();ctx.restore();
    ctx.restore();
  },[city,places,screen,pan.x,pan.y,zoom,names,waypoint,tick]);

  const selectAt=(e:React.PointerEvent<HTMLCanvasElement>)=>{
    const rect=e.currentTarget.getBoundingClientRect();const sx=(e.clientX-rect.left)*720/rect.width,sy=(e.clientY-rect.top)*720/rect.height;
    const w=worldAt(sx,sy,720);
    const labelHit=[...places].map(p=>{const a=screen(p.x,p.z,720);const px=360+pan.x+(a.x-360)*zoom;const py=360+pan.y+(a.y-360)*zoom;const width=Math.min(270,p.label.length*7.2+32);return {p,hit:Math.abs(sx-px)<width/2&&sy>=py-31*zoom&&sy<=py-3*zoom}}).find(item=>item.hit)?.p;
    const hit=labelHit??[...places].sort((a,b)=>Math.hypot(a.x-w.x,a.z-w.z)-Math.hypot(b.x-w.x,b.z-w.z)).find(p=>Math.abs(p.x-w.x)<p.w/2+4&&Math.abs(p.z-w.z)<p.d/2+4);
    if(hit){setSelected(hit);setRides(false);setNotice("");return}
    setSelected(null);setWaypoint({x:Math.max(-BOUND,Math.min(BOUND,w.x)),z:Math.max(-BOUND,Math.min(BOUND,w.z)),label:"Custom GPS destination",kind:"custom"});
  };
  const startRide=(service:RideOption["id"])=>{
    if(!selected)return;
    if(service==="walk"){setWaypoint({x:selected.doorX,z:selected.doorZ,label:selected.label,kind:selected.kind});setRides(false);setNotice("Walking route set.");return}
    if(driving){setNotice("Park your vehicle before booking a ride.");return}
    if(rideRequest){setNotice("Finish or cancel your current ride first.");return}
    if(!waypoint||waypoint.label!==selected.label)setWaypoint({x:selected.doorX,z:selected.doorZ,label:selected.label,kind:selected.kind});
    const ok=requestRide(service);
    if(!ok){setNotice("Booking failed. Check your cash and bank balance, or finish your current trip.");return}
    setNotice("Driver assigned. Watch the road for your pickup.");setRides(false);closePhone();
  };
  const enterSelected=()=>{
    if(!selected)return;
    if(playerDistance>12){setNotice("Go there first — you must be within 12 units of the door.");setWaypoint({x:selected.doorX,z:selected.doorZ,label:selected.label,kind:selected.kind});return}
    enterBuilding(selected.label,selected.kind);closePhone();
  };
  const goInside=()=>{if(!selected)return;setWaypoint({x:selected.doorX,z:selected.doorZ,label:selected.label,kind:"enter-building"});setRouteToEnter(true);setNotice("GPS set. You can enter when you reach the door.");};
  const timeText=()=>{const h=Math.floor(clock)%24,m=Math.floor((clock-Math.floor(clock))*60);return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")};
  const mood=needs.energy<25?"Tired":needs.hunger<25?"Hungry":needs.hunger>75&&needs.energy>70?"Very Happy":"Okay";
  const playerCount=Object.keys(onlinePlayers??{}).length+1;
  const Icon=selected?(ICONS[selected.icon]??Building2):Building2;

  return <div className="pointer-events-auto fixed inset-0 z-[9999] flex h-[100dvh] w-screen min-h-0 flex-col gap-2 overflow-hidden bg-[#071319] p-2.5 text-white sm:p-3" style={{touchAction:"none"}} onPointerDown={e=>e.stopPropagation()} onPointerMove={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()}>
    <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-200/15 bg-[#0d2526] px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,.25)]">
      <div className="flex min-w-0 items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-300/15 text-emerald-200"><Clock3 size={17}/></span><div><div className="text-sm font-bold">{timeText()} · {now.toLocaleDateString("en-NG",{day:"2-digit",month:"short"})}</div><div className="text-xs text-emerald-100/75">{mood} · {playerCount} online</div></div></div>
      <div className="flex items-center gap-1.5"><button onClick={()=>setMuted(v=>!v)} aria-label="Toggle mute" className="min-h-10 min-w-10 rounded-xl border border-white/10 bg-white/5 text-slate-200"><Radio size={17} className="mx-auto"/><span className="text-[10px]">{muted?"Muted":"Sound"}</span></button><button onClick={()=>openPhone("bank")} className="flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-2.5 text-xs font-bold text-emerald-100"><Banknote size={15}/><span>{cashLabel(cash)}</span><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-300 text-sm text-emerald-950">+</span></button></div>
    </div>
    <div className="relative z-20 flex items-center gap-2">
      <label className="relative min-w-0 flex-1"><span className="sr-only">Choose city</span><select value={city} onChange={e=>setCity(e.target.value as CityId)} className="min-h-11 w-full appearance-none rounded-xl border border-white/15 bg-[#102629] px-3 pr-8 text-sm font-bold text-white"><option value="newmap">NEW MAP</option><option value="lagos">LAGOS</option><option value="umuahia">UMUAHIA</option></select><ChevronDown className="pointer-events-none absolute right-2.5 top-3.5" size={16}/></label>
      <button onClick={()=>setNames(v=>!v)} className={"min-h-11 rounded-xl border px-3 text-xs font-bold "+(names?"border-emerald-300/30 bg-emerald-400/15 text-emerald-100":"border-white/15 bg-white/5 text-slate-200")}>Names {names?"ON":"OFF"}</button>
      <button onClick={()=>setMore(v=>!v)} className="min-h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-bold">More</button>
    </div>
    {more&&<div className="relative z-20 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-[#0b2225] p-2">{[{label:"Districts",icon:Compass,app:"districts" as const},{label:"Jobs",icon:Briefcase,app:"jobs" as const},{label:"Fuel",icon:Fuel,app:"fuel" as const},{label:"Friends",icon:Users,app:"friends" as const},{label:"Settings",icon:Settings,app:"settings" as const}].map(item=><button key={item.label} onClick={()=>openPhone(item.app)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold"><item.icon size={14}/>{item.label}</button>)}</div>}
    <div className="absolute inset-0 z-0 overflow-hidden border-0 bg-[#0a1c20] shadow-[0_0_28px_rgba(28,175,128,.09)]">
      <canvas ref={canvasRef} width={720} height={720} className="absolute inset-0 h-full w-full touch-none" style={{minHeight:0,touchAction:"none",pointerEvents:"auto"}} onPointerDown={e=>{e.preventDefault();e.stopPropagation();const pts=pointerRef.current;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});e.currentTarget.setPointerCapture(e.pointerId);const g0=gestureRef.current;if(pts.size===1){g0.x=e.clientX;g0.y=e.clientY;g0.panX=pan.x;g0.panY=pan.y;g0.dragged=false;g0.lastTap=Date.now()}else if(pts.size===2){const a=[...pts.values()];g0.pinch=Math.hypot(a[0]!.x-a[1]!.x,a[0]!.y-a[1]!.y);g0.startZoom=zoom;}}} onPointerMove={e=>{e.preventDefault();e.stopPropagation();const pts=pointerRef.current;if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});const gg=gestureRef.current;if(pts.size===1){const dx=e.clientX-gg.x,dy=e.clientY-gg.y;if(Math.hypot(dx,dy)>5)gg.dragged=true;if(gg.dragged)setPan({x:Math.max(-280,Math.min(280,gg.panX+dx*720/e.currentTarget.getBoundingClientRect().width)),y:Math.max(-280,Math.min(280,gg.panY+dy*720/e.currentTarget.getBoundingClientRect().height))})}else if(pts.size===2){const a=[...pts.values()];const d=Math.hypot(a[0]!.x-a[1]!.x,a[0]!.y-a[1]!.y);if(gg.pinch>0){gg.dragged=true;setZoom(gg.startZoom*d/gg.pinch)}}}} onPointerUp={e=>{e.preventDefault();e.stopPropagation();const gg=gestureRef.current;const wasMultiTouch=pointerRef.current.size>1;pointerRef.current.delete(e.pointerId);if(pointerRef.current.size===0&&!gg.dragged&&!wasMultiTouch&&Date.now()-gg.lastTap>30)selectAt(e);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}} onPointerCancel={e=>{e.preventDefault();e.stopPropagation();pointerRef.current.delete(e.pointerId);gestureRef.current.dragged=true}} onLostPointerCapture={e=>{pointerRef.current.delete(e.pointerId)}} onDoubleClick={e=>{e.preventDefault();e.stopPropagation();setZoom(zoom+0.35)}}/>
      <div className="pointer-events-none absolute left-2 top-[154px] rounded-lg border border-white/10 bg-[#071319]/90 px-2.5 py-1.5 text-xs font-bold text-emerald-100">● LIVE GPS <span className="ml-1 text-slate-300">{places.length} places</span></div>
      <div className="absolute right-2 top-[154px] flex flex-col gap-1.5"><button onClick={()=>setZoom(zoom+.25)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-[#071319]/95"><Plus size={18}/></button><button onClick={()=>setZoom(zoom-.25)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-[#071319]/95"><Minus size={18}/></button><button onClick={()=>{setZoom(1.4);setPan({x:0,y:0})}} className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-[#071319]/95" aria-label="Recenter"><RotateCcw size={16}/></button></div>
      <div className="pointer-events-none absolute bottom-[74px] left-2 rounded-lg border border-white/10 bg-[#071319]/90 px-2 py-1 text-xs text-slate-200">🔵 You　🟢 Destination</div>
    </div>
    {waypoint&&<div className="relative z-20 flex items-center justify-between gap-2 rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-2.5"><div className="min-w-0"><div className="text-xs uppercase tracking-wide text-emerald-200">Active GPS route</div><div className="truncate text-sm font-bold">{waypoint.label}</div></div><button onClick={clearWaypoint} className="min-h-10 rounded-lg border border-white/10 px-3 text-xs font-bold">Clear</button></div>}
    {selected&&<div className="relative z-20 rounded-2xl border border-emerald-200/20 bg-[#0e2829] p-3 shadow-xl">
      <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-300/15 text-emerald-100"><Icon size={22}/></span><div className="min-w-0 flex-1"><div className="text-base font-bold leading-tight">{selected.label}</div><div className="mt-1 text-xs capitalize text-emerald-100/75">{selected.district} · {selected.kind.replace(/-/g," ")}</div><div className="mt-1 text-xs text-slate-300">{Math.round(playerDistance)} units away · about {etaWalk} min walk</div></div><button onClick={()=>{setSelected(null);setRides(false)}} aria-label="Close place details" className="rounded-lg p-1 text-slate-300"><X size={18}/></button></div>
      {notice&&<div role="status" className="mt-2 rounded-lg border border-amber-200/20 bg-amber-200/10 p-2 text-xs text-amber-100">{notice}</div>}
      <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={enterSelected} className="min-h-11 rounded-xl bg-emerald-300 px-3 text-sm font-extrabold text-[#05231b]">ENTER</button><button onClick={()=>{setWaypoint({x:selected.doorX,z:selected.doorZ,label:selected.label,kind:selected.kind});setNotice("Green GPS route set to the building door.")}} className="min-h-11 rounded-xl border border-emerald-200/30 bg-emerald-300/10 px-3 text-sm font-bold text-emerald-100">GO THERE</button><button onClick={goInside} className="min-h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-bold">GO INSIDE</button><button onClick={()=>setRides(v=>!v)} className="min-h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-bold">GET THERE</button></div>
      {rides&&<div className="mt-3 space-y-2">{RIDE_OPTIONS.map(opt=><button key={opt.id} onClick={()=>startRide(opt.id)} className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/15 px-3 text-left"><span><span className="block text-sm font-bold">{opt.title}</span><span className="block text-xs text-slate-300">{opt.detail} · ETA {opt.eta(playerDistance)} min</span></span><span className="text-sm font-extrabold text-emerald-200">{opt.price?cashLabel(opt.price + Math.ceil(playerDistance*opt.rate)):"FREE"}</span></button>)}
      <button onClick={()=>{if(!owned.length){setNotice("You don't own a vehicle yet. Open Garage to buy one.");openPhone("garage");return}setWaypoint({x:selected.doorX,z:selected.doorZ,label:selected.label,kind:selected.kind});openPhone("garage")}} className="flex min-h-11 w-full items-center justify-between rounded-xl border border-white/10 px-3 text-sm font-bold"><span>Drive myself</span><span className="text-xs text-emerald-200">{owned.length?"Choose owned vehicle":"Buy a vehicle"}</span></button></div>}
    </div>}
    {rideRequest&&<div className="relative z-20 rounded-xl border border-sky-300/20 bg-sky-300/10 p-2.5 text-xs text-sky-100"><div>{rideRequest.status==="approaching"?"Driver arriving":"On the way"} · {rideRequest.destination.label}</div><div className="mt-2 flex gap-2">{rideRequest.status==="approaching"&&<button onClick={()=>{useGame.getState().earn(rideRequest.fare,"cash");useGame.getState().setRideRequest(null);setNotice("Ride cancelled before pickup. Fare refunded.");}} className="min-h-10 rounded-lg border border-white/15 px-3 font-bold">Cancel</button>}{rideRequest.status==="travelling"&&<button onClick={()=>{setSkipFade(true);window.setTimeout(()=>{g.playerPos.set(rideRequest.destination.x,0,rideRequest.destination.z);g.ridingPassenger=false;useGame.getState().setRideRequest(null);useGame.getState().setWaypoint(null);setSkipFade(false)},450)}} className="min-h-10 rounded-lg bg-emerald-300 px-3 font-extrabold text-[#05231b]">Skip · arrive now</button>}</div></div>}
    {skipFade&&<div className="fixed inset-0 z-[100] bg-black transition-opacity duration-500" aria-label="Arriving at destination"/>}
    <div className="relative z-20 mt-auto flex items-center justify-around rounded-2xl border border-white/10 bg-[#102326]/95 p-1.5 backdrop-blur"><button onClick={()=>openPhone("home")} className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs text-slate-200"><Home size={17}/>Home</button><button onClick={()=>openPhone("market")} className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs text-slate-200"><ShoppingBag size={17}/>Buy</button><span className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-bold text-emerald-200"><MapPin size={17}/>Map</span><button onClick={closePhone} className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs text-slate-200"><X size={17}/>Phone</button></div>
  </div>;
}
