import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Banknote, Briefcase, Car, Bike, Footprints, MapPin, Map as MapIcon, Package, Radio as RadioIcon, ShoppingBag, User, Shirt, Utensils, PlaneTakeoff, Fuel, Radar as RadarIcon, X,
} from "lucide-react";
import { g } from "@/game/state";
import { useGame, naira, JOB_INFO, MARKET_ITEMS, VEHICLE_CATALOG, DISTRICT_INFO, type JobType, type PlayerOutfit } from "@/game/store";
import { deliverOwnedVehicle } from "@/game/actions";
import { supabase } from "@/integrations/supabase/client";
import { POIS, ROADS_X, ROADS_Z, ROAD_HALF, JOB_POINTS, BUILDINGS, WORLD, BOUND } from "@/game/city";

type App = "home" | "bank" | "jobs" | "garage" | "inventory" | "map" | "radio" | "market" | "wardrobe" | "rides" | "food" | "travel" | "districts" | "fuel" | "radar";

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
  travel: { icon: PlaneTakeoff, label: "Airline", tint: "#8bbde8" },
  districts: { icon: MapIcon, label: "Districts", tint: "#a3e635" },
  fuel: { icon: Fuel, label: "Fuel", tint: "#fb923c" },
  radar: { icon: RadarIcon, label: "Radar", tint: "#62d7f2" },
};

function atAtm() {
  const p = POIS.find((p) => (p.kind === "atm" || p.kind === "bank") && Math.hypot(p.x - g.playerPos.x, p.z - g.playerPos.z) < 8);
  return !!p;
}

