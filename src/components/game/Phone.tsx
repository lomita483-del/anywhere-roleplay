import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Banknote, Briefcase, Car, Map as MapIcon, Package, Radio as RadioIcon, ShoppingBag, User,
} from "lucide-react";
import { g } from "@/game/state";
import { useGame, naira, JOB_INFO, MARKET_ITEMS, VEHICLE_CATALOG, type JobType } from "@/game/store";
import { deliverOwnedVehicle } from "@/game/actions";
import { POIS, ROADS_X, ROADS_Z, ROAD_HALF, JOB_POINTS } from "@/game/city";

type App = "home" | "bank" | "jobs" | "garage" | "inventory" | "map" | "radio" | "market";

const APP_ICONS: Record<App, { icon: typeof User; label: string; tint: string }> = {
  home: { icon: User, label: "Profile", tint: "#3fa37a" },
  bank: { icon: Banknote, label: "Bank", tint: "#4a7ec9" },
  jobs: { icon: Briefcase, label: "Jobs", tint: "#e2a13c" },
  garage: { icon: Car, label: "Garage", tint: "#c95bb0" },
  inventory: { icon: Package, label: "Items", tint: "#e2574c" },
  map: { icon: MapIcon, label: "Map", tint: "#5bb06a" },
  radio: { icon: RadioIcon, label: "Radio", tint: "#9db8c9" },
  market: { icon: ShoppingBag, label: "Market", tint: "#59d6a2" },
};

function atAtm() {
  const p = POIS.find((p) => p.kind === "atm" && Math.hypot(p.x - g.playerPos.x, p.z - g.playerPos.z) < 5);
  return !!p;
}

