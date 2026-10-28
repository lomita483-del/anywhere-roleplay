import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Flame, Trophy } from "lucide-react";
import { useGame, naira } from "@/game/store";
import { STORY_GOALS, currentGoal, type ProgressSnapshot } from "@/game/progression";

const GOAL_CHECK_INTERVAL_MS = 1500;
const CELEBRATION_MS = 4500;
const JOB_REWARD_MS = 5000;

function useProgressSnapshot(): ProgressSnapshot {
  const cash = useGame((s) => s.cash);
  const bank = useGame((s) => s.bank);
  const level = useGame((s) => s.level);
  const jobsCompleted = useGame((s) => s.jobsCompleted);
  const bestStreak = useGame((s) => s.bestStreak);
  const ownedVehicles = useGame((s) => s.owned.length);
  const unlockedDistricts = useGame((s) => s.unlockedDistricts.length);
  const ownsProperty = useGame((s) => (s.inventory["mainland-studio"] ?? 0) > 0 || (s.inventory["ikoyi-apartment"] ?? 0) > 0);
  return { cash, bank, level, jobsCompleted, bestStreak, ownedVehicles, unlockedDistricts, ownsProperty };
}

export default function StoryTracker() {
  const started = useGame((s) => s.started);
  const phoneOpen = useGame((s) => s.phoneOpen);
  const completedGoals = useGame((s) => s.completedGoals);
  const jobStreak = useGame((s) => s.jobStreak);
  const openPhone = useGame((s) => s.openPhone);
  const celebration = useGame((s) => s.goalCelebration);
  const dismissCelebration = useGame((s) => s.dismissGoalCelebration);
  const lastJobReward = useGame((s) => s.lastJobReward);
  const snapshot = useProgressSnapshot();
  const [collapsed, setCollapsed] = useState(false);
  const [showJobReward, setShowJobReward] = useState(false);

  // Purchases, unlocks and level-ups happen across many store actions; a light poll keeps goal checks in one place.
  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => useGame.getState().checkGoals(), GOAL_CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [started]);

  useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(dismissCelebration, CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [celebration, dismissCelebration]);

  useEffect(() => {
    if (!lastJobReward) return;
    setShowJobReward(true);
    const timer = setTimeout(() => setShowJobReward(false), JOB_REWARD_MS);
    return () => clearTimeout(timer);
  }, [lastJobReward]);

  const goal = currentGoal(completedGoals);
  const doneCount = completedGoals.filter((id) => STORY_GOALS.some((g) => g.id === id)).length;

  return (
    <>
      {!phoneOpen && (
        <section
          aria-label="Story goal"
          className="pointer-events-auto absolute left-3 top-[9.6rem] w-[min(15.5rem,calc(100vw-1.5rem))] rounded-xl border border-amber-300/25 bg-[#0b1412]/90 text-xs shadow-lg shadow-black/30 backdrop-blur-md"
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
          >
            <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
            <span className="flex-1 text-[10px] font-black uppercase tracking-wider text-amber-100">
              Hustle Story · {doneCount}/{STORY_GOALS.length}
            </span>
            {jobStreak > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-black text-orange-200" title="Job streak">
                <Flame className="h-3 w-3" aria-hidden="true" />
                {jobStreak}
              </span>
            )}
            {collapsed ? <ChevronDown className="h-3.5 w-3.5 text-white/60" aria-hidden="true" /> : <ChevronUp className="h-3.5 w-3.5 text-white/60" aria-hidden="true" />}
            <span className="sr-only">{collapsed ? "Expand story goal" : "Collapse story goal"}</span>
          </button>
          {!collapsed && (
            <div className="border-t border-white/10 px-3 pb-3 pt-2">
              {goal ? (
                <GoalBody goal={goal} snapshot={snapshot} onOpen={() => goal.phoneApp && openPhone(goal.phoneApp)} />
              ) : (
                <p className="text-[11px] leading-relaxed text-emerald-100">
                  Story complete. You run this city now — keep stacking that net worth.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {celebration && (
        <div role="status" className="pointer-events-auto absolute left-1/2 top-[8.5rem] z-40 -translate-x-1/2">
          <button
            type="button"
            onClick={dismissCelebration}
            className="flex items-center gap-3 rounded-2xl border border-amber-300/60 bg-[#1a1408]/95 px-4 py-3 text-left shadow-2xl shadow-black/50 backdrop-blur-md"
            style={{ animation: "storyPop 420ms cubic-bezier(.2,1.4,.4,1)" }}
          >
            <Trophy className="h-7 w-7 shrink-0 text-amber-300" aria-hidden="true" />
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">Story goal complete</div>
              <div className="text-sm font-bold text-white">{celebration.title}</div>
              <div className="text-[11px] text-amber-100">
                +{naira(celebration.cash)}
                {celebration.xp > 0 ? ` · +${celebration.xp} XP` : ""}
              </div>
            </div>
          </button>
          <style>{`@keyframes storyPop { 0% { opacity: 0; transform: scale(.85) translateY(-8px); } 100% { opacity: 1; transform: none; } }`}</style>
        </div>
      )}

      {showJobReward && lastJobReward && !celebration && (
        <div role="status" className="pointer-events-none absolute left-1/2 top-[8.5rem] z-30 -translate-x-1/2 rounded-2xl border border-emerald-300/40 bg-[#07140f]/95 px-4 py-2.5 text-center shadow-xl backdrop-blur-md">
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300">Shift complete</div>
          <div className="text-lg font-black text-white">+{naira(lastJobReward.total)}</div>
          <div className="flex justify-center gap-2 text-[10px] text-emerald-100/80">
            <span>Base {naira(lastJobReward.base)}</span>
            {lastJobReward.streakBonus > 0 && <span className="text-orange-200">Streak +{Math.round(lastJobReward.streakRate * 100)}%</span>}
            {lastJobReward.fast && <span className="text-sky-200">Fast tip +{naira(lastJobReward.fastTip)}</span>}
          </div>
        </div>
      )}
    </>
  );
}

function GoalBody({ goal, snapshot, onOpen }: { goal: (typeof STORY_GOALS)[number]; snapshot: ProgressSnapshot; onOpen: () => void }) {
  const { current, target } = goal.progress(snapshot);
  const pct = Math.max(0, Math.min(100, (current / target) * 100));
  const isMoney = target >= 10_000;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[9px] font-bold uppercase tracking-wider text-white/50">{goal.chapter}</div>
      <div className="text-[13px] font-bold leading-tight text-white">{goal.title}</div>
      <p className="text-[11px] leading-snug text-white/70">{goal.description}</p>
      <div className="mt-0.5">
        <div className="mb-1 flex justify-between text-[10px] font-semibold text-white/70">
          <span>{isMoney ? `${naira(current)} / ${naira(target)}` : `${current} / ${target}`}</span>
          <span className="text-amber-200">+{naira(goal.reward.cash)}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-black/50">
          <div className="h-full rounded-full bg-amber-400 transition-[width] duration-500" style={{ width: pct + "%" }} />
        </div>
      </div>
      <p className="text-[10px] italic leading-snug text-white/50">Tip: {goal.tip}</p>
      {goal.phoneApp && (
        <button
          type="button"
          onClick={onOpen}
          className="mt-0.5 self-start rounded-lg border border-amber-300/40 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-100 active:scale-95"
        >
          Open {goal.phoneApp}
        </button>
      )}
    </div>
  );
}
