import { describe, expect, it } from "vitest";
import {
  buildAooGridGeoJson,
  cellToPolygonLonLat,
  computeOccupiedCells,
} from "@/domain/geo/aoo-grid";
import { webMercatorMetersToLonLat } from "@/domain/geo/web-mercator";

function pointFromMeters(x: number, y: number): { lon: number; lat: number } {
  return webMercatorMetersToLonLat(x, y);
}

describe("aoo-grid", () => {
  it("deduplica pontos na mesma célula", () => {
    const cellSizeMeters = 2000;
    const points = [pointFromMeters(10_000, 10_000), pointFromMeters(11_999, 10_100)];

    const occupiedCells = computeOccupiedCells(points, cellSizeMeters);

    expect(occupiedCells.size).toBe(1);
    expect(occupiedCells.has("5|5")).toBe(true);
  });

  it("separa pontos em células diferentes", () => {
    const cellSizeMeters = 2000;
    const points = [pointFromMeters(10_000, 10_000), pointFromMeters(12_100, 10_000)];

    const occupiedCells = computeOccupiedCells(points, cellSizeMeters);

    expect(occupiedCells.size).toBe(2);
    expect(occupiedCells.has("5|5")).toBe(true);
    expect(occupiedCells.has("6|5")).toBe(true);
  });

  it("gera GeoJSON previsível para células ocupadas", () => {
    const cellSizeMeters = 2000;
    const points = [pointFromMeters(10_000, 10_000), pointFromMeters(12_100, 10_000)];
    const occupiedCells = computeOccupiedCells(points, cellSizeMeters);

    const geoJson = buildAooGridGeoJson(occupiedCells, cellSizeMeters);

    expect(geoJson.type).toBe("FeatureCollection");
    expect(geoJson.features).toHaveLength(2);

    const first = geoJson.features[0];
    expect(first?.geometry.type).toBe("Polygon");
    expect(first?.properties?.cellSizeMeters).toBe(2000);
  });

  it("cria polígono fechado para a célula", () => {
    const cell = cellToPolygonLonLat(3, -2, 2000);
    const ring = cell.geometry.coordinates[0];

    expect(ring).toHaveLength(5);
    expect(ring[0]?.[0]).toBe(ring[4]?.[0]);
    expect(ring[0]?.[1]).toBe(ring[4]?.[1]);
    expect(cell.properties?.cx).toBe(3);
    expect(cell.properties?.cy).toBe(-2);
  });
});
