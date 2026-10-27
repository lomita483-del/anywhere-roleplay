import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Banknote, Briefcase, Car, Bike, Footprints, MapPin, Map as MapIcon, Package, Radio as RadioIcon, ShoppingBag, User, Shirt, Utensils,
} from "lucide-react";
import { g } from "@/game/state";
import { useGame, naira, JOB_INFO, MARKET_ITEMS, VEHICLE_CATALOG, type JobType, type PlayerOutfit } from "@/game/store";
import { deliverOwnedVehicle } from "@/game/actions";
import { supabase } from "@/integrations/supabase/client";
import { POIS, ROADS_X, ROADS_Z, ROAD_HALF, JOB_POINTS, BUILDINGS, WORLD } from "@/game/city";

type App = "home" | "bank" | "jobs" | "garage" | "inventory" | "map" | "radio" | "market" | "wardrobe" | "rides" | "food";

const APP_ICONS: Record<App, { icon: typeof User; label: string; tint: string }> = {
  home: { icon: User, label: "Profile", tint: "#3fa37a" },
  bank: { icon: Banknote, label: "Bank", tint: "#4a7ec9" },
  jobs: { icon: Briefcase, label: "Jobs", tint: "#e2a13c" },
  garage: { icon: Car, label: "Garage", tint: "#c95bb0" },
  inventory: { icon: Package, label: "Items", tint: "#e2574c" },
  map: { icon: MapIcon, label: "Map", tint: "#5bb06a" },
  radio: { icon: RadioIcon, label: "Radio", tint: "#9db8c9" },
  market: { icon: ShoppingBag, label: "Market", tint: "#59d6a2" },
  wardrobe: { icon: Shirt, label: "Wardrobe", tint: "#eab308" },
  rides: { icon: MapPin, label: "Ride & GPS", tint: "#63c7f0" },
  food: { icon: Utensils, label: "Buka & Food", tint: "#f59e0b" },
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
        <div className="text-[10px] uppercase tracking-widest opacity-70">Zenith / Kuda Bank</div>
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
  const rent = useGame((s) => s.rentMarketItem);
  const rentals = useGame((s) => s.rentals);
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
                <div className="mt-3 flex gap-2">
                  <button disabled={owned} className="flex-1 rounded-xl border border-[#59d6a2]/30 bg-[#59d6a2]/15 px-3 py-2 text-xs font-bold text-[#a6f0d0] disabled:opacity-45" onClick={() => {
                    const ok = purchase(item.id);
                    setNotice(ok ? "Purchased " + item.name + ". Saved in inventory." : "Purchase failed — check bank funds or ownership.");
                  }}>{owned ? "Owned ✓" : "Buy"}</button>
                  {category === "Property" && <button disabled={owned || (rentals[item.id] ?? 0) > Date.now()} className="flex-1 rounded-xl border border-[#eab308]/30 bg-[#eab308]/10 px-2 py-2 text-[10px] font-bold text-[#f4d16a] disabled:opacity-45" onClick={() => {
                    const ok = rent(item.id);
                    setNotice(ok ? "Rented " + item.name + " for 7 days using bank funds." : "Rental failed — check bank funds or current rental.");
                  }}>{(rentals[item.id] ?? 0) > Date.now() ? "Rented ✓" : "Rent 7 days · " + naira(Math.max(1000, Math.round(item.price * 0.2)))}</button>}
                </div>
              </div>
            );
          })}
        </section>
      ))}
      <div className="text-[10px] leading-relaxed text-hud-muted">Property purchases and seven-day rentals use bank funds. Other purchases use bank first, then cash; inventory remains saved.</div>
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
  const waypoint = useGame((s) => s.waypoint);
  const setWaypoint = useGame((s) => s.setWaypoint);
  const clearWaypoint = useGame((s) => s.clearWaypoint);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPoi, setSelectedPoi] = useState<(typeof POIS)[number] | null>(null);
  const [, setPositionTick] = useState(0);
  const to = (x: number, z: number, size = 280): [number, number] => [((x + WORLD / 2) / WORLD) * size, ((z + WORLD / 2) / WORLD) * size];

  useEffect(() => {
    const draw = () => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const S = c.width;
      ctx.clearRect(0, 0, S, S);
      // Draw the same world bounds, road widths and building footprints used by the 3D scene.
      ctx.fillStyle = "#9da78a";
      ctx.fillRect(0, 0, S, S);
      // City blocks / undeveloped plots
      ctx.fillStyle = "#b9bba6";
      for (let bx = -40; bx <= 40; bx += 80) {
        for (let bz = -40; bz <= 40; bz += 80) {
          const [x1, z1] = to(bx - 33, bz - 33, S);
          const [x2, z2] = to(bx + 33, bz + 33, S);
          ctx.fillRect(x1, z1, x2 - x1, z2 - z1);
        }
      }
      // Sidewalk strips and asphalt roads exactly follow the world road centerlines.
      ctx.fillStyle = "#d0cfc4";
      const sidewalkWidth = 6 * S / WORLD;
      const roadWidth = ROAD_HALF * 2 * S / WORLD;
      for (const rx of ROADS_X) {
        const [px] = to(rx, 0, S);
        ctx.fillRect(px - (roadWidth + sidewalkWidth) / 2, 0, roadWidth + sidewalkWidth, S);
      }
      for (const rz of ROADS_Z) {
        const [, pz] = to(0, rz, S);
        ctx.fillRect(0, pz - (roadWidth + sidewalkWidth) / 2, S, roadWidth + sidewalkWidth);
      }
      ctx.fillStyle = "#4b5058";
      for (const rx of ROADS_X) {
        const [px] = to(rx, 0, S);
        ctx.fillRect(px - roadWidth / 2, 0, roadWidth, S);
      }
      for (const rz of ROADS_Z) {
        const [, pz] = to(0, rz, S);
        ctx.fillRect(0, pz - roadWidth / 2, S, roadWidth);
      }
      // Dashed centre lines and white road-edge lines.
      ctx.strokeStyle = "#e8c95c";
      ctx.lineWidth = 1.3;
      ctx.setLineDash([5, 5]);
      for (const rx of ROADS_X) {
        const [px] = to(rx, 0, S);
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, S); ctx.stroke();
      }
      for (const rz of ROADS_Z) {
        const [, pz] = to(0, rz, S);
        ctx.beginPath(); ctx.moveTo(0, pz); ctx.lineTo(S, pz); ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(255,255,255,.78)";
      ctx.lineWidth = 1;
      for (const rx of ROADS_X) {
        const [px] = to(rx, 0, S);
        for (const edge of [-1, 1]) { ctx.beginPath(); ctx.moveTo(px + edge * roadWidth / 2, 0); ctx.lineTo(px + edge * roadWidth / 2, S); ctx.stroke(); }
      }
      for (const rz of ROADS_Z) {
        const [, pz] = to(0, rz, S);
        for (const edge of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, pz + edge * roadWidth / 2); ctx.lineTo(S, pz + edge * roadWidth / 2); ctx.stroke(); }
      }
      // Real building footprints, using the same coordinates as the 3D scene.
      for (const b of BUILDINGS) {
        const [x1, z1] = to(b.x - b.w / 2, b.z - b.d / 2, S);
        const [x2, z2] = to(b.x + b.w / 2, b.z + b.d / 2, S);
        ctx.fillStyle = b.kind === "bank" ? "#c8b78c" : b.kind === "police" ? "#6686a5" : b.kind === "market" ? "#c7864b" : b.kind === "apartments" ? "#8c83a1" : "#777f7d";
        ctx.fillRect(x1, z1, x2 - x1, z2 - z1);
        ctx.strokeStyle = "rgba(18,27,31,.65)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x1, z1, x2 - x1, z2 - z1);
      }
      // Airport runway and live construction parcel are drawn at the same coordinates as the 3D world props.
      {
        const [rx1, rz1] = to(24, -101, S);
        const [rx2, rz2] = to(78, -91, S);
        ctx.fillStyle = "#363d46";
        ctx.fillRect(rx1, rz1, rx2 - rx1, rz2 - rz1);
        ctx.strokeStyle = "#f4f0dc"; ctx.lineWidth = 1;
        for (const z of [-100, -96, -92]) {
          const [, py] = to(0, z, S);
          ctx.beginPath(); ctx.moveTo(rx1, py); ctx.lineTo(rx2, py); ctx.stroke();
        }
      }
      {
        const [cx1, cz1] = to(72, 66, S);
        const [cx2, cz2] = to(100, 90, S);
        ctx.fillStyle = "#b59a69";
        ctx.fillRect(cx1, cz1, cx2 - cx1, cz2 - cz1);
        ctx.strokeStyle = "#eab308"; ctx.lineWidth = 1.5; ctx.setLineDash([3, 2]);
        ctx.strokeRect(cx1, cz1, cx2 - cx1, cz2 - cz1); ctx.setLineDash([]);
        ctx.fillStyle = "#f6d66b";
        ctx.font = "bold 7px sans-serif";
        ctx.fillText("CONSTRUCTION", cx1 + 3, cz1 + 10);
      }
      // Landmark pins
      for (const p of POIS) {
        const [px, pz] = to(p.x, p.z, S);
        ctx.fillStyle = p.kind === "atm" ? "#59d6a2" : p.kind === "police" ? "#7fb7ff" : p.kind === "dealership" ? "#eab308" : "#d9c18a";
        ctx.beginPath(); ctx.arc(px, pz, 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1; ctx.stroke();
      }
      if (job) {
        const t = job.targets[job.stage];
        if (t) { const [px, pz] = to(t[0], t[1], S); ctx.fillStyle = "#ff5c5c"; ctx.beginPath(); ctx.arc(px, pz, 5, 0, Math.PI * 2); ctx.fill(); }
      }
      if (waypoint) {
        const [wx, wz] = to(waypoint.x, waypoint.z, S);
        ctx.strokeStyle = "rgba(255,83,83,.3)"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(wx, wz); ctx.lineTo(wx, wz); ctx.stroke();
        ctx.fillStyle = "#ff5757"; ctx.beginPath(); ctx.arc(wx, wz, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#fff1d6"; ctx.lineWidth = 2; ctx.stroke();
      }
      const [px, pz] = to(g.playerPos.x, g.playerPos.z, S);
      ctx.fillStyle = "#7fd0ff"; ctx.beginPath(); ctx.arc(px, pz, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#effaff"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#d5e4e8"; ctx.font = "9px sans-serif";
      ctx.fillText("LAGOS", 8, 13);
    };
    draw();
    const t = window.setInterval(() => { setPositionTick((v) => v + 1); draw(); }, 450);
    return () => window.clearInterval(t);
  }, [job, waypoint]);

  const handleMapTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const cy = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const nearest = POIS.map((p) => ({ p, xy: to(p.x, p.z, canvas.width) })).map(({p,xy}) => ({p,d:Math.hypot(xy[0]-cx,xy[1]-cy)})).sort((a,b)=>a.d-b.d)[0];
    if (nearest && nearest.d < 13) {
      setSelectedPoi(nearest.p);
      return;
    }
    const x = Math.max(-118, Math.min(118, (cx / canvas.width) * 240 - 120));
    const z = Math.max(-118, Math.min(118, (cy / canvas.height) * 240 - 120));
    setSelectedPoi(null);
    setWaypoint({ x, z, label: "Custom GPS destination", kind: "custom" });
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest text-hud-muted">Lagos city map · live GPS</div>
        <span className="text-[9px] text-[#7fd0ff]">● LIVE</span>
      </div>
      <canvas ref={canvasRef} width={280} height={280} onPointerUp={handleMapTap} className="w-full touch-manipulation rounded-xl border border-[#eab308]/25 shadow-[0_0_22px_rgba(234,179,8,.08)]" aria-label="Interactive Lagos map; tap to set GPS destination" />
      {selectedPoi && (
        <div className="rounded-xl border border-[#eab308]/30 bg-[#eab308]/[0.08] p-3">
          <div className="text-xs font-bold text-hud-bright">{selectedPoi.label}</div>
          <div className="mt-1 text-[10px] capitalize text-hud-muted">{selectedPoi.kind} · Lagos Life city landmark</div>
          <button className="mt-2 w-full rounded-lg bg-[#eab308]/20 px-3 py-2 text-xs font-bold text-[#f5d875]" onClick={() => { setWaypoint({x:selectedPoi.x,z:selectedPoi.z,label:selectedPoi.label,kind:selectedPoi.kind}); setSelectedPoi(null); }}>
            Set GPS waypoint
          </button>
        </div>
      )}
      {waypoint ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-red-400/25 bg-red-500/10 p-2">
          <div className="min-w-0"><div className="text-[10px] uppercase tracking-wider text-red-200">GPS destination</div><div className="truncate text-xs font-semibold text-white">{waypoint.label}</div></div>
          <button className="shrink-0 rounded-lg border border-white/10 px-2 py-1.5 text-[10px] font-semibold text-white" onClick={clearWaypoint}>Clear route</button>
        </div>
      ) : <div className="text-[10px] text-hud-muted">Tap a landmark for details, or tap any map location to set a waypoint.</div>}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-hud-muted">
        <span className="text-[#7fd0ff]">● You</span><span className="text-[#ff5c5c]">● GPS</span><span className="text-[#eab308]">● Landmarks</span><span className="text-[#59d6a2]">● ATMs</span>
      </div>
    </div>
  );
}

