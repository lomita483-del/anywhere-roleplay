import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CarFront, Cloud, Gamepad2, MapPin, Smartphone, Wallet } from "lucide-react";
import GameCanvas from "@/components/game/GameCanvas";
import { useGame, SAVE_KEY } from "@/game/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const started = useGame((s) => s.started);
  const hasSave = useGame((s) => s.hasSave);
  const setName = useGame((s) => s.setName);
  const start = useGame((s) => s.start);
  const [playerName, setPlayerName] = useState("");
  const [checkingSave, setCheckingSave] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (raw) {
        const save = JSON.parse(raw) as { name?: string };
        useGame.setState({ hasSave: true });
        if (save.name) setPlayerName(save.name);
      } else {
        useGame.setState({ hasSave: false });
      }
    } catch {
      useGame.setState({ hasSave: false });
    } finally {
      setCheckingSave(false);
    }
  }, []);

  const begin = (fresh: boolean) => {
    const cleanName = playerName.trim().slice(0, 16);
    if (cleanName) setName(cleanName);
    start(fresh);
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e2a13c]/40 bg-[#e2a13c]/10 text-[#f0b650]">
              <CarFront className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#e9ad49]">Open-world roleplay</p>
              <p className="mt-1 text-xs text-white/45">A city that moves with you</p>
            </div>
          </div>

          <div className="relative mt-12">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#e9ad49]">Your story. Your city.</p>
            <h1 className="max-w-lg text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">
              ANYWHERE
              <span className="mt-1 block text-white/55">ROLEPLAY</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/65 sm:text-base">
              Hit the streets, build your hustle, drive through the city, take on jobs and make your own name in a living Nigerian-inspired world.
            </p>
          </div>

          <div className="relative mt-10 grid grid-cols-3 gap-2">
            {[
              { icon: MapPin, title: "Explore", desc: "Open city" },
              { icon: Wallet, title: "Make money", desc: "Jobs & trade" },
              { icon: Smartphone, title: "Live RP", desc: "Phone & garage" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-black/15 p-3">
                <Icon className="mb-3 h-4 w-4 text-[#e9ad49]" />
                <p className="text-xs font-bold sm:text-sm">{title}</p>
                <p className="mt-1 text-[10px] text-white/45 sm:text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-10">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#e9ad49]">Welcome to the city</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Ready to make moves?</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">Choose your player name and step into the streets.</p>
          </div>

          <label htmlFor="player-name" className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
            Player name
          </label>
          <input
            id="player-name"
            value={playerName}
            maxLength={16}
            onChange={(event) => setPlayerName(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") begin(false && hasSave); }}
            placeholder="Enter your name"
            autoComplete="nickname"
            className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#e9ad49]/70 focus:ring-2 focus:ring-[#e9ad49]/15"
          />

          <button
            type="button"
            onClick={() => begin(false)}
            className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f0b650] to-[#d58d2b] px-4 py-3 text-sm font-extrabold text-[#17130b] shadow-lg shadow-[#d58d2b]/15 transition hover:brightness-110 active:scale-[0.99]"
          >
            {hasSave ? "Continue your story" : "Enter the city"}
            <ArrowRight className="h-4 w-4" />
          </button>

          {hasSave && (
            <button
              type="button"
              onClick={() => begin(true)}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/75 transition hover:bg-white/[0.08]"
            >
              Start a new game
            </button>
          )}

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
            <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-[#e9ad49]" />
            <p className="text-xs leading-5 text-white/45">
              {checkingSave ? "Checking this device for saved progress…" : "Progress is saved in this browser on this device. Online accounts and cross-device cloud saves are not enabled yet."}
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
            <Gamepad2 className="h-3.5 w-3.5" />
            Built for desktop and mobile
          </div>
        </div>
      </section>
      <p className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-white/20">ANYWHERE ROLEPLAY · EARLY ACCESS</p>
    </main>
  );
}
