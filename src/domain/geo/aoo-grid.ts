import type * as GeoJSON from "geojson";
import {
  lonLatToWebMercatorMeters,
  webMercatorMetersToLonLat,
} from "@/domain/geo/web-mercator";

export type CellKey = string;

export function computeOccupiedCells(
  pointsLonLat: Array<{ lon: number; lat: number }>,
  cellSizeMeters: number,
): Map<CellKey, { cx: number; cy: number }> {
  if (!Number.isFinite(cellSizeMeters) || cellSizeMeters <= 0) {
    throw new Error("cellSizeMeters inválido");
  }

  const occupiedCells = new Map<CellKey, { cx: number; cy: number }>();

  function toCellIndex(valueMeters: number): number {
    const rawIndex = valueMeters / cellSizeMeters;
    const nearestInteger = Math.round(rawIndex);

    // Evita instabilidade de ponto flutuante ao redor de fronteiras.
    if (Math.abs(rawIndex - nearestInteger) < 1e-9) {
      return nearestInteger;
    }

    return Math.floor(rawIndex);
  }

  for (const point of pointsLonLat) {
    const { x, y } = lonLatToWebMercatorMeters(point.lon, point.lat);
    const cx = toCellIndex(x);
    const cy = toCellIndex(y);
    const key = `${cx}|${cy}`;

    if (!occupiedCells.has(key)) {
      occupiedCells.set(key, { cx, cy });
    }
  }

  return occupiedCells;
}

export function cellToPolygonLonLat(
  cx: number,
  cy: number,
  cellSizeMeters: number,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const x0 = cx * cellSizeMeters;
  const y0 = cy * cellSizeMeters;
  const x1 = x0 + cellSizeMeters;
  const y1 = y0 + cellSizeMeters;

  const sw = webMercatorMetersToLonLat(x0, y0);
  const se = webMercatorMetersToLonLat(x1, y0);
  const ne = webMercatorMetersToLonLat(x1, y1);
  const nw = webMercatorMetersToLonLat(x0, y1);

  return {
    type: "Feature",
    properties: {
      cx,
      cy,
      cellSizeMeters,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [sw.lon, sw.lat],
          [se.lon, se.lat],
          [ne.lon, ne.lat],
          [nw.lon, nw.lat],
          [sw.lon, sw.lat],
        ],
      ],
    },
  };
}

export function buildAooGridGeoJson(
  occupiedCellsMap: Map<CellKey, { cx: number; cy: number }>,
  cellSizeMeters: number,
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  const features = [...occupiedCellsMap.values()]
    .sort((left, right) => {
      if (left.cx !== right.cx) {
        return left.cx - right.cx;
      }

      return left.cy - right.cy;
    })
    .map((cell) => cellToPolygonLonLat(cell.cx, cell.cy, cellSizeMeters));

  return {
    type: "FeatureCollection",
    features,
  };
}
