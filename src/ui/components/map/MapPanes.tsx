"use client";

import { useEffect } from "react";
import type { Map as LeafletMap } from "leaflet";
import { useMap } from "react-leaflet";
import type { MapLayerId } from "@/domain/entities/map-layers";
import { getZIndexMap, setLayerOrder } from "@/lib/layer-order";

export const MAP_LAYER_PANES: Record<MapLayerId, string> = {
  occurrences: "pane-occurrences",
  eoo: "pane-eoo",
  aoo: "pane-aoo",
};

type MapPanesProps = {
  order: MapLayerId[];
};

function ensurePane(map: LeafletMap, paneName: string): void {
  if (!map.getPane(paneName)) {
    map.createPane(paneName);
  }
}

export function MapPanes({ order }: MapPanesProps) {
  const map = useMap();

  useEffect(() => {
    ensurePane(map, MAP_LAYER_PANES.occurrences);
    ensurePane(map, MAP_LAYER_PANES.eoo);
    ensurePane(map, MAP_LAYER_PANES.aoo);

    const zMap = getZIndexMap(setLayerOrder(order));

    const occurrencesPane = map.getPane(MAP_LAYER_PANES.occurrences);
    const eooPane = map.getPane(MAP_LAYER_PANES.eoo);
    const aooPane = map.getPane(MAP_LAYER_PANES.aoo);

    if (occurrencesPane) {
      occurrencesPane.style.zIndex = String(zMap.occurrences);
    }

    if (eooPane) {
      eooPane.style.zIndex = String(zMap.eoo);
    }

    if (aooPane) {
      aooPane.style.zIndex = String(zMap.aoo);
    }
  }, [map, order]);

  return null;
}
