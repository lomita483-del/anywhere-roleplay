import { describe, expect, it } from "vitest";
import { advanceTrafficProgress } from "./trafficFollowing";

describe("advanceTrafficProgress", () => {
  const base = {
    current: 10,
    candidate: 12,
    routeLength: 100,
    leaders: [] as number[],
    minimumGap: 8,
    nearSignal: false,
    signal: "green" as const,
  };

  it("advances when the lane ahead is clear", () => {
    expect(advanceTrafficProgress(base)).toBe(12);
  });

  it("holds at a red or amber signal near a junction", () => {
    expect(advanceTrafficProgress({ ...base, nearSignal: true, signal: "red" })).toBe(10);
    expect(advanceTrafficProgress({ ...base, nearSignal: true, signal: "amber" })).toBe(10);
  });

  it("does not stop for a signal outside the junction approach", () => {
    expect(advanceTrafficProgress({ ...base, nearSignal: false, signal: "red" })).toBe(12);
  });

  it("maintains a minimum following gap, including across the route wrap", () => {
    expect(advanceTrafficProgress({ ...base, candidate: 12, leaders: [17] })).toBe(10);
    expect(advanceTrafficProgress({ ...base, current: 96, candidate: 99, leaders: [3] })).toBe(96);
  });

  it("normalizes progress after a route loop", () => {
    expect(advanceTrafficProgress({ ...base, candidate: 102 })).toBe(2);
  });
});
