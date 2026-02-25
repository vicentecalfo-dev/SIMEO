export type MapLayerId = "occurrences" | "eoo" | "aoo";

export type MapLayerVisibility = Record<MapLayerId, boolean>;

export type ProjectMapLayers = {
  // Ordem do topo para baixo (primeiro item fica mais acima no mapa).
  order: MapLayerId[];
  visibility?: MapLayerVisibility;
};

export const MAP_LAYER_IDS: MapLayerId[] = ["occurrences", "eoo", "aoo"];

export const DEFAULT_MAP_LAYER_ORDER: MapLayerId[] = ["occurrences", "eoo", "aoo"];

export const DEFAULT_MAP_LAYER_VISIBILITY: MapLayerVisibility = {
  occurrences: true,
  eoo: true,
  aoo: true,
};

export function isMapLayerId(value: unknown): value is MapLayerId {
  return (
    value === "occurrences" ||
    value === "eoo" ||
    value === "aoo"
  );
}

export function normalizeMapLayerVisibility(value: unknown): MapLayerVisibility {
  const partial =
    value && typeof value === "object"
      ? (value as Partial<Record<MapLayerId, boolean>>)
      : {};

  return {
    occurrences:
      partial.occurrences === undefined
        ? DEFAULT_MAP_LAYER_VISIBILITY.occurrences
        : partial.occurrences === true,
    eoo:
      partial.eoo === undefined ? DEFAULT_MAP_LAYER_VISIBILITY.eoo : partial.eoo === true,
    aoo:
      partial.aoo === undefined ? DEFAULT_MAP_LAYER_VISIBILITY.aoo : partial.aoo === true,
  };
}
