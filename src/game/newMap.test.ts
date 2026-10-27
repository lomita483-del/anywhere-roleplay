import { describe, expect, it } from "vitest";
import { NEW_MAP_BUILDINGS, NEW_MAP_JUNCTIONS, NEW_MAP_ROAD_GRAPH, NEW_MAP_ROADS, NEW_MAP_ROAD_WIDTHS, NEW_MAP_POIS, validateNewMapLayout } from "./newMap";

describe("NEW MAP layout", () => {
  it("keeps every planned building, stall, tree and hill clear of roads and one another", () => {
    expect(validateNewMapLayout()).toEqual([]);
  });

  it("uses a connected road graph with consistent avenue and street widths", () => {
    expect(NEW_MAP_ROADS.length).toBe(NEW_MAP_ROAD_WIDTHS.length);
    expect(NEW_MAP_ROAD_GRAPH.edges.length).toBeGreaterThan(NEW_MAP_ROADS.length);
    expect(NEW_MAP_JUNCTIONS.length).toBeGreaterThan(8);
    expect(NEW_MAP_ROAD_GRAPH.edges.every(edge => NEW_MAP_ROAD_GRAPH.nodes.some(node => node.id === edge.from) && NEW_MAP_ROAD_GRAPH.nodes.some(node => node.id === edge.to))).toBe(true);
    const adjacency = new Map(NEW_MAP_ROAD_GRAPH.nodes.map(node => [node.id, new Set<string>()]));
    for (const edge of NEW_MAP_ROAD_GRAPH.edges) { adjacency.get(edge.from)!.add(edge.to); adjacency.get(edge.to)!.add(edge.from); }
    const seen = new Set<string>();
    const queue = [NEW_MAP_ROAD_GRAPH.nodes[0]!.id];
    while (queue.length) { const id = queue.shift()!; if (seen.has(id)) continue; seen.add(id); for (const next of adjacency.get(id) ?? []) if (!seen.has(next)) queue.push(next); }
    expect(seen.size).toBe(NEW_MAP_ROAD_GRAPH.nodes.length);
    expect(NEW_MAP_ROAD_GRAPH.edges.filter(edge => edge.type === "avenue" || edge.type === "boulevard" || edge.type === "perimeter").every(edge => edge.width === 8)).toBe(true);
    expect(NEW_MAP_ROAD_GRAPH.edges.filter(edge => edge.type === "street").every(edge => edge.width === 5)).toBe(true);
  });

  it("derives service POIs from their canonical building doors", () => {
    for (const poi of NEW_MAP_POIS.filter(p => p.buildingId)) {
      const building = NEW_MAP_BUILDINGS.find(b => b.id === poi.buildingId);
      expect(building, `missing building for POI ${poi.id}`).toBeTruthy();
      expect(poi.x).toBe(building!.doorX);
      expect(poi.z).toBe(building!.doorZ);
    }
  });
});
