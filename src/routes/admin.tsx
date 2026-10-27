import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { g } from "@/game/state";
import { useGame } from "@/game/store";
import { ArrowLeft, ShieldCheck, Eye, EyeOff, MoveUpRight, Plane, UserRound, CarFront, MapPin, LockKeyhole, RefreshCw, Zap, Snowflake, UserPlus, LogOut } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/admin")({ component: AdminCenter });

type Player = { id: string; display_name: string; pos_x: number | null; pos_z: number | null; cash_balance: number | null; is_admin?: boolean };
type AdminCommand = "teleport" | "freeze" | "unfreeze" | "invisible" | "visible" | "levitate" | "land" | "fly" | "stop_fly" | "spawn_vehicle" | "spawn_npc" | "remove_npc";

const locations = [
  { name: "City Centre", x: 0, z: 0 },
  { name: "Residential District", x: 128, z: -17 },
  { name: "Airport", x: 55, z: -66 },
  { name: "Stadium", x: 0, z: 8 },
  { name: "Port", x: 78, z: 66 },
  { name: "University", x: -56, z: -12 },
  { name: "Market", x: -40, z: 32 },
];

function AdminCenter() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [x, setX] = useState("0");
  const [z, setZ] = useState("0");
  const [flySpeed, setFlySpeed] = useState(28);
  const [npcName, setNpcName] = useState("Admin NPC");
  const [vehicle, setVehicle] = useState("sports");
  const [refreshing, setRefreshing] = useState(false);
  const [powerState, setPowerState] = useState(0);
  const setCity = useGame((s) => s.setCity);

  const selectedPlayer = useMemo(() => players.find((p) => p.id === selectedId) ?? null, [players, selectedId]);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setSession(data.session);
        if (data.session) await verifyAdmin(data.session);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Unable to check your account.");
      } finally { if (active) setChecking(false); }
    };
    void check();
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) void verifyAdmin(next); else setIsAdmin(false);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  async function verifyAdmin(next: Session) {
    setError("");
    const result = await (supabase as any).from("admin_users").select("user_id").eq("user_id", next.user.id).maybeSingle();
    if (result.error) { setIsAdmin(false); setError("Could not verify administrator access. Apply the admin database migration, then sign in again."); return; }
    setIsAdmin(Boolean(result.data?.user_id));
    if (result.data?.user_id) await loadPlayers();
    else setMessage("Your account is signed in, but it has not been granted administrator privileges yet.");
  }

  async function loadPlayers() {
    setRefreshing(true);
    const result = await (supabase as any).from("profiles").select("id,display_name,pos_x,pos_z,cash_balance,is_admin").order("display_name");
    if (result.error) setError("Player list could not load: " + result.error.message);
    else {
      const list = (result.data ?? []) as Player[];
      setPlayers(list);
      setSelectedId((current) => current && list.some((p) => p.id === current) ? current : (list[0]?.id ?? ""));
    }
    setRefreshing(false);
  }

  async function signIn(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (authError) { setError(authError.message); return; }
    setSession(data.session);
    if (data.session) await verifyAdmin(data.session);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null); setIsAdmin(false); setPlayers([]);
  }

  async function issue(command: AdminCommand, payload: Record<string, unknown> = {}) {
    if (!session || !isAdmin || !selectedPlayer) return;
    setError(""); setMessage("");
    const result = await (supabase as any).from("admin_commands").insert({
      target_user_id: selectedPlayer.id, created_by: session.user.id, command, payload,
    });
    if (result.error) setError("Command was not sent: " + result.error.message);
    else setMessage(`Command sent to ${selectedPlayer.display_name}: ${command.replaceAll("_", " ")}.`);
  }

  function setPower(power: "invisible" | "levitate" | "fly" | "freeze" | "visible" | "land" | "stop_fly" | "unfreeze") {
    if (power === "invisible") g.adminInvisible = true;
    if (power === "visible") g.adminInvisible = false;
    if (power === "levitate") { g.adminLevitating = true; g.adminFlying = false; g.adminFlyHeight = 3.5; }
    if (power === "land") { g.adminLevitating = false; g.adminFlying = false; g.adminFlyHeight = 0; }
    if (power === "fly") { g.adminFlying = true; g.adminLevitating = false; g.adminFlyHeight = Math.max(8, g.adminFlyHeight); g.adminFlySpeed = flySpeed; }
    if (power === "stop_fly") { g.adminFlying = false; g.adminFlyHeight = 0; }
    if (power === "freeze") g.adminFrozen = true;
    if (power === "unfreeze") g.adminFrozen = false;
    setPowerState((v) => v + 1);
    setMessage("Your character power updated. Fly controls: WASD/arrows to move, Space to rise, Ctrl to descend.");
  }

  function teleportSelf(tx: number, tz: number, label: string) {
    g.playerPos.set(tx, 0, tz);
    g.adminFlyHeight = g.adminFlying ? Math.max(8, g.adminFlyHeight) : 0;
    g.joy.x = 0; g.joy.y = 0;
    setX(String(tx)); setZ(String(tz));
    setMessage(`Teleported your character to ${label} (${tx}, ${tz}).`);
  }

  function tapMap(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const tx = Math.round(((e.clientX - rect.left) / rect.width) * 176 - 88);
    const tz = Math.round(((e.clientY - rect.top) / rect.height) * 176 - 88);
    setX(String(tx)); setZ(String(tz));
  }

  async function teleportToPlayer() {
    if (!selectedPlayer || selectedPlayer.pos_x == null || selectedPlayer.pos_z == null) return;
    teleportSelf(selectedPlayer.pos_x, selectedPlayer.pos_z, selectedPlayer.display_name);
  }

  if (checking) return <main className="min-h-screen bg-[#070b12] p-8 text-white">Checking administrator access…</main>;

  if (!session) return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,#172b42,#070b12_65%)] px-4 py-10 text-white">
      <form onSubmit={signIn} className="w-full max-w-md rounded-3xl border border-amber-300/25 bg-slate-950/75 p-7 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-amber-200"><ShieldCheck size={30}/></div>
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-amber-200">Anywhere Roleplay</p>
        <h1 className="mt-2 text-3xl font-black">Admin Center</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Sign in with your game account. Only accounts explicitly granted admin privileges can open the control panel.</p>
        <label className="mt-6 block text-xs font-semibold text-slate-300">Email</label>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" autoComplete="username" required className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-amber-300/60"/>
        <label className="mt-4 block text-xs font-semibold text-slate-300">Password</label>
        <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-amber-300/60"/>
        {error && <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        <button disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 font-extrabold text-slate-950 disabled:opacity-60"><LockKeyhole size={17}/>{busy ? "Signing in…" : "Sign in to Admin Center"}</button>
        <Link to="/" className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={15}/> Back to game</Link>
      </form>
    </main>
  );

  if (!isAdmin) return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b12] px-4 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-rose-300/20 bg-slate-950/80 p-7 text-center">
        <LockKeyhole className="mx-auto text-amber-200" size={40}/>
        <h1 className="mt-4 text-2xl font-black">Administrator access not enabled</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Your account is authenticated, but it is not yet marked as an administrator in the database. For security, this page cannot grant admin privileges to itself.</p>
        {message && <p className="mt-3 text-sm text-amber-100">{message}</p>}
        {error && <p className="mt-3 text-sm text-rose-200">{error}</p>}
        <button onClick={signOut} className="mt-6 rounded-xl border border-white/10 px-4 py-2 text-sm">Sign out</button>
        <Link to="/" className="ml-3 inline-flex rounded-xl bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950">Return to game</Link>
      </section>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#070b12] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b12]/90 px-4 py-4 backdrop-blur-xl sm:px-7">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300/30 bg-amber-300/10 text-amber-200"><ShieldCheck/></div><div><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-200">Anywhere Roleplay</p><h1 className="text-xl font-black sm:text-2xl">Administrator Command</h1></div></div>
          <div className="flex gap-2"><button onClick={()=>void loadPlayers()} className="rounded-xl border border-white/10 p-3 text-slate-300 hover:bg-white/5" title="Refresh players"><RefreshCw size={17} className={refreshing?"animate-spin":""}/></button><button onClick={()=>void signOut()} className="rounded-xl border border-white/10 p-3 text-slate-300 hover:bg-white/5" title="Sign out"><LogOut size={17}/></button></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-5 p-4 sm:p-7 lg:grid-cols-[1fr_340px]">
        <section className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[["ONLINE PROFILES",players.length],["ADMIN ACCOUNTS",players.filter(p=>p.is_admin).length],["YOUR ROLE","SUPER ADMIN"],["COMMANDS","LIVE QUEUE"]].map(([label,value])=><div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] font-bold tracking-[0.2em] text-slate-500">{label}</p><p className="mt-2 text-xl font-black text-amber-100">{value}</p></div>)}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-4 flex items-center gap-2"><UserRound className="text-amber-200"/><h2 className="text-lg font-extrabold">Player controls</h2></div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Select a player</label>
            <select value={selectedId} onChange={e=>setSelectedId(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1420] px-3 py-3 text-sm outline-none focus:border-amber-300/50">
              {players.map(p=><option key={p.id} value={p.id}>{p.display_name || "Hustler"} {p.is_admin ? "· ADMIN" : ""} · {p.id.slice(0,8)}</option>)}
            </select>
            {selectedPlayer && <div className="mt-3 grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-black/20 p-3"><p className="text-slate-500">Cash balance</p><p className="mt-1 font-bold text-emerald-200">₦{Number(selectedPlayer.cash_balance ?? 0).toLocaleString("en-NG")}</p></div><div className="rounded-xl bg-black/20 p-3"><p className="text-slate-500">Last known position</p><p className="mt-1 font-bold">{selectedPlayer.pos_x ?? "?"}, {selectedPlayer.pos_z ?? "?"}</p></div></div>}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Action icon={<Snowflake size={16}/>} label="Freeze player" onClick={()=>void issue("freeze")}/>
              <Action icon={<Zap size={16}/>} label="Unfreeze" onClick={()=>void issue("unfreeze")}/>
              <Action icon={<EyeOff size={16}/>} label="Make invisible" onClick={()=>void issue("invisible")}/>
              <Action icon={<Eye size={16}/>} label="Make visible" onClick={()=>void issue("visible")}/>
              <Action icon={<MoveUpRight size={16}/>} label="Make levitate" onClick={()=>void issue("levitate")}/>
              <Action icon={<Plane size={16}/>} label="Enable flight" onClick={()=>void issue("fly",{speed:flySpeed})}/>
              <Action icon={<CarFront size={16}/>} label="Spawn vehicle" onClick={()=>void issue("spawn_vehicle",{model:vehicle})}/>
              <Action icon={<UserPlus size={16}/>} label="Spawn NPC" onClick={()=>void issue("spawn_npc",{name:npcName})}/>
              <Action icon={<MapPin size={16}/>} label="Teleport player" onClick={()=>void issue("teleport",{x:Number(x),z:Number(z),label:"Admin destination"})}/>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-slate-400">Vehicle model<select value={vehicle} onChange={e=>setVehicle(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1420] p-3 text-sm text-white"><option value="sports">Sports car</option><option value="suv">Luxury SUV</option><option value="sedan">Executive sedan</option><option value="taxi">Taxi</option><option value="danfo">Danfo bus</option><option value="bike">Okada</option><option value="keke">Keke Napep</option></select></label>
              <label className="text-xs text-slate-400">NPC name<input value={npcName} onChange={e=>setNpcName(e.target.value)} maxLength={32} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1420] p-3 text-sm text-white"/></label>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-4 flex items-center gap-2"><MapPin className="text-amber-200"/><h2 className="text-lg font-extrabold">World map teleport</h2></div>
            <p className="mb-3 text-xs leading-5 text-slate-400">Tap the map to choose a coordinate, or select a named destination. Teleport buttons apply to your own character; the player command sends the destination to the selected player.</p>
            <div onClick={tapMap} className="relative mx-auto aspect-square w-full max-w-[440px] cursor-crosshair overflow-hidden rounded-2xl border border-emerald-300/20 bg-[#0c2a26]" style={{backgroundImage:"linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px)",backgroundSize:"10% 10%"}}>
              <div className="absolute inset-[18%] rounded-[30%] border-2 border-amber-200/50"/><div className="absolute left-[18%] top-[47%] h-[6%] w-[64%] rounded bg-slate-400/35"/><div className="absolute left-[47%] top-[12%] h-[76%] w-[6%] rounded bg-slate-400/35"/>
              {locations.map(l=><button key={l.name} title={l.name} onClick={e=>{e.stopPropagation();setX(String(l.x));setZ(String(l.z));}} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200 bg-amber-300 p-1.5 shadow-lg shadow-amber-200/30" style={{left:`${((l.x+88)/176)*100}%`,top:`${((l.z+88)/176)*100}%`}}/>)}
              <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[10px] text-emerald-100">Tap to choose destination</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs text-slate-400">World X<input type="number" value={x} onChange={e=>setX(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1420] p-3 text-white"/></label><label className="text-xs text-slate-400">World Z<input type="number" value={z} onChange={e=>setZ(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1420] p-3 text-white"/></label></div>
            <div className="mt-3 flex flex-wrap gap-2">{locations.map(l=><button key={l.name} onClick={()=>{setX(String(l.x));setZ(String(l.z));}} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-amber-200/40">{l.name}</button>)}</div>
            <div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>teleportSelf(Number(x),Number(z),"selected location")} className="rounded-xl bg-amber-300 px-4 py-3 text-sm font-black text-slate-950">Teleport me here</button><button onClick={()=>void issue("teleport",{x:Number(x),z:Number(z),label:"Map destination"})} disabled={!selectedPlayer} className="rounded-xl border border-amber-200/30 px-4 py-3 text-sm font-bold text-amber-100 disabled:opacity-40">Teleport selected player</button><button onClick={()=>void teleportToPlayer()} disabled={!selectedPlayer} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold disabled:opacity-40">Teleport me to player</button></div>
          </div>
        </section>
        <aside className="space-y-5">
          <div className="rounded-2xl border border-amber-200/20 bg-gradient-to-br from-amber-200/10 to-white/[0.025] p-5">
            <h2 className="text-lg font-extrabold">My character powers</h2><p className="mt-1 text-xs leading-5 text-slate-400">These controls affect your character on this device while the game is open.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Action icon={<EyeOff size={16}/>} label={g.adminInvisible?"Become visible":"Become invisible"} onClick={()=>setPower(g.adminInvisible?"visible":"invisible")}/>
              <Action icon={<MoveUpRight size={16}/>} label={g.adminLevitating?"Land":"Levitate"} onClick={()=>setPower(g.adminLevitating?"land":"levitate")}/>
              <Action icon={<Plane size={16}/>} label={g.adminFlying?"Stop flying":"Fly mode"} onClick={()=>setPower(g.adminFlying?"stop_fly":"fly")}/>
              <Action icon={<Snowflake size={16}/>} label={g.adminFrozen?"Unfreeze me":"Freeze me"} onClick={()=>setPower(g.adminFrozen?"unfreeze":"freeze")}/>
            </div>
            <label className="mt-4 block text-xs text-slate-400">Flight speed: {flySpeed} units/sec<input type="range" min="8" max="100" step="2" value={flySpeed} onChange={e=>{setFlySpeed(Number(e.target.value));g.adminFlySpeed=Number(e.target.value);}} className="mt-3 w-full accent-amber-300"/></label>
            <p className="mt-3 text-[11px] leading-5 text-slate-500">Flying: WASD/arrows move, Space rises, Ctrl descends. Flight can cross blocked roads and district boundaries.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><h2 className="font-extrabold">Quick travel</h2><div className="mt-3 grid gap-2">{locations.map(l=><button key={l.name} onClick={()=>teleportSelf(l.x,l.z,l.name)} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-3 text-left text-sm hover:border-amber-200/30"><span>{l.name}</span><span className="text-xs text-slate-500">{l.x}, {l.z}</span></button>)}</div></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><h2 className="font-extrabold">Admin utilities</h2><button onClick={()=>{setCity("newmap");setMessage("Switched your local character to NEW CITY.");}} className="mt-3 w-full rounded-xl border border-white/10 px-3 py-3 text-left text-sm">Switch my map to NEW CITY</button><button onClick={()=>{g.adminInvisible=false;g.adminLevitating=false;g.adminFlying=false;g.adminFrozen=false;g.adminFlyHeight=0;setPowerState(v=>v+1);setMessage("All local character powers reset.");}} className="mt-2 w-full rounded-xl border border-white/10 px-3 py-3 text-left text-sm">Reset my character powers</button><p className="mt-3 text-[10px] text-slate-500">Power state refresh {powerState} · Admin session verified.</p></div>
          {(error||message)&&<div className={`rounded-xl border p-4 text-sm leading-6 ${error?"border-rose-300/20 bg-rose-500/10 text-rose-200":"border-emerald-300/20 bg-emerald-500/10 text-emerald-100"}`}>{error||message}</div>}
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={15}/> Return to game</Link>
        </aside>
      </div>
    </main>
  );
}

function Action({icon,label,onClick}:{icon:React.ReactNode;label:string;onClick:()=>void}) {
  return <button onClick={onClick} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-amber-200/40 hover:bg-amber-200/5">{icon}{label}</button>;
}
