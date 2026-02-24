import { describe, expect, it, vi } from "vitest";
import type { Occurrence } from "@/domain/entities/occurrence";
import { webMercatorMetersToLonLat } from "@/domain/geo/web-mercator";
import { computeAOO } from "@/domain/usecases/aoo/compute-aoo";

function occFromMeters(id: string, x: number, y: number): Occurrence {
  const point = webMercatorMetersToLonLat(x, y);

  return {
    id,
    lon: point.lon,
    lat: point.lat,
  };
}

describe("computeAOO", () => {
  it("retorna zero para coleção vazia", () => {
    const result = computeAOO({ occurrences: [], cellSizeMeters: 2000 });

    expect(result.cellCount).toBe(0);
    expect(result.areaKm2).toBe(0);
    expect(result.pointsUsed).toBe(0);
    expect(result.grid.type).toBe("FeatureCollection");
    expect(result.grid.features).toHaveLength(0);
  });

  it("conta 1 célula para pontos na mesma célula", () => {
    vi.spyOn(Date, "now").mockReturnValue(555);

    const result = computeAOO({
      cellSizeMeters: 2000,
      occurrences: [occFromMeters("a", 0, 0), occFromMeters("b", 1999, 100)],
    });

    expect(result.cellCount).toBe(1);
    expect(result.areaKm2).toBeCloseTo(4, 10);
    expect(result.pointsUsed).toBe(2);
    expect(result.grid.features).toHaveLength(1);
    expect(result.computedAt).toBe(555);

    vi.restoreAllMocks();
  });

  it("conta 2 células para pontos em células distintas", () => {
    const result = computeAOO({
      cellSizeMeters: 2000,
      occurrences: [occFromMeters("a", 0, 0), occFromMeters("b", 2100, 0)],
    });

    expect(result.cellCount).toBe(2);
    expect(result.areaKm2).toBeCloseTo(8, 10);
    expect(result.grid.features).toHaveLength(2);
    expect(result.inputHash.length > 0).toBe(true);
  });

  it("ignora pontos inválidos na contagem", () => {
    const result = computeAOO({
      cellSizeMeters: 2000,
      occurrences: [
        occFromMeters("a", 0, 0),
        { id: "inv", lat: 999, lon: 999 },
      ],
    });

    expect(result.pointsUsed).toBe(1);
    expect(result.cellCount).toBe(1);
  });
});
