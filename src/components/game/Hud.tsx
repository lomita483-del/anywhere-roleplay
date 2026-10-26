import { useEffect, useRef, useState } from "react";
import { Landmark, Moon, Sun, Wallet, Phone as PhoneIcon, ChevronsUp, MapPin } from "lucide-react";
import { g } from "@/game/state";
import { useGame, naira } from "@/game/store";
import { interact } from "@/game/actions";
import Phone from "./Phone";

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

export default function Hud() {
  const cash = useGame((s) => s.cash);
  const bank = useGame((s) => s.bank);
  const clock = useGame((s) => s.clock);
  const speed = useGame((s) => s.speedKph);
  const driving = useGame((s) => s.driving);
  const prompt = useGame((s) => s.prompt);
  const phoneOpen = useGame((s) => s.phoneOpen);
  const job = useGame((s) => s.activeJob);
  const nearTarget = useGame((s) => s.nearJobTarget);
  const openPhone = useGame((s) => s.openPhone);
  const [night, setNight] = useState(false);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      const elev = Math.sin(((g.time - 6) / 24) * Math.PI * 2);
      setNight(elev < 0.05);
    }, 2000);
    return () => clearInterval(t);
  }, []);

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
      </div>

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

      {/* Speedometer */}
      {driving && (
        <div className="hud-panel absolute bottom-6 right-40 px-4 py-3 text-center md:right-48">
          <div className="text-3xl font-bold leading-none text-hud-bright">{Math.round(speed)}</div>
          <div className="text-[10px] uppercase tracking-widest text-hud-muted">km/h</div>
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
      <button
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
      </button>

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

      <Joystick />
      <Phone />
    </div>
  );
}
