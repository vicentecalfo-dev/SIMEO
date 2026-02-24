"use client";

import { useMemo } from "react";
import L from "leaflet";
import { LayerGroup, Marker, Popup } from "react-leaflet";
import type { Occurrence } from "@/domain/entities/occurrence";
import { validateLatLon } from "@/domain/value-objects/latlon";

type OccurrencesLayerProps = {
  occurrences: Occurrence[];
  visible: boolean;
};

function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

export function OccurrencesLayer({ occurrences, visible }: OccurrencesLayerProps) {
  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "simeo-marker",
        html: '<span style="display:block;width:14px;height:14px;background:#0f62fe;border:2px solid #ffffff;border-radius:9999px;box-shadow:0 0 0 2px rgba(15,98,254,0.25);"></span>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    [],
  );

  const safeOccurrences = useMemo(
    () =>
      occurrences.filter((occurrence) =>
        validateLatLon(occurrence.lat, occurrence.lon).ok,
      ),
    [occurrences],
  );

  if (!visible) {
    return null;
  }

  return (
    <LayerGroup>
      {safeOccurrences.map((occurrence) => (
        <Marker
          key={occurrence.id}
          position={[occurrence.lat, occurrence.lon]}
          icon={markerIcon}
        >
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-slate-900">{occurrence.label ?? "Sem label"}</p>
              <p className="text-slate-700">Lat: {formatCoordinate(occurrence.lat)}</p>
              <p className="text-slate-700">Lon: {formatCoordinate(occurrence.lon)}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </LayerGroup>
  );
}