function WardrobeApp() {
  const outfit = useGame((s) => s.outfit);
  const setOutfit = useGame((s) => s.setOutfit);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("profiles").select("outfit").eq("id", user.id).maybeSingle();
      if (!active) return;
      if (!error && data?.outfit && typeof data.outfit === "object" && !Array.isArray(data.outfit) && Object.keys(data.outfit).length > 0) {
        setOutfit(data.outfit as unknown as Partial<PlayerOutfit>);
        setNotice("Saved wardrobe loaded from your online profile.");
      }
    })();
    return () => { active = false; };
  }, [setOutfit]);
  const choices = {
    gender: [{label:"Male",value:"male"},{label:"Female",value:"female"}],
    skinTone: [{label:"Warm brown",value:"#a86f48"},{label:"Deep brown",value:"#69402d"},{label:"Light brown",value:"#c58b61"},{label:"Dark",value:"#3e2b24"}],
    hair: [{label:"Short fade",value:"short"},{label:"Locs",value:"locs"},{label:"Braids",value:"braids"},{label:"Low cut",value:"lowcut"}],
    hairColor: [{label:"Deep purple",value:"#4b1877"},{label:"Natural black",value:"#171513"},{label:"Dark brown",value:"#35241c"},{label:"Blonde",value:"#d4b477"}],
    top: [{label:"Streetwear",value:"streetwear"},{label:"Formal",value:"formal"},{label:"Traditional Agbada",value:"agbada"},{label:"Police uniform",value:"uniform"}],
    bottom: [{label:"Jeans",value:"jeans"},{label:"Formal trousers",value:"formal"},{label:"Traditional trousers",value:"traditional"},{label:"Cargo pants",value:"cargo"}],
    accessory: [{label:"None",value:"none"},{label:"Gold chain",value:"chain"},{label:"Cap",value:"cap"},{label:"Sunglasses",value:"shades"}],
  };
  const field = (key: keyof typeof choices, title: string) => (
    <label key={key} className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-hud-muted">{title}</span>
      <select value={outfit[key]} onChange={(e) => { setOutfit({[key]:e.target.value}); setNotice(title + " updated and saved."); }} className="rounded-lg border border-white/10 bg-[#111b20] px-2 py-2 text-xs text-white">
        {choices[key].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
  return <div className="flex flex-col gap-3 p-3 text-sm">
    <div className="rounded-2xl border border-[#eab308]/30 bg-gradient-to-br from-[#332911] to-[#111b20] p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-[#f4d16a]">Lagos Boutique</div>
      <div className="mt-1 text-lg font-bold text-white">Character wardrobe</div>
      <div className="mt-1 text-[11px] text-hud-muted">Choose your look. Outfit preferences save to your game profile.</div>
      <div className="mt-3 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/20 text-xl" style={{backgroundColor:outfit.skinTone}}>{outfit.gender === "female" ? "♀" : "♂"}</div><div><div className="text-xs font-semibold text-white">{outfit.gender === "female" ? "Female character" : "Male character"} · {outfit.top === "agbada" ? "Traditional Agbada" : outfit.top.charAt(0).toUpperCase()+outfit.top.slice(1)}</div><div className="text-[10px] text-hud-muted">{outfit.hair} hair · {outfit.accessory}</div></div></div>
    </div>
    {notice && <div role="status" className="rounded-lg bg-[#eab308]/10 p-2 text-[10px] text-[#f4d16a]">{notice}</div>}
    <div className="grid grid-cols-1 gap-2">{field("gender","Character type")}{field("skinTone","Skin tone")}{field("hair","Hair style")}{field("hairColor","Hair colour")}{field("top","Top / outfit")}{field("bottom","Bottom outfit")}{field("accessory","Accessories")}</div>
    <button
      disabled={saving}
      className="rounded-xl bg-[#eab308]/20 py-2.5 text-xs font-bold text-[#f4d16a] disabled:opacity-60"
      onClick={async () => {
        setSaving(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setNotice("Outfit saved on this device. Sign in to sync it to your online profile.");
            return;
          }
          const { error } = await supabase.from("profiles").update({ outfit: outfit as unknown as import("@/integrations/supabase/types").Json }).eq("id", user.id);
          if (error) throw error;
          setNotice("Outfit saved to your Supabase profile.");
        } catch {
          setNotice("Could not sync online right now. Your local outfit is still saved.");
        } finally {
          setSaving(false);
        }
      }}
    >{saving ? "Saving outfit…" : "Save outfit to profile"}</button>
  </div>;
}

