import * as turf from "@turf/turf";
import type { Feature, Point, Polygon } from "geojson";
import type { Occurrence } from "@/domain/entities/occurrence";
import { hashOccurrencesForEOO } from "@/domain/usecases/hash/hash-occurrences-for-eoo";
import { selectOccurrencesForCompute } from "@/domain/usecases/occurrences/select-occurrences-for-compute";

export type ComputeEooParams = {
  occurrences: Occurrence[];
};

export type ComputeEooResult = {
  areaKm2: number;
  hull: Feature<Polygon> | null;
  pointsUsed: number;
  inputHash: string;
  computedAt: number;
};

type ValidOccurrencePoint = {
  lat: number;
  lon: number;
};

function toValidOccurrencePoints(occurrences: Occurrence[]): ValidOccurrencePoint[] {
  return occurrences.map((occurrence) => ({
    lat: occurrence.lat,
    lon: occurrence.lon,
  }));
}

export function formatKm2(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
    notation: "standard",
  }).format(safeValue);
}

export function computeEOO({ occurrences }: ComputeEooParams): ComputeEooResult {
  const computeOccurrences = selectOccurrencesForCompute(occurrences);
  const validPoints = toValidOccurrencePoints(computeOccurrences);
  const computedAt = Date.now();
  const inputHash = hashOccurrencesForEOO(computeOccurrences);

  if (validPoints.length < 3) {
    return {
      areaKm2: 0,
      hull: null,
      pointsUsed: validPoints.length,
      inputHash,
      computedAt,
    };
  }

  const pointFeatures: Feature<Point>[] = validPoints.map((point) =>
    turf.point([point.lon, point.lat]),
  );
  const featureCollection = turf.featureCollection(pointFeatures);
  const maybeHull = turf.convex(featureCollection);
  const hull = maybeHull && maybeHull.geometry.type === "Polygon" ? maybeHull : null;

  if (!hull) {
    return {
      areaKm2: 0,
      hull: null,
      pointsUsed: validPoints.length,
      inputHash,
      computedAt,
    };
  }

  const areaKm2 = turf.area(hull) / 1_000_000;

  return {
    areaKm2: Number.isFinite(areaKm2) ? areaKm2 : 0,
    hull,
    pointsUsed: validPoints.length,
    inputHash,
    computedAt,
  };
}
