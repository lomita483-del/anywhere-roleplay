import { beforeEach, describe, expect, it } from "vitest";
import { SAVE_KEY, useGame } from "@/game/store";

describe("Anywhere Roleplay game store", () => {
  beforeEach(() => {
    localStorage.clear();
    useGame.setState({
      started: false,
      name: "",
      cash: 5000,
      bank: 10000,
      inventory: {},
      owned: [],
      jobStats: { deliveries: 0, drives: 0, trades: 0, patrols: 0 },
      activeJob: null,
      spawnedVehicles: [],
      hasSave: false,
      phoneOpen: false,
      phoneApp: "home",
      prompt: null,
      modal: null,
      clock: 8,
      speedKph: 0,
      nearJobTarget: 0,
      driving: false,
      lastRadio: 0,
    });
  });

  it("moves money between cash and bank without changing total funds", () => {
    const game = useGame.getState();
    game.transfer(1200, "deposit");
    expect(useGame.getState().cash).toBe(3800);
    expect(useGame.getState().bank).toBe(11200);
    useGame.getState().transfer(700, "withdraw");
    expect(useGame.getState().cash).toBe(4500);
    expect(useGame.getState().bank).toBe(10500);
  });

  it("rejects invalid spending, earnings, and transfers", () => {
    const game = useGame.getState();
    expect(game.spend(-100, "cash")).toBe(false);
    expect(game.spend(Number.NaN, "bank")).toBe(false);
    game.earn(-500, "cash");
    game.transfer(0, "deposit");
    game.transfer(Number.POSITIVE_INFINITY, "withdraw");
    expect(useGame.getState().cash).toBe(5000);
    expect(useGame.getState().bank).toBe(10000);
  });

  it("saves and restores active job and spawned vehicle state", () => {
    useGame.getState().start(true);
    useGame.getState().setName("TestDriver");
    useGame.getState().acceptJob("courier");
    useGame.getState().addSpawned({ id: "owned-test-car", model: "sedan", x: 12, z: -8, rotY: 1.2 });
    useGame.getState().save();

    useGame.setState({ activeJob: null, spawnedVehicles: [], cash: 0, name: "Changed" });
    useGame.getState().start(false);

    expect(useGame.getState().name).toBe("TestDriver");
    expect(useGame.getState().activeJob?.type).toBe("courier");
    expect(useGame.getState().spawnedVehicles).toEqual([
      { id: "owned-test-car", model: "sedan", x: 12, z: -8, rotY: 1.2 },
    ]);
    expect(localStorage.getItem(SAVE_KEY)).not.toBeNull();
  });
});