function BankApp() {
  const cash = useGame((s) => s.cash);
  const bank = useGame((s) => s.bank);
  const transfer = useGame((s) => s.transfer);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setNear(atAtm()), 500);
    return () => clearInterval(t);
  }, []);

  const Row = ({ label, dir, amount }: { label: string; dir: "deposit" | "withdraw"; amount: number | "all" }) => (
    <button
      disabled={!near}
      className="rounded-xl border border-hud-line bg-white/5 px-3 py-2 text-xs font-semibold text-hud-bright disabled:opacity-40"
      onClick={() => transfer(amount === "all" ? (dir === "deposit" ? cash : bank) : amount, dir)}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <div className="rounded-2xl bg-gradient-to-br from-[#1f6b4a] to-[#14503a] p-4 text-white">
        <div className="text-[10px] uppercase tracking-widest opacity-70">Lagos Union Bank</div>
        <div className="mt-1 text-2xl font-bold">{naira(bank)}</div>
        <div className="mt-1 text-xs opacity-80">Wallet cash: {naira(cash)}</div>
      </div>
      {near ? (
        <div className="text-xs font-semibold text-hud-accent">You are at an ATM.</div>
      ) : (
        <div className="rounded-xl border border-hud-line bg-white/5 p-2 text-xs text-hud-muted">
          Walk to an ATM (yellow ring on the map) to deposit or withdraw.
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <Row label="+ ₦1k" dir="deposit" amount={1000} />
        <Row label="+ ₦5k" dir="deposit" amount={5000} />
        <Row label="Deposit all" dir="deposit" amount="all" />
        <Row label="- ₦1k" dir="withdraw" amount={1000} />
        <Row label="- ₦5k" dir="withdraw" amount={5000} />
        <Row label="Withdraw all" dir="withdraw" amount="all" />
      </div>
      </div>
    </div>
  );
}

function JobsApp() {
  const active = useGame((s) => s.activeJob);
  const accept = useGame((s) => s.acceptJob);
  const cancel = useGame((s) => s.cancelJob);
  const nearTarget = useGame((s) => s.nearJobTarget);

  if (active) {
    return (
      <div className="flex flex-col gap-3 p-3 text-sm">
        <div className="rounded-2xl border border-hud-line bg-white/5 p-4">
          <div className="text-[10px] uppercase tracking-widest text-hud-muted">Active job</div>
          <div className="mt-1 text-lg font-bold text-hud-bright">{active.title}</div>
          <div className="mt-1 text-xs text-hud-muted">{active.hint}</div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-hud-muted">Stage {active.stage + 1} / {active.targets.length}</span>
            <span className="font-semibold text-hud-accent">{Math.round(nearTarget)}m to target</span>
          </div>
          <div className="mt-1 text-xs text-hud-muted">Pays {naira(active.payout)} to bank</div>
        </div>
        <button className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive" onClick={cancel}>
          Abandon job
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 p-3 text-sm">
      <div className="text-[10px] uppercase tracking-widest text-hud-muted">Job board — Lagos hustle</div>
      {(Object.keys(JOB_INFO) as JobType[]).map((t) => (
        <div key={t} className="rounded-2xl border border-hud-line bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-hud-bright">{JOB_INFO[t].title}</span>
            <span className="text-xs font-semibold text-hud-accent">{naira(JOB_INFO[t].payout)}</span>
          </div>
          <div className="mt-0.5 text-xs text-hud-muted">{JOB_INFO[t].desc}</div>
          <button
            className="mt-2 w-full rounded-xl bg-hud-accent/20 py-1.5 text-xs font-semibold text-hud-accent active:scale-[0.98]"
            onClick={() => accept(t)}
          >
            Accept job
          </button>
        </div>
      ))}
    </div>
  );
}

function GarageApp() {
  const owned = useGame((s) => s.owned);
  const deliver = deliverOwnedVehicle;
  return (
    <div className="flex flex-col gap-2 p-3 text-sm">
      <div className="text-[10px] uppercase tracking-widest text-hud-muted">Your vehicles ({owned.length})</div>
      {owned.length === 0 && (
        <div className="rounded-xl border border-hud-line bg-white/5 p-3 text-xs text-hud-muted">
          No vehicles yet. Buy one at Ojoto Motors, or jump on any parked Keke Napep around town.
        </div>
      )}
      {owned.map((key, i) => {
        const v = VEHICLE_CATALOG[key];
        if (!v) return null;
        return (
          <div key={i} className="flex items-center justify-between rounded-2xl border border-hud-line bg-white/5 p-3">
            <div>
              <div className="font-semibold text-hud-bright">{v.name}</div>
              <div className="text-[10px] text-hud-muted">top {Math.round(v.maxSpeed * 3.6)} km/h</div>
            </div>
            <button
              className="rounded-xl bg-hud-accent/20 px-3 py-1.5 text-xs font-semibold text-hud-accent active:scale-95"
              onClick={() => deliver(key)}
            >
              Call over
            </button>
          </div>
        );
      })}
    </div>
  );
}

function HomeApp() {
  const name = useGame((s) => s.name);
  const cash = useGame((s) => s.cash);
  const bank = useGame((s) => s.bank);
  const stats = useGame((s) => s.jobStats);
  const owned = useGame((s) => s.owned);
  return (
    <div className="flex flex-col items-center gap-2 p-4 text-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-hud-accent to-[#e28a3c] text-2xl font-bold text-black">
        {(name || "H").charAt(0).toUpperCase()}
      </div>
      <div className="text-lg font-bold text-hud-bright">{name || "Hustler"}</div>
      <div className="grid w-full grid-cols-2 gap-2 pt-1">
        <div className="rounded-xl border border-hud-line bg-white/5 p-2 text-center">
          <div className="text-[10px] text-hud-muted">Cash</div>
          <div className="text-sm font-bold text-hud-bright">{naira(cash)}</div>
        </div>
        <div className="rounded-xl border border-hud-line bg-white/5 p-2 text-center">
          <div className="text-[10px] text-hud-muted">Bank</div>
          <div className="text-sm font-bold text-hud-bright">{naira(bank)}</div>
        </div>
        <div className="rounded-xl border border-hud-line bg-white/5 p-2 text-center">
          <div className="text-[10px] text-hud-muted">Deliveries</div>
          <div className="text-sm font-bold text-hud-bright">{stats.deliveries + stats.drives}</div>
        </div>
        <div className="rounded-xl border border-hud-line bg-white/5 p-2 text-center">
          <div className="text-[10px] text-hud-muted">Vehicles</div>
          <div className="text-sm font-bold text-hud-bright">{owned.length}</div>
        </div>
      </div>
      <div className="w-full rounded-xl border border-hud-line bg-white/5 p-2 text-center text-xs text-hud-muted">
        Trades: {stats.trades} · Patrols: {stats.patrols}
      </div>
    </div>
  );
}

function MarketplaceApp() {
  const cash = useGame((s) => s.cash);
  const bank = useGame((s) => s.bank);
  const inventory = useGame((s) => s.inventory);
  const purchase = useGame((s) => s.purchaseMarketItem);
  const [notice, setNotice] = useState("");
  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <div className="rounded-2xl border border-[#59d6a2]/30 bg-gradient-to-br from-[#17392f] to-[#111c20] p-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#8de3bf]">Lagos luxury market</div>
        <div className="mt-1 text-lg font-bold text-hud-bright">Style your life.</div>
        <div className="mt-1 text-[11px] text-hud-muted">Bank: {naira(bank)} · Cash: {naira(cash)}</div>
      </div>
      {notice && <div role="status" className="rounded-xl border border-[#59d6a2]/30 bg-[#59d6a2]/10 p-2 text-xs text-[#a6f0d0]">{notice}</div>}
      {(["Clothing", "Car upgrade", "Property"] as const).map((category) => (
        <section key={category} className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-hud-accent">{category}</div>
          {MARKET_ITEMS.filter((item) => item.category === category).map((item) => {
            const owned = (inventory[item.id] ?? 0) > 0;
            return (
              <div key={item.id} className="rounded-2xl border border-hud-line bg-white/[0.045] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-hud-bright">{item.name}</div>
                    <div className="mt-1 text-[10px] leading-relaxed text-hud-muted">{item.description}</div>
                  </div>
                  <div className="shrink-0 text-xs font-bold text-[#8de3bf]">{naira(item.price)}</div>
                </div>
                <button
                  disabled={owned}
                  className="mt-3 w-full rounded-xl border border-[#59d6a2]/30 bg-[#59d6a2]/15 px-3 py-2 text-xs font-bold text-[#a6f0d0] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                  onClick={() => {
                    const ok = purchase(item.id);
                    setNotice(ok ? `Purchased ${item.name}. It is saved in your inventory.` : "Purchase failed — check your balance or ownership.");
                  }}
                >
                  {owned ? "Owned ✓" : "Purchase"}
                </button>
              </div>
            );
          })}
        </section>
      ))}
      <div className="text-[10px] leading-relaxed text-hud-muted">Purchases are deducted from your bank balance first, then cash. Items remain in your saved inventory.</div>
    </div>
  );
}

