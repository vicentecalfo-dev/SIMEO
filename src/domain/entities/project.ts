import type { Occurrence } from "@/domain/entities/occurrence";
import { normalizeCalcStatus } from "@/domain/entities/occurrence";
import {
  DEFAULT_MAP_LAYER_ORDER,
  normalizeMapLayerVisibility,
  type MapLayerId,
  type MapLayerVisibility,
} from "@/domain/entities/map-layers";
import type * as GeoJSON from "geojson";
import { setLayerOrder } from "@/lib/layer-order";

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

export type MapBiomasTargetShape = "EOO" | "AOO";

export interface MapBiomasConfig {
  targetShape: MapBiomasTargetShape;
  naturalClasses: number[];
  samplingStep: number;
}

export interface MapBiomasDatasetUrlMeta {
  id: string;
  sourceType: "url";
  year: number;
  url: string;
  label?: string;
  addedAt: number;
}

export interface MapBiomasDatasetFileMeta {
  id: string;
  sourceType: "file";
  year: number;
  fileName: string;
  label?: string;
  addedAt: number;
}

export type MapBiomasDatasetMeta =
  | MapBiomasDatasetUrlMeta
  | MapBiomasDatasetFileMeta;

export interface MapBiomasYearResult {
  year: number;
  naturalPercent: number;
  totalPixels: number;
  naturalPixels: number;
}

export interface MapBiomasResults {
  byYear: MapBiomasYearResult[];
  generatedAt: number;
}

export interface ProjectMapBiomas {
  config: MapBiomasConfig;
  datasets: MapBiomasDatasetMeta[];
  results?: MapBiomasResults;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  settings: {
    aooCellSizeMeters: number;
    mapLayers?: {
      order: MapLayerId[];
      visibility?: MapLayerVisibility;
    };
  };
  occurrences: Occurrence[];
  results?: ProjectResults;
  assessment?: ProjectAssessment;
  mapbiomas?: ProjectMapBiomas;
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
export const DEFAULT_MAPBIOMAS_NATURAL_CLASSES: number[] = [1, 3, 4, 5];
export const DEFAULT_MAPBIOMAS_SAMPLING_STEP = 4;

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
      mapLayers: {
        order: [...DEFAULT_MAP_LAYER_ORDER],
        visibility: normalizeMapLayerVisibility(undefined),
      },
    },
    occurrences: [],
    mapbiomas: {
      config: {
        targetShape: "EOO",
        naturalClasses: [...DEFAULT_MAPBIOMAS_NATURAL_CLASSES],
        samplingStep: DEFAULT_MAPBIOMAS_SAMPLING_STEP,
      },
      datasets: [],
      results: undefined,
    },
  };
}

export function touchProject(project: Project): Project {
  return {
    ...project,
    updatedAt: Date.now(),
  };
}

