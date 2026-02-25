import type * as GeoJSON from "geojson";
import type { Occurrence } from "@/domain/entities/occurrence";
import {
  buildAooGridGeoJson,
  computeOccupiedCells,
} from "@/domain/geo/aoo-grid";
import { hashOccurrencesForAOO } from "@/domain/usecases/hash/hash-occurrences-for-aoo";
import { selectOccurrencesForCompute } from "@/domain/usecases/occurrences/select-occurrences-for-compute";

export type ComputeAooParams = {
  occurrences: Occurrence[];
  cellSizeMeters: number;
};

export type ComputeAooResult = {
  areaKm2: number;
  cellCount: number;
  cellSizeMeters: number;
  grid: GeoJSON.FeatureCollection<GeoJSON.Polygon>;
  computedAt: number;
  inputHash: string;
  pointsUsed: number;
};

function emptyGrid(): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return {
    type: "FeatureCollection",
    features: [],
  };
}

export function computeAOO({
  occurrences,
  cellSizeMeters,
}: ComputeAooParams): ComputeAooResult {
  if (!Number.isFinite(cellSizeMeters) || cellSizeMeters <= 0) {
    throw new Error("cellSizeMeters inválido");
  }

  const computeOccurrences = selectOccurrencesForCompute(occurrences);
  const pointsUsed = computeOccurrences.length;
  const computedAt = Date.now();
  const inputHash = hashOccurrencesForAOO(computeOccurrences, cellSizeMeters);

  if (pointsUsed === 0) {
    return {
      areaKm2: 0,
      cellCount: 0,
      cellSizeMeters,
      grid: emptyGrid(),
      computedAt,
      inputHash,
      pointsUsed,
    };
  }

  const occupiedCells = computeOccupiedCells(
    computeOccurrences.map((occurrence) => ({
      lon: occurrence.lon,
      lat: occurrence.lat,
    })),
    cellSizeMeters,
  );

  const cellCount = occupiedCells.size;
  const areaKm2 = (cellCount * cellSizeMeters * cellSizeMeters) / 1_000_000;

  return {
    areaKm2,
    cellCount,
    cellSizeMeters,
    grid: buildAooGridGeoJson(occupiedCells, cellSizeMeters),
    computedAt,
    inputHash,
    pointsUsed,
  };
}
