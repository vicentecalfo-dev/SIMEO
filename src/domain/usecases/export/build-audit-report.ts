import type { Project } from "@/domain/entities/project";
import { isAooStale } from "@/domain/usecases/aoo/is-aoo-stale";
import { isEooStale } from "@/domain/usecases/eoo/is-eoo-stale";
import { validateLatLon } from "@/domain/value-objects/latlon";
import { APP_INFO } from "@/lib/app-info";

type OccurrencesStats = {
  total: number;
  valid: number;
  invalid: number;
  zeroZero: number;
  deduped?: number;
};

export type AuditReport = {
  project: {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
  };
  settings: {
    aooCellSizeMeters: number;
  };
  occurrencesStats: OccurrencesStats;
  eoo?: {
    areaKm2: number;
    pointsUsed: number;
    computedAt: number;
    inputHash: string;
    stale: boolean;
  };
  aoo?: {
    areaKm2: number;
    cellCount: number;
    cellSizeMeters: number;
    pointsUsed: number;
    computedAt: number;
    inputHash: string;
    stale: boolean;
  };
  app: {
    name: "SIMEO";
    version: string;
  };
  generatedAt: number;
};

function computeOccurrencesStats(project: Project): OccurrencesStats {
  let invalid = 0;
  let zeroZero = 0;
  let valid = 0;

  for (const occurrence of project.occurrences) {
    const isValidLatLon = validateLatLon(occurrence.lat, occurrence.lon).ok;

    if (!isValidLatLon) {
      invalid += 1;
      continue;
    }

    if (occurrence.lat === 0 && occurrence.lon === 0) {
      zeroZero += 1;
      continue;
    }

    valid += 1;
  }

  return {
    total: project.occurrences.length,
    valid,
    invalid,
    zeroZero,
  };
}

export function buildAuditReport(project: Project): AuditReport {
  const report: AuditReport = {
    project: {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    settings: {
      aooCellSizeMeters: project.settings.aooCellSizeMeters,
    },
    occurrencesStats: computeOccurrencesStats(project),
    app: {
      name: APP_INFO.name,
      version: APP_INFO.version,
    },
    generatedAt: Date.now(),
  };

  if (project.results?.eoo) {
    report.eoo = {
      areaKm2: project.results.eoo.areaKm2,
      pointsUsed: project.results.eoo.pointsUsed,
      computedAt: project.results.eoo.computedAt,
      inputHash: project.results.eoo.inputHash,
      stale: isEooStale(project),
    };
  }

  if (project.results?.aoo) {
    report.aoo = {
      areaKm2: project.results.aoo.areaKm2,
      cellCount: project.results.aoo.cellCount,
      cellSizeMeters: project.results.aoo.cellSizeMeters,
      pointsUsed: project.results.aoo.pointsUsed,
      computedAt: project.results.aoo.computedAt,
      inputHash: project.results.aoo.inputHash,
      stale: isAooStale(project),
    };
  }

  return report;
}