export function withProjectDefaults(project: Project): Project {
  const samplingSteps = [1, 2, 4, 8];
  const validIucnItems: IucnCriterionBItem[] = ["i", "ii", "iii", "iv", "v"];

  function normalizeTargetShape(value: unknown): MapBiomasTargetShape {
    return value === "AOO" ? "AOO" : "EOO";
  }

  function normalizeNaturalClasses(value: unknown): number[] {
    if (!Array.isArray(value)) {
      return [...DEFAULT_MAPBIOMAS_NATURAL_CLASSES];
    }

    const normalized: number[] = [];
    for (const entry of value) {
      const asNumber = Number(entry);
      const integer = Math.trunc(asNumber);

      if (!Number.isFinite(asNumber) || integer < 0 || normalized.includes(integer)) {
        continue;
      }

      normalized.push(integer);
    }

    return normalized.length > 0
      ? normalized
      : [...DEFAULT_MAPBIOMAS_NATURAL_CLASSES];
  }

  function normalizeSamplingStep(value: unknown): number {
    const asNumber = Number(value);

    if (!Number.isFinite(asNumber)) {
      return DEFAULT_MAPBIOMAS_SAMPLING_STEP;
    }

    const normalized = Math.trunc(asNumber);

    return samplingSteps.includes(normalized)
      ? normalized
      : DEFAULT_MAPBIOMAS_SAMPLING_STEP;
  }

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
    settings?: {
      aooCellSizeMeters?: number;
      mapLayers?: {
        order?: unknown;
        visibility?: unknown;
      };
    };
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
    mapbiomas?: {
      config?: {
        targetShape?: unknown;
        naturalClasses?: unknown;
        samplingStep?: unknown;
      };
      datasets?: unknown;
      results?: {
        byYear?: unknown;
        generatedAt?: unknown;
      };
    };
  };

  const normalizedMapLayerOrder = setLayerOrder(
    Array.isArray(maybeProject.settings?.mapLayers?.order)
      ? (maybeProject.settings?.mapLayers?.order as MapLayerId[])
      : [...DEFAULT_MAP_LAYER_ORDER],
  );
  const normalizedMapLayerVisibility = normalizeMapLayerVisibility(
    maybeProject.settings?.mapLayers?.visibility,
  );

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

  const baseMapBiomas = maybeProject.mapbiomas;
  const mapbiomasConfig: MapBiomasConfig = {
    targetShape: normalizeTargetShape(baseMapBiomas?.config?.targetShape),
    naturalClasses: normalizeNaturalClasses(baseMapBiomas?.config?.naturalClasses),
    samplingStep: normalizeSamplingStep(baseMapBiomas?.config?.samplingStep),
  };

  const mapbiomasDatasets: MapBiomasDatasetMeta[] = [];
  if (Array.isArray(baseMapBiomas?.datasets)) {
    for (const entry of baseMapBiomas.datasets) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const raw = entry as Partial<MapBiomasDatasetMeta> & {
        sourceType?: unknown;
        fileName?: unknown;
        url?: unknown;
        label?: unknown;
      };
      const id = typeof raw.id === "string" ? raw.id.trim() : "";
      const year = Number(raw.year);
      const addedAt = Number(raw.addedAt);
      const label =
        typeof raw.label === "string" && raw.label.trim().length > 0
          ? raw.label.trim()
          : undefined;

      if (id.length === 0 || !Number.isFinite(year) || !Number.isFinite(addedAt)) {
        continue;
      }

      if (raw.sourceType === "url") {
        const url = typeof raw.url === "string" ? raw.url.trim() : "";

        if (url.length === 0) {
          continue;
        }

        mapbiomasDatasets.push({
          id,
          sourceType: "url",
          year: Math.trunc(year),
          url,
          label,
          addedAt: Number(addedAt),
        });
        continue;
      }

      // Retrocompatibilidade: datasets antigos sem sourceType eram arquivos.
      const fileName = typeof raw.fileName === "string" ? raw.fileName.trim() : "";

      if (fileName.length === 0) {
        continue;
      }

      mapbiomasDatasets.push({
        id,
        sourceType: "file",
        year: Math.trunc(year),
        fileName,
        label,
        addedAt: Number(addedAt),
      });
    }
  }

  let mapbiomasResults: MapBiomasResults | undefined;
  if (
    baseMapBiomas?.results &&
    Number.isFinite(baseMapBiomas.results.generatedAt) &&
    Array.isArray(baseMapBiomas.results.byYear)
  ) {
    const byYear = baseMapBiomas.results.byYear
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const raw = entry as Partial<MapBiomasYearResult>;

        if (
          !Number.isFinite(raw.year) ||
          !Number.isFinite(raw.naturalPercent) ||
          !Number.isFinite(raw.totalPixels) ||
          !Number.isFinite(raw.naturalPixels)
        ) {
          return null;
        }

        return {
          year: Math.trunc(Number(raw.year)),
          naturalPercent: Number(raw.naturalPercent),
          totalPixels: Math.trunc(Number(raw.totalPixels)),
          naturalPixels: Math.trunc(Number(raw.naturalPixels)),
        };
      })
      .filter((entry): entry is MapBiomasYearResult => entry !== null);

    mapbiomasResults = {
      byYear,
      generatedAt: Number(baseMapBiomas.results.generatedAt),
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
      mapLayers: {
        order: normalizedMapLayerOrder,
        visibility: normalizedMapLayerVisibility,
      },
    },
    occurrences: Array.isArray(maybeProject.occurrences)
      ? maybeProject.occurrences.map((occurrence) => ({
          ...occurrence,
          calcStatus: normalizeCalcStatus(occurrence.calcStatus),
        }))
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
    mapbiomas: {
      config: mapbiomasConfig,
      datasets: mapbiomasDatasets,
      results: mapbiomasResults,
    },
  };
}
