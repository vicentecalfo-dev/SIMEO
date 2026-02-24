"use client";

import { useCallback } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { Occurrence } from "@/domain/entities/occurrence";
import { computeBounds } from "@/ui/components/map/bounds";

export function useMapFitBounds() {
  return useCallback((map: LeafletMap | null, occurrences: Occurrence[]): boolean => {
    if (!map) {
      return false;
    }

    const bounds = computeBounds(occurrences);

    if (!bounds) {
      return false;
    }

    map.fitBounds([bounds.southWest, bounds.northEast], {
      padding: [28, 28],
      animate: true,
      duration: 0.5,
    });

    return true;
  }, []);
}