function InventoryApp() {
  const inv = useGame((s) => s.inventory);
  const items = Object.entries(inv);
  const labels: Record<string, string> = { package: "Parcel", goods: "Crate of goods" };
  return (
    <div className="flex flex-col gap-2 p-3 text-sm">
      <div className="text-[10px] uppercase tracking-widest text-hud-muted">Inventory</div>
      {items.length === 0 && <div className="rounded-xl border border-hud-line bg-white/5 p-3 text-xs text-hud-muted">Empty. Take a courier or trader job to fill up.</div>}
      {items.map(([k, n]) => (
        <div key={k} className="flex items-center justify-between rounded-2xl border border-hud-line bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-hud-accent" />
            <span className="text-hud-bright">{labels[k] ?? k}</span>
          </div>
          <span className="text-sm font-bold text-hud-bright">×{n}</span>
        </div>
      ))}
    </div>
  );
}

function MapApp() {
  const job = useGame((s) => s.activeJob);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draw = () => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d")!;
      const S = c.width;
      const to = (x: number, z: number): [number, number] => [((x + 120) / 240) * S, ((z + 120) / 240) * S];
      ctx.clearRect(0, 0, S, S);
      ctx.fillStyle = "#252b36";
      ctx.fillRect(0, 0, S, S);
      // roads
      ctx.strokeStyle = "#4a5260";
      ctx.lineWidth = ROAD_HALF * (S / 120) * 1.6;
      for (const rx of ROADS_X) {
        const [px] = to(rx, 0);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, S);
        ctx.stroke();
      }
      for (const rz of ROADS_Z) {
        const [, pz] = to(0, rz);
        ctx.beginPath();
        ctx.moveTo(0, pz);
        ctx.lineTo(S, pz);
        ctx.stroke();
      }
      // POIs
      for (const p of POIS) {
        const [px, pz] = to(p.x, p.z);
        ctx.fillStyle = p.kind === "atm" ? "#59d6a2" : "#ffd257";
        ctx.beginPath();
        ctx.arc(px, pz, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // job target
      if (job) {
        const t = job.targets[job.stage];
        if (t) {
          const [px, pz] = to(t[0], t[1]);
          ctx.fillStyle = "#ff5c5c";
          ctx.beginPath();
          ctx.arc(px, pz, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffd0d0";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
      // player
      const [px, pz] = to(g.playerPos.x, g.playerPos.z);
      ctx.fillStyle = "#7fd0ff";
      ctx.beginPath();
      ctx.arc(px, pz, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#e8f7ff";
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    draw();
    const t = setInterval(draw, 700);
    return () => clearInterval(t);
  }, [job]);

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="text-[10px] uppercase tracking-widest text-hud-muted">Lagos city map</div>
      <canvas ref={canvasRef} width={280} height={280} className="w-full rounded-xl border border-hud-line" />
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-hud-muted">
        <span><span className="text-[#7fd0ff]">●</span> You</span>
        <span><span className="text-[#ff5c5c]">●</span> Job target</span>
        <span><span className="text-[#ffd257]">●</span> Landmarks</span>
        <span><span className="text-[#59d6a2]">●</span> ATMs</span>
      </div>
    </div>
  );
}

function RadioApp() {
  const [msgs, setMsgs] = useState<string[]>(["📻 Wazobia FM 99.5 — live from Lagos"]);
  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMsg = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setMsgs((m) => [...m.slice(-40), detail]);
    };
    window.addEventListener("city-radio", onMsg);
    return () => window.removeEventListener("city-radio", onMsg);
  }, []);
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [msgs]);
  return (
    <div className="flex h-full flex-col p-3">
      <div className="text-[10px] uppercase tracking-widest text-hud-muted">City radio — live feed</div>
      <div ref={feedRef} className="mt-2 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {msgs.map((m, i) => (
          <div key={i} className="rounded-xl bg-white/5 px-2.5 py-1.5 text-xs text-hud-bright">
            {m}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Phone() {
  const open = useGame((s) => s.phoneOpen);
  const [app, setApp] = useState<App>("home");
  const openPhone = useGame((s) => s.openPhone);
  const closePhone = useGame((s) => s.closePhone);

  useEffect(() => {
    if (open) setApp(useGame.getState().phoneApp);
  }, [open]);

  if (!open) return null;

  const Screen =
    app === "bank" ? <BankApp /> :
    app === "jobs" ? <JobsApp /> :
    app === "garage" ? <GarageApp /> :
    app === "inventory" ? <InventoryApp /> :
    app === "map" ? <MapApp /> :
    app === "radio" ? <RadioApp /> :
    app === "market" ? <MarketplaceApp /> :
    <HomeApp />;

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 bg-black/35 backdrop-blur-[2px]" onPointerDown={(e) => e.stopPropagation()} onClick={closePhone}>
      <div
      className="absolute bottom-5 right-4 flex h-[68vh] max-h-[620px] w-[min(88vw,360px)] flex-col overflow-hidden rounded-[2rem] border-4 border-hud-line bg-[#10151d]/95 shadow-2xl shadow-black/60 backdrop-blur-xl md:h-[72vh]"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Notch bar */}
      <div className="flex items-center justify-between px-5 pt-2">
        <span className="text-[10px] text-hud-muted">VibeOS</span>
        <div className="h-4 w-16 rounded-full bg-black/60" />
        <button className="text-[10px] text-hud-muted" onClick={closePhone}>close ✕</button>
      </div>

      <div className="mt-1 flex items-center gap-2 px-4 pb-1">
        {app !== "home" && (
          <button onClick={() => setApp("home")} className="rounded-lg bg-white/5 p-1 text-hud-muted active:scale-90" aria-label="Back">
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
        )}
        <span className="text-sm font-bold text-hud-bright">{APP_ICONS[app].label}</span>
      </div>

      <div className="flex-1 overflow-y-auto">{Screen}</div>

      {/* App dock */}
      <div className="grid grid-cols-4 gap-1 border-t border-hud-line bg-black/40 px-2 py-2">
        {(Object.keys(APP_ICONS) as App[]).map((a) => {
          const I = APP_ICONS[a].icon;
          return (
            <button
              key={a}
              className={`flex flex-col items-center gap-0.5 rounded-lg p-1 ${app === a ? "bg-white/10" : ""}`}
              onClick={() => {
                setApp(a);
                openPhone(a);
              }}
            >
              <I className="h-4 w-4" style={{ color: APP_ICONS[a].tint }} />
              <span className="text-[8px] text-hud-muted">{APP_ICONS[a].label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
