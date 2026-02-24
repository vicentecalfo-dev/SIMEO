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

export type IucnCriterionBItem = "i" | "ii" | "iii" | "iv" | "v";

export interface IucnCriterionBInput {
  severelyFragmented?: boolean;
  numberOfLocations?: number | null;
  continuingDecline?: {
    enabled: boolean;
    items?: IucnCriterionBItem[];
  };
  extremeFluctuations?: {
    enabled: boolean;
    items?: IucnCriterionBItem[];
  };
}

export interface ProjectAssessment {
  iucnB?: IucnCriterionBInput;
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
  assessment?: ProjectAssessment;
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
  const validIucnItems: IucnCriterionBItem[] = ["i", "ii", "iii", "iv", "v"];

  function normalizeIucnItems(value: unknown): IucnCriterionBItem[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const unique: IucnCriterionBItem[] = [];

    for (const item of value) {
      if (
        typeof item === "string" &&
        validIucnItems.includes(item as IucnCriterionBItem) &&
        !unique.includes(item as IucnCriterionBItem)
      ) {
        unique.push(item as IucnCriterionBItem);
      }
    }

    if (unique.length === 0) {
      return undefined;
    }

    return unique.sort(
      (left, right) => validIucnItems.indexOf(left) - validIucnItems.indexOf(right),
    );
  }

  const maybeProject = project as Project & {
    settings?: { aooCellSizeMeters?: number };
    occurrences?: Occurrence[];
    results?: {
      eoo?: EooResult;
      aoo?: AooResult;
    };
    assessment?: {
      iucnB?: {
        severelyFragmented?: boolean;
        numberOfLocations?: number | null;
        continuingDecline?: {
          enabled?: boolean;
          items?: IucnCriterionBItem[];
        };
        extremeFluctuations?: {
          enabled?: boolean;
          items?: IucnCriterionBItem[];
        };
      };
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

  const baseIucnB = maybeProject.assessment?.iucnB;
  let iucnB: IucnCriterionBInput | undefined;

  if (baseIucnB && typeof baseIucnB === "object") {
    const normalizedIucnB: IucnCriterionBInput = {};

    if (typeof baseIucnB.severelyFragmented === "boolean") {
      normalizedIucnB.severelyFragmented = baseIucnB.severelyFragmented;
    }

    if (baseIucnB.numberOfLocations === null) {
      normalizedIucnB.numberOfLocations = null;
    } else if (
      Number.isFinite(baseIucnB.numberOfLocations) &&
      Number(baseIucnB.numberOfLocations) >= 0
    ) {
      normalizedIucnB.numberOfLocations = Number(baseIucnB.numberOfLocations);
    }

    if (
      baseIucnB.continuingDecline &&
      typeof baseIucnB.continuingDecline === "object"
    ) {
      const normalizedItems = normalizeIucnItems(baseIucnB.continuingDecline.items);
      const enabled = baseIucnB.continuingDecline.enabled === true;

      if (enabled || normalizedItems) {
        normalizedIucnB.continuingDecline = {
          enabled,
          items: normalizedItems,
        };
      }
    }

    if (
      baseIucnB.extremeFluctuations &&
      typeof baseIucnB.extremeFluctuations === "object"
    ) {
      const normalizedItems = normalizeIucnItems(baseIucnB.extremeFluctuations.items);
      const enabled = baseIucnB.extremeFluctuations.enabled === true;

      if (enabled || normalizedItems) {
        normalizedIucnB.extremeFluctuations = {
          enabled,
          items: normalizedItems,
        };
      }
    }

    if (Object.keys(normalizedIucnB).length > 0) {
      iucnB = normalizedIucnB;
    }
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
    assessment: iucnB
      ? {
          iucnB,
        }
      : undefined,
  };
}
