"use client";

import { GeoJSON, Popup } from "react-leaflet";
import type { EooResult } from "@/domain/entities/project";
import { formatKm2 } from "@/domain/usecases/eoo/compute-eoo";
import { MAP_LAYER_PANES } from "@/ui/components/map/MapPanes";

type EooLayerProps = {
  eoo?: EooResult;
  visible?: boolean;
};

function formatComputedAt(value: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

export function EooLayer({ eoo, visible = false }: EooLayerProps) {
  if (!visible || !eoo?.hull) {
    return null;
  }

  return (
    <GeoJSON
      data={eoo.hull}
      pane={MAP_LAYER_PANES.eoo}
      style={() => ({
        color: "#b42318",
        weight: 2,
        fillColor: "#fda29b",
        fillOpacity: 0.2,
      })}
    >
      <Popup>
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-slate-900">EOO: {formatKm2(eoo.areaKm2)} km²</p>
          <p className="text-slate-700">Pontos usados: {eoo.pointsUsed}</p>
          <p className="text-slate-700">Calculado em: {formatComputedAt(eoo.computedAt)}</p>
        </div>
      </Popup>
    </GeoJSON>
  );
}
