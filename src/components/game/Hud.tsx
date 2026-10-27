import { useEffect, useRef, useState } from "react";
import { Landmark, Moon, Sun, Wallet, Phone as PhoneIcon, ChevronsUp, MapPin, Satellite, ZoomIn, ZoomOut } from "lucide-react";
import { g } from "@/game/state";
import { useGame, naira } from "@/game/store";
import { exitApartment, interact } from "@/game/actions";
import Phone from "./Phone";
import { POIS, ROADS_X, ROADS_Z, ROAD_HALF } from "@/game/city";

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
    origin.current = { x: e.clientX, y: e.clientY };
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waypoint = useGame((s) => s.waypoint);
  const [, refresh] = useState(0);
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
    ctx.fillStyle = "#13242a"; ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = "#d1b95c"; ctx.lineWidth = 5;
    for (const x of ROADS_X) { const px = sx(x); ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, S); ctx.stroke(); }
    for (const z of ROADS_Z) { const py = sy(z); ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(S, py); ctx.stroke(); }
    ctx.strokeStyle = "#a9b9b2"; ctx.lineWidth = 1;
    for (const x of ROADS_X) { const px = sx(x); ctx.beginPath(); ctx.moveTo(px - ROAD_HALF, 0); ctx.lineTo(px - ROAD_HALF, S); ctx.moveTo(px + ROAD_HALF, 0); ctx.lineTo(px + ROAD_HALF, S); ctx.stroke(); }
    for (const z of ROADS_Z) { const py = sy(z); ctx.beginPath(); ctx.moveTo(0, py - ROAD_HALF); ctx.lineTo(S, py - ROAD_HALF); ctx.moveTo(0, py + ROAD_HALF); ctx.lineTo(S, py + ROAD_HALF); ctx.stroke(); }
    for (const p of POIS) { const x = sx(p.x), y = sy(p.z); if (Math.hypot(x - center, y - center) > radius - 3) continue; ctx.fillStyle = p.kind === "atm" ? "#5be1a3" : p.kind === "police" ? "#75baff" : "#f6d36b"; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill(); }
    if (waypoint) { const tx = sx(waypoint.x), ty = sy(waypoint.z); ctx.strokeStyle = "#39ef9b"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(center, center); ctx.lineTo(tx, ty); ctx.stroke(); ctx.fillStyle = "#39ef9b"; ctx.beginPath(); ctx.arc(tx, ty, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.translate(center, center); ctx.rotate(g.playerYaw); ctx.fillStyle = "#72d3ff"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(-5, 5); ctx.lineTo(0, 2); ctx.lineTo(5, 5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.restore();
  }, [waypoint]);
  return <button type="button" onClick={onOpen} aria-label="Open full city map" className="pointer-events-auto absolute right-3 top-[7.8rem] rounded-full border border-amber-200/35 bg-[#07131b]/90 p-1 shadow-lg active:scale-95">
    <canvas ref={canvasRef} width={128} height={128} className="h-[104px] w-[104px] rounded-full sm:h-[118px] sm:w-[118px]" />
    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-xs font-bold text-white">LAGOS · MAP</span>
  </button>;
}

export default function Hud() {
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
              <div className="h-1.5 overflow-hidden rounded-full bg-black/40"><div className="h-full rounded-full transition-[width] duration-300" style={{ width: Math.max(0, Math.min(100, value)) + "%", backgroundColor: color }} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* Touch-friendly camera controls: drag the world to look around, pinch to zoom. */}
      <div className="pointer-events-auto absolute right-3 top-[4.1rem] flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[#07100f]/75 p-1.5 shadow-lg backdrop-blur-md">
        <button aria-label="Zoom out" title="Zoom out" className="flex h-8 w-8 items-center justify-center rounded-xl text-white/85 active:bg-white/10" onClick={() => { g.camDistance = Math.min(95, g.camDistance + 5); }}><ZoomOut className="h-4 w-4" /></button>
        <button aria-label="Zoom in" title="Zoom in" className="flex h-8 w-8 items-center justify-center rounded-xl text-white/85 active:bg-white/10" onClick={() => { g.camDistance = Math.max(4, g.camDistance - 5); }}><ZoomIn className="h-4 w-4" /></button>
        <button aria-label="Toggle satellite view" title={satelliteMode ? "Return to street view" : "Satellite view"} className={`flex h-8 items-center gap-1 rounded-xl px-2 text-[9px] font-bold ${satelliteMode ? "bg-[#eab308]/25 text-[#ffe38a]" : "text-white/85"}`} onClick={() => {
          if (!g.camSatellite) {
            g.camBeforeSatellite = { pitch: g.camPitch, distance: g.camDistance };
            g.camSatellite = true; setSatelliteMode(true); g.camPitch = 1.38; g.camDistance = 72;
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
          <span className="font-semibold text-hud-bright">{fmtTime(clock)}</span>
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
      {!phoneOpen && <button
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

      {interior && <button className="pointer-events-auto absolute right-5 top-24 rounded-xl border border-[#eab308]/30 bg-[#101820]/90 px-3 py-2 text-xs font-bold text-[#f4d16a]" onClick={exitApartment}>Exit {interiorLabel} ↗</button>}

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

      {!phoneOpen && <Joystick />}
      <Phone />
      {interiorTransition && <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[60] bg-black" style={{ animation: "lagosInteriorFade 520ms ease-in-out forwards" }}><style>{`@keyframes lagosInteriorFade { 0% { opacity: 0; } 18% { opacity: 1; } 72% { opacity: 1; } 100% { opacity: 0; } }`}</style></div>}
    </div>
  );
}
