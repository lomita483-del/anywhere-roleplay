import { useEffect, useRef, useState } from "react";
import { Landmark, Moon, Sun, Wallet, Phone as PhoneIcon, ChevronsUp, MapPin, Satellite, ZoomIn, ZoomOut } from "lucide-react";
import { g } from "@/game/state";
import { useGame, naira } from "@/game/store";
import { exitApartment, interact } from "@/game/actions";
import Phone from "./Phone";
import { POIS, ROADS_X, ROADS_Z, ROAD_HALF } from "@/game/city";
import { NEW_MAP_POIS, NEW_MAP_ROADS } from "@/game/newMap";

function fmtTime(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.floor((h % 1) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function Joystick() {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const origin = useRef<{ x: number; y: number } | null>(null);
  const R = 52;

  const down = (e: React.PointerEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    origin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!origin.current) return;
    e.stopPropagation();
    const dx = e.clientX - origin.current.x;
    const dy = e.clientY - origin.current.y;
    const d = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(d, R);
    const nx = (dx / d) * clamped;
    const ny = (dy / d) * clamped;
    setKnob({ x: nx, y: ny });
    g.joy.x = nx / R;
    g.joy.y = ny / R;
  };
  const up = (e: React.PointerEvent) => {
    e.stopPropagation();
    origin.current = null;
    setKnob({ x: 0, y: 0 });
    g.joy.x = 0;
    g.joy.y = 0;
  };

  return (
    <div
      className="pointer-events-auto absolute bottom-6 left-6 flex h-32 w-32 touch-none items-center justify-center rounded-full border border-hud-line bg-hud-dim backdrop-blur-sm"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <div
        className="h-14 w-14 rounded-full border border-hud-line bg-hud-accent shadow-lg shadow-black/40 transition-transform"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
}


function MiniMap({ onOpen }: { onOpen: () => void }) {
  const city = useGame((s) => s.city);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waypoint = useGame((s) => s.waypoint);
  const [tick, refresh] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => refresh(v => v + 1), 350); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const S = canvas.width, center = S / 2, scale = 1.05, radius = 57;
    const sx = (x: number) => center + (x - g.playerPos.x) * scale;
    const sy = (z: number) => center + (z - g.playerPos.z) * scale;
    ctx.clearRect(0, 0, S, S);
    ctx.save();
    ctx.beginPath(); ctx.arc(center, center, radius, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = city === "newmap" ? "#89935e" : "#13242a"; ctx.fillRect(0, 0, S, S);
    if (city === "newmap") {
      // Current NEW MAP terrain, water, building clusters and the same curved roads as the 3D world.
      ctx.fillStyle = "#327d98";
      ctx.beginPath(); ctx.ellipse(sx(-112), sy(118), 18, 14, -0.25, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle="#d7c391";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(sx(-112),sy(118),21,17,-0.25,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle="#2b7e9d";ctx.fillRect(sx(116)-20,sy(120)-15,40,30);
      ctx.strokeStyle="#d0cfc4";ctx.lineWidth=11;ctx.lineCap="round";ctx.lineJoin="round";
      for(const path of NEW_MAP_ROADS){ctx.beginPath();path.forEach(([x,z],i)=>i?ctx.lineTo(sx(x),sy(z)):ctx.moveTo(sx(x),sy(z)));ctx.stroke();}
      ctx.strokeStyle="#3d454b";ctx.lineWidth=7;
      for(const path of NEW_MAP_ROADS){ctx.beginPath();path.forEach(([x,z],i)=>i?ctx.lineTo(sx(x),sy(z)):ctx.moveTo(sx(x),sy(z)));ctx.stroke();}
      ctx.strokeStyle="#f4f0df";ctx.lineWidth=1.1;ctx.setLineDash([3,3]);
      for(const path of NEW_MAP_ROADS){ctx.beginPath();path.forEach(([x,z],i)=>i?ctx.lineTo(sx(x),sy(z)):ctx.moveTo(sx(x),sy(z)));ctx.stroke();}
      ctx.setLineDash([]);
      ctx.strokeStyle="#172431";ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(sx(0),sy(0),15,10,0,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle="#3b9b52";ctx.beginPath();ctx.ellipse(sx(0),sy(0),8,5.5,0,0,Math.PI*2);ctx.fill();
      const blocks:[number,number,number,number,string][]=[[-145,-82,34,25,"#7d9ca9"],[-143,-46,26,22,"#8e887a"],[-38,-76,34,19,"#c28b4f"],[-110,32,30,24,"#a88f78"],[98,-40,56,58,"#c7bca5"],[78,10,30,24,"#b3a99a"],[116,120,42,28,"#8b9b9b"],[6,-142,50,48,"#a6b2b0"]];
      for(const [x,z,w,d,c] of blocks){ctx.fillStyle=c;ctx.fillRect(sx(x-w/2),sy(z-d/2),w*scale,d*scale);}
      ctx.fillStyle="#b8a58a";for(let row=0;row<8;row++)for(let col=0;col<8;col++){const x=82+col*10.4,z=-63+row*10.3;ctx.fillRect(sx(x)-2,sy(z)-2,4,4);}
      for(const p of NEW_MAP_POIS){const x=sx(p.x),y=sy(p.z);if(Math.hypot(x-center,y-center)>radius-3)continue;ctx.fillStyle=p.kind==="airport"?"#8cc8ff":p.kind==="port"?"#f0b56a":p.kind==="stadium"?"#f7d35c":p.kind==="university"?"#c5a7ff":p.kind==="lake"?"#5fe0d1":(p.kind==="bank"||p.kind==="atm")?"#69e3a7":p.kind==="police"?"#79aaff":"#ffdc8a";ctx.beginPath();ctx.arc(x,y,p.kind==="stadium"?3.5:2.5,0,Math.PI*2);ctx.fill();}
    } else {
      ctx.strokeStyle = "#d1b95c"; ctx.lineWidth = 5;
      for (const x of ROADS_X) { const px = sx(x); ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, S); ctx.stroke(); }
      for (const z of ROADS_Z) { const py = sy(z); ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(S, py); ctx.stroke(); }
      ctx.strokeStyle = "#a9b9b2"; ctx.lineWidth = 1;
      for (const x of ROADS_X) { const px = sx(x); ctx.beginPath(); ctx.moveTo(px - ROAD_HALF, 0); ctx.lineTo(px - ROAD_HALF, S); ctx.moveTo(px + ROAD_HALF, 0); ctx.lineTo(px + ROAD_HALF, S); ctx.stroke(); }
      for (const z of ROADS_Z) { const py = sy(z); ctx.beginPath(); ctx.moveTo(0, py - ROAD_HALF); ctx.lineTo(S, py - ROAD_HALF); ctx.moveTo(0, py + ROAD_HALF); ctx.lineTo(S, py + ROAD_HALF); ctx.stroke(); }
      for (const p of POIS) { const x = sx(p.x), y = sy(p.z); if (Math.hypot(x - center, y - center) > radius - 3) continue; ctx.fillStyle = p.kind === "atm" ? "#5be1a3" : p.kind === "police" ? "#75baff" : "#f6d36b"; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill(); }
    }
    if (waypoint) { const tx = sx(waypoint.x), ty = sy(waypoint.z); ctx.strokeStyle = "#39ef9b"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(center, center); ctx.lineTo(tx, ty); ctx.stroke(); ctx.fillStyle = "#39ef9b"; ctx.beginPath(); ctx.arc(tx, ty, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.translate(center, center); ctx.rotate(g.playerYaw); ctx.fillStyle = "#72d3ff"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(-5, 5); ctx.lineTo(0, 2); ctx.lineTo(5, 5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.restore();
  }, [waypoint, tick, city]);
  return <button type="button" onClick={onOpen} aria-label="Open full city map" className="pointer-events-auto absolute right-3 top-[7.8rem] rounded-full border border-amber-200/35 bg-[#07131b]/90 p-1 shadow-lg active:scale-95">
    <canvas ref={canvasRef} width={128} height={128} className="h-[104px] w-[104px] rounded-full sm:h-[118px] sm:w-[118px]" />
    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-xs font-bold text-white">{city === "newmap" ? "NEW MAP" : city === "umuahia" ? "UMUAHIA · MAP" : "LAGOS · MAP"}</span>
  </button>;
}

export default function Hud() {
  const city = useGame((s) => s.city);
  const setCity = useGame((s) => s.setCity);
  const stadiumMode = useGame((s) => s.stadiumMode);
  const exitStadium = useGame((s) => s.exitStadium);
  const cash = useGame((s) => s.cash);
  const bank = useGame((s) => s.bank);
  const needs = useGame((s) => s.needs);
  const clock = useGame((s) => s.clock);
  const speed = useGame((s) => s.speedKph);
  const fuelLevel = useGame((s) => s.fuelLevel);
  const driving = useGame((s) => s.driving);
  const prompt = useGame((s) => s.prompt);
  const phoneOpen = useGame((s) => s.phoneOpen);
  const job = useGame((s) => s.activeJob);
  const waypoint = useGame((s) => s.waypoint);
  const interior = useGame((s) => s.interior);
  const interiorLabel = useGame((s) => s.interiorLabel);
  const clearWaypoint = useGame((s) => s.clearWaypoint);
  const [gpsDistance, setGpsDistance] = useState(0);
  const [gpsBearing, setGpsBearing] = useState(0);
  const nearTarget = useGame((s) => s.nearJobTarget);
  const openPhone = useGame((s) => s.openPhone);
  const [night, setNight] = useState(false);
  const [weather, setWeather] = useState("CLEAR");
  const [run, setRun] = useState(false);
  const [sirenOn, setSirenOn] = useState(false);
  const [satelliteMode, setSatelliteMode] = useState(false);
  const [interiorTransition, setInteriorTransition] = useState(false);
  const previousInterior = useRef(interior);
  useEffect(() => {
    if (previousInterior.current === interior) return;
    previousInterior.current = interior;
    setInteriorTransition(true);
    const timer = window.setTimeout(() => setInteriorTransition(false), 520);
    return () => window.clearTimeout(timer);
  }, [interior]);

  useEffect(() => {
    const t = setInterval(() => {
      const elev = Math.sin(((g.time - 6) / 24) * Math.PI * 2);
      setNight(elev < 0.05);
      setWeather(g.raining ? "RAIN" : "CLEAR");
      if (waypoint) {
        const dx = waypoint.x - g.playerPos.x;
        const dz = waypoint.z - g.playerPos.z;
        setGpsDistance(Math.round(Math.hypot(dx, dz)));
        setGpsBearing(Math.atan2(dx, dz));
      } else {
        setGpsDistance(0);
        setGpsBearing(0);
      }
    }, 350);
    return () => clearInterval(t);
  }, [waypoint]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      {/* Wallet */}
      <div className="hud-panel absolute left-3 top-3 flex flex-col gap-1 px-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-hud-accent" />
          <span className="font-semibold text-hud-bright">{naira(cash)}</span>
          <span className="text-hud-muted">cash</span>
        </div>
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-hud-accent" />
          <span className="font-semibold text-hud-bright">{naira(bank)}</span>
          <span className="text-hud-muted">bank</span>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-white/10 pt-2">
          {([
            ["Hunger", needs.hunger, "#f59e0b"],
            ["Energy", needs.energy, "#60a5fa"],
            ["Health", needs.health, "#34d399"],
            ["Stress", 100 - needs.stress, "#f87171"],
          ] as [string, number, string][]).map(([label, value, color]) => (
            <div key={label} className="min-w-[66px]">
              <div className="mb-0.5 flex justify-between gap-2 text-[8px] uppercase tracking-wider text-hud-muted"><span>{label}</span><span>{Math.round(value)}%</span></div>
              <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-black/45 shadow-inner"><div className="h-full rounded-full transition-[width] duration-300 shadow-[0_0_7px_rgba(255,255,255,.18)]" style={{ width: Math.max(0, Math.min(100, value)) + "%", backgroundImage: "linear-gradient(90deg, " + color + ", #f8fafc88)", boxShadow: "inset 0 1px 1px rgba(255,255,255,.42)" }} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* City switch: loads a separate playable city while preserving the existing Lagos world. */}
      <div className="pointer-events-auto absolute left-1/2 top-3 -translate-x-1/2">
        <button
          type="button"
          onClick={() => setCity(city === "newmap" ? "lagos" : city === "lagos" ? "umuahia" : "newmap")}
          className="flex items-center gap-2 rounded-xl border border-amber-200/40 bg-[#10231f]/95 px-3 py-2 text-[10px] font-black tracking-wider text-amber-100 shadow-xl backdrop-blur-md active:scale-95"
          title="Switch playable city"
        >
          <MapPin className="h-3.5 w-3.5" />
          {city === "newmap" ? "ENTER LAGOS" : city === "lagos" ? "ENTER UMUAHIA" : "RETURN TO NEW MAP"}
        </button>
      </div>

      {/* Touch-friendly camera controls: drag the world to look around, pinch to zoom. */}
      <div className="pointer-events-auto absolute right-3 top-[4.1rem] flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[#07100f]/75 p-1.5 shadow-lg backdrop-blur-md">
        <button aria-label="Zoom out" title="Zoom out" className="flex h-8 w-8 items-center justify-center rounded-xl text-white/85 active:bg-white/10" onClick={() => { g.camDistance = Math.min(500, g.camDistance + Math.max(5, g.camDistance * 0.22)); }}><ZoomOut className="h-4 w-4" /></button>
        <button aria-label="Zoom in" title="Zoom in" className="flex h-8 w-8 items-center justify-center rounded-xl text-white/85 active:bg-white/10" onClick={() => { g.camDistance = Math.max(2.5, g.camDistance - Math.max(3, g.camDistance * 0.22)); }}><ZoomIn className="h-4 w-4" /></button>
        <button aria-label="Toggle satellite view" title={satelliteMode ? "Return to street view" : "Satellite view"} className={`flex h-8 min-w-[58px] items-center justify-center gap-1 whitespace-nowrap rounded-xl px-2 text-[9px] font-bold ${satelliteMode ? "bg-[#eab308]/25 text-[#ffe38a]" : "text-white/85"}`} onClick={() => {
          if (!g.camSatellite) {
            g.camBeforeSatellite = { pitch: g.camPitch, distance: g.camDistance };
            g.camSatellite = true; setSatelliteMode(true); g.camPitch = 1.38; g.camDistance = 168;
          } else {
            g.camSatellite = false; setSatelliteMode(false); g.camPitch = g.camBeforeSatellite.pitch; g.camDistance = g.camBeforeSatellite.distance;
          }
        }}><Satellite className="h-4 w-4" /><span>{satelliteMode ? "STREET" : "SAT"}</span></button>
      </div>

      {/* Live circular minimap; tap to open the full map. */}
      {!phoneOpen && <MiniMap onOpen={() => openPhone("map")} />}

      {/* Clock + job tracker */}
      <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
        <div className="hud-panel flex items-center gap-2 px-3 py-2 text-sm">
          {night ? <Moon className="h-4 w-4 text-hud-accent" /> : <Sun className="h-4 w-4 text-hud-accent" />}
          <span className="font-semibold text-hud-bright">{fmtTime(clock)}</span>{city === "newmap" && <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black tracking-wider text-emerald-100">{weather}</span>}
        </div>
        {job && (
          <div className="hud-panel flex items-center gap-2 px-3 py-1.5 text-xs">
            <MapPin className="h-3.5 w-3.5 text-hud-accent" />
            <span className="text-hud-bright">{job.title}</span>
            <span className="text-hud-muted">{Math.round(nearTarget)}m</span>
          </div>
        )}
      </div>

      {waypoint && !phoneOpen && (
        <div className="hud-panel pointer-events-auto absolute left-1/2 top-[5.4rem] flex -translate-x-1/2 items-center gap-2 rounded-full border border-red-400/30 bg-[#160f12]/85 px-3 py-2 backdrop-blur-md">
          <MapPin className="h-4 w-4 text-red-400" />
          <div className="max-w-[44vw]"><div className="truncate text-[10px] font-bold text-white">{waypoint.label}</div><div className="text-[9px] text-red-200">{gpsDistance}m · GPS ACTIVE</div></div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/15" style={{ transform: `rotate(${gpsBearing * 180 / Math.PI}deg)` }}><span className="text-sm font-black text-red-300">↑</span></div>
          <button aria-label="Clear GPS route" className="ml-1 text-xs text-white/60" onClick={clearWaypoint}>✕</button>
        </div>
      )}

      {driving && job?.type === "security" && (
        <button className={`pointer-events-auto absolute bottom-28 right-5 rounded-xl border px-3 py-2 text-[10px] font-black tracking-wider ${sirenOn ? "border-red-400 bg-red-500/30 text-red-100 animate-pulse" : "border-hud-line bg-hud-dim text-hud-bright"}`} onClick={() => { g.sirenOn = !g.sirenOn; setSirenOn(g.sirenOn); useGame.getState().radio(g.sirenOn ? "🚨 Emergency siren activated." : "🚨 Emergency siren switched off."); }}>{sirenOn ? "SIREN ON" : "SIREN OFF"}</button>
      )}

      {/* Speedometer */}
      {driving && (
        <div className="hud-panel absolute bottom-6 right-40 px-4 py-3 text-center md:right-48">
          <div className="text-3xl font-bold leading-none text-hud-bright">{Math.round(speed)}</div>
          <div className="text-[10px] uppercase tracking-widest text-hud-muted">km/h</div>
          <div className="mt-2 flex items-center justify-between gap-3 text-[9px] font-bold text-hud-muted"><span>FUEL</span><span className={fuelLevel < 15 ? "text-red-300" : "text-amber-200"}>{Math.round(fuelLevel)}%</span></div>
          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-black/40"><div className={fuelLevel < 15 ? "h-full rounded-full bg-red-400" : "h-full rounded-full bg-amber-400"} style={{ width: fuelLevel + "%" }} /></div>
        </div>
      )}

      {/* Interaction prompt */}
      {prompt && !phoneOpen && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 md:bottom-24">
          <button
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-hud-line bg-hud-dim px-5 py-2.5 text-sm font-semibold text-hud-bright backdrop-blur-md active:scale-95"
            onClick={() => interact()}
          >
            <span className="rounded border border-hud-line px-1.5 py-0.5 text-[10px] text-hud-accent">E</span>
            {prompt.label}
          </button>
        </div>
      )}

      {/* Sprint toggle (mobile) */}
      {!phoneOpen && !stadiumMode && <button
        className={`pointer-events-auto absolute bottom-40 left-10 flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-sm active:scale-95 ${
          run ? "border-hud-accent bg-hud-accent/30" : "border-hud-line bg-hud-dim"
        }`}
        onClick={() => {
          g.sprint = !g.sprint;
          setRun(g.sprint);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <ChevronsUp className="h-5 w-5 text-hud-bright" />
      </button>}

      {interior && /apartment|studio|home/i.test(interiorLabel) && (
        <div className="pointer-events-auto absolute right-3 top-24 flex max-w-[44vw] flex-col gap-1.5 sm:right-5">
          <button className="min-h-10 rounded-xl border border-amber-300/30 bg-[#101820]/95 px-3 py-2 text-xs font-bold text-amber-100" onClick={() => useGame.getState().sleep()}>🛏 Sleep · 07:00</button>
          <button className="min-h-10 rounded-xl border border-emerald-300/25 bg-[#101820]/95 px-3 py-2 text-xs font-bold text-emerald-100" onClick={() => openPhone("inventory")}>🧊 Fridge / Stored food</button>
          <button className="min-h-10 rounded-xl border border-sky-300/25 bg-[#101820]/95 px-3 py-2 text-xs font-bold text-sky-100" onClick={() => openPhone("wardrobe")}>👕 Wardrobe</button>
          <button className="min-h-10 rounded-xl border border-white/15 bg-[#101820]/95 px-3 py-2 text-xs font-bold text-white" onClick={() => useGame.getState().radio("📺 The TV is playing the evening news from Lagos.")}>📺 Turn on TV</button>
          <button className="min-h-10 rounded-xl border border-rose-300/25 bg-[#101820]/95 px-3 py-2 text-xs font-bold text-rose-100" onClick={exitApartment}>Exit {interiorLabel} ↗</button>
        </div>
      )}
      {interior && !/apartment|studio|home/i.test(interiorLabel) && <button className="pointer-events-auto absolute right-5 top-24 rounded-xl border border-[#eab308]/30 bg-[#101820]/90 px-3 py-2 text-xs font-bold text-[#f4d16a]" onClick={exitApartment}>Exit {interiorLabel} ↗</button>}

      {/* Phone toggle */}
      {!phoneOpen && (
        <button
          className="pointer-events-auto absolute bottom-6 right-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-hud-line bg-hud-dim backdrop-blur-md active:scale-95"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => openPhone()}
          aria-label="Open phone"
        >
          <PhoneIcon className="h-6 w-6 text-hud-accent" />
        </button>
      )}

      {!phoneOpen && !stadiumMode && <Joystick />}
      {stadiumMode && <div className="pointer-events-auto absolute bottom-7 left-1/2 z-30 -translate-x-1/2"><button type="button" onClick={exitStadium} className="rounded-full border border-amber-200/70 bg-[#101820]/95 px-6 py-3 text-sm font-black tracking-wide text-amber-100 shadow-2xl shadow-black/50 active:scale-95">↗ EXIT STADIUM</button><div className="mt-1 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">Spectator mode · Free entry</div></div>}
      <Phone />
      {interiorTransition && <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[60] bg-black" style={{ animation: "lagosInteriorFade 520ms ease-in-out forwards" }}><style>{`@keyframes lagosInteriorFade { 0% { opacity: 0; } 18% { opacity: 1; } 72% { opacity: 1; } 100% { opacity: 0; } }`}</style></div>}
    </div>
  );
}
