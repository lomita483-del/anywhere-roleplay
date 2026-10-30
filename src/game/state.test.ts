import { describe, expect, it } from "vitest";
import { getCameraRelativeMove } from "./state";

describe("getCameraRelativeMove", () => {
  it("moves forward along the camera view direction", () => {
    const move = getCameraRelativeMove(Math.PI, 1, 0);
    expect(move.x).toBeCloseTo(0, 6);
    expect(move.z).toBeCloseTo(1, 6);
  });

  it("moves right along the camera's screen-right axis", () => {
    const move = getCameraRelativeMove(Math.PI, 0, 1);
    expect(move.x).toBeCloseTo(1, 6);
    expect(move.z).toBeCloseTo(0, 6);
  });

  it("keeps diagonal movement normalized without removing analog input", () => {
    const diagonal = getCameraRelativeMove(Math.PI, 1, 1);
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(1, 6);
    const partial = getCameraRelativeMove(Math.PI, 0.25, 0);
    expect(Math.hypot(partial.x, partial.z)).toBeCloseTo(0.25, 6);
  });

  it("tracks camera rotation instead of fixed world axes", () => {
    const move = getCameraRelativeMove(0, 1, 0);
    expect(move.x).toBeCloseTo(0, 6);
    expect(move.z).toBeCloseTo(-1, 6);
  });
});
