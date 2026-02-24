import { describe, expect, it } from "vitest";
import type { Project } from "@/domain/entities/project";
import type { Occurrence } from "@/domain/entities/occurrence";
import { isAooStale } from "@/domain/usecases/aoo/is-aoo-stale";
import { hashOccurrencesForAOO } from "@/domain/usecases/hash/hash-occurrences-for-aoo";

function occ(id: string, lat: number, lon: number): Occurrence {
  return { id, lat, lon };
}

function projectFixture(occurrences: Occurrence[], cellSizeMeters: number): Project {
  return {
    id: "proj-1",
    name: "Projeto",
    createdAt: 100,
    updatedAt: 100,
    settings: {
      aooCellSizeMeters: cellSizeMeters,
    },
    occurrences,
  };
}

describe("isAooStale", () => {
  it("retorna true quando não existe resultado AOO", () => {
    const project = projectFixture([occ("a", -10, -50)], 2000);

    expect(isAooStale(project)).toBe(true);
  });

  it("retorna false quando hash bate", () => {
    const occurrences = [occ("a", -10, -50), occ("b", -11, -51)];
    const cellSizeMeters = 2000;
    const hash = hashOccurrencesForAOO(occurrences, cellSizeMeters);

    const project: Project = {
      ...projectFixture(occurrences, cellSizeMeters),
      results: {
        aoo: {
          areaKm2: 8,
          cellCount: 2,
          cellSizeMeters,
          grid: {
            type: "FeatureCollection",
            features: [],
          },
          computedAt: 123,
          inputHash: hash,
          pointsUsed: 2,
        },
      },
    };

    expect(isAooStale(project)).toBe(false);
  });

  it("retorna true quando hash difere", () => {
    const occurrences = [occ("a", -10, -50), occ("b", -11, -51)];

    const project: Project = {
      ...projectFixture(occurrences, 2000),
      results: {
        aoo: {
          areaKm2: 8,
          cellCount: 2,
          cellSizeMeters: 2000,
          grid: {
            type: "FeatureCollection",
            features: [],
          },
          computedAt: 123,
          inputHash: "hash-antigo",
          pointsUsed: 2,
        },
      },
    };

    expect(isAooStale(project)).toBe(true);
  });

  it("retorna true quando cellSizeMeters muda no projeto", () => {
    const occurrences = [occ("a", -10, -50), occ("b", -11, -51)];
    const hash = hashOccurrencesForAOO(occurrences, 2000);

    const project: Project = {
      ...projectFixture(occurrences, 1000),
      results: {
        aoo: {
          areaKm2: 8,
          cellCount: 2,
          cellSizeMeters: 2000,
          grid: {
            type: "FeatureCollection",
            features: [],
          },
          computedAt: 123,
          inputHash: hash,
          pointsUsed: 2,
        },
      },
    };

    expect(isAooStale(project)).toBe(true);
  });
});