function BankApp() {
  const cash = useGame((s) => s.cash);
  const bank = useGame((s) => s.bank);
  const transactions = useGame((s) => s.transactions);
  const transfer = useGame((s) => s.transfer);
  const [near, setNear] = useState(false);
  const [amountText, setAmountText] = useState("1000");
  const [mode, setMode] = useState<"deposit" | "withdraw" | "wallet">("deposit");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const t = setInterval(() => setNear(atAtm()), 500);
    return () => clearInterval(t);
  }, []);
  const amount = Math.floor(Number(amountText));
  const submit = () => {
    setNotice("");
    if (!near) { setNotice("Visit a bank counter or ATM to complete this transaction."); return; }
    if (!Number.isFinite(amount) || amount <= 0) { setNotice("Enter a valid amount greater than ₦0."); return; }
    if (mode === "deposit" && amount > cash) { setNotice("Insufficient wallet cash for this deposit."); return; }
    if (mode !== "deposit" && amount > bank) { setNotice("Insufficient bank balance."); return; }
    transfer(amount, mode === "deposit" ? "deposit" : "withdraw");
    setNotice(mode === "deposit" ? `Deposited ${naira(amount)} successfully.` : mode === "wallet" ? `Transferred ${naira(amount)} to your cash wallet.` : `Withdrew ${naira(amount)} successfully.`);
  };
  return <div className="flex flex-col gap-3 p-3 text-white">
    <div className="rounded-2xl border border-emerald-200/20 bg-gradient-to-br from-[#176447] to-[#0a2d25] p-4">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Lagos Banking · Zenith / Kuda</div>
      <div className="mt-2 text-xs text-emerald-100/80">Bank balance</div>
      <div className="text-2xl font-black text-white">{naira(bank)}</div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-black/20 px-3 py-2"><span className="text-xs text-emerald-100">Cash wallet</span><span className="text-sm font-bold text-white">{naira(cash)}</span></div>
    </div>
    <div className={`rounded-xl border p-3 text-xs ${near ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100" : "border-amber-300/25 bg-amber-300/10 text-amber-100"}`}>{near ? "ATM connected · transactions available" : "Walk to a bank or ATM marker to unlock transactions."}</div>
    <div className="grid grid-cols-3 gap-1.5">
      {([{id:"deposit",label:"Deposit"},{id:"withdraw",label:"Withdraw"},{id:"wallet",label:"Transfer to wallet"}] as const).map(m=><button key={m.id} onClick={()=>{setMode(m.id);setNotice("");}} className={`min-h-11 rounded-lg border px-2 py-2 text-xs font-bold ${mode===m.id?"border-emerald-300/50 bg-emerald-300/15 text-emerald-100":"border-white/10 bg-white/5 text-slate-200"}`}>{m.label}</button>)}
    </div>
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <label className="mb-2 block text-xs font-semibold text-slate-100">Transaction amount (₦)</label>
      <input inputMode="numeric" type="number" min="1" step="100" value={amountText} onChange={e=>setAmountText(e.target.value)} className="min-h-12 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-base font-bold text-white outline-none focus:border-emerald-300/60" />
      <div className="mt-2 grid grid-cols-3 gap-2">{[500,1000,5000].map(n=><button key={n} onClick={()=>setAmountText(String(n))} className="min-h-10 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-slate-100 active:scale-95">{naira(n)}</button>)}</div>
      <button onClick={submit} className="mt-3 min-h-12 w-full rounded-xl bg-emerald-400 px-3 py-2 text-sm font-black text-[#062217] active:scale-[.99]">{mode==="deposit"?"Deposit cash":mode==="withdraw"?"Withdraw cash":"Transfer to wallet"}</button>
      {notice && <div role="status" className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-slate-100">{notice}</div>}
    </div>
    <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-white">Transaction history</h3><span className="text-xs text-slate-300">Latest {Math.min(transactions.length,12)}</span></div>
    {transactions.length ? <div className="flex flex-col gap-1.5">{transactions.slice(-12).reverse().map(t=><div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3"><div className="min-w-0"><div className="truncate text-xs font-semibold text-white">{t.note}</div><div className="mt-1 text-xs text-slate-300">{new Date(t.at).toLocaleString()}</div></div><div className={`shrink-0 text-xs font-bold ${t.type==="credit"||t.type==="deposit"?"text-emerald-300":"text-rose-300"}`}>{t.type==="credit"||t.type==="deposit"?"+":"−"}{naira(t.amount)}</div></div>)}</div> : <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-xs text-slate-300">No transactions yet. Your deposits, withdrawals and job earnings will appear here.</div>}
  </div>;
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
  const setName = useGame((s) => s.setName);
  const cash = useGame((s) => s.cash);
  const bank = useGame((s) => s.bank);
  const stats = useGame((s) => s.jobStats);
  const owned = useGame((s) => s.owned);
  const background = useGame((s) => s.background);
  const setBackground = useGame((s) => s.setBackground);
  const traits = useGame((s) => s.characterTraits);
  const setTraits = useGame((s) => s.setCharacterTraits);
  const [aliasDraft, setAliasDraft] = useState(name);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => setAliasDraft(name), [name]);
  const traitOptions = ["Street smart", "Educated", "Well connected", "Hard worker", "Negotiator", "Athletic"];
  const toggleTrait = (trait: string) => {
    if (traits.includes(trait)) setTraits(traits.filter((t) => t !== trait));
    else if (traits.length < 3) setTraits([...traits, trait]);
    else setNotice("Choose up to three starting traits.");
  };
  const saveProfile = async () => {
    setSaving(true);
    try {
      setName(aliasDraft.trim() || "Hustler");
      useGame.getState().save();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const current = useGame.getState();
        const { error } = await (supabase as any).from("profiles").update({
          alias: current.name, display_name: current.name, background: current.background,
          character_traits: current.characterTraits, outfit: current.outfit,
        }).eq("id", user.id);
        if (error) throw error;
        setNotice("Character profile saved to your account.");
      } else setNotice("Character profile saved on this device. Sign in to sync across devices.");
    } catch {
      setNotice("Saved locally. Online sync will retry when your connection is available.");
    } finally { setSaving(false); }
  };
  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#eab308]/20 bg-gradient-to-br from-[#332911] to-[#111b20] p-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-hud-accent to-[#e28a3c] text-2xl font-bold text-black">{(name || "H").charAt(0).toUpperCase()}</div>
        <div className="text-lg font-bold text-hud-bright">{name || "Hustler"}</div>
        <div className="grid w-full grid-cols-2 gap-2 pt-1">
          <div className="rounded-xl border border-hud-line bg-white/5 p-2 text-center"><div className="text-[10px] text-hud-muted">Cash</div><div className="text-sm font-bold text-hud-bright">{naira(cash)}</div></div>
          <div className="rounded-xl border border-hud-line bg-white/5 p-2 text-center"><div className="text-[10px] text-hud-muted">Bank</div><div className="text-sm font-bold text-hud-bright">{naira(bank)}</div></div>
          <div className="rounded-xl border border-hud-line bg-white/5 p-2 text-center"><div className="text-[10px] text-hud-muted">Jobs completed</div><div className="text-sm font-bold text-hud-bright">{stats.deliveries + stats.drives + stats.trades + stats.patrols}</div></div>
          <div className="rounded-xl border border-hud-line bg-white/5 p-2 text-center"><div className="text-[10px] text-hud-muted">Vehicles</div><div className="text-sm font-bold text-hud-bright">{owned.length}</div></div>
        </div>
      </div>
      <div className="rounded-xl border border-hud-line bg-white/[0.035] p-3">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-hud-muted">Character identity & backstory</div>
        <label className="mb-2 block text-[10px] text-hud-muted">Alias / name
          <input value={aliasDraft} maxLength={16} onChange={(e) => setAliasDraft(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#111b20] px-3 py-2 text-xs text-white" placeholder="Enter your character name" />
        </label>
        <label className="mb-2 block text-[10px] text-hud-muted">Family background
          <select value={background.family} onChange={(e) => setBackground({ family: e.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-[#111b20] px-3 py-2 text-xs text-white">
            {["Mainland family", "Single parent household", "Entrepreneur family", "Rural village family"].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <label className="mb-2 block text-[10px] text-hud-muted">Education
          <select value={background.education} onChange={(e) => setBackground({ education: e.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-[#111b20] px-3 py-2 text-xs text-white">
            {["Primary school", "Secondary school", "University student", "University graduate", "Self-taught"].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <label className="mb-2 block text-[10px] text-hud-muted">Home neighbourhood
          <select value={background.neighborhood} onChange={(e) => setBackground({ neighborhood: e.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-[#111b20] px-3 py-2 text-xs text-white">
            {["Yaba / Surulere", "Oshodi / Mushin", "Ikeja / Airport", "Lekki / Victoria Island", "Ajegunle / Makoko"].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <div className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-wider text-hud-muted">Starting traits · choose up to 3</div>
        <div className="flex flex-wrap gap-1.5">{traitOptions.map((trait) => <button key={trait} onClick={() => toggleTrait(trait)} className={traits.includes(trait) ? "rounded-full border border-emerald-300/40 bg-emerald-300/15 px-2.5 py-1.5 text-[9px] font-bold text-emerald-100" : "rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[9px] text-hud-muted"}>{trait}</button>)}</div>
        <button disabled={saving} onClick={() => void saveProfile()} className="mt-3 w-full rounded-xl bg-[#eab308]/20 py-2.5 text-xs font-bold text-[#f4d16a] disabled:opacity-50">{saving ? "Saving…" : "Save Character Profile"}</button>
        {notice && <div role="status" className="mt-2 rounded-lg bg-white/5 p-2 text-[10px] text-hud-muted">{notice}</div>}
      </div>
      <div className="rounded-xl border border-hud-line bg-white/5 p-2 text-center text-xs text-hud-muted">Trades: {stats.trades} · Patrols: {stats.patrols} · Skills improve as you complete jobs.</div>
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
  const unlockedDistricts = useGame((s) => s.unlockedDistricts);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPoi, setSelectedPoi] = useState<(typeof POIS)[number] | null>(null);
  const [, setPositionTick] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);
  const to = (x: number, z: number, size = 280): [number, number] => {
    const bx = ((x + WORLD / 2) / WORLD) * size;
    const bz = ((z + WORLD / 2) / WORLD) * size;
    return [size / 2 + (bx - size / 2) * zoom + pan.x, size / 2 + (bz - size / 2) * zoom + pan.y];
  };

  useEffect(() => {
    const draw = () => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const S = c.width;
      ctx.clearRect(0, 0, S, S);
      // Draw the same world bounds, road widths and building footprints used by the 3D scene.
      ctx.fillStyle = "#87967b";
      ctx.fillRect(0, 0, S, S);
      // Makoko lagoon / waterfront edge.
      {
        const [wx1, wz1] = to(-WORLD / 2, 88, S);
        const [wx2, wz2] = to(-112, WORLD / 2, S);
        ctx.fillStyle = "#477d88";
        ctx.fillRect(wx1, wz1, wx2 - wx1, wz2 - wz1);
        ctx.strokeStyle = "rgba(204,235,230,.28)";
        ctx.lineWidth = 1;
        for (let y = wz1 + 8; y < wz2; y += 11) {
          ctx.beginPath(); ctx.moveTo(wx1 + 3, y); ctx.lineTo(wx2 - 3, y - 2); ctx.stroke();
        }
      }
      // District land zones.
      const districts = [
        { name: "YABA / SURULERE", x: -76, z: -76, w: 152, h: 152, color: "#a5ad8b" },
        { name: "OSHODI / MUSHIN", x: -WORLD / 2, z: -110, w: 68, h: 108, color: "#b8a27a" },
        { name: "IKEJA / AIRPORT", x: 112, z: -WORLD / 2, w: 68, h: 110, color: "#a5b6b7" },
        { name: "LEKKI / VI", x: 112, z: -20, w: 68, h: 130, color: "#a3b5a6" },
        { name: "AJEGUNLE / MAKOKO", x: -WORLD / 2, z: -20, w: 68, h: 110, color: "#b7a27e" },
        { name: "EKO ATLANTIC", x: 112, z: 110, w: 68, h: 70, color: "#b2c4ca" },
      ];
      for (const district of districts) {
        const [x1, z1] = to(district.x, district.z, S);
        const [x2, z2] = to(district.x + district.w, district.z + district.h, S);
        ctx.fillStyle = district.color;
        ctx.globalAlpha = 0.45;
        ctx.fillRect(x1, z1, x2 - x1, z2 - z1);
        ctx.globalAlpha = 1;
      }
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
      // Main airport runway and live construction parcel use expanded world coordinates.
      {
        const [rx1, rz1] = to(116, -151, S);
        const [rx2, rz2] = to(174, -125, S);
        ctx.fillStyle = "#363d46";
        ctx.fillRect(rx1, rz1, rx2 - rx1, rz2 - rz1);
        ctx.strokeStyle = "#f4f0dc"; ctx.lineWidth = 1;
        for (const z of [-146, -139, -132]) {
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
      // District names and major road labels.
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 7px sans-serif";
      const districtLabels: [string, string, number, number][] = [
        ["Yaba / Surulere", "YABA / SURULERE", -30, -10],
        ["Oshodi / Mushin", "OSHODI / MUSHIN", -144, -45],
        ["Ikeja / Airport", "IKEJA / AIRPORT", 142, -96],
        ["Lekki / Victoria Island", "LEKKI / V.I.", 143, 46],
        ["Ajegunle / Makoko", "AJEGUNLE / MAKOKO", -143, 62],
        ["Eko Atlantic", "EKO ATLANTIC", 142, 143],
      ];
      for (const [district, label, x, z] of districtLabels) {
        const open = unlockedDistricts.includes(district);
        const shownLabel = open ? label : "LOCKED · " + label;
        const [px, pz] = to(x, z, S);
        ctx.fillStyle = open ? "rgba(10,24,27,.72)" : "rgba(28,30,32,.86)";
        const width = ctx.measureText(shownLabel).width + 7;
        ctx.fillRect(px - width / 2, pz - 5, width, 10);
        ctx.fillStyle = open ? "#f2e8c8" : "#c2c7c8";
        ctx.fillText(shownLabel, px, pz);
      }
      const [villageX, villageZ] = to(98, 77, S);
      ctx.fillStyle = "rgba(10,24,27,.72)";
      ctx.fillRect(villageX - 32, villageZ - 5, 64, 10);
      ctx.fillStyle = "#f2e8c8";
      ctx.fillText("OUTSKIRTS VILLAGE", villageX, villageZ);
      ctx.font = "bold 6px sans-serif";
      ctx.fillStyle = "#f0d26c";
      const [roadX, roadZ] = to(0, -82, S);
      ctx.fillText("MAINLAND EXPRESS", roadX + 18, roadZ);
      const [lekkiRoadX, lekkiRoadZ] = to(140, 4, S);
      ctx.fillText("LEKKI-EPE LINK", lekkiRoadX + 15, lekkiRoadZ);
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
        const [currentX, currentZ] = to(g.playerPos.x, g.playerPos.z, S);
        const [targetX, targetZ] = to(waypoint.x, waypoint.z, S);
        ctx.save();
        ctx.strokeStyle = "rgba(54,232,139,.96)";
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(currentX, currentZ); ctx.lineTo(targetX, targetZ); ctx.stroke();
        ctx.restore();
        const [wx, wz] = to(waypoint.x, waypoint.z, S);
        ctx.strokeStyle = "rgba(54,232,139,.38)"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(wx, wz); ctx.lineTo(wx, wz); ctx.stroke();
        ctx.fillStyle = "#34e88b"; ctx.beginPath(); ctx.arc(wx, wz, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#effff5"; ctx.lineWidth = 2; ctx.stroke();
      }
      const [px, pz] = to(g.playerPos.x, g.playerPos.z, S);
      ctx.fillStyle = "#7fd0ff"; ctx.beginPath(); ctx.arc(px, pz, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#effaff"; ctx.lineWidth = 2; ctx.stroke();
      // Facing-direction arrow rotates with the player.
      ctx.save(); ctx.translate(px, pz); ctx.rotate(g.playerYaw);
      ctx.fillStyle = "#effaff"; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(-4, -3); ctx.lineTo(0, -5); ctx.lineTo(4, -3); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = "#d5e4e8"; ctx.font = "9px sans-serif";
      ctx.fillText("LAGOS", 8, 13);
    };
    draw();
    const t = window.setInterval(() => { setPositionTick((v) => v + 1); draw(); }, 450);
    return () => window.clearInterval(t);
  }, [job, waypoint, unlockedDistricts, zoom, pan.x, pan.y]);

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
    const baseX = (cx - canvas.width / 2 - pan.x) / zoom + canvas.width / 2;
    const baseZ = (cy - canvas.height / 2 - pan.y) / zoom + canvas.height / 2;
    const x = Math.max(-BOUND, Math.min(BOUND, (baseX / canvas.width) * WORLD - WORLD / 2));
    const z = Math.max(-BOUND, Math.min(BOUND, (baseZ / canvas.height) * WORLD - WORLD / 2));
    setSelectedPoi(null);
    setWaypoint({ x, z, label: "Custom GPS destination", kind: "custom" });
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest text-hud-muted">Lagos city map · live GPS</div>
        <span className="text-[9px] text-[#7fd0ff]">● LIVE</span>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={280} height={280}
          onPointerDown={(e) => { const rect=e.currentTarget.getBoundingClientRect(); dragRef.current={x:e.clientX*280/rect.width,y:e.clientY*280/rect.height,panX:pan.x,panY:pan.y,moved:false}; e.currentTarget.setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => { if(!dragRef.current) return; const rect=e.currentTarget.getBoundingClientRect(); const dx=e.clientX*280/rect.width-dragRef.current.x,dy=e.clientY*280/rect.height-dragRef.current.y; if(Math.hypot(dx,dy)>4) dragRef.current.moved=true; if(dragRef.current.moved)setPan({x:Math.max(-140,Math.min(140,dragRef.current.panX+dx)),y:Math.max(-140,Math.min(140,dragRef.current.panY+dy))}); }}
          onPointerUp={(e) => { const drag=dragRef.current; dragRef.current=null; if(drag && !drag.moved) handleMapTap(e); }}
          onPointerCancel={() => {dragRef.current=null;}}
          className="block w-full touch-none rounded-xl border border-[#eab308]/25 shadow-[0_0_22px_rgba(234,179,8,.08)]" aria-label="Interactive Lagos map; drag to pan, tap a landmark to select" />
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <button type="button" aria-label="Zoom in" onClick={()=>setZoom(v=>Math.min(2.8,Number((v+0.25).toFixed(2))))} className="h-9 w-9 rounded-lg border border-white/20 bg-[#07111b]/95 text-xl font-bold text-white">+</button>
          <button type="button" aria-label="Zoom out" onClick={()=>setZoom(v=>Math.max(1,Number((v-0.25).toFixed(2))))} className="h-9 w-9 rounded-lg border border-white/20 bg-[#07111b]/95 text-xl font-bold text-white">−</button>
          <button type="button" onClick={()=>{setZoom(1);setPan({x:0,y:0});}} className="rounded-lg border border-white/20 bg-[#07111b]/95 px-2 py-1.5 text-xs font-bold text-white">Reset</button>
        </div>
      </div>
      {selectedPoi && (
        <div className="rounded-xl border border-[#eab308]/30 bg-[#eab308]/[0.08] p-3">
          <div className="text-sm font-bold text-white">{selectedPoi.label}</div>
          <div className="mt-1 text-xs capitalize text-slate-200">{selectedPoi.kind} · Lagos Life landmark</div>
          <div className="mt-1 text-xs text-slate-300">{Math.round(Math.hypot(selectedPoi.x-g.playerPos.x,selectedPoi.z-g.playerPos.z))} m away · about {Math.max(1,Math.ceil(Math.hypot(selectedPoi.x-g.playerPos.x,selectedPoi.z-g.playerPos.z)/1.4))} min walk</div>
          <button className="mt-2 min-h-11 w-full rounded-lg bg-emerald-400/20 px-3 py-2 text-sm font-bold text-emerald-100" onClick={() => { setWaypoint({x:selectedPoi.x,z:selectedPoi.z,label:selectedPoi.label,kind:selectedPoi.kind}); setSelectedPoi(null); }}>
            Set Destination
          </button>
        </div>
      )}
      {waypoint ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-red-400/25 bg-red-500/10 p-2">
          <div className="min-w-0"><div className="text-[10px] uppercase tracking-wider text-red-200">GPS destination</div><div className="truncate text-xs font-semibold text-white">{waypoint.label}</div></div>
          <button className="shrink-0 rounded-lg border border-white/10 px-2 py-1.5 text-[10px] font-semibold text-white" onClick={clearWaypoint}>Clear route</button>
        </div>
      ) : <div className="text-[10px] text-hud-muted">Tap a landmark for details, or tap any map location to set a waypoint.</div>}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-slate-100"><span className="text-sky-300">● You</span><span className="text-rose-300">● Job target</span><span className="text-amber-200">● Landmarks</span><span className="text-emerald-300">● ATMs</span><span className="text-emerald-300">━ Active route</span></div>
    </div>
  );
}

function RadarApp() {
  const [, refresh] = useState(0);
  const job = useGame((s) => s.activeJob);
  const waypoint = useGame((s) => s.waypoint);
  const setWaypoint = useGame((s) => s.setWaypoint);
  useEffect(() => { const timer = window.setInterval(() => refresh(v => v + 1), 900); return () => window.clearInterval(timer); }, []);
  const px = g.playerPos.x, pz = g.playerPos.z;
  const contacts = [
    ...POIS.map(p => ({ name:p.label, type:p.kind === "atm" ? "ATM" : p.kind === "bank" ? "Bank" : p.kind === "market" ? "Market" : "Landmark", x:p.x, z:p.z, color:p.kind === "atm" ? "#59d6a2" : "#eab308" })),
    ...(job ? [{name:job.title+" target",type:"Job target",x:job.targets[job.stage]?.[0] ?? px,z:job.targets[job.stage]?.[1] ?? pz,color:"#ff5c5c"}] : []),
    ...(waypoint ? [{name:waypoint.label,type:"Destination",x:waypoint.x,z:waypoint.z,color:"#62d7f2"}] : []),
  ].map(p=>({...p,distance:Math.hypot(p.x-px,p.z-pz)})).filter(p=>p.distance<=100).sort((a,b)=>a.distance-b.distance);
  return <div className="flex flex-col gap-3 p-3 text-white">
    <div className="text-xs font-bold text-slate-100">Nearby within 100 metres <span className="text-slate-400">({contacts.length})</span></div>
    <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border border-cyan-300/50 bg-[#071a24] shadow-[inset_0_0_28px_rgba(34,211,238,.12)]"><div className="relative h-40 w-40 rounded-full border border-cyan-900 bg-[radial-gradient(circle,#102d37_1px,transparent_1.5px)] [background-size:12px_12px]">
      {[0,45,90,135].map(a=><div key={a} className="absolute left-1/2 top-0 h-full w-px bg-cyan-900/80" style={{transform:"translateX(-50%) rotate("+a+"deg)"}} />)}
      {contacts.map((p,i)=>{const angle=Math.atan2(p.x-px,p.z-pz),radius=Math.min(72,p.distance/100*72);return <button key={p.name+i} title={p.name} onClick={()=>setWaypoint({x:p.x,z:p.z,label:p.name,kind:p.type})} className="absolute h-2.5 w-2.5 rounded-full border border-white/70" style={{left:"50%",top:"50%",background:p.color,transform:"translate(-50%,-50%) translate("+Math.sin(angle)*radius+"px,"+Math.cos(angle)*radius+"px)"}} />})}
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white bg-sky-400" />
    </div></div>
    {contacts.length===0 && <div className="rounded-xl border border-white/10 p-3 text-xs text-slate-300">No mapped contacts nearby. Explore to discover locations.</div>}
    <div className="flex flex-col gap-1.5">{contacts.map((p,i)=><button key={p.name+i} onClick={()=>setWaypoint({x:p.x,z:p.z,label:p.name,kind:p.type})} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-left active:scale-[.99]"><span className="min-w-0"><span className="block truncate text-xs font-semibold text-white">{p.name}</span><span className="text-[11px] text-slate-300">{p.type}</span></span><span className="shrink-0 text-xs font-bold" style={{color:p.color}}>{Math.round(p.distance)} m</span></button>)}</div>
  </div>;
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
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {["How far?", "Oga sharp!", "No wahala", "Ẹ káàárọ̀!", "Kedu?", "Sannu!"].map((phrase) => (
          <button key={phrase} type="button" onClick={() => {
            const name = useGame.getState().name || "Hustler";
            setMsgs((m) => [...m.slice(-40), "💬 You: " + phrase]);
            if (chatChannel.current) void chatChannel.current.send({ type: "broadcast", event: "chat_message", payload: { name, message: phrase, at: Date.now() } });
          }} className="rounded-lg border border-white/10 bg-white/5 px-1.5 py-2 text-[9px] font-semibold text-hud-bright active:bg-[#eab308]/15">{phrase}</button>
        ))}
      </div>
      <form onSubmit={sendChat} className="mt-2 flex gap-2 border-t border-hud-line pt-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={180} placeholder="Message players online…" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-xs text-white placeholder:text-hud-muted" />
        <button type="submit" className="rounded-lg bg-[#eab308]/20 px-3 text-xs font-bold text-[#f4d16a]">Send</button>
      </form>
    </div>
  );
}






function FuelApp() {
  const fuel = useGame((s) => s.fuelLevel);
  const driving = useGame((s) => s.driving);
  const refuel = useGame((s) => s.refuelVehicle);
  const [notice, setNotice] = useState("");
  const atStation = POIS.some((p) => p.kind === "fuel" && Math.hypot(p.x - g.playerPos.x, p.z - g.playerPos.z) < 12);
  const buy = (amount: number, price: number) => {
    const ok = refuel(amount, price);
    setNotice(ok ? "Fuel added to your vehicle." : !driving ? "Enter the vehicle you want to refuel, then stop at a fuel station." : !atStation ? "Drive to an Oando, Ikeja Express or Lekki fuel station first." : fuel >= 100 ? "Your tank is already full." : "Not enough funds to buy fuel.");
  };
  return <div className="flex flex-col gap-3 p-3 text-sm">
    <div className="rounded-2xl border border-orange-300/20 bg-gradient-to-br from-[#4a2b13] to-[#111923] p-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-200"><Fuel className="h-4 w-4" /> Lagos fuel services</div>
      <div className="mt-1 text-lg font-bold text-white">Fuel station</div>
      <div className="mt-3 flex items-end justify-between"><span className="text-[10px] text-slate-300">Current tank</span><span className="text-xl font-black text-white">{Math.round(fuel)}%</span></div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/40"><div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: fuel + "%" }} /></div>
      <div className="mt-2 text-[10px] text-slate-300">{atStation ? "Fuel station nearby" : "Not at a fuel station"} · {driving ? "Vehicle active" : "Not driving"}</div>
    </div>
    {notice && <div role="status" className="rounded-xl border border-orange-300/20 bg-orange-300/10 p-2 text-xs text-orange-100">{notice}</div>}
    {[
      { amount: 25, price: 1500, label: "Add 25% tank", desc: "Short top-up" },
      { amount: 50, price: 2800, label: "Add 50% tank", desc: "Half tank" },
      { amount: 100, price: 5000, label: "Fill the tank", desc: "Full tank, up to 100%" },
    ].map((option) => <button key={option.amount} onClick={() => buy(option.amount, option.price)} className="flex items-center gap-3 rounded-2xl border border-hud-line bg-white/[0.045] p-3 text-left hover:bg-white/10">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-300/10 text-orange-200"><Fuel className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-hud-bright">{option.label}</span><span className="mt-0.5 block text-[10px] text-hud-muted">{option.desc}</span></span>
      <span className="text-xs font-bold text-amber-200">{naira(option.price)}</span>
    </button>)}
  </div>;
}

function DistrictsApp() {
  const unlocked = useGame((s) => s.unlockedDistricts);
  const unlockDistrict = useGame((s) => s.unlockDistrict);
  const cash = useGame((s) => s.cash);
  const bank = useGame((s) => s.bank);
  const [notice, setNotice] = useState("");
  return <div className="flex flex-col gap-3 p-3 text-sm">
    <div className="rounded-2xl border border-lime-300/20 bg-gradient-to-br from-[#23381c] to-[#111923] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-200">Lagos city network</div>
      <div className="mt-1 text-lg font-bold text-white">District access</div>
      <div className="mt-1 text-[11px] text-slate-300">Unlock neighbourhoods as your hustle grows. Each district opens new streets, jobs and opportunities.</div>
      <div className="mt-3 text-[10px] text-lime-100/80">{unlocked.length} / {DISTRICT_INFO.length} districts unlocked</div>
    </div>
    {notice && <div role="status" className="rounded-xl border border-lime-300/20 bg-lime-300/10 p-2 text-xs text-lime-100">{notice}</div>}
    {DISTRICT_INFO.map((d, i) => {
      const active = unlocked.includes(d.name);
      return <div key={d.name} className="rounded-2xl border border-hud-line bg-white/[0.045] p-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-xs font-black text-lime-200">{active ? "✓" : String(i + 1).padStart(2, "0")}</div>
          <div className="min-w-0 flex-1"><div className="text-xs font-bold text-hud-bright">{d.name}</div><div className="mt-1 text-[10px] leading-relaxed text-hud-muted">{d.description}</div></div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className={active ? "text-[10px] font-bold text-emerald-200" : "text-[10px] font-bold text-amber-200"}>{active ? "UNLOCKED" : d.price === 0 ? "STARTER DISTRICT" : naira(d.price)}</span>
          {!active && <button onClick={() => setNotice(d.name === "Eko Atlantic" && !unlocked.includes("Lekki / Victoria Island") ? "Unlock Lekki / Victoria Island first to access Eko Atlantic." : unlockDistrict(d.name) ? d.name + " is now open. Explore the new district!" : "Not enough cash or bank balance to unlock this district.")} className="rounded-lg bg-lime-300/15 px-3 py-1.5 text-[10px] font-bold text-lime-100">Unlock</button>}
        </div>
      </div>;
    })}
    <div className="text-[10px] text-hud-muted">Cash: {naira(cash)} · Bank: {naira(bank)}</div>
  </div>;
}

function TravelApp() {
  const cash = useGame((s) => s.cash);
  const bank = useGame((s) => s.bank);
  const spend = useGame((s) => s.spend);
  const addItem = useGame((s) => s.addItem);
  const [notice, setNotice] = useState("");
  const [boardingPass, setBoardingPass] = useState("");
  const flights = [
    { city: "Abuja", code: "ABV", fare: 18500, airline: "Naija Air" },
    { city: "Port Harcourt", code: "PHC", fare: 14200, airline: "Coastal Wings" },
    { city: "Accra", code: "ACC", fare: 39500, airline: "West Coast Air" },
  ];
  const checkIn = (flight: typeof flights[number]) => {
    if (!spend(flight.fare, "cash") && !spend(flight.fare, "bank")) {
      setNotice("Insufficient funds for this ticket. Your balance has not changed.");
      return;
    }
    const reference = "LR" + Math.random().toString(36).slice(2, 7).toUpperCase();
    addItem("flight-ticket-" + flight.code, 1);
    setBoardingPass(reference);
    setNotice("Check-in complete. Your " + flight.city + " boarding pass is ready at the terminal desk.");
    useGame.getState().radio("✈️ Airline check-in complete. Boarding pass " + reference + " issued.");
    useGame.getState().save();
  };
  return <div className="flex flex-col gap-3 p-3 text-sm">
    <div className="rounded-2xl border border-sky-200/20 bg-gradient-to-br from-[#15374d] to-[#101722] p-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200"><PlaneTakeoff className="h-4 w-4" /> Murtala Muhammed International</div>
      <div className="mt-1 text-lg font-bold text-white">Airline check-in</div>
      <div className="mt-1 text-[11px] text-slate-300">Choose a flight and receive a ticket in your inventory.</div>
    </div>
    {boardingPass && <div className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3"><div className="text-[9px] uppercase tracking-widest text-emerald-200">Boarding pass issued</div><div className="mt-1 text-lg font-black tracking-[0.18em] text-white">{boardingPass}</div><div className="text-[10px] text-emerald-100/70">Keep this reference for your roleplay journey.</div></div>}
    {notice && <div role="status" className="rounded-xl border border-sky-300/20 bg-sky-300/10 p-2 text-xs text-sky-100">{notice}</div>}
    {flights.map((flight) => <div key={flight.code} className="flex items-center gap-3 rounded-2xl border border-hud-line bg-white/[0.045] p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-300/10 text-xs font-black text-sky-200">{flight.code}</div>
      <div className="min-w-0 flex-1"><div className="text-xs font-bold text-hud-bright">{flight.city}</div><div className="mt-0.5 text-[10px] text-hud-muted">{flight.airline} · Domestic / regional</div><div className="mt-1 text-xs font-bold text-emerald-200">{naira(flight.fare)}</div></div>
      <button onClick={() => checkIn(flight)} className="rounded-lg bg-sky-300/15 px-3 py-2 text-[10px] font-bold text-sky-100">Check in</button>
    </div>)}
    <div className="text-[10px] text-hud-muted">Cash: {naira(cash)} · Bank: {naira(bank)}. This prototype issues roleplay tickets; actual flight travel is not yet connected.</div>
  </div>;
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
  useEffect(() => { if (open) setApp(useGame.getState().phoneApp); }, [open]);
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
    app === "travel" ? <TravelApp /> :
    app === "districts" ? <DistrictsApp /> :
    app === "fuel" ? <FuelApp /> :
    app === "radar" ? <RadarApp /> :
    <HomeApp />;
  const bottomTabs: App[] = ["home", "bank", "jobs", "garage", "inventory", "map", "radar"];
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-2 pt-[max(8px,env(safe-area-inset-top))] pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur-sm" onPointerDown={e=>e.stopPropagation()} onClick={closePhone}>
      <div className="phone-shell relative flex h-[calc(100dvh-16px)] max-h-[900px] w-full max-w-[440px] flex-col overflow-hidden rounded-[1.6rem] border-2 border-[#b9c7d2] bg-[#07111b]/[0.99] text-white shadow-2xl shadow-black/80 sm:h-[min(94dvh,860px)] sm:w-[min(96vw,440px)] sm:rounded-[2rem] sm:border-[3px]" onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
        <div className="flex min-h-10 items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2">
          <span className="text-xs font-bold tracking-wider text-slate-100">VibeOS <span className="text-slate-400">· Lagos Life</span></span>
          <div className="flex items-center gap-2"><span className="text-[11px] text-emerald-300">● Online</span><button className="flex h-11 w-11 items-center justify-center rounded-full border border-rose-300/40 bg-rose-500/15 text-white active:scale-95" onClick={closePhone} aria-label="Close phone"><X className="h-5 w-5" /></button></div>
        </div>
        <div className="flex min-h-11 items-center gap-2 border-b border-white/10 px-3 py-2">
          {app!=="home" && <button onClick={()=>setApp("home")} className="rounded-lg bg-white/10 p-2 text-white active:scale-90" aria-label="Back to profile"><ArrowLeft className="h-4 w-4" /></button>}
          <span className="text-sm font-bold text-white">{APP_ICONS[app].label}</span><span className="ml-auto text-[11px] text-slate-300">LAGOS · VibeOS</span>
        </div>
        <div key={app} className="min-h-0 flex-1 overflow-y-auto overscroll-contain text-white animate-in fade-in duration-150">{Screen}</div>
        <nav aria-label="Phone apps" className="flex shrink-0 gap-1 overflow-x-auto border-t border-white/15 bg-[#03080e] px-1 pb-[max(7px,env(safe-area-inset-bottom))] pt-2 [scrollbar-width:thin]">
          {bottomTabs.map(a=>{const I=APP_ICONS[a].icon,active=app===a;return <button key={a} aria-current={active?"page":undefined} onClick={()=>{setApp(a);openPhone(a);}} className={`flex min-w-[54px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-all active:scale-95 ${active?"bg-emerald-400/15 text-emerald-100 ring-1 ring-inset ring-emerald-300/50":"text-slate-200 hover:bg-white/5"}`}><I className="h-5 w-5 shrink-0" style={{color:active?"#8cf0c2":APP_ICONS[a].tint}}/><span className="whitespace-nowrap text-xs font-semibold leading-tight text-current">{APP_ICONS[a].label}</span></button>;})}
        </nav>
      </div>
    </div>
  );
}
