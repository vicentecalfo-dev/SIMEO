"use client";

import { LayerGroup, CircleMarker, Popup } from "react-leaflet";
import type { Occurrence } from "@/domain/entities/occurrence";
import {
  normalizeCalcStatus,
  type OccurrenceCalcStatus,
} from "@/domain/entities/occurrence";
import { validateLatLon } from "@/domain/value-objects/latlon";

type OccurrencesLayerProps = {
  occurrences: Occurrence[];
  visible: boolean;
  onToggleOccurrenceCalc: (id: string) => void;
  onDeleteOccurrence: (id: string) => void;
};

function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

function markerColorByStatus(status: OccurrenceCalcStatus): string {
  return status === "disabled" ? "#f59e0b" : "#2563eb";
}

export function OccurrencesLayer({
  occurrences,
  visible,
  onToggleOccurrenceCalc,
  onDeleteOccurrence,
}: OccurrencesLayerProps) {
  if (!visible) {
    return null;
  }

  const safeOccurrences = occurrences.filter((occurrence) =>
    validateLatLon(occurrence.lat, occurrence.lon).ok,
  );

  return (
    <LayerGroup>
      {safeOccurrences.map((occurrence) => {
        const status = normalizeCalcStatus(occurrence.calcStatus);
        const markerColor = markerColorByStatus(status);

        return (
          <CircleMarker
            key={occurrence.id}
            center={[occurrence.lat, occurrence.lon]}
            radius={7}
            pathOptions={{
              color: markerColor,
              fillColor: markerColor,
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-slate-900">{occurrence.label ?? "Sem rótulo"}</p>
                <p className="text-slate-700">Lat: {formatCoordinate(occurrence.lat)}</p>
                <p className="text-slate-700">Lon: {formatCoordinate(occurrence.lon)}</p>
                <p className="text-slate-700">
                  Status cálculo: {status === "enabled" ? "Habilitado" : "Desabilitado"}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => onToggleOccurrenceCalc(occurrence.id)}
                  >
                    {status === "enabled"
                      ? "Desabilitar para cálculo"
                      : "Habilitar para cálculo"}
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-left text-xs font-medium text-red-700 hover:bg-red-100"
                    onClick={() => onDeleteOccurrence(occurrence.id)}
                  >
                    Excluir ponto
                  </button>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </LayerGroup>
  );
}
