import type * as GeoJSON from "geojson";
import type { Project } from "@/domain/entities/project";
import { validateLatLon } from "@/domain/value-objects/latlon";

export type GeoExport = {
  occurrences: GeoJSON.FeatureCollection<GeoJSON.Point>;
  eooHull?: GeoJSON.Feature<GeoJSON.Polygon> | null;
  aooGrid?: GeoJSON.FeatureCollection<GeoJSON.Polygon> | null;
};

export function exportGeoJson(project: Project): GeoExport {
  const occurrenceFeatures: Array<GeoJSON.Feature<GeoJSON.Point>> = project.occurrences
    .filter((occurrence) => validateLatLon(occurrence.lat, occurrence.lon).ok)
    .map((occurrence) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [occurrence.lon, occurrence.lat],
      },
      properties: {
        id: occurrence.id,
        label: occurrence.label ?? null,
        source: occurrence.source ?? null,
      },
    }));

  const exported: GeoExport = {
    occurrences: {
      type: "FeatureCollection",
      features: occurrenceFeatures,
    },
  };

  if (project.results?.eoo?.hull) {
    exported.eooHull = JSON.parse(
      JSON.stringify(project.results.eoo.hull),
    ) as GeoJSON.Feature<GeoJSON.Polygon>;
  }

  if (project.results?.aoo?.grid.features.length) {
    exported.aooGrid = JSON.parse(
      JSON.stringify(project.results.aoo.grid),
    ) as GeoJSON.FeatureCollection<GeoJSON.Polygon>;
  }

  return exported;
}
