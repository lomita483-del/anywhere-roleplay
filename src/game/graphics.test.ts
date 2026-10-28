import { describe, expect, it } from "vitest";
import { getGraphicsProfile } from "./graphics";

describe("graphics quality profiles", () => {
  it("keeps the low profile lightweight for mobile devices", () => {
    const profile = getGraphicsProfile("low");
    expect(profile.dpr).toBe(1);
    expect(profile.shadowMapSize).toBe(512);
    expect(profile.environmentResolution).toBe(16);
    expect(profile.rainfallCount).toBe(70);
    expect(profile.trafficCount).toBe(14);
  });

  it("scales rendering features monotonically with quality", () => {
    const low = getGraphicsProfile("low");
    const medium = getGraphicsProfile("medium");
    const high = getGraphicsProfile("high");
    expect(low.rainfallCount).toBeLessThan(medium.rainfallCount);
    expect(medium.rainfallCount).toBeLessThan(high.rainfallCount);
    expect(low.buildingCullDistance).toBeLessThan(medium.buildingCullDistance);
    expect(medium.buildingCullDistance).toBeLessThan(high.buildingCullDistance);
    expect(low.trafficCount).toBeLessThan(medium.trafficCount);
    expect(medium.trafficCount).toBeLessThan(high.trafficCount);
  });
});
