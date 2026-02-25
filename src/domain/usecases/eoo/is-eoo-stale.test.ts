import { describe, expect, it } from "vitest";
import type { Project } from "@/domain/entities/project";
import type { Occurrence } from "@/domain/entities/occurrence";
import { hashOccurrencesForEOO } from "@/domain/usecases/hash/hash-occurrences-for-eoo";
import { isEooStale } from "@/domain/usecases/eoo/is-eoo-stale";

function occ(id: string, lat: number, lon: number): Occurrence {
  return { id, lat, lon, calcStatus: "enabled" };
}

function projectFixture(occurrences: Occurrence[]): Project {
  return {
    id: "proj-1",
    name: "Projeto",
    createdAt: 100,
    updatedAt: 100,
    settings: {
      aooCellSizeMeters: 2000,
    },
    occurrences,
  };
}

describe("isEooStale", () => {
  it("retorna true quando não existe resultado EOO", () => {
    const project = projectFixture([occ("a", -10, -50), occ("b", -11, -51)]);

    expect(isEooStale(project)).toBe(true);
  });

  it("retorna false quando hash bate com as ocorrências atuais", () => {
    const occurrences = [occ("a", -10, -50), occ("b", -11, -51), occ("c", -12, -52)];
    const hash = hashOccurrencesForEOO(occurrences);

    const project: Project = {
      ...projectFixture(occurrences),
      results: {
        eoo: {
          areaKm2: 10,
          hull: null,
          computedAt: 123,
          inputHash: hash,
          pointsUsed: 3,
        },
      },
    };

    expect(isEooStale(project)).toBe(false);
  });

  it("retorna true quando hash difere das ocorrências atuais", () => {
    const occurrences = [occ("a", -10, -50), occ("b", -11, -51), occ("c", -12, -52)];

    const project: Project = {
      ...projectFixture(occurrences),
      results: {
        eoo: {
          areaKm2: 10,
          hull: null,
          computedAt: 123,
          inputHash: "hash-antigo",
          pointsUsed: 3,
        },
      },
    };

    expect(isEooStale(project)).toBe(true);
  });

  it("retorna true quando ocorrência é desabilitada após cálculo", () => {
    const occurrences = [occ("a", -10, -50), occ("b", -11, -51), occ("c", -12, -52)];
    const hash = hashOccurrencesForEOO(occurrences);

    const project: Project = {
      ...projectFixture([
        occurrences[0]!,
        {
          ...occurrences[1]!,
          calcStatus: "disabled",
        },
        occurrences[2]!,
      ]),
      results: {
        eoo: {
          areaKm2: 10,
          hull: null,
          computedAt: 123,
          inputHash: hash,
          pointsUsed: 3,
        },
      },
    };

    expect(isEooStale(project)).toBe(true);
  });
});
