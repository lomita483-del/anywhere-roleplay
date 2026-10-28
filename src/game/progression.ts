export const STARTING_CASH = 15_000;
export const STARTING_BANK = 10_000;

export const MAX_STREAK_BONUS = 0.25;
export const STREAK_STEP = 0.05;
export const FAST_TIP_RATE = 0.2;

export interface ProgressSnapshot {
  cash: number;
  bank: number;
  level: number;
  jobsCompleted: number;
  bestStreak: number;
  ownedVehicles: number;
  unlockedDistricts: number;
  ownsProperty: boolean;
}

export interface StoryGoal {
  id: string;
  chapter: string;
  title: string;
  description: string;
  reward: { cash: number; xp: number };
  progress: (s: ProgressSnapshot) => { current: number; target: number };
  tip: string;
  phoneApp?: "jobs" | "market" | "districts" | "bank" | "garage";
}

const netWorth = (s: ProgressSnapshot) => s.cash + s.bank;

export const STORY_GOALS: StoryGoal[] = [
  {
    id: "first-shift",
    chapter: "Chapter 1 · Fresh in the city",
    title: "Clock your first shift",
    description: "Take any job from the Jobs app and finish it before the timer runs out.",
    reward: { cash: 2_000, xp: 20 },
    progress: (s) => ({ current: Math.min(s.jobsCompleted, 1), target: 1 }),
    tip: "Courier runs are short and work on foot.",
    phoneApp: "jobs",
  },
  {
    id: "on-a-roll",
    chapter: "Chapter 1 · Fresh in the city",
    title: "Build a 3-job streak",
    description: "Finish three jobs in a row without abandoning or timing out. Streaks boost every payout.",
    reward: { cash: 4_000, xp: 30 },
    progress: (s) => ({ current: Math.min(s.bestStreak, 3), target: 3 }),
    tip: "Finish inside half the time limit for a fast-delivery tip.",
    phoneApp: "jobs",
  },
  {
    id: "first-wheels",
    chapter: "Chapter 2 · Getting mobile",
    title: "Buy your first ride",
    description: "Save up and buy any vehicle. An Okada is the cheapest way to start.",
    reward: { cash: 5_000, xp: 40 },
    progress: (s) => ({ current: Math.min(s.ownedVehicles, 1), target: 1 }),
    tip: "Vehicles are paid from your bank balance — deposit cash at an ATM first.",
    phoneApp: "market",
  },
  {
    id: "new-turf",
    chapter: "Chapter 2 · Getting mobile",
    title: "Open up a new district",
    description: "Unlock a second district so drivers can take you further across the city.",
    reward: { cash: 6_000, xp: 40 },
    progress: (s) => ({ current: Math.min(s.unlockedDistricts, 2), target: 2 }),
    tip: "Ajegunle / Makoko is the cheapest district to unlock.",
    phoneApp: "districts",
  },
  {
    id: "steady-hustle",
    chapter: "Chapter 3 · Making a name",
    title: "Complete 10 jobs",
    description: "Reliable hustlers get remembered. Keep taking shifts across the city.",
    reward: { cash: 10_000, xp: 60 },
    progress: (s) => ({ current: Math.min(s.jobsCompleted, 10), target: 10 }),
    tip: "Airport and estate jobs pay the most per shift.",
    phoneApp: "jobs",
  },
  {
    id: "level-five",
    chapter: "Chapter 3 · Making a name",
    title: "Reach level 5",
    description: "Earn XP from jobs and story goals. Every level pays a bank bonus.",
    reward: { cash: 12_000, xp: 0 },
    progress: (s) => ({ current: Math.min(s.level, 5), target: 5 }),
    tip: "Long streaks and story rewards stack XP quickly.",
    phoneApp: "jobs",
  },
  {
    id: "landlord",
    chapter: "Chapter 4 · Settling down",
    title: "Own a property",
    description: "Buy the deed to a Mainland Studio or an Ikoyi Apartment.",
    reward: { cash: 20_000, xp: 80 },
    progress: (s) => ({ current: s.ownsProperty ? 1 : 0, target: 1 }),
    tip: "The Mainland Studio deed costs ₦85,000 from your bank.",
    phoneApp: "market",
  },
  {
    id: "big-man",
    chapter: "Chapter 5 · Big man ting",
    title: "Reach ₦1,000,000 net worth",
    description: "Cash plus bank. Become one of the city's established names.",
    reward: { cash: 50_000, xp: 150 },
    progress: (s) => ({ current: Math.min(netWorth(s), 1_000_000), target: 1_000_000 }),
    tip: "Keep your streak alive — the bonus caps at +25%.",
    phoneApp: "bank",
  },
];

export function isGoalComplete(goal: StoryGoal, snapshot: ProgressSnapshot) {
  const { current, target } = goal.progress(snapshot);
  return current >= target;
}

/** The first goal in the chain that has not been claimed yet. */
export function currentGoal(completed: readonly string[]): StoryGoal | null {
  return STORY_GOALS.find((goal) => !completed.includes(goal.id)) ?? null;
}

/**
 * Returns the sequential goals that are now complete but not yet claimed.
 * Goals unlock strictly in order, so one action can cascade through several.
 */
export function newlyCompletedGoals(completed: readonly string[], snapshot: ProgressSnapshot): StoryGoal[] {
  const result: StoryGoal[] = [];
  for (const goal of STORY_GOALS) {
    if (completed.includes(goal.id)) continue;
    if (!isGoalComplete(goal, snapshot)) break;
    result.push(goal);
  }
  return result;
}

export interface JobRewardBreakdown {
  base: number;
  streakBonus: number;
  fastTip: number;
  total: number;
  streakRate: number;
  fast: boolean;
}

/**
 * streak is the number of consecutive jobs completed BEFORE this one.
 * Fast completion means finishing inside half the time limit.
 */
export function computeJobReward(base: number, streak: number, elapsedSeconds: number | null, limitSeconds: number | null): JobRewardBreakdown {
  const safeBase = Math.max(0, Math.round(base));
  const streakRate = Math.min(MAX_STREAK_BONUS, Math.max(0, Math.floor(streak)) * STREAK_STEP);
  const fast = elapsedSeconds !== null && limitSeconds !== null && limitSeconds > 0 && elapsedSeconds >= 0 && elapsedSeconds <= limitSeconds / 2;
  const streakBonus = Math.round(safeBase * streakRate);
  const fastTip = fast ? Math.round(safeBase * FAST_TIP_RATE) : 0;
  return { base: safeBase, streakBonus, fastTip, total: safeBase + streakBonus + fastTip, streakRate, fast };
}
