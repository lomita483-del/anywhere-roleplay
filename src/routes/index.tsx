import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { ArrowRight, CarFront, Cloud, Gamepad2, MapPin, Smartphone, Wallet, LogIn, UserPlus, LogOut } from "lucide-react";
import GameCanvas from "@/components/game/GameCanvas";
import { useGame, SAVE_KEY } from "@/game/store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const started = useGame((s) => s.started);
  const hasSave = useGame((s) => s.hasSave);
  const setName = useGame((s) => s.setName);
  const start = useGame((s) => s.start);
  const [playerName, setPlayerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    try {
      // Auth is optional for guest play. A missing/misconfigured Supabase
      // environment must never prevent the landing screen from rendering.
      const auth = supabase.auth;
      void auth.getSession().then(({ data, error }) => {
        if (!active) return;
        if (error) setAuthError(error.message);
        setSession(data.session);
        setChecking(false);
      }).catch((error: unknown) => {
        if (!active) return;
        setAuthError(error instanceof Error ? error.message : "Could not connect to account services.");
        setChecking(false);
      });

      const { data: listener } = auth.onAuthStateChange((_event, nextSession) => {
        if (active) {
          setSession(nextSession);
          setMessage("");
          setAuthError("");
        }
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    } catch (error) {
      if (active) {
        setAuthError(error instanceof Error ? error.message : "Account services are unavailable. You can still play as a guest.");
        setChecking(false);
      }
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    (async () => {
      try {
        const { data: cloudSave, error } = await supabase
          .from("player_save")
          .select("state")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (error) throw error;
        if (!active) return;
        if (cloudSave?.state) {
          localStorage.setItem(SAVE_KEY, JSON.stringify(cloudSave.state));
          const saved = cloudSave.state as { name?: string };
          if (saved.name) setPlayerName(saved.name);
          useGame.setState({ hasSave: true });
        } else {
          const raw = localStorage.getItem(SAVE_KEY);
          if (raw) {
            const saved = JSON.parse(raw) as { name?: string };
            if (saved.name) setPlayerName(saved.name);
            useGame.setState({ hasSave: true });
          } else {
            useGame.setState({ hasSave: false });
          }
        }
      } catch (error) {
        if (active) setAuthError(error instanceof Error ? error.message : "Unable to load cloud save.");
      }
    })();
    return () => { active = false; };
  }, [session]);

  useEffect(() => {
    if (session || checking) return;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { name?: string };
        useGame.setState({ hasSave: true });
        if (saved.name) setPlayerName(saved.name);
      } else {
        useGame.setState({ hasSave: false });
      }
    } catch {
      useGame.setState({ hasSave: false });
    }
  }, [session, checking]);

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setAuthError("");
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: playerName.trim() || "Hustler" } },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("Account created. Check your email to confirm your address, then sign in.");
        } else {
          setSession(data.session);
          setMessage("Account created successfully.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setSession(data.session);
        setMessage("Signed in. Your cloud save is being checked.");
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const begin = async (fresh: boolean) => {
    setAuthError("");
    const cleanName = playerName.trim().slice(0, 16);
    if (cleanName) setName(cleanName);
    if (session && !fresh) {
      setBusy(true);
      try {
        const { data, error } = await supabase.from("player_save").select("state").eq("user_id", session.user.id).maybeSingle();
        if (error) throw error;
        if (data?.state) localStorage.setItem(SAVE_KEY, JSON.stringify(data.state));
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : "Could not load your cloud save.");
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    start(fresh);
  };

  const signOut = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(error.message);
    setSession(null);
    setMessage("");
    setBusy(false);
  };

  if (started) return <GameCanvas />;

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#090e13] px-4 py-8 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(226,161,60,0.18),transparent_48%),linear-gradient(135deg,transparent_35%,rgba(18,50,49,0.32))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.35) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.35) 1px,transparent 1px)", backgroundSize: "42px 42px" }} />
      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#101820]/90 shadow-[0_32px_100px_rgba(0,0,0,.55)] backdrop-blur-xl md:grid-cols-[1.05fr_.95fr]">
        <div className="relative flex min-h-[340px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#172b2b] via-[#142127] to-[#10151d] p-7 sm:p-10">
          <div className="pointer-events-none absolute -right-16 top-14 h-64 w-64 rounded-full border border-[#e2a13c]/20" />
          <div className="pointer-events-none absolute -right-5 top-24 h-44 w-44 rounded-full border border-[#e2a13c]/20" />
          <div className="pointer-events-none absolute bottom-[-6rem] left-[-3rem] h-72 w-72 rounded-full bg-[#d58d2b]/10 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e2a13c]/40 bg-[#e2a13c]/10 text-[#f0b650]"><CarFront className="h-6 w-6" /></div>
            <div><p className="text-xs font-bold uppercase tracking-[0.28em] text-[#e9ad49]">Open-world roleplay</p><p className="mt-1 text-xs text-white/45">A city that moves with you</p></div>
          </div>
          <div className="relative mt-12">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#e9ad49]">Your story. Your city.</p>
            <h1 className="max-w-lg text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">ANYWHERE<span className="mt-1 block text-white/55">ROLEPLAY</span></h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/65 sm:text-base">Hit the streets, build your hustle, drive through the city, take on jobs and make your own name in a living Nigerian-inspired world.</p>
          </div>
          <div className="relative mt-10 grid grid-cols-3 gap-2">
            {[{ icon: MapPin, title: "Explore", desc: "Open city" }, { icon: Wallet, title: "Make money", desc: "Jobs & trade" }, { icon: Smartphone, title: "Live RP", desc: "Phone & garage" }].map(({ icon: Icon, title, desc }) => <div key={title} className="rounded-2xl border border-white/10 bg-black/15 p-3"><Icon className="mb-3 h-4 w-4 text-[#e9ad49]" /><p className="text-xs font-bold sm:text-sm">{title}</p><p className="mt-1 text-[10px] text-white/45 sm:text-xs">{desc}</p></div>)}
          </div>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#e9ad49]">Welcome to the city</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Ready to make moves?</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">{session ? "Your account is connected. Your progress can follow you between devices." : "Create an account to keep your character and progress synced across devices."}</p>
          </div>
          {!session ? (
            <>
              <div className="mb-5 grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
                <button type="button" onClick={() => { setAuthMode("signin"); setMessage(""); setAuthError(""); }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${authMode === "signin" ? "bg-[#e9ad49] text-[#17130b]" : "text-white/55"}`}><LogIn className="h-4 w-4" /> Sign in</button>
                <button type="button" onClick={() => { setAuthMode("signup"); setMessage(""); setAuthError(""); }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${authMode === "signup" ? "bg-[#e9ad49] text-[#17130b]" : "text-white/55"}`}><UserPlus className="h-4 w-4" /> Create account</button>
              </div>
              <form onSubmit={submitAuth} className="space-y-3">
                {authMode === "signup" && <div><label htmlFor="player-name" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/65">Player name</label><input id="player-name" value={playerName} maxLength={16} onChange={(e) => setPlayerName(e.target.value)} required placeholder="Choose a player name" autoComplete="nickname" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm outline-none placeholder:text-white/25 focus:border-[#e9ad49]/70" /></div>}
                <div><label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/65">Email address</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm outline-none placeholder:text-white/25 focus:border-[#e9ad49]/70" /></div>
                <div><label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/65">Password</label><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={authMode === "signup" ? "new-password" : "current-password"} placeholder="At least 6 characters" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm outline-none placeholder:text-white/25 focus:border-[#e9ad49]/70" /></div>
                <button disabled={busy || checking} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f0b650] to-[#d58d2b] px-4 py-3.5 text-sm font-extrabold text-[#17130b] shadow-lg shadow-[#d58d2b]/15 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{busy ? "Please wait…" : authMode === "signup" ? "Create your account" : "Sign in to continue"} <ArrowRight className="h-4 w-4" /></button>
              </form>
              <div className="my-4 flex items-center gap-3"><div className="h-px flex-1 bg-white/10" /><span className="text-[10px] uppercase tracking-widest text-white/30">or play on this device</span><div className="h-px flex-1 bg-white/10" /></div>
              <button type="button" disabled={busy || checking} onClick={() => begin(false)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/70 hover:bg-white/[0.08] disabled:opacity-50">Continue without an account</button>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4"><p className="text-sm font-semibold text-emerald-200">Signed in</p><p className="mt-1 break-all text-xs text-white/55">{session.user.email}</p></div>
              <label htmlFor="player-name-signed" className="mb-2 mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-white/65">Player name</label>
              <input id="player-name-signed" value={playerName} maxLength={16} onChange={(e) => setPlayerName(e.target.value)} placeholder="Enter your name" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm outline-none placeholder:text-white/25 focus:border-[#e9ad49]/70" />
              <button type="button" disabled={busy || checking} onClick={() => begin(false)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f0b650] to-[#d58d2b] px-4 py-3.5 text-sm font-extrabold text-[#17130b] disabled:opacity-60">{hasSave ? "Continue your story" : "Enter the city"} <ArrowRight className="h-4 w-4" /></button>
              {hasSave && <button type="button" disabled={busy} onClick={() => begin(true)} className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/70">Start a new game</button>}
              <button type="button" disabled={busy} onClick={signOut} className="mt-4 flex w-full items-center justify-center gap-2 py-2 text-xs text-white/40 hover:text-white/70"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
            </>
          )}
          {(checking || busy) && <p className="mt-3 text-center text-xs text-white/40">{checking ? "Checking account and saved progress…" : "Connecting securely…"}</p>}
          {message && <p role="status" className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-xs leading-5 text-emerald-100">{message}</p>}
          {authError && <p role="alert" className="mt-3 rounded-lg border border-red-400/20 bg-red-400/[0.06] p-3 text-xs leading-5 text-red-100">{authError}</p>}
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3"><Cloud className="mt-0.5 h-4 w-4 shrink-0 text-[#e9ad49]" /><p className="text-xs leading-5 text-white/45">{session ? "Cloud saves are linked to your account. Guest progress stays in this browser." : "Sign in to enable cloud saves. Guest progress is stored only in this browser and will not transfer between devices."}</p></div>
          <div className="mt-7 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25"><Gamepad2 className="h-3.5 w-3.5" /> Built for desktop and mobile</div>
        </div>
      </section>
      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3 text-[10px] text-white/25"><span>ANYWHERE ROLEPLAY · EARLY ACCESS</span><span>·</span><Link to="/admin" className="font-semibold uppercase tracking-widest text-amber-200/60 hover:text-amber-100">Admin Center</Link></div>
    </main>
  );
}