function RadioApp() {
  const [msgs, setMsgs] = useState<string[]>(["📻 Wazobia FM 99.5 — live from Lagos"]);
  const [draft, setDraft] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);
  const chatChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  useEffect(() => {
    const onMsg = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setMsgs((m) => [...m.slice(-40), detail]);
    };
    window.addEventListener("city-radio", onMsg);
    const channel = supabase.channel("lagos-life-chat", { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "chat_message" }, ({ payload }) => {
        const p = payload as { name?: string; message?: string };
        if (p.message) setMsgs((m) => [...m.slice(-40), "💬 " + (p.name || "Hustler") + ": " + p.message]);
      });
    chatChannel.current = channel;
    void channel.subscribe();
    return () => {
      window.removeEventListener("city-radio", onMsg);
      chatChannel.current = null;
      void supabase.removeChannel(channel);
    };
  }, []);
  useEffect(() => { feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight }); }, [msgs]);
  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const message = draft.trim().slice(0, 180);
    if (!message) return;
    const name = useGame.getState().name || "Hustler";
    setMsgs((m) => [...m.slice(-40), "💬 You: " + message]);
    setDraft("");
    if (chatChannel.current) void chatChannel.current.send({ type: "broadcast", event: "chat_message", payload: { name, message, at: Date.now() } });
  };
  return (
    <div className="flex h-full flex-col p-3">
      <div className="text-[10px] uppercase tracking-widest text-hud-muted">City radio · live player chat</div>
      <div ref={feedRef} className="mt-2 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {msgs.map((m, i) => <div key={i} className="rounded-xl bg-white/5 px-2.5 py-1.5 text-xs text-hud-bright">{m}</div>)}
      </div>
      <form onSubmit={sendChat} className="mt-2 flex gap-2 border-t border-hud-line pt-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={180} placeholder="Message players online…" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-xs text-white placeholder:text-hud-muted" />
        <button type="submit" className="rounded-lg bg-[#eab308]/20 px-3 text-xs font-bold text-[#f4d16a]">Send</button>
      </form>
    </div>
  );
}



