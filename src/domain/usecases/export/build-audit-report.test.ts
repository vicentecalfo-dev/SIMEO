import { describe, expect, it, vi } from "vitest";
import type { Project } from "@/domain/entities/project";
import { buildAuditReport } from "@/domain/usecases/export/build-audit-report";
import { hashOccurrencesForAOO } from "@/domain/usecases/hash/hash-occurrences-for-aoo";
import { hashOccurrencesForEOO } from "@/domain/usecases/hash/hash-occurrences-for-eoo";

function projectFixture(): Project {
  const occurrences = [
    { id: "o1", lat: -10, lon: -50 },
    { id: "o2", lat: -11, lon: -51 },
  ];

  return {
    id: "proj-1",
    name: "Projeto",
    createdAt: 100,
    updatedAt: 200,
    settings: {
      aooCellSizeMeters: 2000,
    },
    occurrences,
    results: {
      eoo: {
        areaKm2: 10,
        hull: null,
        computedAt: 300,
        inputHash: hashOccurrencesForEOO(occurrences),
        pointsUsed: 2,
      },
      aoo: {
        areaKm2: 8,
        cellCount: 2,
        cellSizeMeters: 2000,
        grid: {
          type: "FeatureCollection",
          features: [],
        },
        computedAt: 400,
        inputHash: hashOccurrencesForAOO(occurrences, 2000),
        pointsUsed: 2,
      },
    },
  };
}

describe("buildAuditReport", () => {
  it("gera relatório com stale=false quando hashes batem", () => {
    vi.spyOn(Date, "now").mockReturnValue(999);

    const report = buildAuditReport(projectFixture());

    expect(report.generatedAt).toBe(999);
    expect(report.project.id).toBe("proj-1");
    expect(report.occurrencesStats.total).toBe(2);
    expect(report.eoo?.stale).toBe(false);
    expect(report.aoo?.stale).toBe(false);

    vi.restoreAllMocks();
  });

  it("marca stale=true quando hashes divergem", () => {
    const project = projectFixture();

    if (project.results?.eoo) {
      project.results.eoo.inputHash = "hash-antigo-eoo";
    }

    if (project.results?.aoo) {
      project.results.aoo.inputHash = "hash-antigo-aoo";
    }

    const report = buildAuditReport(project);

    expect(report.eoo?.stale).toBe(true);
    expect(report.aoo?.stale).toBe(true);
  });
});
