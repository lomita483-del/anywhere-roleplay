import { useEffect, useState } from "react";
import { MapPinned, Smartphone, Footprints, BriefcaseBusiness, Sparkles, X } from "lucide-react";

const STORAGE_KEY = "lagos-life-first-day-tutorial-v1";
const STEPS = [
  { title: "Welcome to Lagos Life RP", text: "You are starting in Yaba / Surulere. Build your reputation, meet people and make your own story.", icon: Sparkles },
  { title: "Move around the city", text: "On mobile, use the joystick at the bottom-left. On PC, use WASD or the arrow keys and move your mouse to orbit the camera.", icon: Footprints },
  { title: "Your phone is your lifeline", text: "Open your phone to use the live map, set GPS waypoints, book a ride, check your bank, eat at a buka or unlock new districts.", icon: Smartphone },
  { title: "Hustle, earn and explore", text: "Walk to job markers, interact with nearby shops and public buildings, keep your hunger and energy up, and unlock districts as you grow.", icon: BriefcaseBusiness },
  { title: "Find your own route", text: "Tap the minimap to set a destination. Follow the glowing GPS route, or use Ride & GPS to call a driver or Okada.", icon: MapPinned },
];

export default function FirstDayTutorial() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => {
    try { setVisible(localStorage.getItem(STORAGE_KEY) !== "done"); }
    catch { setVisible(true); }
  }, []);
  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, "done"); } catch { /* storage may be unavailable */ }
    setVisible(false);
  };
  if (!visible) return null;
  const item = STEPS[step] ?? STEPS[0]!;
  const Icon = item.icon;
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="First day tutorial">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#eab308]/35 bg-[#0c151d]/95 p-5 text-white shadow-2xl shadow-black/60">
        <div className="absolute inset-x-0 top-0 h-1 bg-white/10"><div className="h-full bg-[#eab308] transition-all" style={{ width: ((step + 1) / STEPS.length * 100) + "%" }} /></div>
        <button onClick={finish} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-white" aria-label="Skip tutorial"><X className="h-4 w-4" /></button>
        <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#eab308]/25 bg-[#eab308]/10 text-[#f4d16a]"><Icon className="h-7 w-7" /></div>
        <div className="mt-4 text-[9px] font-bold uppercase tracking-[0.22em] text-[#eab308]">First day · Step {step + 1} of {STEPS.length}</div>
        <h2 className="mt-2 text-xl font-black tracking-tight">{item.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.text}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button onClick={finish} className="rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-slate-300">Skip tutorial</button>
          <button onClick={() => step === STEPS.length - 1 ? finish() : setStep((n) => n + 1)} className="rounded-xl bg-[#eab308] px-4 py-2.5 text-xs font-black text-[#18140a]">{step === STEPS.length - 1 ? "Start roleplay" : "Next step →"}</button>
        </div>
      </div>
    </div>
  );
}
