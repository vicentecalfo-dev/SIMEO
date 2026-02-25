import {
  DEFAULT_MAP_LAYER_ORDER,
  isMapLayerId,
  type MapLayerId,
} from "@/domain/entities/map-layers";

function asUniqueValidOrder(order: MapLayerId[]): MapLayerId[] {
  const unique: MapLayerId[] = [];

  for (const layer of order) {
    if (!isMapLayerId(layer) || unique.includes(layer)) {
      continue;
    }

    unique.push(layer);
  }

  for (const requiredLayer of DEFAULT_MAP_LAYER_ORDER) {
    if (!unique.includes(requiredLayer)) {
      unique.push(requiredLayer);
    }
  }

  return unique;
}

export function setLayerOrder(order: MapLayerId[]): MapLayerId[] {
  if (!Array.isArray(order)) {
    return [...DEFAULT_MAP_LAYER_ORDER];
  }

  return asUniqueValidOrder(order);
}

export function moveLayer(
  order: MapLayerId[],
  layer: MapLayerId,
  direction: "up" | "down",
): MapLayerId[] {
  const normalized = setLayerOrder(order);
  const index = normalized.indexOf(layer);

  if (index < 0) {
    return normalized;
  }

  if (direction === "up") {
    if (index === 0) {
      return normalized;
    }

    const next = [...normalized];
    const targetIndex = index - 1;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    return next;
  }

  if (index >= normalized.length - 1) {
    return normalized;
  }

  const next = [...normalized];
  const targetIndex = index + 1;
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

export function getZIndexMap(
  order: MapLayerId[],
  base = 400,
): Record<MapLayerId, number> {
  const normalized = setLayerOrder(order);
  const maxOffset = normalized.length - 1;

  return {
    occurrences: base + (maxOffset - normalized.indexOf("occurrences")),
    eoo: base + (maxOffset - normalized.indexOf("eoo")),
    aoo: base + (maxOffset - normalized.indexOf("aoo")),
  };
}