function FoodApp() {
  const needs = useGame((s) => s.needs);
  const eatFood = useGame((s) => s.eatFood);
  const [notice, setNotice] = useState("");
  const buy = (kind: "mama-put" | "snack" | "water", label: string) => {
    const ok = eatFood(kind);
    setNotice(ok ? label + " purchased. Your needs have been restored." : "Not enough funds. Check your cash and bank balance.");
  };
  return <div className="flex flex-col gap-3 p-3 text-sm">
    <div className="rounded-2xl border border-amber-300/20 bg-gradient-to-br from-[#4b2b13] to-[#17130e] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">Yaba roadside food</div>
      <div className="mt-1 text-lg font-bold text-white">Buka & Mama Put</div>
      <div className="mt-1 text-[11px] text-amber-50/70">Chop well, recover energy and continue your Lagos hustle.</div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40"><div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: needs.hunger + "%" }} /></div>
      <div className="mt-1 text-[10px] text-amber-100/80">Hunger · {Math.round(needs.hunger)}%</div>
    </div>
    {notice && <div role="status" className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-2 text-xs text-emerald-100">{notice}</div>}
    {[
      { id: "mama-put" as const, title: "Rice, stew & protein", desc: "Proper Mama Put plate", price: 900, emoji: "🍲", gain: "+42 hunger · +12 energy" },
      { id: "snack" as const, title: "Puff-puff / meat pie", desc: "Quick street snack", price: 250, emoji: "🥟", gain: "+12 hunger · +3 energy" },
      { id: "water" as const, title: "Cold sachet water", desc: "Cool down in Lagos heat", price: 150, emoji: "💧", gain: "Refreshes stress" },
    ].map((item) => <button key={item.id} onClick={() => buy(item.id, item.title)} className="flex items-center gap-3 rounded-2xl border border-hud-line bg-white/[0.045] p-3 text-left hover:bg-white/10">
      <span className="text-2xl">{item.emoji}</span>
      <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-hud-bright">{item.title}</span><span className="mt-0.5 block text-[10px] text-hud-muted">{item.desc}</span><span className="mt-1 block text-[9px] text-emerald-200">{item.gain}</span></span>
      <span className="text-xs font-bold text-amber-200">{naira(item.price)}</span>
    </button>)}
    <p className="text-[10px] text-hud-muted">Food is paid from cash first, then your bank account. Needs recover immediately and are saved with your character.</p>
  </div>;
}

function RideApp() {
  const waypoint = useGame((s) => s.waypoint);
  const cash = useGame((s) => s.cash);
  const bank = useGame((s) => s.bank);
  const driving = useGame((s) => s.driving);
  const rideRequest = useGame((s) => s.rideRequest);
  const requestRide = useGame((s) => s.requestRide);
  const [notice, setNotice] = useState("");

  const book = (service: "ride" | "bike" | "private") => {
    if (!waypoint) { setNotice("Open the Map app and tap a destination first."); return; }
    if (driving) { setNotice("Park your vehicle before booking a passenger service."); return; }
    if (rideRequest) { setNotice("You already have a driver assigned. Finish or cancel that trip first."); return; }
    if (!requestRide(service)) { setNotice("Booking failed. Check your balance or finish your current trip."); return; }
    setNotice("Driver assigned. Watch the road — your vehicle is physically approaching your location.");
    useGame.getState().closePhone();
  };

  return <div className="flex flex-col gap-3 p-3 text-sm">
    <div className="rounded-2xl border border-sky-300/20 bg-gradient-to-br from-[#123346] to-[#111923] p-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200"><MapPin className="h-3.5 w-3.5" /> Lagos Ride</div>
      <div className="mt-1 text-lg font-bold text-white">Where to?</div>
      <div className="mt-1 text-[11px] text-slate-300">Choose how you want to travel around the city.</div>
      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="text-[9px] uppercase tracking-widest text-slate-400">GPS destination</div>
        <div className="mt-1 text-sm font-semibold text-white">{waypoint?.label ?? "No destination set"}</div>
        {waypoint && <div className="mt-1 text-[10px] text-slate-400">Map coordinates {Math.round(waypoint.x)}, {Math.round(waypoint.z)}</div>}
      </div>
    </div>
    {notice && <div role="status" className="rounded-xl border border-sky-300/20 bg-sky-300/10 p-2 text-xs text-sky-100">{notice}</div>}
    {rideRequest && <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-2 text-xs text-emerald-100">{rideRequest.status === "approaching" ? "Driver is travelling to your pickup point…" : "You are on the way to " + rideRequest.destination.label + "."}</div>}
    {[
      { id: "ride" as const, title: "Book a ride", desc: "Comfortable city car", fare: 1600, Icon: Car },
      { id: "bike" as const, title: "Call Bike Man", desc: "Okada — faster through busy streets", fare: 700, Icon: Bike },
      { id: "private" as const, title: "Hire private driver", desc: "Premium chauffeur service", fare: 4200, Icon: User },
    ].map(({ id, title, desc, fare, Icon }) => <button key={id} disabled={!waypoint || !!rideRequest || driving} onClick={() => book(id)} className="flex items-center gap-3 rounded-2xl border border-hud-line bg-white/[0.045] p-3 text-left transition hover:bg-white/10 disabled:opacity-45">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-300/10 text-sky-200"><Icon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-hud-bright">{title}</span><span className="mt-0.5 block text-[10px] text-hud-muted">{desc}</span></span>
      <span className="text-xs font-bold text-emerald-200">{naira(fare)}</span>
    </button>)}
    <button onClick={() => { if (waypoint) { setNotice("GPS route active. Follow the waypoint on your map or choose a transport service."); useGame.getState().closePhone(); } else setNotice("Set a destination in the Map app first."); }} className="flex items-center gap-3 rounded-2xl border border-hud-line bg-white/[0.045] p-3 text-left">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-hud-bright"><Footprints className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-hud-bright">Walk there</span><span className="mt-0.5 block text-[10px] text-hud-muted">Free — follow your GPS waypoint</span></span>
      <span className="text-xs font-bold text-emerald-200">FREE</span>
    </button>
    <button onClick={() => { useGame.getState().openPhone("garage"); }} className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100">Drive myself · Open Garage</button>
    <div className="text-[10px] text-hud-muted">Cash: {naira(cash)} · Bank: {naira(bank)}. Ride fares are charged before the trip starts.</div>
  </div>;
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
    app === "wardrobe" ? <WardrobeApp /> :
    app === "rides" ? <RideApp /> :
    app === "food" ? <FoodApp /> :
    <HomeApp />;

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 bg-black/35 backdrop-blur-[2px]" onPointerDown={(e) => e.stopPropagation()} onClick={closePhone}>
      <div
      className="phone-shell absolute bottom-5 right-4 flex h-[68vh] max-h-[620px] w-[min(88vw,360px)] flex-col overflow-hidden rounded-[2rem] border-4 border-[#d8e0e8] bg-[#0b111b]/[0.98] text-white shadow-2xl shadow-black/70 backdrop-blur-xl md:h-[72vh]"
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
    </div>
  );
}
