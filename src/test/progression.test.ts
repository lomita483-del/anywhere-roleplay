import { describe, expect, it } from "vitest";
import { STORY_GOALS, computeJobReward, currentGoal, newlyCompletedGoals, type ProgressSnapshot } from "@/game/progression";

const base: ProgressSnapshot = { cash: 0, bank: 0, level: 1, jobsCompleted: 0, bestStreak: 0, ownedVehicles: 0, unlockedDistricts: 1, ownsProperty: false };

describe("story progression", () => {
  it("starts at the first goal and advances in order", () => {
    expect(currentGoal([])?.id).toBe("first-shift");
    expect(currentGoal(["first-shift"])?.id).toBe("on-a-roll");
    expect(currentGoal(STORY_GOALS.map((g) => g.id))).toBeNull();
  });

  it("does not skip ahead past an incomplete goal", () => {
    // Owns a vehicle but has never worked: first-shift blocks the chain.
    expect(newlyCompletedGoals([], { ...base, ownedVehicles: 1 })).toEqual([]);
  });

  it("cascades through consecutive completed goals", () => {
    const done = newlyCompletedGoals([], { ...base, jobsCompleted: 3, bestStreak: 3, ownedVehicles: 1 });
    expect(done.map((g) => g.id)).toEqual(["first-shift", "on-a-roll", "first-wheels"]);
  });
});

describe("job rewards", () => {
  it("pays base only with no streak and a slow finish", () => {
    expect(computeJobReward(1000, 0, 400, 480)).toMatchObject({ total: 1000, streakBonus: 0, fastTip: 0, fast: false });
  });

  it("adds a streak bonus capped at 25% and a fast tip", () => {
    expect(computeJobReward(1000, 2, 100, 480)).toMatchObject({ streakBonus: 100, fastTip: 200, total: 1300, fast: true });
    expect(computeJobReward(1000, 20, null, null)).toMatchObject({ streakBonus: 250, total: 1250 });
  });
});
