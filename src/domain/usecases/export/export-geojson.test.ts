import { describe, expect, it } from "vitest";
import type { Project } from "@/domain/entities/project";
import { exportGeoJson } from "@/domain/usecases/export/export-geojson";

function projectFixture(data: Partial<Project> = {}): Project {
  return {
    id: data.id ?? "proj-1",
    name: data.name ?? "Projeto",
    createdAt: data.createdAt ?? 100,
    updatedAt: data.updatedAt ?? 200,
    settings: data.settings ?? { aooCellSizeMeters: 2000 },
    occurrences: data.occurrences ?? [
      { id: "o1", lat: -10, lon: -50, label: "P1", source: "csv" },
      { id: "inv", lat: 999, lon: 999, label: "Inv" },
    ],
    results: data.results,
  };
}

describe("exportGeoJson", () => {
  it("inclui occurrences e omite eoo/aoo quando inexistentes", () => {
    const exported = exportGeoJson(projectFixture());

    expect(exported.occurrences.type).toBe("FeatureCollection");
    expect(exported.occurrences.features).toHaveLength(1);
    expect(exported.eooHull).toBeUndefined();
    expect(exported.aooGrid).toBeUndefined();
  });

  it("inclui eoo hull e aoo grid quando existem", () => {
    const exported = exportGeoJson(
      projectFixture({
        results: {
          eoo: {
            areaKm2: 10,
            pointsUsed: 3,
            computedAt: 1,
            inputHash: "h1",
            hull: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [[[0, 0], [1, 0], [0, 1], [0, 0]]],
              },
            },
          },
          aoo: {
            areaKm2: 8,
            cellCount: 2,
            cellSizeMeters: 2000,
            pointsUsed: 2,
            computedAt: 2,
            inputHash: "h2",
            grid: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: { cx: 0, cy: 0, cellSizeMeters: 2000 },
                  geometry: {
                    type: "Polygon",
                    coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
                  },
                },
              ],
            },
          },
        },
      }),
    );

    expect(exported.eooHull?.geometry.type).toBe("Polygon");
    expect(exported.aooGrid?.type).toBe("FeatureCollection");
    expect(exported.aooGrid?.features).toHaveLength(1);
  });
});
