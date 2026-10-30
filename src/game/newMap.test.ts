import { describe, expect, it } from "vitest";
import { getInteriorDefinition, getInteriorKind } from "./interiors";
import { NEW_MAP_BUILDINGS, NEW_MAP_JUNCTIONS, NEW_MAP_ROAD_GRAPH, NEW_MAP_ROADS, NEW_MAP_ROAD_WIDTHS, NEW_MAP_POIS, NEW_MAP_LAKE_LAYOUT, NEW_MAP_PORT_WATER, NEW_MAP_BOUNDS, NEW_MAP_TREES, NEW_MAP_MARKET_STALLS, isNewMapBlocked, validateNewMapLayout, findNewMapRoadRoute } from "./newMap";

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

  it("routes ride vehicles through connected NEW MAP streets instead of cutting directly across blocks", () => {
    const route = findNewMapRoadRoute(-150, -120, 150, 120);
    expect(route.length).toBeGreaterThan(3);
    expect(route[0]).toEqual([-150, -120]);
    expect(route[route.length - 1]).toEqual([150, 120]);
    for (let i = 1; i < route.length - 1; i++) {
      const [x, z] = route[i]!;
      expect(NEW_MAP_ROAD_GRAPH.nodes.some(node => Math.hypot(node.x - x, node.z - z) < 0.01)).toBe(true);
    }
  });

  it("builds out the university campus with enterable library and student services", () => {
    const campus = NEW_MAP_BUILDINGS.filter(building => building.district === "university");
    expect(campus.map(building => building.id)).toEqual(expect.arrayContaining([
      "university", "school", "pharmacy", "university-library", "student-union"
    ]));
    for (const id of ["university-library", "student-union"]) {
      const building = campus.find(item => item.id === id)!;
      expect(NEW_MAP_POIS.some(poi => poi.buildingId === id && poi.label === building.label)).toBe(true);
      expect(getInteriorKind(building.label, building.kind)).toBe("university");
      expect(isNewMapBlocked(building.doorX!, building.doorZ!, 0.4)).toBe(false);
    }
    expect(getInteriorDefinition("UNIVERSITY LIBRARY", "university").hotspots.length).toBeGreaterThan(2);
  });

  it("adds distinct government and court destinations with dedicated furnished interiors", () => {
    const government = NEW_MAP_BUILDINGS.find(building => building.id === "government-house");
    const court = NEW_MAP_BUILDINGS.find(building => building.id === "court-complex");
    expect(government?.district).toBe("government");
    expect(court?.district).toBe("government");
    expect(NEW_MAP_POIS.some(poi => poi.buildingId === government?.id)).toBe(true);
    expect(NEW_MAP_POIS.some(poi => poi.buildingId === court?.id)).toBe(true);
    expect(getInteriorKind("GOVERNMENT HOUSE")).toBe("government");
    expect(getInteriorKind("CITY COURT COMPLEX")).toBe("court");
    expect(getInteriorDefinition("GOVERNMENT HOUSE").props.length).toBeGreaterThan(5);
    expect(getInteriorDefinition("CITY COURT COMPLEX").hotspots.length).toBeGreaterThan(1);
  });

  it("includes named inner-city shops and food landmarks in the discoverable POI list", () => {
    const innerCity = NEW_MAP_BUILDINGS.filter(building => building.id.startsWith("inner-"));
    expect(innerCity).toHaveLength(8);
    for (const building of innerCity) {
      expect(NEW_MAP_POIS.some(poi => poi.buildingId === building.id && poi.label === building.label)).toBe(true);
    }
  });

  it("blocks map boundaries, building footprints and water while keeping door approaches open", () => {
    expect(isNewMapBlocked(NEW_MAP_BOUNDS.minX - 1, 0)).toBe(true);
    expect(isNewMapBlocked(NEW_MAP_BOUNDS.maxX + 1, 0)).toBe(true);

    const tower = NEW_MAP_BUILDINGS.find((building) => building.id === "tower-a")!;
    expect(isNewMapBlocked(tower.x, tower.z)).toBe(true);

    const university = NEW_MAP_BUILDINGS.find((building) => building.id === "university")!;
    expect(isNewMapBlocked(university.doorX!, university.doorZ!, 0.4)).toBe(false);

    expect(isNewMapBlocked(NEW_MAP_LAKE_LAYOUT.x, NEW_MAP_LAKE_LAYOUT.z)).toBe(true);
    expect(isNewMapBlocked(NEW_MAP_PORT_WATER.x, NEW_MAP_PORT_WATER.z)).toBe(true);
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
