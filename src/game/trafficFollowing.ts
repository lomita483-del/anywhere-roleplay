/** Deterministic lane-following rule shared by ambient and named traffic.
 * Progress is measured in metres along one route. Vehicles keep a minimum headway,
 * and stop before a junction whenever its signal is not green.
 */
export interface TrafficProgressInput {
  current: number;
  candidate: number;
  routeLength: number;
  leaders: readonly number[];
  minimumGap: number;
  nearSignal: boolean;
  signal: "green" | "amber" | "red";
}

export function advanceTrafficProgress(input: TrafficProgressInput): number {
  const { current, candidate, routeLength, leaders, minimumGap, nearSignal, signal } = input;
  if (!Number.isFinite(routeLength) || routeLength <= 0) return current;
  if (nearSignal && signal !== "green") return current;

  const next = ((candidate % routeLength) + routeLength) % routeLength;
  for (const leader of leaders) {
    if (!Number.isFinite(leader)) continue;
    const gap = ((leader - next) % routeLength + routeLength) % routeLength;
    // Ignore a vehicle effectively at the same progress point; this also prevents
    // a duplicate initial position from freezing every vehicle on a route.
    if (gap > 0.05 && gap < minimumGap) return current;
  }
  return next;
}
