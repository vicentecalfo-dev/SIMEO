import type { Occurrence } from "@/domain/entities/occurrence";
import type * as GeoJSON from "geojson";

export interface EooResult {
  areaKm2: number;
  hull: GeoJSON.Feature<GeoJSON.Polygon> | null;
  computedAt: number;
  inputHash: string;
  pointsUsed: number;
}

export interface AooResult {
  areaKm2: number;
  cellCount: number;
  cellSizeMeters: number;
  grid: GeoJSON.FeatureCollection<GeoJSON.Polygon>;
  computedAt: number;
  inputHash: string;
  pointsUsed: number;
}

export interface ProjectResults {
  eoo?: EooResult;
  aoo?: AooResult;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  settings: {
    aooCellSizeMeters: number;
  };
  occurrences: Occurrence[];
  results?: ProjectResults;
}

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: number;
  createdAt: number;
}

function randomIdFallback(): string {
  return `proj-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const DEFAULT_AOO_CELL_SIZE_METERS = 2000;

export function generateProjectId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return randomIdFallback();
}

export function newProject(name: string): Project {
  const now = Date.now();

  return {
    id: generateProjectId(),
    name,
    createdAt: now,
    updatedAt: now,
    settings: {
      aooCellSizeMeters: DEFAULT_AOO_CELL_SIZE_METERS,
    },
    occurrences: [],
  };
}

export function touchProject(project: Project): Project {
  return {
    ...project,
    updatedAt: Date.now(),
  };
}

export function withProjectDefaults(project: Project): Project {
  const maybeProject = project as Project & {
    settings?: { aooCellSizeMeters?: number };
    occurrences?: Occurrence[];
    results?: {
      eoo?: EooResult;
      aoo?: AooResult;
    };
  };

  const baseEoo = maybeProject.results?.eoo;
  let eooResult: EooResult | undefined;
  if (
    baseEoo &&
    Number.isFinite(baseEoo.areaKm2) &&
    Number.isFinite(baseEoo.computedAt) &&
    typeof baseEoo.inputHash === "string" &&
    Number.isFinite(baseEoo.pointsUsed)
  ) {
    eooResult = {
      areaKm2: Number(baseEoo.areaKm2),
      hull:
        baseEoo.hull && baseEoo.hull.geometry?.type === "Polygon"
          ? (JSON.parse(
              JSON.stringify(baseEoo.hull),
            ) as GeoJSON.Feature<GeoJSON.Polygon>)
          : null,
      computedAt: Number(baseEoo.computedAt),
      inputHash: baseEoo.inputHash,
      pointsUsed: Number(baseEoo.pointsUsed),
    };
  }

  const baseAoo = maybeProject.results?.aoo;
  let aooResult: AooResult | undefined;
  if (
    baseAoo &&
    Number.isFinite(baseAoo.areaKm2) &&
    Number.isFinite(baseAoo.cellCount) &&
    Number.isFinite(baseAoo.cellSizeMeters) &&
    Number.isFinite(baseAoo.computedAt) &&
    typeof baseAoo.inputHash === "string" &&
    Number.isFinite(baseAoo.pointsUsed) &&
    baseAoo.grid &&
    baseAoo.grid.type === "FeatureCollection" &&
    Array.isArray(baseAoo.grid.features)
  ) {
    const clonedGrid = JSON.parse(
      JSON.stringify(baseAoo.grid),
    ) as GeoJSON.FeatureCollection<GeoJSON.Polygon>;

    aooResult = {
      areaKm2: Number(baseAoo.areaKm2),
      cellCount: Number(baseAoo.cellCount),
      cellSizeMeters: Number(baseAoo.cellSizeMeters),
      grid: clonedGrid,
      computedAt: Number(baseAoo.computedAt),
      inputHash: baseAoo.inputHash,
      pointsUsed: Number(baseAoo.pointsUsed),
    };
  }

  return {
    ...project,
    settings: {
      aooCellSizeMeters:
        Number.isFinite(maybeProject.settings?.aooCellSizeMeters) &&
        Number(maybeProject.settings?.aooCellSizeMeters) > 0
        ? Number(maybeProject.settings?.aooCellSizeMeters)
        : DEFAULT_AOO_CELL_SIZE_METERS,
    },
    occurrences: Array.isArray(maybeProject.occurrences)
      ? maybeProject.occurrences.map((occurrence) => ({ ...occurrence }))
      : [],
    results:
      eooResult || aooResult
        ? {
            eoo: eooResult,
            aoo: aooResult,
          }
        : undefined,
  };
}
